import React from "react";
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  Dimensions,
  Image,
} from "react-native";
import ToggleButton from "./ToggleBtn";
import CardBg from "../assets/CardBg.png";
import chev from "../assets/chev.png";

import SensorCard from "./Indicator";

export default function GreenhouseCard({ name, onPress, data }) {
  const screenHeight = Dimensions.get("window").height;

  // Map the sensor data from the database to the required format
  const sensorData = [
    { value: data.temperature.toString(), unit: "°C", label: "Temperature" },
    { value: data.humidity.toString(), unit: "%", label: "Humidity" },
    {
      value: data.conductivity.toString(),
      unit: "µS/cm",
      label: "Conductivity",
    },
    { value: data.nitrogen.toString(), unit: "ppm", label: "Nitrogen" },
    { value: data.phosphorus.toString(), unit: "ppm", label: "Phosphorus" },
    { value: data.potassium.toString(), unit: "ppm", label: "Potassium" },
    { value: data.ph.toString(), unit: "", label: "pH" },
    { value: data.dht_humidity.toString(), unit: "%", label: "DHT Humidity" },
    {
      value: data.dht_temperature.toString(),
      unit: "°C",
      label: "DHT Temperature",
    },
  ];

  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const chunkedSensors = chunkArray(sensorData, 3);

  return (
    <View
      onPress={onPress}
      className="mr-3 mt-2 rounded-3xl overflow-hidden shadow-md "
      style={{ height: screenHeight * 0.52 }}
    >
      <ImageBackground
        source={CardBg}
        resizeMode="cover"
        className="py-4 items-center shadow-md flex-1"
      >
        <View className="flex-row justify-between w-full px-5 mt-5">
          <View>
            <Text className="text-white text-xl font-medium">{name}</Text>
            <Text className="text-xs font-normal text-gray-300">Connected</Text>
          </View>
          <ToggleButton
            onToggle={(state) => console.log("Pump is", state ? "ON" : "OFF")}
          />
        </View>

        <FlatList
          data={chunkedSensors}
          keyExtractor={(_, index) => `page-${index}`}
          pagingEnabled
          nestedScrollEnabled={true}
          style={{
            position: "absolute",
            bottom: "12%",
            maxHeight: 120,
            width: "95%",
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
                  fieldName={name}
                />
              ))}
            </View>
          )}
        />
        <Image source={chev} style={{ position: "absolute", bottom: "9%" }} />
      </ImageBackground>
    </View>
  );
}
