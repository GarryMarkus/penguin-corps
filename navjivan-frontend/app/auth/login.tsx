import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LPColors } from "../../constants/theme";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";

const logoImage = require("../../assets/images/logo.png");

interface AuthResponse {
  token: string;
  user: any;
}

export default function LoginScreen() {
  const router = useRouter();
  const auth: any = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await API.post<AuthResponse>("/auth/login", { email, password });
      await auth.loginUser(res.data.user, res.data.token);
      if (res.data.user.isSmoker === false) {
        router.replace("/fitness");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed - Check your connection");

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <View style={styles.headerContainer}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your quit journey</Text>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={LPColors.textGray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={LPColors.textGray}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={LPColors.textGray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={LPColors.textGray}
            secureTextEntry
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity onPress={onLogin} disabled={loading}>
          <LinearGradient
            colors={[LPColors.primary, '#004d2c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{loading ? "Signing in..." : "Login"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Link href="/auth/signup" asChild>
          <TouchableOpacity>
            <Text style={styles.switchText}>Don't have an account? <Text style={{ fontWeight: 'bold', color: LPColors.primary }}>Sign Up</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: "center", padding: 24 },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: { color: LPColors.text, fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { color: LPColors.textGray, fontSize: 16, textAlign: "center" },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LPColors.surfaceLight,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: { marginLeft: 16, marginRight: 8 },
  input: { flex: 1, padding: 16, color: LPColors.text, fontSize: 16 },

  button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },

  switchText: { color: LPColors.textGray, marginTop: 24, textAlign: "center", fontSize: 14 },
  error: { color: "#FF3B30", textAlign: "center", marginBottom: 16 },
});
