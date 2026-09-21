/**
 * Pricing Service for Solar Calculator
 * Fetches pricing data from MongoDB to calculate accurate system costs
 */

import { GRID_TIED, HYBRID, OFF_GRID } from '../constants/systemComparisonConstants';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fetch pricing data from the API
 * @param {string} category - Pricing category (e.g., 'total_system', 'solar_panels', 'inverters')
 * @param {string} region - Region type ('provinces', 'urban', 'all')
 * @returns {Promise<Object>} Pricing data
 */
export const fetchPricingData = async (category = 'total_system', region = 'all') => {
  try {
    const response = await fetch(`${API_BASE_URL}/pricing/category/${category}?region=${region}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pricing data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    throw error;
  }
};

/**
 * Get all pricing data for AI context
 * @returns {Promise<Object>} All pricing data grouped by category
 */
export const fetchAllPricingData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pricing/ai`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch all pricing data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all pricing data:', error);
    throw error;
  }
};

/**
 * Calculate system cost based on capacity and pricing data
 * @param {number} capacity - System capacity in kW
 * @param {string} systemType - Type of system ('grid_tied', 'hybrid', 'off_grid')
 * @param {string} region - Region type ('provinces', 'urban', 'all')
 * @returns {Promise<Object>} Calculated costs
 */
export const calculateSystemCost = async (capacity, systemType = 'grid_tied', region = 'all') => {
  try {
    // Map system types to pricing categories
    const categoryMap = {
      'grid_tied': 'total_system',
      'hybrid': 'total_system', 
      'off_grid': 'total_system'
    };
    
    const category = categoryMap[systemType] || 'total_system';
    const pricingData = await fetchPricingData(category, region);
    
    if (!pricingData.success || !pricingData.data || pricingData.data.length === 0) {
      throw new Error('No pricing data available');
    }
    
    // Find the most relevant pricing entry
    const relevantPricing = pricingData.data.find(item => 
      item.subcategory.toLowerCase().includes(systemType) || 
      item.name.toLowerCase().includes(systemType) ||
      item.tags?.some(tag => tag.toLowerCase().includes(systemType))
    ) || pricingData.data[0]; // Fallback to first entry
    
    const { min, max } = relevantPricing.priceRange;
    
    // Calculate costs based on unit type
    let minCost, maxCost;
    
    switch (relevantPricing.unit) {
      case 'per_kw':
        minCost = capacity * min;
        maxCost = capacity * max;
        break;
      case 'per_system':
        minCost = min;
        maxCost = max;
        break;
      case 'fixed':
        minCost = max; // For fixed pricing, use max as the cost
        maxCost = max;
        break;
      default:
        minCost = capacity * min;
        maxCost = capacity * max;
    }
    
    return {
      success: true,
      systemType,
      region,
      capacity,
      minCost: Math.round(minCost),
      maxCost: Math.round(maxCost),
      averageCost: Math.round((minCost + maxCost) / 2),
      currency: relevantPricing.currency || 'PHP',
      pricingSource: relevantPricing.name,
      lastUpdated: relevantPricing.metadata?.lastUpdated
    };
    
  } catch (error) {
    console.error('Error calculating system cost:', error);
    // Fallback to hardcoded per-₱/kW values if the API is unavailable — these must differ by
    // systemType, or Grid-Tied/Hybrid/Off-Grid all render identical cost, payback, and ROI
    // (the bug that produced identical rows across all three configurations).
    const FALLBACK_RATES_PER_KW = {
      grid_tied: { min: GRID_TIED.perKwMin, max: GRID_TIED.perKwMax },
      hybrid: { min: HYBRID.perKwMin, max: HYBRID.perKwMax },
      off_grid: { min: OFF_GRID.perKwMin, max: OFF_GRID.perKwMax }
    };
    const rate = FALLBACK_RATES_PER_KW[systemType] || FALLBACK_RATES_PER_KW.grid_tied;
    return {
      success: false,
      error: error.message,
      minCost: Math.round(capacity * rate.min),
      maxCost: Math.round(capacity * rate.max),
      averageCost: Math.round((capacity * rate.min + capacity * rate.max) / 2),
      currency: 'PHP',
      pricingSource: 'Fallback (API unavailable)'
    };
  }
};

/**
 * Calculate ROI and payback period
 * @param {number} systemCost - Total system cost
 * @param {number} annualSavings - Annual energy savings
 * @returns {Object} ROI calculations
 */
export const calculateROI = (systemCost, annualSavings) => {
  if (!systemCost || !annualSavings || annualSavings <= 0) {
    return {
      paybackPeriod: null,
      roi: null,
      netSavings: null
    };
  }
  
  const paybackPeriod = systemCost / annualSavings;
  const roi = (annualSavings / systemCost) * 100;
  const netSavings = annualSavings - (systemCost / 20); // Assuming 20-year system life
  
  return {
    paybackPeriod: Math.round(paybackPeriod * 10) / 10, // Round to 1 decimal
    roi: Math.round(roi * 10) / 10,
    netSavings: Math.round(netSavings * 10) / 10
  };
};

/**
 * Get pricing data for multiple system types
 * @param {number} capacity - System capacity in kW
 * @param {string} region - Region type
 * @returns {Promise<Object>} Costs for different system types
 */
export const getMultipleSystemCosts = async (capacity, region = 'all') => {
  try {
    const [gridTied, hybrid, offGrid] = await Promise.all([
      calculateSystemCost(capacity, 'grid_tied', region),
      calculateSystemCost(capacity, 'hybrid', region),
      calculateSystemCost(capacity, 'off_grid', region)
    ]);

    // calculateSystemCost() never throws — a failed fetch resolves to { success: false, ... }
    // internally instead. Reflect that here, or callers see success:true and label fallback
    // numbers as "Real-Time Market Rates".
    return {
      success: Boolean(gridTied.success && hybrid.success && offGrid.success),
      gridTied,
      hybrid,
      offGrid,
      capacity,
      region
    };
  } catch (error) {
    console.error('Error getting multiple system costs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
