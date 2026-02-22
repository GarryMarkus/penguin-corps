import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Image } from 'react-native';

// Import plant level images (replace with actual paths after placing images in assets/images/plant/)
const plantLevels = [
  require('../assets/images/plant/plant_lvl0.png'),
  require('../assets/images/plant/plant_lvl1.png'),
  require('../assets/images/plant/plant_lvl2.png'),
  require('../assets/images/plant/plant_lvl3.png'),
  require('../assets/images/plant/plant_lvl4.png'),
  require('../assets/images/plant/plant_lvl5.png'),
  require('../assets/images/plant/plant_lvl6.png'),
  require('../assets/images/plant/plant_lvl7.png'),
];

interface PlantGrowthProps {
  level: number; // 0-7
  animate?: boolean;
  size?: number;
}

export default function PlantGrowth({ level, animate = true, size = 220 }: PlantGrowthProps) {
  // Clamp level
  const plantLevel = Math.max(0, Math.min(level, plantLevels.length - 1));

  // Animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [plantLevel, animate]);

  return (
    <View style={[styles.container, { width: size, height: size }]}> 
      <Animated.Image
        source={plantLevels[plantLevel]}
        style={{
          width: size,
          height: size,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
