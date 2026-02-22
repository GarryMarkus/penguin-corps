import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import FloatingChatButton from "../components/FloatingChatButton";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { GoalsProvider } from "../context/GoalsContext";
import { StepsProvider } from "../context/StepsContext";

import "../services/geofencing";

import { LPColors } from "../constants/theme";

const NavjivanTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: LPColors.primary,
    background: LPColors.bg,
    card: LPColors.surface,
    text: LPColors.text,
    border: LPColors.border,
    notification: LPColors.primary,
  },
};

function ProtectedNavigation() {
  const { token, loading, user } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    if (!token && !inAuthGroup && !inOnboarding) {
      router.replace("/auth/login");
    } else if (token && inAuthGroup && segments[1] !== "signup") {
      if (user?.isSmoker === false) {
        router.replace("/fitness");
      } else {
        router.replace("/(tabs)");
      }
    } else if (token && inOnboarding && user) {
      if (user?.isSmoker === false) {
        router.replace("/fitness");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [loading, token, segments, user]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: LPColors.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={LPColors.primary} />
        <Text style={{ color: LPColors.text, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {}
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />

      {}
      <Stack.Screen name="onboarding/questionnaire" />

      {}
      <Stack.Screen name="(tabs)" />

      {}
      <Stack.Screen name="fitness" />

      {}
      <Stack.Screen
        name="ai-coach"
        options={{
          presentation: "card",
          animation: "slide_from_bottom",
        }}
      />

      {}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "SamsungSans-Regular": require("../assets/fonts/SamsungSans-Regular.ttf"),
    "SamsungSans-Bold": require("../assets/fonts/SamsungSans-Bold.ttf"),
    "SamsungSans-Medium": require("../assets/fonts/SamsungSans-Medium.ttf"),
    "SamsungSans-Light": require("../assets/fonts/SamsungSans-Light.ttf"),
    "SamsungSans-Thin": require("../assets/fonts/SamsungSans-Thin.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: LPColors.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={LPColors.primary} />
        <Text style={{ color: LPColors.text, marginTop: 12 }}>
          Loading fonts...
        </Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <GoalsProvider>
        <StepsProvider>
          <ThemeProvider value={NavjivanTheme}>
            <View style={styles.container}>
              <ProtectedNavigation />
              <FloatingChatButton />
            </View>
            <StatusBar style="light" />
          </ThemeProvider>
        </StepsProvider>
      </GoalsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
