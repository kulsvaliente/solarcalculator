import React, { useState, useRef, useEffect } from 'react';
import { useGetSettingsQuery } from '../../settings/settingsApiSlice';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Zoom,
  Card,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SolarPower as SolarIcon,
  AttachMoney as MoneyIcon,
  Build as BuildIcon,
  School as SchoolIcon,
  LibraryBooks as TemplatesIcon,
  LocationOn as LocationIcon,
  MyLocation as PinLocationIcon,
  Map as MapIcon,
  Straighten as RulerIcon,
  TrendingUp as FinancialIcon,
  Settings as TechnicalIcon
} from '@mui/icons-material';
import PromptTemplates from './PromptTemplates';
import { getSunPeakHours } from '../services/solarIrradianceService';
import { getCurrentLocation } from '../utils/getCurrentLocation';
import DraggablePinMap from './DraggablePinMap';
import { useGetPricingForAIQuery } from '../../pricing/pricingApiSlice';
import { useConversation } from '../context/ConversationContext';
import { extractAll } from '../services/nlpParameterExtractor';
import { validateAll } from '../services/parameterValidator';
// Using direct API calls instead of SDK

const SolarAIChatbot = ({ calculatorData, isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm cAIre (Chat AI for Renewable Energy), your Solar AI Assistant. I can help you with technical guidance, financial analysis, and system optimization. What would you like to know about your solar system?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapPinPosition, setMapPinPosition] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef(null);

  // Mobile responsiveness
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check AI agent status
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useGetSettingsQuery();
  
  // Get dynamic pricing data for AI context
  const { data: pricingData, isLoading: pricingLoading } = useGetPricingForAIQuery();

  // Use Conversation Context for unified state management
  // This enables seamless parameter extraction and validation
  const {
    addMessage: addContextMessage,
    updateExtractedParams,
    validateExtractedParams,
    extractedParams,
    validatedParams,
    setConversationStage
  } = useConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only auto-scroll when user sends a message, not when bot replies
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender === 'user') {
      scrollToBottom();
    }
  }, [messages]);

  const quickActions = [
    {
      category: 'Technical Guidance',
      icon: <BuildIcon />,
      color: '#1976d2',
      actions: [
        { text: 'Help me choose solar panels', prompt: 'What type of solar panels should I choose for my system?' },
        { text: 'System sizing help', prompt: 'How do I calculate the right system size for my energy needs?' },
        { text: 'Installation guidance', prompt: 'What are the step-by-step installation tips and safety advice?' },
        { text: 'Maintenance tips', prompt: 'What are the best practices for solar panel maintenance and cleaning?' }
      ]
    },
    {
      category: 'Financial Analysis',
      icon: <MoneyIcon />,
      color: '#2e7d32',
      actions: [
        { text: 'Philippines cost breakdown', prompt: 'Can you explain the different cost components of a solar system in the Philippines with current market prices?' },
        { text: 'Payback period calculation', prompt: 'How do I calculate when I will break even on my solar investment using Philippines electricity rates?' },
        { text: 'Philippines incentives', prompt: 'What rebates, tax credits, and financing options are available in the Philippines for solar installations?' },
        { text: 'Energy bill analysis', prompt: 'Help me interpret my Philippines electricity bill and calculate potential solar savings' },
        { text: 'ROI for Philippines', prompt: 'Calculate the return on investment for a solar system in the Philippines market' }
      ]
    },
    {
      category: 'System Optimization',
      icon: <SolarIcon />,
      color: '#ed6c02',
      actions: [
        { text: 'Analyze my current setup', prompt: 'Analyze my current solar calculator inputs and suggest optimizations for Philippines conditions' },
        { text: 'ROI calculation', prompt: 'Calculate the return on investment for my solar system using Philippines market data' },
        { text: 'Energy production estimate', prompt: 'Estimate my annual energy production and savings in the Philippines' },
        { text: 'Equipment recommendations', prompt: 'Recommend the best equipment for my specific needs in the Philippines market' },
        { text: 'Inverter types comparison', prompt: 'What is the difference between grid-tied and hybrid inverters, and which should I choose?' }
      ]
    },
    {
      category: 'Philippines Specific',
      icon: <SchoolIcon />,
      color: '#9c27b0',
      actions: [
        { text: 'Net Metering Program', prompt: 'Explain the Philippines Net Metering Program and how to apply' },
        { text: 'Local permits & requirements', prompt: 'What permits and requirements do I need for solar installation in the Philippines?' },
        { text: 'Weather considerations', prompt: 'How does Philippines weather affect solar panel performance and maintenance?' },
        { text: 'Local installers', prompt: 'How do I find reputable solar installers in the Philippines?' },
        { text: 'Battery storage options', prompt: 'What are the battery storage options and costs for solar systems in the Philippines?' },
        { text: 'Location-based pricing', prompt: 'How do installation costs differ between provinces and urban areas in the Philippines?' }
      ]
    }
  ];

  const handleTemplateSelect = (prompt) => {
    setInputText(prompt);
    setShowTemplates(false);
  };

  /**
   * Extract and validate parameters from user message
   * Uses NLP extraction and validation services
   * Updates conversation context with extracted parameters
   * 
   * @param {string} message - User message text to extract parameters from
   * @returns {Object} Object containing extracted and validated parameters
   */
  const extractParametersFromMessage = (message) => {
    // Extract parameters using NLP service
    const extracted = extractAll(message);
    
    // Update conversation context with extracted parameters
    if (extracted.extractedFields.length > 0) {
      updateExtractedParams(extracted);
      
      // Validation will be triggered automatically by the context
      // No need to manually trigger it here
    }
    
    // Validate extracted parameters locally for this message
    const paramsToValidate = {
      area: extracted.area?.value,
      budget: extracted.financial?.budget,
      monthlyBill: extracted.financial?.monthlyBill,
      lat: extracted.location?.lat,
      lng: extracted.location?.lng,
      tilt: extracted.technical?.tilt,
      azimuth: extracted.technical?.azimuth,
    };
    
    // Run validation service
    const validated = validateAll(paramsToValidate);
    
    // Return both extracted and validated parameters
    return {
      extracted,
      validated,
      hasParameters: extracted.extractedFields.length > 0
    };
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // Check if AI agent is available
    if (!settingsLoading && settings && !settings.data?.aiAgent?.available) {
      const errorMessage = {
        id: Date.now(),
        text: `cAIre (Chat AI for Renewable Energy) is currently unavailable. Reason: ${settings.data.aiAgent.reason || 'Unknown'}. Please try again later or contact an administrator.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    // Extract and validate parameters from user message
    // This enables the AI to acknowledge and work with specific values
    const parameterResults = extractParametersFromMessage(text.trim());

    setMessages(prev => {
      const newMessages = [...prev, { ...userMessage, extractedParams: parameterResults }];
      return newMessages;
    });
    
    // Also add to conversation context for persistence
    addContextMessage(userMessage);
    
    setInputText('');
    setIsLoading(true);

    try {
      // Create context-aware prompt including extracted parameters
      const contextPrompt = createContextPrompt(text, calculatorData, parameterResults);
      
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://solarcalc-backend.nbericmmsu.com';
      const response = await fetch(`${apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are cAIre (Chat AI for Renewable Energy), a Solar Energy Expert AI Assistant specializing in the Philippines market. You provide technical guidance, financial analysis, and educational support for solar panel systems.

IMPORTANT: PARAMETER EXTRACTION AND ACKNOWLEDGMENT
- When users mention specific values (locations, dimensions, budgets, technical specs), explicitly acknowledge them in your response
- Example: "I see you have a 50 sqm roof in Manila with a budget of ₱200,000. Let me help you calculate..."
- Extract and confirm: location (city, coordinates), area (sqm), budget (pesos), monthly bill, tilt angle, orientation
- If parameters are provided, incorporate them naturally into your response and calculations
- Ask clarifying questions if critical information is missing or ambiguous

IMPORTANT: SUN PEAK HOURS DATA ACCURACY
- If you receive PVWatts API data in the context, use ONLY that data for sun peak hours calculations
- PVWatts data is location-specific and accurate (e.g., Ilocos Norte: ~4.7 hours/day)
- If no PVWatts data is available, clearly state you're using generic estimates and recommend using the solar calculator first
- NEVER provide generic 5-6 hour estimates when PVWatts data is available

STRICT PRICING POLICY:
- Do NOT provide exact prices. Always provide realistic price ranges (e.g., ₱120,000–₱150,000), rounded to sensible figures.
- When given an exact price in your knowledge, convert it into a reasonable range (±10–20%) and present it as a range.
- Use qualifiers like "approx.", "typically", or "around". Avoid single exact peso amounts.

Your expertise includes:
- Solar panel selection, sizing, and configuration
- Installation guidance and safety advice
- Maintenance and cleaning best practices
- Financial analysis including cost breakdowns, ROI, and payback periods
- Philippines-specific incentives, rebates, and regulations
- Energy bill analysis and savings calculations
- System optimization and equipment recommendations

PHILIPPINES SOLAR MARKET PRICING (2024, ranges):
- Solar Panels: approx. ₱6,500–₱7,500 per kW (monocrystalline)
  * 700W panels: approx. ₱4,500–₱5,300 each
  * 550W panels: approx. ₱3,400–₱4,300 each
  * 450W panels: approx. ₱2,800–₱3,500 each
- Inverters (per kW):
  * Grid-Tied Inverters: approx. ₱3,800–₱4,800 per kW
  * Hybrid On-Grid Inverters: approx. ₱6,500–₱8,500 per kW
- Installation (labor + logistics):
  * Provinces: approx. ₱25,000–₱35,000 per kW
  * Urban Areas: approx. ₱45,000–₱55,000 per kW
- Mounting System: approx. ₱3,000–₱5,000 per kW
- Electrical Components: approx. ₱2,000–₱4,000 per kW
- Battery Storage (optional, per unit):
  * 100Ah battery: approx. ₱32,000–₱42,000
  * 200Ah battery: approx. ₱65,000–₱80,000
  * 300Ah battery: approx. ₱100,000–₱125,000
- Permits & Documentation: approx. ₱10,000–₱20,000
- Total System Cost (ranges, per kW installed):
  * Grid-Tied – Provinces: approx. ₱50,000–₱65,000/kW
  * Grid-Tied – Urban: approx. ₱75,000–₱90,000/kW
  * Hybrid (no battery) – Provinces: approx. ₱53,000–₱68,000/kW
  * Hybrid (no battery) – Urban: approx. ₱78,000–₱93,000/kW
  * Hybrid with 100Ah battery – Provinces: approx. ₱90,000–₱105,000/kW
  * Hybrid with 100Ah battery – Urban: approx. ₱115,000–₱130,000/kW

PHILIPPINES ELECTRICITY RATES:
- Residential: ₱8.50–₱12.50 per kWh
- Commercial: ₱6.50–₱10.50 per kWh
- Industrial: ₱4.50–₱8.50 per kWh

PHILIPPINES INCENTIVES:
- Net Metering Program (NMP) – Export excess energy to grid
- Renewable Energy Act (RA 9513) – Tax incentives
- Green Energy Option Program (GEOP) – Choose renewable energy suppliers
- Local government incentives vary by province

Always provide practical, actionable advice with Philippines-specific pricing and regulations. Use examples and calculations when relevant, but keep all price outputs as ranges with clear assumptions.`
            },
            {
              role: "user",
              content: contextPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const botResponse = {
        id: Date.now() + 1,
        text: data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createContextPrompt = (userInput, calcData, paramResults = null) => {
    let context = userInput;
    
    // Add extracted parameters to context if available
    // This helps the AI acknowledge and work with specific values mentioned by user
    if (paramResults && paramResults.hasParameters) {
      context += `\n\n**Extracted Parameters from User Message:**`;
      
      const { extracted } = paramResults;
      
      // Add location information
      if (extracted.location && extracted.location.confidence > 0) {
        context += `\n- Location: ${extracted.location.city || 'N/A'}`;
        if (extracted.location.province) context += `, ${extracted.location.province}`;
        if (extracted.location.lat && extracted.location.lng) {
          context += ` (${extracted.location.lat}, ${extracted.location.lng})`;
        }
        context += ` [Confidence: ${(extracted.location.confidence * 100).toFixed(0)}%]`;
      }
      
      // Add area information
      if (extracted.area && extracted.area.confidence > 0) {
        context += `\n- Roof Area: ${extracted.area.value} ${extracted.area.unit}`;
        if (extracted.area.width && extracted.area.length) {
          context += ` (${extracted.area.width}m × ${extracted.area.length}m)`;
        }
        context += ` [Confidence: ${(extracted.area.confidence * 100).toFixed(0)}%]`;
      }
      
      // Add financial information
      if (extracted.financial && extracted.financial.confidence > 0) {
        if (extracted.financial.budget) {
          context += `\n- Budget: ₱${extracted.financial.budget.toLocaleString()}`;
        }
        if (extracted.financial.monthlyBill) {
          context += `\n- Monthly Electricity Bill: ₱${extracted.financial.monthlyBill.toLocaleString()}`;
        }
        context += ` [Confidence: ${(extracted.financial.confidence * 100).toFixed(0)}%]`;
      }
      
      // Add technical information
      if (extracted.technical && extracted.technical.confidence > 0) {
        if (extracted.technical.tilt !== null) {
          context += `\n- Panel Tilt: ${extracted.technical.tilt}°`;
        }
        if (extracted.technical.azimuth !== null) {
          context += `\n- Panel Azimuth: ${extracted.technical.azimuth}° (${extracted.technical.orientation || 'N/A'})`;
        }
        context += ` [Confidence: ${(extracted.technical.confidence * 100).toFixed(0)}%]`;
      }
      
      context += `\n\n**IMPORTANT:** Please acknowledge these extracted values in your response and use them in your calculations.`;
    }
    
    // Check if we have location data from pin location
    const hasLocationData = locationData || (calcData && calcData.sunPeakHoursData);
    
    if (hasLocationData) {
      const locationInfo = locationData || calcData;
      context += `\n\n**Current Location Data:**
- Location: ${locationInfo.latitude || calcData?.latitude || 'N/A'}, ${locationInfo.longitude || calcData?.longitude || 'N/A'}
- Data Source: NREL PVWatts API v8 (Accurate location-based data)`;

      // Add PVWatts data
      const sunPeakData = locationData?.sunPeakHoursData || calcData?.sunPeakHoursData;
      if (sunPeakData) {
        context += `\n- **Sun Peak Hours (Location-Specific):**
- Annual Average: ${sunPeakData.annualAverage?.sunPeakHoursFormatted || 'N/A'}
- Seasonal Sun Peak Hours:
  * Hot/Dry: ${sunPeakData.seasonalAverages?.hotDry ?? sunPeakData.seasonalAverages?.summer ?? 'N/A'} kWh/m²
  * Wet/Rainy: ${sunPeakData.seasonalAverages?.wetRainy ?? sunPeakData.seasonalAverages?.winter ?? 'N/A'} kWh/m²`;
      }
    } else if (calcData && Object.keys(calcData).length > 0) {
      context += `\n\nCurrent Solar Calculator Data:
- Location: ${calcData.latitude || 'N/A'}, ${calcData.longitude || 'N/A'}
- Area: ${calcData.area || 'N/A'} sqm
- Panel Size: ${calcData.panelSize || 'N/A'} W
- Tilt Angle: ${calcData.tilt || 'N/A'}°
- Azimuth: ${calcData.azimuth || 'N/A'}°
- Electricity Rate: ₱${calcData.rate || 'N/A'}/kWh
- Estimated Capacity: ${calcData.estimatedCapacity || 'N/A'} kW
- Annual Energy Production: ${calcData.annualProduction || 'N/A'} kWh
- Annual Savings: ₱${calcData.annualSavings || 'N/A'}`;
    }
    
    // Add dynamic pricing data if available
    if (pricingData && !pricingLoading) {
      context += `\n\n**Current Philippines Solar Market Pricing (Dynamic Data):**`;
      
      Object.entries(pricingData).forEach(([category, items]) => {
        if (items && items.length > 0) {
          const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          context += `\n- **${categoryName}:**`;
          items.forEach(item => {
            context += `\n  * ${item.name}: ${item.priceRange} (${item.unit})`;
            if (item.region !== 'all') {
              context += ` [${item.region}]`;
            }
          });
        }
      });
      
      context += `\n\n**Note:** All prices are current market ranges. Use these for accurate cost estimates.`;
    }
    
    if (!hasLocationData) {
      context += `\n\n**Note:** No location-specific solar data available. For accurate sun peak hours, please use the pin location button or solar calculator first.`;
    }
    
    return context;
  };

  const handleQuickAction = (prompt) => {
    handleSendMessage(prompt);
  };

  const handleClearConversation = () => {
    setMessages([
      {
        id: 1,
        text: "Hi! I'm cAIre (Chat AI for Renewable Energy), your Solar AI Assistant. I can help you with technical guidance, financial analysis, and system optimization. What would you like to know about your solar system?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };


  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Location fetching functions
  const handlePinCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { lat, lng } = await getCurrentLocation();
      await fetchLocationData(lat, lng);
    } catch (error) {
      console.error('Error getting current location:', error);
      const errorMessage = {
        id: Date.now(),
        text: "Sorry, I couldn't access your current location. Please try entering coordinates manually or check your browser permissions.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleManualLocationSubmit = async () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      const errorMessage = {
        id: Date.now(),
        text: "Please enter valid latitude and longitude coordinates.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const errorMessage = {
        id: Date.now(),
        text: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsFetchingLocation(true);
    try {
      await fetchLocationData(lat, lng);
    } catch (error) {
      console.error('Error fetching location data:', error);
      const errorMessage = {
        id: Date.now(),
        text: "Sorry, I couldn't fetch solar data for that location. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const fetchLocationData = async (lat, lng) => {
    try {
      const sunPeakData = await getSunPeakHours(lat, lng, {
        tilt: 18,
        azimuth: 180,
        systemCapacity: 1,
        arrayType: 1,
        moduleType: 1,
        losses: 20
      });

      if (sunPeakData.success) {
        setLocationData(sunPeakData);
        
        // Add location data to calculator data context
        const updatedCalculatorData = {
          ...calculatorData,
          latitude: lat,
          longitude: lng,
          sunPeakHoursData: {
            annualAverage: sunPeakData.annualAverage,
            seasonalAverages: sunPeakData.seasonalAverages,
            monthlyData: sunPeakData.monthlyData
          }
        };

        // Find highest and lowest peak sun hours from monthly data
        const monthlyData = sunPeakData.monthlyData || [];
        const highestPeak = monthlyData.reduce((max, month) => 
          month.sunPeakHours > max.sunPeakHours ? month : max, monthlyData[0] || {});
        const lowestPeak = monthlyData.reduce((min, month) => 
          month.sunPeakHours < min.sunPeakHours ? month : min, monthlyData[0] || {});

        const successMessage = {
          id: Date.now(),
          text: `📍 Location pinned! I've fetched solar data for ${lat.toFixed(4)}, ${lng.toFixed(4)}.\n\n**Sun Peak Hours:**\n• Annual Average: ${sunPeakData.annualAverage.sunPeakHours} hours\n• Peak Sun Hour: ${highestPeak.sunPeakHours} hours (${highestPeak.month})\n• Lowest Peak Sun Hour: ${lowestPeak.sunPeakHours} hours (${lowestPeak.month})\n\nI can now provide accurate, location-specific solar advice!`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Update the calculator data context
        if (calculatorData && typeof calculatorData === 'object') {
          Object.assign(calculatorData, updatedCalculatorData);
        }
      } else {
        throw new Error(sunPeakData.error || 'Failed to fetch solar data');
      }
    } catch (error) {
      throw error;
    }
  };

  // Map dialog handlers
  const handleOpenMapDialog = () => {
    setShowMapDialog(true);
    // Set initial position to current location or Philippines center
    if (locationData?.location) {
      setMapPinPosition([locationData.location.latitude, locationData.location.longitude]);
    } else {
      setMapPinPosition([12.8797, 121.7740]); // Philippines center
    }
  };

  const handleMapPinDrag = (position) => {
    setMapPinPosition(position);
  };

  const handleConfirmMapLocation = async () => {
    if (mapPinPosition) {
      const [lat, lng] = mapPinPosition;
      setShowMapDialog(false);
      setIsFetchingLocation(true);
      try {
        await fetchLocationData(lat, lng);
      } catch (error) {
        console.error('Error fetching location data:', error);
        const errorMessage = {
          id: Date.now(),
          text: "Sorry, I couldn't fetch solar data for that location. Please try again.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsFetchingLocation(false);
      }
    }
  };

  /**
   * Render parameter badges for extracted values
   * Shows visual chips for location, area, financial, and technical parameters
   * Color-coded by confidence: teal (high), blue (medium), orange (low)
   * 
   * @param {Object} extractedParams - Extracted parameters from message
   * @returns {JSX.Element|null} Parameter badges or null if no parameters
   */
  const renderParameterBadges = (extractedParams) => {
    if (!extractedParams || !extractedParams.hasParameters) return null;

    const { extracted } = extractedParams;
    const badges = [];

    // Helper function to get confidence color
    const getConfidenceColor = (confidence) => {
      if (confidence > 0.8) return { bg: '#e0f2f1', border: '#26a69a', text: '#00695c' }; // Teal - high confidence
      if (confidence > 0.5) return { bg: '#e3f2fd', border: '#42a5f5', text: '#1565c0' }; // Blue - medium confidence
      return { bg: '#fff3e0', border: '#ff9800', text: '#e65100' }; // Orange - low confidence
    };

    // Helper function to get parameter icon
    const getParameterIcon = (type) => {
      switch (type) {
        case 'location': return <LocationIcon fontSize="small" />;
        case 'area': return <RulerIcon fontSize="small" />;
        case 'financial': return <FinancialIcon fontSize="small" />;
        case 'technical': return <TechnicalIcon fontSize="small" />;
        default: return null;
      }
    };

    // Add location badge
    if (extracted.location && extracted.location.confidence > 0) {
      const colors = getConfidenceColor(extracted.location.confidence);
      const locationText = extracted.location.city || 
                          `${extracted.location.lat?.toFixed(2)}, ${extracted.location.lng?.toFixed(2)}`;
      badges.push({
        type: 'location',
        label: `📍 ${locationText}`,
        confidence: extracted.location.confidence,
        colors
      });
    }

    // Add area badge
    if (extracted.area && extracted.area.confidence > 0) {
      const colors = getConfidenceColor(extracted.area.confidence);
      badges.push({
        type: 'area',
        label: `📏 ${extracted.area.value} sqm`,
        confidence: extracted.area.confidence,
        colors
      });
    }

    // Add financial badges
    if (extracted.financial && extracted.financial.confidence > 0) {
      const colors = getConfidenceColor(extracted.financial.confidence);
      if (extracted.financial.budget) {
        badges.push({
          type: 'financial',
          label: `💰 Budget: ₱${extracted.financial.budget.toLocaleString()}`,
          confidence: extracted.financial.confidence,
          colors
        });
      }
      if (extracted.financial.monthlyBill) {
        badges.push({
          type: 'financial',
          label: `💡 Bill: ₱${extracted.financial.monthlyBill.toLocaleString()}/mo`,
          confidence: extracted.financial.confidence,
          colors
        });
      }
    }

    // Add technical badge
    if (extracted.technical && extracted.technical.confidence > 0) {
      const colors = getConfidenceColor(extracted.technical.confidence);
      const techDetails = [];
      if (extracted.technical.tilt !== null) techDetails.push(`${extracted.technical.tilt}° tilt`);
      if (extracted.technical.orientation) techDetails.push(extracted.technical.orientation);
      if (techDetails.length > 0) {
        badges.push({
          type: 'technical',
          label: `⚙️ ${techDetails.join(', ')}`,
          confidence: extracted.technical.confidence,
          colors
        });
      }
    }

    if (badges.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        {badges.map((badge, index) => (
          <Tooltip 
            key={index} 
            title={`Confidence: ${(badge.confidence * 100).toFixed(0)}% - Click to edit`}
            arrow
          >
            <Chip
              icon={getParameterIcon(badge.type)}
              label={badge.label}
              size="small"
              sx={{
                bgcolor: badge.colors.bg,
                border: `1.5px solid ${badge.colors.border}`,
                color: badge.colors.text,
                fontWeight: 'bold',
                fontSize: '0.75rem',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: badge.colors.border + '20',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${badge.colors.border}40`
                },
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={() => {
                // Future enhancement: Open inline edit dialog
                console.log('Edit parameter:', badge);
              }}
            />
          </Tooltip>
        ))}
      </Box>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .message-enter {
            animation: fadeInUp 0.5s ease-out;
          }
          .message-user {
            animation: slideInFromRight 0.5s ease-out;
          }
          .message-bot {
            animation: slideInFromLeft 0.5s ease-out;
          }
          .chat-container {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            position: relative;
          }
          .chat-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 80%, rgba(25, 118, 210, 0.03) 0%, transparent 50%), 
                        radial-gradient(circle at 80% 20%, rgba(46, 125, 50, 0.03) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }
          .user-message {
            background: white !important;
            color: #666 !important;
          }
          .user-message * {
            color: #666 !important;
          }
        `}
      </style>
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={isMobile ? "sm" : "md"}
      fullWidth
      fullScreen={isSmallMobile}
      PaperProps={{
        sx: {
          height: isSmallMobile ? '100vh' : isMobile ? '90vh' : '85vh',
          maxHeight: isSmallMobile ? '100vh' : isMobile ? '90vh' : '900px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isSmallMobile ? 0 : 3,
          boxShadow: isSmallMobile ? 'none' : '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          margin: isSmallMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1, sm: 2 },
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #64b5f6 100%)',
        color: 'white',
        p: { xs: 2, sm: 3 },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
          pointerEvents: 'none'
        }
      }}>
        <Fade in={true} timeout={1000}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              width: { xs: 32, sm: 40 }, 
              height: { xs: 32, sm: 40 },
              animation: 'pulse 2s infinite'
            }}>
              <BotIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography variant={isSmallMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', mb: 0.5 }}>
                cAIre
              </Typography>
              <Typography variant="caption" sx={{ 
                opacity: 0.9, 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                display: { xs: 'none', sm: 'block' }
              }}>
                Solar Energy AI Assistant
              </Typography>
            </Box>
          </Box>
        </Fade>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
          {!isSmallMobile && (
            <Tooltip title="Clear conversation" arrow>
              <Button
                onClick={handleClearConversation}
                variant="outlined"
                size="small"
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderColor: 'rgba(255,255,255,0.5)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease-in-out',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 2
                }}
              >
                Clear
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Close" arrow>
            <IconButton 
              onClick={onClose} 
              size={isSmallMobile ? "small" : "medium"}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* AI Agent Status Indicator */}
      {!settingsLoading && settings && !settings.data?.aiAgent?.available && (
        <Box sx={{ 
          p: 2, 
          bgcolor: '#ffebee', 
          borderBottom: 1, 
          borderColor: '#ffcdd2',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
            ⚠️ cAIre (Chat AI for Renewable Energy) is currently unavailable
          </Typography>
          <Typography variant="body2" color="error">
            ({settings.data.aiAgent.reason})
          </Typography>
        </Box>
      )}

      <DialogContent sx={{ p: 0, display: 'flex', height: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Mobile Quick Actions Toggle Button */}
        {isMobile && (
          <Box sx={{ 
            p: 1, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            bgcolor: '#f5f5f5'
          }}>
            <Button
              onClick={() => setShowQuickActions(!showQuickActions)}
              variant="outlined"
              size="small"
              startIcon={<TemplatesIcon />}
              sx={{
                bgcolor: showQuickActions ? '#1976d2' : 'white',
                color: showQuickActions ? 'white' : '#1976d2',
                borderColor: '#1976d2',
                '&:hover': {
                  bgcolor: showQuickActions ? '#1565c0' : '#e3f2fd'
                }
              }}
            >
              {showQuickActions ? 'Hide Quick Actions' : 'Show Quick Actions'}
            </Button>
          </Box>
        )}

        {/* Left Column - Quick Actions */}
        <Box sx={{ 
          width: { xs: '100%', md: '40%' },
          minWidth: { xs: 'auto', md: '300px' },
          borderRight: { xs: 0, md: 1 }, 
          borderBottom: { xs: 1, md: 0 },
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          overflow: 'auto',
          display: { xs: showQuickActions ? 'block' : 'none', md: 'block' },
          maxHeight: { xs: '50vh', md: 'none' }
        }}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant={isSmallMobile ? "subtitle1" : "h6"} gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: { xs: 2, sm: 3 }
            }}>
              <Box sx={{ 
                width: 4, 
                height: { xs: 16, sm: 20 }, 
                bgcolor: '#1976d2', 
                borderRadius: 2 
              }} />
              Quick Actions
            </Typography>
            {quickActions.map((category, index) => (
              <Card key={index} sx={{ 
                mb: { xs: 1.5, sm: 2 }, 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <Button
                  startIcon={category.icon}
                  onClick={() => toggleCategory(category.category)}
                  sx={{ 
                    color: category.color,
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    width: '100%',
                    p: { xs: 1.5, sm: 2 },
                    fontWeight: 'bold',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    '&:hover': {
                      bgcolor: `${category.color}10`
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    width: '100%' 
                  }}>
                    <Typography variant={isSmallMobile ? "body2" : "body1"} sx={{ 
                      fontWeight: 'bold',
                      textAlign: 'left',
                      flex: 1
                    }}>
                      {category.category}
                    </Typography>
                    {expandedCategories[category.category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                </Button>
                <Collapse in={expandedCategories[category.category]}>
                  <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 1 } }}>
                      {category.actions.map((action, actionIndex) => (
                        <Zoom 
                          in={expandedCategories[category.category]} 
                          timeout={300 + actionIndex * 100}
                          key={actionIndex}
                        >
                          <Chip
                            label={action.text}
                            size={isSmallMobile ? "small" : "medium"}
                            onClick={() => {
                              handleQuickAction(action.prompt);
                              if (isMobile) {
                                setShowQuickActions(false);
                              }
                            }}
                            sx={{ 
                              mb: { xs: 0.5, sm: 1 },
                              bgcolor: `${category.color}15`,
                              color: category.color,
                              border: `1px solid ${category.color}30`,
                              '&:hover': {
                                bgcolor: `${category.color}25`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${category.color}30`
                              },
                              transition: 'all 0.2s ease-in-out',
                              cursor: 'pointer',
                              width: '100%',
                              justifyContent: 'flex-start',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              height: { xs: 28, sm: 32 }
                            }}
                          />
                        </Zoom>
                      ))}
                    </Box>
                  </Box>
                </Collapse>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Right Column - Chat Messages */}
        <Box className="chat-container" sx={{ 
          width: { xs: '100%', md: '60%' },
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          minHeight: { xs: '50vh', md: 'auto' },
          position: 'relative'
        }}>
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: { xs: 3, sm: 4 },
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(25, 118, 210, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(46, 125, 50, 0.03) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 0
            }
          }}>
          {messages.map((message, index) => (
            <Fade in={true} timeout={500 + index * 100} key={message.id}>
              <Box
                className={`message-${message.sender}`}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: { xs: 3, sm: 4 },
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: { xs: 1.5, sm: 2 }, 
                  maxWidth: { xs: '95%', sm: '85%' },
                  width: '100%'
                }}>
                  {message.sender === 'bot' && (
                    <Avatar sx={{ 
                      bgcolor: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      width: { xs: 28, sm: 36 }, 
                      height: { xs: 28, sm: 36 },
                      boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
                    }}>
                      <BotIcon fontSize={isSmallMobile ? "small" : "small"} />
                    </Avatar>
                  )}
                  <Paper
                    elevation={message.sender === 'user' ? 6 : 4}
                    className={message.sender === 'user' ? 'user-message' : ''}
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      bgcolor: message.sender === 'user' 
                        ? 'white !important'
                        : 'white',
                      background: message.sender === 'user' 
                        ? 'white !important'
                        : 'white',
                      color: message.sender === 'user' ? '#666 !important' : '#666',
                      borderRadius: 4,
                      position: 'relative',
                      boxShadow: message.sender === 'user' 
                        ? '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)' 
                        : '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
                      border: message.sender === 'user' 
                        ? '1px solid rgba(0,0,0,0.1)' 
                        : '1px solid rgba(0,0,0,0.1)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: message.sender === 'user' 
                          ? '0 12px 32px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)' 
                          : '0 12px 32px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'all 0.3s ease-in-out'
                      }
                    }
                  }
                  >
                    <Typography variant={isSmallMobile ? "body2" : "body1"} sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                      fontWeight: message.sender === 'user' ? 500 : 400,
                      minHeight: '20px',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      color: message.sender === 'user' ? '#666 !important' : '#666 !important',
                      textShadow: 'none',
                      WebkitTextFillColor: message.sender === 'user' ? '#666 !important' : '#666 !important'
                    }}>
                      {message.text || 'Message not found'}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      display: 'block', 
                      mt: { xs: 1.5, sm: 2 }, 
                      opacity: message.sender === 'user' ? 0.6 : 0.6,
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      fontWeight: 500,
                      color: message.sender === 'user' ? '#999 !important' : '#999 !important'
                    }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                    {/* Display extracted parameter badges for user messages */}
                    {message.sender === 'user' && message.extractedParams && renderParameterBadges(message.extractedParams)}
                  </Paper>
                  {message.sender === 'user' && (
                    <Avatar sx={{ 
                      bgcolor: 'linear-gradient(135deg, #666 0%, #999 100%)',
                      width: { xs: 28, sm: 36 }, 
                      height: { xs: 28, sm: 36 },
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      <PersonIcon fontSize={isSmallMobile ? "small" : "small"} />
                    </Avatar>
                  )}
                </Box>
              </Box>
            </Fade>
          ))}
          {isLoading && (
            <Fade in={isLoading} timeout={300}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1.5, sm: 2 }, 
                mb: { xs: 3, sm: 4 },
                position: 'relative',
                zIndex: 1
              }}>
                <Avatar sx={{ 
                  bgcolor: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  width: { xs: 32, sm: 40 }, 
                  height: { xs: 32, sm: 40 },
                  boxShadow: '0 6px 20px rgba(25,118,210,0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  <BotIcon fontSize={isSmallMobile ? "small" : "medium"} />
                </Avatar>
                <Paper 
                  elevation={4}
                  sx={{ 
                    p: { xs: 2.5, sm: 3 }, 
                    bgcolor: 'white',
                    borderRadius: 4,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    border: '1px solid rgba(25,118,210,0.1)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(25,118,210,0.02) 0%, rgba(46,125,50,0.02) 100%)',
                      borderRadius: 4,
                      pointerEvents: 'none'
                    }
                  }}
                >
                  <CircularProgress 
                    size={isSmallMobile ? 20 : 24} 
                    thickness={4} 
                    sx={{ 
                      color: '#1976d2',
                      zIndex: 1
                    }} 
                  />
                  <Typography variant={isSmallMobile ? "body2" : "body1"} sx={{ 
                    fontWeight: 500,
                    color: '#1976d2',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    zIndex: 1
                  }}>
                    cAIre is thinking...
                  </Typography>
                </Paper>
              </Box>
            </Fade>
          )}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Input Area - Right Column */}
          <Box sx={{ 
            p: { xs: 3, sm: 4 }, 
            borderTop: '2px solid rgba(25,118,210,0.1)', 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 50%, #2e7d32 100%)',
              opacity: 0.3
            }
          }}>
            {/* Location Controls */}
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 0.5, sm: 1 }, 
              mb: { xs: 1.5, sm: 2 }, 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <Tooltip title="Pin current location for accurate solar data" arrow>
                <Button
                  onClick={handlePinCurrentLocation}
                  disabled={isFetchingLocation}
                  startIcon={isFetchingLocation ? <CircularProgress size={16} /> : <PinLocationIcon />}
                  variant="outlined"
                  size={isSmallMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: '#e3f2fd',
                    color: '#1976d2',
                    borderColor: '#1976d2',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '&:hover': {
                      bgcolor: '#bbdefb',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {isFetchingLocation ? (isSmallMobile ? 'Getting...' : 'Getting Location...') : (isSmallMobile ? 'Pin Location' : 'Pin My Location')}
                </Button>
              </Tooltip>
              
              <Tooltip title="Select location on map with draggable pin" arrow>
                <Button
                  onClick={handleOpenMapDialog}
                  startIcon={<MapIcon />}
                  variant="outlined"
                  size={isSmallMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: '#e8f5e8',
                    color: '#2e7d32',
                    borderColor: '#2e7d32',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '&:hover': {
                      bgcolor: '#c8e6c9',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {isSmallMobile ? 'Map Pin' : 'Drag Pin on Map'}
                </Button>
              </Tooltip>

              <Tooltip title="Enter coordinates manually" arrow>
                <Button
                  onClick={() => setShowLocationInput(!showLocationInput)}
                  startIcon={<LocationIcon />}
                  variant="outlined"
                  size={isSmallMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: '#f3e5f5',
                    color: '#7b1fa2',
                    borderColor: '#7b1fa2',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '&:hover': {
                      bgcolor: '#e1bee7',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {isSmallMobile ? 'Coordinates' : 'Enter Coordinates'}
                </Button>
              </Tooltip>

              {locationData && (
                <Chip
                  icon={<LocationIcon />}
                  label={isSmallMobile 
                    ? `📍 ${locationData.location?.latitude?.toFixed(2)}, ${locationData.location?.longitude?.toFixed(2)}`
                    : `📍 ${locationData.location?.latitude?.toFixed(4)}, ${locationData.location?.longitude?.toFixed(4)}`
                  }
                  color="primary"
                  variant="outlined"
                  size={isSmallMobile ? "small" : "medium"}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              )}
            </Box>

            {/* Manual Location Input */}
            {showLocationInput && (
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 0.5, sm: 1 }, 
                mb: { xs: 1.5, sm: 2 }, 
                alignItems: 'center',
                p: { xs: 1.5, sm: 2 },
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <TextField
                  label="Latitude"
                  type="number"
                  size={isSmallMobile ? "small" : "medium"}
                  value={manualLocation.lat}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
                  placeholder="e.g., 18.057977"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                />
                <TextField
                  label="Longitude"
                  type="number"
                  size={isSmallMobile ? "small" : "medium"}
                  value={manualLocation.lng}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
                  placeholder="e.g., 120.544571"
                  sx={{ width: { xs: '100%', sm: 120 } }}
                />
                <Button
                  onClick={handleManualLocationSubmit}
                  disabled={isFetchingLocation || !manualLocation.lat || !manualLocation.lng}
                  variant="contained"
                  size={isSmallMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: '#4caf50',
                    '&:hover': { bgcolor: '#45a049' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {isFetchingLocation ? 'Fetching...' : 'Get Solar Data'}
                </Button>
                <Button
                  onClick={() => setShowLocationInput(false)}
                  variant="outlined"
                  size={isSmallMobile ? "small" : "medium"}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancel
                </Button>
              </Box>
            )}

        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1.5, sm: 2 }, 
          width: '100%', 
          alignItems: 'center',
          background: 'white',
          borderRadius: 4,
          p: { xs: 1, sm: 1.5 },
          boxShadow: '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid rgba(25,118,210,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          '&:focus-within': {
            borderColor: '#1976d2',
            boxShadow: '0 12px 32px rgba(25,118,210,0.2), 0 4px 16px rgba(25,118,210,0.1)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease-in-out'
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(25,118,210,0.02) 0%, rgba(46,125,50,0.02) 100%)',
            borderRadius: 4,
            pointerEvents: 'none'
          }
        }}>
          <TextField
            fullWidth
            placeholder={isSmallMobile ? "Ask cAIre..." : "Ask cAIre anything about solar energy..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            variant="outlined"
            size={isSmallMobile ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                border: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 400,
                backgroundColor: 'transparent',
                '& fieldset': {
                  border: 'none'
                },
                '&:hover fieldset': {
                  border: 'none'
                },
                '&.Mui-focused fieldset': {
                  border: 'none'
                },
                '& .MuiInputBase-input': {
                  padding: { xs: '12px 16px', sm: '16px 20px' },
                  color: '#1976d2 !important',
                  WebkitTextFillColor: '#1976d2 !important',
                  '&::placeholder': {
                    color: '#666 !important',
                    opacity: 0.8,
                    WebkitTextFillColor: '#666 !important'
                  }
                }
              }
            }}
            InputProps={{
              startAdornment: !isSmallMobile ? (
                <Tooltip title="Prompt Templates" arrow>
                  <IconButton
                    onClick={() => setShowTemplates(true)}
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{
                      color: '#1976d2',
                      '&:hover': {
                        backgroundColor: 'rgba(25,118,210,0.1)',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <TemplatesIcon />
                  </IconButton>
                </Tooltip>
              ) : undefined,
              endAdornment: (
                <Tooltip title="Send message" arrow>
                  <IconButton
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isLoading}
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{
                      bgcolor: inputText.trim() && !isLoading 
                        ? '#1976d2'
                        : '#e0e0e0',
                      color: inputText.trim() && !isLoading ? 'white !important' : '#999 !important',
                      borderRadius: 3,
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      zIndex: 1,
                      '&:hover': {
                        bgcolor: inputText.trim() && !isLoading 
                          ? '#1565c0'
                          : '#d0d0d0',
                        transform: 'scale(1.1)',
                        boxShadow: inputText.trim() && !isLoading 
                          ? '0 8px 20px rgba(25,118,210,0.4)'
                          : '0 4px 12px rgba(0,0,0,0.2)'
                      },
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: inputText.trim() && !isLoading 
                        ? '0 6px 16px rgba(25,118,210,0.3)'
                        : '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
              )
            }}
          />
          {!isSmallMobile && (
            <Tooltip title="Clear conversation" arrow>
              <Button
                onClick={handleClearConversation}
                variant="outlined"
                size="small"
                sx={{ 
                  bgcolor: '#f5f5f5',
                  color: '#666',
                  borderColor: '#d0d0d0',
                  '&:hover': { 
                    backgroundColor: '#e0e0e0',
                    borderColor: '#b0b0b0',
                    transform: 'scale(1.05)',
                    color: '#333'
                  },
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 2
                }}
              >
                Clear
              </Button>
            </Tooltip>
          )}
          </Box>
        </Box>
        </Box>
      </DialogContent>
      
      {/* Prompt Templates Dialog */}
      <PromptTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectPrompt={handleTemplateSelect}
      />

      {/* Draggable Pin Map Dialog */}
      <Dialog
        open={showMapDialog}
        onClose={() => setShowMapDialog(false)}
        maxWidth={isMobile ? "sm" : "md"}
        fullWidth
        fullScreen={isSmallMobile}
        PaperProps={{
          sx: {
            height: isSmallMobile ? '100vh' : isMobile ? '90vh' : '80vh',
            maxHeight: isSmallMobile ? '100vh' : isMobile ? '90vh' : '600px',
            margin: isSmallMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#f5f5f5',
          borderBottom: 1,
          borderColor: 'divider',
          p: { xs: 2, sm: 3 }
        }}>
          <Typography variant={isSmallMobile ? "subtitle1" : "h6"} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            <MapIcon color="primary" />
            {isSmallMobile ? 'Select Location' : 'Select Location with Draggable Pin'}
          </Typography>
          <IconButton 
            onClick={() => setShowMapDialog(false)}
            size={isSmallMobile ? "small" : "medium"}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <DraggablePinMap
            pinPosition={mapPinPosition}
            onPinDrag={handleMapPinDrag}
            height="100%"
          />
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 }, 
          bgcolor: '#f5f5f5',
          borderTop: 1,
          borderColor: 'divider',
          gap: { xs: 1, sm: 2 }
        }}>
          <Button 
            onClick={() => setShowMapDialog(false)}
            variant="outlined"
            size={isSmallMobile ? "small" : "medium"}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmMapLocation}
            variant="contained"
            disabled={!mapPinPosition}
            size={isSmallMobile ? "small" : "medium"}
            sx={{
              bgcolor: '#2e7d32',
              '&:hover': { bgcolor: '#1b5e20' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {isSmallMobile ? 'Confirm' : 'Confirm Location'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
    </>
  );
};

export default SolarAIChatbot;
