/**
 * NLP Parameter Extractor Service
 * 
 * This service extracts solar calculator parameters from natural language text.
 * Designed specifically for Philippine context with support for local cities, provinces,
 * and common Filipino English patterns.
 * 
 * @module nlpParameterExtractor
 */

// Philippine locations database for matching city and province names
const PHILIPPINE_LOCATIONS = {
  // Major cities with their coordinates
  cities: {
    'manila': { province: 'Metro Manila', lat: 14.5995, lng: 120.9842 },
    'quezon city': { province: 'Metro Manila', lat: 14.6760, lng: 121.0437 },
    'makati': { province: 'Metro Manila', lat: 14.5547, lng: 121.0244 },
    'pasig': { province: 'Metro Manila', lat: 14.5764, lng: 121.0851 },
    'taguig': { province: 'Metro Manila', lat: 14.5176, lng: 121.0509 },
    'cebu city': { province: 'Cebu', lat: 10.3157, lng: 123.8854 },
    'davao city': { province: 'Davao del Sur', lat: 7.1907, lng: 125.4553 },
    'baguio': { province: 'Benguet', lat: 16.4023, lng: 120.5960 },
    'iloilo city': { province: 'Iloilo', lat: 10.7202, lng: 122.5621 },
    'cagayan de oro': { province: 'Misamis Oriental', lat: 8.4542, lng: 124.6319 },
    'bacolod': { province: 'Negros Occidental', lat: 10.6770, lng: 122.9500 },
    'zamboanga city': { province: 'Zamboanga del Sur', lat: 6.9214, lng: 122.0790 },
    'antipolo': { province: 'Rizal', lat: 14.5863, lng: 121.1758 },
    'tarlac city': { province: 'Tarlac', lat: 15.4750, lng: 120.5969 },
    'caloocan': { province: 'Metro Manila', lat: 14.6488, lng: 120.9830 },
    'laoag': { province: 'Ilocos Norte', lat: 18.1987, lng: 120.5937 },
  },
  // Provinces for broader location matching
  provinces: [
    'metro manila', 'cebu', 'davao del sur', 'benguet', 'iloilo',
    'misamis oriental', 'negros occidental', 'zamboanga del sur', 'rizal',
    'tarlac', 'ilocos norte', 'ilocos sur', 'la union', 'pangasinan',
    'batangas', 'cavite', 'laguna', 'pampanga', 'bulacan'
  ]
};

// Cardinal directions mapped to azimuth angles (degrees from north)
const DIRECTION_AZIMUTH = {
  'north': 0,
  'n': 0,
  'northeast': 45,
  'ne': 45,
  'east': 90,
  'e': 90,
  'southeast': 135,
  'se': 135,
  'south': 180,
  's': 180,
  'southwest': 225,
  'sw': 225,
  'west': 270,
  'w': 270,
  'northwest': 315,
  'nw': 315
};

/**
 * Extract location information from text
 * 
 * This function identifies Philippine cities, provinces, or geographic coordinates
 * from natural language input and returns structured location data.
 * 
 * @param {string} text - The input text to extract location from
 * @returns {Object} Location data with confidence score
 * @property {string|null} city - Extracted city name
 * @property {string|null} province - Extracted province name
 * @property {number|null} lat - Latitude coordinate
 * @property {number|null} lng - Longitude coordinate
 * @property {number} confidence - Confidence score (0-1)
 * 
 * @example
 * extractLocation("I live in Manila")
 * // Returns: { city: 'Manila', province: 'Metro Manila', lat: 14.5995, lng: 120.9842, confidence: 0.95 }
 * 
 * extractLocation("Location: 15.5°N, 120.9°E")
 * // Returns: { city: null, province: null, lat: 15.5, lng: 120.9, confidence: 1.0 }
 */
