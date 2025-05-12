import React from 'react';
import { View, Text,Image } from 'react-native';

import ToggleButton from './MiniToggle';
export default function  Control({ name, image }) {
  return (
      <View
        style={{ backgroundColor: "#F3F3F3", zIndex:3 ,width:'30%', height:'70%' }}
        className=" rounded-xl py-5 px-2  "
      >
        <View className="items-center flex-row justify-between mb-2">
          <View style={{backgroundColor:'white'}} className="w-8 h-8  rounded-full flex items-center justify-center ">
           <Image source={image} style={{resizeMode:'contain'}} className="w-5 h-4" />            
          </View>
          <ToggleButton/>
          
        </View>
        <Text className=" text-sm font-interMedium ">
          {name}
          </Text>

        <Text className="text-black/50 text-[9px] font-inter">Pump is on</Text>
        
      </View>
  );
}
