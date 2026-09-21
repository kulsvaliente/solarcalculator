/**
 * Parameter Validator Service
 * 
 * This service validates solar calculator parameters against realistic constraints
 * for Philippine solar installations. It provides helpful warnings and actionable
 * suggestions in Filipino English context.
 * 
 * @module parameterValidator
 */

/**
 * Validate roof area for solar panel installation
 * 
 * This function checks if the provided roof area is within acceptable
 * limits for solar panel installation in the Philippines.
 * 
 * @param {number} area - Roof area in square meters
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether the area is valid
 * @property {number|null} value - Validated area value
 * @property {Array<string>} warnings - List of warning messages
 * @property {Array<string>} suggestions - List of actionable suggestions
 * 
 * @example
 * validateArea(50)
 * // Returns: { isValid: true, value: 50, warnings: [], suggestions: [] }
 * 
 * validateArea(3)
 * // Returns: { isValid: false, value: null, warnings: [...], suggestions: [...] }
 */
export function validateArea(area) {
  // Initialize result object with default values
  const result = {
    isValid: false,
    value: null,
    warnings: [],
    suggestions: []
  };

  // Check if area is provided and is a valid number
  if (area === null || area === undefined || isNaN(area)) {
    result.warnings.push('No roof area provided');
    result.suggestions.push('Please specify your available roof area in square meters');
    return result;
  }

  // Define minimum and maximum area constraints
  const MIN_AREA = 6;    // Minimum area for solar installation (at least 2 panels)
  const MAX_AREA = 1000; // Maximum reasonable area for residential/commercial

  // Convert to number if it's a string
  const areaValue = Number(area);

  // Check if area is too small
  if (areaValue < MIN_AREA) {
    result.warnings.push(`Roof area of ${areaValue} sqm is too small for solar installation`);
    result.suggestions.push(`Minimum recommended area is ${MIN_AREA} sqm (enough for at least 2 solar panels)`);
    result.suggestions.push('Consider combining multiple roof sections if available');
    return result;
  }

  // Check if area is too large (possibly an error)
  if (areaValue > MAX_AREA) {
    result.warnings.push(`Roof area of ${areaValue} sqm seems unusually large`);
    result.suggestions.push('Please double-check your measurements');
    result.suggestions.push('For very large installations, consider contacting a professional solar company');
    return result;
  }

  // Area is valid - mark as valid and add appropriate suggestions
  result.isValid = true;
  result.value = areaValue;

  // Provide context-specific suggestions based on area size
  if (areaValue >= 6 && areaValue < 15) {
    result.suggestions.push('Your roof area can support a small solar system (2-5 panels)');
    result.suggestions.push('This is suitable for basic household needs');
  } else if (areaValue >= 15 && areaValue < 50) {
    result.suggestions.push('Your roof area can support a medium-sized solar system (5-15 panels)');
    result.suggestions.push('This is suitable for average Philippine household consumption');
  } else if (areaValue >= 50 && areaValue < 150) {
    result.suggestions.push('Your roof area can support a large solar system (15-50 panels)');
    result.suggestions.push('This is suitable for large homes or small commercial establishments');
  } else {
    result.suggestions.push('Your roof area can support a very large solar installation');
    result.suggestions.push('Consider net metering to sell excess power back to the grid');
  }

  return result;
}

/**
 * Validate budget for solar panel installation
 * 
 * This function checks if the provided budget is sufficient and reasonable
 * for solar panel installation in the Philippines.
 * 
 * @param {number} budget - Budget amount in Philippine Pesos
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether the budget is valid
 * @property {number|null} value - Validated budget value
 * @property {Array<string>} warnings - List of warning messages
 * @property {Array<string>} suggestions - List of actionable suggestions
 * 
 * @example
 * validateBudget(200000)
 * // Returns: { isValid: true, value: 200000, warnings: [], suggestions: [...] }
 */
