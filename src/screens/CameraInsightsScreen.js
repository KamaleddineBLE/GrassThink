import React, { useState } from "react";
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
import images from "../constants/images";
import * as ImagePicker from "expo-image-picker";
import { launchImageLibrary } from "react-native-image-picker";

const CameraInsightScreen = ({ route, navigation }) => {
  const [prediction, setPrediction] = useState(null);
  const [displayImage, setDisplayImage] = useState(
    route.params?.imageUri || images.greenhouse
  );

  // Define AI insights for different deficiency classes
  const deficiencyInsights = {
    "-K": [
      { id: 1, issue: "Potassium deficiency detected", severity: "high" },
      { id: 2, issue: "Yellowing leaf edges", severity: "medium" },
      { id: 3, issue: "Reduced fruit quality", severity: "high" },
    ],
    "-N": [
      { id: 1, issue: "Nitrogen deficiency detected", severity: "high" },
      { id: 2, issue: "Yellowing of older leaves", severity: "high" },
      { id: 3, issue: "Stunted growth", severity: "medium" },
    ],
    "-P": [
      { id: 1, issue: "Phosphorus deficiency detected", severity: "medium" },
      {
        id: 2,
        issue: "Dark green leaves with purple tint",
        severity: "medium",
      },
      { id: 3, issue: "Delayed maturity", severity: "high" },
    ],
    FN: [
      { id: 1, issue: "No deficiency detected", severity: "low" },
      { id: 2, issue: "Plant appears healthy", severity: "low" },
    ],
    default: [
      { id: 1, issue: "Analysis pending", severity: "medium" },
      {
        id: 2,
        issue: "Upload an image for detailed insights",
        severity: "medium",
      },
    ],
  };

  // Initialize insights with default
  const [insights, setInsights] = useState(deficiencyInsights.default);

  const pickAndUpload = async () => {
    // 1. Pick a photo
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      // Check if the user canceled the picker
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        console.log("Selected image URI:", selectedImageUri);

        // Update the displayed image
        setDisplayImage(selectedImageUri);

        // 2. Prepare FormData
        const data = new FormData();
        data.append("leaf", {
          uri: selectedImageUri,
          name: "leaf.jpg",
          type: "image/jpeg",
        });
        console.log("FormData prepared:", data);

        // 3. POST to your classify endpoint
        fetch("http://192.168.231.158:5000/api/classify", {
          method: "POST",
          body: data,
        })
          .then((res) => res.json())
          .then((json) => {
            // e.g. json = { class: '-N', confidence: 0.96 }
            console.log("Prediction:", json);
            setPrediction(json);

            // Update insights based on prediction class
            if (json && json.class && deficiencyInsights[json.class]) {
              setInsights(deficiencyInsights[json.class]);
            } else {
              setInsights(deficiencyInsights.default);
            }
          })
          .catch((error) => {
            console.error("Upload error:", error);
            setInsights(deficiencyInsights.default);
          });
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  // Helper function to get severity color
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
      <Image
        source={
          typeof displayImage === "string"
            ? { uri: displayImage }
            : displayImage
        }
        style={styles.plantImage}
        resizeMode="cover"
      />

      {/* AI Insights Section */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>AI Insights</Text>

        <View style={styles.insightCard}>
          {insights.map((item) => (
            <View key={item.id} style={styles.insightItem}>
              <View
                style={[
                  styles.bulletPoint,
                  { backgroundColor: getSeverityColor(item.severity) },
                ]}
              />
              <Text style={styles.insightText}>{item.issue}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.optimizeButton}
            onPress={() =>
              navigation.navigate("Optimization", {
                deficiencyClass: prediction?.class,
              })
            }
          >
            <Text style={styles.optimizeText}>Optimize</Text>
            <Ionicons name="chevron-forward" size={16} color="#4ade80" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Prediction Result */}
      {prediction && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Analysis Results:</Text>
          <Text style={styles.resultText}>
            {prediction.class === "FN"
              ? "No deficiency detected"
              : `Deficiency: ${prediction.class.replace("-", "")}`}
          </Text>
          <Text style={styles.resultText}>
            Confidence: {(prediction.confidence * 100).toFixed(1)}%
          </Text>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={pickAndUpload}>
        <Text style={styles.uploadButtonText}>Upload Image</Text>
      </TouchableOpacity>
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
    color: "#4ade80",
    fontSize: 14,
    marginRight: 4,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#555",
  },
  uploadButton: {
    backgroundColor: "#4ade80",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CameraInsightScreen;
