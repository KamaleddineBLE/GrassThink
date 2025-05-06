import { View, Text, Image, FlatList, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useState } from 'react';
import avatar from '../assets/avatar.png';
import GreenhouseCard from '../components/GreenHouseCard';
// import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [mode, setMode] = useState('Auto');
  const { width } = Dimensions.get('window');
  const greenhouses = [1, 2, 3];
  const cardWidth = width * 0.93;
  const spacing = 16;

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
        <Text className="text-black font-interBold text-3xl">Hello Arthur!</Text>
        <Text className="text-gray-500 text-base font-normal">
          Here you can fully control your greenhouses
        </Text>
      </View>

      {/* Greenhouse Section */}
      <View className="flex-row mt-8 ml-4">
        <Text className="text-black text-lg font-interMedium mb-3">Greenhouses</Text>
        <Text className="text-gray-400 text-xs mt-4 ml-1 font-normal">2 Added</Text>
      </View>

      {/* Greenhouse Cards Carousel */}
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        
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
                name={`Amizour Field ${index + 1}`}
                // onPress={() => navigation.navigate('Details', { id: index + 1 })}
              />
            </View>
          )}
        />

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={{ borderRadius: 20, alignSelf:'center'  }}
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
          <Ionicons name="camera-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