export function validateBudget(budget) {
  // Initialize result object with default values
  const result = {
    isValid: false,
    value: null,
    warnings: [],
    suggestions: []
  };

  // Check if budget is provided and is a valid number
  if (budget === null || budget === undefined || isNaN(budget)) {
    result.warnings.push('No budget provided');
    result.suggestions.push('Please specify your available budget in Philippine Pesos');
    result.suggestions.push('Typical solar installations in the Philippines range from ₱50,000 to ₱500,000');
    return result;
  }

  // Define minimum and maximum budget constraints
  const MIN_BUDGET = 50000;      // Minimum for basic solar installation
  const MAX_BUDGET = 10000000;   // Maximum reasonable budget

  // Convert to number if it's a string
  const budgetValue = Number(budget);

  // Check if budget is too low
  if (budgetValue < MIN_BUDGET) {
    result.warnings.push(`Budget of ₱${budgetValue.toLocaleString()} is too low for solar installation`);
    result.suggestions.push(`Minimum recommended budget is ₱${MIN_BUDGET.toLocaleString()}`);
    result.suggestions.push('Consider saving more or exploring solar financing options');
    result.suggestions.push('Some companies offer installment plans or loans for solar installations');
    return result;
  }

  // Check if budget is very high (possibly an error or enterprise-level)
  if (budgetValue > MAX_BUDGET) {
    result.warnings.push(`Budget of ₱${budgetValue.toLocaleString()} is very high`);
    result.suggestions.push('For enterprise-level installations, we recommend consulting directly with solar companies');
    result.suggestions.push('You may qualify for bulk pricing and custom solutions');
    return result;
  }

  // Budget is valid - mark as valid and add appropriate suggestions
  result.isValid = true;
  result.value = budgetValue;

  // Provide context-specific suggestions based on budget range
  if (budgetValue >= 50000 && budgetValue < 100000) {
    result.suggestions.push('Your budget can cover a small solar system (1-2 kW)');
    result.suggestions.push('Expect 3-5 panels, suitable for basic appliances');
    result.suggestions.push('Typical payback period: 5-7 years');
  } else if (budgetValue >= 100000 && budgetValue < 250000) {
    result.suggestions.push('Your budget can cover a medium solar system (2-5 kW)');
    result.suggestions.push('Expect 6-15 panels, suitable for average household consumption');
    result.suggestions.push('Typical payback period: 4-6 years');
  } else if (budgetValue >= 250000 && budgetValue < 500000) {
    result.suggestions.push('Your budget can cover a large solar system (5-10 kW)');
    result.suggestions.push('Expect 15-30 panels, suitable for large homes or small businesses');
    result.suggestions.push('Typical payback period: 3-5 years');
  } else if (budgetValue >= 500000 && budgetValue < 1000000) {
    result.suggestions.push('Your budget can cover a very large solar system (10-20 kW)');
    result.suggestions.push('Consider net metering to maximize ROI');
    result.suggestions.push('You may qualify for commercial rates and incentives');
  } else {
    result.suggestions.push('Your budget can cover an enterprise-level solar installation');
    result.suggestions.push('Consider hybrid systems with battery storage');
    result.suggestions.push('Explore DOE incentives and tax benefits for large installations');
  }

  return result;
}

/**
 * Validate geographic coordinates for Philippines
 * 
 * This function checks if the provided coordinates fall within the
 * geographic boundaries of the Philippines.
 * 
 * @param {number} lat - Latitude coordinate
 * @param {number} lng - Longitude coordinate
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether the coordinates are valid
 * @property {number|null} lat - Validated latitude value
 * @property {number|null} lng - Validated longitude value
 * @property {Array<string>} warnings - List of warning messages
 * 
 * @example
 * validateCoordinates(14.5995, 120.9842)
 * // Returns: { isValid: true, lat: 14.5995, lng: 120.9842, warnings: [] }
 */
export function validateCoordinates(lat, lng) {
  // Initialize result object with default values
  const result = {
    isValid: false,
    lat: null,
    lng: null,
    warnings: []
  };

  // Check if coordinates are provided
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    result.warnings.push('No location coordinates provided');
    return result;
  }

  // Check if coordinates are valid numbers
  if (isNaN(lat) || isNaN(lng)) {
    result.warnings.push('Invalid coordinate format');
    return result;
  }

  // Define Philippine geographic boundaries
  const MIN_LAT = 4.0;    // Southernmost point (near Tawi-Tawi)
  const MAX_LAT = 21.0;   // Northernmost point (near Batanes)
  const MIN_LNG = 116.0;  // Westernmost point (near Palawan)
  const MAX_LNG = 127.0;  // Easternmost point (near Eastern Mindanao)

  // Convert to numbers
  const latValue = Number(lat);
  const lngValue = Number(lng);

  // Validate that coordinates are within basic geographic bounds
  if (latValue < -90 || latValue > 90) {
    result.warnings.push('Latitude must be between -90 and 90 degrees');
    return result;
  }

  if (lngValue < -180 || lngValue > 180) {
    result.warnings.push('Longitude must be between -180 and 180 degrees');
    return result;
  }

  // Check if coordinates are within Philippine boundaries
  if (latValue < MIN_LAT || latValue > MAX_LAT || lngValue < MIN_LNG || lngValue > MAX_LNG) {
    result.warnings.push('Coordinates are outside the Philippines');
    result.warnings.push(`Philippine boundaries: ${MIN_LAT}°N to ${MAX_LAT}°N, ${MIN_LNG}°E to ${MAX_LNG}°E`);
    result.warnings.push('This calculator is optimized for Philippine locations');
    return result;
  }

  // Coordinates are valid
  result.isValid = true;
  result.lat = latValue;
  result.lng = lngValue;

  // Add regional context for better user experience
  if (latValue > 18) {
    result.warnings.push('Location detected: Northern Philippines (Batanes/Cagayan region)');
  } else if (latValue < 7) {
    result.warnings.push('Location detected: Southern Philippines (Mindanao region)');
  } else {
    result.warnings.push('Location detected: Central Philippines (Luzon/Visayas region)');
  }

  return result;
}

