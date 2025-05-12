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
import { greenhouses } from "../constants/data";
import { useNavigation } from "@react-navigation/native";
import {
  ref,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { database } from "../services/firebase";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [sensorData, setSensorData] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("home");
  const { width } = Dimensions.get("window");
  const cardWidth = width * 0.93;
  const spacing = 16;

  useEffect(() => {
    let isMounted = true;
    const listeners = [];

    const setupListeners = () => {
      greenhouses.forEach((gh) => {
        const key = `sensor${gh.id}`;

        // Create a query: order by timestamp and limit to last entry
        const sensorQuery = query(
          ref(database, key),
          orderByChild("timestamp"),
          limitToLast(1)
        );

        const listener = onValue(
          sensorQuery,
          (snapshot) => {
            let latestData = null;

            // Iterate through snapshot (even if there's only 1 child)
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
            setError("Failed to load sensor data");
            setLoading(false);
          }
        );

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
          {greenhouses.length} Added
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#000" />
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
            renderItem={({ item }) => (
              <View style={{ width: cardWidth, marginRight: spacing }}>
                <GreenhouseCard name={item.name} data={sensorData[item.id]} />
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
        <TouchableOpacity
          onPress={() => onPressNavigationTab("CameraInsights")}
        >
          <Ionicons name="camera-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