export function extractLocation(text) {
  // Return empty result if input is invalid
  if (!text || typeof text !== 'string') {
    return { city: null, province: null, lat: null, lng: null, confidence: 0 };
  }

  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Try to extract coordinates first (highest confidence if found)
  // Pattern matches: "15.5°N, 120.9°E" or "15.5, 120.9" or "lat: 15.5, lng: 120.9"
  const coordPattern = /(?:lat(?:itude)?[:\s]*)?(-?\d+\.?\d*)(?:°|degrees?)?\s*[,;\s]\s*(?:lng|lon|longitude?[:\s]*)?(-?\d+\.?\d*)(?:°|degrees?)?/i;
  const coordMatch = text.match(coordPattern);
  
  if (coordMatch) {
    // Parse the extracted coordinate values
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    
    // Validate that coordinates are within Philippine bounds (roughly)
    // Philippines: latitude 4.5°N to 21°N, longitude 116°E to 127°E
    if (lat >= 4.5 && lat <= 21 && lng >= 116 && lng <= 127) {
      return {
        city: null,
        province: null,
        lat: lat,
        lng: lng,
        confidence: 1.0  // Highest confidence for explicit coordinates
      };
    }
  }

  // Try to match known Philippine cities
  for (const [cityName, data] of Object.entries(PHILIPPINE_LOCATIONS.cities)) {
    // Create regex pattern to match city name with word boundaries
    const cityPattern = new RegExp(`\\b${cityName}\\b`, 'i');
    
    if (cityPattern.test(lowerText)) {
      // Calculate confidence based on how explicitly the city was mentioned
      let confidence = 0.95;
      
      // Check if "city" or "in" appears near the location name for higher confidence
      if (new RegExp(`(?:in|at|from|to)\\s+${cityName}`, 'i').test(lowerText)) {
        confidence = 0.98;
      }
      
      return {
        city: cityName.charAt(0).toUpperCase() + cityName.slice(1),  // Capitalize first letter
        province: data.province,
        lat: data.lat,
        lng: data.lng,
        confidence: confidence
      };
    }
  }

  // Try to match provinces if no city found
  for (const province of PHILIPPINE_LOCATIONS.provinces) {
    const provincePattern = new RegExp(`\\b${province}\\b`, 'i');
    
    if (provincePattern.test(lowerText)) {
      // Province match has lower confidence than city match
      return {
        city: null,
        province: province.charAt(0).toUpperCase() + province.slice(1),
        lat: null,
        lng: null,
        confidence: 0.7  // Lower confidence for province-only matches
      };
    }
  }

  // No location found in the text
  return { city: null, province: null, lat: null, lng: null, confidence: 0 };
}

/**
 * Extract roof area measurements from text
 * 
 * This function identifies area measurements in various formats including
 * square meters, dimensions (length x width), and common abbreviations.
 * 
 * @param {string} text - The input text to extract area from
 * @returns {Object} Area data with confidence score
 * @property {number|null} value - Total area value in square meters
 * @property {string|null} unit - Unit of measurement
 * @property {number|null} width - Width dimension (if provided as dimensions)
 * @property {number|null} length - Length dimension (if provided as dimensions)
 * @property {number} confidence - Confidence score (0-1)
 * 
 * @example
 * extractArea("My roof is 50 sqm")
 * // Returns: { value: 50, unit: 'sqm', width: null, length: null, confidence: 0.95 }
 * 
 * extractArea("10m x 5m roof")
 * // Returns: { value: 50, unit: 'sqm', width: 10, length: 5, confidence: 0.9 }
 */
