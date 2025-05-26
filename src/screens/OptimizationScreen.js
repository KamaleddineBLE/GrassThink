import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  Image,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import fan from "../assets/fan.png";
import tap from "../assets/tap.png";
import roof from "../assets/roof.png";
import lamp from "../assets/lamp.png";

import { ref, set, get } from "firebase/database";
import { database } from "../services/firebase";

function ToggleButton({ Control, GhId, publish, control, setControl }) {
  const translateX = useSharedValue(6);

  // Fetch latest control state from Firebase on mount
  useEffect(() => {
    if (GhId) {
      const GhIdFirebase = GhId - 1;
      const controlRef = ref(database, `${GhIdFirebase}/control`);
      get(controlRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setControl(snapshot.val());
            console.log("🔥 Control fetched from Firebase:", snapshot.val());
          } else {
            console.log(
              "ℹ️ No control data found for greenhouse:",
              GhIdFirebase
            );
          }
        })
        .catch((error) => console.error("❌ Error fetching control:", error));
    }
  }, [GhId]);

  // Animate toggle
  useEffect(() => {
    translateX.value = withTiming(control.autoMode ? 60 : 6, { duration: 200 });
  }, [control.autoMode]);

  const publishControl = (newControl) => {
    const filteredControl = Object.fromEntries(
      Object.entries(newControl).filter(([_, v]) => v !== undefined)
    );

    setControl(filteredControl);

    // 1. Publish to MQTT
    if (publish) {
      publish(`greenhouse/${GhId}/control`, filteredControl);
      console.log("✅ MQTT published:", filteredControl);
    }

    // 2. Update Firebase
    const GhIdFirebase = GhId - 1;
    const controlRef = ref(database, `${GhIdFirebase}/control`);
    set(controlRef, filteredControl)
      .then(() => console.log("✅ Firebase updated"))
      .catch((error) => console.error("❌ Firebase error:", error));
  };

  const toggleMode = () => {
    const updated = { ...control, autoMode: !control.autoMode };
    publishControl(updated);
  };

  const toggleDevice = (device) => {
    const updated = { ...control, [device]: !control[device] };
    publishControl(updated);
  };

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.toggleContainer}>
      <Pressable
        onPress={toggleMode}
        style={[
          styles.toggleSwitch,
          {
            backgroundColor: control.autoMode ? "#4ade80" : "#333",
          },
        ]}
      >
        <Animated.View style={[styles.toggleCircle, circleStyle]}>
          <View
            style={[
              styles.toggleIndicator,
              {
                width: control.autoMode ? 2 : 6,
                height: control.autoMode ? 8 : 6,
                backgroundColor: control.autoMode ? "#4ade80" : "#333",
                borderRadius: control.autoMode ? 4 : 3,
              },
            ]}
          />
        </Animated.View>

        <View style={styles.toggleTextContainer}>
          <Text
            style={[
              styles.toggleText,
              {
                marginLeft: control.autoMode ? 16 : 24,
              },
            ]}
          >
            {control.autoMode ? "Auto" : "Manual"}
          </Text>
        </View>
      </Pressable>

      {/* {!control.autoMode && (
        <View style={styles.controlPanel}>
          <ControlButton
            icon={lamp}
            active={control.light}
            onPress={() => toggleDevice("light")}
          />
          <ControlButton
            icon={fan}
            active={control.fan}
            onPress={() => toggleDevice("fan")}
          />
          <ControlButton
            icon={tap}
            active={control.pump}
            onPress={() => toggleDevice("pump")}
          />
          <ControlButton
            icon={roof}
            active={control.roof}
            onPress={() => toggleDevice("roof")}
          />
        </View>
      )} */}
    </View>
  );
}

