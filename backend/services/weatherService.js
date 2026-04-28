/**
 * Weather Service — OpenWeatherMap Current Weather API
 * Falls back to mock if API key not set
 */

const axios = require('axios');

// ─── Mock Fallback ─────────────────────────────────────────────
const mockWeatherData = [
  { condition: 'Clear',       description: 'Clear skies, good visibility',      temp: 28, humidity: 45, windSpeed: 12, icon: '☀️' },
  { condition: 'Rain',        description: 'Heavy rainfall expected',           temp: 22, humidity: 85, windSpeed: 25, icon: '🌧️' },
  { condition: 'Fog',         description: 'Dense fog, low visibility',         temp: 18, humidity: 95, windSpeed: 5,  icon: '🌫️' },
  { condition: 'Thunderstorm',description: 'Thunderstorm with lightning',       temp: 20, humidity: 90, windSpeed: 45, icon: '⛈️' },
  { condition: 'Clouds',      description: 'Partly cloudy, mild breeze',        temp: 25, humidity: 60, windSpeed: 15, icon: '⛅' },
  { condition: 'Drizzle',     description: 'Light drizzle, slippery roads',    temp: 23, humidity: 78, windSpeed: 18, icon: '🌦️' },
  { condition: 'Snow',        description: 'Snowfall, roads may be icy',       temp: 2,  humidity: 80, windSpeed: 20, icon: '❄️' },
  { condition: 'Haze',        description: 'Reduced visibility due to haze',   temp: 30, humidity: 70, windSpeed: 8,  icon: '🌫️' },
];

function getWeatherIcon(condition) {
  const icons = {
    Clear: '☀️', Rain: '🌧️', Drizzle: '🌦️',
    Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️',
    Fog: '🌫️', Clouds: '⛅', Haze: '🌫️',
    Smoke: '🌫️', Dust: '🌪️', Sand: '🌪️',
    Ash: '🌋', Squall: '💨', Tornado: '🌪️',
  };
  return icons[condition] || '🌤️';
}

// ─── OpenWeatherMap API call ───────────────────────────────────
async function getWeatherByCity(location) {
  const response = await axios.get(
    'https://api.openweathermap.org/data/2.5/weather',
    {
      params: {
        q: location,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'en',
      },
      timeout: 5000,
    }
  );

  const data = response.data;
  const weather = {
    condition:   data.weather[0].main,
    description: data.weather[0].description,
    temp:        Math.round(data.main.temp),
    feelsLike:   Math.round(data.main.feels_like),
    humidity:    data.main.humidity,
    windSpeed:   Math.round(data.wind.speed * 3.6), // m/s → km/h
    windDir:     data.wind.deg,
    visibility:  data.visibility ? Math.round(data.visibility / 1000) : null, // m → km
    icon:        getWeatherIcon(data.weather[0].main),
    cityName:    data.name,
    country:     data.sys.country,
    sunrise:     data.sys.sunrise,
    sunset:      data.sys.sunset,
  };

  console.log(`🌤️ [Weather] ${weather.cityName}: ${weather.condition}, ${weather.temp}°C`);
  return weather;
}

// ─── Get weather by coordinates ───────────────────────────────
async function getWeatherByCoords(lat, lng) {
  const response = await axios.get(
    'https://api.openweathermap.org/data/2.5/weather',
    {
      params: {
        lat, lon: lng,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric',
      },
      timeout: 5000,
    }
  );

  const data = response.data;
  return {
    condition:   data.weather[0].main,
    description: data.weather[0].description,
    temp:        Math.round(data.main.temp),
    feelsLike:   Math.round(data.main.feels_like),
    humidity:    data.main.humidity,
    windSpeed:   Math.round(data.wind.speed * 3.6),
    visibility:  data.visibility ? Math.round(data.visibility / 1000) : null,
    icon:        getWeatherIcon(data.weather[0].main),
    cityName:    data.name,
  };
}

// ─── Main exported function ────────────────────────────────────
async function getWeather(location) {
  if (process.env.OPENWEATHER_API_KEY && process.env.USE_REAL_APIS === 'true') {
    try {
      return await getWeatherByCity(location);
    } catch (err) {
      console.warn(`⚠️ Weather API failed for "${location}":`, err.message);
    }
  }
  // Return random mock weather
  return mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
}

async function getWeatherForCoords(lat, lng) {
  if (process.env.OPENWEATHER_API_KEY && process.env.USE_REAL_APIS === 'true') {
    try {
      return await getWeatherByCoords(lat, lng);
    } catch (err) {
      console.warn('⚠️ Weather coords API failed:', err.message);
    }
  }
  return mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
}

module.exports = { getWeather, getWeatherForCoords };
