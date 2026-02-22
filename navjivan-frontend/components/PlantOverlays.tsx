import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Image } from 'react-native';

// Replace with actual asset paths after placing images in assets/images/plant/
const sunGlow = require('../assets/images/plant/sun_glow.png'); // left sun
const sunSimple = require('../assets/images/plant/sun_simple.png'); // right sun
const wateringCan = require('../assets/images/plant/watering_can.png');

interface PlantOverlaysProps {
  showSun?: boolean;
  sunType?: 'glow' | 'simple';
  showWatering?: boolean;
  animateWater?: boolean;
  size?: number;
}

export default function PlantOverlays({
  showSun = false,
  sunType = 'glow',
  showWatering = false,
  animateWater = false,
  size = 220,
}: PlantOverlaysProps) {
  // Sun animation
  const sunAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (showSun) {
      Animated.loop(
        Animated.timing(sunAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      sunAnim.setValue(0);
    }
  }, [showSun]);

  // Watering can animation
  const waterAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (showWatering && animateWater) {
      Animated.sequence([
        Animated.timing(waterAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(waterAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      waterAnim.setValue(0);
    }
  }, [showWatering, animateWater]);

  return (
    <View style={[styles.overlay, { width: size, height: size }]}> 
      {/* Sun overlay */}
      {showSun && (
        <Animated.Image
          source={sunType === 'glow' ? sunGlow : sunSimple}
          style={{
            position: 'absolute',
            top: 0,
            left: size * 0.1,
            width: size * 0.5,
            height: size * 0.5,
            opacity: 0.9,
            transform: [
              {
                rotate: sunAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
          resizeMode="contain"
        />
      )}
      {/* Watering can overlay */}
      {showWatering && (
        <Animated.Image
          source={wateringCan}
          style={{
            position: 'absolute',
            left: size * 0.55,
            top: size * 0.15,
            width: size * 0.35,
            height: size * 0.35,
            opacity: 0.95,
            transform: [
              {
                rotate: waterAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-20deg', '0deg'],
                }),
              },
              {
                translateY: waterAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
            ],
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
});
