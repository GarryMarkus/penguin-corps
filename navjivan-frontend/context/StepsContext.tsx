import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface StepsContextType {
    currentSteps: number;
    distanceTraveled: number;
    caloriesBurnt: number;
    isTracking: boolean;
}

const StepsContext = createContext<StepsContextType | undefined>(undefined);

const STORAGE_KEY_STEPS = '@padyatra_steps';
const STORAGE_KEY_DATE = '@padyatra_date';
const METERS_PER_STEP = 0.762;
const CALORIES_PER_STEP = 0.04;

export const StepsProvider = ({ children }: { children: ReactNode }) => {
    const [currentSteps, setCurrentSteps] = useState(0);
    const [isTracking, setIsTracking] = useState(false);


    const [initialStepCount, setInitialStepCount] = useState(0);
    const [pastSteps, setPastSteps] = useState(0);

    const subscription = useRef<Pedometer.Subscription | null>(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {


        }
        appState.current = nextAppState;
    };

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

        initializePedometer();

        return () => {
            isMounted = false;
            if (subscription.current) {
                subscription.current.remove();
            }
        };
    }, []);


    const distanceTraveled = currentSteps * METERS_PER_STEP;
    const caloriesBurnt = Math.round(currentSteps * CALORIES_PER_STEP);

    return (
        <StepsContext.Provider
            value={{
                currentSteps,
                distanceTraveled,
                caloriesBurnt,
                isTracking,
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
