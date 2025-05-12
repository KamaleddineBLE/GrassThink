import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { LineChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  startAt,
  get,
  onValue,
} from "firebase/database";
import { database } from "../services/firebase";
import { chunkArray, greenhouses, sensorData } from "../constants/data";
import SensorCardParams from "../components/SensorCardParams";

const HistoricalDataScreen = ({ route, navigation }) => {
  const { paramType, paramName, fieldName } = route.params;

  const chunkedSensors = chunkArray(sensorData, 3);
  const [selectedParam, setSelectedParam] = useState(paramName);

  const [selectedGH, setSelectedGH] = useState(() => {
    if (fieldName === "Amizour Field") return "sensor1";
    if (fieldName === "Mountain View") return "sensor2";
    return "sensor1";
  });
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  // rawData now holds both sensors keyed by ID
  const [rawData, setRawData] = useState({ sensor1: [], sensor2: [] });
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, current: 0 });
  const pickerRef = useRef();

  const timeRangeMap = useMemo(
    () => ({
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    }),
    []
  );

  const aggregateDataForScreen = (data, maxPoints) => {
    if (data.length <= maxPoints) return data;
    const bucketSize = Math.ceil(data.length / maxPoints);
    const aggregated = [];
    for (let i = 0; i < data.length; i += bucketSize) {
      const slice = data.slice(i, i + bucketSize);
      const avg = slice.reduce((sum, d) => sum + d.value, 0) / slice.length;
      const label = slice[Math.floor(slice.length / 2)].label;
      aggregated.push({
        value: parseFloat(avg.toFixed(1)),
        label,
        dataPointText: label,
      });
    }
    return aggregated;
  };

  const fetchSensorData = async () => {
    setIsLoading(true);
    try {
      const cutoffTime = Date.now() - timeRangeMap[timeRange];
      console.log("cutoffTime:", new Date(cutoffTime).toISOString());

      const sensorIds = ["sensor1", "sensor2"];
      const fetched = {};

      // Parallel fetch
      await Promise.all(
        sensorIds.map(async (id) => {
          const sensorRef = ref(database, id);
          const dataQuery = query(
            sensorRef,
            orderByChild("timestamp"),
            startAt(cutoffTime)
          );
          const snapshot = await get(dataQuery);
          // console.log("Fetched data for", id, snapshot.val());

          if (snapshot.exists()) {
            fetched[id] = [];
            snapshot.forEach((childSnapshot) => {
              const data = childSnapshot.val();
              // console.log("Data item:", data);
              fetched[id].push({
                ...data,
                timestamp: new Date(data.timestamp).toISOString(),
              });
            });

            // Sort by timestamp
            fetched[id].sort((a, b) => a.timestamp - b.timestamp);
          } else {
            console.log("No data available for", id);
            fetched[id] = [];
          }
        })
      );

      // now both sensor1 and sensor2 are in fetched
      // console.log("All fetched data:", fetched);

      setRawData(fetched);
      processChartData(fetched[selectedGH]);
    } catch (error) {
      console.error(error);
      Alert.alert("Data Error", "Failed to fetch sensor data.");
      setRawData({ sensor1: [], sensor2: [] });
      setChartData([]);
      setStats({ min: 0, max: 0, avg: 0, current: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Process the raw data into chart format and calculate statistics
  const processChartData = (data) => {
    if (!data || data.length === 0) {
      setChartData([]);
      setStats({ min: 0, max: 0, avg: 0, current: 0 });
      return;
    }

    let aggregatedData = [];

    // Set max number of points based on screen width
    const screenWidth = Dimensions.get("window").width;
    const maxDisplayPoints = Math.floor(screenWidth / 60);

    if (timeRange === "day") {
      // Hourly aggregation
      const hourlyData = {};
      data.forEach((item) => {
        const date = new Date(item.timestamp);
        const hour = date.getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { sum: 0, count: 0 };
        }
        hourlyData[hour].sum += parseFloat(item[paramName] || 0);
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
      data.forEach((item) => {
        const date = new Date(item.timestamp);
        const day = date.toISOString().split("T")[0];

        if (!dailyData[day]) {
          dailyData[day] = { sum: 0, count: 0 };
        }
        dailyData[day].sum += parseFloat(item[paramName] || 0);
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
        }),
      }));
    } else if (timeRange === "month") {
      // Weekly aggregation
      const weeklyData = {};
      data.forEach((item) => {
        const date = new Date(item.timestamp);
        // Get week number within the month
        const weekNum = Math.floor(date.getDate() / 7);
        const weekKey = `${date.getFullYear()}-${date.getMonth()}-${weekNum}`;

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { sum: 0, count: 0 };
        }
        weeklyData[weekKey].sum += parseFloat(item[paramName] || 0);
        weeklyData[weekKey].count += 1;
      });

      aggregatedData = Object.keys(weeklyData).map((weekKey) => {
        const [year, month, week] = weekKey.split("-").map(Number);
        const weekLabel = `W${week + 1}`;

        return {
          value: parseFloat(
            (weeklyData[weekKey].sum / weeklyData[weekKey].count).toFixed(1)
          ),
          label: weekLabel,
          dataPointText: `${weekLabel} ${new Date(
            year,
            month
          ).toLocaleDateString("en-GB", { month: "short" })}`,
        };
      });
    } else if (timeRange === "year") {
      // Monthly aggregation
      const monthlyData = {};
      data.forEach((item) => {
        const date = new Date(item.timestamp);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { sum: 0, count: 0 };
        }
        monthlyData[monthKey].sum += parseFloat(item[paramName] || 0);
        monthlyData[monthKey].count += 1;
      });

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

      aggregatedData = Object.keys(monthlyData).map((monthKey) => {
        const [year, month] = monthKey.split("-").map(Number);

        return {
          value: parseFloat(
            (monthlyData[monthKey].sum / monthlyData[monthKey].count).toFixed(1)
          ),
          label: months[month],
          dataPointText: `${months[month]} ${year}`,
        };
      });
    }

    // Sort by timestamp to ensure proper order
    aggregatedData.sort((a, b) => {
      // If we're sorting by day label (numeric)
      if (!isNaN(a.label) && !isNaN(b.label)) {
        return parseInt(a.label) - parseInt(b.label);
      }
      // Otherwise keep original order (already sorted by keys)
      return 0;
    });

    // Apply adaptive aggregation
    const displayData = aggregateDataForScreen(
      aggregatedData,
      maxDisplayPoints
    );
    setChartData(displayData);

    // Calculate statistics
    if (aggregatedData.length > 0) {
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

  // Re-process when changing selection or time range or param
  useEffect(() => {
    if (rawData[selectedGH]) {
      processChartData(rawData[selectedGH]);
    }
  }, [selectedGH, timeRange, selectedParam]);

  // Initial fetch once
  useEffect(() => {
    fetchSensorData();

    // Set up real-time listener for new data
    const sensorRef = ref(database, `${selectedGH}`);
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      // This will trigger when data changes in Firebase
      // We could update the chart in real-time, but for now let's just
      // log it to keep the app's performance optimal
      console.log("New data available in Firebase");

      // To auto-refresh, uncomment the line below
      // fetchSensorData();
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const ParameterPress = (param) => {
    setSelectedParam(param);
    console.log("Selected parameter:", param);
  };

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
            maxHeight: 120,
            width: "100%",
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
                <SensorCardParams
                  key={`${sensor.label}-${i}`}
                  value={sensor.value}
                  unit={sensor.unit}
                  label={sensor.label}
                  type="environment"
                  fieldName={fieldName}
                  handlePress={ParameterPress}
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
