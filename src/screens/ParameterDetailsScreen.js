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
import { child } from "firebase/database";

import { database } from "../services/firebase";
import { chunkArray, greenhouses } from "../constants/data";
import SensorCardParams from "../components/SensorCardParams";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HistoricalDataScreen = ({ route, navigation }) => {
  const { paramType, paramName, fieldName } = route.params;

  // Initialize selectedParam with the initial parameter from route params
  const [selectedParam, setSelectedParam] = useState(paramName);

  const [selectedGH, setSelectedGH] = useState(() => {
    if (fieldName === "Amizour Field") return "GH1";
    if (fieldName === "Mountain View") return "GH2";
    return "GH1";
  });
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(true);

  // rawData now holds both sensors keyed by ID
  const [rawData, setRawData] = useState({ sensor1: [], sensor2: [] });
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, current: 0 });
  const [sensorData, setSensorData] = useState([
    {
      value: "0",
      unit: "°C",
      label: "Temperature",
    },
    { value: "0", unit: "%", label: "Humidity" },
    {
      value: "0",
      unit: "µS/cm",
      label: "Conductivity",
    },
    { value: "0", unit: "ppm", label: "Nitrogen" },
    { value: "0", unit: "ppm", label: "Phosphorus" },
    { value: "0", unit: "ppm", label: "Potassium" },
    { value: "0", unit: "", label: "pH" },
    {
      value: "0",
      unit: "%",
      label: "DHT Humidity",
    },
    {
      value: "0",
      unit: "°C",
      label: "DHT Temperature",
    },
  ]);

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
  const getCacheKey = (gh, param, range) => `chartData_${gh}_${param}_${range}`;

  const storeChartData = async (gh, param, range, chart, stats) => {
    try {
      const key = getCacheKey(gh, param, range);
      const value = JSON.stringify({ chart, stats });
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn("Error saving chart data to cache:", error);
    }
  };

  const loadChartDataFromCache = async (gh, param, range) => {
    try {
      const key = getCacheKey(gh, param, range);
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue != null) {
        console.log("Loaded chart data from cache:", jsonValue);
        return JSON.parse(jsonValue);
      }
      return null;
    } catch (e) {
      console.warn("Error reading chart data from cache:", e);
      return null;
    }
  };

  // Generate sensorData based on the current selected sensor
  const generateSensorData = (data) => {
    return [
      {
        value: data.temperature ? data.temperature.toString() : "0",
        unit: "°C",
        label: "Temperature",
      },
      {
        value: data.humidity ? data.humidity.toString() : "0",
        unit: "%",
        label: "Humidity",
      },
      {
        value: data.conductivity ? data.conductivity.toString() : "0",
        unit: "µS/cm",
        label: "Conductivity",
      },
      {
        value: data.nitrogen ? data.nitrogen.toString() : "0",
        unit: "ppm",
        label: "Nitrogen",
      },
      {
        value: data.phosphorus ? data.phosphorus.toString() : "0",
        unit: "ppm",
        label: "Phosphorus",
      },
      {
        value: data.potassium ? data.potassium.toString() : "0",
        unit: "ppm",
        label: "Potassium",
      },
      {
        value: data.ph ? data.ph.toString() : "0",
        unit: "",
        label: "pH",
      },
      {
        value: data.dht_humidity ? data.dht_humidity.toString() : "0",
        unit: "%",
        label: "DHT Humidity",
      },
      {
        value: data.dht_temperature ? data.dht_temperature.toString() : "0",
        unit: "°C",
        label: "DHT Temperature",
      },
    ];
  };
  const GLOBAL_CACHE_KEY = "all_greenhouse_data";

  const storeAllSensorData = async (data) => {
    try {
      if (data) {
        console.info("data is cached");
      }
      await AsyncStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Error caching all greenhouse data:", e);
    }
  };

  const loadAllSensorDataFromCache = async () => {
    try {
      const json = await AsyncStorage.getItem(GLOBAL_CACHE_KEY);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.warn("Error loading cached greenhouse data:", e);
      return null;
    }
  };

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
      let fetched = await loadAllSensorDataFromCache();
      // let fetched = null; // Initialize fetched to null

      if (!fetched) {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, "/")); // get all greenhouses

        fetched = {};
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const greenhouse = childSnapshot.val();
            const { greenhouseId, readings } = greenhouse;

            if (readings) {
              const filtered = readings
                .map((reading) => {
                  const rawTimestamp = reading.timestamp || "";
                  const validTimestamp = rawTimestamp.includes("T")
                    ? rawTimestamp
                    : rawTimestamp.replace(" ", "T");

                  const date = new Date(validTimestamp);
                  if (isNaN(date.getTime())) return null;

                  return {
                    ...reading,
                    timestamp: validTimestamp,
                  };
                })
                .filter(Boolean)
                .sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                );

              fetched[greenhouseId] = filtered;
            } else {
              fetched[greenhouseId] = [];
            }
          });

          await storeAllSensorData(fetched); // cache the full data
        } else {
          console.log("No data available");
        }
      }

      setRawData(fetched);

      const selectedSensorData = fetched[selectedGH];
      processChartData(selectedSensorData);

      if (selectedSensorData && selectedSensorData.length > 0) {
        const latestDataPoint =
          selectedSensorData[selectedSensorData.length - 1];
        const updatedSensorData = generateSensorData(latestDataPoint);
        setSensorData(updatedSensorData);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Data Error", "Failed to fetch sensor data.");
      setRawData({});
      setChartData([]);
      setStats({ min: 0, max: 0, avg: 0, current: 0 });
      setSensorData((prevSensorData) =>
        prevSensorData.map((item) => ({
          ...item,
          value: "0",
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Process the raw data into chart format and calculate statistics
  const processChartData = async (data) => {
    if (!data || data.length === 0) {
      setChartData([]);
      setStats({ min: 0, max: 0, avg: 0, current: 0 });
      return;
    }
    const cached = await loadAllSensorDataFromCache();
    if (cached) {
      setChartData(cached.chart);
      setStats(cached.stats);
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
        if (isNaN(date.getTime())) return; // skip bad date

        const hour = date.getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { sum: 0, count: 0 };
        }
        // Use selectedParam instead of hard-coded paramName
        hourlyData[hour].sum += parseFloat(item[selectedParam] || 0);
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
        // Use selectedParam instead of hard-coded paramName
        dailyData[day].sum += parseFloat(item[selectedParam] || 0);
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
        // Use selectedParam instead of hard-coded paramName
        weeklyData[weekKey].sum += parseFloat(item[selectedParam] || 0);
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
        // Use selectedParam instead of hard-coded paramName
        monthlyData[monthKey].sum += parseFloat(item[selectedParam] || 0);
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
    try {
      await AsyncStorage.setItem(
        getCacheKey(selectedGH, selectedParam, timeRange),
        JSON.stringify({
          chart: aggregatedData,
          stats: {
            min: Math.min(...aggregatedData.map((d) => d.value)),
            max: Math.max(...aggregatedData.map((d) => d.value)),
            avg: parseFloat(
              (
                aggregatedData.reduce((sum, d) => sum + d.value, 0) /
                aggregatedData.length
              ).toFixed(1)
            ),
            current: aggregatedData[aggregatedData.length - 1].value,
          },
        })
      );
    } catch (err) {
      console.warn("Error caching chart data", err);
    }
  };

  // Re-process when changing selection or time range or param
  useEffect(() => {
    if (rawData[selectedGH]) {
      processChartData(rawData[selectedGH]);

      // Find the most recent data point for the current sensor
      const sensorDataPoints = rawData[selectedGH];
      const latestDataPoint =
        sensorDataPoints.length > 0
          ? sensorDataPoints[sensorDataPoints.length - 1]
          : {};

      // Update sensorData with the latest data point
      const updatedSensorData = generateSensorData(latestDataPoint);
      setSensorData(updatedSensorData);
    }
  }, [selectedGH, timeRange, selectedParam, rawData]);

  // Initial fetch once
  useEffect(() => {
    fetchSensorData();
  }, []);

  // useEffect(() => {
  //   fetchSensorData();

  //   // Set up real-time listener for new data
  //   const sensorRef = ref(database, `${selectedGH}`);
  //   const unsubscribe = onValue(sensorRef, (snapshot) => {
  //     console.log("New data available in Firebase");
  //     fetchSensorData();
  //   }
  // );

  //   // Clean up the listener when the component unmounts
  //   return () => unsubscribe();
  // }, []);

  const ParameterPress = (param) => {
    // Map the label to the corresponding parameter name
    const parameterMap = {
      Temperature: "temperature",
      Humidity: "humidity",
      Conductivity: "conductivity",
      Nitrogen: "nitrogen",
      Phosphorus: "phosphorus",
      Potassium: "potassium",
      pH: "ph",
      "DHT Humidity": "dht_humidity",
      "DHT Temperature": "dht_temperature",
    };

    const paramName = parameterMap[param];

    if (paramName) {
      setSelectedParam(paramName);
      console.log("Selected parameter:", paramName);
    }
  };

  // Get the appropriate unit for the selected parameter
  const getUnit = () => {
    switch (selectedParam) {
      case "temperature":
        return "°C";
      case "humidity":
        return "%";
      case "conductivity":
        return "µS/cm";
      case "nitrogen":
        return "ppm";
      case "phosphorus":
        return "ppm";
      case "potassium":
        return "ppm";
      case "ph":
        return "";
      case "dht_humidity":
        return "%";
      case "dht_temperature":
        return "°C";
      default:
        return "";
    }
  };

  // Map parameter names to display titles
  const titleMap = {
    temperature: "Temperature",
    humidity: "Humidity",
    conductivity: "Conductivity",
    nitrogen: "Nitrogen",
    phosphorus: "Phosphorus",
    potassium: "Potassium",
    ph: "pH",
    dht_humidity: "DHT Humidity",
    dht_temperature: "DHT Temperature",
  };
  const chunkedSensors = chunkArray(sensorData, 3);

  // Display stats in the UI
  const renderStats = () => {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MIN</Text>
          <Text style={styles.statValue}>
            {stats.min || 0}
            {getUnit()}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MAX</Text>
          <Text style={styles.statValue}>
            {stats.max || 0}
            {getUnit()}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>AVG</Text>
          <Text style={styles.statValue}>
            {stats.avg || 0}
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
            {titleMap[selectedParam] || selectedParam} History
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
                pointerComponent: (items) => {
                  return (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#4ade80", // Blue fill
                        borderWidth: 3,
                        borderColor: "white",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 4, // For Android shadow
                      }}
                    />
                  );
                },
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
                  handlePress={() => ParameterPress(sensor.label)}
                />
              ))}
            </View>
          )}
        />
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
});

export default HistoricalDataScreen;
