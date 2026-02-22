/**
 * Health Sync Service
 * Syncs steps and fitness data from:
 * - Google Fit (via Health Connect on Android)
 * - Samsung Health (via Health Connect on Android)
 * - Apple Health (HealthKit on iOS)
 * - Fitbit, Garmin, other wearables (via Health Connect)
 * 
 * NOTE: All health sync operations are optional and non-blocking.
 * If health packages aren't installed, the app continues with pedometer only.
 */

import { Platform } from 'react-native';

// Health Connect types for Android
type HealthConnectRecord = {
  startTime: string;
  endTime: string;
  count?: number;
  energy?: { inKilocalories: number };
  distance?: { inMeters: number };
};

export interface HealthSyncResult {
  steps: number;
  calories: number;
  distance: number; // in meters
  source: string;
  lastSynced: Date;
}

// Flag to track if health packages are available
let healthConnectAvailable: boolean | null = null;
let healthKitAvailable: boolean | null = null;

// Initialize Health Connect for Android (with timeout)
export const initializeHealthConnect = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  if (healthConnectAvailable === false) return false;
  
  try {
    // Add timeout to prevent blocking
    const timeoutPromise = new Promise<boolean>((_, reject) => 
      setTimeout(() => reject(new Error('Health Connect init timeout')), 3000)
    );
    
    const initPromise = (async () => {
      const { initialize, getSdkStatus, SdkAvailabilityStatus } = await import('react-native-health-connect');
      
      const isInitialized = await initialize();
      if (!isInitialized) {
        console.log('[HealthSync] Health Connect failed to initialize');
        return false;
      }
      
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        console.log('[HealthSync] Health Connect SDK available');
        return true;
      } else if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        console.log('[HealthSync] Health Connect needs update');
        return false;
      }
      
      return false;
    })();
    
    const result = await Promise.race([initPromise, timeoutPromise]);
    healthConnectAvailable = result;
    return result;
  } catch (error) {
    console.log('[HealthSync] Health Connect init error (non-blocking):', error);
    healthConnectAvailable = false;
    return false;
  }
};

// Request Health Connect permissions (Android)
export const requestHealthConnectPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  
  try {
    const { requestPermission } = await import('react-native-health-connect');
    
    const permissions = [
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    ];
    
    const granted = await requestPermission(permissions as any);
    console.log('[HealthSync] Permissions granted:', granted);
    return granted.length > 0;
  } catch (error) {
    console.log('[HealthSync] Permission request error:', error);
    return false;
  }
};

// Get today's steps from Health Connect (Android)
export const getHealthConnectSteps = async (): Promise<HealthSyncResult | null> => {
  if (Platform.OS !== 'android') return null;
  
  try {
    const { readRecords } = await import('react-native-health-connect');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    
    // Read steps
    const stepsResult = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: today.toISOString(),
        endTime: now.toISOString(),
      },
    });
    
    let totalSteps = 0;
    (stepsResult.records as HealthConnectRecord[]).forEach((record) => {
      totalSteps += record.count || 0;
    });
    
    // Read calories
    let totalCalories = 0;
    try {
      const caloriesResult = await readRecords('TotalCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime: today.toISOString(),
          endTime: now.toISOString(),
        },
      });
      (caloriesResult.records as HealthConnectRecord[]).forEach((record) => {
        totalCalories += record.energy?.inKilocalories || 0;
      });
    } catch (e) {
      console.log('[HealthSync] Calories read error:', e);
    }
    
    // Read distance
    let totalDistance = 0;
    try {
      const distanceResult = await readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: today.toISOString(),
          endTime: now.toISOString(),
        },
      });
      (distanceResult.records as HealthConnectRecord[]).forEach((record) => {
        totalDistance += record.distance?.inMeters || 0;
      });
    } catch (e) {
      console.log('[HealthSync] Distance read error:', e);
    }
    
    console.log('[HealthSync] Health Connect data:', { totalSteps, totalCalories, totalDistance });
    
    return {
      steps: totalSteps,
      calories: Math.round(totalCalories),
      distance: totalDistance,
      source: 'Health Connect',
      lastSynced: new Date(),
    };
  } catch (error) {
    console.log('[HealthSync] Read error:', error);
    return null;
  }
};

