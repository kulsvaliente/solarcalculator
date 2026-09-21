/**
 * Unified State Schema for Solar AI Calculator
 * 
 * This file defines the complete state structure for Phase 2 unified state management.
 * It serves as the single source of truth for all calculator and AI chatbot state.
 * 
 * @module schema
 */

/**
 * Initial state structure for the solar calculator application
 * This combines calculator parameters, conversation state, UI state, and history
 * 
 * @typedef {Object} UnifiedState
 * @property {ParametersState} parameters - All calculator input parameters
 * @property {ResultsState} results - Calculated results
 * @property {ConversationState} conversation - AI chatbot conversation state
 * @property {UIState} ui - User interface state
 * @property {HistoryState} history - Undo/redo history
 * @property {SyncState} sync - Synchronization status
 */

/**
 * Calculator parameters organized by category
 * Each parameter tracks its value, source, update time, and confidence
 * 
 * @typedef {Object} ParametersState
 */
const initialParameters = {
  // Geographic location information
  location: {
    lat: null,                    // Latitude coordinate (number or null)
    lng: null,                    // Longitude coordinate (number or null)
    city: null,                   // City name (string or null)
    province: null,               // Province name (string or null)
    source: null,                 // Data source: 'ai' | 'manual' | 'map' | null
    lastUpdated: null,            // Timestamp of last update (number or null)
    confidence: 0                 // AI confidence score (0-1)
  },

  // Roof dimensions and measurements
  dimensions: {
    area: null,                   // Total roof area in square meters (number or null)
    width: null,                  // Width dimension in meters (number or null)
    length: null,                 // Length dimension in meters (number or null)
    source: null,                 // Data source: 'ai' | 'manual' | 'measured' | null
    lastUpdated: null,            // Timestamp of last update (number or null)
    confidence: 0                 // AI confidence score (0-1)
  },

  // Financial information
  financial: {
    budget: null,                 // Available budget in Philippine Pesos (number or null)
    monthlyBill: null,            // Monthly electricity bill in pesos (number or null)
    electricityRate: 10,          // Electricity rate in ₱/kWh (number, default 10)
    source: null,                 // Data source: 'ai' | 'manual' | null
    lastUpdated: null,            // Timestamp of last update (number or null)
    confidence: 0                 // AI confidence score (0-1)
  },

  // Technical specifications for solar panels
  technical: {
    panelSize: null,              // Individual panel size in kWp (number or null)
    tilt: 18,                     // Panel tilt angle in degrees (number, default 18)
    azimuth: 180,                 // Panel azimuth angle in degrees (number, default 180 = south)
    orientation: 'South',         // Cardinal direction (string)
    source: null,                 // Data source: 'ai' | 'manual' | null
    lastUpdated: null,            // Timestamp of last update (number or null)
    confidence: 0                 // AI confidence score (0-1)
  }
};

/**
 * Calculation results state
 * Stores the outputs from solar calculations
 * 
 * @typedef {Object} ResultsState
 */
const initialResults = {
  systemCapacity: null,           // Total system capacity in kWp (number or null)
  panelCount: null,               // Number of solar panels (number or null)
  annualProduction: null,         // Annual energy production in kWh (number or null)
  annualSavings: null,            // Annual cost savings in pesos (number or null)
  paybackPeriod: null,            // Investment payback period in years (number or null)
  roi: null,                      // Return on investment percentage (number or null)
  co2Offset: null,                // CO2 emissions offset in kg (number or null)
  monthlyData: [],                // Array of monthly production/savings data
  systemCosts: null,              // Object with cost breakdowns by system type
  calculatedAt: null,             // Timestamp when results were calculated (number or null)
  isValid: false                  // Whether results are valid and up-to-date (boolean)
};

/**
 * Conversation state from Phase 1
 * Maintains AI chatbot conversation and extracted parameters
 * 
 * @typedef {Object} ConversationState
 */
