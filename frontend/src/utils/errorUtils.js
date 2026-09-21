// Global error handling utilities

/**
 * Formats error messages for user display
 * @param {Error|string} error - The error object or message
 * @returns {string} - User-friendly error message
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.data?.message) {
    return error.data.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Determines if an error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} - Whether the error can be retried
 */
export const isRetryableError = (error) => {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const retryableMessages = ['timeout', 'network', 'connection'];
  
  // Check status code
  if (error?.response?.status && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }
  
  // Check error message
  const message = error?.message?.toLowerCase() || '';
  return retryableMessages.some(keyword => message.includes(keyword));
};

/**
 * Creates a standardized error object
 * @param {Error|string} error - The original error
 * @param {string} context - Where the error occurred
 * @returns {Object} - Standardized error object
 */
export const createErrorObject = (error, context = '') => {
  return {
    message: formatErrorMessage(error),
    originalError: error,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    isRetryable: isRetryableError(error)
  };
};

/**
 * Logs error to console with consistent format
 * @param {Error|Object} error - The error to log
 * @param {string} component - Component where error occurred
 */
export const logError = (error, component = '') => {
  const errorObj = createErrorObject(error, component);
  
  console.group(`🚨 Error in ${component || 'Unknown Component'}`);
  console.error('Error Details:', errorObj);
  console.error('Original Error:', error);
  console.groupEnd();
  
  return errorObj;
};

/**
 * Handles API errors consistently
 * @param {Error} error - The API error
 * @param {Function} onError - Callback for error handling
 */
export const handleApiError = (error, onError) => {
  const errorObj = createErrorObject(error, 'API');
  
  if (onError && typeof onError === 'function') {
    onError(errorObj);
  }
  
  // Report to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    try {
      // Lazy import to avoid circular deps
      const { reportError } = require('../lib/monitoring');
      reportError(error, { source: 'API', context: errorObj });
    } catch (_) {
      // no-op
    }
  }
  
  return errorObj;
};

/**
 * Creates a retry mechanism for failed operations
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Promise that resolves with operation result
 */
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

export default {
  formatErrorMessage,
  isRetryableError,
  createErrorObject,
  logError,
  handleApiError,
  withRetry
};
