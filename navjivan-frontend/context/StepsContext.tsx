import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { isHealthSyncAvailable, syncHealthData } from '../services/healthSync';

interface StepsContextType {
    currentSteps: number;
    distanceTraveled: number;
    caloriesBurnt: number;
    isTracking: boolean;
    dataSource: string;
    lastSynced: Date | null;
    syncFromHealthApps: () => Promise<void>;
    isHealthSyncEnabled: boolean;
    toggleHealthSync: () => void;
}

const StepsContext = createContext<StepsContextType | undefined>(undefined);

const STORAGE_KEY_STEPS = '@padyatra_steps';
const STORAGE_KEY_DATE = '@padyatra_date';
const STORAGE_KEY_HEALTH_SYNC = '@health_sync_enabled';
const STORAGE_KEY_HEALTH_DATA = '@health_sync_data';
const METERS_PER_STEP = 0.762;
const CALORIES_PER_STEP = 0.04;

export const StepsProvider = ({ children }: { children: ReactNode }) => {
    const [currentSteps, setCurrentSteps] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [dataSource, setDataSource] = useState('Device Pedometer');
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [isHealthSyncEnabled, setIsHealthSyncEnabled] = useState(false);
    const [healthCalories, setHealthCalories] = useState(0);
    const [healthDistance, setHealthDistance] = useState(0);

    const [initialStepCount, setInitialStepCount] = useState(0);
    const [pastSteps, setPastSteps] = useState(0);

    const subscription = useRef<Pedometer.Subscription | null>(null);
    const appState = useRef(AppState.currentState);
    const syncInterval = useRef<NodeJS.Timeout | null>(null);

    // Load health sync preference
    useEffect(() => {
        (async () => {
            const enabled = await AsyncStorage.getItem(STORAGE_KEY_HEALTH_SYNC);
            if (enabled === 'true') {
                setIsHealthSyncEnabled(true);
            }
        })();
    }, []);

    // Toggle health sync
    const toggleHealthSync = async () => {
        const newValue = !isHealthSyncEnabled;
        setIsHealthSyncEnabled(newValue);
        await AsyncStorage.setItem(STORAGE_KEY_HEALTH_SYNC, newValue.toString());
        
        if (newValue) {
            // Immediately sync when enabled
            await syncFromHealthApps();
        }
    };

    // Ref to track current steps without causing re-renders
    const currentStepsRef = useRef(currentSteps);
    useEffect(() => {
        currentStepsRef.current = currentSteps;
    }, [currentSteps]);

    // Sync from health apps (Google Fit, Samsung Health, Apple Health, etc.)
    // Using ref to avoid circular dependency
    const syncFromHealthApps = useCallback(async () => {
        try {
            console.log('[StepsContext] Syncing from health apps...');
            const result = await syncHealthData();
            
            if (result && result.steps > 0) {
                console.log('[StepsContext] Health sync result:', result);
                
                // Use health data if it's higher than pedometer (more accurate)
                if (result.steps > currentStepsRef.current) {
                    setCurrentSteps(result.steps);
                    await AsyncStorage.setItem(STORAGE_KEY_STEPS, result.steps.toString());
                }
                
                // Store health-specific data
                setHealthCalories(result.calories);
                setHealthDistance(result.distance);
                setDataSource(result.source);
                setLastSynced(result.lastSynced);
                
                // Cache health data
                await AsyncStorage.setItem(STORAGE_KEY_HEALTH_DATA, JSON.stringify({
                    steps: result.steps,
                    calories: result.calories,
                    distance: result.distance,
                    source: result.source,
                    date: new Date().toDateString(),
                }));
            }
        } catch (error) {
            console.log('[StepsContext] Health sync error (non-blocking):', error);
        }
    }, []); // No dependencies - uses ref for current steps

    // Ref to track health sync enabled state for callbacks
    const isHealthSyncEnabledRef = useRef(isHealthSyncEnabled);
    useEffect(() => {
        isHealthSyncEnabledRef.current = isHealthSyncEnabled;
    }, [isHealthSyncEnabled]);

    const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // Sync health data when app comes to foreground
            if (isHealthSyncEnabledRef.current) {
                syncFromHealthApps();
            }
        }
        appState.current = nextAppState;
    }, [syncFromHealthApps]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [handleAppStateChange]);

    useEffect(() => {
        let isMounted = true;

        const initializePedometer = async () => {
            try {

                const isAvailable = await Pedometer.isAvailableAsync();
                if (!isAvailable) {
                    console.log('[StepsContext] Pedometer not available on this device');
                    setIsTracking(false);
                    return;
                }

                console.log('[StepsContext] Pedometer is available');


                const perm = await Pedometer.requestPermissionsAsync();
                if (!perm.granted) {
                    console.log('[StepsContext] Pedometer permission denied');
                    setIsTracking(false);
                    return;
                }

                setIsTracking(true);


                const today = new Date().toDateString();
                const savedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);
                const savedSteps = await AsyncStorage.getItem(STORAGE_KEY_STEPS);

                let loadedSteps = 0;

                if (savedDate === today && savedSteps) {
                    loadedSteps = parseInt(savedSteps);
                    console.log('[StepsContext] Loaded from storage:', loadedSteps);
                    setPastSteps(loadedSteps);
                    setCurrentSteps(loadedSteps);
                } else {
                    console.log('[StepsContext] New day - resetting');
                    await AsyncStorage.setItem(STORAGE_KEY_STEPS, '0');
                    await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
                }

                if (!isMounted) return;



                subscription.current = Pedometer.watchStepCount(result => {

                    const total = loadedSteps + result.steps;
                    setCurrentSteps(total);


                    AsyncStorage.setItem(STORAGE_KEY_STEPS, total.toString());
                });

            } catch (error) {
                console.log('[StepsContext] Error initializing pedometer:', error);
                setIsTracking(false);
            }
        };

        // Check for cached health data
        const loadCachedHealthData = async () => {
            const cached = await AsyncStorage.getItem(STORAGE_KEY_HEALTH_DATA);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.date === new Date().toDateString()) {
                    setHealthCalories(data.calories);
                    setHealthDistance(data.distance);
                    if (data.source) setDataSource(data.source);
                }
            }
        };

        initializePedometer();
        loadCachedHealthData();

        // Initial health sync if enabled - delayed to not block app startup
        setTimeout(() => {
            if (isHealthSyncEnabledRef.current) {
                syncFromHealthApps();
            }
        }, 2000); // Delay health sync to prevent blocking

        // Set up periodic sync (every 5 minutes) - uses ref to check current state
        syncInterval.current = setInterval(() => {
            if (isHealthSyncEnabledRef.current) {
                syncFromHealthApps();
            }
        }, 5 * 60 * 1000);

        return () => {
            isMounted = false;
            if (subscription.current) {
                subscription.current.remove();
            }
            if (syncInterval.current) {
                clearInterval(syncInterval.current);
            }
        };
    }, [syncFromHealthApps]); // Removed isHealthSyncEnabled - using ref instead


    // Use health data if available, otherwise calculate from steps
    const distanceTraveled = healthDistance > 0 ? healthDistance : currentSteps * METERS_PER_STEP;
    const caloriesBurnt = healthCalories > 0 ? healthCalories : Math.round(currentSteps * CALORIES_PER_STEP);

    return (
        <StepsContext.Provider
            value={{
                currentSteps,
                distanceTraveled,
                caloriesBurnt,
                isTracking,
                dataSource,
                lastSynced,
                syncFromHealthApps,
                isHealthSyncEnabled,
                toggleHealthSync,
            }}
        >
            {children}
        </StepsContext.Provider>
    );
};

export const useSteps = () => {
    const context = useContext(StepsContext);
    if (!context) {
        throw new Error('useSteps must be used within StepsProvider');
    }
    return context;
};
