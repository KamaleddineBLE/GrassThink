import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import fan from '../assets/fan.png'
import tap from '../assets/tap.png'
import roof from '../assets/roof.png'
import lamp from '../assets/lamp.png'
export default function ToggleButton() {
  const [mode, setMode] = useState('auto');
  const translateX = useSharedValue(6);

  useEffect(() => {
    // Sync animation when mode changes
    translateX.value = withTiming(mode === 'auto' ? 60 : 6, { duration: 200 });
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'auto' ? 'manual' : 'auto'));
  };

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="items-center">
      <Pressable
        onPress={toggleMode}
        className={`w-20 h-6 px-2 rounded-xl flex-row items-center z-10 ${
          mode === 'auto' ? 'bg-green-400' : 'bg-black'
        }`}
      >
        <Animated.View
          style={circleStyle}
          className="absolute w-4 h-4 rounded-full bg-white justify-center items-center"
        >
          <View
            className={`${
              mode === 'manual' ? 'w-1.5 h-1.5 rounded-full bg-black' : 'w-0.5 h-2 rounded-xl bg-green-400'
            }`}
          />
        </Animated.View>

        <View className="flex w-full items-start">
          {mode === 'auto' ? (
            <Text className="font-semibold ml-4 text-[10px] text-white">Auto</Text>
          ) : (
            <Text className="font-semibold ml-6 text-[10px] text-white">Manual</Text>
          )}
        </View>
      </Pressable>

      {/* Extra visual black panel */}
      {mode === 'manual' && (
        <View style={{gap:'5%'}} className="w-12 h-40 flex items-center pt-5  bg-black rounded-xl absolute top-4 left-6 -mt-1 z-0" >
          <TouchableOpacity style={{backgroundColor:'#1E1E1E'}} className="w-6 h-6  rounded-full flex items-center justify-center ">
             <Image source={lamp} style={{resizeMode:'contain'}}  className="w-3 h-4" />
              
              
          </TouchableOpacity>
          <TouchableOpacity style={{backgroundColor:'#1E1E1E'}} className="w-6 h-6  rounded-full flex items-center justify-center ">
             <Image source={fan} className="w-3 h-3 opacity-40 " />
              
              
          </TouchableOpacity>

          <TouchableOpacity style={{backgroundColor:'#1E1E1E'}} className="w-6 h-6  rounded-full flex items-center justify-center ">
             <Image source={tap} style={{resizeMode:'contain'}}className="w-3 h-4" />
              
              
          </TouchableOpacity>

          <TouchableOpacity style={{backgroundColor:'#1E1E1E'}} className="w-6 h-6  rounded-full flex items-center justify-center ">
             <Image source={roof} style={{resizeMode:'contain'}} className="w-3.5 h-3 opacity-40" />
              
              
          </TouchableOpacity>
          
          
        </View>

      )}
    </View>
  );
}
