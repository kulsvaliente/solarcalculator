import { getHybridInvestmentProfile, GRID_TIED, OFF_GRID } from '../constants/systemComparisonConstants';

/**
 * Mirrors "recommended" system selection in SystemComparison.jsx (Compare Solar System Options).
 * Used to default What-If / ScenarioSimulator to the same system type as the highlighted card.
 *
 * @param {number|string} budgetVal - User budget (PHP), same as main calculator
 * @returns {'offgrid'|'gridtied'|'gridtied_copy'} ScenarioSimulator system type keys
 */
export function getRecommendedScenarioSystemType(budgetVal) {
  const b = Number(budgetVal);
  const budget = Number.isFinite(b) && b > 0 ? b : 200000;
  if (budget < 180000) return 'offgrid';
  if (budget < 400000) return 'gridtied';
  return 'gridtied_copy';
}

/**
 * Same resolution order as ScenarioSimulator initial system type (comparison + storage + budget heuristics).
 */
export function resolveInitialScenarioSystemType({ recommendedSystemType, storedState, baseParameters }) {
  if (recommendedSystemType) return recommendedSystemType;
  if (storedState?.systemType) {
    return storedState.systemType === 'hybrid' ? 'gridtied_copy' : storedState.systemType;
  }
  const initialBudget = baseParameters?.budget || 200000;
  if (initialBudget < 180000) return 'offgrid';
  if (initialBudget < 400000) return 'gridtied';
  return 'gridtied_copy';
}

/**
 * Matches ScenarioSimulator.calculateTechnicalCapacity (roof + panel → kW capacity).
 */
export function computeTechnicalCapacityForScenario(area, panelSize) {
  let nConst = 0.23;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('solarConstants');
      if (raw) {
        const parsed = JSON.parse(raw);
        nConst = Number(parsed?.n) || 0.23;
      }
    }
  } catch {
    /* ignore */
  }
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

/**
 * Max investment (slider top) for a system type — mirrors getInvestmentProfile(...).maxInvestment.
 * Runs before any real calculation exists (first paint), so — like the deprecated
 * getHybridInvestmentProfile it mirrors for Hybrid — this is capacity-only, not battery-aware;
 * ScenarioSimulator's live getInvestmentProfile (battery-aware) takes over once results exist.
 */
export function getInvestmentProfileMaxForType(systemType, baseCapacityKw) {
  const cap = Number(baseCapacityKw) || 0;
  if (systemType === 'hybrid' || systemType === 'gridtied_copy') {
    return getHybridInvestmentProfile(cap).maxInvestment;
  }
  const perKwMax = systemType === 'offgrid' ? OFF_GRID.perKwMax : GRID_TIED.perKwMax;
  return Math.round(cap * perKwMax);
}

/**
 * Initial budget slider value (card max) so first paint matches System Comparison range.
 */
export function getInitialSimulatedBudgetMax({ baseParameters, baseResults, recommendedSystemType, storedState }) {
  const sys = resolveInitialScenarioSystemType({ recommendedSystemType, storedState, baseParameters });
  const baseArea = Number(baseParameters?.area) || 50;
  const basePanel = Number(baseParameters?.panelSize) || 0.6;
  const baseCap =
    Number(baseResults?.capacity ?? baseResults?.systemCapacity) ||
    computeTechnicalCapacityForScenario(baseArea, basePanel);
  return getInvestmentProfileMaxForType(sys, baseCap);
}