const initialConversation = {
  messages: [],                   // Array of conversation messages
  extractedParams: {              // Parameters extracted from conversation
    location: null,               // Extracted location data
    area: null,                   // Extracted area data
    financial: null,              // Extracted financial data
    technical: null               // Extracted technical data
  },
  userIntent: 'planning',         // User's primary intent: 'planning' | 'comparing' | 'learning'
  stage: 'greeting',              // Conversation stage: 'greeting' | 'gathering' | 'calculating' | 'explaining'
  sessionId: null,                // Unique session identifier (string or null)
  lastUpdated: null               // Timestamp of last conversation update (number or null)
};

/**
 * User interface state
 * Tracks the state of UI components and views
 * 
 * @typedef {Object} UIState
 */
const initialUI = {
  activeView: 'map',              // Current active view: 'map' | 'calculator' | 'results'
  chatbotOpen: false,             // Whether AI chatbot is open (boolean)
  reviewModalOpen: false,         // Whether parameter review modal is open (boolean)
  drawerOpen: false,              // Whether calculator drawer is open (boolean)
  conflictModalOpen: false,       // Whether conflict resolution modal is open (boolean)
  historyControlsVisible: false,  // Whether undo/redo controls are visible (boolean)
  selectedTab: 'parameters',      // Selected tab in UI: 'parameters' | 'results' | 'history'
  notifications: [],              // Array of active notifications
  loading: false,                 // Whether any async operation is in progress (boolean)
  error: null                     // Current error message (string or null)
};

/**
 * History state for undo/redo functionality
 * Maintains stack of previous, current, and future states
 * 
 * @typedef {Object} HistoryState
 */
const initialHistory = {
  past: [],                       // Array of previous states (older to newer)
  present: {},                    // Current state snapshot (will be populated on init)
  future: [],                     // Array of undone states for redo (newer to older)
  maxSize: 20,                    // Maximum number of states to keep in history
  tracking: true                  // Whether to track changes in history (boolean)
};

/**
 * Synchronization state
 * Tracks sync status between components
 * 
 * @typedef {Object} SyncState
 */
const initialSync = {
  isSyncing: false,               // Whether sync operation is in progress (boolean)
  lastSyncTime: null,             // Timestamp of last successful sync (number or null)
  pendingChanges: [],             // Array of changes waiting to be synced
  conflicts: [],                  // Array of detected conflicts
  syncErrors: [],                 // Array of sync errors
  autoSaveEnabled: true,          // Whether auto-save is enabled (boolean)
  lastAutoSave: null              // Timestamp of last auto-save (number or null)
};

/**
 * Complete initial state for the application
 * This is the default state when app first loads
 */
export const initialState = {
  parameters: initialParameters,
  results: initialResults,
  conversation: initialConversation,
  ui: initialUI,
  history: initialHistory,
  sync: initialSync,
  version: 2,                     // State version for migration purposes
  createdAt: Date.now(),          // When this state was created
  lastModified: Date.now()        // When this state was last modified
};

/**
 * Validation rules for parameters
 * Defines constraints for each parameter type
 */
