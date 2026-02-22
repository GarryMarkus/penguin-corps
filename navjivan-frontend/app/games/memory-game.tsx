import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LPColors } from '../../constants/theme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 4;

interface Card {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const ICONS = ['heart', 'star', 'flash', 'moon', 'sunny', 'leaf', 'water', 'flame'];

export default function MemoryGame() {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        if (isPlaying) {
            const timer = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (matches === 8 && isPlaying) {
            setIsPlaying(false);
        }
    }, [matches]);

    const initializeGame = () => {
        const gameIcons = [...ICONS, ...ICONS];
        const shuffled = gameIcons
            .sort(() => Math.random() - 0.5)
            .map((icon, index) => ({
                id: index,
                icon,
                isFlipped: false,
                isMatched: false,
            }));

        setCards(shuffled);
        setFlippedCards([]);
        setMoves(0);
        setMatches(0);
        setTimeElapsed(0);
        setIsPlaying(true);
    };

    const handleCardPress = (cardId: number) => {
        if (!isPlaying) return;
        if (flippedCards.length === 2) return;
        if (flippedCards.includes(cardId)) return;
        if (cards[cardId].isMatched) return;

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);


        setCards(prev => prev.map(card =>
            card.id === cardId ? { ...card, isFlipped: true } : card
        ));


        if (newFlipped.length === 2) {
            setMoves(moves + 1);
            const [first, second] = newFlipped;

            if (cards[first].icon === cards[second].icon) {

                setTimeout(() => {
                    setCards(prev => prev.map(card =>
                        card.id === first || card.id === second
                            ? { ...card, isMatched: true }
                            : card
                    ));
                    setMatches(matches + 1);
                    setFlippedCards([]);
                }, 500);
            } else {

                setTimeout(() => {
                    setCards(prev => prev.map(card =>
                        card.id === first || card.id === second
                            ? { ...card, isFlipped: false }
                            : card
                    ));
                    setFlippedCards([]);
                }, 1000);
            }
        }
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
                <Text style={styles.title}>Memory Game</Text>
                <View style={styles.placeholder} />
            </View>

            {}
            <Text style={styles.instructions}>
                Match all pairs of cards to win!
            </Text>

            {}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Ionicons name="time" size={20} color={LPColors.primary} />
                    <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
                    <Text style={styles.statLabel}>Time</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="hand-left" size={20} color={LPColors.primary} />
                    <Text style={styles.statValue}>{moves}</Text>
                    <Text style={styles.statLabel}>Moves</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="checkmark-done" size={20} color={LPColors.primary} />
                    <Text style={styles.statValue}>{matches}/8</Text>
                    <Text style={styles.statLabel}>Matches</Text>
                </View>
            </View>

            {}
            {isPlaying || matches === 8 ? (
                <View style={styles.gameBoard}>
                    {cards.map((card) => (
                        <TouchableOpacity
                            key={card.id}
                            style={[
                                styles.card,
                                card.isFlipped || card.isMatched ? styles.cardFlipped : styles.cardHidden,
                                card.isMatched && styles.cardMatched,
                            ]}
                            onPress={() => handleCardPress(card.id)}
                            activeOpacity={0.8}
                            disabled={card.isFlipped || card.isMatched}
                        >
                            {(card.isFlipped || card.isMatched) ? (
                                <Ionicons
                                    name={card.icon as any}
                                    size={32}
                                    color={card.isMatched ? LPColors.primary : LPColors.text}
                                />
                            ) : (
                                <Ionicons name="help" size={32} color={LPColors.textMuted} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.startCard}>
                    <Ionicons name="albums" size={64} color={LPColors.primary} />
                    <Text style={styles.startTitle}>Ready to Play?</Text>
                    <Text style={styles.startSubtitle}>
                        Test your memory and concentration
                    </Text>
                    <TouchableOpacity style={styles.startButton} onPress={initializeGame}>
                        <Ionicons name="play" size={24} color="#000" />
                        <Text style={styles.startButtonText}>Start Game</Text>
                    </TouchableOpacity>
                </View>
            )}

            {}
            {matches === 8 && !isPlaying && (
                <View style={styles.winOverlay}>
                    <View style={styles.winCard}>
                        <Ionicons name="trophy" size={64} color={LPColors.primary} />
                        <Text style={styles.winTitle}>You Won!</Text>
                        <Text style={styles.winStats}>
                            Time: {formatTime(timeElapsed)} | Moves: {moves}
                        </Text>
                        <TouchableOpacity style={styles.playAgainButton} onPress={initializeGame}>
                            <Ionicons name="refresh" size={24} color="#000" />
                            <Text style={styles.playAgainText}>Play Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {}
            {isPlaying && (
                <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
                    <Ionicons name="refresh" size={20} color={LPColors.text} />
                    <Text style={styles.resetText}>New Game</Text>
                </TouchableOpacity>
            )}

            {}
            <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color={LPColors.primary} />
                <Text style={styles.infoText}>
                    Memory games improve concentration and focus - great for managing cravings!
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
        fontSize: 28,
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
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        backgroundColor: LPColors.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LPColors.border,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: LPColors.text,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 10,
        color: LPColors.textGray,
    },
    gameBoard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    card: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    cardHidden: {
        backgroundColor: LPColors.surface,
        borderColor: LPColors.border,
    },
    cardFlipped: {
        backgroundColor: LPColors.surfaceLight,
        borderColor: LPColors.primary,
    },
    cardMatched: {
        backgroundColor: 'rgba(191, 239, 224, 0.2)',
        borderColor: LPColors.primary,
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
    startSubtitle: {
        fontSize: 14,
        color: LPColors.textGray,
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
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    resetButton: {
        flexDirection: 'row',
        backgroundColor: LPColors.surface,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: LPColors.border,
    },
    resetText: {
        fontSize: 16,
        fontWeight: '600',
        color: LPColors.text,
    },
    winOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    winCard: {
        backgroundColor: LPColors.surface,
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: LPColors.primary,
        width: '100%',
    },
    winTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: LPColors.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    winStats: {
        fontSize: 16,
        color: LPColors.textGray,
        marginBottom: 24,
    },
    playAgainButton: {
        flexDirection: 'row',
        backgroundColor: LPColors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    playAgainText: {
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
