# Scenario Simulator Guide
## Interactive What-If Analysis for Solar Calculator

**Component:** `ScenarioSimulator.jsx`  
**Phase:** 4 - Step 3  
**Status:** ✅ Implemented  
**Purpose:** Allow users to explore different solar system configurations interactively

---

## 📋 Overview

The **ScenarioSimulator** is an interactive component that lets users experiment with different solar system parameters in real-time. Users can adjust sliders to see how changes in roof area, budget, tilt angle, and panel size affect system performance, savings, and ROI.

### Key Features:
- ✅ Interactive sliders for 4 key parameters
- ✅ Real-time calculation with debouncing
- ✅ Visual comparison with current configuration
- ✅ AI-powered analysis of changes
- ✅ Trend indicators (better/worse/same)
- ✅ Apply or reset functionality

---

## 🎯 User Experience

### What Users See:
1. **Interactive Sliders:**
   - Roof Area (10-200 sqm)
   - Budget (₱50k-500k)
   - Tilt Angle (0-45°)
   - Panel Size (0.5-0.7 kWp)

2. **Real-Time Results:**
   - System Capacity
   - Annual Savings
   - Payback Period
   - ROI

3. **Comparison Indicators:**
   - ↑ Green: Improved
   - ↓ Red: Decreased
   - ≈ Gray: No change
   - Percentage difference shown

4. **AI Analysis:**
   - Explains the impact of changes
   - Suggests optimizations
   - Warns about suboptimal configurations

---

## 🔧 Integration

### Basic Integration:

```javascript
import ScenarioSimulator from './components/ScenarioSimulator';

// In your Calculator component:
<ScenarioSimulator
  baseParameters={{
    area: 50,
    budget: 200000,
    tilt: 15,
    panelSize: 0.6
  }}
  baseResults={{
    capacity: 28.5,
    annualSavings: 45000,
    paybackPeriod: 6.5,
    roi: 287
  }}
  onCalculate={handleCalculateScenario}
  onApply={handleApplyScenario}
/>
```

### Full Integration Example:

```javascript
import React, { useState } from 'react';
import Calculator from './Calculator';
import ScenarioSimulator from './ScenarioSimulator';

const SolarCalculatorPage = () => {
  const [parameters, setParameters] = useState({
    area: 50,
    budget: 200000,
    tilt: 15,
    panelSize: 0.6,
    latitude: 14.5995,
    longitude: 120.9842,
    azimuth: 180,
    rate: 10
  });

  const [results, setResults] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);

  // Your existing calculation function
  const handleCalculate = (params) => {
    // Call your calculation logic here
    const calculatedResults = performSolarCalculation(params);
    setResults(calculatedResults);
    setShowSimulator(true);  // Show simulator after first calculation
    return calculatedResults;
  };

  // Handle scenario calculation
  const handleCalculateScenario = (newParams) => {
    return performSolarCalculation({
      ...parameters,
      ...newParams
    });
  };

  // Apply simulated configuration
  const handleApplyScenario = (simulatedParams) => {
    setParameters(prev => ({
      ...prev,
      ...simulatedParams
    }));
    
    // Recalculate with new parameters
    const newResults = handleCalculateScenario(simulatedParams);
    setResults(newResults);
    
    // Optional: Show notification
    alert('Configuration applied! Recalculating...');
  };

  return (
    <div>
      <Calculator
        parameters={parameters}
        onCalculate={handleCalculate}
      />
      
      {showSimulator && results && (
        <ScenarioSimulator
          baseParameters={parameters}
          baseResults={results}
          onCalculate={handleCalculateScenario}
          onApply={handleApplyScenario}
        />
      )}
    </div>
  );
};
```

---

## 📝 Props API

### `baseParameters` (Object, Required)

The current calculator parameters. Should include:

```javascript
{
  area: number,        // Roof area in sqm (required)
  budget: number,      // Budget in PHP (optional, default: 200000)
  tilt: number,        // Tilt angle in degrees (required)
  panelSize: number,   // Panel size in kWp (required)
  
  // Optional (for calculations):
  latitude: number,    // Location latitude
  longitude: number,   // Location longitude
  azimuth: number,     // Azimuth angle
  rate: number        // Electricity rate
}
```

### `baseResults` (Object, Required)

The current calculation results. Should include:

```javascript
{
  capacity: number,         // System capacity in kW
  annualSavings: number,    // Annual savings in PHP
  annualProduction: number, // Annual production in kWh (optional)
  paybackPeriod: number,    // Payback period in years
  roi: number,              // ROI percentage (25 years)
  panelCount: number        // Number of panels (optional)
}
```

### `onCalculate` (Function, Required)

Function to perform calculations with new parameters.

**Signature:**
```javascript
(newParameters: Object) => calculationResults: Object
```

