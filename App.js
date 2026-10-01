// App.js
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { ThemeProvider } from "./context/ThemeContext";

import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import MenuScreen from "./screens/MenuScreen";

import GameModeScreen from "./screens/GameModeScreen";
import EditModeScreen from "./screens/EditModeScreen";
import AddGameScreen from "./screens/AddGameScreen";
import EasyScreen from "./screens/EasyScreen";
import NormalScreen from "./screens/NormalScreen";
import HardScreen from "./screens/HardScreen";
import ScoreboardScreen from "./screens/ScoreboardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import CategoryManagementScreen from "./screens/CategoryManagementScreen";

// สร้าง Stack Navigator สำหรับจัดการการเปลี่ยนหน้า
const Stack = createNativeStackNavigator();

export default function App() {
  // ตั้งค่า Deep Linking เพื่อรองรับการกดลิงก์จากอีเมล (เช่น รีเซ็ตรหัสผ่าน)
  const linking = {
    prefixes: [Linking.createURL("/"), "promax0777://"],
    config: {
      screens: {
        ResetPassword: "reset",
      },
    },
  };

  return (
    <ThemeProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="GameMode" component={GameModeScreen} />
          <Stack.Screen name="EditMode" component={EditModeScreen} />
          <Stack.Screen name="AddGame" component={AddGameScreen} />
          <Stack.Screen name="Easy" component={EasyScreen} />
          <Stack.Screen name="Normal" component={NormalScreen} />
          <Stack.Screen name="Hard" component={HardScreen} />
          <Stack.Screen name="Scoreboard" component={ScoreboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
