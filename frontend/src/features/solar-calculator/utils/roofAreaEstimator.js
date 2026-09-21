/**
 * Shared sizing helpers for bridging alternate calculator input procedures
 * (e.g. "monthly consumption") into the roof-area-driven capacity formula
 * used throughout the app (CalculatorEnhanced, ScenarioSimulator's live
 * recompute, SystemComparison, resultNarrativeGenerator).
 *
 * calculateTechnicalCapacity / estimateAreaForTargetCapacity mirror the
 * exact formula in CalculatorEnhanced.jsx's handleCalculate (and the
 * previously-duplicated copy in ScenarioSimulator.jsx) so a synthetic
 * `area` derived here reproduces the same capacity everywhere downstream.
 */

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function calculateTechnicalCapacity(area, panelSize) {
  const savedConstants = JSON.parse(localStorage.getItem('solarConstants') || '{"n":0.23}');
  const nConst = Number(savedConstants?.n) || 0.23;
  const areaVal = Number(area) || 0;
  const panelSizeVal = Number(panelSize) || 0.6;

  const rpkwp = areaVal * 0.6 * nConst;
  let N = 0;
  if (rpkwp < 1) N = 2;
  else if (rpkwp < 2) N = 4;
  else if (areaVal < 32) N = 8;
  else {
    N = rpkwp / panelSizeVal;
    if (N % 4 !== 0) {
      N += 4 - (N % 4);
    }
  }
  return N * panelSizeVal;
}

export function estimateAreaForTargetCapacity(targetCapacity, panelSize, fallbackArea = 50) {
  if (!targetCapacity || targetCapacity <= 0) return fallbackArea;
  let bestArea = fallbackArea;
  let bestDiff = Infinity;

  for (let area = 10; area <= 200; area += 1) {
    const capacity = calculateTechnicalCapacity(area, panelSize);
    const diff = Math.abs(capacity - targetCapacity);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestArea = area;
    }
  }
  return bestArea;
}

/**
 * Target system capacity (kWp) that would produce enough annual energy to
 * cover the given average monthly consumption, using per-month sun peak
 * hours for the site. Falls back to a flat Philippines-average sun peak
 * hour estimate if per-month data isn't available yet.
 */
export function estimateCapacityFromMonthlyConsumption(monthlyConsumptionKwh, monthlySunPeakHours) {
  const monthlyKwh = Number(monthlyConsumptionKwh) || 0;
  if (monthlyKwh <= 0) return 0;

  const annualConsumptionKwh = monthlyKwh * 12;

  const sunHours =
    Array.isArray(monthlySunPeakHours) && monthlySunPeakHours.length === 12
      ? monthlySunPeakHours
      : Array(12).fill(4.0); // reasonable PH-wide fallback average

  const weightedAnnualSunHours = sunHours.reduce(
    (sum, sh, i) => sum + Number(sh) * DAYS_IN_MONTH[i] * 0.8,
    0
  );

  if (weightedAnnualSunHours <= 0) return 0;
  return annualConsumptionKwh / weightedAnnualSunHours;
}

/**
 * Convenience: derive the synthetic `area` (m²) to feed into the existing
 * roof-area-based calculator pipeline, given a monthly consumption figure
 * and the site's per-month sun peak hours.
 */
export function estimateAreaFromMonthlyConsumption(monthlyConsumptionKwh, monthlySunPeakHours, panelSize, fallbackArea = 50) {
  const targetCapacity = estimateCapacityFromMonthlyConsumption(monthlyConsumptionKwh, monthlySunPeakHours);
  return estimateAreaForTargetCapacity(targetCapacity, panelSize, fallbackArea);
}
