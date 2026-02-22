import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { LPColors } from '../../constants/theme';

export default function FitnessTabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: LPColors.coral,
                tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: '#16213E',
                    borderTopColor: 'rgba(255,107,107,0.15)',
                    borderTopWidth: 1,
                    height: 80,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: 4,
                    letterSpacing: 0.5,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'game-controller' : 'game-controller-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="diet"
                options={{
                    title: 'Diet',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'restaurant' : 'restaurant-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="padyatra"
                options={{
                    title: 'Padyatra',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'walk' : 'walk-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="geofencing"
                options={{
                    title: 'Geofencing',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'map' : 'map-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="partner"
                options={{
                    title: 'Partner',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'heart' : 'heart-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Community',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'people' : 'people-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'person' : 'person-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
