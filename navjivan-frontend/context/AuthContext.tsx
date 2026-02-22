import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { setAuthToken } from "../services/api";
import { registerForPushNotificationsAsync } from "../services/notifications";

// Keys for user-specific data that should be cleared on logout/switch
const USER_DATA_KEYS = [
  "@daily_water",
  "@daily_water_date",
  "@daily_goals",
  "@daily_goals_date",
  "@streak_count",
  "@streak_last_date",
  "@health_data",
  "@completed_goals_history",
  "@fitness_level",
  "@saved_bmi",
  "@health_sync_enabled",
  "@geofence_zones",
  "@smoke_log",
  "@meal_log",
  "@last_user_id",
  "@padyatra_steps",
  "@padyatra_date",
  "@health_sync_data",
];

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginUser: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  loginUser: async () => { },
  logout: async () => { },
});

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setTokenValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        const savedToken = await AsyncStorage.getItem("token");

        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setTokenValue(savedToken);
          setAuthToken(savedToken);

          // Register for push notifications on load
          registerForPushNotificationsAsync();
        }
      } catch (err) {
        console.log("Error loading auth data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  const loginUser = async (userData: any, userToken: string) => {
    // Check if this is a different user than before
    const lastUserId = await AsyncStorage.getItem("@last_user_id");
    const isNewUser = lastUserId && lastUserId !== userData._id;
    const isFirstTimeUser = !lastUserId;
    
    // Clear previous user's data if switching accounts
    if (isNewUser || isFirstTimeUser) {
      console.log("[Auth] Clearing previous user data for new/different user");
      await Promise.all(
        USER_DATA_KEYS.map(key => AsyncStorage.removeItem(key))
      );
    }
    
    // Save current user ID for future comparison
    await AsyncStorage.setItem("@last_user_id", userData._id);
    
    setUser(userData);
    setTokenValue(userToken);
    setAuthToken(userToken);

    await AsyncStorage.setItem("user", JSON.stringify(userData));
    await AsyncStorage.setItem("token", userToken);

    // Register for push notifications on login
    registerForPushNotificationsAsync();
  };


  const logout = async () => {
    // Clear all user-specific data on logout
    console.log("[Auth] Clearing user data on logout");
    await Promise.all(
      USER_DATA_KEYS.map(key => AsyncStorage.removeItem(key))
    );
    
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setTokenValue(null);
    setUser(null);
    setAuthToken(null);
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("LOGOUT", logout);
    return () => subscription.remove();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        loginUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
