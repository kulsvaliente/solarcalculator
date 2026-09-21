/**
 * Utilization factor (UF) formula, per system type:
 * UF = daytime use + 0.5 * (night time use + battery size (%) * night time use) * multiplier
 * Battery size is 0–100 (%); internally scaled to a 0..1 factor in the B*N term.
 * Off-Grid applies a 0.8 multiplier to the night-time/battery term (no grid fallback dampens
 * the benefit of stored energy); Grid-Tied and Hybrid keep a 1x multiplier.
 */

import { DEFAULT_DAYTIME_USE_PERCENT } from './panelGeometryConstants';

export const OFFGRID_UF_MULTIPLIER = 0.8;
export const GRIDTIED_UF_MULTIPLIER = 1;
export const HYBRID_UF_MULTIPLIER = 1;

export function clampDaytimePercent(daytimeUsePercent) {
  const n = Number(daytimeUsePercent);
  if (!Number.isFinite(n)) return DEFAULT_DAYTIME_USE_PERCENT;
  return Math.min(100, Math.max(0, n));
}

/**
 * Usable battery capacity (kWh) needed to cover the nighttime share of daily load.
 * Mirrors the What-If "Battery Capacity (kWh)" card: converts the *usable* nighttime energy need
 * into nameplate battery capacity, assuming 80% usable depth-of-discharge.
 */
export function calculateBatteryKwh({ annualProduction, daytimeUsePercent, batterySizePercent }) {
  const daytime = clampDaytimePercent(daytimeUsePercent);
  const nighttimePercent = Math.max(0, 100 - daytime);
  const averageDailyEnergyProduction = (Number(annualProduction) || 0) / 365;
  const batteryPct = Math.min(100, Math.max(0, Number(batterySizePercent) || 0));
  return ((nighttimePercent / 100) * averageDailyEnergyProduction / 0.8) * (batteryPct / 100);
}

/**
 * UF = D + 0.5 * (N + B * N) * multiplier
 * where:
 * - D = daytime use fraction (0..1)
 * - N = night time use fraction (0..1)
 * - B = battery size as fraction (0..1) from batterySizePercent (0..100)
 * - multiplier = per-system-type factor applied to the night-time/battery term (1 = unchanged)
 */
export function getUnifiedUtilizationFactor(daytimeUsePercent, batterySizePercent = 0, multiplier = 1) {
  const daytimeFraction = clampDaytimePercent(daytimeUsePercent) / 100;
  const nighttimeFraction = 1 - daytimeFraction;
  const batteryFraction =
    Math.min(100, Math.max(0, Number(batterySizePercent) || 0)) / 100;
  return daytimeFraction + 0.5 * (nighttimeFraction + (batteryFraction * nighttimeFraction)) * multiplier;
}

/** Per-system-type UF multiplier: Off-Grid = 0.8, Grid-Tied/Hybrid = 1. */
function ufMultiplierForType(systemType) {
  return systemType === 'offgrid' ? OFFGRID_UF_MULTIPLIER : 1;
}

/**
 * All three factors for the current daytime slider value, each using its own system-type
 * multiplier (Off-Grid = 0.8x, Grid-Tied/Hybrid = 1x on the night-time/battery term).
 * @returns {{ daytimeUsePercent: number, offGrid: number, gridTied: number, hybrid: number }}
 */
export function getUtilizationFactors(daytimeUsePercent, batterySizePercent = 0) {
  const d = clampDaytimePercent(daytimeUsePercent);
  return {
    daytimeUsePercent: d,
    offGrid: getUnifiedUtilizationFactor(d, batterySizePercent, OFFGRID_UF_MULTIPLIER),
    gridTied: getUnifiedUtilizationFactor(d, batterySizePercent, GRIDTIED_UF_MULTIPLIER),
    hybrid: getUnifiedUtilizationFactor(d, batterySizePercent, HYBRID_UF_MULTIPLIER)
  };
}

/**
 * UF applied to $/kWh savings for a given scenario system type.
 */
export function getUtilizationFactorForSystemType(
  systemType,
  daytimeUsePercent,
  batterySizePercent = 0
) {
  return getUnifiedUtilizationFactor(daytimeUsePercent, batterySizePercent, ufMultiplierForType(systemType));
}

/**
 * UF values aligned with What-If / System Comparison profiles:
 * - Off-Grid: live daytime %, live battery %, 0.8x multiplier (the UI suggests a value from
 *   daytime, but the user can override it — this always honors whatever battery % it's given)
 * - Grid-Tied: live daytime %, battery treated as 0% (no battery by definition), 1x multiplier
 * - Hybrid: live daytime %, live battery %, 1x multiplier
 */
export function getUtilizationFactorsByCategory(daytimeUsePercent, batterySizePercent = 0) {
  const bat = Math.min(100, Math.max(0, Number(batterySizePercent) || 0));
  const d = clampDaytimePercent(daytimeUsePercent);
  return {
    offgrid: getUnifiedUtilizationFactor(d, bat, OFFGRID_UF_MULTIPLIER),
    gridtied: getUnifiedUtilizationFactor(d, 0, GRIDTIED_UF_MULTIPLIER),
    hybrid: getUnifiedUtilizationFactor(d, bat, HYBRID_UF_MULTIPLIER)
  };
}