/**
 * Validate solar panel tilt angle
 * 
 * This function checks if the provided tilt angle is reasonable
 * and provides optimal recommendations for the Philippines.
 * 
 * @param {number} tilt - Tilt angle in degrees (0 = flat, 90 = vertical)
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether the tilt is valid
 * @property {number|null} value - Validated tilt value
 * @property {Array<string>} warnings - List of warning messages
 * @property {Array<string>} suggestions - List of actionable suggestions
 * 
 * @example
 * validateTilt(15)
 * // Returns: { isValid: true, value: 15, warnings: [], suggestions: [...] }
 */
export function validateTilt(tilt) {
  // Initialize result object with default values
  const result = {
    isValid: false,
    value: null,
    warnings: [],
    suggestions: []
  };

  // Check if tilt is provided and is a valid number
  if (tilt === null || tilt === undefined || isNaN(tilt)) {
    result.warnings.push('No tilt angle provided');
    result.suggestions.push('Tilt angle affects solar panel efficiency');
    result.suggestions.push('For the Philippines, optimal tilt is 10-20 degrees');
    return result;
  }

  // Define tilt angle constraints
  const MIN_TILT = 0;    // Flat/horizontal
  const MAX_TILT = 90;   // Vertical
  const OPTIMAL_MIN = 10; // Optimal minimum for Philippines
  const OPTIMAL_MAX = 20; // Optimal maximum for Philippines

  // Convert to number
  const tiltValue = Number(tilt);

  // Check if tilt is within physical bounds
  if (tiltValue < MIN_TILT || tiltValue > MAX_TILT) {
    result.warnings.push(`Tilt angle must be between ${MIN_TILT}° and ${MAX_TILT}°`);
    return result;
  }

  // Tilt is physically valid
  result.isValid = true;
  result.value = tiltValue;

  // Provide optimization suggestions based on tilt value
  if (tiltValue === 0) {
    result.warnings.push('Flat installation (0° tilt) is not optimal');
    result.suggestions.push('Flat panels accumulate dirt and water, reducing efficiency');
    result.suggestions.push(`Recommended tilt for the Philippines: ${OPTIMAL_MIN}°-${OPTIMAL_MAX}°`);
    result.suggestions.push('Consider adding at least 5° tilt for self-cleaning');
  } else if (tiltValue > 0 && tiltValue < OPTIMAL_MIN) {
    result.warnings.push('Tilt angle is below optimal range');
    result.suggestions.push(`Optimal tilt for the Philippines: ${OPTIMAL_MIN}°-${OPTIMAL_MAX}°`);
    result.suggestions.push('Increasing tilt can improve annual energy production by 5-10%');
  } else if (tiltValue >= OPTIMAL_MIN && tiltValue <= OPTIMAL_MAX) {
    result.suggestions.push('Excellent! Your tilt angle is optimal for Philippine conditions');
    result.suggestions.push('This tilt maximizes year-round solar energy production');
  } else if (tiltValue > OPTIMAL_MAX && tiltValue <= 30) {
    result.warnings.push('Tilt angle is above optimal range');
    result.suggestions.push(`Optimal tilt for the Philippines: ${OPTIMAL_MIN}°-${OPTIMAL_MAX}°`);
    result.suggestions.push('Higher tilt may reduce summer production when sun is overhead');
  } else if (tiltValue > 30 && tiltValue < 60) {
    result.warnings.push('Tilt angle is quite high for Philippine latitude');
    result.suggestions.push('High tilt angles are better for higher latitudes');
    result.suggestions.push(`Recommended tilt for the Philippines: ${OPTIMAL_MIN}°-${OPTIMAL_MAX}°`);
    result.suggestions.push('This may reduce overall energy production by 10-20%');
  } else {
    result.warnings.push('Very high tilt angle - almost vertical');
    result.suggestions.push('Vertical panels are rarely used except for specific applications');
    result.suggestions.push('Consider reducing tilt for better energy production');
  }

  return result;
}

