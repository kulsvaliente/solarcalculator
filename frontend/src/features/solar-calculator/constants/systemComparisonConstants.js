/**
 * Shared constants for System Comparison cards and Scenario Simulator (What-If).
 * Single source of truth so Hybrid System what-if defaults are derived from the Hybrid card.
 */

import { calculateBatteryKwh } from './utilizationFactors';

// --- Off-Grid (Budget) ---
export const OFF_GRID = {
  perKwMin: 40000,
  perKwMax: 55000,
  capacityMultiplier: 1,
  annualSavingsMultiplier: 0.6,
  annualProductionMultiplier: 0.6,
  paybackMultiplier: 1.05,
  roiMultiplier: 0.9
};

// --- Grid-Tied (Balanced) ---
export const GRID_TIED = {
  perKwMin: 35000,
  perKwMax: 50000,
  capacityMultiplier: 1,
  annualSavingsMultiplier: 1,
  annualProductionMultiplier: 1,
  paybackMultiplier: 1,
  roiMultiplier: 1
};

// --- Hybrid System (Premium) - from SystemComparison Hybrid card ---
export const HYBRID = {
  perKwMin: 45000,
  perKwMax: 60000,
  capacityMultiplier: 1,
  annualSavingsMultiplier: 1,
  annualProductionMultiplier: 1,
  paybackMultiplier: 1.4,
  roiMultiplier: 0.95,
  /** Top-tier panels (700W) as per Hybrid card features */
  panelSizeKw: 0.7
};

// --- Battery cost, per kWh of nameplate capacity — Off-Grid and Hybrid only (Grid-Tied has
// no battery). Investment for these two types is priced as Grid-Tied-equivalent hardware/
// labor cost PLUS the actual cost of whatever battery the system needs, rather than a single
// flat ₱/kW rate that ignores how much storage is really required.
export const OFF_GRID_BATTERY_COST = { perKwhMin: 6000, perKwhMax: 11000 };
export const HYBRID_BATTERY_COST = { perKwhMin: 9000, perKwhMax: 14000 };

// Off-Grid has no grid connection / net metering equipment (unlike Grid-Tied and Hybrid), so
// its base cost is the Grid-Tied MIN..MAX range MINUS this per-kW discount (applied to both
// ends), before battery cost is added on top. At Daytime Use = 100% (battery need = 0),
// Off-Grid Investment reduces to exactly [GridTiedMin, GridTiedMax] - (discount * capacity).
export const OFF_GRID_NO_GRIDTIE_DISCOUNT_PER_KW = 5000;

// Hybrid carries both a battery AND grid-tie/net-metering equipment, so its base cost is the
// Grid-Tied MIN..MAX range PLUS this per-kW premium (applied to both ends), before battery cost
// is added on top. At Daytime Use = 100% (battery need = 0), Hybrid Investment reduces to
// exactly [GridTiedMin, GridTiedMax] + (premium * capacity).
export const HYBRID_DUAL_SYSTEM_PREMIUM_PER_KW = 5000;

/**
 * Investment (₱ cost) range for a system type — the single source of truth used by System
 * Comparison, Print/Save, and the What-If Investment slider, so all three always agree.
 *
 * - Grid-Tied: capacity × its own flat per-kW rate (no battery) — a genuine min-max range.
 * - Hybrid: the Grid-Tied min..max range, PLUS a per-kW premium (both battery AND grid-tie
 *   equipment), PLUS (battery kWh × its per-kWh battery rate) — all terms vary between min
 *   and max.
 * - Off-Grid: same shape, but the Grid-Tied range is discounted per-kW instead (no grid
 *   connection / net metering equipment) before the battery term is added.
 *   Battery Size is a free live input for both Off-Grid and Hybrid — this always honors
 *   whatever value the user has it set to.
 *
 * @param {Object} params
 * @param {'gridtied'|'offgrid'|'hybrid'|'gridtied_copy'} params.systemType
 * @param {number} params.capacity - System capacity (kW) for this type (already includes any
 *   per-type capacity multiplier, e.g. Hybrid's).
 * @param {number} params.annualProduction - Annual energy production (kWh) for this type.
 * @param {number} params.daytimeUsePercent - Daytime Use (%), 0-100.
 * @param {number} [params.batterySizePercent] - Battery Size (%), 0-100 — ignored only for
 *   Grid-Tied (always 0, no battery by definition).
 * @returns {{min:number,max:number,typical:number}}
 */
