/**
 * AI Safety Service — Google Gemini 1.5 Flash
 * Analyzes route, weather, and nearby locations to generate SMS alerts
 */

// ─── Mock Fallback Alerts ──────────────────────────────────────
const mockAlerts = [
  { message: '⚠️ Heavy rain ahead on your route. Reduce speed and stay safe!', riskLevel: 'High' },
  { message: '🏥 Government Hospital located 2km ahead on your right.', riskLevel: 'Low' },
  { message: '🚔 Police checkpoint 5km ahead. Keep documents ready.', riskLevel: 'Low' },
  { message: '🌪️ Strong winds detected on mountain pass. Drive carefully!', riskLevel: 'High' },
  { message: '🚧 Road construction zone ahead. Expect delays of 20 mins.', riskLevel: 'Medium' },
  { message: '⛽ Fuel station available in 3km. Consider refueling.', riskLevel: 'Low' },
  { message: '🌫️ Low visibility due to fog. Turn on headlights and slow down.', riskLevel: 'High' },
  { message: '🏥 Emergency clinic spotted nearby. Noted for your safety.', riskLevel: 'Low' },
  { message: '⚠️ Accident reported 8km ahead. Consider alternate route.', riskLevel: 'Medium' },
  { message: '✅ Route looks clear! Drive safe and enjoy your journey.', riskLevel: 'Low' },
];

function getMockAlert() {
  return mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
}

// ─── Real Gemini 1.5 Flash Analysis ───────────────────────────
async function analyzeRouteWithGemini(routeData, weather, nearbyPlaces) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Use gemini-1.5-flash — fast and cost-effective
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const weatherSummary = weather
    ? `${weather.condition}, ${weather.temp}°C, wind ${weather.windSpeed}km/h, humidity ${weather.humidity}%`
    : 'Weather data unavailable';

  const placesSummary = nearbyPlaces?.slice(0, 5).map(p =>
    `${p.name} (${p.type}, ${p.distance})`
  ).join(', ') || 'No nearby places data';

  const prompt = `You are Manzil AI, a smart safety assistant for travelers in South Asia.

Route Details:
- From: ${routeData.origin}
- To: ${routeData.destination}  
- Distance: ${routeData.distance}
- Duration: ${routeData.duration}
- Current Weather: ${weatherSummary}
- Nearby Emergency Services: ${placesSummary}

Your task: Generate ONE concise SMS safety alert for the traveler.
- Max 25 words
- Include relevant emoji
- Be specific to the weather/route conditions
- Assign a risk level

IMPORTANT: Respond ONLY with valid JSON, nothing else:
{"message": "your alert here", "riskLevel": "Low" | "Medium" | "High"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    // Validate structure
    if (parsed.message && parsed.riskLevel) {
      return parsed;
    }
  }
  throw new Error('Invalid Gemini response format');
}

// ─── Main Exported Function ────────────────────────────────────
async function analyzeRoute(routeData, weather = {}, nearbyPlaces = []) {
  if (process.env.GEMINI_API_KEY && process.env.USE_REAL_APIS === 'true') {
    try {
      const result = await analyzeRouteWithGemini(routeData, weather, nearbyPlaces);
      console.log(`🤖 [Gemini] Risk: ${result.riskLevel} | ${result.message}`);
      return result;
    } catch (err) {
      console.warn('⚠️ Gemini failed, using mock:', err.message);
    }
  }
  return getMockAlert();
}

module.exports = { analyzeRoute, getMockAlert };
