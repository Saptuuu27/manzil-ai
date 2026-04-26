/**
 * Weather Service — OpenWeatherMap or Mock
 */

const axios = require('axios');
const USE_REAL = process.env.USE_REAL_APIS === 'true';

const mockWeatherData = [
  { condition: 'Clear', description: 'Clear skies, good visibility', temp: 28, humidity: 45, windSpeed: 12, icon: '☀️' },
  { condition: 'Rain', description: 'Heavy rainfall expected', temp: 22, humidity: 85, windSpeed: 25, icon: '🌧️' },
  { condition: 'Fog', description: 'Dense fog, low visibility', temp: 18, humidity: 95, windSpeed: 5, icon: '🌫️' },
  { condition: 'Storm', description: 'Thunderstorm with lightning', temp: 20, humidity: 90, windSpeed: 45, icon: '⛈️' },
  { condition: 'Cloudy', description: 'Partly cloudy, mild breeze', temp: 25, humidity: 60, windSpeed: 15, icon: '⛅' },
];

async function getWeather(location) {
  if (USE_REAL && process.env.OPENWEATHER_API_KEY) {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: location,
            appid: process.env.OPENWEATHER_API_KEY,
            units: 'metric'
          }
        }
      );
      const data = response.data;
      return {
        condition: data.weather[0].main,
        description: data.weather[0].description,
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s → km/h
        icon: getWeatherIcon(data.weather[0].main)
      };
    } catch (err) {
      console.warn('⚠️ Weather API failed, using mock:', err.message);
    }
  }

  // Return random mock weather
  return mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
}

function getWeatherIcon(condition) {
  const icons = {
    Clear: '☀️', Rain: '🌧️', Drizzle: '🌦️',
    Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️',
    Fog: '🌫️', Clouds: '⛅'
  };
  return icons[condition] || '🌤️';
}

module.exports = { getWeather };
