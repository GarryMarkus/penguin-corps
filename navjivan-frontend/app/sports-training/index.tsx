import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LPColors } from '../../constants/theme';
import { LPHaptics } from '../../services/haptics';

const { width } = Dimensions.get('window');

const AnimatedBtn = ({ children, onPress, style, disabled }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (disabled) return;
        LPHaptics.light();
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1);
    };

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} disabled={disabled}>
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

const POPULAR_SPORTS = [
    { name: 'Football', icon: 'football' },
    { name: 'Basketball', icon: 'basketball' },
    { name: 'Cricket', icon: 'baseball' },
    { name: 'Tennis', icon: 'tennisball' },
    { name: 'Swimming', icon: 'water' },
    { name: 'Running', icon: 'walk' },
    { name: 'Cycling', icon: 'bicycle' },
    { name: 'Gym/Fitness', icon: 'barbell' },
    { name: 'Yoga', icon: 'body' },
    { name: 'Boxing', icon: 'fitness' },
];

interface TrainingProgram {
    title: string;
    duration: string;
    description: string;
    exercises: string[];
    icon: string;
}

export default function SportsTrainingScreen() {
    const router = useRouter();
    const [sportInput, setSportInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
    const [error, setError] = useState('');

    const generateTrainingProgram = async (sport: string) => {
        if (!sport.trim()) {
            setError('Please enter a sport name');
            return;
        }

        setLoading(true);
        setError('');
        LPHaptics.light();

        try {
            const response = await fetch('http://192.168.1.7:5000/ai-coach/generate-training', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sport: sport.trim() }),
            });

            const data = await response.json();

            if (data.success && data.programs) {
                setTrainingPrograms(data.programs);
                LPHaptics.success();
            } else {
                setError(data.message || 'Failed to generate training programs');
                LPHaptics.error();
            }
        } catch (err) {
            console.error('Training generation error:', err);
            setError('Failed to connect to server');
            LPHaptics.error();
        } finally {
            setLoading(false);
        }
    };

    const handleSportSelect = (sportName: string) => {
        setSportInput(sportName);
        generateTrainingProgram(sportName);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={LPColors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Sports Training</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Description */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.descriptionCard}>
                    <View style={styles.descriptionHeader}>
                        <Ionicons name="trophy" size={32} color={LPColors.primary} />
                        <Text style={styles.descriptionTitle}>AI Training Coach</Text>
                    </View>
                    <Text style={styles.descriptionText}>
                        Get personalized training programs for any sport! Our AI coach will create customized
                        workouts tailored to your sport of choice.
                    </Text>
                </Animated.View>

                {/* Sport Input */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Enter Your Sport</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="search" size={20} color={LPColors.textGray} style={{ marginRight: 12 }} />
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g., Football, Basketball, Tennis..."
                            placeholderTextColor={LPColors.textGray}
                            value={sportInput}
                            onChangeText={setSportInput}
                            onSubmitEditing={() => generateTrainingProgram(sportInput)}
                            returnKeyType="search"
                        />
                    </View>

                    <AnimatedBtn
                        onPress={() => generateTrainingProgram(sportInput)}
                        disabled={loading}
                        style={styles.generateButton}
                    >
                        <LinearGradient
                            colors={[LPColors.primary, '#004d2c']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.generateButtonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.generateButtonText}>Generate Training Plan</Text>
                                </>
                            )}
                        </LinearGradient>
                    </AnimatedBtn>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                </Animated.View>

                {/* Popular Sports */}
                <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.popularSection}>
                    <Text style={styles.sectionTitle}>Popular Sports</Text>
                    <View style={styles.sportsGrid}>
                        {POPULAR_SPORTS.map((sport, index) => (
                            <AnimatedBtn
                                key={index}
                                onPress={() => handleSportSelect(sport.name)}
                                style={styles.sportCard}
                            >
                                <View style={styles.sportIcon}>
                                    <Ionicons name={sport.icon as any} size={24} color={LPColors.primary} />
                                </View>
                                <Text style={styles.sportName}>{sport.name}</Text>
                            </AnimatedBtn>
                        ))}
                    </View>
                </Animated.View>

                {/* Training Programs */}
                {trainingPrograms.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.programsSection}>
                        <Text style={styles.sectionTitle}>Your Training Programs</Text>
                        {trainingPrograms.map((program, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(600 + index * 100).duration(500)}
                                style={styles.programCard}
                            >
                                <View style={styles.programHeader}>
                                    <View style={styles.programIconContainer}>
                                        <Ionicons name={program.icon as any} size={24} color={LPColors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.programTitle}>{program.title}</Text>
                                        <Text style={styles.programDuration}>{program.duration}</Text>
                                    </View>
                                </View>

                                <Text style={styles.programDescription}>{program.description}</Text>

                                <View style={styles.exercisesContainer}>
                                    <Text style={styles.exercisesTitle}>Exercises:</Text>
                                    {program.exercises.map((exercise, i) => (
                                        <View key={i} style={styles.exerciseRow}>
                                            <Ionicons name="checkmark-circle" size={16} color={LPColors.primary} />
                                            <Text style={styles.exerciseText}>{exercise}</Text>
                                        </View>
                                    ))}
                                </View>

                                <AnimatedBtn style={styles.startButton}>
                                    <LinearGradient
                                        colors={[LPColors.primary, '#004d2c']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.startButtonGradient}
                                    >
                                        <Ionicons name="play" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.startButtonText}>Start Training</Text>
                                    </LinearGradient>
                                </AnimatedBtn>
                            </Animated.View>
                        ))}
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    descriptionCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(57, 255, 20, 0.1)',
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: LPColors.text,
        marginLeft: 12,
    },
    descriptionText: {
        fontSize: 14,
        color: LPColors.textGray,
        lineHeight: 20,
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: LPColors.text,
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    textInput: {
        flex: 1,
        color: LPColors.text,
        fontSize: 16,
    },
    generateButton: {
        marginBottom: 12,
    },
    generateButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    generateButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
    },
    popularSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: LPColors.text,
        marginBottom: 16,
    },
    sportsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    sportCard: {
        width: (width - 56) / 3,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    sportIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sportName: {
        color: LPColors.text,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    programsSection: {
        marginBottom: 24,
    },
    programCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(57, 255, 20, 0.1)',
    },
    programHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    programIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    programTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    programDuration: {
        fontSize: 12,
        color: LPColors.textGray,
        marginTop: 2,
    },
    programDescription: {
        fontSize: 14,
        color: LPColors.textGray,
        lineHeight: 20,
        marginBottom: 16,
    },
    exercisesContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    exercisesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: LPColors.text,
        marginBottom: 12,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    exerciseText: {
        fontSize: 13,
        color: LPColors.textGray,
        flex: 1,
    },
    startButton: {},
    startButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    startButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
