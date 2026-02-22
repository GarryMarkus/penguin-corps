import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LPColors } from '../constants/theme';

export default function FloatingChatButton() {
    const router = useRouter();
    const segments = useSegments();


    const shouldHide =
        segments.some(seg => seg === 'ai-coach') ||
        segments.some(seg => seg === 'auth') ||
        segments.some(seg => seg === 'onboarding');

    if (shouldHide) return null;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/ai-coach');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                style={styles.buttonContainer}
            >
                <LinearGradient
                    colors={[LPColors.gradientStart, LPColors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, LPColors.shadow]}
                >
                    <Ionicons name="chatbubbles" size={24} color="#000" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        zIndex: 999,
    },
    buttonContainer: {
        borderRadius: 30,
        ...LPColors.shadow,
    },
    gradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});
