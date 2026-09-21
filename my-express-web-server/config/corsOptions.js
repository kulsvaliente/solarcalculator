const allowedOrigins = require('./allowedOrigins')

// Mobile-specific origins for React Native/Expo
const mobileOrigins = [
    'http://localhost:3000',      // Local development
    'http://localhost:4000',      // Solar Rooftop Calculator local development
    'http://localhost:19000',     // Expo development
    'http://localhost:19006',     // Expo web
    'exp://localhost:19000',      // Expo Go app
    'exp://192.168.x.x:19000',    // Replace with your local IP
    'https://your-expo-preview-url.exp.dev',  // Expo preview
    '*'                           // Allow all origins (use with caution)
];

const corsOptions = {
    origin: (origin, callback) => {
        // Check if origin is in allowed origins or mobile origins
        if (allowedOrigins.indexOf(origin) !== -1 || 
            mobileOrigins.indexOf(origin) !== -1 || 
            !origin){
            callback(null, true)
        }else{
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-key'],
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions