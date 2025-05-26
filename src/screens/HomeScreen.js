import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import avatar from "../assets/avatar.png";
import GreenhouseCard from "../components/GreenHouseCard";
import { greenhouses } from "../constants/data";
import { useNavigation } from "@react-navigation/native";
import {
  ref,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  set,
} from "firebase/database";
import { database } from "../services/firebase";
import navHome from "../assets/ri_home-line.png";
import navStat from "../assets/material-symbols_analytics-outline.png";
import navNoti from "../assets/tdesign_notification-filled.png";
import navSett from "../assets/ri_settings-line.png";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("home");
  const [autoModes, setAutoModes] = useState({});
  const [publishFunctions, setPublishFunctions] = useState({});

  const { width } = Dimensions.get("window");
  const cardWidth = width * 0.93;
  const spacing = 16;

  const getWeather = async () => {
    try {
      setWeatherLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission denied");
        setWeatherLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      console.log("Location:", lat, lon);
      const res = await fetch(
        `http://192.168.1.13:5000/api/weather?lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      // console.log("Weather:", data);
      setWeatherData(data);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherIcon = (text) => {
    const lower = text?.toLowerCase();
    if (lower?.includes("sun")) return "sunny";
    if (lower?.includes("cloud")) return "cloudy";
    if (lower?.includes("rain")) return "rainy";
    if (lower?.includes("storm")) return "thunderstorm";
    if (lower?.includes("snow")) return "snow";
    if (lower?.includes("mist") || lower?.includes("fog")) return "cloudy";
    return "partly-sunny";
  };

  useEffect(() => {
    getWeather();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const listeners = [];

    const setupListeners = () => {
      greenhouses.forEach((gh) => {
        const key = `sensor${gh.id}`;

        const sensorQuery = query(
          ref(database, key),
          orderByChild("timestamp"),
          limitToLast(1)
        );

        const listener = onValue(
          sensorQuery,
          (snapshot) => {
            let latestData = null;

            snapshot.forEach((childSnapshot) => {
              latestData = childSnapshot.val();
            });

            if (isMounted) {
              setSensorData((prev) => ({
                ...prev,
                [gh.id]: latestData ?? {},
              }));
              setLoading(false);
            }
          },
          (err) => {
            console.error(`Realtime error for ${key}:`, err);
            setLoading(false);
          }
        );
        const controlRef = ref(database, `${gh.id - 1}/control/autoMode`);
        const controlListener = onValue(controlRef, (snapshot) => {
          if (isMounted) {
            const mode = snapshot.val();
            setAutoModes((prev) => ({
              ...prev,
              [gh.id]: mode,
            }));
          }
        });
        listeners.push({ queryRef: controlRef, listener: controlListener });

        listeners.push({ queryRef: sensorQuery, listener });
      });
    };

    setupListeners();

    return () => {
      isMounted = false;
      listeners.forEach(({ queryRef, listener }) => {
        off(queryRef, "value", listener);
      });
    };
  }, []);

  const onPressNavigationTab = (tab) => {
    setSelectedTab(tab);
    navigation.navigate(tab.charAt(0).toUpperCase() + tab.slice(1));
  };

  const navigateToWeatherDetails = () => {
    if (weatherData) {
      navigation.navigate("WeatherDetails", { weatherData });
    }
  };

  const sendDataToServer = async (greenhouseId) => {
    console.log("Sending data for greenhouse ID:", greenhouseId);
    try {
      const currentSensorData = sensorData[greenhouseId];
      console.log("Current Sensor Data:", currentSensorData);

      if (!currentSensorData || !weatherData) {
        console.log("Missing sensor or weather data");
        return;
      }

      // Merge sensor and weather data
      const mergedData = [
        {
          // Timestamp
          hour: new Date().toISOString(),
          is_day: weatherData.current?.is_day ?? 1,

          // Sensor data (adjusted to match your actual sensor data structure)
          sensor_dht_temperature: currentSensorData?.dht_temperature ?? null,
          sensor_dht_humidity: currentSensorData?.dht_humidity ?? null,
          sensor_temperature: currentSensorData?.temperature ?? null,
          sensor_humidity: currentSensorData?.humidity ?? null,
          sensor_ph: currentSensorData?.ph ?? null,
          sensor_conductivity: currentSensorData?.conductivity ?? null,
          sensor_nitrogen: currentSensorData?.nitrogen ?? null,
          sensor_phosphorus: currentSensorData?.phosphorus ?? null,
          sensor_potassium: currentSensorData?.potassium ?? null,

          // Weather data
          weather_temp_c: weatherData.current?.temp_c,
          weather_humidity: weatherData.current?.humidity,
          weather_uv: weatherData.current?.uv,
          weather_wind_kph: weatherData.current?.wind_kph,
          weather_will_it_rain:
            weatherData.forecast?.forecastday?.[0]?.day?.daily_will_it_rain,
          weather_chance_of_rain:
            weatherData.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain,
        },
      ];

      console.log("Sending data to server:", mergedData);

      const response = await fetch("http://192.168.1.13:5000/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mergedData }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("Actuator recommendations:", result.actuators);
        const GhIdFirebase = greenhouseId - 1;
        // console.log("GhIdFirebase:", GhIdFirebase);

        const actuators = Array.isArray(result.actuators)
          ? result.actuators[0]
          : result.actuators;

        const newControlState = {
          autoMode: true,
          fan: actuators?.fan ?? false,
          light: actuators?.light ?? false,
          pump: actuators?.pump ?? false,
          roof: actuators?.roof ?? false,
        };

        const controlRef = ref(database, `${GhIdFirebase}/control`);
        set(controlRef, newControlState)
          .then(() => console.log("✅ Firebase updated"))
          .catch((error) => console.error("❌ Firebase error:", error));

        // WITH THIS CORRECTED VERSION:

        // Publish to MQTT
        const publishFn = publishFunctions[greenhouseId];
        if (publishFn) {
          try {
            // Create the control message (same format as ToggleButton)
            const controlMessage = {
              fan: actuators?.fan ?? false,
              light: actuators?.light ?? false,
              pump: actuators?.pump ?? false,
              roof: actuators?.roof ?? false,
              autoMode: true,
            };

            console.log(
              `Publishing actuator data to MQTT for greenhouse ${greenhouseId}:`,
              controlMessage
            );

            // ✅ CORRECT - Pass both topic and message, just like ToggleButton does
            publishFn(`greenhouse/${greenhouseId}/control`, controlMessage);
            console.log("✅ MQTT actuator data published");
          } catch (mqttError) {
            console.error("❌ MQTT publish error:", mqttError);
          }
        } else {
          console.warn(
            `No MQTT publish function available for greenhouse ${greenhouseId}`
          );
        }

        return result.actuators;
      } else {
        console.error("Server error:", result.error);
      }
    } catch (error) {
      console.error("Failed to send data to server:", error);
    }
  };

  // Add this function to automatically send data periodically
  const startDataSending = () => {
    const interval = setInterval(() => {
      // console.log("Sending data to server for greenhouse:", greenhouses[0].id);
      const id = greenhouses[0].id;
      console.log("Sending data for greenhouse ID:", id);
      if (autoModes[id]) {
        sendDataToServer(id);
      } else {
        console.log(`AutoMode is off for greenhouse ${id}, skipping send.`);
      }
    }, 1 * 60 * 1000); // Send data every 60 seconds
    return interval;
  };
  // Add this useEffect to start automatic data sending
  useEffect(() => {
    let dataInterval;

    // Start sending data once we have both sensor and weather data
    if (Object.keys(sensorData).length > 0 && weatherData && !loading) {
      dataInterval = startDataSending();
    }

    return () => {
      if (dataInterval) {
        clearInterval(dataInterval);
      }
    };
  }, [sensorData, weatherData, loading, autoModes]);

  const handleSensorUpdate = (id, data) => {
    console.log("Sensor update received for ID:", id, "Data:", data);
    setSensorData((prev) => ({ ...prev, [id]: data }));
  };

  // Add function to handle publish function registration
  const handlePublishReady = (greenhouseId, publishFn) => {
    console.log(
      `MQTT publish function registered for greenhouse ${greenhouseId}`
    );
    setPublishFunctions((prev) => ({
      ...prev,
      [greenhouseId]: publishFn,
    }));
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header with Profile, Weather, and Notifications */}
      <View className="flex-row items-center justify-between mb-6 px-4 mt-10">
        {/* Profile Section */}
        <View className="flex-row items-center flex-1">
          <Image source={avatar} className="w-12 h-12 rounded-full mr-3" />
          <View className="flex-1">
            <Text className="text-black font-interMedium text-lg">Arthur</Text>
            <Text className="text-gray-500 text-sm">Good morning</Text>
          </View>
        </View>

        {/* Weather Section */}
        <TouchableOpacity
          className="flex-row items-center mr-4"
          onPress={navigateToWeatherDetails}
        >
          {weatherLoading ? (
            <ActivityIndicator size="small" color="#666" />
          ) : weatherData ? (
            <View className="flex-row items-center rounded-full px-3 py-2">
              <Ionicons
                name={getWeatherIcon(weatherData.current?.condition?.text)}
                size={20}
                color="#666"
              />
              <Text className="text-gray-700 text-sm ml-2 font-medium">
                {Math.round(weatherData.current?.temp_c)}°
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={getWeather}
              className="bg-gray-50 rounded-full p-2"
            >
              <Ionicons name="refresh" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity className="relative">
          <View className="rounded-full p-2">
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </View>
          {/* Notification Badge */}
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
            <Text className="text-white text-xs font-bold">3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Greeting Section */}
      <View className="ml-4 mb-4">
        <Text className="text-black font-interBold text-3xl">
          Hello Arthur!
        </Text>
        <Text className="text-gray-500 text-base font-normal">
          Here you can fully control your greenhouses
        </Text>
      </View>

      {/* Greenhouse Section */}
      <View className="flex-row mt-2 ml-4 mb-4">
        <Text className="text-black text-lg font-interMedium">Greenhouses</Text>
        <Text className="text-gray-400 text-xs mt-1 ml-2 font-normal">
          {greenhouses.length} Added
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <FlatList
            data={greenhouses}
            keyExtractor={(item, index) => `greenhouse-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + spacing}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (width - cardWidth) / 2,
            }}
            renderItem={({ item }) => (
              <View style={{ width: cardWidth, marginRight: spacing }}>
                <GreenhouseCard
                  id={item.id}
                  name={item.name}
                  Dbdata={sensorData[item.sensorId]}
                  control={item.control}
                  onSensorUpdate={handleSensorUpdate}
                  onPublishReady={handlePublishReady}
                />
              </View>
            )}
          />
          <View className="h-24" />
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View
        style={{ borderRadius: 20, alignSelf: "center" }}
        className="absolute w-4/5 bottom-6 mx-auto px-8 py-5 bg-black border-t flex-row justify-between items-center"
      >
        <TouchableOpacity>
          <Image source={navHome} className="w-6 h-6" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={navStat} className="w-6 h-6 opacity-50" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPressNavigationTab("CameraInsights")}
        >
          <Ionicons name="camera-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
