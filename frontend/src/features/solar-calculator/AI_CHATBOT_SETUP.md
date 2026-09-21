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
Add your Groq API key to your environment variables:

**For development (.env.local):**
```bash
REACT_APP_GROQ_API_KEY=***REMOVED***
```

**For production:**
Set the environment variable in your deployment platform.

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
- **API**: Direct REST API calls to Groq
- **Temperature**: 0.7 (balanced creativity and accuracy)
- **Max Tokens**: 1000 per response
- **Specialization**: Philippines solar market and regulations

## Troubleshooting

### Common Issues
1. **API Key Error**: Ensure `REACT_APP_GROQ_API_KEY` is set correctly
2. **Network Error**: Check internet connection and API key validity
3. **Rate Limiting**: Groq has rate limits; wait a moment and try again
4. **CORS Error**: The API calls are made directly from the browser (this is normal)

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
- API key is exposed in the frontend (this is normal for client-side AI integrations)
- Consider implementing rate limiting on your backend if needed
- Monitor API usage to stay within Groq's limits
