import { useState, useEffect, useCallback } from 'react';
import {
    GeofenceZone,
    getGeofenceZones,
    addGeofenceZone,
    removeGeofenceZone,
    startGeofencing,
    stopGeofencing,
    isGeofencingActive,
    requestPermissions,
    getCurrentLocation,
} from '../services/geofencing';
import * as Location from 'expo-location';


export function useGeofencing() {
    const [zones, setZones] = useState<GeofenceZone[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        try {
            setLoading(true);


            const permissions = await requestPermissions();
            setHasPermissions(permissions);

            if (!permissions) {
                setLoading(false);
                return;
            }


            const location = await getCurrentLocation();
            setCurrentLocation(location);


            const savedZones = await getGeofenceZones();
            setZones(savedZones);


            const active = await isGeofencingActive();
            setIsActive(active);


            if (savedZones.length > 0 && !active) {
                await startGeofencing();
                setIsActive(true);
            }
        } catch (error) {
            console.error('Error initializing geofencing:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshZones = useCallback(async () => {
        try {
            const savedZones = await getGeofenceZones();
            setZones(savedZones);
        } catch (error) {
            console.error('Error refreshing zones:', error);
        }
    }, []);

    const addZone = useCallback(async (zone: GeofenceZone) => {
        try {
            await addGeofenceZone(zone);
            await refreshZones();


            if (!isActive) {
                await startGeofencing();
                setIsActive(true);
            }
        } catch (error) {
            console.error('Error adding zone:', error);
            throw error;
        }
    }, [isActive, refreshZones]);

    const removeZone = useCallback(async (zoneId: string) => {
        try {
            await removeGeofenceZone(zoneId);
            await refreshZones();
        } catch (error) {
            console.error('Error removing zone:', error);
            throw error;
        }
    }, [refreshZones]);

    const toggleGeofencing = useCallback(async () => {
        try {
            if (isActive) {
                await stopGeofencing();
                setIsActive(false);
            } else {
                if (zones.length === 0) {
                    throw new Error('No zones available');
                }
                await startGeofencing();
                setIsActive(true);
            }
        } catch (error) {
            console.error('Error toggling geofencing:', error);
            throw error;
        }
    }, [isActive, zones.length]);

    const refreshLocation = useCallback(async () => {
        try {
            const location = await getCurrentLocation();
            setCurrentLocation(location);
            return location;
        } catch (error) {
            console.error('Error refreshing location:', error);
            return null;
        }
    }, []);

    const checkPermissions = useCallback(async () => {
        try {
            const permissions = await requestPermissions();
            setHasPermissions(permissions);
            return permissions;
        } catch (error) {
            console.error('Error checking permissions:', error);
            return false;
        }
    }, []);

    return {

        zones,
        isActive,
        currentLocation,
        hasPermissions,
        loading,


        addZone,
        removeZone,
        toggleGeofencing,
        refreshZones,
        refreshLocation,
        checkPermissions,
        initialize,
    };
}
