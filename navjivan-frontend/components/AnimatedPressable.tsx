import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { LPHaptics } from '../services/haptics';

interface AnimatedPressableProps {
    children: React.ReactNode;
    onPress: () => void;
    style?: ViewStyle;
    disabled?: boolean;
    haptic?: boolean;
}

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export default function AnimatedPressable({
    children,
    onPress,
    style,
    disabled = false,
    haptic = true,
}: AnimatedPressableProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (disabled) return;
        if (haptic) LPHaptics.light();
        scale.value = withSpring(0.95, {
            damping: 15,
            stiffness: 150,
        });
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1, {
            damping: 15,
            stiffness: 150,
        });
    };

    const handlePress = () => {
        if (disabled) return;
        if (haptic) LPHaptics.medium();
        onPress();
    };

    return (
        <AnimatedPressableComponent
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled}
            style={[style, animatedStyle, disabled && { opacity: 0.5 }]}
        >
            {children}
        </AnimatedPressableComponent>
    );
}
