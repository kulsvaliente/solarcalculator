import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Typography, Table, TableHead,
  TableRow, TableCell, TableBody, Box, Divider, Stack, TextField
} from '@mui/material';
import { useSolarConstants } from '../context/solarConstantsContext';
import { getSunPeakHours } from '../services/solarIrradianceService';
import { getMultipleSystemCosts, calculateROI } from '../services/pricingService';
import SunPeakHoursDisplay from './SunPeakHoursDisplay';
import { DEFAULT_DAYTIME_USE_PERCENT } from '../constants/panelGeometryConstants';
import {
  clampDaytimePercent,
  getUnifiedUtilizationFactor,
  getUtilizationFactors
} from '../constants/utilizationFactors';

const Calculator = ({
  lat,
  lng,
  area,
  sp,
  tilt,
  azimuth,
  rate,
  daytimeUsePercent = DEFAULT_DAYTIME_USE_PERCENT,
  onCalculate,
  trigger,
  onDataUpdate,
  heroSummaryFromWhatIf = null
}) => {
  const [pendingCalculation, setPendingCalculation] = useState(false);
  const [lastInputs, setLastInputs] = useState(null);
  const [solradMonthly, setSolradMonthly] = useState(null);
  const [sunPeakHoursData, setSunPeakHoursData] = useState(null);
  const [resultRows, setResultRows] = useState([]);
  const [summary, setSummary] = useState(null);

  /** Merge What-If Apply metrics over main calculator summary (same idea as CalculatorEnhanced). */
  const displaySummary = useMemo(() => {
    const h = heroSummaryFromWhatIf;
    const livePanelWp =
      Number(sp) > 0 && Number.isFinite(sp) ? Math.round(sp * 1000) : null;
    if (!h) return summary;
    if (summary) {
      return {
        ...summary,
        Rcapacity: h.Rcapacity,
        eeannual: h.eeannual,
        totalSavings: h.totalSavings,
        panelCount: h.panelCount,
        /** What-If Apply carries panel size from the scenario; map field is unchanged until main Calculate */
        panelWattage: h.panelWattage ?? livePanelWp ?? summary.panelWattage,
        eeave: h.eeave ?? summary.eeave,
        pricingSource: h.pricingSource ?? summary.pricingSource
      };
    }
    const eeannualNum = parseFloat(String(h.eeannual));
    return {
      ...h,
      panelWattage: h.panelWattage ?? livePanelWp,
      eeave:
        h.eeave ??
        (Number.isFinite(eeannualNum) ? (eeannualNum / 365).toFixed(1) : '0.0'),
      pricingSource: h.pricingSource ?? 'What-If scenario (applied)'
    };
  }, [heroSummaryFromWhatIf, summary, sp]);

  // ✅ Question states for recommended capacity
  const [showQuestion, setShowQuestion] = useState(true);
  const [showConsumptionQuestions, setShowConsumptionQuestions] = useState(false);
  const [avgMonthlyBill, setAvgMonthlyBill] = useState('');
  const [avgRate, setAvgRate] = useState('');
  const [recommendedResult, setRecommendedResult] = useState(null);

  const losses = 20;
  const { constants } = useSolarConstants();
  const { n, ns } = constants;

  // Modern light theme input styles for Calculator results section
  const inputStyles = {
    '& .MuiInputLabel-root': {
      color: '#1976d2',
      fontWeight: 500,
      '&.Mui-focused': { color: '#1565c0' }
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f8f9fa',
      color: '#2c3e50',
      borderRadius: 2,
      '& fieldset': { 
        borderColor: '#e0e0e0',
        borderWidth: '1.5px'
      },
      '&:hover fieldset': { 
        borderColor: '#1976d2'
      },
      '&.Mui-focused fieldset': { 
        borderColor: '#1976d2',
        borderWidth: '2px'
      }
    },
    '& input': {
      color: '#2c3e50',
      fontWeight: 500
    },
    '& input::placeholder': { color: '#90a4ae', opacity: 0.8 }
  };

  useEffect(() => {
    if (!lat || !lng || !tilt || !azimuth) return;

    const fetchSolarData = async () => {
      console.log('Fetching solar data from NREL API...', { lat, lng, tilt, azimuth }); // Debug log
      try {
        // Use the new solar irradiance service
        const sunPeakData = await getSunPeakHours(lat, lng, {
          tilt,
          azimuth,
          systemCapacity: 1,
          arrayType: 1,
          moduleType: 1,
          losses
        });

        if (sunPeakData.success) {
          console.log('✅ Solar data fetched successfully from NREL API'); // Debug log
          setSunPeakHoursData(sunPeakData);
          // Extract monthly solar irradiance for backward compatibility
          setSolradMonthly(sunPeakData.rawData.monthlyIrradiance);
          
          // Immediately pass sun peak hours data to parent
          if (onDataUpdate) {
            const dataToPass = {
              sunPeakHoursData: {
                annualAverage: sunPeakData.annualAverage,
                seasonalAverages: sunPeakData.seasonalAverages,
                monthlyData: sunPeakData.monthlyData,
                metadata: sunPeakData.metadata,
                success: sunPeakData.success
              }
            };
            onDataUpdate(dataToPass);
          }
        } else {
          console.error('❌ Failed to fetch sun peak hours data:', sunPeakData.error);
          alert(`Failed to load solar data: ${sunPeakData.error}. Please try again or check your internet connection.`);
        }
      } catch (err) {
        console.error('❌ Failed to fetch solar data:', err);
        alert(`Error loading solar data: ${err.message}. Please try again or check your internet connection.`);
      }
    };

    fetchSolarData();
  }, [lat, lng, tilt, azimuth]);

  const handleCalculate = async () => {
    console.log('handleCalculate called'); // Debug log
    console.log('solradMonthly:', solradMonthly); // Debug log
    console.log('sunPeakHoursData:', sunPeakHoursData); // Debug log
    
    if (!solradMonthly || !area || !sp || !rate) {
      const missing = [];
      if (!solradMonthly) missing.push('Solar data (still loading from NREL API)');
      if (!area) missing.push('Area');
      if (!sp) missing.push('Panel Size');
      if (!rate) missing.push('Electricity Rate');
      
      console.error('Missing required data:', missing); // Debug log
      alert(`Missing required data: ${missing.join(', ')}. Please wait for solar data to load or check your inputs.`);
      return;
    }

    if (area < 6) {
      alert("The area is too small for a solar panel installation.");
      return;
    }

    const currentInputs = { lat, lng, area, sp, tilt, azimuth, rate, daytimeUsePercent };

    if (lastInputs &&
      currentInputs.lat === lastInputs.lat &&
      currentInputs.lng === lastInputs.lng &&
      currentInputs.area === lastInputs.area &&
      currentInputs.sp === lastInputs.sp &&
      currentInputs.tilt === lastInputs.tilt &&
      currentInputs.azimuth === lastInputs.azimuth &&
      currentInputs.rate === lastInputs.rate &&
      currentInputs.daytimeUsePercent === lastInputs.daytimeUsePercent
    ) {
    } else {
      const incrementCalculatorUsage = () => {
        const current = parseInt(localStorage.getItem('calcUses') || '0', 10);
        localStorage.setItem('calcUses', current + 1);
      };
      incrementCalculatorUsage();
      if (onCalculate) onCalculate();
      setLastInputs(currentInputs);
    }

    // ✅ Use standardized sun peak hours with 0.8 multiplier
    const avgSun = sunPeakHoursData ? sunPeakHoursData.annualAverage.sunPeakHours : 
                   solradMonthly.reduce((a, b) => a + b, 0) / 12 * 0.8;
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let N = 0;
    const rpkwp = area * 0.6 * n;

    if (rpkwp < 1) N = 2;
    else if (rpkwp < 2) N = 4;
    else if (area < 32) N = 8;
    else {
      N = rpkwp / sp;
      if (N % 4 !== 0) {
        N += 4 - (N % 4);
      }
    }

    const ns_value = Math.ceil(N / 2);
    const Rcapacity = N * sp;
    const selectedPanelWattage = Math.round(sp * 1000);
    const calculatedPanelCount = sp > 0 ? Math.round(Rcapacity / sp) : 0;
    const panelsPerInverter = ns_value / 2;

    // Use standardized sun peak hours for monthly calculations
    const monthlySunPeakHours = sunPeakHoursData ? sunPeakHoursData.rawData.monthlySunPeakHours :
                                solradMonthly.map(irradiance => irradiance * 0.8);

    const monthlyEstimatedGenKwh = monthlySunPeakHours.map((sh, i) =>
      Number(sh) * Rcapacity * daysInMonth[i] * 0.8
    );
    const eeannual = monthlyEstimatedGenKwh.reduce((sum, v) => sum + v, 0);
    const eeave = eeannual / 365;
    
    const ac = monthlySunPeakHours.map((sh, i) =>
      ns * sh * daysInMonth[i] * Rcapacity
    );

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const daytimeClamped = clampDaytimePercent(daytimeUsePercent);
    const gridTiedUF = getUnifiedUtilizationFactor(daytimeClamped, 0);
    const utilizationFactors = getUtilizationFactors(daytimeClamped);

    let totalAc = 0, totalSavings = 0;
    const rows = ac.map((kwh, i) => {
      const savings = kwh * rate * gridTiedUF;
      totalAc += kwh;
      totalSavings += savings;
      return {
        month: months[i],
        kwh: Number(kwh.toFixed(1)).toLocaleString(),
        savings: Number(savings.toFixed(2)).toLocaleString(),
        radiation: monthlySunPeakHours[i].toFixed(2)
      };
    });

    rows.push({
      month: "Total/Avg",
      kwh: Number(totalAc.toFixed(1)).toLocaleString(),
      savings: Number(totalSavings.toFixed(2)).toLocaleString(),
      radiation: avgSun.toFixed(2)
    });

    // Calculate system costs using pricing service
    let systemCosts = null;
    try {
      systemCosts = await getMultipleSystemCosts(Rcapacity, 'all');
    } catch (error) {
      console.error('Error fetching pricing data, using fallback values:', error);
      // Fallback to hardcoded values if pricing service fails
      systemCosts = {
        success: false,
        gridTied: { minCost: Rcapacity * 35000, maxCost: Rcapacity * 45000 },
        hybrid: { minCost: Rcapacity * 60000, maxCost: Rcapacity * 70000 },
        offGrid: { minCost: Rcapacity * 55000, maxCost: Rcapacity * 65000 }
      };
    }

    const offgridCost_Min = systemCosts?.offGrid?.minCost || Rcapacity * 55000;
    const gridtiedCost_Min = systemCosts?.gridTied?.minCost || Rcapacity * 35000;
    const hybridCost_Min = systemCosts?.hybrid?.minCost || Rcapacity * 60000;
    const offgridCost_Max = systemCosts?.offGrid?.maxCost || Rcapacity * 65000;
    const gridtiedCost_Max = systemCosts?.gridTied?.maxCost || Rcapacity * 45000;
    const hybridCost_Max = systemCosts?.hybrid?.maxCost || Rcapacity * 70000;

    // Calculate ROI and payback periods
    const gridTiedROI = calculateROI(gridtiedCost_Min, totalSavings);
    const hybridROI = calculateROI(hybridCost_Min, totalSavings);
    const offGridROI = calculateROI(offgridCost_Min, totalSavings);

    const OG_Savings_Min = gridTiedROI.paybackPeriod ? gridTiedROI.paybackPeriod.toFixed(1) : (gridtiedCost_Min / totalSavings).toFixed(1);
    const GT_Savings_Min = hybridROI.paybackPeriod ? hybridROI.paybackPeriod.toFixed(1) : (hybridCost_Min / totalSavings).toFixed(1);
    const H_Savings_Min = offGridROI.paybackPeriod ? offGridROI.paybackPeriod.toFixed(1) : (offgridCost_Min / totalSavings).toFixed(1);
    const OG_Savings_Max = gridTiedROI.paybackPeriod ? gridTiedROI.paybackPeriod.toFixed(1) : (gridtiedCost_Max / totalSavings).toFixed(1);
    const GT_Savings_Max = hybridROI.paybackPeriod ? hybridROI.paybackPeriod.toFixed(1) : (hybridCost_Max / totalSavings).toFixed(1);
    const H_Savings_Max = offGridROI.paybackPeriod ? offGridROI.paybackPeriod.toFixed(1) : (offgridCost_Max / totalSavings).toFixed(1);

    // ✅ Store avgSun and sun peak hours data in summary for later use
    setResultRows(rows);
    const summaryData = {
      Rcapacity,
      eeannual: eeannual.toFixed(1),
      eeave: eeave.toFixed(1),
      panelCount: calculatedPanelCount,
      panelWattage: selectedPanelWattage,
      totalSavings: totalSavings.toFixed(2),
      offgridCost_Min, offgridCost_Max,
      gridtiedCost_Min, gridtiedCost_Max,
      hybridCost_Min, hybridCost_Max,
      OG_Savings_Min, GT_Savings_Min, H_Savings_Min,
      OG_Savings_Max, GT_Savings_Max, H_Savings_Max,
      avgSun, // ✅ store average sun hour
      // New pricing and ROI data
      systemCosts: systemCosts,
      roi: {
        gridTied: gridTiedROI,
        hybrid: hybridROI,
        offGrid: offGridROI
      },
      pricingSource: systemCosts?.success ? 'Real-Time Market Rates' : 'Standard Estimates',
      sunPeakHoursData: sunPeakHoursData ? {
        annualAverage: sunPeakHoursData.annualAverage,
        seasonalAverages: sunPeakHoursData.seasonalAverages,
        monthlyData: sunPeakHoursData.monthlyData
      } : null,
      utilizationFactors
    };
    
    setSummary(summaryData);
    
    // Pass results to parent for Phase 4 components
    if (onDataUpdate) {
      onDataUpdate({
        results: {
          systemCapacity: Rcapacity,
          panelCount: calculatedPanelCount,
          panelWattage: selectedPanelWattage,
          annualProduction: parseFloat(eeannual.toFixed(1)),
          annualSavings: parseFloat(totalSavings.toFixed(2)),
          paybackPeriod: {
            gridTied: gridTiedROI.paybackPeriod || parseFloat(OG_Savings_Min),
            hybrid: hybridROI.paybackPeriod || parseFloat(GT_Savings_Min),
            offGrid: offGridROI.paybackPeriod || parseFloat(H_Savings_Min)
          },
          roi: {
            gridTied: gridTiedROI.roi || 0,
            hybrid: hybridROI.roi || 0,
            offGrid: offGridROI.roi || 0
          },
          systemCosts: systemCosts,
          monthlyData: rows,
          monthlyGenerationKwh: monthlyEstimatedGenKwh.map((kwh) => Number(kwh)),
          co2Offset: Math.round(eeannual * 0.7), // Estimate CO2 offset (0.7 kg CO2 per kWh)
          utilizationFactors,
          daytimeUsePercent: daytimeClamped
        }
      });
    }
  };

  useEffect(() => {
    if (trigger) {
      setPendingCalculation(true);
    }
  }, [trigger]);

  useEffect(() => {
    if (pendingCalculation && solradMonthly) {
      handleCalculate();
      setPendingCalculation(false);
    }
  }, [pendingCalculation, solradMonthly]);

  // Pass sun peak hours data to parent component
  useEffect(() => {
    if (onDataUpdate && sunPeakHoursData) {
      onDataUpdate({
        sunPeakHoursData: {
          annualAverage: sunPeakHoursData.annualAverage,
          seasonalAverages: sunPeakHoursData.seasonalAverages,
          monthlyData: sunPeakHoursData.monthlyData,
          metadata: sunPeakHoursData.metadata,
          success: sunPeakHoursData.success
        }
      });
    }
  }, [sunPeakHoursData, onDataUpdate]);

  // ✅ FIXED recommended capacity calculation
  const handleRecommendedCapacityCalc = () => {
    if (!avgMonthlyBill || !avgRate || !summary) {
      alert("Please enter valid bill and rate, and calculate first.");
      return;
    }

    const monthlyConsumption = parseFloat(avgMonthlyBill) / parseFloat(avgRate);
    const avgSunHours = parseFloat(summary.avgSun || 0);

    if (!avgSunHours || avgSunHours <= 0) {
      alert("Average sun hour data missing.");
      return;
    }

    const recommendedCapacity = monthlyConsumption / (avgSunHours * 30);

    setRecommendedResult({
      consumption: monthlyConsumption.toFixed(1),
      capacity: recommendedCapacity.toFixed(2)
    });
  };

  return (
    <Box mt={3}>
      {displaySummary && (
        <>
          {/* Summary Card */}
          <Box sx={{ 
            p: { xs: 2, sm: 3 }, 
            bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
            borderRadius: 3,
            border: '2px solid #90caf9',
            boxShadow: '0 4px 12px rgba(25,118,210,0.1)',
            mb: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: '#1565c0', 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}>
              System Summary
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography sx={{ 
                  color: '#546e7a', 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  Potential Solar Capacity:
                </Typography>
                <Typography sx={{ 
                  color: '#1976d2', 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}>
                  {Number(displaySummary.Rcapacity).toFixed(2)} kWp
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography sx={{ 
                  color: '#546e7a', 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  Number of Panels ({displaySummary.panelWattage || Math.round(sp * 1000)} Wp):
                </Typography>
                <Typography sx={{ 
                  color: '#00acc1', 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}>
                  {displaySummary.panelCount} panels
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography sx={{ 
                  color: '#546e7a', 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  Daily Energy Production:
                </Typography>
                <Typography sx={{ 
                  color: '#26a69a', 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}>
                  {displaySummary.eeave} kWh/day
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography sx={{ 
                  color: '#546e7a', 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  Annual Energy Production:
                </Typography>
                <Typography sx={{ 
                  color: '#2e7d32', 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}>
                  {displaySummary.eeannual} kWh/year
                </Typography>
              </Box>
              <Box sx={{ 
                mt: 2, 
                p: { xs: 1, sm: 1.5 }, 
                bgcolor: '#e8f5e9', 
                borderRadius: 2,
                border: '1px solid #a5d6a7'
              }}>
                <Typography sx={{ 
                  color: '#2e7d32', 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                  fontWeight: 600,
                  wordBreak: 'break-word'
                }}>
                  💰 Pricing Source: {displaySummary.pricingSource}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Monthly/Annual Energy Table */}
          {/* Monthly Energy Production - REMOVED */}
          {/* System Cost Comparison - REMOVED */}
          {/* Payback Period Timeline - REMOVED */}
          {/* ROI - REMOVED */}
          {/* Recommended Capacity Calculator - REMOVED */}
          
          {/* ✅ QUESTION SECTION - REMOVED */}
          {false && showQuestion && (
            <Box mt={3} sx={{ 
              p: 3, 
              bgcolor: '#e3f2fd', 
              borderRadius: 2,
              border: '1px solid #90caf9',
              textAlign: 'center'
            }}>
              <Divider sx={{ my: 2, borderColor: '#90caf9' }} />
              <Typography sx={{ color: '#1565c0', fontWeight: 600, fontSize: '1rem' }} gutterBottom>
                Do you want to calculate the recommended capacity based on your average energy consumption?
              </Typography>
              <Box mt={2} display="flex" gap={2} justifyContent="center">
                <Button 
                  variant="contained" 
                  sx={{ 
                    bgcolor: '#1976d2',
                    px: 4,
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#1565c0' }
                  }} 
                  onClick={() => { setShowConsumptionQuestions(true); setShowQuestion(false); }}
                >
                  Yes
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    px: 4,
                    fontWeight: 'bold',
                    '&:hover': { 
                      borderColor: '#c62828',
                      bgcolor: '#ffebee'
                    }
                  }} 
                  onClick={() => setShowQuestion(false)}
                >
                  No
                </Button>
              </Box>
            </Box>
          )}

          {/* ✅ YES -> SHOW INPUTS + CALCULATE - REMOVED */}
          {false && showConsumptionQuestions && (
            <Box mt={4} sx={{ 
              p: 3, 
              bgcolor: '#fff3e0', 
              borderRadius: 2,
              border: '1px solid #ffcc80'
            }}>
              <Divider sx={{ my: 2, borderColor: '#ffcc80' }} />
              <Typography sx={{ color: '#e65100', fontWeight: 600, fontSize: '1rem' }} gutterBottom>
                Enter your average monthly details:
              </Typography>

              {/* Inputs */}
              <Stack spacing={2}>
                <TextField
                  label="Average Monthly Electric Bill (₱)"
                  value={avgMonthlyBill}
                  onChange={(e) => setAvgMonthlyBill(e.target.value)}
                  sx={inputStyles}
                  size="small"
                  fullWidth
                  type="number"
                />
                <TextField
                  label="Average Electricity Rate (₱/kWh)"
                  value={avgRate}
                  onChange={(e) => setAvgRate(e.target.value)}
                  sx={inputStyles}
                  size="small"
                  fullWidth
                  type="number"
                />
              </Stack>

              {/* Calculate Button */}
              <Box mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: '#1976d2',
                    color: 'white',
                    fontWeight: 'bold',
                    py: 1.5,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
                    '&:hover': { 
                      bgcolor: '#1565c0',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(25,118,210,0.4)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={handleRecommendedCapacityCalc}
                >
                  Calculate Recommended Capacity
                </Button>
              </Box>

              {/* Show calculated result */}
              {recommendedResult && (
                <Box mt={4} sx={{ 
                  p: 3, 
                  bgcolor: '#e8f5e9', 
                  borderRadius: 2,
                  border: '1px solid #a5d6a7',
                  boxShadow: '0 2px 8px rgba(46,125,50,0.1)'
                }}>
                  <Divider sx={{ my: 2, borderColor: '#a5d6a7' }} />
                  <Typography sx={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1.1rem' }} gutterBottom>
                    Estimated Energy Consumption & Recommended Capacity
                  </Typography>
                  <Stack spacing={1.5} mt={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#546e7a', fontWeight: 500 }}>
                        Monthly Energy Consumption:
                      </Typography>
                      <Typography sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                        {recommendedResult.consumption} kWh
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#546e7a', fontWeight: 500 }}>
                        Recommended Solar PV Capacity:
                      </Typography>
                      <Typography sx={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {recommendedResult.capacity} kWp
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {/* Sun Peak Hours Display */}
      <SunPeakHoursDisplay
        sunPeakHoursData={sunPeakHoursData}
        location={{ latitude: lat, longitude: lng }}
        loading={!sunPeakHoursData && lat && lng}
        error={sunPeakHoursData && !sunPeakHoursData.success ? sunPeakHoursData.error : null}
        systemCapacity={displaySummary?.Rcapacity}
        electricityRate={Number(rate) > 0 ? Number(rate) : undefined}
        utilizationFactor={
          Number.isFinite(Number(displaySummary?.utilizationFactors?.gridTied))
            ? Number(displaySummary.utilizationFactors.gridTied)
            : getUnifiedUtilizationFactor(clampDaytimePercent(daytimeUsePercent), 0)
        }
      />
    </Box>
  );
};

export default Calculator;

