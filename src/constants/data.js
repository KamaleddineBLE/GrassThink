import images from "./images";
const greenhouses = [
  {
    id: "1",
    name: "Amizour Field",
    isConnected: true,
    
    autoMode: true,
    image: images.greenhouse,
    sensorId: "sensor1",
    control:{
      autoMode: false,
      pump:true,
      fan:true,
      light:true,
      Roof:true,
    }
    
  },
  {
    id: "2",
    name: "Mountain View",
    isConnected: false,
   
    autoMode: false,
    image: images.greenhouse,
    sensorId: "sensor2",
    control:{
      autoMode: true,
      pump:true,
      fan:true,
      light:true,
      Roof:true,
    }
  },
];

const data = {
  temperature: 25,
  humidity: 42,
  conductivity: 1200,
  nitrogen: 15,
  phosphorus: 10,
  potassium: 20,
  ph: 6.5,
  dht_humidity: 40,
  dht_temperature: 24,
};

const sensorData = [
  { value: data.temperature.toString(), unit: "°C", label: "Temperature" },
  { value: data.humidity.toString(), unit: "%", label: "Humidity" },
  {
    value: data.conductivity.toString(),
    unit: "µS/cm",
    label: "Conductivity",
  },
  { value: data.nitrogen.toString(), unit: "ppm", label: "Nitrogen" },
  { value: data.phosphorus.toString(), unit: "ppm", label: "Phosphorus" },
  { value: data.potassium.toString(), unit: "ppm", label: "Potassium" },
  { value: data.ph.toString(), unit: "", label: "pH" },
  { value: data.dht_humidity.toString(), unit: "%", label: "DHT Humidity" },
  {
    value: data.dht_temperature.toString(),
    unit: "°C",
    label: "DHT Temperature",
  },
];
const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
export { greenhouses, sensorData, chunkArray };
