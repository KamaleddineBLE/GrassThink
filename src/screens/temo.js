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
import { LineChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import {
  getDatabase,
  ref,
  query,
  orderByKey,
  startAt,
  get,
} from "firebase/database";
import { database } from "../services/firebase";
import { chunkArray, greenhouses, sensorData } from "../constants/data";
import SensorCardParams from "../components/SensorCardParams";

const HistoricalDataScreen = ({ route, navigation }) => {
  const { paramName, fieldName } = route.params;
  const [selectedGH, setSelectedGH] = useState(() => {
    if (fieldName === "Amizour Field") return "sensor1";
    if (fieldName === "Mountain View") return "sensor2";
    return "sensor1";
  });
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, current: 0 });
  const pickerRef = useRef();
  const chunkedSensors = chunkArray(sensorData, 3);

  // Milliseconds map for each range
  const timeRangeMap = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  // Determine granularity and key-start based on range
  const getGranularityAndStart = () => {
    const now = new Date();
    const startDate = new Date(Date.now() - timeRangeMap[timeRange]);
    let gran, startKey;
    const pad = (num) => String(num).padStart(2, "0");

    switch (timeRange) {
      case "day":
        gran = "hourly";
        startKey = `${startDate.getUTCFullYear()}-${pad(
          startDate.getUTCMonth() + 1
        )}-${pad(startDate.getUTCDate())}/${pad(startDate.getUTCHours())}`;
        break;
      case "week":
        gran = "daily";
        startKey = `${startDate.getUTCFullYear()}-${pad(
          startDate.getUTCMonth() + 1
        )}-${pad(startDate.getUTCDate())}`;
        break;
      case "month":
        gran = "weekly";
        const weekNum = Math.ceil(startDate.getUTCDate() / 7);
        startKey = `${startDate.getUTCFullYear()}-W${weekNum}`;
        break;
      case "year":
        gran = "monthly";
        startKey = `${startDate.getUTCFullYear()}-${pad(
          startDate.getUTCMonth() + 1
        )}`;
        break;
      default:
        gran = "daily";
        startKey = "";
    }
    return { gran, startKey };
  };

  // Fetch aggregates from Firebase Realtime Database
  const fetchAggregated = async () => {
    setIsLoading(true);
    try {
      const { gran, startKey } = getGranularityAndStart();
      const path = `aggregates/${selectedGH}/${gran}`;
      const aggQuery = startKey
        ? query(ref(database, path), orderByKey(), startAt(startKey))
        : ref(database, path);

      const snap = await get(aggQuery);
      if (!snap.exists()) {
        setChartData([]);
        setStats({ min: 0, max: 0, avg: 0, current: 0 });
        return;
      }

      // Build data array
      const list = [];
      snap.forEach((child) => {
        const { sum, count } = child.val();
        const avg = count > 0 ? sum / count : 0;
        list.push({ label: child.key, value: parseFloat(avg.toFixed(1)) });
      });

      // Sort by label (key)
      list.sort((a, b) => (a.label > b.label ? 1 : -1));

      setChartData(list);

      // Compute stats
      const values = list.map((d) => d.value);
      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = parseFloat(
          (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
        );
        const current = values[values.length - 1];
        setStats({ min, max, avg, current });
      } else {
        setStats({ min: 0, max: 0, avg: 0, current: 0 });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not fetch aggregated data.");
      setChartData([]);
      setStats({ min: 0, max: 0, avg: 0, current: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch on greenhouse or range change
  useEffect(() => {
    fetchAggregated();
  }, [selectedGH, timeRange]);

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

  const titleMap = {
    temperature: "Temperature",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    soil: "Soil Moisture",
  };

  const renderStats = () => {
    if (!chartData.length) return null;
    return (
      <View style={styles.statsContainer}>
        {["min", "max", "avg", "current"].map((key) => (
          <View key={key} style={styles.statBox}>
            <Text style={styles.statLabel}>{key.toUpperCase()}</Text>
            <Text style={styles.statValue}>
              {stats[key]}
              {getUnit()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{titleMap[paramName]} History</Text>
          <View style={{ width: 24 }} />
        </View>

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

        <View style={styles.pickerContainerOuter}>
          <Picker
            ref={pickerRef}
            selectedValue={selectedGH}
            onValueChange={(val) => setSelectedGH(val)}
            style={styles.picker}
            mode="dropdown"
          >
            {greenhouses.map((g) => (
              <Picker.Item key={g.id} label={g.name} value={g.sensorId} />
            ))}
          </Picker>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#4ade80" />
        ) : !chartData.length ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No data</Text>
          </View>
        ) : (
          <LineChart
            areaChart
            data={chartData}
            width={Dimensions.get("window").width - 32}
            height={240}
            color="#4ade80"
            thickness={2}
            noOfSections={6}
            startFillColor="rgba(74,222,128,0.5)"
            endFillColor="rgba(74,222,128,0)"
            maxValue={Math.max(...chartData.map((d) => d.value)) + 5}
            minValue={Math.max(
              0,
              Math.min(...chartData.map((d) => d.value)) - 5
            )}
            hideDataPoints
            {
              /* other styling props */ ...{}
            }
          />
        )}

        {renderStats()}

        <FlatList
          data={chunkedSensors}
          keyExtractor={(_, i) => `page-${i}`}
          pagingEnabled
          horizontal
          style={{
            maxHeight: 120,
            // width: Dimensions.get("window").width,
          }}
          renderItem={({ item }) => (
            <View style={styles.sensorRow}>
              {item.map((sensor, i) => (
                <SensorCardParams key={i} {...sensor} handlePress={() => {}} />
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
  container: { flex: 1, padding: 16, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
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
    width: "50%",
  },
  picker: { height: 50 },
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
  noDataText: { marginTop: 10, color: "#999", fontSize: 16 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statBox: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#4ade80" },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: Dimensions.get("window").width,
  },
});

export default HistoricalDataScreen;
