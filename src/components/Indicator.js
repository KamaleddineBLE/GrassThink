import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function SensorCard({
  value = "25",
  unit = "°C",
  label = "Temperature",
  type = "environment",
  fieldName = "Amizour Field",
}) {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate("ParameterDetails", {
      paramType: type,
      paramName: label.toLowerCase(),
      fieldName: fieldName,
    });
  };
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        backgroundColor: "#282423",
        zIndex: 3,
        width: "30%",
        height: "90%",
      }}
      className=" rounded-xl py-5 px-2  border-l-green-700 border border-green-400"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-lg font-interSemiBold">
          {value}
          <Text className="text-white text-base font-interSemiBold">
            {" "}
            {unit}
          </Text>
        </Text>
      </View>

      <Text className="text-white/60 text-[12px] font-inter mb-1">{label}</Text>
      <View className="w-full absolute bottom-6 right-2 h-px bg-gray-400/10" />
      <Text className="text-white/60 text-[8px] absolute bottom-2 left-3 font-inter">
        Tap for more details
      </Text>
    </TouchableOpacity>
  );
}
