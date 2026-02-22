import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { LPColors } from '../constants/theme';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
    disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GradientButton({
    title,
    onPress,
    variant = 'primary',
    style,
    disabled = false,
}: GradientButtonProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (!disabled) {
            scale.value = withSpring(0.95);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onPress();
        }
    };

    if (variant === 'primary') {
        return (
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[animatedStyle, style, disabled && styles.disabled]}
            >
                <LinearGradient
                    colors={[LPColors.gradientStart, LPColors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, LPColors.shadow]}
                >
                    <Text style={styles.primaryText}>{title}</Text>
                </LinearGradient>
            </AnimatedPressable>
        );
    }

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.secondary, animatedStyle, style, disabled && styles.disabled]}
        >
            <Text style={styles.secondaryText}>{title}</Text>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    secondary: {
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: LPColors.primary,
        backgroundColor: 'rgba(57, 255, 20, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: {
        color: LPColors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    disabled: {
        opacity: 0.5,
    },
});
