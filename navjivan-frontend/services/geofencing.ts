import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

const GEOFENCING_TASK = "GEOFENCING_TASK";

const GEOFENCE_ZONES_KEY = "@geofence_zones";

export interface GeofenceZone {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
  type: "trigger" | "safe";
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Geofencing task error:", error);
    return;
  }

  if (data) {
    const { eventType, region } = data as any;
    const zones = await getGeofenceZones();
    const zone = zones.find((z) => z.id === region.identifier);

    if (!zone) return;

    if (
      eventType === Location.GeofencingEventType.Enter &&
      zone.notifyOnEnter
    ) {
      await sendGeofenceNotification(zone, "enter");
    } else if (
      eventType === Location.GeofencingEventType.Exit &&
      zone.notifyOnExit
    ) {
      await sendGeofenceNotification(zone, "exit");
    }
  }
});

export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      console.log("Foreground location permission denied");
      return false;
    }

    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== "granted") {
      console.log("Background location permission denied");
      return false;
    }

    const { status: notificationStatus } =
      await Notifications.requestPermissionsAsync();
    if (notificationStatus !== "granted") {
      console.log("Notification permission denied");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error requesting permissions:", error);
    return false;
  }
}

export async function getGeofenceZones(): Promise<GeofenceZone[]> {
  try {
    const zonesJson = await AsyncStorage.getItem(GEOFENCE_ZONES_KEY);
    return zonesJson ? JSON.parse(zonesJson) : [];
  } catch (error) {
    console.error("Error getting geofence zones:", error);
    return [];
  }
}

export async function saveGeofenceZones(zones: GeofenceZone[]): Promise<void> {
  try {
    await AsyncStorage.setItem(GEOFENCE_ZONES_KEY, JSON.stringify(zones));
  } catch (error) {
    console.error("Error saving geofence zones:", error);
  }
}

export async function addGeofenceZone(zone: GeofenceZone): Promise<void> {
  try {
    const zones = await getGeofenceZones();
    zones.push(zone);
    await saveGeofenceZones(zones);
    await startGeofencing();
  } catch (error) {
    console.error("Error adding geofence zone:", error);
    throw error;
  }
}

export async function removeGeofenceZone(zoneId: string): Promise<void> {
  try {
    const zones = await getGeofenceZones();
    const filteredZones = zones.filter((z) => z.id !== zoneId);
    await saveGeofenceZones(filteredZones);
    await startGeofencing();
  } catch (error) {
    console.error("Error removing geofence zone:", error);
    throw error;
  }
}

export async function startGeofencing(): Promise<void> {
  try {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
    if (isRegistered) {
      console.log("Stopping existing geofencing task...");
      try {
        await Location.stopGeofencingAsync(GEOFENCING_TASK);
      } catch (stopError) {
        console.log(
          "Note: Could not stop previous geofencing (may not have been active)",
        );
      }
    }

    const zones = await getGeofenceZones();
    if (zones.length === 0) {
      console.log("No geofence zones to monitor");
      return;
    }

    const regions = zones.map((zone) => ({
      identifier: zone.id,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
      notifyOnEnter: zone.notifyOnEnter,
      notifyOnExit: zone.notifyOnExit,
    }));

    console.log(
      "Starting geofencing with regions:",
      regions.map((r) => ({
        id: r.identifier,
        lat: r.latitude,
        lng: r.longitude,
        radius: r.radius,
      })),
    );

    await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
    console.log("Geofencing started successfully for", regions.length, "zones");
  } catch (error) {
    console.error("Error starting geofencing:", error);
    throw error;
  }
}

export async function stopGeofencing(): Promise<void> {
  try {
    const isTaskDefined = await TaskManager.isTaskDefined(GEOFENCING_TASK);
    if (isTaskDefined) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      console.log("Geofencing stopped");
    }
  } catch (error) {
    console.error("Error stopping geofencing:", error);
  }
}

