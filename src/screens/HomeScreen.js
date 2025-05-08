import React, { useState, useEffect } from "react";
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
import avatar from "../assets/avatar.png";
import GreenhouseCard from "../components/GreenHouseCard";
import axios from "axios";
import images from "../constants/images";
import { greenhouses } from "../constants/data";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [mode, setMode] = useState("Auto");
  const { width } = Dimensions.get("window");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("home");

  const cardWidth = width * 0.93;
  const spacing = 16;
  // Fetch the latest sensor data for a given sensor ID
  const fetchLatestSensorData = async (sensorId) => {
    try {
      const url = `http://192.168.45.158:5000/api/sensor-data-latest/${sensorId}`;
      // const url = `http://192.168.1.10:5000/api/sensor-data-latest/${sensorId}`;
      console.log("Fetching data from:", url);

      const response = await axios.get(url);
      // console.log("Sensor data:", response.data.data);
      return response.data.data;
    } catch (err) {
      console.error(`Error fetching data for ${sensorId}:`, err);
      setError("Failed to load sensor data");
      return null;
    }
  };

  useEffect(() => {
    const fetchAllSensorData = async () => {
      setLoading(true);
      try {
        const promises = greenhouses.map((gh) =>
          fetchLatestSensorData(`sensor${gh.id}`)
        );
        const results = await Promise.all(promises);
        const dataMap = {};
        greenhouses.forEach((gh, idx) => {
          dataMap[gh.id] = results[idx];
        });
        setSensorData(dataMap);
      } catch (err) {
        console.error(err);
        setError("Failed to load sensor data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSensorData();
    const interval = setInterval(fetchAllSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const onPressNavigationTab = (tab) => {
    setSelectedTab(tab);
    navigation.navigate(tab.charAt(0).toUpperCase() + tab.slice(1));
  };
  // console.log("Sensor Data:", sensorData);
  return (
    <View className="flex-1 bg-white ">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-8 px-4 mt-10">
        <View className="flex-row items-center">
          <Image source={avatar} className="w-12 h-12 rounded-full mr-4" />
        </View>
        <TouchableOpacity>
          <Feather name="menu" size={28} color="black" />
        </TouchableOpacity>
      </View>
      {/* Greeting */}
      <View className="ml-4">
        <Text className="text-black font-interBold text-3xl">
          Hello Arthur!
        </Text>
        <Text className="text-gray-500 text-base font-normal">
          Here you can fully control your greenhouses
        </Text>
      </View>
      {/* Greenhouse Section */}
      <View className="flex-row mt-8 ml-4">
        <Text className="text-black text-lg font-interMedium mb-3">
          Greenhouses
        </Text>
        <Text className="text-gray-400 text-xs mt-4 ml-1 font-normal">
          2 Added
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
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
            renderItem={({ item, index }) => (
              <View style={{ width: cardWidth, marginRight: spacing }}>
                <GreenhouseCard
                  name={item.name}
                  data={sensorData[item.id]}

                  // onPress={() => navigation.navigate('Details', { id: index + 1 })}
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
        className="absolute w-4/5 bottom-6  mx-auto px-8 py-5 bg-black border-t flex-row justify-between items-center"
      >
        <TouchableOpacity>
          <Ionicons name="home" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="calendar-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons
            name="camera-outline"
            onPress={() => onPressNavigationTab("CameraInsights")}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
