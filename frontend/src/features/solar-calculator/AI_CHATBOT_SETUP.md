# Solar AI Chatbot Setup

## Overview
The Solar AI Chatbot provides intelligent assistance for solar energy calculations, technical guidance, and financial analysis using the Groq API.

## Features
- **Technical Guidance**: Solar panel selection, system sizing, installation tips, maintenance advice
- **Financial Analysis**: Cost breakdowns, ROI calculations, payback periods, Philippines incentives
- **Context-Aware**: Uses current calculator inputs to provide personalized advice
- **Quick Actions**: Pre-defined prompts for common questions

## Setup Instructions

### 1. Get Groq API Key
1. Visit [https://console.groq.com/](https://console.groq.com/)
2. Sign up for a free account
3. Generate an API key from the dashboard

### 2. Environment Configuration
The Groq API key lives on the **backend** (`my-express-web-server`), not the frontend — the
chatbot's requests are proxied through `POST /api/ai/chat` so the key never ships to the browser.

**In `my-express-web-server/.env`:**
```bash
GROQ_API_KEY=your_groq_api_key_here
```

The frontend needs no Groq-specific configuration — it just needs `REACT_APP_API_URL` pointed at
the backend, same as every other feature.

### 3. No Additional Dependencies Required
The chatbot uses direct API calls, so no additional packages need to be installed.

## Usage

### Accessing the Chatbot
1. Open the Solar Calculator page
2. Click the blue "AI Assistant" floating action button
3. Start chatting with the AI about solar energy topics

### Quick Actions Available
- **Technical Guidance**: Panel selection, system sizing, installation, maintenance
- **Financial Analysis**: Cost breakdown, ROI, incentives, bill analysis
- **System Optimization**: Current setup analysis, equipment recommendations

### Context Awareness
The chatbot automatically receives your current calculator inputs:
- Location coordinates
- Area, panel size, tilt, azimuth
- Electricity rate
- Calculated capacity and savings (when available)

## API Model
- **Model**: `llama-3.3-70b-versatile` (latest version)
- **API**: Frontend → backend's `POST /api/ai/chat` → Groq (backend holds the key)
- **Temperature**: 0.7 (balanced creativity and accuracy)
- **Max Tokens**: 1000 per response
- **Specialization**: Philippines solar market and regulations

## Troubleshooting

### Common Issues
1. **API Key Error**: Ensure `GROQ_API_KEY` is set correctly in `my-express-web-server/.env`
2. **Network Error**: Check that the backend is running and `REACT_APP_API_URL` is correct
3. **Rate Limiting**: Groq has rate limits; wait a moment and try again

### Error Messages
- "I'm having trouble connecting" - API connection issue
- "Please check your internet connection" - Network problem
- "I couldn't process your request" - API response error

## Customization

### Adding New Quick Actions
Edit `SolarAIChatbot.jsx` and add new actions to the `quickActions` array:

```javascript
{
  category: 'Your Category',
  icon: <YourIcon />,
  color: '#your-color',
  actions: [
    { text: 'Action Text', prompt: 'Your prompt here' }
  ]
}
```

### Modifying System Prompt
Update the system message in the `handleSendMessage` function to change the AI's behavior and expertise focus.

## Security Notes
- The API key stays server-side (`my-express-web-server`) and is never sent to the browser.
- `/api` is already rate-limited on the backend (`proxyLimiter` in `server.js`).
- Monitor API usage to stay within Groq's limits.
