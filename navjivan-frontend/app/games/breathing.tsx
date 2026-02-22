import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LPColors } from '../../constants/theme';
import { router } from 'expo-router';

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest';

export default function BreathingExercise() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<Phase>('inhale');
    const [countdown, setCountdown] = useState(4);
    const [cyclesCompleted, setCyclesCompleted] = useState(0);
    const [totalTime, setTotalTime] = useState(0);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;


    const phaseDurations = {
        inhale: 4,
        hold: 4,
        exhale: 4,
        rest: 2,
    };

    const phaseInstructions = {
        inhale: 'Breathe In',
        hold: 'Hold',
        exhale: 'Breathe Out',
        rest: 'Rest',
    };

    const phaseColors = {
        inhale: LPColors.primary,
        hold: '#8B5CF6',
        exhale: '#3B82F6',
        rest: LPColors.textGray,
    };

    useEffect(() => {
        if (isActive) {
            const timer = setInterval(() => {
                setTotalTime(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isActive]);

    useEffect(() => {
        if (isActive && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (isActive && countdown === 0) {
            moveToNextPhase();
        }
    }, [isActive, countdown]);

    useEffect(() => {
        if (isActive) {
            animateCircle();
        }
    }, [phase, isActive]);

    const animateCircle = () => {
        const duration = phaseDurations[phase] * 1000;

        if (phase === 'inhale') {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1.5,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.8,
                    duration: duration,
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (phase === 'exhale') {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.3,
                    duration: duration,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    };

    const moveToNextPhase = () => {
        const phaseOrder: Phase[] = ['inhale', 'hold', 'exhale', 'rest'];
        const currentIndex = phaseOrder.indexOf(phase);
        const nextIndex = (currentIndex + 1) % phaseOrder.length;
        const nextPhase = phaseOrder[nextIndex];

        if (nextPhase === 'inhale') {
            setCyclesCompleted(prev => prev + 1);
        }

        setPhase(nextPhase);
        setCountdown(phaseDurations[nextPhase]);
    };

    const handleStart = () => {
        setIsActive(true);
        setPhase('inhale');
        setCountdown(phaseDurations.inhale);
        setCyclesCompleted(0);
        setTotalTime(0);
    };

    const handleStop = () => {
        setIsActive(false);
        scaleAnim.setValue(1);
        opacityAnim.setValue(0.3);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={LPColors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Breathing</Text>
                <View style={styles.placeholder} />
            </View>

            {}
            <Text style={styles.instructions}>
                Follow the breathing pattern to relax and reduce cravings
            </Text>

            {}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Ionicons name="time" size={20} color={LPColors.primary} />
                    <Text style={styles.statValue}>{formatTime(totalTime)}</Text>
                    <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="sync" size={20} color={LPColors.primary} />
                    <Text style={styles.statValue}>{cyclesCompleted}</Text>
                    <Text style={styles.statLabel}>Cycles</Text>
                </View>
            </View>

            {}
            <View style={styles.breathingArea}>
                <Animated.View
                    style={[
                        styles.breathingCircle,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                            backgroundColor: phaseColors[phase],
                        },
                    ]}
                />
                <View style={styles.centerContent}>
                    <Text style={[styles.phaseText, { color: phaseColors[phase] }]}>
                        {phaseInstructions[phase]}
                    </Text>
                    {isActive && (
                        <Text style={styles.countdownText}>{countdown}</Text>
                    )}
                </View>
            </View>

            {}
            <View style={styles.patternCard}>
                <Text style={styles.patternTitle}>4-4-4-2 Pattern</Text>
                <View style={styles.patternSteps}>
                    <View style={styles.patternStep}>
                        <View style={[styles.patternDot, { backgroundColor: phaseColors.inhale }]} />
                        <Text style={styles.patternText}>Inhale: 4s</Text>
                    </View>
                    <View style={styles.patternStep}>
                        <View style={[styles.patternDot, { backgroundColor: phaseColors.hold }]} />
                        <Text style={styles.patternText}>Hold: 4s</Text>
                    </View>
                    <View style={styles.patternStep}>
                        <View style={[styles.patternDot, { backgroundColor: phaseColors.exhale }]} />
                        <Text style={styles.patternText}>Exhale: 4s</Text>
                    </View>
                    <View style={styles.patternStep}>
                        <View style={[styles.patternDot, { backgroundColor: phaseColors.rest }]} />
                        <Text style={styles.patternText}>Rest: 2s</Text>
                    </View>
                </View>
            </View>

            {}
            <View style={styles.controls}>
                {!isActive ? (
                    <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                        <Ionicons name="play" size={24} color="#000" />
                        <Text style={styles.startButtonText}>Start Breathing</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                        <Ionicons name="stop" size={24} color={LPColors.text} />
                        <Text style={styles.stopButtonText}>Stop</Text>
                    </TouchableOpacity>
                )}
            </View>

            {}
            <View style={styles.infoCard}>
                <Ionicons name="heart" size={20} color={LPColors.primary} />
                <Text style={styles.infoText}>
                    Deep breathing activates your body's relaxation response, helping reduce stress and cravings.
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
    placeholder: {
        width: 44,
    },
    instructions: {
        fontSize: 14,
        color: LPColors.textGray,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
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
    },
    breathingArea: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        marginBottom: 30,
    },
    breathingCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    centerContent: {
        alignItems: 'center',
        zIndex: 1,
    },
    phaseText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    countdownText: {
        fontSize: 64,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    patternCard: {
        backgroundColor: LPColors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: LPColors.border,
    },
    patternTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: LPColors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    patternSteps: {
        gap: 12,
    },
    patternStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    patternDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    patternText: {
        fontSize: 14,
        color: LPColors.textGray,
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
