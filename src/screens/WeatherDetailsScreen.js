import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function WeatherDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { weatherData } = route.params || {};

  const getWeatherIcon = (text) => {
    const lower = text?.toLowerCase();
    if (lower?.includes("sun")) return "sunny";
    if (lower?.includes("cloud")) return "cloudy";
    if (lower?.includes("rain")) return "rainy";
    if (lower?.includes("storm")) return "thunderstorm";
    if (lower?.includes("snow")) return "snow";
    if (lower?.includes("mist") || lower?.includes("fog")) return "cloudy";
    return "partly-sunny";
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!weatherData) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500 text-lg">No weather data available</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 bg-green-400 px-6 py-3 rounded-full"
          style={{ backgroundColor: "#4ade80" }}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = weatherData.current;
  const location = weatherData.location;
  const forecast = weatherData.forecast;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}

      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-black text-lg font-semibold">
          Weather Details
        </Text>
        <View style={{ width: 24 }} />

        {/* <TouchableOpacity
          className="bg-green-400 rounded-full p-2"
          style={{ backgroundColor: "#4ade80" }}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity> */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Weather Card */}
        <View className="mx-4 mb-6">
          <View className="bg-white rounded-3xl p-6">
            <View className="items-center mb-4">
              <Text className="text-black text-lg font-medium mb-1">
                {location?.name}, {location?.country}
              </Text>
              <Text className="text-gray-500 text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>

            <View className="items-center mb-6">
              <View
                className="bg-green-400 rounded-full p-4 mb-3 shadow-sm"
                style={{ backgroundColor: "#4ade80" }}
              >
                <Ionicons
                  name={getWeatherIcon(current?.condition?.text)}
                  size={64}
                  color="white"
                />
              </View>
              <Text className="text-black text-5xl font-light mb-2">
                {Math.round(current?.temp_c)}°
              </Text>
              <Text className="text-gray-700 text-lg capitalize">
                {current?.condition?.text}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Feels like {Math.round(current?.feelslike_c)}°
              </Text>
            </View>
          </View>
        </View>

        {/* Current Conditions Grid */}
        <View className="mx-4 mb-6">
          <Text className="text-black text-lg font-semibold mb-3">
            Current Conditions
          </Text>
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row flex-wrap">
              {[
                {
                  icon: "water-outline",
                  label: "Humidity",
                  value: `${current?.humidity}%`,
                  color: "#4ade80",
                },
                {
                  icon: "eye-outline",
                  label: "Visibility",
                  value: `${current?.vis_km} km`,
                  color: "#4ade80",
                },
                {
                  icon: "speedometer-outline",
                  label: "Wind Speed",
                  value: `${current?.wind_kph} km/h`,
                  color: "#4ade80",
                },
                {
                  icon: "compass-outline",
                  label: "Wind Direction",
                  value: current?.wind_dir,
                  color: "#4ade80",
                },
                {
                  icon: "thermometer-outline",
                  label: "UV Index",
                  value: current?.uv,
                  color: "#4ade80",
                },
                {
                  icon: "cloud-outline",
                  label: "Cloud Cover",
                  value: `${current?.cloud}%`,
                  color: "#4ade80",
                },
              ].map((item, index) => (
                <View key={index} className="w-1/2 p-3">
                  <View className="bg-gray-50 rounded-xl p-3 items-center shadow-sm">
                    <Ionicons name={item.icon} size={24} color={item.color} />
                    <Text className="text-black text-lg font-semibold mt-2">
                      {item.value}
                    </Text>
                    <Text className="text-gray-500 text-xs text-center">
                      {item.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Hourly Forecast */}
        {forecast?.forecastday?.[0]?.hour && (
          <View className="mx-4 mb-6">
            <Text className="text-black text-lg font-semibold mb-3">
              24-Hour Forecast
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {forecast.forecastday[0].hour
                  .slice(0, 24)
                  .map((hour, index) => (
                    <View
                      key={index}
                      className="bg-white rounded-xl p-3 mr-3 items-center"
                      style={{ width: 80 }}
                    >
                      <Text className="text-gray-500 text-xs mb-2">
                        {formatTime(hour.time.split(" ")[1])}
                      </Text>
                      <Ionicons
                        name={getWeatherIcon(hour.condition?.text)}
                        size={24}
                        color="#666"
                      />
                      <Text className="text-black text-sm font-medium mt-2">
                        {Math.round(hour.temp_c)}°
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="water-outline" size={10} color="#999" />
                        <Text className="text-gray-500 text-xs ml-1">
                          {hour.chance_of_rain}%
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 7-Day Forecast */}
        {forecast?.forecastday && (
          <View className="mx-4 mb-6">
            <Text className="text-black text-lg font-semibold mb-3">
              7-Day Forecast
            </Text>
            <View className="bg-gray-50 rounded-2xl p-4">
              {forecast.forecastday.map((day, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
                >
                  <View className="flex-1">
                    <Text className="text-black font-medium">
                      {index === 0
                        ? "Today"
                        : new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                    </Text>
                    <Text className="text-gray-500 text-sm capitalize">
                      {day.day?.condition?.text}
                    </Text>
                  </View>
                  <View className="flex-row items-center mx-4">
                    <Ionicons name="water-outline" size={14} color="#999" />
                    <Text className="text-gray-500 text-sm ml-1">
                      {day.day?.daily_chance_of_rain}%
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={getWeatherIcon(day.day?.condition?.text)}
                      size={24}
                      color="#666"
                    />
                    <View className="ml-3 items-end">
                      <Text className="text-black font-semibold">
                        {Math.round(day.day?.maxtemp_c)}°
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {Math.round(day.day?.mintemp_c)}°
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sun & Moon */}
        {forecast?.forecastday?.[0]?.astro && (
          <View className="mx-4 mb-8">
            <Text className="text-black text-lg font-semibold mb-3">
              Sun & Moon
            </Text>
            <View className="bg-gray-50 rounded-2xl p-4">
              <View className="flex-row justify-between">
                <View className="flex-1 items-center">
                  <Ionicons name="sunny" size={32} color="#FCD34D" />
                  <Text className="text-black text-sm font-medium mt-2">
                    Sunrise
                  </Text>
                  <Text className="text-gray-700 text-lg">
                    {forecast.forecastday[0].astro.sunrise}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Ionicons name="sunny" size={32} color="#F97316" />
                  <Text className="text-black text-sm font-medium mt-2">
                    Sunset
                  </Text>
                  <Text className="text-gray-700 text-lg">
                    {forecast.forecastday[0].astro.sunset}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-gray-200 my-4" />

              <View className="flex-row justify-between">
                <View className="flex-1 items-center">
                  <Ionicons name="moon" size={32} color="#9CA3AF" />
                  <Text className="text-black text-sm font-medium mt-2">
                    Moonrise
                  </Text>
                  <Text className="text-gray-700 text-lg">
                    {forecast.forecastday[0].astro.moonrise}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Ionicons name="moon" size={32} color="#6B7280" />
                  <Text className="text-black text-sm font-medium mt-2">
                    Moonset
                  </Text>
                  <Text className="text-gray-700 text-lg">
                    {forecast.forecastday[0].astro.moonset}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
