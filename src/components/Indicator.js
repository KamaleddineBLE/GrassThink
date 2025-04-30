import React from 'react';
import { View, Text } from 'react-native';

export default function SensorCard({ value = "25", unit = "°C", label = "Temperature" }) {
  return (
    <View className="bg-black/80 rounded-xl   pt-4 w-28 h-28 border  ">
      <View className="flex-row items-center justify-between mb-1 ml-2">
        <Text className="text-white text-xl font-interBold ">
          {value}{unit}
        </Text>
      </View>
      <Text className="text-gray-400 text-xs font-inter ml-2">{label} </Text>
      <View className='w-24 mt-5 ml-2 h-px bg-gray-400/40'></View>
     <Text className="text-gray-500 text-[10px] absolute bottom-2 left-2  font-inter">Tap for more details</Text>
    </View>
  );
}
