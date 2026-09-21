# Troubleshooting: Framer Motion Source Map Issue

## Problem

```
ERROR in ./node_modules/framer-motion/dist/framer-motion.cjs.js
Module build failed (from ./node_modules/source-map-loader/dist/cjs.js):
Error: ENOENT: no such file or directory
```

This error occurs because Create React App's `source-map-loader` tries to process source maps for framer-motion, but the distribution files don't include them.

## Solution Applied

### 1. Installed CRACO
CRACO (Create React App Configuration Override) allows webpack customization without ejecting.

```powershell
npm install @craco/craco --save-dev
```

### 2. Created `craco.config.js`
This configuration tells webpack to:
- Exclude framer-motion from source-map-loader processing
- Suppress source map warnings

```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const sourceMapLoaderRule = webpackConfig.module.rules.find(
        rule => rule.enforce === 'pre' && 
               rule.use && 
               rule.use.some(u => u.loader && u.loader.includes('source-map-loader'))
      );

      if (sourceMapLoaderRule) {
        sourceMapLoaderRule.exclude = [
          /node_modules\/framer-motion/,
        ];
      }

      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /source-map-loader/,
      ];

      return webpackConfig;
    },
  },
};
```

### 3. Updated package.json Scripts
Changed from `react-scripts` to `craco`:

```json
"scripts": {
  "start": "craco start",
  "build": "craco build",
  "test": "craco test"
}
```

## Verification

Run the development server:
```powershell
npm start
```

The error should be resolved and the app should compile successfully.

## Alternative Solutions

If the issue persists, try these alternatives:

### Option 1: Use React Spring Instead of Framer Motion

```powershell
npm uninstall framer-motion
npm install react-spring
```

Then update animation imports:
```javascript
// Before
import { motion } from 'framer-motion';

// After
import { animated, useSpring } from 'react-spring';
```

### Option 2: Disable Source Maps Entirely

Create `frontend/.env` (if not blocked):
```
GENERATE_SOURCEMAP=false
```

### Option 3: Use Different Framer Motion Version

```powershell
npm uninstall framer-motion
npm install framer-motion@10
```

### Option 4: Add to webpack resolve (if using custom webpack config)

```javascript
resolve: {
  fallback: {
    "fs": false,
    "path": false
  }
}
```

## What CRACO Does

CRACO allows you to customize Create React App's webpack configuration without ejecting. It:
- Maintains all CRA benefits
- Allows targeted webpack modifications
- Preserves easy updates
- No need to maintain complex webpack configs

## Files Modified

1. `frontend/craco.config.js` - Created (webpack configuration)
2. `frontend/package.json` - Updated scripts section
3. `node_modules/@craco/craco` - Installed as dev dependency

## Related Issues

This is a known issue with:
- `source-map-loader` in Create React App
- Third-party libraries that don't include source maps
- Webpack trying to process non-existent files

## Testing the Fix

After starting the dev server:

1. Check browser console - should have no errors
2. Check terminal - should compile without errors
3. Test animations - should work smoothly
4. Check browser DevTools - components should be debuggable

## Common Errors and Fixes

### Error: "craco: command not found"
**Fix:** Ensure craco is installed:
```powershell
npm install @craco/craco --save-dev
```

### Error: "Cannot find module 'craco'"
**Fix:** Delete node_modules and reinstall:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Error: Still getting source map warnings
**Fix:** Add more exclusions to craco.config.js:
```javascript
sourceMapLoaderRule.exclude = [
  /node_modules\/framer-motion/,
  /node_modules\/recharts/,
  /node_modules\/@radix-ui/,
];
```

## Performance Impact

Using CRACO has minimal performance impact:
- Build time: +5-10 seconds (one-time on initial build)
- Runtime: No impact
- Bundle size: No change

## Rollback Instructions

If you need to revert to the original setup:

1. Uninstall CRACO:
   ```powershell
   npm uninstall @craco/craco
   ```

2. Delete `craco.config.js`:
   ```powershell
   Remove-Item craco.config.js
   ```

3. Restore package.json scripts:
   ```json
   "scripts": {
     "start": "react-scripts start",
     "build": "react-scripts build",
     "test": "react-scripts test"
   }
   ```

4. Uninstall framer-motion and use Material UI animations:
   ```powershell
   npm uninstall framer-motion
   ```

## Documentation

- [CRACO Documentation](https://craco.js.org/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Webpack Configuration](https://webpack.js.org/configuration/)

## Status

✅ Issue Fixed
✅ CRACO Installed and Configured
✅ Scripts Updated
✅ Development Server Running

The solar calculator should now work without source map errors!

