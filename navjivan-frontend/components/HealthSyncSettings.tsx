/**
 * HealthSyncSettings Component
 * Allows users to connect fitness apps and wearables
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { isHealthSyncAvailable } from '../services/healthSync';
import { useSteps } from '../context/StepsContext';

const PASTEL = {
    mint: '#55EFC4',
    blue: '#74B9FF',
    pink: '#FF7675',
    purple: '#A29BFE',
};

interface FitnessApp {
    name: string;
    icon: string;
    color: string;
    platform: 'android' | 'ios' | 'both';
}

const FITNESS_APPS: FitnessApp[] = [
    { name: 'Google Fit', icon: 'fitness', color: '#4285F4', platform: 'android' },
    { name: 'Samsung Health', icon: 'heart', color: '#1428A0', platform: 'android' },
    { name: 'Fitbit', icon: 'watch', color: '#00B0B9', platform: 'both' },
    { name: 'Garmin Connect', icon: 'navigate', color: '#007CC3', platform: 'both' },
    { name: 'Apple Health', icon: 'heart-circle', color: '#FF3B30', platform: 'ios' },
    { name: 'Apple Watch', icon: 'watch', color: '#FF9500', platform: 'ios' },
];

export const HealthSyncSettings = () => {
    const { isHealthSyncEnabled, toggleHealthSync, syncFromHealthApps, dataSource, lastSynced, currentSteps } = useSteps();
    const [checking, setChecking] = useState(true);
    const [available, setAvailable] = useState(false);
    const [healthSource, setHealthSource] = useState('');
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        checkAvailability();
    }, []);

    const checkAvailability = async () => {
        setChecking(true);
        const result = await isHealthSyncAvailable();
        setAvailable(result.available);
        setHealthSource(result.source);
        setChecking(false);
    };

    const handleToggle = async () => {
        if (!available && !isHealthSyncEnabled) {
            Alert.alert(
                'Health Connect Required',
                Platform.OS === 'android'
                    ? 'Please install Health Connect from Google Play Store to sync with fitness apps.'
                    : 'Apple Health is required for syncing fitness data.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Store',
                        onPress: () => {
                            if (Platform.OS === 'android') {
                                Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata');
                            }
                        },
                    },
                ]
            );
            return;
        }
        toggleHealthSync();
    };

    const handleManualSync = async () => {
        setSyncing(true);
        await syncFromHealthApps();
        setSyncing(false);
        Alert.alert('Synced!', `Steps synced: ${currentSteps}`);
    };

    const filteredApps = FITNESS_APPS.filter(
        (app) => app.platform === 'both' || app.platform === Platform.OS
    );

    if (checking) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color={PASTEL.mint} />
                <Text style={styles.checkingText}>Checking fitness app availability...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="fitness" size={24} color={PASTEL.mint} />
                <Text style={styles.title}>Fitness App Sync</Text>
            </View>

            <Text style={styles.description}>
                Sync your steps from fitness apps and wearables for more accurate tracking.
            </Text>

            {/* Main Toggle */}
            <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>Enable Health Sync</Text>
                    <Text style={styles.toggleSub}>
                        {available ? healthSource : 'Not available on this device'}
                    </Text>
                </View>
                <Switch
                    value={isHealthSyncEnabled}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#333', true: PASTEL.mint }}
                    thumbColor={isHealthSyncEnabled ? '#FFF' : '#888'}
                />
            </View>

            {/* Status */}
            {isHealthSyncEnabled && (
                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <Ionicons name="cloud-done" size={20} color={PASTEL.mint} />
                        <Text style={styles.statusText}>Source: {dataSource}</Text>
                    </View>
                    {lastSynced && (
                        <View style={styles.statusRow}>
                            <Ionicons name="time" size={20} color={PASTEL.blue} />
                            <Text style={styles.statusText}>
                                Last synced: {lastSynced.toLocaleTimeString()}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.syncBtn}
                        onPress={handleManualSync}
                        disabled={syncing}
                    >
                        {syncing ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <>
                                <Ionicons name="refresh" size={18} color="#000" />
                                <Text style={styles.syncBtnText}>Sync Now</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Supported Apps */}
            <Text style={styles.sectionTitle}>Supported Apps & Wearables</Text>
            <View style={styles.appsGrid}>
                {filteredApps.map((app, index) => (
                    <View key={index} style={styles.appItem}>
                        <View style={[styles.appIcon, { backgroundColor: `${app.color}20` }]}>
                            <Ionicons name={app.icon as any} size={22} color={app.color} />
                        </View>
                        <Text style={styles.appName}>{app.name}</Text>
                    </View>
                ))}
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={PASTEL.blue} />
                <Text style={styles.infoText}>
                    {Platform.OS === 'android'
                        ? 'Health Connect syncs data from all your fitness apps automatically. Make sure Health Connect is installed and your apps are connected to it.'
                        : 'Apple Health collects data from all your connected apps and devices including Apple Watch.'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    description: {
        color: '#A0AEC0',
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 20,
    },
    checkingText: {
        color: '#A0AEC0',
        marginTop: 10,
        fontSize: 13,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    toggleLabel: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    toggleSub: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    statusCard: {
        backgroundColor: 'rgba(85,239,196,0.1)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(85,239,196,0.2)',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    statusText: {
        color: '#FFF',
        fontSize: 13,
    },
    syncBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PASTEL.mint,
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        gap: 8,
    },
    syncBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    appsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    appItem: {
        alignItems: 'center',
        width: 70,
    },
    appIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    appName: {
        color: '#A0AEC0',
        fontSize: 10,
        textAlign: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(116,185,255,0.1)',
        borderRadius: 10,
        padding: 12,
        gap: 10,
    },
    infoText: {
        flex: 1,
        color: '#A0AEC0',
        fontSize: 11,
        lineHeight: 16,
    },
});

export default HealthSyncSettings;