export const validationRules = {
  location: {
    lat: {
      min: 4.0,                   // Minimum latitude (Southern Philippines)
      max: 21.0,                  // Maximum latitude (Northern Philippines)
      required: true,             // Whether this field is required for calculation
      description: 'Latitude must be within Philippine boundaries (4°N-21°N)'
    },
    lng: {
      min: 116.0,                 // Minimum longitude (Western Philippines)
      max: 127.0,                 // Maximum longitude (Eastern Philippines)
      required: true,             // Whether this field is required
      description: 'Longitude must be within Philippine boundaries (116°E-127°E)'
    }
  },

  dimensions: {
    area: {
      min: 6,                     // Minimum roof area in sqm
      max: 1000,                  // Maximum reasonable roof area
      required: true,             // Whether this field is required
      description: 'Roof area must be between 6 and 1000 square meters'
    },
    width: {
      min: 1,                     // Minimum width in meters
      max: 100,                   // Maximum width
      required: false,            // Optional field
      description: 'Width must be between 1 and 100 meters'
    },
    length: {
      min: 1,                     // Minimum length in meters
      max: 100,                   // Maximum length
      required: false,            // Optional field
      description: 'Length must be between 1 and 100 meters'
    }
  },

  financial: {
    budget: {
      min: 50000,                 // Minimum budget in pesos
      max: 10000000,              // Maximum budget
      required: false,            // Optional field
      description: 'Budget must be between ₱50,000 and ₱10,000,000'
    },
    monthlyBill: {
      min: 100,                   // Minimum monthly bill
      max: 100000,                // Maximum monthly bill
      required: false,            // Optional field
      description: 'Monthly bill must be between ₱100 and ₱100,000'
    },
    electricityRate: {
      min: 4.5,                   // Minimum rate in ₱/kWh
      max: 15.0,                  // Maximum rate
      required: true,             // Required for savings calculation
      description: 'Electricity rate must be between ₱4.50 and ₱15.00 per kWh'
    }
  },

  technical: {
    tilt: {
      min: 0,                     // Minimum tilt angle (flat)
      max: 90,                    // Maximum tilt angle (vertical)
      optimal: { min: 10, max: 20 }, // Optimal range for Philippines
      required: true,             // Required for calculation
      description: 'Tilt angle must be between 0° and 90°. Optimal: 10-20°'
    },
    azimuth: {
      min: 0,                     // Minimum azimuth (North)
      max: 360,                   // Maximum azimuth
      optimal: 180,               // Optimal azimuth (South)
      required: true,             // Required for calculation
      description: 'Azimuth must be between 0° and 360°. Optimal: 180° (south-facing)'
    },
    panelSize: {
      allowed: [0.5, 0.55, 0.6, 0.65, 0.7], // Allowed panel sizes in kWp
      required: true,             // Required for calculation
      description: 'Panel size must be one of: 0.5, 0.55, 0.6, 0.65, or 0.7 kWp'
    }
  }
};

/**
 * Data flow dependencies
 * Defines which state changes trigger recalculation or other updates
 */
export const stateDependencies = {
  // These parameters require recalculation when changed
  requiresRecalculation: [
    'parameters.location.lat',
    'parameters.location.lng',
    'parameters.dimensions.area',
    'parameters.technical.tilt',
    'parameters.technical.azimuth',
    'parameters.technical.panelSize',
    'parameters.financial.electricityRate'
  ],

  // These parameters trigger AI context update
  triggersAIUpdate: [
    'parameters.location',
    'parameters.dimensions',
    'parameters.financial',
    'parameters.technical'
  ],

  // These changes should be added to history
  trackedInHistory: [
    'parameters',
    'results'
  ],

  // These changes trigger auto-save
  triggersAutoSave: [
    'parameters',
    'results',
    'conversation.messages'
  ]
};

/**
 * Action type constants
 * Defines all possible state change actions
 */
export const ActionTypes = {
  // Parameter updates
  UPDATE_LOCATION: 'UPDATE_LOCATION',
  UPDATE_DIMENSIONS: 'UPDATE_DIMENSIONS',
  UPDATE_FINANCIAL: 'UPDATE_FINANCIAL',
  UPDATE_TECHNICAL: 'UPDATE_TECHNICAL',
  UPDATE_ALL_PARAMETERS: 'UPDATE_ALL_PARAMETERS',

  // Results updates
  UPDATE_RESULTS: 'UPDATE_RESULTS',
  CLEAR_RESULTS: 'CLEAR_RESULTS',

  // Conversation updates
  ADD_MESSAGE: 'ADD_MESSAGE',
  CLEAR_CONVERSATION: 'CLEAR_CONVERSATION',
  UPDATE_CONVERSATION_STAGE: 'UPDATE_CONVERSATION_STAGE',
  UPDATE_EXTRACTED_PARAMS: 'UPDATE_EXTRACTED_PARAMS',

  // UI updates
  SET_UI_STATE: 'SET_UI_STATE',
  TOGGLE_CHATBOT: 'TOGGLE_CHATBOT',
  TOGGLE_DRAWER: 'TOGGLE_DRAWER',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // History actions
  UNDO: 'UNDO',
  REDO: 'REDO',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',

  // Sync actions
  START_SYNC: 'START_SYNC',
  SYNC_SUCCESS: 'SYNC_SUCCESS',
  SYNC_FAILURE: 'SYNC_FAILURE',
  ADD_CONFLICT: 'ADD_CONFLICT',
  RESOLVE_CONFLICT: 'RESOLVE_CONFLICT',
  CLEAR_CONFLICTS: 'CLEAR_CONFLICTS',

  // State management
  RESET_STATE: 'RESET_STATE',
  LOAD_STATE: 'LOAD_STATE',
  IMPORT_STATE: 'IMPORT_STATE'
};