/**
 * Validate solar panel azimuth angle
 * 
 * This function checks if the provided azimuth (orientation) angle
 * is valid and provides optimal recommendations for the Philippines.
 * 
 * @param {number} azimuth - Azimuth angle in degrees (0/360 = North, 90 = East, 180 = South, 270 = West)
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether the azimuth is valid
 * @property {number|null} value - Validated azimuth value
 * @property {Array<string>} warnings - List of warning messages
 * 
 * @example
 * validateAzimuth(180)
 * // Returns: { isValid: true, value: 180, warnings: ['Optimal orientation...'] }
 */
export function validateAzimuth(azimuth) {
  // Initialize result object with default values
  const result = {
    isValid: false,
    value: null,
    warnings: []
  };

  // Check if azimuth is provided and is a valid number
  if (azimuth === null || azimuth === undefined || isNaN(azimuth)) {
    result.warnings.push('No azimuth (orientation) angle provided');
    result.warnings.push('For optimal production in the Philippines, panels should face south (180°)');
    return result;
  }

  // Define azimuth constraints
  const MIN_AZIMUTH = 0;
  const MAX_AZIMUTH = 360;
  const OPTIMAL_AZIMUTH = 180; // South-facing for Northern Hemisphere

  // Convert to number
  const azimuthValue = Number(azimuth);

  // Check if azimuth is within valid range
  if (azimuthValue < MIN_AZIMUTH || azimuthValue > MAX_AZIMUTH) {
    result.warnings.push(`Azimuth angle must be between ${MIN_AZIMUTH}° and ${MAX_AZIMUTH}°`);
    result.warnings.push('0° = North, 90° = East, 180° = South, 270° = West');
    return result;
  }

  // Azimuth is valid
  result.isValid = true;
  result.value = azimuthValue;

  // Calculate deviation from optimal south-facing orientation
  // Handle wrap-around at 0°/360°
  let deviation = Math.abs(azimuthValue - OPTIMAL_AZIMUTH);
  if (deviation > 180) {
    deviation = 360 - deviation;
  }

  // Provide feedback based on deviation from optimal orientation
  if (deviation === 0) {
    result.warnings.push('Optimal orientation! Panels are facing true south');
    result.warnings.push('This maximizes solar energy production throughout the year');
  } else if (deviation <= 15) {
    result.warnings.push('Excellent orientation (within 15° of south)');
    result.warnings.push('Minimal impact on energy production (less than 2% reduction)');
  } else if (deviation <= 45) {
    result.warnings.push('Good orientation (within 45° of south)');
    result.warnings.push('Slight reduction in energy production (approximately 5-10%)');
  } else if (deviation <= 90) {
    result.warnings.push('Suboptimal orientation (more than 45° from south)');
    result.warnings.push('Significant reduction in energy production (approximately 15-25%)');
    result.warnings.push('Consider adjusting panel orientation if possible');
  } else {
    result.warnings.push('Poor orientation - panels are facing away from the sun');
    result.warnings.push('Energy production will be severely reduced (more than 30%)');
    result.warnings.push('Strongly recommend adjusting to south-facing orientation');
  }

  // Add cardinal direction context for user understanding
  if (azimuthValue >= 0 && azimuthValue < 22.5 || azimuthValue >= 337.5) {
    result.warnings.push('Current orientation: North');
  } else if (azimuthValue >= 22.5 && azimuthValue < 67.5) {
    result.warnings.push('Current orientation: Northeast');
  } else if (azimuthValue >= 67.5 && azimuthValue < 112.5) {
    result.warnings.push('Current orientation: East');
  } else if (azimuthValue >= 112.5 && azimuthValue < 157.5) {
    result.warnings.push('Current orientation: Southeast');
  } else if (azimuthValue >= 157.5 && azimuthValue < 202.5) {
    result.warnings.push('Current orientation: South');
  } else if (azimuthValue >= 202.5 && azimuthValue < 247.5) {
    result.warnings.push('Current orientation: Southwest');
  } else if (azimuthValue >= 247.5 && azimuthValue < 292.5) {
    result.warnings.push('Current orientation: West');
  } else {
    result.warnings.push('Current orientation: Northwest');
  }

  return result;
}

