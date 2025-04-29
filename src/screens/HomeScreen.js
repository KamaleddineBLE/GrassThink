import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useState } from 'react';

export default function HomeScreen() {
  const [mode, setMode] = useState('Auto');

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 pt-10">

        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=3' }} 
              className="w-12 h-12 rounded-full mr-4"
            />
            
          </View>
          <TouchableOpacity>
            <Feather name="menu" size={24} color="black" />
          </TouchableOpacity>
        </View>
        
        <View>
              <Text className="text-gray-400 text-sm">Hello Arthur !</Text>
              <Text className="text-black text-base font-semibold">
                Here you can fully control your greenhouses
              </Text>
        </View>

        {/* Greenhouse Section */}
        <Text className="text-black text-lg font-bold mb-3">
          Greenhouses <Text className="text-gray-400 font-normal">2 Added</Text>
        </Text>

        {/* Greenhouse Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2].map((_, index) => (
            <View
              key={index}
              className="relative rounded-2xl overflow-hidden mr-4 w-72 h-64"
            >
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1564518098550-6916a58477f8?auto=format&fit=crop&w=800&q=80' }} 
                className="w-full h-full"
              />

              {/* Overlay */}
              <View className="absolute top-0 left-0 right-0 bottom-0 p-4 justify-between">
                
                {/* Top Row */}
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-white font-bold text-lg">Amizour Field</Text>
                    <Text className="text-green-300 text-xs mt-1">Connected</Text>
                  </View>

                  <TouchableOpacity 
                    className="bg-white px-3 py-1 rounded-full"
                    onPress={() => setMode(mode === 'Auto' ? 'Manual' : 'Auto')}
                  >
                    <Text className="text-black text-xs font-semibold">{mode}</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom Sensor Data */}
                <View className="flex-row justify-between">
                  <View className="bg-black/50 p-3 rounded-xl w-[30%] items-center">
                    <Text className="text-white text-sm font-semibold">25°C</Text>
                    <Text className="text-gray-300 text-xs mt-1">Temp</Text>
                  </View>
                  <View className="bg-black/50 p-3 rounded-xl w-[30%] items-center">
                    <Text className="text-white text-sm font-semibold">42%</Text>
                    <Text className="text-gray-300 text-xs mt-1">Humidity</Text>
                  </View>
                  <View className="bg-black/50 p-3 rounded-xl w-[30%] items-center">
                    <Text className="text-white text-sm font-semibold">30 km/h</Text>
                    <Text className="text-gray-300 text-xs mt-1 text-center">Wind</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 px-8 py-4 bg-white border-t border-gray-200 flex-row justify-between items-center">
        <TouchableOpacity>
          <Ionicons name="home" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="calendar-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="camera-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
