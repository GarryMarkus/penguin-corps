import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";

interface SignupResponse {
  user: any;
  token: string;
}

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

const PLACEHOLDER = "rgba(255,255,255,0.55)";

export default function SignupScreen() {
  const router = useRouter();
  const auth: any = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignup = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("[Signup] Starting signup process");

      if (!form.name || !form.email || !form.password) {
        setError("Please fill in all required fields (Name, Email, Password)");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };

      console.log("[Signup] Payload prepared for:", payload.email);

      const signupDataStr = JSON.stringify(payload);
      console.log("[Signup] Navigating to mode selection");

      // Go to mode selection first, then rest of onboarding
      router.push({
        pathname: "/onboarding/mode-selection",
        params: { signupData: signupDataStr },
      });
    } catch (err: any) {
      console.error("[Signup] Error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          { }
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={RFValue(38)} color="#000" />
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join Navjivan and start your journey
            </Text>
          </View>

          { }
          <View style={styles.inputBox}>
            <Ionicons
              name="person-outline"
              size={RFValue(18)}
              color={PLACEHOLDER}
            />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={PLACEHOLDER}
              style={styles.input}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons
              name="mail-outline"
              size={RFValue(18)}
              color={PLACEHOLDER}
            />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={PLACEHOLDER}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(t) => setForm({ ...form, email: t })}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons
              name="lock-closed-outline"
              size={RFValue(18)}
              color={PLACEHOLDER}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry
              style={styles.input}
              onChangeText={(t) => setForm({ ...form, password: t })}
            />
          </View>

          { }
          {error ? <Text style={styles.error}>{error}</Text> : null}

          { }
          <TouchableOpacity onPress={onSignup} activeOpacity={0.8}>
            <LinearGradient
              colors={["#FF6B6B", "#E85D5D"]}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          { }
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.switchText}>
              Already have an account?{" "}
              <Text style={{ color: "#FF6B6B", fontWeight: "bold" }}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },

  scroll: {
    paddingHorizontal: wp(7),
    paddingTop: hp(4),
    paddingBottom: hp(8),
  },

  header: {
    alignItems: "center",
    marginBottom: hp(4),
  },

  iconCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(2),
  },

  title: {
    color: "#fff",
    fontSize: RFValue(28),
    fontWeight: "bold",
    marginBottom: hp(0.8),
  },

  subtitle: {
    color: "#AAAAAA",
    fontSize: RFValue(14),
    textAlign: "center",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: wp(4),
    borderRadius: wp(3),
    height: hp(6.8),
    marginBottom: hp(2),
  },

  input: {
    flex: 1,
    marginLeft: wp(2),
    color: "#fff",
    fontSize: RFValue(15),
  },

  button: {
    paddingVertical: hp(2),
    borderRadius: wp(3),
    alignItems: "center",
    marginTop: hp(1),
  },

  buttonText: {
    color: "#000",
    fontSize: RFValue(17),
    fontWeight: "700",
  },

  error: {
    color: "#FF3B30",
    textAlign: "center",
    fontSize: RFValue(13),
    marginBottom: hp(1),
  },

  switchText: {
    color: "#888",
    marginTop: hp(3),
    textAlign: "center",
    fontSize: RFValue(13),
  },
});
