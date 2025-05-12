import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

export default function ToggleButton() {
  const [mode, setMode] = useState('auto');
  const translateX = useSharedValue(6);

  useEffect(() => {
    // Sync animation when mode changes
    translateX.value = withTiming(mode === 'auto' ? 26 : 2, { duration: 200 });
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
        className={`w-10 h-4 px-2 rounded-xl flex-row items-center z-10 ${
          mode === 'auto' ? 'bg-green-400' : 'bg-black'
        }`}
      >
        <Animated.View
          style={circleStyle}
          className="absolute w-3 h-3 rounded-full bg-white justify-center items-center"
        >
          <View
            className={`${
              mode === 'manual' ? 'w-1 h-1 rounded-full bg-black' : 'w-0.5 h-1.5 rounded-xl bg-green-400'
            }`}
          />
        </Animated.View>

        
      </Pressable>

      
    </View>
  );
}
