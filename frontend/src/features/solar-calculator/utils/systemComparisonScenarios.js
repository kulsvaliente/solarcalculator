// Single source of truth for the three System Comparison scenarios (Off-Grid, Grid-Tied,
// Hybrid) — cost range, payback, and ROI. Extracted from SystemComparison.jsx so other
// consumers (e.g. the Print/Save report) show the exact same numbers instead of a second,
// independently-derived estimate that can drift from what System Comparison displays.
import { OFF_GRID, GRID_TIED, HYBRID, getInvestmentRange } from '../constants/systemComparisonConstants';
import { DEFAULT_DAYTIME_USE_PERCENT } from '../constants/panelGeometryConstants';
import {
  clampDaytimePercent,
  getUtilizationFactorForSystemType,
  calculateBatteryKwh
} from '../constants/utilizationFactors';

const OFF_GRID_COMPARISON_COLOR = '#42a5f5';
const GRID_TIED_COMPARISON_COLOR = '#26a69a';
const HYBRID_COMPARISON_COLOR = '#7e57c2';

/**
 * @param {Object} baseParameters - Same shape as MapComponent's systemComparisonBaseParameters
 * @param {Object} baseResults - Same shape as MapComponent's systemComparisonBaseResults
 * @returns {Array} Three scenario objects: id, name, capacity, panelCount, cost{min,max,typical},
 *   annualProduction, annualSavings, paybackPeriod (string, possibly a "min - max" range),
 *   roi (string, possibly a "min - max" range), daytimeUsePercent, recommended, color, pros, cons,
 *   features.
 */
