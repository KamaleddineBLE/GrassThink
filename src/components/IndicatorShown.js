import React from 'react';
import { View, Text } from 'react-native';

export default function SensorCard({ value = "25", unit = "°C", label = "Temperature" }) {
  return (
    <View
      style={{ backgroundColor: "#282423", zIndex:3 ,width:'23%', height:'90%' }}
      className=" rounded-xl py-5 px-2  border-l-green-700 border border-green-400"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-lg font-interSemiBold">
          {value}
          <Text className="text-white text-base font-interSemiBold"> {unit}</Text>
        </Text>
      </View>

      <Text className="text-white/60 text-[12px] font-inter mb-1">{label}</Text>
      <View className="w-full mt-3 mb-1 h-px bg-gray-400/20" />
      <Text className="text-white/60 text-[8px] absolute bottom-2 left-4 font-inter">
        Tap for more details
      </Text>
    </View>
  );
}
