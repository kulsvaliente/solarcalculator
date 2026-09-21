/**
 * Conversation Context for Solar AI Calculator
 * 
 * This React Context manages the unified state between the AI chatbot and calculator,
 * enabling seamless parameter extraction, validation, and conversation flow management.
 * 
 * @module ConversationContext
 * 
 * @example
 * // Wrap your app with the provider
 * <ConversationProvider>
 *   <SolarCalculatorApp />
 * </ConversationProvider>
 * 
 * @example
 * // Use the context in components
 * const { messages, extractedParams, addMessage, updateExtractedParams } = useConversation();
 * addMessage({ role: 'user', content: 'I have a 50 sqm roof in Manila' });
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { validateAll } from '../services/parameterValidator';

// Create the context object that will hold conversation state
const ConversationContext = createContext(null);

// LocalStorage key for persisting conversation state
const STORAGE_KEY = 'solar_ai_conversation_state';

/**
 * Initial state structure for the conversation
 * This defines all the data we track during a conversation session
 */
const initialState = {
  // Array of conversation messages between user and AI
  messages: [],
  
  // Raw parameters extracted from conversation using NLP
  extractedParams: {
    location: null,      // { city, province, lat, lng, confidence }
    area: null,          // { value, unit, width, length, confidence }
    financial: null,     // { budget, monthlyBill, currency, confidence }
    technical: null,     // { tilt, azimuth, orientation, confidence }
  },
  
  // Validated parameters ready for calculator use
  validatedParams: {
    area: null,          // { isValid, value, warnings, suggestions }
    budget: null,        // { isValid, value, warnings, suggestions }
    coordinates: null,   // { isValid, lat, lng, warnings }
    tilt: null,          // { isValid, value, warnings, suggestions }
    azimuth: null,       // { isValid, value, warnings }
  },
  
  // User's primary intent for using the calculator
  // Helps AI tailor responses appropriately
  userIntent: 'planning', // planning | comparing | learning
  
  // Current stage of the conversation flow
  // Guides the interaction and what information to collect next
  conversationStage: 'greeting', // greeting | gathering | calculating | explaining
  
  // Confidence scores for each extracted parameter category
  // Used to determine which parameters need confirmation
  confidence: {
    location: 0,
    area: 0,
    financial: 0,
    technical: 0,
    overall: 0
  },
  
  // Timestamp of last update for session tracking
  lastUpdated: null,
  
  // Session ID for tracking conversation continuity
  sessionId: null,
};

/**
 * Action types for the reducer
 * These define all possible state changes
 */
const ActionTypes = {
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_EXTRACTED_PARAMS: 'UPDATE_EXTRACTED_PARAMS',
  UPDATE_VALIDATED_PARAMS: 'UPDATE_VALIDATED_PARAMS',
  SET_USER_INTENT: 'SET_USER_INTENT',
  SET_CONVERSATION_STAGE: 'SET_CONVERSATION_STAGE',
  UPDATE_CONFIDENCE: 'UPDATE_CONFIDENCE',
  CLEAR_CONVERSATION: 'CLEAR_CONVERSATION',
  RESTORE_STATE: 'RESTORE_STATE',
};

/**
 * Reducer function that handles all state updates
 * Pure function that takes current state and action, returns new state
 * 
 * @param {Object} state - Current conversation state
 * @param {Object} action - Action object with type and payload
 * @returns {Object} New state after applying the action
 */
function conversationReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_MESSAGE:
      // Add a new message to the conversation history
      return {
        ...state,
        messages: [...state.messages, action.payload],
        lastUpdated: Date.now()
      };

    case ActionTypes.UPDATE_EXTRACTED_PARAMS:
      // Update extracted parameters from NLP extraction
      return {
        ...state,
        extractedParams: {
          ...state.extractedParams,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ActionTypes.UPDATE_VALIDATED_PARAMS:
      // Update validated parameters from validation service
      return {
        ...state,
        validatedParams: {
          ...state.validatedParams,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ActionTypes.SET_USER_INTENT:
      // Set the user's primary intent
      return {
        ...state,
        userIntent: action.payload,
        lastUpdated: Date.now()
      };

    case ActionTypes.SET_CONVERSATION_STAGE:
      // Update the current conversation stage
      return {
        ...state,
        conversationStage: action.payload,
        lastUpdated: Date.now()
      };

    case ActionTypes.UPDATE_CONFIDENCE:
      // Update confidence scores for parameters
      return {
        ...state,
        confidence: {
          ...state.confidence,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ActionTypes.CLEAR_CONVERSATION:
      // Reset to initial state with new session ID
      return {
        ...initialState,
        sessionId: generateSessionId(),
        lastUpdated: Date.now()
      };

    case ActionTypes.RESTORE_STATE:
      // Restore state from localStorage
      return {
        ...action.payload,
        lastUpdated: Date.now()
      };

    default:
      // Return current state if action type is unknown
      return state;
  }
}

/**
 * Generate a unique session ID for tracking conversations
 * Format: timestamp-random for uniqueness
 * 
 * @returns {string} Unique session identifier
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load conversation state from localStorage
 * Implements session recovery for better UX
 * 
 * @returns {Object|null} Saved state or null if not found/invalid
 */
function loadStateFromStorage() {
  try {
    // Attempt to retrieve saved state from localStorage
    const savedState = localStorage.getItem(STORAGE_KEY);
    
    if (!savedState) {
      return null;
    }

    // Parse the JSON string to object
    const parsedState = JSON.parse(savedState);
    
    // Check if state is from recent session (within 24 hours)
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = parsedState.lastUpdated && 
                    (Date.now() - parsedState.lastUpdated) < twentyFourHours;
    
    // Return parsed state if it's recent, otherwise return null
    return isRecent ? parsedState : null;
  } catch (error) {
    // If there's an error parsing, log it and return null
    console.error('Error loading conversation state from localStorage:', error);
    return null;
  }
}

/**
 * Save conversation state to localStorage
 * Enables session recovery and persistence
 * 
 * @param {Object} state - Current conversation state to save
 */
function saveStateToStorage(state) {
  try {
    // Convert state object to JSON string and save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // If there's an error (e.g., storage full), log it
    console.error('Error saving conversation state to localStorage:', error);
  }
}

/**
 * Conversation Provider Component
 * Wraps children with conversation context and manages state persistence
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider component with context value
 */
export function ConversationProvider({ children }) {
  // Initialize state with reducer
  // Try to restore from localStorage or use initial state with new session ID
  const [state, dispatch] = useReducer(
    conversationReducer,
    null,
    () => {
      const savedState = loadStateFromStorage();
      if (savedState) {
        return savedState;
      }
      return {
        ...initialState,
        sessionId: generateSessionId()
      };
    }
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Automatically validate parameters when extracted parameters change
  useEffect(() => {
    // Only validate if we have extracted parameters
    const hasExtractedParams = state.extractedParams.location || 
                              state.extractedParams.area || 
                              state.extractedParams.financial || 
                              state.extractedParams.technical;
    
    if (hasExtractedParams) {
      validateExtractedParams();
    }
  }, [state.extractedParams]);

  // Clear conversation data on user logout
  // Listen for custom logout event
  useEffect(() => {
    const handleLogout = () => {
      dispatch({ type: ActionTypes.CLEAR_CONVERSATION });
      localStorage.removeItem(STORAGE_KEY);
    };

    // Add event listener for logout events
    window.addEventListener('user_logout', handleLogout);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('user_logout', handleLogout);
    };
  }, []);

  /**
   * Add a new message to the conversation
   * 
   * @param {Object} message - Message object to add
   * @param {string} message.role - Message role (user | assistant | system)
   * @param {string} message.content - Message text content
   * @param {number} [message.timestamp] - Message timestamp (auto-generated if not provided)
   */
  const addMessage = (message) => {
    // Ensure message has required fields
    const messageWithDefaults = {
      ...message,
      timestamp: message.timestamp || Date.now(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    dispatch({
      type: ActionTypes.ADD_MESSAGE,
      payload: messageWithDefaults
    });
  };

  /**
   * Update extracted parameters from user messages
   * Merges new parameters with existing ones
   * 
   * @param {Object} params - Extracted parameters to update
   */
  const updateExtractedParams = (params) => {
    dispatch({
      type: ActionTypes.UPDATE_EXTRACTED_PARAMS,
      payload: params
    });
    
    // Update confidence scores from extraction
    if (params.location || params.area || params.financial || params.technical) {
      const newConfidence = {
        location: params.location?.confidence || state.confidence.location,
        area: params.area?.confidence || state.confidence.area,
        financial: params.financial?.confidence || state.confidence.financial,
        technical: params.technical?.confidence || state.confidence.technical,
      };
      
      // Calculate overall confidence as average of all categories
      const confidenceValues = Object.values(newConfidence);
      const overall = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
      
      dispatch({
        type: ActionTypes.UPDATE_CONFIDENCE,
        payload: { ...newConfidence, overall }
      });
    }
  };

  /**
   * Validate all extracted parameters
   * Runs validation service on current extracted parameters
   * Updates validatedParams state with results
   * 
   * @returns {Object} Validation results
   */
  const validateExtractedParams = () => {
    // Prepare parameters for validation
    const paramsToValidate = {
      area: state.extractedParams.area?.value,
      budget: state.extractedParams.financial?.budget,
      monthlyBill: state.extractedParams.financial?.monthlyBill,
      lat: state.extractedParams.location?.lat,
      lng: state.extractedParams.location?.lng,
      tilt: state.extractedParams.technical?.tilt,
      azimuth: state.extractedParams.technical?.azimuth,
    };

    // Run validation service
    const validationResult = validateAll(paramsToValidate);
    
    // Update validated parameters in state
    dispatch({
      type: ActionTypes.UPDATE_VALIDATED_PARAMS,
      payload: {
        area: validationResult.area,
        budget: validationResult.budget,
        coordinates: validationResult.coordinates,
        tilt: validationResult.tilt,
        azimuth: validationResult.azimuth,
      }
    });

    return validationResult;
  };

  /**
   * Set the user's primary intent for using the calculator
   * 
   * @param {string} intent - User intent (planning | comparing | learning)
   */
  const setUserIntent = (intent) => {
    dispatch({
      type: ActionTypes.SET_USER_INTENT,
      payload: intent
    });
  };

  /**
   * Set the current conversation stage
   * 
   * @param {string} stage - Conversation stage (greeting | gathering | calculating | explaining)
   */
  const setConversationStage = (stage) => {
    dispatch({
      type: ActionTypes.SET_CONVERSATION_STAGE,
      payload: stage
    });
  };

  /**
   * Clear the entire conversation and start fresh
   * Creates a new session ID and resets to initial state
   */
  const clearConversation = () => {
    dispatch({ type: ActionTypes.CLEAR_CONVERSATION });
  };

  /**
   * Export conversation data for download or sharing
   * Formats the conversation in a readable format
   * 
   * @returns {Object} Exported conversation data with metadata
   */
  const exportConversationData = () => {
    return {
      sessionId: state.sessionId,
      exportedAt: new Date().toISOString(),
      conversationStage: state.conversationStage,
      userIntent: state.userIntent,
      messageCount: state.messages.length,
      messages: state.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString()
      })),
      extractedParameters: {
        location: state.extractedParams.location,
        area: state.extractedParams.area,
        financial: state.extractedParams.financial,
        technical: state.extractedParams.technical,
      },
      validationResults: state.validatedParams,
      confidenceScores: state.confidence,
    };
  };

  // Create context value object with state and actions
  const contextValue = {
    // State
    messages: state.messages,
    extractedParams: state.extractedParams,
    validatedParams: state.validatedParams,
    userIntent: state.userIntent,
    conversationStage: state.conversationStage,
    confidence: state.confidence,
    sessionId: state.sessionId,
    lastUpdated: state.lastUpdated,
    
    // Actions
    addMessage,
    updateExtractedParams,
    validateExtractedParams,
    setUserIntent,
    setConversationStage,
    clearConversation,
    exportConversationData,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}

/**
 * Custom hook to use conversation context
 * Provides easy access to conversation state and actions
 * 
 * @throws {Error} If used outside of ConversationProvider
 * @returns {Object} Conversation context value
 * 
 * @example
 * const { messages, addMessage, extractedParams } = useConversation();
 */
export function useConversation() {
  const context = useContext(ConversationContext);
  
  // Ensure hook is used within provider
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  
  return context;
}

// Export context for advanced use cases
export default ConversationContext;