export function extractArea(text) {
  // Return empty result if input is invalid
  if (!text || typeof text !== 'string') {
    return { value: null, unit: null, width: null, length: null, confidence: 0 };
  }

  // Convert to lowercase for matching
  const lowerText = text.toLowerCase();

  // Pattern 1: Dimensions format "10m x 5m" or "10 meters by 5 meters"
  const dimensionPattern = /(\d+\.?\d*)\s*(?:m|meters?|metres?)\s*(?:x|by|×)\s*(\d+\.?\d*)\s*(?:m|meters?|metres?)/i;
  const dimensionMatch = text.match(dimensionPattern);
  
  if (dimensionMatch) {
    // Parse the width and length values
    const width = parseFloat(dimensionMatch[1]);
    const length = parseFloat(dimensionMatch[2]);
    const area = width * length;  // Calculate total area
    
    // Validate reasonable roof dimensions (between 1m and 1000m per side)
    if (width > 0 && width < 1000 && length > 0 && length < 1000) {
      return {
        value: area,
        unit: 'sqm',
        width: width,
        length: length,
        confidence: 0.9  // High confidence for dimensional input
      };
    }
  }

  // Pattern 2: Direct area value "50 sqm" or "50 square meters"
  const areaPattern = /(\d+\.?\d*)\s*(?:sqm|sq\.?\s*m\.?|square\s*met(?:er|re)s?|m²|m2)/i;
  const areaMatch = text.match(areaPattern);
  
  if (areaMatch) {
    // Parse the area value
    const area = parseFloat(areaMatch[1]);
    
    // Validate reasonable roof area (between 1 and 10000 square meters)
    if (area > 0 && area < 10000) {
      let confidence = 0.95;  // Base confidence for explicit area mention
      
      // Increase confidence if "roof", "rooftop", or "area" appears nearby
      if (/(?:roof|rooftop|area).*\d+\.?\d*\s*sqm/i.test(text)) {
        confidence = 0.98;
      }
      
      return {
        value: area,
        unit: 'sqm',
        width: null,
        length: null,
        confidence: confidence
      };
    }
  }

  // Pattern 3: Alternative format "area is 50" or "50 square meters"
  const altPattern = /(?:area|space|size).*?(\d+\.?\d*)\s*(?:sqm|square|m)/i;
  const altMatch = text.match(altPattern);
  
  if (altMatch) {
    const area = parseFloat(altMatch[1]);
    
    if (area > 0 && area < 10000) {
      return {
        value: area,
        unit: 'sqm',
        width: null,
        length: null,
        confidence: 0.85  // Slightly lower confidence for less explicit format
      };
    }
  }

  // No valid area measurement found
  return { value: null, unit: null, width: null, length: null, confidence: 0 };
}

/**
 * Extract financial information from text
 * 
 * This function identifies budget amounts and monthly electricity bills
 * from text, supporting Philippine Peso formatting and common abbreviations.
 * 
 * @param {string} text - The input text to extract financial data from
 * @returns {Object} Financial data with confidence score
 * @property {number|null} budget - Budget amount in pesos
 * @property {number|null} monthlyBill - Monthly electricity bill in pesos
 * @property {string} currency - Currency code (default: 'PHP')
 * @property {number} confidence - Confidence score (0-1)
 * 
 * @example
 * extractFinancial("My budget is 200k")
 * // Returns: { budget: 200000, monthlyBill: null, currency: 'PHP', confidence: 0.95 }
 * 
 * extractFinancial("monthly bill is ₱3,500")
 * // Returns: { budget: null, monthlyBill: 3500, currency: 'PHP', confidence: 0.95 }
 */
