import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GradientHeaderProps {
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
}

export default function GradientHeader({ title, subtitle, rightComponent }: GradientHeaderProps) {
    return (
        <LinearGradient
            colors={['#FF9933', '#FFFFFF', '#138808']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
        >
            <View style={styles.container}>
                <View style={styles.textContainer}>
                    <Animated.Text entering={FadeInDown.delay(100)} style={styles.title}>
                        {title}
                    </Animated.Text>
                    {subtitle && (
                        <Animated.Text entering={FadeInDown.delay(200)} style={styles.subtitle}>
                            {subtitle}
                        </Animated.Text>
                    )}
                </View>
                {rightComponent && (
                    <Animated.View entering={FadeInDown.delay(300)}>
                        {rightComponent}
                    </Animated.View>
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        paddingBottom: 1,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: 12,
        color: '#333',
        marginTop: 4,
    },
});
