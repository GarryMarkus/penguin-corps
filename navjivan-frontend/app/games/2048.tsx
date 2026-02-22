import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LPColors } from '../../constants/theme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const GRID_SIZE = 4;
const TILE_SIZE = (width - 80) / GRID_SIZE;

export default function Game2048() {
    const [score, setScore] = useState(0);
    const [grid, setGrid] = useState<number[][]>(
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
    );

    const handleNewGame = () => {
        setScore(0);
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)));
    };

    const getTileColor = (value: number) => {
        const colors: { [key: number]: string } = {
            0: LPColors.surfaceLight,
            2: '#EEE4DA',
            4: '#EDE0C8',
            8: '#F2B179',
            16: '#F59563',
            32: '#F67C5F',
            64: '#F65E3B',
            128: '#EDCF72',
            256: '#EDCC61',
            512: '#EDC850',
            1024: '#EDC53F',
            2048: '#EDC22E',
        };
        return colors[value] || '#3C3A32';
    };

    const getTileTextColor = (value: number) => {
        return value <= 4 ? '#776E65' : '#F9F6F2';
    };

    return (
        <SafeAreaView style={styles.container}>
            {}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={LPColors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>2048</Text>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                    <Text style={styles.scoreValue}>{score}</Text>
                </View>
            </View>

            {}
            <Text style={styles.instructions}>
                Swipe to move tiles. Combine tiles with the same number to reach 2048!
            </Text>

            {}
            <View style={styles.gridContainer}>
                {grid.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((cell, colIndex) => (
                            <View
                                key={`${rowIndex}-${colIndex}`}
                                style={[
                                    styles.tile,
                                    { backgroundColor: getTileColor(cell) }
                                ]}
                            >
                                {cell > 0 && (
                                    <Text style={[styles.tileText, { color: getTileTextColor(cell) }]}>
                                        {cell}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            {}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
                    <Text style={styles.newGameText}>New Game</Text>
                </TouchableOpacity>

                <Text style={styles.comingSoon}>
                    Full game implementation coming soon!
                </Text>
            </View>

            {}
            <View style={styles.dpad}>
                <View style={styles.dpadRow}>
                    <View style={styles.dpadSpacer} />
                    <TouchableOpacity style={styles.dpadButton}>
                        <Ionicons name="chevron-up" size={32} color={LPColors.text} />
                    </TouchableOpacity>
                    <View style={styles.dpadSpacer} />
                </View>
                <View style={styles.dpadRow}>
                    <TouchableOpacity style={styles.dpadButton}>
                        <Ionicons name="chevron-back" size={32} color={LPColors.text} />
                    </TouchableOpacity>
                    <View style={styles.dpadSpacer} />
                    <TouchableOpacity style={styles.dpadButton}>
                        <Ionicons name="chevron-forward" size={32} color={LPColors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.dpadRow}>
                    <View style={styles.dpadSpacer} />
                    <TouchableOpacity style={styles.dpadButton}>
                        <Ionicons name="chevron-down" size={32} color={LPColors.text} />
                    </TouchableOpacity>
                    <View style={styles.dpadSpacer} />
                </View>
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
    gridContainer: {
        backgroundColor: LPColors.surface,
        padding: 10,
        borderRadius: 12,
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        margin: 5,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tileText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    controls: {
        marginTop: 30,
        alignItems: 'center',
    },
    newGameButton: {
        backgroundColor: LPColors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    newGameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    comingSoon: {
        fontSize: 12,
        color: LPColors.textMuted,
        marginTop: 16,
        fontStyle: 'italic',
    },
    dpad: {
        marginTop: 30,
        alignItems: 'center',
    },
    dpadRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dpadButton: {
        width: 60,
        height: 60,
        backgroundColor: LPColors.surface,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
    },
    dpadSpacer: {
        width: 60,
        height: 60,
    },
});
