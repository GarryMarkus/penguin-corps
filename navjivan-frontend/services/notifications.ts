import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import API from './api';

export const registerForPushNotificationsAsync = async () => {
    let token;

    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
        console.log('[Push] Running in Expo Go - skipping push notification setup');
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications');

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token
        try {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            token = tokenData.data;
            console.log('[Push] Token:', token);

            // Save to backend
            await API.put('/api/users/push-token', { pushToken: token });
            console.log('[Push] Token saved to backend');

        } catch (error: any) {
            console.error('[Push] Error fetching token:', error.response?.data || error.message);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
};
