/**
 * Solar Irradiance Service
 * Uses NREL PVWatts API to calculate standardized sun peak hours
 * Applies 0.8 multiplier to solar irradiance for sun peak hours calculation
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://solarcalc-backend.nbericmmsu.com';
const SUN_PEAK_CACHE_VERSION = 'v4_default_tilt_18';

/**
 * Calculate sun peak hours using NREL PVWatts API
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {number} tilt - Panel tilt angle (0-90)
 * @param {number} azimuth - Panel azimuth angle (0-360)
 * @param {number} systemCapacity - System capacity in kW (default: 1)
 * @param {number} arrayType - Array type (0=fixed, 1=1-axis, 2=2-axis, 3=azimuth-axis)
 * @param {number} moduleType - Module type (0=standard, 1=premium, 2=thin film)
 * @param {number} losses - System losses percentage (default: 20)
 * @returns {Promise<Object>} Sun peak hours data
 */
export const calculateSunPeakHours = async ({
  latitude,
  longitude,
  tilt = 0,
  azimuth = 180,
  systemCapacity = 1,
  arrayType = 1,
  moduleType = 1,
  losses = 20
}) => {
  try {
    // Validate inputs
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    // Fetch data from NREL PVWatts API, proxied through the standalone backend so the
    // NREL key never ships to the browser.
    const response = await fetch(`${API_BASE_URL}/api/irradiance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude,
        longitude,
        systemCapacity,
        azimuth,
        tilt,
        arrayType,
        moduleType,
        losses
      })
    });

    if (!response.ok) {
      throw new Error(`NREL API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(`NREL API errors: ${data.errors.join(', ')}`);
    }

    if (!data.outputs || !data.outputs.solrad_monthly) {
      throw new Error('No solar irradiance data received from NREL API');
    }

    // Extract monthly solar irradiance data
    const monthlyIrradiance = data.outputs.solrad_monthly;
    // Use the same rounded values shown in the monthly irradiance table.
    const monthlyIrradianceTableValues = monthlyIrradiance.map((value) => parseFloat(value.toFixed(2)));
    
    // Calculate sun peak hours using 0.8 multiplier
    const monthlySunPeakHours = monthlyIrradiance.map(irradiance => irradiance * 0.8);
    
    // Calculate annual average
    const annualAverageIrradiance = monthlyIrradianceTableValues.reduce((sum, value) => sum + value, 0) / 12;
    const annualAverageSunPeakHours = annualAverageIrradiance * 0.8;

    // Calculate seasonal averages based on requested algorithm:
    // - Hot/Dry: average of the 4 highest solar irradiance values
    //   from Jan, Feb, Mar, Apr, May, Nov, Dec.
    // - Wet/Rainy: average of the 4 lowest solar irradiance values
    //   from Jun, Jul, Aug, Sep, Oct.
    const hotDryMonthIndices = [0, 1, 2, 3, 4, 10, 11]; // Jan, Feb, Mar, Apr, May, Nov, Dec
    const wetRainyMonthIndices = [5, 6, 7, 8, 9]; // Jun, Jul, Aug, Sep, Oct

    const hotDryIrradianceAverage = calculateRankedSeasonalAverage(monthlyIrradianceTableValues, hotDryMonthIndices, 4, 'highest');
    const wetRainyIrradianceAverage = calculateRankedSeasonalAverage(monthlyIrradianceTableValues, wetRainyMonthIndices, 4, 'lowest');

    const hotDrySeasonalIrradiance = parseFloat(hotDryIrradianceAverage.toFixed(2));
    const wetRainySeasonalIrradiance = parseFloat(wetRainyIrradianceAverage.toFixed(2));

    const seasonalAverages = {
      hotDry: hotDrySeasonalIrradiance,
      wetRainy: wetRainySeasonalIrradiance,
      // Backward-compatible aliases used elsewhere in UI.
      summer: hotDrySeasonalIrradiance,
      winter: wetRainySeasonalIrradiance,
      spring: hotDrySeasonalIrradiance,
      fall: wetRainySeasonalIrradiance
    };

    // Month names for better readability
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Create detailed monthly data
    const monthlyData = monthlySunPeakHours.map((sunPeakHours, index) => ({
      month: monthNames[index],
      monthIndex: index + 1,
      solarIrradiance: monthlyIrradianceTableValues[index],
      sunPeakHours: parseFloat(sunPeakHours.toFixed(2)),
      sunPeakHoursFormatted: `${sunPeakHours.toFixed(2)} hours/day`
    }));

    return {
      success: true,
      location: {
        latitude,
        longitude,
        tilt,
        azimuth
      },
      annualAverage: {
        solarIrradiance: parseFloat(annualAverageIrradiance.toFixed(2)),
        sunPeakHours: parseFloat(annualAverageSunPeakHours.toFixed(2)),
        sunPeakHoursFormatted: `${annualAverageSunPeakHours.toFixed(2)} hours/day`
      },
      seasonalAverages,
      monthlyData,
      rawData: {
        monthlyIrradiance,
        monthlySunPeakHours
      },
      metadata: {
        systemCapacity,
        arrayType,
        moduleType,
        losses,
        multiplier: 0.8,
        dataSource: 'NREL PVWatts API v8',
        calculationDate: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error calculating sun peak hours:', error);
    return {
      success: false,
      error: error.message,
      location: { latitude, longitude, tilt, azimuth }
    };
  }
};

/**
 * Calculate ranked seasonal average from selected month indices.
 * @param {Array<number>} monthlyData - Monthly values (length 12)
 * @param {Array<number>} monthIndices - Season month indices (0-based)
 * @param {number} pickCount - Number of values to pick
 * @param {'highest'|'lowest'} mode - Ranking mode
 * @returns {number} Ranked average rounded to 2 decimals
 */
const calculateRankedSeasonalAverage = (monthlyData, monthIndices, pickCount, mode) => {
  const seasonalValues = monthIndices
    .map((index) => monthlyData[index])
    .filter((value) => Number.isFinite(value));

  if (!seasonalValues.length) return 0;

  const rankedValues = [...seasonalValues].sort((a, b) => (mode === 'highest' ? b - a : a - b));
  const selectedValues = rankedValues.slice(0, Math.min(pickCount, rankedValues.length));
  const average = selectedValues.reduce((sum, value) => sum + value, 0) / selectedValues.length;
  return parseFloat(average.toFixed(2));
};

/**
 * Get sun peak hours for a specific location with caching
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Cached or fresh sun peak hours data
 */
export const getSunPeakHours = async (latitude, longitude, options = {}) => {
  // Create cache key
  const cacheKey = `sun_peak_${SUN_PEAK_CACHE_VERSION}_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${options.tilt ?? 18}_${options.azimuth ?? 180}`;
  
  // Check cache first (24 hour expiry)
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const result = await calculateSunPeakHours({
    latitude,
    longitude,
    ...options
  });

  // Cache successful results
  if (result.success) {
    setCachedData(cacheKey, result);
  }

  return result;
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Object|null} Cached data or null
 */
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (24 hours)
      const now = new Date().getTime();
      const cacheTime = new Date(data.timestamp).getTime();
      const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return data;
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Error reading cache:', error);
  }
  return null;
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
const setCachedData = (key, data) => {
  try {
    const dataWithTimestamp = {
      ...data,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
  } catch (error) {
    console.warn('Error setting cache:', error);
  }
};

/**
 * Get sun peak hours for multiple locations
 * @param {Array} locations - Array of location objects
 * @returns {Promise<Array>} Array of sun peak hours data
 */
export const getMultipleSunPeakHours = async (locations) => {
  const promises = locations.map(location => 
    getSunPeakHours(location.latitude, location.longitude, location.options || {})
  );
  
  return Promise.all(promises);
};

/**
 * Format sun peak hours data for display
 * @param {Object} data - Sun peak hours data
 * @returns {Object} Formatted data
 */
export const formatSunPeakHoursData = (data) => {
  if (!data.success) {
    return {
      error: data.error,
      location: data.location
    };
  }

  return {
    location: `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}`,
    annualAverage: data.annualAverage.sunPeakHoursFormatted,
    seasonalAverages: {
      hotDry: `${data.seasonalAverages.hotDry ?? data.seasonalAverages.summer} hours/day`,
      wetRainy: `${data.seasonalAverages.wetRainy ?? data.seasonalAverages.winter} hours/day`,
      spring: `${data.seasonalAverages.spring} hours/day`,
      summer: `${data.seasonalAverages.summer} hours/day`,
      fall: `${data.seasonalAverages.fall} hours/day`,
      winter: `${data.seasonalAverages.winter} hours/day`
    },
    monthlyBreakdown: data.monthlyData.map(month => ({
      month: month.month,
      sunPeakHours: month.sunPeakHoursFormatted
    }))
  };
};

const solarIrradianceService = {
  calculateSunPeakHours,
  getSunPeakHours,
  getMultipleSunPeakHours,
  formatSunPeakHoursData
};

export default solarIrradianceService;