/**
 * Validate all solar calculator parameters
 * 
 * This is the main validation function that orchestrates validation
 * of all parameters and returns a comprehensive validation result.
 * 
 * @param {Object} params - Object containing all parameters to validate
 * @param {number} params.area - Roof area in square meters
 * @param {number} params.budget - Budget in Philippine Pesos
 * @param {number} params.monthlyBill - Monthly electricity bill in pesos
 * @param {number} params.lat - Latitude coordinate
 * @param {number} params.lng - Longitude coordinate
 * @param {number} params.tilt - Panel tilt angle in degrees
 * @param {number} params.azimuth - Panel azimuth angle in degrees
 * @returns {Object} Comprehensive validation result
 * @property {boolean} isValid - Whether all critical parameters are valid
 * @property {Object} area - Area validation result
 * @property {Object} budget - Budget validation result
 * @property {Object} coordinates - Coordinates validation result
 * @property {Object} tilt - Tilt validation result
 * @property {Object} azimuth - Azimuth validation result
 * @property {Array<string>} criticalIssues - List of critical issues preventing calculation
 * @property {Array<string>} allWarnings - Aggregated warnings from all validations
 * @property {Array<string>} allSuggestions - Aggregated suggestions from all validations
 * 
 * @example
 * validateAll({ area: 50, budget: 200000, lat: 14.5995, lng: 120.9842, tilt: 15, azimuth: 180 })
 * // Returns comprehensive validation with all checks
 */
export function validateAll(params) {
  // Initialize comprehensive result object
  const result = {
    isValid: true,
    area: null,
    budget: null,
    coordinates: null,
    tilt: null,
    azimuth: null,
    criticalIssues: [],
    allWarnings: [],
    allSuggestions: []
  };

  // Validate area if provided
  if (params.area !== undefined && params.area !== null) {
    result.area = validateArea(params.area);
    
    // Check if area validation failed
    if (!result.area.isValid) {
      result.isValid = false;
      result.criticalIssues.push('Invalid roof area');
    }
    
    // Aggregate warnings and suggestions
    result.allWarnings.push(...result.area.warnings);
    result.allSuggestions.push(...result.area.suggestions);
  }

  // Validate budget if provided
  if (params.budget !== undefined && params.budget !== null) {
    result.budget = validateBudget(params.budget);
    
    // Check if budget validation failed
    if (!result.budget.isValid) {
      result.isValid = false;
      result.criticalIssues.push('Invalid budget');
    }
    
    // Aggregate warnings and suggestions
    result.allWarnings.push(...result.budget.warnings);
    result.allSuggestions.push(...result.budget.suggestions);
  }

  // Validate coordinates if both lat and lng are provided
  if ((params.lat !== undefined && params.lat !== null) || 
      (params.lng !== undefined && params.lng !== null)) {
    result.coordinates = validateCoordinates(params.lat, params.lng);
    
    // Check if coordinates validation failed
    if (!result.coordinates.isValid) {
      result.isValid = false;
      result.criticalIssues.push('Invalid location coordinates');
    }
    
    // Aggregate warnings
    result.allWarnings.push(...result.coordinates.warnings);
  }

  // Validate tilt if provided (optional parameter)
  if (params.tilt !== undefined && params.tilt !== null) {
    result.tilt = validateTilt(params.tilt);
    
    // Tilt validation failure is not critical - use default if invalid
    if (!result.tilt.isValid) {
      result.allWarnings.push('Tilt angle invalid - will use default 15° for Philippines');
    }
    
    // Aggregate warnings and suggestions
    result.allWarnings.push(...result.tilt.warnings);
    result.allSuggestions.push(...result.tilt.suggestions);
  }

  // Validate azimuth if provided (optional parameter)
  if (params.azimuth !== undefined && params.azimuth !== null) {
    result.azimuth = validateAzimuth(params.azimuth);
    
    // Azimuth validation failure is not critical - use default if invalid
    if (!result.azimuth.isValid) {
      result.allWarnings.push('Azimuth angle invalid - will use default 180° (south-facing)');
    }
    
    // Aggregate warnings
    result.allWarnings.push(...result.azimuth.warnings);
  }

  // Add overall status message
  if (result.isValid) {
    result.allSuggestions.unshift('All critical parameters are valid - ready for solar calculation');
  } else {
    result.allWarnings.unshift('Some parameters need to be corrected before calculation');
  }

  return result;
}

// Export all validation functions as default export for convenience
export default {
  validateArea,
  validateBudget,
  validateCoordinates,
  validateTilt,
  validateAzimuth,
  validateAll
};

