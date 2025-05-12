import { View, Text,FlatList } from 'react-native'
import React from 'react'
import SensorCard from './Indicator';
const SensorGroups = () => {
    const sensorData = [
        { value: '25', unit: '°C', label: 'Temperature' },
        { value: '300', unit: 'ppm', label: 'CO₂' },
        { value: '60', unit: '%', label: 'Humidity' },
    
    
        { value: '24', unit: '°C', label: 'Temperature' },
        { value: '290', unit: 'ppm', label: 'CO₂' },
        { value: '65', unit: '%', label: 'Humidity' },
    
    
        
        { value: '23', unit: '°C', label: 'Temperature' },
        { value: '280', unit: 'ppm', label: 'CO₂' },
        { value: '70', unit: '%', label: 'Humidity' },
      ];
    
      const chunkArray = (array, size) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      };
    
      const chunkedSensors = chunkArray(sensorData, 3);
  return (
    <FlatList
              data={chunkedSensors}
              keyExtractor={(_, index) => `page-${index}`}
              showsVerticalScrollIndicator={false}
              pagingEnabled
              nestedScrollEnabled={true}
              style={{position :'absolute', bottom:'12%', maxHeight: 125, width: '95%'}}
              renderItem={({ item }) => (
                <View
                  style={{
                    height: 120,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap:'4%',
                    marginBottom:5
                  }}
                >
                  {item.map((sensor, i) => (
                    <SensorCard
                      key={`${sensor.label}-${i}`}
                      value={sensor.value}
                      unit={sensor.unit}
                      label={sensor.label}
                    />
                  ))}
                </View>
              )}
            />
  )
}

export default SensorGroups