export function computeSystemComparisonScenarios(baseParameters, baseResults) {
  if (!baseParameters || !baseResults) return [];

  const userPanelSizeKw = parseFloat(baseParameters?.panelSize) || 0.6;
  const budget = baseParameters.budget || baseParameters.financial?.budget || 200000;
  const baseCapacity = baseResults.systemCapacity || baseResults.capacity || 28.5;
  /** Annual production from calculator result (kWh/year). */
  const annualProduction = Number(baseResults.annualProduction || 0);
  const scenarioResultsByType = baseResults?.scenarioResultsByType || {};
  const offgridScenario = scenarioResultsByType.offgrid;
  const gridtiedScenario = scenarioResultsByType.gridtied;
  const hybridScenario = scenarioResultsByType.hybrid;
  const fallbackAnnualSavings = Number(baseResults?.annualSavings || 0);

  /** Electricity rate (₱/kWh) from map / calculator inputs */
  const electricityRate = Number(baseParameters?.rate) > 0 ? Number(baseParameters.rate) : 10;

  /** Estimated annual savings formula aligned with What-If simulated annual savings logic. */
  const estimatedAnnualSavingsFromFormula = (systemCategory, annualProdKwh) => {
    const p = Number(annualProdKwh);
    if (!Number.isFinite(p) || p < 0) return null;
    const category = String(systemCategory || '').toLowerCase();
    const daytimeBase = clampDaytimePercent(baseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT);
    const batteryBase = Math.min(100, Math.max(0, Number(baseParameters?.batterySizePercent) || 0));
    // Grid-Tied has no battery (always 0%). Off-Grid and Hybrid both use the shared/live battery
    // input directly — no daytime-derived override.
    const daytimeForFormula = daytimeBase;
    const batteryForFormula = category === 'gridtied' ? 0 : batteryBase;
    const uf = getUtilizationFactorForSystemType(category, daytimeForFormula, batteryForFormula);
    if (!Number.isFinite(uf) || uf < 0) return null;
    return Math.round(p * electricityRate * uf);
  };

  /**
   * Keep System Comparison synced with What-If Apply values: prefer the stored per-scenario
   * annualSavings from What-If, then fall back to formula.
   */
  const resolvedAnnualSavings = (systemCategory, annualProdKwh, scenarioAnnualSavings) => {
    const direct = Number(scenarioAnnualSavings);
    if (Number.isFinite(direct) && direct >= 0) return Math.round(direct);
    const fromFormula = estimatedAnnualSavingsFromFormula(systemCategory, annualProdKwh);
    return fromFormula != null ? fromFormula : Math.round(fallbackAnnualSavings);
  };

  /** Payback Period range (years) = investment range / annual savings */
  const paybackRangeFromInvestment = (minInvestment, maxInvestment, annualSav) => {
    const minInv = Number(minInvestment);
    const maxInv = Number(maxInvestment);
    const sav = Number(annualSav);
    if (!Number.isFinite(minInv) || !Number.isFinite(maxInv) || !Number.isFinite(sav) || sav <= 0 || minInv <= 0 || maxInv <= 0) {
      return null;
    }
    const minYears = Math.min(minInv / sav, maxInv / sav);
    const maxYears = Math.max(minInv / sav, maxInv / sav);
    return `${minYears.toFixed(1)} - ${maxYears.toFixed(1)}`;
  };

  /** ROI (annualized, 25 years): ((TotalSavings / Investment)^(1/25) - 1) * 100 */
  const roiRangeFromInvestment = (minInvestment, maxInvestment, annualSav) => {
    const minInv = Number(minInvestment);
    const maxInv = Number(maxInvestment);
    const annual = Number(annualSav);
    if (!Number.isFinite(minInv) || !Number.isFinite(maxInv) || !Number.isFinite(annual) || minInv <= 0 || maxInv <= 0 || annual < 0) {
      return null;
    }
    const totalSavings25Years = annual * 25;
    if (!Number.isFinite(totalSavings25Years) || totalSavings25Years < 0) return null;
    const roiPctForInvestment = (investment) => {
      const ratio = totalSavings25Years / investment;
      if (!Number.isFinite(ratio) || ratio <= 0) return null;
      return (Math.pow(ratio, 1 / 25) - 1) * 100;
    };
    const roiAtMinInv = roiPctForInvestment(minInv);
    const roiAtMaxInv = roiPctForInvestment(maxInv);
    if (!Number.isFinite(roiAtMinInv) || !Number.isFinite(roiAtMaxInv)) return null;
    const low = Math.min(roiAtMinInv, roiAtMaxInv);
    const high = Math.max(roiAtMinInv, roiAtMaxInv);
    return `${low.toFixed(1)} - ${high.toFixed(1)}`;
  };

  const getPanelCount = (capacityKw) => Math.max(1, Math.ceil(capacityKw / userPanelSizeKw));
  const budgetCapacity = baseCapacity;
  const balancedCapacity = baseCapacity;
  const premiumCapacity = baseCapacity * HYBRID.capacityMultiplier;

  // Investment for Off-Grid/Hybrid = Grid-Tied-equivalent cost + actual battery cost (computed
  // once here so `cost`, `paybackPeriod`, and `roi` below all agree on the same numbers).
  const daytimeBase = clampDaytimePercent(baseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT);
  const batteryBase = Math.min(100, Math.max(0, Number(baseParameters?.batterySizePercent) || 0));
  const offgridAnnualProduction = Number(offgridScenario?.annualProduction ?? annualProduction);
  const offgridCost = getInvestmentRange({
    systemType: 'offgrid',
    capacity: budgetCapacity,
    annualProduction: offgridAnnualProduction,
    daytimeUsePercent: daytimeBase,
    batterySizePercent: batteryBase
  });
  const offgridBatteryKwh = calculateBatteryKwh({
    annualProduction: offgridAnnualProduction,
    daytimeUsePercent: daytimeBase,
    batterySizePercent: batteryBase
  });
  const hybridAnnualProduction = Number(hybridScenario?.annualProduction ?? annualProduction);
  const hybridCost = getInvestmentRange({
    systemType: 'hybrid',
    capacity: premiumCapacity,
    annualProduction: hybridAnnualProduction,
    daytimeUsePercent: daytimeBase,
    batterySizePercent: batteryBase
  });
  const hybridBatteryKwh = calculateBatteryKwh({
    annualProduction: hybridAnnualProduction,
    daytimeUsePercent: daytimeBase,
    batterySizePercent: batteryBase
  });

  return [
    {
      id: 'budget',
      name: 'Off-Grid',
      subtitle: 'Independent from the utility company. You generate your own electricity.',
      capacity: budgetCapacity,
      panelCount: getPanelCount(budgetCapacity),
      cost: offgridCost,
      annualProduction: Math.round(offgridAnnualProduction),
      annualSavings: (() => {
        const prod = Number(offgridScenario?.annualProduction ?? annualProduction);
        return resolvedAnnualSavings('offgrid', prod, offgridScenario?.annualSavings);
      })(),
      paybackPeriod: (() => {
        const prod = Number(offgridScenario?.annualProduction ?? annualProduction);
        const annualSav = resolvedAnnualSavings('offgrid', prod, offgridScenario?.annualSavings);
        return (
          paybackRangeFromInvestment(offgridCost.min, offgridCost.max, annualSav) ||
          ((baseResults.paybackPeriod?.gridTied || baseResults.paybackPeriod || 6) * OFF_GRID.paybackMultiplier).toFixed(1)
        );
      })(),
      roi: (() => {
        const prod = Number(offgridScenario?.annualProduction ?? annualProduction);
        const annualSav = resolvedAnnualSavings('offgrid', prod, offgridScenario?.annualSavings);
        return (
          roiRangeFromInvestment(offgridCost.min, offgridCost.max, annualSav) ||
          String(Math.round((baseResults.roi?.gridTied || baseResults.roi || 250) * OFF_GRID.roiMultiplier))
        );
      })(),
      daytimeUsePercent: daytimeBase,
      batteryCapacityKwh: Math.round(offgridBatteryKwh * 10) / 10,
      recommended: budget < 180000,
      color: OFF_GRID_COMPARISON_COLOR,
      pros: [
        'Does not require net-metering application, works well in off-grid or remote locations',
        'Handles areas with unstable power supply',
        'Supports clean energy and decarbonization goals'
      ],
      cons: [
        'May need a sizable battery bank',
        'Charging can be unreliable during prolonged cloudy or rainy weather',
        'Load capacity limited by inverter size'
      ],
      features: [
        'Standard solar panels (550W)',
        'Basic string inverter',
        'Roof mounting system',
        'Basic monitoring',
        'Grid connection only'
      ]
    },
    {
      id: 'balanced',
      name: 'Grid-Tied (Net-Metered)',
      subtitle: 'Connected to the utility grid. Solar reduces your bill, but no power during outages.',
      capacity: balancedCapacity,
      panelCount: getPanelCount(balancedCapacity),
      cost: {
        min: Math.round(balancedCapacity * GRID_TIED.perKwMin),
        max: Math.round(balancedCapacity * GRID_TIED.perKwMax),
        typical: Math.round((balancedCapacity * (GRID_TIED.perKwMin + GRID_TIED.perKwMax)) / 2)
      },
      annualProduction: Math.round(Number(gridtiedScenario?.annualProduction ?? annualProduction)),
      annualSavings: (() => {
        const prod = Number(gridtiedScenario?.annualProduction ?? annualProduction);
        return resolvedAnnualSavings('gridtied', prod, gridtiedScenario?.annualSavings);
      })(),
      paybackPeriod: (() => {
        const prod = Number(gridtiedScenario?.annualProduction ?? annualProduction);
        const annualSav = resolvedAnnualSavings('gridtied', prod, gridtiedScenario?.annualSavings);
        const minCost = Math.round(balancedCapacity * GRID_TIED.perKwMin);
        const maxCost = Math.round(balancedCapacity * GRID_TIED.perKwMax);
        return (
          paybackRangeFromInvestment(minCost, maxCost, annualSav) ||
          (baseResults.paybackPeriod?.gridTied || baseResults.paybackPeriod || 6).toFixed(1)
        );
      })(),
      roi: (() => {
        const prod = Number(gridtiedScenario?.annualProduction ?? annualProduction);
        const annualSav = resolvedAnnualSavings('gridtied', prod, gridtiedScenario?.annualSavings);
        const minCost = Math.round(balancedCapacity * GRID_TIED.perKwMin);
        const maxCost = Math.round(balancedCapacity * GRID_TIED.perKwMax);
        return (
          roiRangeFromInvestment(minCost, maxCost, annualSav) ||
          String(baseResults.roi?.gridTied || baseResults.roi || 287)
        );
      })(),
      daytimeUsePercent: daytimeBase,
      recommended: budget >= 180000 && budget < 400000,
      color: GRID_TIED_COMPARISON_COLOR,
      pros: [
        'Most affordable and simple setup',
        'Fewer components, easier maintenance',
        'No load restrictions or overloading concerns'
      ],
      cons: [
        'System shuts down during grid outages',
        'No battery backup means no energy independence during emergencies'
      ],
      features: [
        'Premium solar panels (650W)',
        'Hybrid-ready inverter',
        'Optimized mounting',
        'Smart monitoring system',
        'Net metering capable'
      ]
    },
    {
      id: 'premium',
      name: 'Hybrid (Net-Metered)',
      subtitle: 'Has both grid connection and batteries. You still have backup when the power goes out.',
      capacity: premiumCapacity,
      panelCount: getPanelCount(premiumCapacity),
      cost: hybridCost,
      annualProduction: Math.round(hybridAnnualProduction),
      annualSavings: (() => {
        const prod = Number(hybridScenario?.annualProduction ?? annualProduction);
        return resolvedAnnualSavings('hybrid', prod, hybridScenario?.annualSavings);
      })(),
      paybackPeriod: (() => {
        const prod = Number(hybridScenario?.annualProduction ?? annualProduction);
        const annualSav = resolvedAnnualSavings('hybrid', prod, hybridScenario?.annualSavings);
        return (
          paybackRangeFromInvestment(hybridCost.min, hybridCost.max, annualSav) ||
          ((baseResults.paybackPeriod?.gridTied || baseResults.paybackPeriod || 6) * HYBRID.paybackMultiplier).toFixed(1)
        );
      })(),
      roi: (() => {
        const prod = Number(hybridScenario?.annualProduction ?? annualProduction);
        const annualSav = resolvedAnnualSavings('hybrid', prod, hybridScenario?.annualSavings);
        return (
          roiRangeFromInvestment(hybridCost.min, hybridCost.max, annualSav) ||
          String(Math.round((baseResults.roi?.gridTied || baseResults.roi || 287) * HYBRID.roiMultiplier))
        );
      })(),
      daytimeUsePercent: daytimeBase,
      batteryCapacityKwh: Math.round(hybridBatteryKwh * 10) / 10,
      recommended: budget >= 400000,
      color: HYBRID_COMPARISON_COLOR,
      pros: [
        'Keeps running even during outages',
        'Flexible usage, ideal for time-of-use rate optimization',
        'Reduces grid dependency through battery-assisted net metering'
      ],
      cons: [
        'Highest upfront cost among solar PV options',
        'More costly than a standard grid-tied setup',
        'Longer return on investment compared to simpler systems',
        'Battery degradation over time adds to long-term maintenance costs',
        'System complexity means higher installation and configuration expenses'
      ],
      features: [
        'Top-tier panels (700W)',
        'Hybrid inverter with backup',
        'Lithium battery storage (10-15 kWh)',
        'Advanced smart monitoring',
        'Load management system',
        'Automatic backup switching'
      ]
    }
  ];
}
