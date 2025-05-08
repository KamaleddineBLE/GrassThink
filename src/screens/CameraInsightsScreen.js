import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import images from "../constants/images";

const CameraInsightScreen = ({ route, navigation }) => {
  // Sample data - in a real app this would come from your image analysis service
  const [insights, setInsights] = useState([
    { id: 1, issue: "Leaf decoloration detected", severity: "medium" },
    { id: 2, issue: "Possible nitrogen diffecency", severity: "high" },
  ]);

  // Image from route params or default
  const { imageUri } = route.params || {
    imageUri: images.greenhouse,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Camera Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Plant Image */}
      <Image source={imageUri} style={styles.plantImage} resizeMode="cover" />

      {/* AI Insights Section */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>AI Insights</Text>

        <View style={styles.insightCard}>
          {insights.map((item) => (
            <View key={item.id} style={styles.insightItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.insightText}>{item.issue}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.optimizeButton}
            onPress={() => navigation.navigate("Optimization")}
          >
            <Text className="color-green-400" style={styles.optimizeText}>
              Optimize
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#4ade80" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="grid-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
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
  plantImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  insightsContainer: {
    paddingVertical: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    color: "#333",
  },
  insightCard: {
    backgroundColor: "#333",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
    marginRight: 10,
  },
  insightText: {
    color: "white",
    fontSize: 16,
  },
  optimizeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 8,
  },
  optimizeText: {
    // color: "#22d1ee",
    fontSize: 14,
    marginRight: 4,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 40,
  },
});

export default CameraInsightScreen;
