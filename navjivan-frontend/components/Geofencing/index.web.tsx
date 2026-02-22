import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LPColors } from '../../constants/theme';

export default function GeofencingWebFallback() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Geofencing</Text>
                <Ionicons name="map" size={24} color={LPColors.text} />
            </View>
            <View style={styles.webFallback}>
                <Ionicons name="phone-portrait-outline" size={64} color={LPColors.textGray} />
                <Text style={styles.webFallbackTitle}>Mobile Only Feature</Text>
                <Text style={styles.webFallbackText}>
                    Geofencing requires native device capabilities and is only available on iOS and Android.
                </Text>
                <Text style={styles.webFallbackSubtext}>
                    Please open this app on a mobile device to use location-based alerts and zone management.
                </Text>
                <View style={styles.webFeatureList}>
                    <View style={styles.webFeatureItem}>
                        <Ionicons name="location" size={24} color={LPColors.primary} />
                        <Text style={styles.webFeatureText}>GPS Tracking</Text>
                    </View>
                    <View style={styles.webFeatureItem}>
                        <Ionicons name="notifications" size={24} color={LPColors.primary} />
                        <Text style={styles.webFeatureText}>Push Notifications</Text>
                    </View>
                    <View style={styles.webFeatureItem}>
                        <Ionicons name="map" size={24} color={LPColors.primary} />
                        <Text style={styles.webFeatureText}>Interactive Maps</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LPColors.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    webFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    webFallbackTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: LPColors.text,
        marginTop: 24,
        marginBottom: 12,
    },
    webFallbackText: {
        fontSize: 16,
        color: LPColors.textGray,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 24,
    },
    webFallbackSubtext: {
        fontSize: 14,
        color: LPColors.textMuted,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 20,
    },
    webFeatureList: {
        width: '100%',
        maxWidth: 400,
    },
    webFeatureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LPColors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 16,
    },
    webFeatureText: {
        fontSize: 16,
        fontWeight: '600',
        color: LPColors.text,
    },
});