export function extractFinancial(text) {
  // Return empty result if input is invalid
  if (!text || typeof text !== 'string') {
    return { budget: null, monthlyBill: null, currency: 'PHP', confidence: 0 };
  }

  // Initialize result object
  let result = {
    budget: null,
    monthlyBill: null,
    currency: 'PHP',
    confidence: 0
  };

  // Convert to lowercase for matching
  const lowerText = text.toLowerCase();

  // Pattern for budget: "200k", "₱200,000", "budget is 200000"
  // Matches numbers with optional k/K suffix, commas, and peso symbol
  const budgetPattern = /(?:budget|capital|investment|spend).*?(?:₱|php|pesos?)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand|million)?/i;
  const budgetMatch = text.match(budgetPattern);
  
  if (budgetMatch) {
    // Remove commas from the number string
    let budgetValue = budgetMatch[1].replace(/,/g, '');
    budgetValue = parseFloat(budgetValue);
    
    // Check for multiplier suffixes (k, thousand, million)
    const fullMatch = budgetMatch[0].toLowerCase();
    if (fullMatch.includes('k') && !fullMatch.includes('lack')) {  // 'k' means thousand
      budgetValue *= 1000;
    } else if (fullMatch.includes('thousand')) {
      budgetValue *= 1000;
    } else if (fullMatch.includes('million')) {
      budgetValue *= 1000000;
    }
    
    // Validate reasonable budget range (1,000 to 100,000,000 pesos)
    if (budgetValue >= 1000 && budgetValue <= 100000000) {
      result.budget = budgetValue;
      result.confidence = 0.95;
    }
  }

  // Alternative pattern for "200k budget" or "have 200k budget" format
  if (!result.budget) {
    const altBudgetPattern = /([\d,]+(?:\.\d+)?)\s*(?:k|thousand|million)\s*(?:budget|capital|investment)/i;
    const altBudgetMatch = text.match(altBudgetPattern);
    
    if (altBudgetMatch) {
      let budgetValue = altBudgetMatch[1].replace(/,/g, '');
      budgetValue = parseFloat(budgetValue);
      
      // Check for multiplier suffixes
      const fullMatch = altBudgetMatch[0].toLowerCase();
      if (fullMatch.includes('k') && !fullMatch.includes('lack')) {
        budgetValue *= 1000;
      } else if (fullMatch.includes('thousand')) {
        budgetValue *= 1000;
      } else if (fullMatch.includes('million')) {
        budgetValue *= 1000000;
      }
      
      // Validate reasonable budget range
      if (budgetValue >= 1000 && budgetValue <= 100000000) {
        result.budget = budgetValue;
        result.confidence = Math.max(result.confidence, 0.9);
      }
    }
  }

  // Third pattern for "have X" format when budget context exists
  if (!result.budget) {
    const haveBudgetPattern = /(?:have|got|afford)\s*(?:₱|php|pesos?)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand|million)/i;
    const haveBudgetMatch = text.match(haveBudgetPattern);
    
    if (haveBudgetMatch && (lowerText.includes('budget') || lowerText.includes('capital') || lowerText.includes('investment'))) {
      let budgetValue = haveBudgetMatch[1].replace(/,/g, '');
      budgetValue = parseFloat(budgetValue);
      
      // Check for multiplier suffixes
      const fullMatch = haveBudgetMatch[0].toLowerCase();
      if (fullMatch.includes('k') && !fullMatch.includes('lack')) {
        budgetValue *= 1000;
      } else if (fullMatch.includes('thousand')) {
        budgetValue *= 1000;
      } else if (fullMatch.includes('million')) {
        budgetValue *= 1000000;
      }
      
      // Validate reasonable budget range
      if (budgetValue >= 1000 && budgetValue <= 100000000) {
        result.budget = budgetValue;
        result.confidence = Math.max(result.confidence, 0.88);
      }
    }
  }

  // Pattern for monthly bill: "3500 pesos monthly bill", "bill is 3500"
  // Also handles "₱3,500 per month" or "monthly: 3500"
  const billPattern = /(?:bill|electric|electricity|monthly|consumption).*?(?:₱|php|pesos?)?\s*([\d,]+(?:\.\d+)?)\s*(?:pesos?|php)?/i;
  const billMatch = text.match(billPattern);
  
  if (billMatch) {
    // Remove commas from the number string
    let billValue = billMatch[1].replace(/,/g, '');
    billValue = parseFloat(billValue);
    
    // Validate reasonable monthly bill range (100 to 100,000 pesos)
    if (billValue >= 100 && billValue <= 100000) {
      result.monthlyBill = billValue;
      // If we already found a budget, maintain confidence; otherwise set it
      result.confidence = Math.max(result.confidence, 0.9);
    }
  }

  // Alternative pattern specifically for "bill is X" format
  const directBillPattern = /bill\s+(?:is|:)?\s*(?:₱|php)?\s*([\d,]+(?:\.\d+)?)/i;
  const directBillMatch = text.match(directBillPattern);
  
  if (directBillMatch && !result.monthlyBill) {
    let billValue = directBillMatch[1].replace(/,/g, '');
    billValue = parseFloat(billValue);
    
    if (billValue >= 100 && billValue <= 100000) {
      result.monthlyBill = billValue;
      result.confidence = Math.max(result.confidence, 0.92);
    }
  }

  // Return result (confidence remains 0 if nothing was found)
  return result;
}

