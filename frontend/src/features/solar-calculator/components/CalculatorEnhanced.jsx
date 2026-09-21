// Enhanced Solar Calculator - modern UI with visualizations and animations
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSolarConstants } from '../context/solarConstantsContext';
import { getSunPeakHours } from '../services/solarIrradianceService';
import { getMultipleSystemCosts, calculateROI } from '../services/pricingService';
import SunPeakHoursDisplay from './SunPeakHoursDisplay';
import HeroSummaryCard from './HeroSummaryCard';
import { Skeleton } from '../../../components/ui/skeleton';
import { DEFAULT_DAYTIME_USE_PERCENT } from '../constants/panelGeometryConstants';
import { GRID_TIED, HYBRID, getInvestmentRange } from '../constants/systemComparisonConstants';
import {
  clampDaytimePercent,
  getUnifiedUtilizationFactor,
  getUtilizationFactors,
  getUtilizationFactorsByCategory
} from '../constants/utilizationFactors';

const CalculatorEnhanced = ({
  lat,
  lng,
  area,
  sp,
  tilt,
  azimuth,
  rate,
  daytimeUsePercent = DEFAULT_DAYTIME_USE_PERCENT,
  batterySizePercent = 100,
  onCalculate,
  trigger,
  onDataUpdate,
  /** When set (e.g. after What-If Apply), Summary & Results shows these metrics until main Calculate clears them */
  heroSummaryFromWhatIf = null,
  /** Surfaces validation/fetch notices in the host's own styled notification instead of a
   *  native browser alert(); falls back to alert() if the host doesn't provide one. */
  onError = (message) => window.alert(message)
}) => {
  // State management
  const [pendingCalculation, setPendingCalculation] = useState(false);
  const [lastInputs, setLastInputs] = useState(null);
  const [solradMonthly, setSolradMonthly] = useState(null);
  const [sunPeakHoursData, setSunPeakHoursData] = useState(null);
  const [resultRows, setResultRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Configuration constants
  const losses = 20;
  const { constants } = useSolarConstants();
  const { n, ns } = constants;

  // Fetch solar irradiance data from NREL API when location or panel parameters change
  useEffect(() => {
    if (!lat || !lng || !tilt || !azimuth) return;

    const fetchSolarData = async () => {
      console.log('Fetching solar data from NREL API...', { lat, lng, tilt, azimuth });
      try {
        // Fetch sun peak hours data from NREL API
        const sunPeakData = await getSunPeakHours(lat, lng, {
          tilt,
          azimuth,
          systemCapacity: 1,
          arrayType: 1,
          moduleType: 1,
          losses
        });

        if (sunPeakData.success) {
          console.log('Solar data fetched successfully from NREL API');
          setSunPeakHoursData(sunPeakData);
          // Extract monthly solar irradiance for backward compatibility
          setSolradMonthly(sunPeakData.rawData.monthlyIrradiance);
          
          // Pass sun peak hours data to parent component
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
          console.error('Failed to fetch sun peak hours data:', sunPeakData.error);
          onError(`Failed to load solar data: ${sunPeakData.error}. Please try again or check your internet connection.`);
        }
      } catch (err) {
        console.error('Failed to fetch solar data:', err);
        onError(`Error loading solar data: ${err.message}. Please try again or check your internet connection.`);
      }
    };

    fetchSolarData();
  }, [lat, lng, tilt, azimuth]);

  // Main calculation function
  const handleCalculate = async () => {
    console.log('handleCalculate called');
    
    // Validate required data
    if (!solradMonthly || !area || !sp || !rate) {
      const missing = [];
      if (!solradMonthly) missing.push('Solar data (still loading from NREL API)');
      if (!area) missing.push('Area');
      if (!sp) missing.push('Panel Size');
      if (!rate) missing.push('Electricity Rate');
      
      console.error('Missing required data:', missing);
      onError(`Missing required data: ${missing.join(', ')}. Please wait for solar data to load or check your inputs.`);
      return;
    }

    // Check minimum area requirement
    if (area < 6) {
      onError('The area is too small for a solar panel installation.');
      return;
    }

    const currentInputs = { lat, lng, area, sp, tilt, azimuth, rate, daytimeUsePercent };

    // Check if inputs have changed to avoid duplicate calculations
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
      // Inputs haven't changed, skip recalculation
    } else {
      // Track usage in localStorage
      const incrementCalculatorUsage = () => {
        const current = parseInt(localStorage.getItem('calcUses') || '0', 10);
        localStorage.setItem('calcUses', current + 1);
      };
      incrementCalculatorUsage();
      
      if (onCalculate) onCalculate();
      setLastInputs(currentInputs);
    }

    setIsCalculating(true);

    // Calculate average sun peak hours
    const avgSun = sunPeakHoursData ? sunPeakHoursData.annualAverage.sunPeakHours : 
                   solradMonthly.reduce((a, b) => a + b, 0) / 12 * 0.8;
    
    // Days per month for monthly calculations
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Calculate number of panels needed
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

    // Calculate system specifications
    const ns_value = Math.ceil(N / 2);
    const Rcapacity = N * sp;
    const selectedPanelWattage = Math.round(sp * 1000);
    const calculatedPanelCount = sp > 0 ? Math.round(Rcapacity / sp) : 0;
    const panelsPerInverter = ns_value / 2;

    // Get monthly sun peak hours for detailed calculations
    const monthlySunPeakHours = sunPeakHoursData ? sunPeakHoursData.rawData.monthlySunPeakHours :
                                solradMonthly.map(irradiance => irradiance * 0.8);

    // Annual energy production = sum of monthly energy production (SunPeakHoursDisplay column: sh × kW × days × 0.8)
    const monthlyEstimatedGenKwh = monthlySunPeakHours.map((sh, i) =>
      Number(sh) * Rcapacity * daysInMonth[i] * 0.8
    );
    const eeannual = monthlyEstimatedGenKwh.reduce((sum, v) => sum + v, 0);
    const eeave = eeannual / 365;
    
    // Calculate monthly AC energy production
    const ac = monthlySunPeakHours.map((sh, i) =>
      ns * sh * daysInMonth[i] * Rcapacity
    );

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const daytimeClamped = clampDaytimePercent(daytimeUsePercent);
    const gridTiedUF = getUnifiedUtilizationFactor(daytimeClamped, 0);
    const utilizationFactors = getUtilizationFactors(daytimeClamped);
    const utilizationFactorsByCategory = getUtilizationFactorsByCategory(
      daytimeClamped,
      batterySizePercent
    );

    // Build monthly results table (main calculator = grid-tied savings model)
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

    // Add totals row
    rows.push({
      month: "Total/Avg",
      kwh: Number(totalAc.toFixed(1)).toLocaleString(),
      savings: Number(totalSavings.toFixed(2)).toLocaleString(),
      radiation: avgSun.toFixed(2)
    });

    // Fetch system cost from pricing service — Grid-Tied only. Off-Grid/Hybrid are computed
    // below via the same shared, battery-aware getInvestmentRange() formula that System
    // Comparison, Print/Save, and What-If use, so the Summary and Analysis tabs always agree
    // with those instead of pricing hybrid/off-grid from a flat ₱/kW rate or a separate DB
    // lookup that knows nothing about battery size.
    let systemCosts = null;
    try {
      systemCosts = await getMultipleSystemCosts(Rcapacity, 'all');
    } catch (error) {
      console.error('Error fetching pricing data, using fallback values:', error);
      systemCosts = { success: false };
    }

    const offgridRange = getInvestmentRange({
      systemType: 'offgrid',
      capacity: Rcapacity,
      annualProduction: eeannual,
      daytimeUsePercent: daytimeClamped,
      batterySizePercent
    });
    const hybridRange = getInvestmentRange({
      systemType: 'hybrid',
      capacity: Rcapacity * HYBRID.capacityMultiplier,
      annualProduction: eeannual,
      daytimeUsePercent: daytimeClamped,
      batterySizePercent
    });
    // Keep the returned systemCosts shape consistent for existing consumers (e.g. Print/Save
    // fallbacks), now sourced from the same battery-aware formula for Off-Grid/Hybrid.
    systemCosts = {
      ...systemCosts,
      offGrid: { minCost: offgridRange.min, maxCost: offgridRange.max },
      hybrid: { minCost: hybridRange.min, maxCost: hybridRange.max }
    };

    // Extract cost ranges for each system type
    const offgridCost_Min = offgridRange.min;
    const gridtiedCost_Min = systemCosts?.gridTied?.minCost || Rcapacity * GRID_TIED.perKwMin;
    const hybridCost_Min = hybridRange.min;
    const offgridCost_Max = offgridRange.max;
    const gridtiedCost_Max = systemCosts?.gridTied?.maxCost || Rcapacity * GRID_TIED.perKwMax;
    const hybridCost_Max = hybridRange.max;

    // Calculate ROI and payback periods for each system type
    const gridTiedROI = calculateROI(gridtiedCost_Min, totalSavings);
    const hybridROI = calculateROI(hybridCost_Min, totalSavings);
    const offGridROI = calculateROI(offgridCost_Min, totalSavings);

    const OG_Savings_Min = gridTiedROI.paybackPeriod ? gridTiedROI.paybackPeriod.toFixed(1) : (gridtiedCost_Min / totalSavings).toFixed(1);
    const GT_Savings_Min = hybridROI.paybackPeriod ? hybridROI.paybackPeriod.toFixed(1) : (hybridCost_Min / totalSavings).toFixed(1);
    const H_Savings_Min = offGridROI.paybackPeriod ? offGridROI.paybackPeriod.toFixed(1) : (offgridCost_Min / totalSavings).toFixed(1);
    const OG_Savings_Max = gridTiedROI.paybackPeriod ? gridTiedROI.paybackPeriod.toFixed(1) : (gridtiedCost_Max / totalSavings).toFixed(1);
    const GT_Savings_Max = hybridROI.paybackPeriod ? hybridROI.paybackPeriod.toFixed(1) : (hybridCost_Max / totalSavings).toFixed(1);
    const H_Savings_Max = offGridROI.paybackPeriod ? offGridROI.paybackPeriod.toFixed(1) : (offgridCost_Max / totalSavings).toFixed(1);

    // Store all calculated results in summary
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
      avgSun,
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
      } : null
    };
    
    setSummary(summaryData);
    setIsCalculating(false);
    
    // Pass complete results to parent component
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
          co2Offset: Math.round(eeannual * 0.7),
          utilizationFactors,
          utilizationFactorsByCategory,
          daytimeUsePercent: daytimeClamped
        }
      });
    }
  };

  // Handle auto-calculation when triggered
  useEffect(() => {
    if (trigger) {
      setPendingCalculation(true);
    }
  }, [trigger]);

  // Execute calculation when data is ready
  useEffect(() => {
    if (pendingCalculation && solradMonthly) {
      handleCalculate();
      setPendingCalculation(false);
    }
  }, [pendingCalculation, solradMonthly]);

  // Pass sun peak hours data to parent when available
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

  const livePanelWp =
    Number(sp) > 0 && Number.isFinite(sp) ? Math.round(sp * 1000) : null;

  let heroSummaryDisplay;
  if (heroSummaryFromWhatIf && summary) {
    heroSummaryDisplay = {
      ...summary,
      Rcapacity: heroSummaryFromWhatIf.Rcapacity,
      eeannual: heroSummaryFromWhatIf.eeannual,
      totalSavings: heroSummaryFromWhatIf.totalSavings,
      panelCount: heroSummaryFromWhatIf.panelCount,
      panelWattage:
        heroSummaryFromWhatIf.panelWattage ??
        livePanelWp ??
        summary.panelWattage
    };
  } else if (heroSummaryFromWhatIf) {
    const h = heroSummaryFromWhatIf;
    const eeannualNum = parseFloat(String(h.eeannual));
    heroSummaryDisplay = {
      Rcapacity: h.Rcapacity,
      eeannual: h.eeannual,
      totalSavings: h.totalSavings,
      panelCount: h.panelCount,
      panelWattage: h.panelWattage ?? livePanelWp,
      eeave:
        h.eeave ??
        (Number.isFinite(eeannualNum) ? (eeannualNum / 365).toFixed(1) : '0.0'),
      pricingSource: h.pricingSource ?? 'What-If scenario (applied)'
    };
  } else {
    heroSummaryDisplay = summary;
  }

  const showHeroSummary =
    heroSummaryDisplay && (!isCalculating || heroSummaryFromWhatIf);

  const utilizationFactorForSunPeak = Number.isFinite(
    Number(heroSummaryDisplay?.utilizationFactors?.gridTied)
  )
    ? Number(heroSummaryDisplay.utilizationFactors.gridTied)
    : getUnifiedUtilizationFactor(clampDaytimePercent(daytimeUsePercent), 0);

  return (
    <div className="space-y-6 mt-6">
      {/* Main Results Section — What-If Apply can supply metrics before full recalc completes */}
      {showHeroSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Hero Summary Card */}
          <HeroSummaryCard summary={heroSummaryDisplay} loading={false} hideAnnualSavings />

          {/* Monthly Energy Production - REMOVED */}
          {/* <MonthlyEnergyChart resultRows={resultRows} loading={isCalculating} /> */}

          {/* System Comparison Cards - REMOVED */}
          {/* <SystemComparisonCards summary={summary} loading={isCalculating} /> */}

          {/* Payback Period Timeline - REMOVED */}
          {/* <PaybackPeriodTimeline summary={summary} loading={isCalculating} /> */}

          {/* ROI Visualization - REMOVED */}
          {/* <ROIVisualization summary={summary} loading={isCalculating} /> */}

          {/* Recommended Capacity Calculator - REMOVED */}
          {/* <RecommendedCapacityCalculator summary={summary} /> */}
        </motion.div>
      )}

      {/* Loading State */}
      {isCalculating && (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      )}

      {/* Sun Peak Hours Display (always visible when data available) */}
      <SunPeakHoursDisplay
        sunPeakHoursData={sunPeakHoursData}
        location={{ latitude: lat, longitude: lng }}
        loading={!sunPeakHoursData && lat && lng}
        error={sunPeakHoursData && !sunPeakHoursData.success ? sunPeakHoursData.error : null}
        systemCapacity={heroSummaryDisplay?.Rcapacity ?? summary?.Rcapacity}
        electricityRate={Number(rate) > 0 ? Number(rate) : undefined}
        utilizationFactor={utilizationFactorForSunPeak}
      />
    </div>
  );
};

export default CalculatorEnhanced;