export function getInvestmentRange({
  systemType,
  capacity,
  annualProduction,
  daytimeUsePercent,
  batterySizePercent
}) {
  const cap = Number(capacity) > 0 ? Number(capacity) : 0;
  const gridTiedMin = cap * GRID_TIED.perKwMin;
  const gridTiedMax = cap * GRID_TIED.perKwMax;
  const type = systemType === 'gridtied_copy' ? 'hybrid' : systemType;

  if (type !== 'offgrid' && type !== 'hybrid') {
    const min = Math.round(gridTiedMin);
    const max = Math.round(gridTiedMax);
    return { min, max, typical: Math.round((min + max) / 2) };
  }

  const effectiveBattery = Math.min(100, Math.max(0, Number(batterySizePercent) || 0));

  const batteryKwh = calculateBatteryKwh({
    annualProduction,
    daytimeUsePercent,
    batterySizePercent: effectiveBattery
  });

  const batteryRates = type === 'offgrid' ? OFF_GRID_BATTERY_COST : HYBRID_BATTERY_COST;
  const discount = type === 'offgrid' ? OFF_GRID_NO_GRIDTIE_DISCOUNT_PER_KW * cap : 0;
  const premium = type === 'hybrid' ? HYBRID_DUAL_SYSTEM_PREMIUM_PER_KW * cap : 0;
  const baseMin = gridTiedMin - discount + premium;
  const baseMax = gridTiedMax - discount + premium;

  const min = Math.round(baseMin + batteryRates.perKwhMin * batteryKwh);
  const max = Math.round(baseMax + batteryRates.perKwhMax * batteryKwh);
  return { min, max, typical: Math.round((min + max) / 2) };
}

/**
 * Format a min/max ₱ range as a string — a single "₱X" when min equals max (e.g. Off-Grid at
 * Daytime Use = 100%, where battery cost is zero), otherwise "₱X - ₱Y".
 */
export function formatPesoRange(min, max) {
  const roundedMin = Math.round(Number(min) || 0);
  const roundedMax = Math.round(Number(max) || 0);
  if (roundedMin === roundedMax) {
    return `₱${roundedMin.toLocaleString()}`;
  }
  return `₱${roundedMin.toLocaleString()} - ₱${roundedMax.toLocaleString()}`;
}

/**
 * Battery cost component alone (₱ range) — capacity/production/daytime/battery% same shape
 * as getInvestmentRange. Grid-Tied always returns zero (no battery).
 */
export function getBatteryCostRange({
  systemType,
  annualProduction,
  daytimeUsePercent,
  batterySizePercent
}) {
  const type = systemType === 'gridtied_copy' ? 'hybrid' : systemType;
  if (type !== 'offgrid' && type !== 'hybrid') {
    return { min: 0, max: 0, typical: 0 };
  }
  const effectiveBattery = Math.min(100, Math.max(0, Number(batterySizePercent) || 0));
  const batteryKwh = calculateBatteryKwh({
    annualProduction,
    daytimeUsePercent,
    batterySizePercent: effectiveBattery
  });
  const batteryRates = type === 'offgrid' ? OFF_GRID_BATTERY_COST : HYBRID_BATTERY_COST;
  const min = Math.round(batteryRates.perKwhMin * batteryKwh);
  const max = Math.round(batteryRates.perKwhMax * batteryKwh);
  return { min, max, typical: Math.round((min + max) / 2), batteryKwh };
}

/**
 * Get investment profile for a system type.
 * Used by ScenarioSimulator getSystemDefaults and getInvestmentProfile.
 * @deprecated Prefer getInvestmentRange, which is battery-aware; this is capacity-only and
 * kept for call sites that don't yet have annualProduction/daytime/battery available.
 */
export function getHybridInvestmentProfile(baseCapacity) {
  const targetCapacity = baseCapacity * HYBRID.capacityMultiplier;
  return {
    targetCapacity,
    perKwMin: HYBRID.perKwMin,
    perKwMax: HYBRID.perKwMax,
    minInvestment: Math.round(targetCapacity * HYBRID.perKwMin),
    maxInvestment: Math.round(targetCapacity * HYBRID.perKwMax),
    typicalInvestment: Math.round(
      (targetCapacity * HYBRID.perKwMin + targetCapacity * HYBRID.perKwMax) / 2
    )
  };
}
