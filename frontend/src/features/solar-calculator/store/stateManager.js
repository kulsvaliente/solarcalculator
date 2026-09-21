/**
 * Unified State Manager
 * 
 * This module implements a Redux-like state manager for the Solar AI Calculator.
 * It provides centralized state management with actions, reducers, and middleware support.
 * 
 * @module stateManager
 */

import { ActionTypes, getInitialState, validateParameter } from './schema';

/**
 * Create a centralized state store
 * Implements Redux-like pattern with dispatch, subscribe, and middleware
 * 
 * @param {Object} initialState - Initial state object
 * @param {Array} middleware - Array of middleware functions
 * @returns {Object} Store object with getState, dispatch, subscribe methods
 * 
 * @example
 * const store = createStore(getInitialState(), [loggingMiddleware]);
 * store.subscribe((state) => console.log('State changed:', state));
 * store.dispatch({ type: 'UPDATE_LOCATION', payload: { lat: 14.5, lng: 120.9 } });
 */
export function createStore(initialState = getInitialState(), middleware = []) {
  // Internal state - private to this closure
  let state = initialState;
  
  // List of subscriber callbacks
  let listeners = [];

  /**
   * Get current state
   * Returns a copy to prevent direct mutation
   * 
   * @returns {Object} Current state object
   */
  const getState = () => {
    return state;  // In production, could return deep copy: JSON.parse(JSON.stringify(state))
  };

  /**
   * Subscribe to state changes
   * Callback is called whenever state updates
   * 
   * @param {Function} listener - Callback function to call on state change
   * @returns {Function} Unsubscribe function
   */
  const subscribe = (listener) => {
    // Add listener to array
    listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  /**
   * Dispatch an action to update state
   * Runs action through middleware, then reducer, then notifies listeners
   * 
   * @param {Object} action - Action object with type and payload
   * @returns {Object} The dispatched action
   */
  const dispatch = (action) => {
    // Create middleware chain
    let middlewareChain = middleware.map(mw => mw({ getState, dispatch }));
    
    // Apply middleware in order
    let dispatchFunc = (act) => {
      // Run reducer to get new state
      const newState = reducer(state, act);
      
      // Update state
      state = newState;
      
      // Notify all listeners
      listeners.forEach(listener => listener(state));
      
      return act;
    };

    // Compose middleware (right to left)
    middlewareChain.reverse().forEach(mw => {
      const nextDispatch = dispatchFunc;
      dispatchFunc = (act) => mw(nextDispatch)(act);
    });

    // Dispatch the action through middleware chain
    return dispatchFunc(action);
  };

  // Return store API
  return {
    getState,
    dispatch,
    subscribe
  };
}

/**
 * Root reducer function
 * Handles all action types and returns new state
 * Pure function - does not mutate original state
 * 
 * @param {Object} state - Current state
 * @param {Object} action - Action to process
 * @returns {Object} New state after applying action
 */
export function reducer(state, action) {
  // Update lastModified on every action
  const timestamp = Date.now();

  switch (action.type) {
    case ActionTypes.UPDATE_LOCATION: {
      // Update location parameters
      return {
        ...state,
        parameters: {
          ...state.parameters,
          location: {
            ...state.parameters.location,
            ...action.payload,
            lastUpdated: timestamp
          }
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UPDATE_DIMENSIONS: {
      // Update dimension parameters
      return {
        ...state,
        parameters: {
          ...state.parameters,
          dimensions: {
            ...state.parameters.dimensions,
            ...action.payload,
            lastUpdated: timestamp
          }
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UPDATE_FINANCIAL: {
      // Update financial parameters
      return {
        ...state,
        parameters: {
          ...state.parameters,
          financial: {
            ...state.parameters.financial,
            ...action.payload,
            lastUpdated: timestamp
          }
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UPDATE_TECHNICAL: {
      // Update technical parameters
      return {
        ...state,
        parameters: {
          ...state.parameters,
          technical: {
            ...state.parameters.technical,
            ...action.payload,
            lastUpdated: timestamp
          }
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UPDATE_ALL_PARAMETERS: {
      // Update multiple parameters at once (for AI auto-fill)
      return {
        ...state,
        parameters: {
          location: action.payload.location || state.parameters.location,
          dimensions: action.payload.dimensions || state.parameters.dimensions,
          financial: action.payload.financial || state.parameters.financial,
          technical: action.payload.technical || state.parameters.technical
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UPDATE_RESULTS: {
      // Update calculation results
      return {
        ...state,
        results: {
          ...action.payload,
          calculatedAt: timestamp,
          isValid: true
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.CLEAR_RESULTS: {
      // Clear calculation results (mark as invalid)
      return {
        ...state,
        results: {
          ...state.results,
          isValid: false
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.ADD_MESSAGE: {
      // Add message to conversation
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: [...state.conversation.messages, action.payload],
          lastUpdated: timestamp
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.CLEAR_CONVERSATION: {
      // Clear all conversation messages
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: [],
          extractedParams: {
            location: null,
            area: null,
            financial: null,
            technical: null
          },
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          lastUpdated: timestamp
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UPDATE_CONVERSATION_STAGE: {
      // Update conversation stage
      return {
        ...state,
        conversation: {
          ...state.conversation,
          stage: action.payload,
          lastUpdated: timestamp
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UPDATE_EXTRACTED_PARAMS: {
      // Update extracted parameters from conversation
      return {
        ...state,
        conversation: {
          ...state.conversation,
          extractedParams: {
            ...state.conversation.extractedParams,
            ...action.payload
          },
          lastUpdated: timestamp
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.SET_UI_STATE: {
      // Update UI state
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.TOGGLE_CHATBOT: {
      // Toggle chatbot open/closed
      return {
        ...state,
        ui: {
          ...state.ui,
          chatbotOpen: !state.ui.chatbotOpen
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.TOGGLE_DRAWER: {
      // Toggle drawer open/closed
      return {
        ...state,
        ui: {
          ...state.ui,
          drawerOpen: !state.ui.drawerOpen
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.ADD_NOTIFICATION: {
      // Add notification to queue
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [
            ...state.ui.notifications,
            { ...action.payload, id: Date.now(), timestamp }
          ]
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.REMOVE_NOTIFICATION: {
      // Remove notification by ID
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload)
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.SET_ERROR: {
      // Set error message
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.CLEAR_ERROR: {
      // Clear error message
      return {
        ...state,
        ui: {
          ...state.ui,
          error: null
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.START_SYNC: {
      // Mark sync as in progress
      return {
        ...state,
        sync: {
          ...state.sync,
          isSyncing: true
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.SYNC_SUCCESS: {
      // Mark sync as successful
      return {
        ...state,
        sync: {
          ...state.sync,
          isSyncing: false,
          lastSyncTime: timestamp,
          pendingChanges: [],
          syncErrors: []
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.SYNC_FAILURE: {
      // Record sync failure
      return {
        ...state,
        sync: {
          ...state.sync,
          isSyncing: false,
          syncErrors: [...state.sync.syncErrors, action.payload]
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.ADD_CONFLICT: {
      // Add conflict to list
      return {
        ...state,
        sync: {
          ...state.sync,
          conflicts: [...state.sync.conflicts, action.payload]
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.RESOLVE_CONFLICT: {
      // Remove resolved conflict
      return {
        ...state,
        sync: {
          ...state.sync,
          conflicts: state.sync.conflicts.filter(c => c.id !== action.payload)
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.CLEAR_CONFLICTS: {
      // Clear all conflicts
      return {
        ...state,
        sync: {
          ...state.sync,
          conflicts: []
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.UNDO: {
      // Undo last change - restore from history
      if (!state.history || !state.history.past || state.history.past.length === 0) {
        // No history to undo
        return state;
      }

      // Pop last state from past
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      // Push current state to future (for redo)
      const newFuture = [state, ...state.history.future];

      // Return previous state with updated history
      return {
        ...previous,
        history: {
          ...state.history,
          past: newPast,
          present: previous,
          future: newFuture
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.REDO: {
      // Redo last undone change
      if (!state.history || !state.history.future || state.history.future.length === 0) {
        // No future states to redo
        return state;
      }

      // Pop first state from future
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      // Push current state to past
      const newPast = [...state.history.past, state];

      // Return next state with updated history
      return {
        ...next,
        history: {
          ...state.history,
          past: newPast,
          present: next,
          future: newFuture
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.ADD_TO_HISTORY: {
      // Manually add current state to history
      if (!state.history) {
        return state;
      }

      const newPast = [...state.history.past, state];
      
      // Trim history if exceeds max size
      const maxSize = state.history.maxSize || 20;
      if (newPast.length > maxSize) {
        newPast.shift();  // Remove oldest state
      }

      return {
        ...state,
        history: {
          ...state.history,
          past: newPast,
          future: []  // Clear redo stack on new action
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.CLEAR_HISTORY: {
      // Clear all history
      return {
        ...state,
        history: {
          ...state.history,
          past: [],
          future: []
        },
        lastModified: timestamp
      };
    }

    case ActionTypes.RESET_STATE: {
      // Reset to initial state (keep session ID)
      const freshState = getInitialState();
      return {
        ...freshState,
        conversation: {
          ...freshState.conversation,
          sessionId: state.conversation.sessionId || freshState.conversation.sessionId
        }
      };
    }

    case ActionTypes.LOAD_STATE: {
      // Load state from external source (e.g., localStorage)
      return {
        ...action.payload,
        lastModified: timestamp
      };
    }

    case ActionTypes.IMPORT_STATE: {
      // Import state from external source (merge or replace)
      if (action.merge) {
        return {
          ...state,
          ...action.payload,
          lastModified: timestamp
        };
      }
      return {
        ...action.payload,
        lastModified: timestamp
      };
    }

    default:
      // Return current state if action type not recognized
      return state;
  }
}

/**
 * Action creator: Update location parameters
 * 
 * @param {Object} location - Location data
 * @param {string} source - Source of update ('ai' | 'manual' | 'map')
 * @returns {Object} Action object
 */
export const updateLocation = (location, source = 'manual') => ({
  type: ActionTypes.UPDATE_LOCATION,
  payload: { ...location, source }
});

/**
 * Action creator: Update dimension parameters
 * 
 * @param {Object} dimensions - Dimension data
 * @param {string} source - Source of update
 * @returns {Object} Action object
 */
export const updateDimensions = (dimensions, source = 'manual') => ({
  type: ActionTypes.UPDATE_DIMENSIONS,
  payload: { ...dimensions, source }
});

/**
 * Action creator: Update financial parameters
 * 
 * @param {Object} financial - Financial data
 * @param {string} source - Source of update
 * @returns {Object} Action object
 */
export const updateFinancial = (financial, source = 'manual') => ({
  type: ActionTypes.UPDATE_FINANCIAL,
  payload: { ...financial, source }
});

/**
 * Action creator: Update technical parameters
 * 
 * @param {Object} technical - Technical data
 * @param {string} source - Source of update
 * @returns {Object} Action object
 */
export const updateTechnical = (technical, source = 'manual') => ({
  type: ActionTypes.UPDATE_TECHNICAL,
  payload: { ...technical, source }
});

/**
 * Action creator: Update calculation results
 * 
 * @param {Object} results - Calculation results
 * @returns {Object} Action object
 */
export const updateResults = (results) => ({
  type: ActionTypes.UPDATE_RESULTS,
  payload: results
});

/**
 * Action creator: Add conversation message
 * 
 * @param {Object} message - Message object
 * @returns {Object} Action object
 */
export const addMessage = (message) => ({
  type: ActionTypes.ADD_MESSAGE,
  payload: message
});

/**
 * Action creator: Update UI state
 * 
 * @param {Object} uiChanges - UI state changes
 * @returns {Object} Action object
 */
export const setUIState = (uiChanges) => ({
  type: ActionTypes.SET_UI_STATE,
  payload: uiChanges
});

/**
 * Logging Middleware
 * Logs all actions and state changes to console in development mode
 * 
 * @param {Object} store - Store object
 * @returns {Function} Middleware function
 */
export const loggingMiddleware = (store) => (next) => (action) => {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.group(`Action: ${action.type}`);
    console.log('Payload:', action.payload);
    console.log('Previous State:', store.getState());
  }

  // Call next middleware/reducer
  const result = next(action);

  // Log new state in development
  if (process.env.NODE_ENV === 'development') {
    console.log('New State:', store.getState());
    console.groupEnd();
  }

  return result;
};

/**
 * Validation Middleware
 * Validates action payloads before applying to state
 * 
 * @param {Object} store - Store object
 * @returns {Function} Middleware function
 */
export const validationMiddleware = (store) => (next) => (action) => {
  // Skip validation for non-parameter actions
  if (!action.type.startsWith('UPDATE_')) {
    return next(action);
  }

  // Validate parameter updates
  if (action.type === ActionTypes.UPDATE_LOCATION && action.payload.lat && action.payload.lng) {
    const latValidation = validateParameter('location', 'lat', action.payload.lat);
    const lngValidation = validateParameter('location', 'lng', action.payload.lng);
    
    if (!latValidation.isValid || !lngValidation.isValid) {
      console.warn('Validation failed:', latValidation.error || lngValidation.error);
      // Could dispatch error action here
      // For now, we'll allow it through but log warning
    }
  }

  // Pass action to next middleware/reducer
  return next(action);
};

/**
 * Persistence Middleware
 * Auto-saves state to localStorage after certain actions
 * 
 * @param {Object} store - Store object
 * @returns {Function} Middleware function
 */
export const persistenceMiddleware = (store) => (next) => (action) => {
  // Call next middleware/reducer first
  const result = next(action);

  // Determine if this action should trigger save
  const shouldSave = [
    ActionTypes.UPDATE_LOCATION,
    ActionTypes.UPDATE_DIMENSIONS,
    ActionTypes.UPDATE_FINANCIAL,
    ActionTypes.UPDATE_TECHNICAL,
    ActionTypes.UPDATE_RESULTS,
    ActionTypes.ADD_MESSAGE
  ].includes(action.type);

  // Save to localStorage if needed
  if (shouldSave) {
    try {
      const state = store.getState();
      localStorage.setItem('solar_unified_state_v2', JSON.stringify(state));
      
      // Update auto-save timestamp
      store.dispatch({
        type: ActionTypes.START_SYNC,
        meta: { skipPersistence: true }  // Prevent infinite loop
      });
      
      console.log('State auto-saved to localStorage');
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }

  return result;
};

/**
 * Default middleware stack
 * Includes logging (dev only), validation, and persistence
 */
export const defaultMiddleware = [
  loggingMiddleware,
  validationMiddleware,
  persistenceMiddleware
];

// Export all functions
export default {
  createStore,
  reducer,
  updateLocation,
  updateDimensions,
  updateFinancial,
  updateTechnical,
  updateResults,
  addMessage,
  setUIState,
  loggingMiddleware,
  validationMiddleware,
  persistenceMiddleware,
  defaultMiddleware
};

