/**
 * AI Safety Service — Gemini API or Mock
 * Analyzes route, weather, and nearby locations to generate SMS alerts
 */

const USE_REAL = process.env.USE_REAL_APIS === 'true';

// ─── Mock AI Responses ─────────────────────────────────────────
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

// ─── Real Gemini Analysis ──────────────────────────────────────
async function analyzeRouteWithGemini(routeData, weather, nearbyPlaces) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
You are an AI safety assistant for a navigation app called Manzil AI.

Input:
- Route: From ${routeData.origin} to ${routeData.destination}
- Distance: ${routeData.distance}
- Weather: ${JSON.stringify(weather)}
- Nearby emergency locations: ${JSON.stringify(nearbyPlaces)}

Task:
- Detect risks in the route
- Identify emergency services nearby
- Generate a short alert message for SMS (max 20 words)
- Assign a risk level

Output ONLY a valid JSON object with this format:
{
  "message": "your alert message here",
  "riskLevel": "Low" | "Medium" | "High"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON in response');
  } catch (err) {
    console.error('Gemini parse error:', err.message);
    return getMockAlert();
  }
}

// ─── Get Random Mock Alert ─────────────────────────────────────
function getMockAlert() {
  return mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
}

// ─── Main Exported Function ────────────────────────────────────
async function analyzeRoute(routeData, weather = {}, nearbyPlaces = []) {
  if (USE_REAL && process.env.GEMINI_API_KEY) {
    try {
      return await analyzeRouteWithGemini(routeData, weather, nearbyPlaces);
    } catch {
      console.warn('⚠️ Gemini failed, using mock response');
    }
  }
  return getMockAlert();
}

module.exports = { analyzeRoute, getMockAlert };
