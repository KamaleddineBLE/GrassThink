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
import { get, child } from "firebase/database";
import { database } from "../services/firebase";
import { MqttContext } from "../services/mqttService";
import navHome from "../assets/ri_home-line.png";
import navStat from "../assets/material-symbols_analytics-outline.png";
import navNoti from "../assets/tdesign_notification-filled.png";
import navSett from "../assets/ri_settings-line.png";

export default function HomeScreen() {
  const navigation = useNavigation();
  // const { sensorDataa } = useContext(MqttContext);
  const [sensorData, setSensorData] = useState({});
  const [greenhouseList, setGreenhouseList] = useState([]);

  const [loading, setLoading] = useState("true");

  const [selectedTab, setSelectedTab] = useState("home");
  const { width } = Dimensions.get("window");
  const cardWidth = width * 0.93;
  const spacing = 16;

  useEffect(() => {
    let isMounted = true;
    const listeners = [];

    const dbRef = ref(database);

    // Attach a real-time listener to the root path
    const listener = onValue(
      dbRef,
      (snapshot) => {
        const fetched = {};

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const greenhouse = childSnapshot.val();
            console.log("Greenhouse data:", greenhouse);
            const { greenhouseId, readings } = greenhouse;

            if (
              greenhouseId &&
              Array.isArray(readings) &&
              readings.length > 0
            ) {
              // Sort readings by timestamp descending
              const sorted = [...readings].sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              );

              // Save the latest reading per greenhouseId
              fetched[greenhouseId] = sorted[0];
            }
          });

          if (isMounted) {
            setSensorData(fetched);
            console.log("Fetched sensor data:", fetched);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setSensorData({});
            setLoading(false);
          }
        }
      },
      (err) => {
        console.error("Realtime error:", err);
        if (isMounted) {
          setError("Failed to load sensor data");
          setLoading(false);
        }
      }
    );

    listeners.push({ ref: dbRef, listener });

    return () => {
      isMounted = false;
      // Remove all listeners
      listeners.forEach(({ ref: queryRef, listener }) => {
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
                <GreenhouseCard
                  id={item.id}
                  name={item.name}
                  Dbdata={sensorData[item.sensorId]} 
                  control={item.control}
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
          <Image source={navHome} className="w-6 h-6 " />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={navStat} className="w-6 h-6 opacity-50" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={navNoti} className="w-6 h-6 opacity-100" />
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