/**
 * Helper function to get a fresh copy of initial state
 * Creates new timestamps for createdAt and lastModified
 * 
 * @returns {UnifiedState} Fresh initial state object
 */
export function getInitialState() {
  return {
    ...initialState,
    createdAt: Date.now(),
    lastModified: Date.now(),
    conversation: {
      ...initialState.conversation,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  };
}

/**
 * Helper function to validate a parameter value against rules
 * Checks if value meets defined constraints
 * 
 * @param {string} category - Parameter category (location, dimensions, financial, technical)
 * @param {string} field - Specific field name within category
 * @param {*} value - Value to validate
 * @returns {Object} Validation result with isValid flag and error message
 */
export function validateParameter(category, field, value) {
  // Get validation rules for this field
  const rules = validationRules[category]?.[field];

  // If no rules defined, consider valid
  if (!rules) {
    return { isValid: true, error: null };
  }

  // Check if required field is null/undefined
  if (rules.required && (value === null || value === undefined || value === '')) {
    return {
      isValid: false,
      error: `${field} is required`
    };
  }

  // If value is null/undefined and not required, it's valid
  if (value === null || value === undefined || value === '') {
    return { isValid: true, error: null };
  }

  // Check numeric ranges
  if (rules.min !== undefined && value < rules.min) {
    return {
      isValid: false,
      error: `${field} must be at least ${rules.min}. ${rules.description || ''}`
    };
  }

  if (rules.max !== undefined && value > rules.max) {
    return {
      isValid: false,
      error: `${field} must be at most ${rules.max}. ${rules.description || ''}`
    };
  }

  // Check allowed values (for dropdowns/selections)
  if (rules.allowed && !rules.allowed.includes(value)) {
    return {
      isValid: false,
      error: `${field} must be one of: ${rules.allowed.join(', ')}`
    };
  }

  // All validations passed
  return { isValid: true, error: null };
}

/**
 * Helper function to check if recalculation is needed
 * Determines if state changes require recalculating results
 * 
 * @param {string} changedPath - Dot-notation path of changed state (e.g., 'parameters.location.lat')
 * @returns {boolean} True if recalculation needed
 */
export function requiresRecalculation(changedPath) {
  return stateDependencies.requiresRecalculation.some(path =>
    changedPath.startsWith(path)
  );
}

/**
 * Helper function to check if AI update is needed
 * Determines if state changes should update AI context
 * 
 * @param {string} changedPath - Dot-notation path of changed state
 * @returns {boolean} True if AI update needed
 */
export function triggersAIUpdate(changedPath) {
  return stateDependencies.triggersAIUpdate.some(path =>
    changedPath.startsWith(path)
  );
}

/**
 * Helper function to check if change should be tracked in history
 * 
 * @param {string} changedPath - Dot-notation path of changed state
 * @returns {boolean} True if should be added to history
 */
export function shouldTrackInHistory(changedPath) {
  return stateDependencies.trackedInHistory.some(path =>
    changedPath.startsWith(path)
  );
}

/**
 * Helper function to check if change triggers auto-save
 * 
 * @param {string} changedPath - Dot-notation path of changed state
 * @returns {boolean} True if should trigger auto-save
 */
export function triggersAutoSave(changedPath) {
  return stateDependencies.triggersAutoSave.some(path =>
    changedPath.startsWith(path)
  );
}

// Export all state-related constants and functions
export default {
  initialState,
  initialParameters,
  initialResults,
  initialConversation,
  initialUI,
  initialHistory,
  initialSync,
  validationRules,
  stateDependencies,
  ActionTypes,
  getInitialState,
  validateParameter,
  requiresRecalculation,
  triggersAIUpdate,
  shouldTrackInHistory,
  triggersAutoSave
};

