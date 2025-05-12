import { View, Text, ImageBackground,Dimensions,Image, Touchable, TouchableOpacity } from 'react-native'
import React from 'react'
import SensorGroups from '../components/SensorGroups'
import CardBg from '../assets/CardBg.png'
import Back from '../assets/Back.png'
import irrigation from '../assets/irrigation.png'
import fan from '../assets/fanB.png'

import Control from '../components/Control'

export default function GreenHouseScreen(){
    const screenHeight = Dimensions.get('window').height;
  return (
    <View style={{display:'flex', height:screenHeight , alignItems:'center'}}>
    <View style={{marginTop:'20%'}} className="flex flex-row  items-center   justify-center w-11/12 mb-6">
        <TouchableOpacity style={{position:'absolute', left:0}}><Image source={Back} /></TouchableOpacity>
        <Text className="  font-interSemiBold text-xl mb-1">
            Amizour Field
        </Text>
    </View>
    <View style={{height:'25%'}} className="w-96 sty  rounded-3xl overflow-hidden">
        <ImageBackground
                source={CardBg}
                resizeMode="cover"
                className="py-4 items-center shadow-md flex-1"
              >

        </ImageBackground>
    </View>
    <View style={{height:'22%', width:'100%' }} className="mt-8 ml-4 ">
        <Text className="font-interMedium opacity-80 text-[17px] mb-3 ml-2">
            Environment
        </Text>
        
        <SensorGroups/>
    </View>
    <View style={{height:'20%', width:'100%' }} className="ml-4 ">
        <Text className="font-interMedium opacity-80 text-[17px] mb-1 ml-2">
            Control
        </Text>
        <View className="flex-row px-2 justify-between mt-2" style={{height:'100%',width:'95%'}}>
         <Control name="irrigation" image={irrigation}/>
         <Control name="Fan" image={fan}/>
         <Control/>
         
        </View>
      
    </View>
    


    
    </View>
  )
}

