# Map Caching System

## Overview

The Map Caching System automatically saves and restores the user's map state, including position, zoom level, filter settings, and layer preferences. This provides a seamless user experience by remembering where users left off when they return to the map dashboard.

## Features

### 🚀 **Automatic State Persistence**
- **Map Position**: Saves center coordinates and zoom level
- **Filter Settings**: Remembers all active filters (region, RE class, status, etc.)
- **Layer Preferences**: Stores selected base layers and overlays
- **User-Specific**: Each user has their own cached state

### 💾 **Smart Caching Strategy**
- **Local Storage**: Uses browser localStorage for persistence
- **Authentication-Aware**: Only caches data for authenticated users
- **Automatic Cleanup**: Clears cache when user logs out
- **Data Validation**: Ensures cached data is valid before restoration

### 🔄 **Real-Time Updates**
- **Live Tracking**: Automatically saves changes as user interacts with map
- **Event-Driven**: Responds to map movement, zoom, and filter changes
- **Performance Optimized**: Minimal impact on map performance

## Architecture

### Components

#### 1. **MapCacheContext** (`contexts/MapCacheContext.js`)
- **Purpose**: Central state management for map caching
- **Features**: 
  - Automatic localStorage persistence
  - Authentication state monitoring
  - Cache validation and cleanup
  - State update functions

#### 2. **useMapCacheEvents** (`hooks/useMapCacheEvents.js`)
- **Purpose**: Handles map events and automatic caching
- **Features**:
  - Map movement and zoom event listeners
  - Automatic state updates
  - Smooth restoration of cached state

#### 3. **useFilterCacheSync** (`hooks/useFilterCacheSync.js`)
- **Purpose**: Synchronizes filter settings with map cache
- **Features**:
  - Real-time filter state tracking
  - Automatic cache updates
  - Bidirectional sync

#### 4. **MapCacheManager** (`components/MapCacheManager.js`)
- **Purpose**: User interface for cache management
- **Features**:
  - Cache statistics display
  - Manual cache operations
  - User guidance and tips

### Data Structure

```javascript
{
  center: [latitude, longitude],        // Map center coordinates
  zoom: number,                         // Zoom level (1-18)
  bounds: object,                       // Map viewport bounds
  selectedLayers: {
    baseLayer: string,                  // Selected base layer name
    overlays: string[]                  // Active overlay names
  },
  filterSettings: {
    region: string,                     // Search query/region
    reClass: string,                    // RE classification
    reCat: string,                      // RE category filter
    status: string[],                   // Status filters
    ownUse: string[],                   // Own use filters
    netMetered: string[],              // Net metering filters
    fitPhase: string[]                  // FIT phase filters
  },
  lastView: timestamp                   // Last update timestamp
}
```

## Usage

### For Users

#### **Automatic Behavior**
1. **First Visit**: Map starts with default view (Philippines, zoom 5)
2. **Interaction**: All map changes are automatically saved
3. **Return Visit**: Map automatically restores to last position and settings
4. **Logout**: Cache is automatically cleared for security

#### **Manual Controls**
- **Cache Manager**: Floating button (bottom-right) to access cache controls
- **Reset View**: Return to default map position
- **Clear Cache**: Remove all cached data
- **View Stats**: See cache size and last update time

### For Developers

#### **Integration**
```javascript
import { useMapCache } from '../contexts/MapCacheContext';
import { useMapCacheEvents } from '../hooks/useMapCacheEvents';

const MyMapComponent = () => {
  const { mapCache, updateMapView } = useMapCache();
  const { restoreCachedState } = useMapCacheEvents();
  
  // Use cached values
  const center = mapCache.center;
  const zoom = mapCache.zoom;
  
  // Update cache
  updateMapView(newCenter, newZoom);
};
```

#### **Customization**
```javascript
// Add custom cache properties
const customCache = {
  ...mapCache,
  customProperty: 'value'
};

// Extend cache context
const extendedContext = {
  ...useMapCache(),
  customFunction: () => {}
};
```

## Implementation Details

### **Performance Considerations**
- **Debounced Updates**: Map events are debounced to prevent excessive saves
- **Selective Caching**: Only essential data is cached
- **Lazy Loading**: Cache is loaded only when needed
- **Memory Management**: Automatic cleanup of invalid data

### **Security Features**
- **User Isolation**: Each user has separate cache
- **Session-Based**: Cache is tied to authentication token
- **Automatic Cleanup**: Cache is cleared on logout
- **Data Validation**: Cached data is validated before use

### **Error Handling**
- **Graceful Degradation**: Falls back to defaults if cache is corrupted
- **Validation**: Ensures cached coordinates are valid
- **Recovery**: Automatically repairs minor cache issues
- **Logging**: Development-only error logging

## Configuration

### **Environment Variables**
```bash
# Optional: Customize cache behavior
REACT_APP_MAP_CACHE_ENABLED=true
REACT_APP_MAP_CACHE_TTL=86400000  # 24 hours in milliseconds
```

### **Default Settings**
```javascript
const DEFAULT_CACHE_CONFIG = {
  center: [12.512797, 122.395164],  // Philippines center
  zoom: 5,                           // Default zoom level
  maxCacheSize: 1024 * 1024,        // 1MB max cache size
  autoSaveInterval: 1000,           // 1 second auto-save
  enableCompression: false          // Disabled for simplicity
};
```

## Troubleshooting

### **Common Issues**

#### **Map Not Restoring Position**
- Check if user is authenticated
- Verify localStorage is enabled
- Check browser console for errors
- Try clearing and recreating cache

#### **Cache Not Updating**
- Ensure MapCacheProvider is wrapping components
- Check if useMapCache hook is properly imported
- Verify event listeners are attached
- Check authentication state

#### **Performance Issues**
- Monitor cache size in MapCacheManager
- Clear cache if it becomes too large
- Check for excessive cache updates
- Verify debouncing is working

### **Debug Mode**
```javascript
// Enable debug logging (development only)
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Map cache updated:', mapCache);
  console.log('Cache stats:', getCacheStats());
}
```

## Future Enhancements

### **Planned Features**
- **Server-Side Caching**: Sync cache across devices
- **Compression**: Reduce localStorage usage
- **Advanced Filters**: Cache more complex filter combinations
- **User Preferences**: Allow users to customize caching behavior
- **Analytics**: Track cache usage patterns

### **Integration Opportunities**
- **Offline Support**: Cache map tiles for offline use
- **Collaborative Features**: Share map views between users
- **Export/Import**: Allow users to backup/restore cache
- **Smart Defaults**: Learn user preferences over time

## Contributing

When modifying the map caching system:

1. **Maintain Backward Compatibility**: Don't break existing cached data
2. **Add Validation**: Validate new cache properties
3. **Update Documentation**: Document new features and changes
4. **Test Thoroughly**: Test with various map states and user scenarios
5. **Performance Impact**: Ensure changes don't degrade map performance

## Support

For issues or questions about the map caching system:

1. Check this documentation
2. Review browser console for errors
3. Verify authentication state
4. Test with a fresh browser session
5. Contact the development team
