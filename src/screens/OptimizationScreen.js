import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const OptimizationScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Optimization</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Detected Issues */}
      <View>
        <Text style={styles.sectionTitle}>Detected Issues</Text>
        <View style={styles.darkCard}>
          <View style={styles.issueItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.issueText}>Leaf decoloration detected</Text>
          </View>
          <View style={styles.issueItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.issueText}>Possible nitrogen diffecency</Text>
          </View>
        </View>
      </View>

      {/* AI Suggestion */}
      <View
        style={{
          marginTop: 24,
          paddingBottom: 16,
        }}
      >
        <Text style={styles.sectionTitle}>AI Suggestion</Text>
        <View style={styles.darkCard}>
          <View style={styles.suggestionContainer}>
            <View style={styles.suggestionHeader}>
              <View style={styles.locationPin}>
                <Ionicons name="location-outline" size={18} color="white" />
              </View>
              <Text style={styles.suggestionTitle}>
                Possible nitrogen diffecency
              </Text>
            </View>
            <Text style={styles.suggestionText}>
              This can be solved by applying more nutrients
            </Text>
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="leaf-outline" size={24} color="white" />
                <Text style={styles.actionText}>Fertilize</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    color: "#333",
  },
  darkCard: {
    backgroundColor: "#333",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "white",
    marginRight: 10,
  },
  issueText: {
    color: "white",
    fontSize: 16,
  },
  suggestionContainer: {
    width: "100%",
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationPin: {
    marginRight: 8,
  },
  suggestionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  suggestionText: {
    color: "white",
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4ade80",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "500",
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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

export default OptimizationScreen;