**Example:**
```javascript
const handleCalculateScenario = (newParams) => {
  // Merge with existing parameters
  const fullParams = {
    ...currentParameters,
    ...newParams
  };
  
  // Perform calculation using your existing logic
  return performSolarCalculation(fullParams);
};
```

### `onApply` (Function, Required)

Function called when user applies the simulated configuration.

**Signature:**
```javascript
(simulatedParameters: Object) => void
```

**Example:**
```javascript
const handleApplyScenario = (simulatedParams) => {
  // Update main calculator state
  setParameters(prev => ({
    ...prev,
    ...simulatedParams
  }));
  
  // Recalculate
  const newResults = performSolarCalculation({
    ...parameters,
    ...simulatedParams
  });
  setResults(newResults);
  
  // Optional: Provide feedback
  showNotification('Configuration applied successfully!');
};
```

---

## 🎨 Customization

### Styling

The component uses Material-UI's `sx` prop for styling. You can override styles:

```javascript
<ScenarioSimulator
  baseParameters={params}
  baseResults={results}
  onCalculate={handleCalc}
  onApply={handleApply}
  sx={{
    mt: 4,                    // Margin top
    border: '2px solid blue', // Custom border
    boxShadow: 3              // Custom shadow
  }}
/>
```

### Slider Ranges

Modify slider ranges in the component:

```javascript
// In ScenarioSimulator.jsx:

// Area Slider
<Slider
  min={10}    // Minimum: 10 sqm
  max={200}   // Maximum: 200 sqm
  step={5}    // Step: 5 sqm
/>

// Budget Slider
<Slider
  min={50000}   // Minimum: ₱50,000
  max={500000}  // Maximum: ₱500,000
  step={10000}  // Step: ₱10,000
/>
```

---

## 🧪 Testing

### Manual Testing:

1. **Load the component:**
   ```bash
   npm start
   # Navigate to calculator page
   ```

2. **Test each slider:**
   - Move Area slider → Check capacity changes
   - Move Budget slider → Check system type changes
   - Move Tilt slider → Check efficiency indicator
   - Move Panel Size slider → Check panel count

3. **Verify calculations:**
   - Adjust Area to 100 sqm
   - Expected: Capacity should roughly double
   - Expected: Annual savings should increase
   - Expected: Trend indicators show changes

4. **Test Apply button:**
   - Change multiple parameters
   - Click "Apply This Configuration"
   - Verify main calculator updates
   - Verify results recalculate

5. **Test Reset button:**
   - Change parameters
   - Click "Reset to Original"
   - Verify sliders return to base values

### Automated Testing:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ScenarioSimulator from './ScenarioSimulator';

test('displays current parameters', () => {
  render(
    <ScenarioSimulator
      baseParameters={{ area: 50, budget: 200000, tilt: 15, panelSize: 0.6 }}
      baseResults={{ capacity: 28.5, annualSavings: 45000 }}
      onCalculate={jest.fn()}
      onApply={jest.fn()}
    />
  );
  
  expect(screen.getByText(/50 sqm/)).toBeInTheDocument();
  expect(screen.getByText(/₱200,000/)).toBeInTheDocument();
});

test('calls onApply when Apply button clicked', () => {
  const mockApply = jest.fn();
  
  render(
    <ScenarioSimulator
      baseParameters={{ area: 50, budget: 200000, tilt: 15, panelSize: 0.6 }}
      baseResults={{ capacity: 28.5, annualSavings: 45000 }}
      onCalculate={jest.fn()}
      onApply={mockApply}
    />
  );
  
  // Change a slider
  const areaSlider = screen.getByRole('slider', { name: /area/i });
  fireEvent.change(areaSlider, { target: { value: 75 } });
  
  // Click apply
  fireEvent.click(screen.getByText('Apply This Configuration'));
  
  expect(mockApply).toHaveBeenCalledWith({
    area: 75,
    budget: 200000,
    tilt: 15,
    panelSize: 0.6
  });
});
```

---

## 📊 Calculation Logic

### Built-in Calculations:

The component includes helper functions for:

1. **System Capacity:**
   ```javascript
   capacity = area * 0.6 * 0.95
   // 60% utilization, 5% system losses
   ```

2. **Panel Count:**
   ```javascript
   panels = Math.floor(capacity / panelSize)
   ```

3. **Tilt Efficiency:**
   ```javascript
   optimal = 15°  // For Philippines
   efficiency = 100 - deviation * factor
   // Optimal range: 10-20°
   ```

4. **Impact Calculation:**
   ```javascript
   impact = ((newValue - oldValue) / oldValue) * 100
   ```

### Connect Your Own Calculations:

The component calls your `onCalculate` function for actual results:

```javascript
const handleCalculateScenario = (newParams) => {
  // Use your existing calculation service
  return {
    capacity: calculateCapacity(newParams),
    annualSavings: calculateSavings(newParams),
    annualProduction: calculateProduction(newParams),
    paybackPeriod: calculatePayback(newParams),
    roi: calculateROI(newParams)
  };
};
```

---

## 🎓 Advanced Usage

### Add More Sliders:

```javascript
// In ScenarioSimulator.jsx:

<Grid item xs={12} md={6}>
  <Typography variant="subtitle2" gutterBottom>
    Electricity Rate: ₱{simulatedRate}/kWh
  </Typography>
  <Slider
    value={simulatedRate}
    onChange={(e, value) => setSimulatedRate(value)}
    min={5}
    max={20}
    step={0.5}
  />
</Grid>
```

### Save Scenarios:

```javascript
const [savedScenarios, setSavedScenarios] = useState([]);

const handleSaveScenario = () => {
  const scenario = {
    id: Date.now(),
    name: `Scenario ${savedScenarios.length + 1}`,
    parameters: {
      area: simulatedArea,
      budget: simulatedBudget,
      tilt: simulatedTilt,
      panelSize: simulatedPanelSize
    },
    results: simulatedResults
  };
  
  setSavedScenarios(prev => [...prev, scenario]);
  localStorage.setItem('savedScenarios', JSON.stringify([...savedScenarios, scenario]));
};
```

### Export Scenarios:

```javascript
import { exportToExcel } from '../services/exportService';

const handleExportScenario = () => {
  const data = {
    original: { parameters: baseParameters, results: baseResults },
    simulated: { parameters: currentSimulated, results: simulatedResults }
  };
  
  exportToExcel(data, 'scenario-comparison.xlsx');
};
```

---

## 🐛 Troubleshooting

### Issue: Calculations not updating

**Cause:** `onCalculate` function not returning results

**Solution:**
```javascript
const handleCalculateScenario = (newParams) => {
  // Make sure to RETURN the results
  return performCalculation(newParams);
};
```

### Issue: Apply button does nothing

**Cause:** `onApply` function not updating parent state

**Solution:**
```javascript
const handleApplyScenario = (simParams) => {
  // Update state
  setParameters(prev => ({ ...prev, ...simParams }));
  
  // Recalculate
  const newResults = handleCalculateScenario(simParams);
  setResults(newResults);
};
```

### Issue: Sliders lag or slow

**Cause:** Calculations running on every slider move

**Solution:** The component already includes 300ms debouncing. If still slow:
```javascript
// Increase debounce time in useEffect:
const timeoutId = setTimeout(() => {
  // ... calculation ...
}, 500); // Increase from 300ms to 500ms
```

### Issue: Results don't match main calculator

**Cause:** Different calculation logic

**Solution:** Use the same calculation function:
```javascript
// Import your calculator's calculation function
import { calculateSolarSystem } from '../services/solarCalculationService';

const handleCalculateScenario = (newParams) => {
  return calculateSolarSystem(newParams);
};
```

---

## 📚 Related Components

- **Calculator.jsx** - Main solar calculator
- **ResultsDashboard.jsx** - Display calculation results
- **SystemComparison.jsx** - Compare multiple configurations (Phase 4, Step 2)
- **ExportService.js** - Export results to PDF/Excel (Phase 4, Step 4)

---

## ✨ Future Enhancements

Potential additions:

1. **Scenario History:**
   - Save multiple scenarios
   - Compare 3+ configurations side-by-side
   - Load from history

2. **Advanced Parameters:**
   - Add azimuth slider
   - Add electricity rate slider
   - Add location selector

3. **Visualization:**
   - Real-time graphs
   - Payback timeline
   - Production curve

4. **AI Recommendations:**
   - "Best Value" scenario
   - "Maximum Production" scenario
   - "Fastest Payback" scenario

5. **Sharing:**
   - Share scenario URL
   - Export comparison PDF
   - Email scenario

---

## 📞 Support

**Questions or Issues?**
- Check the example file: `ScenarioSimulatorExample.jsx`
- Review Phase 4 documentation: `PHASE_4_IMPLEMENTATION_PROMPTS.md`
- Test the component independently before integrating

**Integration Help:**
- Ensure your calculation function returns the correct format
- Check that base parameters include all required fields
- Verify results object structure matches expected format

---

## ✅ Checklist for Integration

- [ ] Import ScenarioSimulator component
- [ ] Pass baseParameters prop with current inputs
- [ ] Pass baseResults prop with current results
- [ ] Create onCalculate function
- [ ] Create onApply function
- [ ] Test all sliders move smoothly
- [ ] Verify calculations update in real-time
- [ ] Test Apply button updates main calculator
- [ ] Test Reset button returns to original
- [ ] Check AI analysis shows meaningful insights
- [ ] Verify trend indicators are correct
- [ ] Test on mobile devices
- [ ] Add to your calculator results section

---

**Phase 4, Step 3 - COMPLETE! ✅**

Next Step: **Step 4 - Export & Sharing**

---

**Last Updated:** {{ Date }}  
**Component Version:** 1.0.0  
**Status:** Production Ready