// Initialize Apple HealthKit (iOS)
export const initializeHealthKit = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  
  try {
    const AppleHealthKit = (await import('react-native-health')).default;
    
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.FlightsClimbed,
        ],
        write: [],
      },
    };
    
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.log('[HealthSync] HealthKit init error:', error);
          resolve(false);
        } else {
          console.log('[HealthSync] HealthKit initialized');
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.log('[HealthSync] HealthKit import error:', error);
    return false;
  }
};

// Get today's steps from Apple HealthKit (iOS)
export const getHealthKitSteps = async (): Promise<HealthSyncResult | null> => {
  if (Platform.OS !== 'ios') return null;
  
  try {
    const AppleHealthKit = (await import('react-native-health')).default;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const options = {
      startDate: today.toISOString(),
      endDate: new Date().toISOString(),
    };
    
    return new Promise((resolve) => {
      // Get steps
      AppleHealthKit.getStepCount(options, (err: any, results: any) => {
        if (err) {
          console.log('[HealthSync] HealthKit steps error:', err);
          resolve(null);
          return;
        }
        
        const steps = results?.value || 0;
        
        // Get distance
        AppleHealthKit.getDistanceWalkingRunning(options, (distErr: any, distResults: any) => {
          const distance = distResults?.value || 0;
          
          // Get calories
          AppleHealthKit.getActiveEnergyBurned(options, (calErr: any, calResults: any) => {
            let calories = 0;
            if (Array.isArray(calResults)) {
              calResults.forEach((r: any) => {
                calories += r.value || 0;
              });
            }
            
            console.log('[HealthSync] HealthKit data:', { steps, distance, calories });
            
            resolve({
              steps: Math.round(steps),
              calories: Math.round(calories),
              distance: distance * 1000, // convert km to meters
              source: 'Apple Health',
              lastSynced: new Date(),
            });
          });
        });
      });
    });
  } catch (error) {
    console.log('[HealthSync] HealthKit read error:', error);
    return null;
  }
};

// Main sync function - cross platform
export const syncHealthData = async (): Promise<HealthSyncResult | null> => {
  if (Platform.OS === 'android') {
    const initialized = await initializeHealthConnect();
    if (initialized) {
      const hasPermission = await requestHealthConnectPermissions();
      if (hasPermission) {
        return await getHealthConnectSteps();
      }
    }
  } else if (Platform.OS === 'ios') {
    const initialized = await initializeHealthKit();
    if (initialized) {
      return await getHealthKitSteps();
    }
  }
  
  return null;
};

// Check if health sync is available
export const isHealthSyncAvailable = async (): Promise<{ available: boolean; source: string }> => {
  if (Platform.OS === 'android') {
    try {
      const { getSdkStatus, SdkAvailabilityStatus, initialize } = await import('react-native-health-connect');
      await initialize();
      const status = await getSdkStatus();
      return {
        available: status === SdkAvailabilityStatus.SDK_AVAILABLE,
        source: 'Health Connect (Google Fit, Samsung Health, Fitbit)',
      };
    } catch {
      return { available: false, source: 'Health Connect' };
    }
  } else if (Platform.OS === 'ios') {
    try {
      const AppleHealthKit = (await import('react-native-health')).default;
      const available = await new Promise<boolean>((resolve) => {
        AppleHealthKit.isAvailable((err: any, available: boolean) => {
          resolve(!err && available);
        });
      });
      return { available, source: 'Apple Health' };
    } catch {
      return { available: false, source: 'Apple Health' };
    }
  }
  
  return { available: false, source: 'None' };
};
