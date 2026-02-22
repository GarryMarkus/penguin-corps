import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ShineProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

const Shine: React.FC<ShineProps> = ({ children, style, duration = 2000 }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-100, 100],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX: `${translateX}%` }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {children}
      <View style={styles.shineContainer}>
        <Animated.View style={[styles.shine, animatedStyle]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  shineContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  shine: {
    width: '50%',
    height: '100%',
    opacity: 0.6,
  },
  gradient: {
    flex: 1,
  },
});

export default Shine;
