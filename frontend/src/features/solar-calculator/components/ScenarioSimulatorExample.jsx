import React, { useState } from 'react';
import { Box, Container, Typography, Divider } from '@mui/material';
import ScenarioSimulator from './ScenarioSimulator';

/**
 * Example Integration of ScenarioSimulator
 * Shows how to use the What-If Analysis tool in your calculator
 */
const ScenarioSimulatorExample = () => {
  // Example: Current calculator state
  const [currentParameters, setCurrentParameters] = useState({
    area: 50,            // Roof area in sqm
    budget: 200000,      // Budget in PHP
    tilt: 18,            // Tilt angle in degrees
    panelSize: 0.6,      // Panel size in kWp
    latitude: 14.5995,   // Location latitude (Manila)
    longitude: 120.9842, // Location longitude (Manila)
    azimuth: 180,        // Azimuth (South-facing)
    rate: 10             // Electricity rate in ₱/kWh
  });

  // Example: Current calculation results
  const [currentResults, setCurrentResults] = useState({
    capacity: 28.5,         // System capacity in kW
    annualSavings: 45000,   // Annual savings in PHP
    annualProduction: 4500, // Annual production in kWh
    paybackPeriod: 6.5,     // Payback period in years
    roi: 287,               // ROI percentage over 25 years
    panelCount: 48          // Number of panels
  });

  /**
   * Calculate function - performs solar calculations with new parameters
   * This should call your actual calculation logic
   * 
   * @param {Object} newParams - New parameters to calculate with
   * @returns {Object} Calculation results
   */
  const handleCalculateScenario = (newParams) => {
    console.log('Calculating scenario with params:', newParams);
    
    // Example calculation (replace with your actual calculation function)
    // This is a simplified version - use your real Calculator logic
    const efficiency = 0.6;  // 60% roof utilization
    const systemDerating = 0.95;  // 5% system losses
    const capacity = newParams.area * efficiency * systemDerating;
    const panelCount = Math.floor(capacity / newParams.panelSize);
    
    // Simulate production calculation (replace with real sun peak hours calculation)
    const avgSunPeakHours = 4.5;  // Example for Philippines
    const annualProduction = capacity * avgSunPeakHours * 365;
    const annualSavings = annualProduction * (newParams.rate || 10);
    
    // Simulate cost calculation (replace with real pricing service)
    const costPerKW = 70000;  // Example: ₱70,000 per kW
    const systemCost = capacity * costPerKW;
    const paybackPeriod = systemCost / annualSavings;
    const roi = ((annualSavings * 25) / systemCost) * 100;
    
    return {
      capacity: parseFloat(capacity.toFixed(1)),
      annualSavings: Math.round(annualSavings),
      annualProduction: Math.round(annualProduction),
      paybackPeriod: parseFloat(paybackPeriod.toFixed(1)),
      roi: Math.round(roi),
      panelCount: panelCount
    };
  };

  /**
   * Apply simulated configuration to main calculator
   * Updates the calculator with the selected scenario
   * 
   * @param {Object} simulatedParams - Parameters from scenario simulator
   */
  const handleApplyScenario = (simulatedParams) => {
    console.log('Applying scenario:', simulatedParams);
    const {
      resultsBySystemType: _r,
      sharedSlidersSnapshot: _s,
      applyFieldTouches: _applyTouches,
      ...applyFields
    } = simulatedParams;

    // Update current parameters
    setCurrentParameters((prev) => ({
      ...prev,
      ...applyFields
    }));

    // Recalculate with new parameters
    const newResults = handleCalculateScenario({
      ...currentParameters,
      ...applyFields
    });
    
    setCurrentResults(newResults);
    
    // Show confirmation message
    alert(`Configuration applied! System capacity: ${newResults.capacity} kW`);
    
    // Optionally: Scroll to results, update URL, save to history, etc.
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        What-If Scenario Simulator - Example Integration
      </Typography>
      
      <Typography variant="body1" paragraph color="textSecondary">
        This example shows how to integrate the ScenarioSimulator component into your calculator.
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Current Configuration Display */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Current Configuration:
        </Typography>
        <Typography variant="body2">
          • Area: {currentParameters.area} sqm<br />
          • Budget: ₱{currentParameters.budget.toLocaleString()}<br />
          • Tilt: {currentParameters.tilt}°<br />
          • Panel Size: {currentParameters.panelSize} kWp<br />
          <br />
          <strong>Current Results:</strong><br />
          • Capacity: {currentResults.capacity} kW<br />
          • Annual Savings: ₱{currentResults.annualSavings.toLocaleString()}<br />
          • Payback: {currentResults.paybackPeriod} years<br />
          • ROI: {currentResults.roi}%
        </Typography>
      </Box>
      
      {/* Scenario Simulator */}
      <ScenarioSimulator
        baseParameters={currentParameters}
        baseResults={currentResults}
        onCalculate={handleCalculateScenario}
        onApply={handleApplyScenario}
      />
      
      {/* Usage Instructions */}
      <Box sx={{ mt: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          How to Use in Your Calculator:
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>
              <strong>Import the component:</strong><br />
              <code>import ScenarioSimulator from './ScenarioSimulator';</code>
            </li>
            <li>
              <strong>Add it to your results section:</strong><br />
              Place it after your calculation results display
            </li>
            <li>
              <strong>Pass required props:</strong>
              <ul>
                <li><code>baseParameters</code> - Current calculator inputs</li>
                <li><code>baseResults</code> - Current calculation results</li>
                <li><code>onCalculate</code> - Function to recalculate with new params</li>
                <li><code>onApply</code> - Function to apply simulated configuration</li>
              </ul>
            </li>
            <li>
              <strong>Connect to your calculation logic:</strong><br />
              Use your existing Calculator component's calculation functions
            </li>
          </ol>
        </Typography>
      </Box>
    </Container>
  );
};

export default ScenarioSimulatorExample;

