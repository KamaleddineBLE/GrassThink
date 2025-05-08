import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";

// Assuming you have a data file with greenhouse data
import { chunkArray, greenhouses, sensorData } from "../constants/data";
import axios from "axios";
import SensorCard from "../components/Indicator";

const HistoricalDataScreen = ({ route, navigation }) => {
  const { paramType, paramName, fieldName } = route.params;
  const chunkedSensors = chunkArray(sensorData, 3);

  const [selectedGH, setSelectedGH] = useState(() => {
    if (fieldName === "Amizour Field") {
      return "sensor1"; // Default to sensor1, you can change this logic if needed
    }
    if (fieldName === "Mountain View") {
      return "sensor2";
    }
    return null;
  });
  const [timeRange, setTimeRange] = useState("week"); // day, week, month, year
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, current: 0 });
  const [paramsName, setParamsName] = useState(paramName);
  const [paramsType, setParamsType] = useState(paramType);
  const pickerRef = useRef();

  function open() {
    pickerRef.current.focus();
  }

  function close() {
    pickerRef.current.blur();
  }

  const aggregateDataForScreen = (data, maxPoints) => {
    const totalPoints = data.length;
    if (totalPoints <= maxPoints) return data;

    const bucketSize = Math.ceil(totalPoints / maxPoints);
    const aggregated = [];

    for (let i = 0; i < totalPoints; i += bucketSize) {
      const slice = data.slice(i, i + bucketSize);
      const avg =
        slice.reduce((sum, item) => sum + item.value, 0) / slice.length;
      const label = slice[Math.floor(slice.length / 2)].label;

      aggregated.push({
        value: parseFloat(avg.toFixed(1)),
        label,
        dataPointText: label,
      });
    }

    return aggregated;
  };

  // API endpoint for sensor data
  const API_BASE_URL = "http://192.168.45.158:5000/api";
  // const API_BASE_URL = "http://192.168.1.10:5000/api";

  // Fetch sensor data from the database based on selected parameters
  const fetchSensorData = async () => {
    try {
      setIsLoading(true);

      // Format the API endpoint based on selections
      const endpoint = `${API_BASE_URL}/sensor-data/${encodeURIComponent(
        selectedGH
      )}?timeRange=${encodeURIComponent(
        timeRange
      )}&paramName=${encodeURIComponent(
        paramsName
      )}&paramType=${encodeURIComponent(paramType)}`;

      console.log("Fetching data from:", endpoint); // Debugging line
      const response = await axios.get(endpoint);

      const responseData = await response.data;

      // Process the data for chart display
      processChartData(responseData.data, responseData.stats);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      Alert.alert(
        "Data Error",
        "Failed to fetch sensor data. Please try again later.",
        [{ text: "OK" }]
      );

      setChartData([]);
      setStats({ min: 0, max: 0, avg: 0, current: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Process the raw data into chart format and calculate statistics
  const processChartData = (rawData, apiStats) => {
    let aggregatedData = [];

    // Set max number of points based on screen width (e.g., 50pts for 400px)
    const screenWidth = Dimensions.get("window").width;
    console.log("Screen width:", screenWidth); // Debugging line
    const maxDisplayPoints = Math.floor(screenWidth / 60); // e.g., 8px per point
    console.log("Max display points:", maxDisplayPoints); // Debugging line

    if (timeRange === "day") {
      // Hourly aggregation
      const hourlyData = {};
      rawData.forEach((item) => {
        const date = new Date(item.timestamp);
        const hour = date.getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { sum: 0, count: 0 };
        }
        hourlyData[hour].sum += parseFloat(item[paramName]);
        hourlyData[hour].count += 1;
      });

      aggregatedData = Object.keys(hourlyData).map((hour) => ({
        value: parseFloat(
          (hourlyData[hour].sum / hourlyData[hour].count).toFixed(1)
        ),
        label: `${hour}:00`,
        dataPointText: `${hour}:00`,
      }));
    } else if (timeRange === "week") {
      // Daily aggregation
      const dailyData = {};
      rawData.forEach((item) => {
        const date = new Date(item.timestamp);
        const day = date.toISOString().split("T")[0];

        if (!dailyData[day]) {
          dailyData[day] = { sum: 0, count: 0 };
        }
        dailyData[day].sum += parseFloat(item[paramName]);
        dailyData[day].count += 1;
      });

      aggregatedData = Object.keys(dailyData).map((day) => ({
        value: parseFloat(
          (dailyData[day].sum / dailyData[day].count).toFixed(1)
        ),
        label: day.split("-")[2], // Get only the day part from the date string
        dataPointText: new Date(day).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));
    } else {
      // Use raw data
      aggregatedData = rawData.map((item) => ({
        value: parseFloat(item[paramName]),
        label: formatLabel(item.timestamp, timeRange),
        dataPointText: formatLabel(item.timestamp, timeRange),
      }));
    }

    // Apply adaptive aggregation
    const displayData = aggregateDataForScreen(
      aggregatedData,
      maxDisplayPoints
    );
    setChartData(displayData);

    console.log("Aggregated data:", displayData); // Debugging line

    // Use pre-calculated stats from API if available, otherwise calculate locally
    if (apiStats && Object.keys(apiStats).length > 0) {
      setStats({
        min: parseFloat(apiStats.min.toFixed(1)),
        max: parseFloat(apiStats.max.toFixed(1)),
        avg: parseFloat(apiStats.avg.toFixed(1)),
        current: parseFloat(apiStats.current.toFixed(1)),
      });
    } else if (aggregatedData.length > 0) {
      // Fallback to local calculation if API doesn't provide stats
      const values = aggregatedData.map((item) => item.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = parseFloat(
        (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1)
      );
      const current = values[values.length - 1];

      setStats({ min, max, avg, current });
    } else {
      setStats({ min: 0, max: 0, avg: 0, current: 0 });
    }
  };

  // Format timestamp based on selected time range
  const formatLabel = (timestamp, range) => {
    const date = new Date(timestamp);

    switch (range) {
      case "day":
        return date.getHours() + ":00";
      case "week":
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[date.getDay()];
      case "month":
        return `${date.getDate()}/${date.getMonth() + 1}`;
      case "year":
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return months[date.getMonth()];
      default:
        return "";
    }
  };

  // Fetch data when parameters change
  useEffect(() => {
    fetchSensorData();
  }, [selectedGH, timeRange, paramName]);

  // Get the appropriate unit for the selected parameter
  const getUnit = () => {
    switch (paramName) {
      case "temperature":
        return "°C";
      case "humidity":
        return "%";
      case "windSpeed":
        return "km/h";
      case "soil":
        return "%";
      default:
        return "";
    }
  };

  // Map parameter names to display titles
  const titleMap = {
    temperature: "Temperature",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    soil: "Soil Moisture",
  };

  // Display stats in the UI
  const renderStats = () => {
    if (chartData.length === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MIN</Text>
          <Text style={styles.statValue}>
            {stats.min}
            {getUnit()}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MAX</Text>
          <Text style={styles.statValue}>
            {stats.max}
            {getUnit()}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>AVG</Text>
          <Text style={styles.statValue}>
            {stats.avg}
            {getUnit()}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>CURRENT</Text>
          <Text style={styles.statValue}>
            {stats.current}
            {getUnit()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {titleMap[paramName] || paramName} History
          </Text>
          <View style={{ width: 24 }} />
        </View>
        {/* Time Range Tabs */}
        <View style={styles.timeRangeContainer}>
          {["day", "week", "month", "year"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.timeButton,
                timeRange === r && styles.timeButtonActive,
              ]}
              onPress={() => setTimeRange(r)}
            >
              <Text
                style={[
                  styles.timeText,
                  timeRange === r && styles.timeTextActive,
                ]}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Greenhouse Picker */}
        <View style={styles.pickerContainerOuter}>
          <Picker
            ref={pickerRef}
            selectedValue={selectedGH}
            onValueChange={(itemValue) => setSelectedGH(itemValue)}
            style={styles.picker}
            prompt="Select Greenhouse"
            mode="dropdown"
          >
            {greenhouses.map((g) => (
              <Picker.Item key={g.id} label={g.name} value={g.sensorId} />
            ))}
          </Picker>
        </View>
        {/* Chart */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ade80" />
          </View>
        ) : chartData.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No data available</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <LineChart
              areaChart
              data={chartData}
              width={Dimensions.get("window").width - 32}
              height={240}
              color="#4ade80"
              thickness={2}
              noOfSections={6}
              startFillColor="rgba(74, 222, 128, 0.5)"
              endFillColor="rgba(74, 222, 128, 0)"
              startOpacity={0.5}
              endOpacity={0}
              initialSpacing={0}
              maxValue={Math.max(...chartData.map((d) => d.value)) + 5}
              minValue={Math.max(
                0,
                Math.min(...chartData.map((d) => d.value)) - 5
              )}
              yAxisColor="#ccc"
              yAxisThickness={1}
              rulesType="dashed"
              rulesColor="#e0e0e0"
              yAxisTextStyle={{ color: "#666" }}
              xAxisColor="#ccc"
              hideYAxisText={true}
              hideAxesAndRules={true}
              hideRules
              hideDataPoints={true}
              dataPointsColor="#8E44AD"
              dataPointsRadius={3}
              textColor="#c3c3c3"
              textFontSize={10}
              showTextOnDataPoints={false}
              showValuesAsDataPointsText={false}
              showFractionalValues={false}
              xAxisLabelTextStyle={{ color: "#c3c3c3", textAlign: "right" }}
              showXAxisLabels={true}
              rotateLabel={false}
              renderTooltip={(item) => {
                return (
                  <View
                    style={{
                      backgroundColor: "white",
                      padding: 8,
                      borderRadius: 4,
                      borderColor: "#8E44AD",
                      borderWidth: 1,
                    }}
                  >
                    <Text style={{ color: "#333" }}>
                      {item.label}: {item.value}
                      {getUnit()}
                    </Text>
                  </View>
                );
              }}
              backgroundColor="#fff"
              isAnimated
              curved
              animateOnDataChange
              animationDuration={1000}
              onDataChangeAnimationDuration={500}
              pointerConfig={{
                pointerStripHeight: 160,
                pointerStripColor: "lightgray",
                pointerStripWidth: 2,
                pointerColor: "#4ade80",
                strokeDashArray: [2, 5],
                radius: 6,
                pointerLabelWidth: 100,
                pointerLabelHeight: 90,
                activatePointersOnLongPress: true,
                autoAdjustPointerLabelPosition: false,
                pointerLabelComponent: (items) => {
                  return (
                    <View
                      style={{
                        height: 30,
                        width: 100,
                        justifyContent: "center",
                        marginTop: -30,
                        marginLeft: -40,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#f6f6f6",
                          borderRadius: 16,
                          padding: 4,
                        }}
                      >
                        <Text
                          style={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          {items[0].dataPointText}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 16,
                          backgroundColor: "white",
                        }}
                      >
                        <Text
                          style={{ fontWeight: "bold", textAlign: "center" }}
                        >
                          {items[0].value + getUnit()}
                        </Text>
                      </View>
                    </View>
                  );
                },
              }}
            />
          </View>
        )}
        {/* Stats Display */}
        {renderStats()}
        <FlatList
          data={chunkedSensors}
          keyExtractor={(_, index) => `page-${index}`}
          pagingEnabled
          nestedScrollEnabled={true}
          style={{
            // position: "absolute",
            // bottom: "12%",
            maxHeight: 120,
            width: "full",
          }}
          renderItem={({ item }) => (
            <View
              style={{
                height: 120,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                gap: "4%",
              }}
            >
              {item.map((sensor, i) => (
                <SensorCard
                  key={`${sensor.label}-${i}`}
                  value={sensor.value}
                  unit={sensor.unit}
                  label={sensor.label}
                  type="environment"
                  fieldName={fieldName}
                />
              ))}
            </View>
          )}
        />

        {/* Refresh Button */}
        {/* <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchSensorData}
        >
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#EAEAEA",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  timeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeButtonActive: { backgroundColor: "#4ade80" },
  timeText: { color: "#666", fontSize: 14 },
  timeTextActive: { color: "#fff", fontWeight: "600" },
  pickerContainerOuter: {
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 0.3,
    borderColor: "#ddd",
    overflow: "hidden",
    width: "50%",
  },
  picker: {
    height: 50,
  },
  chartContainer: {
    // marginBottom: 20,
  },
  loadingContainer: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataContainer: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  noDataText: {
    marginTop: 10,
    color: "#999",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statBox: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4ade80",
  },
  refreshButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4ade80",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default HistoricalDataScreen;
