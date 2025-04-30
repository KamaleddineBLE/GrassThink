import { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

export default function ToggleButton({ label = 'Toggle', initial = false, onToggle }) {
  const [isOn, setIsOn] = useState(initial);

  const toggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    if (onToggle) onToggle(newState);
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      className={`px-2 py-1 rounded-full ${isOn ? 'bg-green-500' : 'bg-gray-500'}`}
      style={{
        alignSelf: 'flex-start',
      }}
    >
      <Text
        className="text-white text-xs leading-none font-interMedium " 
        style={{ padding: 0, margin: 0 }}
      >
        {isOn ? 'Auto' : 'Manual'}
      </Text>
    </TouchableOpacity>
  );
}