/**
 * Extract technical solar parameters from text
 * 
 * This function identifies panel tilt angles and azimuth/orientation
 * from natural language descriptions.
 * 
 * @param {string} text - The input text to extract technical data from
 * @returns {Object} Technical data with confidence score
 * @property {number|null} tilt - Panel tilt angle in degrees (0-90)
 * @property {number|null} azimuth - Panel azimuth in degrees (0-360, 0=North)
 * @property {string|null} orientation - Cardinal direction (e.g., "south", "southeast")
 * @property {number} confidence - Confidence score (0-1)
 * 
 * @example
 * extractTechnical("facing south with 15 degree tilt")
 * // Returns: { tilt: 15, azimuth: 180, orientation: 'south', confidence: 0.95 }
 * 
 * extractTechnical("azimuth 180")
 * // Returns: { tilt: null, azimuth: 180, orientation: null, confidence: 0.9 }
 */
export function extractTechnical(text) {
  // Return empty result if input is invalid
  if (!text || typeof text !== 'string') {
    return { tilt: null, azimuth: null, orientation: null, confidence: 0 };
  }

  // Initialize result object
  let result = {
    tilt: null,
    azimuth: null,
    orientation: null,
    confidence: 0
  };

  // Convert to lowercase for matching
  const lowerText = text.toLowerCase();

  // Pattern for tilt angle: "15 degree tilt", "tilt: 15°", "15 degrees"
  const tiltPattern = /(?:tilt|angle|slope).*?(\d+\.?\d*)(?:°|degrees?|deg)?/i;
  const tiltMatch = text.match(tiltPattern);
  
  if (tiltMatch) {
    // Parse the tilt value
    const tilt = parseFloat(tiltMatch[1]);
    
    // Validate tilt range (0-90 degrees is physically reasonable for solar panels)
    if (tilt >= 0 && tilt <= 90) {
      result.tilt = tilt;
      result.confidence = 0.9;
    }
  }

  // Alternative pattern for "15 degree tilt" or "15 degrees tilt" format
  if (!result.tilt) {
    const altTiltPattern = /(\d+\.?\d*)\s*(?:°|degrees?|deg)\s*(?:tilt|angle|slope)?/i;
    const altTiltMatch = text.match(altTiltPattern);
    
    if (altTiltMatch && (lowerText.includes('tilt') || lowerText.includes('angle') || lowerText.includes('slope'))) {
      const tilt = parseFloat(altTiltMatch[1]);
      
      // Validate tilt range
      if (tilt >= 0 && tilt <= 90) {
        result.tilt = tilt;
        result.confidence = Math.max(result.confidence, 0.88);
      }
    }
  }

  // Pattern for explicit azimuth: "azimuth 180", "azimuth: 180°"
  const azimuthPattern = /azimuth.*?(\d+\.?\d*)(?:°|degrees?|deg)?/i;
  const azimuthMatch = text.match(azimuthPattern);
  
  if (azimuthMatch) {
    // Parse the azimuth value
    const azimuth = parseFloat(azimuthMatch[1]);
    
    // Validate azimuth range (0-360 degrees)
    if (azimuth >= 0 && azimuth <= 360) {
      result.azimuth = azimuth;
      result.confidence = Math.max(result.confidence, 0.95);
    }
  }

  // Pattern for cardinal directions: "facing south", "south-facing", "oriented east"
  const directionPattern = /(?:facing|face|oriented?|direction).*?\b(north|south|east|west|n|s|e|w|ne|nw|se|sw|northeast|northwest|southeast|southwest)\b/i;
  const directionMatch = lowerText.match(directionPattern);
  
  if (directionMatch) {
    // Get the matched direction
    const direction = directionMatch[1].toLowerCase();
    
    // Look up the azimuth angle for this direction
    if (DIRECTION_AZIMUTH.hasOwnProperty(direction)) {
      result.orientation = direction;
      result.azimuth = DIRECTION_AZIMUTH[direction];
      result.confidence = Math.max(result.confidence, 0.85);
    }
  }

  // Alternative pattern for simpler direction format: "south facing", "east oriented"
  if (!result.orientation) {
    for (const [direction, azimuth] of Object.entries(DIRECTION_AZIMUTH)) {
      // Create pattern for this specific direction
      const pattern = new RegExp(`\\b${direction}\\b.*?(?:facing|face|oriented?)`, 'i');
      
      if (pattern.test(lowerText)) {
        result.orientation = direction;
        result.azimuth = azimuth;
        result.confidence = Math.max(result.confidence, 0.8);
        break;  // Stop after first match
      }
    }
  }

  // Return result (confidence remains 0 if nothing was found)
  return result;
}

