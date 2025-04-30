import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useState } from 'react';
import avatar from '../assets/avatar.png'
import GreenhouseCard from '../components/GreenHouseCard';
export default function HomeScreen() {
  const [mode, setMode] = useState('Auto');

  return (
    <View className="flex-1  bg-white">
      <ScrollView className="flex-1 ml-5  pt-10">

        {/* Header */}
        <View className="flex-row items-center justify-between mb-8 mt-4 mr-5">
          <View className="flex-row items-center">
            <Image 
              source={avatar} 
              className="w-12 h-12 rounded-full mr-4"
            />
            
          </View>
          <TouchableOpacity>
            <Feather name="menu" size={28} color="Black" />
          </TouchableOpacity>
        </View>
        
        <View>
              <Text className="text-black font-interBold  text-3xl">Hello Arthur !</Text>
              <Text className="text-gray-500 text-base font-normal">
                Here you can fully control your greenhouses
              </Text>
        </View>

        {/* Greenhouse Section */}
        <View className="flex-row mt-10 ">
        <Text className="text-black text-2xl font-interMedium mb-3 ">
          Greenhouses 
        </Text>
        <Text className="text-gray-400 text-xs mt-4 ml-1 font-normal">2 Added</Text>
        </View>
        {/* Greenhouse Cards */}
        <ScrollView  horizontal  showsHorizontalScrollIndicator={false}>
         <GreenhouseCard 
        name="Amizour Field"
        onPress={() => navigation.navigate('Details', { id: 1 })}
      />
       <GreenhouseCard 
        name="Amizour Field"
        onPress={() => navigation.navigate('Details', { id: 1 })}
      />
       <GreenhouseCard 
        name="Amizour Field"
        onPress={() => navigation.navigate('Details', { id: 1 })}
      />
        </ScrollView>

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{marginLeft:"10%" ,borderRadius:20}} className="absolute  w-4/5 bottom-6 left-0 right-0 px-8 py-5 bg-black border-t border-gray-200 flex-row justify-between items-center">
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
          <Ionicons name="camera-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
