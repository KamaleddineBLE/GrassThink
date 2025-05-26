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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const CameraInsightScreen = ({ route, navigation }) => {
  const [prediction, setPrediction] = useState(null);
  const [displayImage, setDisplayImage] = useState(
    route.params?.imageUri || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Define AI insights for different deficiency classes (fallback)
  const defaultInsights = {
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
  const [insights, setInsights] = useState(defaultInsights.default);

  const pickAndUpload = async () => {
    try {
      setIsLoading(true);

      // 1. Pick a photo
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      // Check if the user canceled the picker
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        console.log("Selected image URI:", selectedImageUri);

        // Update the displayed image
        setDisplayImage(selectedImageUri);

        // 2. Prepare FormData for classification
        const data = new FormData();
        data.append("leaf", {
          uri: selectedImageUri,
          name: "leaf.jpg",
          type: "image/jpeg",
        });

        // 3. POST to your classify endpoint
        const classifyResponse = await fetch(
          "http://192.168.1.13:5000/api/classify",
          {
            method: "POST",
            body: data,
          }
        );

        const classifyResult = await classifyResponse.json();
        console.log("Prediction:", classifyResult);
        setPrediction(classifyResult);
        console.log(
          JSON.stringify({
            classification: classifyResult.class,
          })
        );
        // 4. Send classification to Azure OpenAI for analysis
        if (classifyResult && classifyResult.class) {
          const analysisResponse = await fetch(
            "http://192.168.1.13:5000/api/ai/analyze",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                classification: classifyResult.class,
              }),
            }
          );

          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json();
            console.log("Azure AI Analysis:", analysisResult);
            setAiAnalysis(analysisResult);

            // Update insights from AI analysis
            if (analysisResult[classifyResult.class]) {
              setInsights(analysisResult[classifyResult.class]);
            } else if (analysisResult.default) {
              setInsights(analysisResult.default);
            } else {
              // Fallback to local insights
              setInsights(
                defaultInsights[classifyResult.class] || defaultInsights.default
              );
            }
          } else {
            console.error("Analysis failed:", analysisResponse.statusText);
            // Use fallback insights
            setInsights(
              defaultInsights[classifyResult.class] || defaultInsights.default
            );
          }
        }
      }
    } catch (error) {
      console.error("Upload/Analysis error:", error);
      setInsights(defaultInsights.default);
    } finally {
      setIsLoading(false);
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

  const renderImageSection = () => {
    if (displayImage) {
      return (
        <Image
          source={{ uri: displayImage }}
          style={styles.plantImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <TouchableOpacity
        style={styles.imagePlaceholder}
        onPress={pickAndUpload}
        disabled={isLoading}
      >
        <View style={styles.placeholderContent}>
          <Ionicons
            name="camera-outline"
            size={48}
            color="#999"
            style={styles.placeholderIcon}
          />
          <Text style={styles.placeholderTitle}>Upload Plant Image</Text>
          <Text style={styles.placeholderSubtitle}>
            Tap to select an image from your gallery
          </Text>
          <View style={styles.placeholderBorder} />
        </View>
      </TouchableOpacity>
    );
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

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Plant Image or Placeholder */}
        {renderImageSection()}

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            isLoading && styles.uploadButtonDisabled,
          ]}
          onPress={pickAndUpload}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.uploadButtonText}>
                {displayImage ? "Upload Another Image" : "Upload Image"}
              </Text>
            </>
          )}
        </TouchableOpacity>

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

        {/* AI Summary (if available) */}
        {aiAnalysis && aiAnalysis.summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>AI Summary</Text>
            <Text style={styles.summaryText}>{aiAnalysis.summary}</Text>
          </View>
        )}

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
              style={[
                styles.optimizeButton,
                (!prediction || prediction.class === "FN") &&
                  styles.optimizeButtonDisabled,
              ]}
              onPress={() =>
                navigation.navigate("Optimization", {
                  deficiencyClass: prediction?.class,
                  aiAnalysis: aiAnalysis,
                  prediction: prediction,
                  GhId: "1",
                })
              }
              disabled={!prediction || prediction.class === "FN"}
            >
              <Text
                style={[
                  styles.optimizeText,
                  (!prediction || prediction.class === "FN") &&
                    styles.optimizeTextDisabled,
                ]}
              >
                Optimize
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={
                  !prediction || prediction.class === "FN" ? "#666" : "#4ade80"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32, // extra space at bottom for scroll comfort
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
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
  imagePlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  placeholderBorder: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  insightsContainer: {
    paddingVertical: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
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
  optimizeButtonDisabled: {
    opacity: 0.5,
  },
  optimizeText: {
    color: "#4ade80",
    fontSize: 14,
    marginRight: 4,
  },
  optimizeTextDisabled: {
    color: "#666",
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
  summaryCard: {
    backgroundColor: "#e7f3ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4ade80",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  summaryText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: "#4ade80",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  uploadButtonDisabled: {
    backgroundColor: "#ccc",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CameraInsightScreen;
