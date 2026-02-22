import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    Path,
    RadialGradient,
    Rect,
    Stop,
} from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
    width: number;
    height: number;
    plantStage: number;
    waterAnim: boolean;
    smokeAnim: boolean;
    sparkleAnim: boolean;
}

export default function GameGarden({ width: W, height: H, plantStage, waterAnim, smokeAnim, sparkleAnim }: Props) {
    // ── Shared values for animations ──
    const plantScale = useSharedValue(1);
    const plantBounce = useSharedValue(0);
    const waterDrop1 = useSharedValue(0);
    const waterDrop2 = useSharedValue(0);
    const waterDrop3 = useSharedValue(0);
    const smokeRise = useSharedValue(0);
    const smokeOpacity = useSharedValue(0);
    const sparkle1 = useSharedValue(0);
    const sparkle2 = useSharedValue(0);
    const sparkle3 = useSharedValue(0);
    const sunPulse = useSharedValue(1);
    const cloudDrift = useSharedValue(0);

    // Cloud drift loop
    useEffect(() => {
        cloudDrift.value = withRepeat(
            withTiming(20, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
        sunPulse.value = withRepeat(
            withSequence(
                withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ), -1, false
        );
    }, []);

    // Plant bounce on stage change
    useEffect(() => {
        plantScale.value = withSequence(
            withTiming(1.15, { duration: 300 }),
            withSpring(1, { damping: 4, stiffness: 100 })
        );
        plantBounce.value = withSequence(
            withTiming(-8, { duration: 200 }),
            withSpring(0, { damping: 6 })
        );
    }, [plantStage]);

    // Water animation
    useEffect(() => {
        if (waterAnim) {
            waterDrop1.value = 0;
            waterDrop2.value = 0;
            waterDrop3.value = 0;
            waterDrop1.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) }), 3, false);
            waterDrop2.value = withDelay(200, withRepeat(withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) }), 3, false));
            waterDrop3.value = withDelay(400, withRepeat(withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) }), 3, false));
        } else {
            waterDrop1.value = 0;
            waterDrop2.value = 0;
            waterDrop3.value = 0;
        }
    }, [waterAnim]);

    // Smoke animation
    useEffect(() => {
        if (smokeAnim) {
            smokeRise.value = 0;
            smokeOpacity.value = 0;
            smokeOpacity.value = withSequence(
                withTiming(0.7, { duration: 500 }),
                withDelay(1500, withTiming(0, { duration: 800 }))
            );
            smokeRise.value = withTiming(1, { duration: 2800, easing: Easing.out(Easing.ease) });
        } else {
            smokeOpacity.value = 0;
        }
    }, [smokeAnim]);

    // Sparkle animation
    useEffect(() => {
        if (sparkleAnim) {
            sparkle1.value = 0; sparkle2.value = 0; sparkle3.value = 0;
            sparkle1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })), 4, false);
            sparkle2.value = withDelay(150, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })), 4, false));
            sparkle3.value = withDelay(300, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })), 4, false));
            // Sun gets brighter
            sunPulse.value = withSequence(
                withTiming(1.3, { duration: 600 }),
                withDelay(1500, withSpring(1))
            );
        }
    }, [sparkleAnim]);

    // ── Animated styles ──
    const plantAnimStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: plantScale.value },
            { translateY: plantBounce.value },
        ],
    }));

    const cloudStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: cloudDrift.value }],
    }));

    const leafColor = smokeAnim ? '#6B8E6B' : plantStage >= 3 ? '#2ECC71' : '#7EC8A0';
    const sunB = 0.7 + plantStage * 0.075;

    // ── Render ──
    return (
        <View style={{ borderRadius: 12, overflow: 'hidden' }}>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <Defs>
                    <RadialGradient id="sunGlow" cx="85%" cy="15%" r="25%">
                        <Stop offset="0%" stopColor="#FFF176" stopOpacity={String(sunB)} />
                        <Stop offset="100%" stopColor="#FFF176" stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* Sky gradient */}
                <Rect x="0" y="0" width={String(W)} height={String(H)} fill="#87CEEB" rx="12" />
                <Rect x="0" y="0" width={String(W)} height={String(H * 0.4)} fill="#A8D8FF" rx="12" opacity="0.5" />

                {/* Clouds */}
                <Ellipse cx="55" cy="38" rx="32" ry="14" fill="rgba(255,255,255,0.85)" />
                <Ellipse cx="78" cy="32" rx="26" ry="12" fill="rgba(255,255,255,0.9)" />
                <Ellipse cx="42" cy="42" rx="20" ry="10" fill="rgba(255,255,255,0.7)" />
                <Ellipse cx={String(W - 75)} cy="48" rx="30" ry="13" fill="rgba(255,255,255,0.75)" />
                <Ellipse cx={String(W - 55)} cy="42" rx="22" ry="11" fill="rgba(255,255,255,0.85)" />

                {/* Sun */}
                <Circle cx={String(W - 50)} cy="38" r="24" fill="#FFD93D" opacity={String(sunB)} />
                <Circle cx={String(W - 50)} cy="38" r="38" fill="url(#sunGlow)" />

                {/* Sun rays */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const cx = W - 50;
                    const cy = 38;
                    const x1 = cx + Math.cos(rad) * 28;
                    const y1 = cy + Math.sin(rad) * 28;
                    const x2 = cx + Math.cos(rad) * 36;
                    const y2 = cy + Math.sin(rad) * 36;
                    return <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#FFD93D" strokeWidth="2" opacity={String(0.3 + plantStage * 0.1)} strokeLinecap="round" />;
                })}

                {/* Ground layers */}
                <Path d={`M0 ${H - 65} Q${W * 0.25} ${H - 75} ${W * 0.5} ${H - 62} Q${W * 0.75} ${H - 50} ${W} ${H - 60} L${W} ${H} L0 ${H} Z`} fill="#7EC8A0" />
                <Path d={`M0 ${H - 35} Q${W * 0.3} ${H - 40} ${W * 0.6} ${H - 32} Q${W * 0.8} ${H - 28} ${W} ${H - 35} L${W} ${H} L0 ${H} Z`} fill="#5C4033" />
                <Rect x="0" y={String(H - 15)} width={String(W)} height="15" fill="#4A3728" />

                {/* Grass tufts */}
                {[15, 45, 80, 120, 155, 190, 225, 260, 290].map((x, i) => (
                    <G key={i}>
                        <Path d={`M${x} ${H - 60} Q${x + 2} ${H - 78} ${x + 5} ${H - 60}`} fill="#5CB85C" />
                        <Path d={`M${x + 6} ${H - 60} Q${x + 9} ${H - 72} ${x + 12} ${H - 60}`} fill="#4CAF50" />
                    </G>
                ))}

                {/* Small flowers in grass */}
                {plantStage >= 3 && [35, 110, 200, 270].map((x, i) => (
                    <G key={`f${i}`}>
                        <Circle cx={String(x)} cy={String(H - 63)} r="3" fill={['#FF6F61', '#FFB7B2', '#FFDAC1', '#C3B1E1'][i]} />
                        <Circle cx={String(x)} cy={String(H - 63)} r="1.5" fill="#FFD700" />
                    </G>
                ))}

                {/* ── SMOKE CLOUDS ── */}
                {smokeAnim && (
                    <G opacity="0.6">
                        <Ellipse cx={String(W / 2 - 25)} cy={String(H * 0.35)} rx="30" ry="14" fill="#8D8D8D" />
                        <Ellipse cx={String(W / 2 + 10)} cy={String(H * 0.28)} rx="24" ry="12" fill="#A0A0A0" />
                        <Ellipse cx={String(W / 2 - 5)} cy={String(H * 0.42)} rx="20" ry="10" fill="#787878" />
                        <Ellipse cx={String(W / 2 + 30)} cy={String(H * 0.35)} rx="18" ry="9" fill="#999" />
                    </G>
                )}

                {/* ── PLANT ── */}
                <G transform={`translate(${W / 2}, ${H - 62})`}>
                    {/* Soil mound */}
                    <Ellipse cx="0" cy="2" rx="20" ry="6" fill="#6B4226" />

                    {/* Trunk/Stem */}
                    {plantStage >= 1 && (
                        <Rect x="-3" y={String(-10 - plantStage * 20)} width="6" height={String(12 + plantStage * 20)} fill="#5D4037" rx="3" />
                    )}

                    {/* Stage 0: Seed */}
                    {plantStage === 0 && (
                        <G>
                            <Ellipse cx="0" cy="-3" rx="8" ry="5" fill="#8B5E3C" />
                            <Ellipse cx="0" cy="-5" rx="4" ry="2" fill="#A0724A" />
                            <Path d="M0 -8 Q2 -14 0 -16" stroke="#7EC8A0" strokeWidth="1.5" fill="none" />
                        </G>
                    )}

                    {/* Stage 1: Sprout */}
                    {plantStage >= 1 && (
                        <G>
                            <Path d={`M0 -28 Q-18 -32 -14 -24`} fill={leafColor} />
                            <Path d={`M0 -28 Q18 -32 14 -24`} fill={leafColor} />
                            <Path d={`M0 -30 Q-12 -38 -8 -28`} fill={leafColor} opacity="0.8" />
                            <Path d={`M0 -30 Q12 -38 8 -28`} fill={leafColor} opacity="0.8" />
                        </G>
                    )}

                    {/* Stage 2: Small plant */}
                    {plantStage >= 2 && (
                        <G>
                            <Path d={`M-2 -45 Q-28 -50 -20 -40`} fill={leafColor} />
                            <Path d={`M2 -45 Q28 -50 20 -40`} fill={leafColor} />
                            <Ellipse cx="0" cy="-52" rx="14" ry="10" fill={leafColor} />
                            <Ellipse cx="-10" cy="-48" rx="10" ry="7" fill={leafColor} opacity="0.9" />
                            <Ellipse cx="10" cy="-48" rx="10" ry="7" fill={leafColor} opacity="0.9" />
                        </G>
                    )}

                    {/* Stage 3: Bush */}
                    {plantStage >= 3 && (
                        <G>
                            <Ellipse cx="-22" cy="-62" rx="18" ry="12" fill={leafColor} />
                            <Ellipse cx="22" cy="-62" rx="18" ry="12" fill={leafColor} />
                            <Ellipse cx="0" cy="-72" rx="22" ry="14" fill={leafColor} />
                            <Ellipse cx="-14" cy="-76" rx="14" ry="10" fill={leafColor} opacity="0.9" />
                            <Ellipse cx="14" cy="-76" rx="14" ry="10" fill={leafColor} opacity="0.9" />
                            <Ellipse cx="0" cy="-80" rx="16" ry="10" fill={leafColor} opacity="0.85" />
                            {/* Branch detail */}
                            <Path d={`M-3 -55 Q-20 -58 -18 -50`} stroke="#5D4037" strokeWidth="2" fill="none" />
                            <Path d={`M3 -55 Q20 -58 18 -50`} stroke="#5D4037" strokeWidth="2" fill="none" />
                        </G>
                    )}

                    {/* Stage 4: Full Tree */}
                    {plantStage >= 4 && (
                        <G>
                            {/* Thick trunk */}
                            <Rect x="-5" y="-90" width="10" height="92" fill="#5D4037" rx="4" />
                            <Rect x="-3" y="-90" width="6" height="92" fill="#6D4C41" rx="3" />

                            {/* Crown */}
                            <Ellipse cx="0" cy="-95" rx="35" ry="22" fill="#27AE60" />
                            <Ellipse cx="-22" cy="-88" rx="22" ry="16" fill="#2ECC71" />
                            <Ellipse cx="22" cy="-88" rx="22" ry="16" fill="#2ECC71" />
                            <Ellipse cx="0" cy="-105" rx="26" ry="16" fill="#27AE60" />
                            <Ellipse cx="-15" cy="-100" rx="18" ry="12" fill="#2ECC71" opacity="0.9" />
                            <Ellipse cx="15" cy="-100" rx="18" ry="12" fill="#2ECC71" opacity="0.9" />
                            <Ellipse cx="0" cy="-112" rx="20" ry="12" fill="#27AE60" opacity="0.8" />

                            {/* Highlight */}
                            <Ellipse cx="-8" cy="-100" rx="12" ry="8" fill="#58D68D" opacity="0.4" />

                            {/* Fruits / Flowers */}
                            <Circle cx="-18" cy="-95" r="4" fill="#FF6F61" />
                            <Circle cx="15" cy="-88" r="4" fill="#FFB7B2" />
                            <Circle cx="0" cy="-112" r="3.5" fill="#FFDAC1" />
                            <Circle cx="-10" cy="-105" r="3" fill="#FF6F61" />
                            <Circle cx="20" cy="-100" r="3" fill="#C3B1E1" />
                            {/* Fruit detail */}
                            <Circle cx="-18" cy="-95" r="1.5" fill="#FF8A80" />
                            <Circle cx="15" cy="-88" r="1.5" fill="#FFCDD2" />
                        </G>
                    )}

                    {/* ── WATER DROPS ── */}
                    {waterAnim && (
                        <G>
                            <Path d="M-12 -20 Q-10 -28 -8 -20" fill="#74B9FF" opacity="0.9" />
                            <Circle cx="-10" cy="-18" r="2.5" fill="#74B9FF" opacity="0.7" />
                            <Path d="M6 -30 Q8 -38 10 -30" fill="#74B9FF" opacity="0.8" />
                            <Circle cx="8" cy="-28" r="2" fill="#74B9FF" opacity="0.6" />
                            <Path d="M-2 -12 Q0 -20 2 -12" fill="#74B9FF" opacity="0.7" />
                            <Circle cx="0" cy="-10" r="2" fill="#74B9FF" opacity="0.5" />
                            {/* Splash at base */}
                            <Path d="M-8 0 Q-6 -4 -4 0" fill="#74B9FF" opacity="0.5" />
                            <Path d="M4 0 Q6 -3 8 0" fill="#74B9FF" opacity="0.4" />
                        </G>
                    )}

                    {/* ── SPARKLES ── */}
                    {sparkleAnim && (
                        <G>
                            <Path d="M-30 -85 L-28 -92 L-26 -85 L-28 -78 Z" fill="#FFD700" />
                            <Path d="M25 -100 L27 -107 L29 -100 L27 -93 Z" fill="#FFD700" />
                            <Path d="M-5 -118 L-3 -125 L-1 -118 L-3 -111 Z" fill="#FFD700" />
                            <Path d="M15 -112 L17 -118 L19 -112 L17 -106 Z" fill="#FFF176" opacity="0.8" />
                            <Path d="M-20 -98 L-18 -104 L-16 -98 L-18 -92 Z" fill="#FFF176" opacity="0.7" />
                            {/* Small star dots */}
                            <Circle cx="-35" cy="-75" r="1.5" fill="#FFD700" opacity="0.9" />
                            <Circle cx="32" cy="-80" r="1.5" fill="#FFD700" opacity="0.8" />
                            <Circle cx="5" cy="-120" r="1.5" fill="#FFD700" opacity="0.9" />
                        </G>
                    )}
                </G>
            </Svg>

            {/* Animated overlay using RN Animated views */}
            {waterAnim && (
                <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.Text style={{ position: 'absolute', top: H * 0.15, fontSize: 24, opacity: 0.8 }}>💧</Animated.Text>
                </Animated.View>
            )}

            {sparkleAnim && (
                <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.Text style={{ position: 'absolute', top: H * 0.1, left: W * 0.2, fontSize: 18 }}>✨</Animated.Text>
                    <Animated.Text style={{ position: 'absolute', top: H * 0.05, right: W * 0.25, fontSize: 16 }}>⭐</Animated.Text>
                </Animated.View>
            )}

            {smokeAnim && (
                <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.Text style={{ position: 'absolute', top: H * 0.2, fontSize: 20, opacity: 0.6 }}>💨</Animated.Text>
                </Animated.View>
            )}
        </View>
    );
}
