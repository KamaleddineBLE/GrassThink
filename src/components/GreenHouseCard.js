import React from 'react';
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  Dimensions,
  Image,
} from 'react-native';
import ToggleButton from './ToggleBtn';
import CardBg from '../assets/CardBg.png';
import chev from '../assets/chev.png';
import SensorGroups from './SensorGroups';

import SensorCard from './Indicator';

export default function GreenhouseCard({ name, onPress }) {
  const screenHeight = Dimensions.get('window').height;

 

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
          <ToggleButton onToggle={(state) => console.log('Pump is', state ? 'ON' : 'OFF')} />
        </View>
        <SensorGroups/>
        
        <Image source={chev} style={{position:'absolute',bottom:'9%'}}/>
      </ImageBackground>
    </View>
  );
}
