// utils/actuatorLogic.js
function isOptimal(value, bounds) {
  return value >= bounds[0] && value <= bounds[1];
}

function applyActuatorLogic(data) {
  return data.map((row) => {
    const hour = row.hour ? new Date(row.hour).getHours() : 12;
    const isDay = row.is_day !== undefined ? row.is_day : 1;
    const isDaytime = (hour >= 6 && hour <= 20) || isDay === 1;

    // Optimal ranges
    const TEMP_DAY = [15, 22];
    const TEMP_NIGHT = [15, 20];
    const TEMP_STRESS = 24;
    const HUMIDITY_RANGE = [30, 75];
    const PH_RANGE = [6, 7.5];
    const EC_RANGE = [1500, 2100];
    const SOIL_TEMP_RANGE = [15, 22];
    const SOIL_HUMIDITY_RANGE = [50, 70];
    const LOW_UV_THRESHOLD = 1;
    const HIGH_UV_THRESHOLD = 8;
    const LIGHT_ON_HOURS = Array.from({ length: 16 }, (_, i) => i + 5); // [5...20]

    // Environmental sensors
    const GH_TEMP = row.sensor_dht_temperature ?? 20.0;
    const GH_HUMIDITY = row.sensor_dht_humidity ?? 60.0;

    // Soil sensors
    const SOIL_TEMP = row.sensor_temperature ?? 18.0;
    const SOIL_HUMIDITY = row.sensor_humidity ?? 50.0;
    const SOIL_PH = row.sensor_ph ?? 6.0;
    const SOIL_EC = row.sensor_conductivity ?? 1600;

    // Weather
    const W_TEMP = row.weather_temp_c ?? GH_TEMP;
    const W_HUMIDITY = row.weather_humidity ?? GH_HUMIDITY;
    const W_UV = row.weather_uv ?? 0;
    const W_WIND = row.weather_wind_kph ?? 0;
    const W_RAIN = row.weather_will_it_rain ?? 0;
    const W_CHANCE_RAIN = row.weather_chance_of_rain ?? 0;

    const tempRange = isDaytime ? TEMP_DAY : TEMP_NIGHT;
    const [tempMin, tempMax] = tempRange;

    // --- FAN LOGIC ---
    let fan = false;
    if (GH_TEMP > tempMax || GH_HUMIDITY > HUMIDITY_RANGE[1] + 5) {
      fan = true;
    } else if (isDaytime && W_WIND < 5 && GH_TEMP > tempMin + 1) {
      fan = true;
    } else if (SOIL_TEMP > SOIL_TEMP_RANGE[1] + 2) {
      fan = true;
    }
    if (isOptimal(W_TEMP, tempRange) && isOptimal(W_HUMIDITY, HUMIDITY_RANGE)) {
      fan = false;
    }

    // --- PUMP LOGIC ---
    let pump = false;
    if (GH_HUMIDITY < HUMIDITY_RANGE[0] - 5) {
      pump = true;
    }
    if (SOIL_HUMIDITY < SOIL_HUMIDITY_RANGE[0]) {
      pump = true;
    }
    if (SOIL_EC < EC_RANGE[0] || SOIL_EC > EC_RANGE[1]) {
      pump = true;
    }
    if (!isOptimal(SOIL_PH, PH_RANGE)) {
      pump = true;
    }
    if (W_TEMP > 25 || W_RAIN === 1 || W_CHANCE_RAIN >= 60) {
      pump = false;
    }
    if (SOIL_TEMP > SOIL_TEMP_RANGE[1] + 3) {
      pump = false;
    }

    // --- LIGHT LOGIC ---
    let light = false;
    if (LIGHT_ON_HOURS.includes(hour)) {
      if (isDaytime) {
        if (W_UV < LOW_UV_THRESHOLD) {
          light = true;
        } else {
          light = false;
        }
      } else {
        light = true;
      }
    }

    // --- ROOF LOGIC ---
    let roof = false;
    if (GH_TEMP > TEMP_STRESS || GH_TEMP > tempMax) {
      roof = true;
    }
    if (GH_HUMIDITY > HUMIDITY_RANGE[1] + 10 && fan) {
      roof = true;
    }
    if (W_UV > HIGH_UV_THRESHOLD && hour >= 11 && hour <= 15) {
      roof = true;
    }
    if (W_RAIN === 1 || W_CHANCE_RAIN >= 60) {
      roof = true;
    }
    if (SOIL_TEMP > SOIL_TEMP_RANGE[1] + 3) {
      roof = true;
    }
    if (isOptimal(W_TEMP, tempRange) && isOptimal(W_HUMIDITY, HUMIDITY_RANGE)) {
      roof = true;
      fan = false;
    }

    return {
      fan,
      pump,
      light,
      roof,
    };
  });
}

module.exports = { applyActuatorLogic };