async function sendGeofenceNotification(
  zone: GeofenceZone,
  eventType: "enter" | "exit",
): Promise<void> {
  try {
    let title = "";
    let body = "";

    if (zone.type === "trigger") {
      if (eventType === "enter") {
        title = "Trigger Zone Alert";
        body = `You're entering "${zone.name}". Stay strong! Remember your goals.`;
      } else {
        title = "Left Trigger Zone";
        body = `You've left "${zone.name}". Great job avoiding temptation!`;
      }
    } else {
      if (eventType === "enter") {
        title = "Safe Zone";
        body = `Welcome to "${zone.name}" - a smoke-free zone. You've got this!`;
      } else {
        title = "Leaving Safe Zone";
        body = `You're leaving "${zone.name}". Stay committed to your goals!`;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error("Error getting current location:", error);
    return null;
  }
}

export async function isGeofencingActive(): Promise<boolean> {
  try {
    const isTaskDefined = await TaskManager.isTaskDefined(GEOFENCING_TASK);
    if (!isTaskDefined) return false;

    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
    return isRegistered;
  } catch (error) {
    console.error("Error checking geofencing status:", error);
    return false;
  }
}

const IDLE_DETECTION_TASK = "IDLE_DETECTION_TASK";

const IDLE_DETECTION_ENABLED_KEY = "@idle_detection_enabled";
const LAST_LOCATION_KEY = "@last_location";
const LAST_LOCATION_TIME_KEY = "@last_location_time";

const IDLE_THRESHOLD_MS = 30 * 1000;

const DAYTIME_START_HOUR = 6;
const DAYTIME_END_HOUR = 22;

const SAME_LOCATION_THRESHOLD_METERS = 50;

function isDaytime(): boolean {
  const now = new Date();
  const hours = now.getHours();
  return hours >= DAYTIME_START_HOUR && hours < DAYTIME_END_HOUR;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

TaskManager.defineTask(IDLE_DETECTION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Idle detection task error:", error);
    return;
  }

  if (!isDaytime()) {
    console.log("Idle detection skipped - not daytime");
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations || locations.length === 0) return;

    const currentLocation = locations[0];
    const currentTime = Date.now();

    try {
      const lastLocationStr = await AsyncStorage.getItem(LAST_LOCATION_KEY);
      const lastTimeStr = await AsyncStorage.getItem(LAST_LOCATION_TIME_KEY);

      if (lastLocationStr && lastTimeStr) {
        const lastLocation = JSON.parse(lastLocationStr);
        const lastTime = parseInt(lastTimeStr, 10);

        const distance = calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
        );

        if (distance < SAME_LOCATION_THRESHOLD_METERS) {
          const idleTime = currentTime - lastTime;

          if (idleTime >= IDLE_THRESHOLD_MS) {
            await sendIdleNotification(idleTime);

            await AsyncStorage.setItem(
              LAST_LOCATION_TIME_KEY,
              currentTime.toString(),
            );
          }
        } else {
          await AsyncStorage.setItem(
            LAST_LOCATION_KEY,
            JSON.stringify({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }),
          );
          await AsyncStorage.setItem(
            LAST_LOCATION_TIME_KEY,
            currentTime.toString(),
          );
        }
      } else {
        await AsyncStorage.setItem(
          LAST_LOCATION_KEY,
          JSON.stringify({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }),
        );
        await AsyncStorage.setItem(
          LAST_LOCATION_TIME_KEY,
          currentTime.toString(),
        );
      }
    } catch (err) {
      console.error("Error in idle detection:", err);
    }
  }
});

async function sendIdleNotification(idleTimeMs: number): Promise<void> {
  try {
    const minutes = Math.floor(idleTimeMs / 60000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Move!",
        body: `You've been stationary for ${minutes}+ minutes. Get up and stretch, take a short walk, or do some quick exercises!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });

    console.log("Idle notification sent");
  } catch (error) {
    console.error("Error sending idle notification:", error);
  }
}

export async function startIdleDetection(): Promise<void> {
  try {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(IDLE_DETECTION_TASK);
    if (isRegistered) {
      console.log("Idle detection already running");
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.log("Missing permissions for idle detection");
      return;
    }

    const currentLocation = await getCurrentLocation();
    if (currentLocation) {
      await AsyncStorage.setItem(
        LAST_LOCATION_KEY,
        JSON.stringify({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }),
      );
      await AsyncStorage.setItem(LAST_LOCATION_TIME_KEY, Date.now().toString());
    }

    await Location.startLocationUpdatesAsync(IDLE_DETECTION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,
      distanceInterval: 10,
      foregroundService: {
        notificationTitle: "Activity Monitor",
        notificationBody: "Monitoring your activity to keep you moving",
        notificationColor: "#39FF14",
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Other,
    });

    await AsyncStorage.setItem(IDLE_DETECTION_ENABLED_KEY, "true");
    console.log("Idle detection started");
  } catch (error) {
    console.error("Error starting idle detection:", error);
    throw error;
  }
}

export async function stopIdleDetection(): Promise<void> {
  try {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(IDLE_DETECTION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(IDLE_DETECTION_TASK);
    }

    await AsyncStorage.setItem(IDLE_DETECTION_ENABLED_KEY, "false");
    await AsyncStorage.removeItem(LAST_LOCATION_KEY);
    await AsyncStorage.removeItem(LAST_LOCATION_TIME_KEY);

    console.log("Idle detection stopped");
  } catch (error) {
    console.error("Error stopping idle detection:", error);
  }
}

export async function isIdleDetectionEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(IDLE_DETECTION_ENABLED_KEY);
    return enabled === "true";
  } catch (error) {
    console.error("Error checking idle detection status:", error);
    return false;
  }
}

export async function isIdleDetectionActive(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(IDLE_DETECTION_TASK);
  } catch (error) {
    console.error("Error checking idle detection active status:", error);
    return false;
  }
}
