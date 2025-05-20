import React, { useEffect, useState } from "react";
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
import MqttSensorListener from "../services/mqttlistener";

export default function GreenhouseCard({ id, name, onPress, control, Dbdata }) {
  const screenHeight = Dimensions.get("window").height;
  const [data, setData] = useState(Dbdata);
  const topic = `greenhouse/${id}`;

  // Map the sensor data from the database to the required format
  const sensorData = [
    {
      value: data?.temperature?.toString() || "0",
      unit: "°C",
      label: "Temperature",
    },
    {
      value: data?.humidity?.toString() || "0",
      unit: "%",
      label: "Humidity",
    },
    {
      value: data?.conductivity?.toString() || "0",
      unit: "µS/cm",
      label: "Conductivity",
    },
    {
      value: data?.nitrogen?.toString() || "0",
      unit: "ppm",
      label: "Nitrogen",
    },
    {
      value: data?.phosphorus?.toString() || "0",
      unit: "ppm",
      label: "Phosphorus",
    },
    {
      value: data?.potassium?.toString() || "0",
      unit: "ppm",
      label: "Potassium",
    },
    {
      value: data?.ph?.toString() || "0",
      unit: "",
      label: "pH",
    },
    {
      value: data?.dht_humidity?.toString() || "0",
      unit: "%",
      label: "DHT Humidity",
    },
    {
      value: data?.dht_temperature?.toString() || "0",
      unit: "°C",
      label: "DHT Temperature",
    },
  ];

  useEffect(() => {
    if (Dbdata) {
      setData(Dbdata);
    }
  }, [Dbdata]);

  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const chunkedSensors = chunkArray(sensorData, 3);
  const [publishFn, setPublishFn] = useState(null);
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
          <ToggleButton Control={control} GhId={id} publish={publishFn} />
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
      <MqttSensorListener
        topic={topic}
        onData={setData}
        onControl={(publishFn) => setPublishFn(() => publishFn)}
      />
    </View>
  );
}
