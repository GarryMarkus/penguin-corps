import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LPColors } from '../../constants/theme';
import { router } from 'expo-router';

export default function AIFocusGame() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            setIsPlaying(false);
        }
    }, [isPlaying, timeLeft]);

    useEffect(() => {

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleStart = () => {
        setIsPlaying(true);
        setScore(0);
        setTimeLeft(60);
    };

    const handleFocus = () => {
        if (isPlaying) {
            setScore(score + 10);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={LPColors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>AI Focus</Text>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                    <Text style={styles.scoreValue}>{score}</Text>
                </View>
            </View>

            {}
            <Text style={styles.instructions}>
                Focus on the center and tap when you feel the urge. Train your mind to resist cravings!
            </Text>

            {}
            <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>Time Left</Text>
                <Text style={styles.timerValue}>{timeLeft}s</Text>
            </View>

            {}
            <View style={styles.focusArea}>
                <TouchableOpacity
                    style={styles.focusCircle}
                    onPress={handleFocus}
                    activeOpacity={0.7}
                    disabled={!isPlaying}
                >
                    <Animated.View
                        style={[
                            styles.pulseCircle,
                            {
                                transform: [{ scale: isPlaying ? pulseAnim : 1 }],
                                opacity: isPlaying ? 0.6 : 0.3,
                            },
                        ]}
                    />
                    <Ionicons
                        name="eye"
                        size={64}
                        color={isPlaying ? LPColors.primary : LPColors.textGray}
                    />
                    <Text style={styles.focusText}>
                        {isPlaying ? 'TAP TO FOCUS' : 'START GAME'}
                    </Text>
                </TouchableOpacity>
            </View>

            {}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Ionicons name="flash" size={24} color={LPColors.primary} />
                    <Text style={styles.statValue}>{score}</Text>
                    <Text style={styles.statLabel}>Focus Points</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="time" size={24} color={LPColors.primary} />
                    <Text style={styles.statValue}>{60 - timeLeft}</Text>
                    <Text style={styles.statLabel}>Seconds Played</Text>
                </View>
            </View>

            {}
            <View style={styles.controls}>
                {!isPlaying ? (
                    <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                        <Ionicons name="play" size={24} color="#000" />
                        <Text style={styles.startButtonText}>Start Focus Training</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={() => setIsPlaying(false)}
                    >
                        <Ionicons name="stop" size={24} color={LPColors.text} />
                        <Text style={styles.stopButtonText}>Stop</Text>
                    </TouchableOpacity>
                )}
            </View>

            {}
            <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color={LPColors.primary} />
                <Text style={styles.infoText}>
                    This game helps train your focus and resist impulses - perfect for managing cravings!
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LPColors.bg,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: LPColors.primary,
    },
    scoreContainer: {
        backgroundColor: LPColors.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 10,
        color: LPColors.textGray,
        fontWeight: '600',
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    instructions: {
        fontSize: 14,
        color: LPColors.textGray,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    timerLabel: {
        fontSize: 12,
        color: LPColors.textGray,
        marginBottom: 4,
    },
    timerValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: LPColors.primary,
    },
    focusArea: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 30,
    },
    focusCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: LPColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: LPColors.border,
        position: 'relative',
    },
    pulseCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: LPColors.primary,
    },
    focusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: LPColors.text,
        marginTop: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        backgroundColor: LPColors.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LPColors.border,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: LPColors.text,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 11,
        color: LPColors.textGray,
        textAlign: 'center',
    },
    controls: {
        marginBottom: 20,
    },
    startButton: {
        flexDirection: 'row',
        backgroundColor: LPColors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    stopButton: {
        flexDirection: 'row',
        backgroundColor: LPColors.surface,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: LPColors.border,
    },
    stopButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: LPColors.surface,
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: LPColors.border,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: LPColors.textGray,
        lineHeight: 18,
    },
});
