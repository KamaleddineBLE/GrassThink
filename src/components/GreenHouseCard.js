import { View, Text, Pressable, ImageBackground, } from 'react-native';
import ToggleButton from './ToggleBtn';
import CardBg from '../assets/CardBg.png'
import SensorCard from './Indicator';
export default function GreenhouseCard({ name, onPress }) {
  return (
    <Pressable 
      onPress={onPress}
      className="  mr-3 mt-2 rounded-3xl h overflow-hidden shadow-md w-96"
      
    >
     <ImageBackground
      source={CardBg} // your image path
      resizeMode="cover"
      className="py-4 items-center shadow-md flex-1"

      
    >
      <View className="flex-row justify-between w-full px-4 mt-4">
        <View>
            <Text className="text-white text-xl font-medium">{name}</Text>
            <Text className="text-xs font-normal text-gray-300 ">Connected</Text>
        </View>
        <ToggleButton  onToggle={(state) => console.log('Pump is', state ? 'ON' : 'OFF')} />


      </View>
    
      <View style={{gap:8}} className="flex-row  w-auto mt-64 mb-8">
        <SensorCard value="25" unit="°C" label="Temperature" />
        <SensorCard value="25" unit="°C" label="Temperature" />
        <SensorCard value="25" unit="°C" label="Temperature" />
      </View>
     </ImageBackground>
    </Pressable>
  );
}
// [1, 2].map((_, index) => (
//     <View
//       key={index}
//       className="relative rounded-2xl overflow-hidden mr-4 w-72 h-64"
//     >
//       <Image 
//         source={{ uri: 'https://images.unsplash.com/photo-1564518098550-6916a58477f8?auto=format&fit=crop&w=800&q=80' }} 
//         className="w-full h-full"
//       />

//       {/* Overlay */}
//       <View className="absolute top-0 left-0 right-0 bottom-0 p-4 justify-between">
        
//         {/* Top Row */}
//         <View className="flex-row justify-between items-center">
//           <View>
//             <Text className="text-white font-bold text-lg">Amizour Field</Text>
//             <Text className="text-green-300 text-xs mt-1">Connected</Text>
//           </View>

//           <TouchableOpacity 
//             className="bg-white px-3 py-1 rounded-full"
//             onPress={() => setMode(mode === 'Auto' ? 'Manual' : 'Auto')}
//           >
//             <Text className="text-black text-xs font-semibold">{mode}</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Bottom Sensor Data */}
        
//       </View>
//     </View>
//   ))}