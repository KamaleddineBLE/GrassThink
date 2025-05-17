import React, { useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { MqttProvider } from "./src/services/mqttService";
import HomeScreen from "./src/screens/HomeScreen";
import ParameterDetailsScreen from "./src/screens/ParameterDetailsScreen";
import CameraInsightsScreen from "./src/screens/CameraInsightsScreen";
import OptimizationScreen from "./src/screens/OptimizationScreen";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";



// Prevent splash screen from auto-hiding
const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ParameterDetails"
            component={ParameterDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CameraInsights"
            component={CameraInsightsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Optimization"
            component={OptimizationScreen}
            options={{ headerShown: false }}
          />
          {/* Add other screens here */}
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
  );
}
