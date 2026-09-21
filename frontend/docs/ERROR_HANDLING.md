# Error Handling System

This document describes the comprehensive error handling system implemented in the ArecGIS frontend application.

## Overview

The error handling system consists of multiple layers to catch and handle errors gracefully:

1. **ErrorBoundary** - Catches React component errors
2. **FeatureErrorBoundary** - Catches errors in specific features
3. **useErrorHandler** - Hook for handling async errors
4. **Error Utilities** - Helper functions for consistent error handling

## Components

### 1. ErrorBoundary

The main error boundary that wraps the entire application. Catches any unhandled React errors and displays a user-friendly fallback UI.

**Usage:**
```jsx
// Already implemented in App.js
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

**Features:**
- Catches all React errors
- Displays user-friendly error message
- Provides retry functionality
- Logs errors for debugging
- Generates unique error IDs for tracking

### 2. FeatureErrorBoundary

A specialized error boundary for specific features or components. Provides more targeted error handling.

**Usage:**
```jsx
import FeatureErrorBoundary from '../../components/FeatureErrorBoundary';

<FeatureErrorBoundary featureName="Inventory Form">
  <NewInventoryForm allUsers={allUsers} />
</FeatureErrorBoundary>
```

**Props:**
- `featureName` - Name of the feature for error messages
- `fallback` - Custom fallback UI function (optional)

**Custom Fallback Example:**
```jsx
<FeatureErrorBoundary 
  featureName="Map"
  fallback={(error, retry) => (
    <div>
      <p>Map failed to load: {error.message}</p>
      <button onClick={retry}>Reload Map</button>
    </div>
  )}
>
  <LeafletMap />
</FeatureErrorBoundary>
```

### 3. useErrorHandler Hook

A custom hook for managing error state in functional components, especially useful for async operations.

**Usage:**
```jsx
import { useErrorHandler } from '../../hooks/useErrorHandler';

const MyComponent = () => {
  const { error, isError, handleError, clearError, retry } = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
      // Handle success
    } catch (err) {
      handleError(err);
    }
  };

  if (isError) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => retry(fetchData)}>Retry</button>
        <button onClick={clearError}>Dismiss</button>
      </div>
    );
  }

  return <div>Your component content</div>;
};
```

## Error Utilities

### formatErrorMessage(error)

Converts any error object into a user-friendly message.

```jsx
import { formatErrorMessage } from '../../utils/errorUtils';

const message = formatErrorMessage(error);
// Returns user-friendly error message
```

### handleApiError(error, onError)

Handles API errors consistently across the application.

```jsx
import { handleApiError } from '../../utils/errorUtils';

try {
  const data = await api.getData();
} catch (error) {
  handleApiError(error, (errorObj) => {
    // Custom error handling
    setErrorMessage(errorObj.message);
  });
}
```

### withRetry(operation, maxRetries, delay)

Automatically retries failed operations with exponential backoff.

```jsx
import { withRetry } from '../../utils/errorUtils';

const fetchDataWithRetry = () => withRetry(
  () => api.getData(),
  3, // max retries
  1000 // base delay in ms
);

try {
  const data = await fetchDataWithRetry();
} catch (error) {
  // All retries failed
  handleError(error);
}
```

## Best Practices

### 1. Wrap Critical Components

Always wrap critical components with appropriate error boundaries:

```jsx
// For the entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// For specific features
<FeatureErrorBoundary featureName="Data Table">
  <DataTable />
</FeatureErrorBoundary>
```

### 2. Handle Async Errors

Use the `useErrorHandler` hook for async operations:

```jsx
const { error, isError, handleError, retry } = useErrorHandler();

const submitForm = async (formData) => {
  try {
    await api.submitForm(formData);
    // Success handling
  } catch (err) {
    handleError(err);
  }
};
```

### 3. Provide User-Friendly Messages

Always provide clear, actionable error messages:

```jsx
// Good
"Failed to load inventory data. Please check your connection and try again."

// Bad
"Error: TypeError: Cannot read property 'data' of undefined"
```

### 4. Log Errors Appropriately

Use the error utilities for consistent logging:

```jsx
import { logError } from '../../utils/errorUtils';

try {
  // Your code
} catch (error) {
  logError(error, 'ComponentName');
  // Handle error
}
```

## Error Reporting

In production, errors are automatically logged with:
- Error message and stack trace
- Component context
- Timestamp
- User agent
- Current URL
- Unique error ID

## Future Enhancements

1. **Sentry Integration** - Real-time error tracking
2. **Error Analytics** - Error frequency and impact analysis
3. **Automatic Error Reporting** - Send errors to backend for analysis
4. **Performance Monitoring** - Track error impact on user experience

## Troubleshooting

### Common Issues

1. **Error boundaries not catching errors**
   - Ensure error boundaries are properly nested
   - Check that errors are thrown in React components

2. **Async errors not handled**
   - Use `useErrorHandler` hook for async operations
   - Wrap async calls in try-catch blocks

3. **Error messages not user-friendly**
   - Use `formatErrorMessage` utility
   - Provide context-specific error messages

### Debug Mode

In development mode, error boundaries show detailed error information including:
- Full error stack trace
- Component stack
- Error details for debugging

This information is automatically hidden in production builds.
