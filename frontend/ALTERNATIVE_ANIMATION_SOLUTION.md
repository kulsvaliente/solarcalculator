# Alternative Animation Solutions

If framer-motion continues to cause source map issues, here are proven alternatives:

## Option 1: Use CSS Animations Only (Simplest)

Replace framer-motion with pure CSS animations using Tailwind's animation utilities.

### Example Conversion:

**Before (Framer Motion):**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**After (CSS/Tailwind):**
```jsx
<div className="animate-fade-in">
  Content
</div>
```

### Steps:
1. Keep the Tailwind animations already defined in `tailwind.config.js`
2. Remove framer-motion imports
3. Replace `motion.div` with regular `div` elements
4. Add Tailwind animation classes

### Pros:
- No build errors
- Better performance
- Smaller bundle size
- No additional dependencies

### Cons:
- Less control over animation timing
- No gesture animations (drag, etc.)
- More manual CSS work

## Option 2: Use React Spring (Recommended Alternative)

React Spring is a physics-based animation library with better CRA compatibility.

### Installation:
```powershell
npm uninstall framer-motion
npm install react-spring
```

### Example Conversion:

**Before (Framer Motion):**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  Content
</motion.div>
```

**After (React Spring):**
```jsx
import { useSpring, animated } from 'react-spring';

const props = useSpring({ opacity: 1, from: { opacity: 0 } });

<animated.div style={props}>
  Content
</animated.div>
```

### Pros:
- No source map issues
- Physics-based animations feel natural
- Good performance
- Active maintenance

### Cons:
- Different API to learn
- Requires component refactoring

## Option 3: Suppress the Error and Continue

If the app works despite the error, you can suppress it:

### Update `craco.config.js`:
```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Completely ignore framer-motion source map errors
      webpackConfig.stats = {
        ...webpackConfig.stats,
        errorDetails: false,
        errors: false,
        warnings: false,
      };
      
      return webpackConfig;
    },
  },
};
```

### Pros:
- Keep framer-motion
- Quick fix
- All features work

### Cons:
- Hides all errors (not just framer-motion)
- Makes debugging harder

## Option 4: Use Material UI's Built-in Animations

Since you're already using MUI, use their animation components:

### Installation:
Already installed with `@mui/material`

### Example:
```jsx
import { Fade, Slide, Grow } from '@mui/material';

<Fade in timeout={500}>
  <div>Content</div>
</Fade>

<Slide direction="up" in timeout={500}>
  <div>Content</div>
</Slide>
```

### Pros:
- Already in your dependencies
- Consistent with MUI design
- No additional bundle size
- Works perfectly with CRA

### Cons:
- Limited animation types
- Less flexible than framer-motion
- Tied to MUI ecosystem

## Option 5: Downgrade to Framer Motion v10

Version 10 has better CRA compatibility:

```powershell
npm uninstall framer-motion
npm install framer-motion@^10.18.0
```

### Pros:
- Keep all your current code
- Proven to work with CRA
- All features available

### Cons:
- Missing latest features
- Still might have warnings

## Recommended Approach

Given your current situation, I recommend:

### For Production (Best Practice):
**Use Material UI Animations** - Since you're already using MUI, this is the cleanest solution with zero additional dependencies.

### For Development (Keep Current Work):
**Suppress the error** - The CRACO config we created should handle this, but if not, use Option 3 to suppress webpack stats.

### For Best Performance:
**Use CSS Animations** - Pure CSS with Tailwind's utilities is the fastest and most reliable.

## Quick Migration Guide for Each Component

### HeroSummaryCard
```jsx
// Replace motion.div with Fade
import { Fade } from '@mui/material';

<Fade in timeout={500}>
  <Card>...</Card>
</Fade>
```

### SystemComparisonCards
```jsx
// Use Grow for scale effect
import { Grow } from '@mui/material';

<Grow in timeout={300}>
  <Card>...</Card>
</Grow>
```

### MonthlyEnergyChart
```jsx
// Use Slide for enter animation
import { Slide } from '@mui/material';

<Slide direction="up" in timeout={500}>
  <Card>...</Card>
</Slide>
```

## Testing Your Choice

After implementing any alternative:

1. **Check bundle size:**
   ```powershell
   npm run build
   ```
   Look at the stats output

2. **Test animations:**
   - Smooth transitions
   - No jank or lag
   - Works on mobile

3. **Check console:**
   - No errors
   - No warnings
   - Clean output

## Conclusion

The CRACO solution should work, but if you encounter any issues:

1. Try **MUI animations first** (easiest, already installed)
2. If you need more control, try **React Spring**
3. For maximum performance, use **CSS animations**
4. As last resort, **suppress the error**

All options maintain the visual design and user experience of the enhanced calculator!

