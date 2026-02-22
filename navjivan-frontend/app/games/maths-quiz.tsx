import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LPColors } from '../../constants/theme';
import { router } from 'expo-router';

interface Question {
    num1: number;
    num2: number;
    operator: '+' | '-' | '×' | '÷';
    answer: number;
}

export default function MathsQuizGame() {
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isPlaying, setIsPlaying] = useState(false);
    const [question, setQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            setIsPlaying(false);
        }
    }, [isPlaying, timeLeft]);

    const generateQuestion = (): Question => {
        const operators: Array<'+' | '-' | '×' | '÷'> = ['+', '-', '×', '÷'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let num1, num2, answer;

        switch (operator) {
            case '+':
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * 50) + 20;
                num2 = Math.floor(Math.random() * num1);
                answer = num1 - num2;
                break;
            case '×':
                num1 = Math.floor(Math.random() * 12) + 1;
                num2 = Math.floor(Math.random() * 12) + 1;
                answer = num1 * num2;
                break;
            case '÷':
                num2 = Math.floor(Math.random() * 10) + 1;
                answer = Math.floor(Math.random() * 10) + 1;
                num1 = num2 * answer;
                break;
        }

        return { num1, num2, operator, answer };
    };

    const handleStart = () => {
        setIsPlaying(true);
        setScore(0);
        setStreak(0);
        setTimeLeft(60);
        setUserAnswer('');
        setFeedback(null);
        setQuestion(generateQuestion());
    };

    const handleSubmit = () => {
        if (!question || !userAnswer) return;

        const isCorrect = parseInt(userAnswer) === question.answer;

        if (isCorrect) {
            setScore(score + (10 * (streak + 1)));
            setStreak(streak + 1);
            setFeedback('correct');
        } else {
            setStreak(0);
            setFeedback('wrong');
        }

        setTimeout(() => {
            setUserAnswer('');
            setFeedback(null);
            setQuestion(generateQuestion());
        }, 500);
    };

    return (
        <SafeAreaView style={styles.container}>
            {}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={LPColors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Maths Quiz</Text>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                    <Text style={styles.scoreValue}>{score}</Text>
                </View>
            </View>

            {}
            <Text style={styles.instructions}>
                Solve as many math problems as you can in 60 seconds!
            </Text>

            {}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Ionicons name="time" size={24} color={LPColors.primary} />
                    <Text style={styles.statValue}>{timeLeft}s</Text>
                    <Text style={styles.statLabel}>Time Left</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="flame" size={24} color="#FF6B6B" />
                    <Text style={styles.statValue}>{streak}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                </View>
            </View>

            {}
            {isPlaying && question ? (
                <View style={[styles.questionCard, feedback === 'correct' && styles.correctCard, feedback === 'wrong' && styles.wrongCard]}>
                    <Text style={styles.questionText}>
                        {question.num1} {question.operator} {question.num2} = ?
                    </Text>

                    <TextInput
                        style={styles.answerInput}
                        value={userAnswer}
                        onChangeText={setUserAnswer}
                        keyboardType="numeric"
                        placeholder="Your answer"
                        placeholderTextColor={LPColors.textMuted}
                        autoFocus
                        onSubmitEditing={handleSubmit}
                    />

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                        <Ionicons name="checkmark" size={20} color="#000" />
                    </TouchableOpacity>

                    {feedback && (
                        <View style={styles.feedbackContainer}>
                            <Ionicons
                                name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'}
                                size={32}
                                color={feedback === 'correct' ? LPColors.primary : '#FF6B6B'}
                            />
                            <Text style={[styles.feedbackText, feedback === 'correct' ? styles.correctText : styles.wrongText]}>
                                {feedback === 'correct' ? 'Correct!' : `Wrong! Answer: ${question.answer}`}
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.startCard}>
                    <Ionicons name="calculator" size={64} color={LPColors.primary} />
                    <Text style={styles.startTitle}>
                        {timeLeft === 0 ? 'Game Over!' : 'Ready to Start?'}
                    </Text>
                    {timeLeft === 0 && (
                        <Text style={styles.finalScore}>Final Score: {score}</Text>
                    )}
                    <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                        <Ionicons name="play" size={24} color="#000" />
                        <Text style={styles.startButtonText}>
                            {timeLeft === 0 ? 'Play Again' : 'Start Quiz'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {}
            <View style={styles.infoCard}>
                <Ionicons name="bulb" size={20} color={LPColors.primary} />
                <Text style={styles.infoText}>
                    Build a streak for bonus points! Each correct answer in a row multiplies your score.
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
    questionCard: {
        backgroundColor: LPColors.surface,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: LPColors.border,
        marginBottom: 20,
    },
    correctCard: {
        borderColor: LPColors.primary,
        backgroundColor: 'rgba(191, 239, 224, 0.1)',
    },
    wrongCard: {
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
    },
    questionText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: LPColors.text,
        marginBottom: 24,
    },
    answerInput: {
        backgroundColor: LPColors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        fontSize: 32,
        fontWeight: 'bold',
        color: LPColors.text,
        textAlign: 'center',
        width: '100%',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: LPColors.border,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: LPColors.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    feedbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    feedbackText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    correctText: {
        color: LPColors.primary,
    },
    wrongText: {
        color: '#FF6B6B',
    },
    startCard: {
        backgroundColor: LPColors.surface,
        borderRadius: 16,
        padding: 48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LPColors.border,
        marginBottom: 20,
    },
    startTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: LPColors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    finalScore: {
        fontSize: 18,
        color: LPColors.primary,
        marginBottom: 24,
    },
    startButton: {
        flexDirection: 'row',
        backgroundColor: LPColors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
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
