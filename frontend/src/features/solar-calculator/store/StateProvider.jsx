/**
 * Unified State Provider
 * 
 * React Context provider that wraps the state manager and provides
 * unified state access to all components in the solar calculator app.
 * 
 * @module StateProvider
 * 
 * @example
 * // Wrap your app
 * <UnifiedStateProvider>
 *   <MapComponent />
 *   <SolarAIChatbot />
 * </UnifiedStateProvider>
 * 
 * @example
 * // Use in components
 * const { state, updateParameter, undo, redo } = useUnifiedState();
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  createStore, 
  defaultMiddleware,
  updateLocation,
  updateDimensions,
  updateFinancial,
  updateTechnical,
  updateResults,
  addMessage as addMessageAction,
  setUIState
} from './stateManager';
import { getInitialState, ActionTypes } from './schema';

// Create context for unified state
const UnifiedStateContext = createContext(null);

/**
 * Unified State Provider Component
 * Manages central state and provides it to all child components
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export function UnifiedStateProvider({ children }) {
  // Create store instance (only once)
  const storeRef = useRef(null);
  
  if (!storeRef.current) {
    // Try to load saved state from localStorage
    const savedState = loadStateFromStorage();
    const initState = savedState || getInitialState();
    
    // Create store with middleware
    storeRef.current = createStore(initState, defaultMiddleware);
  }

  // Local state to trigger re-renders when store updates
  const [, forceUpdate] = useState({});

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = storeRef.current.subscribe(() => {
      // Force component re-render when state changes
      forceUpdate({});
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Get current state from store
  const state = storeRef.current.getState();

  /**
   * Update a parameter category
   * Generic function to update any parameter category
   * 
   * @param {string} category - Category name (location, dimensions, financial, technical)
   * @param {Object} data - Data to update
   * @param {string} source - Source of update
   */
  const updateParameter = useCallback((category, data, source = 'manual') => {
    const actionMap = {
      location: updateLocation,
      dimensions: updateDimensions,
      financial: updateFinancial,
      technical: updateTechnical
    };

    const actionCreator = actionMap[category];
    if (actionCreator) {
      storeRef.current.dispatch(actionCreator(data, source));
    } else {
      console.warn(`Unknown parameter category: ${category}`);
    }
  }, []);

  /**
   * Update calculation results
   * 
   * @param {Object} results - Calculation results object
   */
  const updateCalculationResults = useCallback((results) => {
    storeRef.current.dispatch(updateResults(results));
  }, []);

  /**
   * Add message to conversation
   * 
   * @param {Object} message - Message object with role and content
   */
  const addMessage = useCallback((message) => {
    storeRef.current.dispatch(addMessageAction(message));
  }, []);

  /**
   * Update UI state
   * 
   * @param {Object} uiChanges - UI state changes
   */
  const updateUI = useCallback((uiChanges) => {
    storeRef.current.dispatch(setUIState(uiChanges));
  }, []);

  /**
   * Undo last action
   * Reverts state to previous version in history
   */
  const undo = useCallback(() => {
    storeRef.current.dispatch({ type: ActionTypes.UNDO });
  }, []);

  /**
   * Redo last undone action
   * Re-applies an undone state change
   */
  const redo = useCallback(() => {
    storeRef.current.dispatch({ type: ActionTypes.REDO });
  }, []);

  /**
   * Check if undo is available
   * 
   * @returns {boolean} True if can undo
   */
  const canUndo = state.history && state.history.past && state.history.past.length > 0;

  /**
   * Check if redo is available
   * 
   * @returns {boolean} True if can redo
   */
  const canRedo = state.history && state.history.future && state.history.future.length > 0;

  /**
   * Reset state to initial values
   * Clears all data and starts fresh
   */
  const resetState = useCallback(() => {
    storeRef.current.dispatch({ type: ActionTypes.RESET_STATE });
  }, []);

  /**
   * Export current state as JSON
   * Useful for debugging or sharing configurations
   * 
   * @returns {string} JSON string of current state
   */
  const exportState = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  /**
   * Import state from JSON
   * Loads external state into application
   * 
   * @param {string} jsonString - JSON string of state
   * @param {boolean} merge - Whether to merge or replace
   */
  const importState = useCallback((jsonString, merge = false) => {
    try {
      const parsedState = JSON.parse(jsonString);
      storeRef.current.dispatch({
        type: ActionTypes.IMPORT_STATE,
        payload: parsedState,
        merge
      });
    } catch (error) {
      console.error('Failed to import state:', error);
    }
  }, []);

  /**
   * Add notification to UI
   * 
   * @param {Object} notification - Notification object
   */
  const addNotification = useCallback((notification) => {
    storeRef.current.dispatch({
      type: ActionTypes.ADD_NOTIFICATION,
      payload: notification
    });
  }, []);

  /**
   * Remove notification by ID
   * 
   * @param {number} id - Notification ID
   */
  const removeNotification = useCallback((id) => {
    storeRef.current.dispatch({
      type: ActionTypes.REMOVE_NOTIFICATION,
      payload: id
    });
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Context value with state and all actions
  const contextValue = {
    // Current state
    state,

    // Parameter actions
    updateParameter,
    updateCalculationResults,

    // Conversation actions
    addMessage,

    // UI actions
    updateUI,
    addNotification,
    removeNotification,

    // History actions
    undo,
    redo,
    canUndo,
    canRedo,

    // Utility actions
    resetState,
    exportState,
    importState,

    // Direct store access (for advanced use)
    store: storeRef.current
  };

  return (
    <UnifiedStateContext.Provider value={contextValue}>
      {children}
    </UnifiedStateContext.Provider>
  );
}

/**
 * Custom hook to access unified state
 * Provides easy access to state and actions from any component
 * 
 * @throws {Error} If used outside of UnifiedStateProvider
 * @returns {Object} Context value with state and actions
 * 
 * @example
 * const { state, updateParameter, undo, canUndo } = useUnifiedState();
 * updateParameter('dimensions', { area: 50 }, 'ai');
 */
export function useUnifiedState() {
  const context = useContext(UnifiedStateContext);

  // Ensure hook is used within provider
  if (!context) {
    throw new Error('useUnifiedState must be used within UnifiedStateProvider');
  }

  return context;
}

/**
 * Load state from localStorage
 * Attempts to restore previous session
 * 
 * @returns {Object|null} Saved state or null if not found
 */
function loadStateFromStorage() {
  try {
    // Try to load Phase 2 unified state
    const savedState = localStorage.getItem('solar_unified_state_v2');
    
    if (!savedState) {
      // Try to migrate from Phase 1 conversation state
      return migratePhase1State();
    }

    const parsedState = JSON.parse(savedState);
    
    // Check if state is recent (within 24 hours)
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = parsedState.lastModified &&
                    (Date.now() - parsedState.lastModified) < twentyFourHours;

    // Return state if recent, otherwise return null
    return isRecent ? parsedState : null;
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return null;
  }
}

/**
 * Save state to localStorage
 * Persists current state for session recovery
 * 
 * @param {Object} state - Current state to save
 */
function saveStateToStorage(state) {
  try {
    localStorage.setItem('solar_unified_state_v2', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
    
    // If quota exceeded, try to clear old data
    if (error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded, clearing old data...');
      // Could implement cleanup logic here
    }
  }
}

/**
 * Migrate Phase 1 conversation state to Phase 2 format
 * Ensures backward compatibility with Phase 1 saved data
 * 
 * @returns {Object|null} Migrated state or null
 */
function migratePhase1State() {
  try {
    const phase1State = localStorage.getItem('solar_ai_conversation_state');
    
    if (!phase1State) {
      return null;
    }

    const parsed = JSON.parse(phase1State);
    
    // Create Phase 2 state structure
    const migratedState = getInitialState();
    
    // Migrate conversation data
    if (parsed.messages) {
      migratedState.conversation.messages = parsed.messages;
    }
    
    if (parsed.extractedParams) {
      migratedState.conversation.extractedParams = parsed.extractedParams;
    }
    
    if (parsed.userIntent) {
      migratedState.conversation.userIntent = parsed.userIntent;
    }
    
    if (parsed.sessionId) {
      migratedState.conversation.sessionId = parsed.sessionId;
    }

    // Migrate extracted parameters to parameters state
    if (parsed.extractedParams) {
      if (parsed.extractedParams.location) {
        migratedState.parameters.location = {
          ...migratedState.parameters.location,
          ...parsed.extractedParams.location,
          source: 'ai'
        };
      }
      
      if (parsed.extractedParams.area) {
        migratedState.parameters.dimensions = {
          ...migratedState.parameters.dimensions,
          area: parsed.extractedParams.area.value,
          source: 'ai',
          confidence: parsed.extractedParams.area.confidence
        };
      }
      
      if (parsed.extractedParams.financial) {
        migratedState.parameters.financial = {
          ...migratedState.parameters.financial,
          budget: parsed.extractedParams.financial.budget,
          monthlyBill: parsed.extractedParams.financial.monthlyBill,
          source: 'ai',
          confidence: parsed.extractedParams.financial.confidence
        };
      }
      
      if (parsed.extractedParams.technical) {
        migratedState.parameters.technical = {
          ...migratedState.parameters.technical,
          tilt: parsed.extractedParams.technical.tilt,
          azimuth: parsed.extractedParams.technical.azimuth,
          orientation: parsed.extractedParams.technical.orientation,
          source: 'ai',
          confidence: parsed.extractedParams.technical.confidence
        };
      }
    }

    console.log('Migrated Phase 1 state to Phase 2 format');
    return migratedState;
  } catch (error) {
    console.error('Error migrating Phase 1 state:', error);
    return null;
  }
}

// Export context for advanced use cases
export default UnifiedStateContext;