function ControlButton({ icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.controlButton, { opacity: active ? 1 : 0.4 }]}
      onPress={onPress}
    >
      <Image source={icon} style={styles.controlIcon} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const OptimizationScreen = ({ route, navigation }) => {
  const { deficiencyClass, aiAnalysis, prediction, GhId, publish } =
    route.params || {};

  const [control, setControl] = useState({
    autoMode: false,
    pump: true,
    fan: true,
    light: true,
    roof: true,
  });

  // Fetch latest control state from Firebase on mount
  useEffect(() => {
    if (GhId) {
      const GhIdFirebase = GhId - 1;
      const controlRef = ref(database, `${GhIdFirebase}/control`);
      get(controlRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setControl(snapshot.val());
            console.log("🔥 Control fetched from Firebase:", snapshot.val());
          } else {
            console.log(
              "ℹ️ No control data found for greenhouse:",
              GhIdFirebase
            );
          }
        })
        .catch((error) => console.error("❌ Error fetching control:", error));
    }
  }, [GhId]);

  // Default fallback data
  const defaultIssues = [
    { id: 1, issue: "No specific issues detected", severity: "low" },
  ];

  const defaultRecommendation = "Continue monitoring plant health regularly.";

  const defaultDeviceActions = {
    Fan: "Maintain current ventilation settings",
    Light: "Continue with existing lighting schedule",
    Pump: "Maintain regular watering schedule",
    Roof: "Keep current roof configuration",
  };

  // Get data from AI analysis or use defaults
  const issues = aiAnalysis?.[deficiencyClass] || defaultIssues;
  const recommendation = aiAnalysis?.recommendation || defaultRecommendation;
  const deviceActions = aiAnalysis?.device_actions || defaultDeviceActions;
  const mqttControl = aiAnalysis?.mqtt_control;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "#ff6b6b";
      case "medium":
        return "#ffd166";
      case "low":
        return "#4ade80";
      default:
        return "white";
    }
  };

  const getDeviceIcon = (device) => {
    switch (device.toLowerCase()) {
      case "fan":
        return "fan-outline";
      case "light":
        return "bulb-outline";
      case "pump":
        return "water-outline";
      case "roof":
        return "home-outline";
      default:
        return "settings-outline";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Optimization</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Control Toggle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Control Mode</Text>
          <View style={styles.controlCard}>
            <ToggleButton
              Control={control}
              GhId={GhId}
              publish={publish}
              control={control}
              setControl={setControl}
            />
            <Text style={styles.controlDescription}>
              {control.autoMode
                ? "AI is automatically optimizing device settings based on plant analysis"
                : "Manual control - adjust individual devices as needed"}
            </Text>
          </View>
        </View>

        {/* Classification Results */}
        {prediction && (
          <View style={styles.classificationCard}>
            <Text style={styles.sectionTitle}>Classification Results</Text>
            <Text style={styles.classificationText}>
              {prediction.class === "FN"
                ? "No deficiency detected"
                : `${prediction.class.replace("-", "")} Deficiency`}
            </Text>
            <Text style={styles.confidenceText}>
              Confidence: {(prediction.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        {/* Detected Issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Issues</Text>
          <View style={styles.darkCard}>
            {issues.map((item, index) => (
              <View key={item.id || index} style={styles.issueItem}>
                <View
                  style={[
                    styles.bulletPoint,
                    { backgroundColor: getSeverityColor(item.severity) },
                  ]}
                />
                <Text style={styles.issueText}>{item.issue}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Recommendation</Text>
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb-outline" size={20} color="#4ade80" />
              <Text style={styles.recommendationTitle}>Smart Suggestion</Text>
            </View>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        </View>

        {/* Device Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Status</Text>
          <View style={styles.deviceStatusGrid}>
            {Object.entries(deviceActions).map(([device, action]) => (
              <View key={device} style={styles.deviceStatusCard}>
                <View style={styles.deviceStatusHeader}>
                  <Ionicons
                    name={getDeviceIcon(device)}
                    size={20}
                    color={control[device.toLowerCase()] ? "#4ade80" : "#666"}
                  />
                  <Text style={styles.deviceStatusName}>{device}</Text>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: control[device.toLowerCase()]
                          ? "#4ade80"
                          : "#666",
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {control[device.toLowerCase()] ? "ON" : "OFF"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.deviceStatusAction}>{action}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Control Summary */}
        {mqttControl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Settings</Text>
            <View style={styles.controlSummaryCard}>
              <Text style={styles.controlSummaryText}>
                Based on AI analysis, the following device settings are
                recommended:
              </Text>
              <View style={styles.controlGrid}>
                {Object.entries(mqttControl).map(([device, state]) => (
                  <View key={device} style={styles.controlItem}>
                    <Ionicons
                      name={getDeviceIcon(device)}
                      size={16}
                      color={state ? "#4ade80" : "#666"}
                    />
                    <Text
                      style={[
                        styles.controlLabel,
                        { color: state ? "#4ade80" : "#666" },
                      ]}
                    >
                      {device.charAt(0).toUpperCase() + device.slice(1)}:{" "}
                      {state ? "ON" : "OFF"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    color: "#333",
  },
  // Toggle Button Styles
  toggleContainer: {
    alignItems: "center",
    position: "relative",
  },
  toggleSwitch: {
    width: 80,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  toggleCircle: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleIndicator: {
    borderRadius: 2,
  },
  toggleTextContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  toggleText: {
    fontWeight: "600",
    fontSize: 10,
    color: "white",
  },
  controlPanel: {
    width: 48,
    height: 160,
    alignItems: "center",
    paddingTop: 20,
    backgroundColor: "#333",
    borderRadius: 12,
    position: "absolute",
    top: 16,
    left: 24,
    marginTop: -4,
    zIndex: 0,
    gap: 8,
  },
  controlButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  controlIcon: {
    width: 12,
    height: 14,
  },
  controlCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    maxWidth: 250,
  },
  classificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  classificationText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: "#666",
  },
  darkCard: {
    backgroundColor: "#333",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4ade80",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  issueText: {
    color: "white",
    fontSize: 16,
  },
  deviceStatusGrid: {
    gap: 12,
  },
  deviceStatusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  deviceStatusName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  deviceStatusAction: {
    fontSize: 14,
    color: "#666",
    marginLeft: 28,
  },
  controlSummaryCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0ea5e9",
  },
  controlSummaryText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  controlGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  controlItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
});

export default OptimizationScreen;