/**
 * Extract all solar calculator parameters from text
 * 
 * This is the main function that orchestrates all extraction methods
 * to provide a complete parameter set from natural language input.
 * 
 * @param {string} text - The input text to extract all parameters from
 * @returns {Object} Complete parameter set with overall confidence
 * @property {Object} location - Location data (city, province, coordinates)
 * @property {Object} area - Area measurements (value, dimensions)
 * @property {Object} financial - Financial data (budget, monthly bill)
 * @property {Object} technical - Technical parameters (tilt, azimuth)
 * @property {number} overallConfidence - Average confidence across all extractions
 * @property {Array<string>} extractedFields - List of successfully extracted field names
 * 
 * @example
 * extractAll("I'm in Manila with 50 sqm roof, budget 200k, bill is 3500, facing south")
 * // Returns all extracted parameters with confidence scores
 */
export function extractAll(text) {
  // Return empty result if input is invalid
  if (!text || typeof text !== 'string') {
    return {
      location: { city: null, province: null, lat: null, lng: null, confidence: 0 },
      area: { value: null, unit: null, width: null, length: null, confidence: 0 },
      financial: { budget: null, monthlyBill: null, currency: 'PHP', confidence: 0 },
      technical: { tilt: null, azimuth: null, orientation: null, confidence: 0 },
      overallConfidence: 0,
      extractedFields: []
    };
  }

  // Run all extraction functions
  const location = extractLocation(text);
  const area = extractArea(text);
  const financial = extractFinancial(text);
  const technical = extractTechnical(text);

  // Track which fields were successfully extracted
  const extractedFields = [];
  
  // Check each category for successful extractions
  if (location.confidence > 0) {
    extractedFields.push('location');
  }
  if (area.confidence > 0) {
    extractedFields.push('area');
  }
  if (financial.confidence > 0) {
    extractedFields.push('financial');
  }
  if (technical.confidence > 0) {
    extractedFields.push('technical');
  }

  // Calculate overall confidence as average of all confidence scores
  const confidenceScores = [
    location.confidence,
    area.confidence,
    financial.confidence,
    technical.confidence
  ];
  
  // Sum all confidence scores
  const totalConfidence = confidenceScores.reduce((sum, score) => sum + score, 0);
  
  // Calculate average (divide by number of categories)
  const overallConfidence = totalConfidence / confidenceScores.length;

  // Return complete extraction results
  return {
    location,
    area,
    financial,
    technical,
    overallConfidence,
    extractedFields
  };
}

// Export all functions as default export for convenience
export default {
  extractLocation,
  extractArea,
  extractFinancial,
  extractTechnical,
  extractAll
};

