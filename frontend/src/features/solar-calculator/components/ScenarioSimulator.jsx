import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Box,
  Grid,
  Slider,
  Button,
  Chip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
  Dialog
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloseIcon from '@mui/icons-material/Close';
import { GRID_TIED, OFF_GRID, HYBRID, getInvestmentRange, formatPesoRange } from '../constants/systemComparisonConstants';
import { FIXED_PANEL_TILT_DEGREES, DEFAULT_DAYTIME_USE_PERCENT } from '../constants/panelGeometryConstants';
import {
  clampDaytimePercent,
  getUtilizationFactors,
  calculateBatteryKwh
} from '../constants/utilizationFactors';
import { computeSystemComparisonScenarios } from '../utils/systemComparisonScenarios';
import SunPeakHoursDisplay from './SunPeakHoursDisplay';
import {
  getInitialSimulatedBudgetMax,
  resolveInitialScenarioSystemType
} from '../utils/systemComparisonDefaults';
import {
  calculateTechnicalCapacity,
  estimateAreaForTargetCapacity
} from '../utils/roofAreaEstimator';

const SCENARIO_SIMULATOR_STATE_KEY = 'solar_scenario_simulator_state_v1';
const APPLIED_CONFIG_KEY = 'solar_scenario_applied_config_v1';
const OPTIMAL_TILT = FIXED_PANEL_TILT_DEGREES;

/** All What-If system types — prefetch defaults for each so toggles show correct data immediately */
const SCENARIO_SYSTEM_TYPES = ['offgrid', 'gridtied', 'gridtied_copy'];

/** Map legacy/API aliases so Mui ToggleButtonGroup always has a matching `value` (otherwise all presets look unselected) */
function normalizeScenarioPresetType(st) {
  if (st === 'hybrid') return 'gridtied_copy';
  if (SCENARIO_SYSTEM_TYPES.includes(st)) return st;
  return 'gridtied';
}

const emptyScenarioCache = () => ({
  offgrid: null,
  gridtied: null,
  gridtied_copy: null
});

/** Matches main calculator / What-If panel size slider (see MapComponent presets) */
const PANEL_SIZE_INPUT_MIN = 0.5;
const PANEL_SIZE_INPUT_MAX = 0.7;

function clampPanelSizeToInputRange(kw) {
  const v = Number(kw);
  if (!Number.isFinite(v) || v <= 0) return 0.6;
  return Math.min(PANEL_SIZE_INPUT_MAX, Math.max(PANEL_SIZE_INPUT_MIN, v));
}

/**
 * All What-If presets (Off-Grid, Grid-Tied, Hybrid): panel kWp follows main calculator input (clamped).
 * Extra args kept for call-site compatibility; saved "apply" presets no longer override panel size.
 */
function resolveScenarioPanelSize(_systemType, baseParameters, _applied, _defaultsPanelSize) {
  return clampPanelSizeToInputRange(baseParameters?.panelSize);
}

/** Small value-only tick labels so marks don’t overlap across sliders */
const SCENARIO_SLIDER_MARK_SX = {
  '& .MuiSlider-markLabel': {
    fontSize: '0.625rem',
    lineHeight: 1.1,
    color: 'text.secondary',
    whiteSpace: 'nowrap',
    fontWeight: 500
  }
};

/** Slider accent colors — mirrored on matching Simulated Results cards */
const SLIDER_BUDGET_COLOR = '#2e7d32';
const SLIDER_PANEL_COLOR = '#00acc1';
const SLIDER_ELECTRICITY_RATE_COLOR = '#6a1b9a';
const SLIDER_BATTERY_COLOR = '#e65100';
/** Daytime Use slider (interactive); Utilization Factor value uses the same color */
const SLIDER_DAYTIME_COLOR = '#1976d2';


// Grid-Tied has no battery by definition (always 0%). Off-Grid and Hybrid both use the live,
// freely-adjustable slider value directly — no auto-derived suggestion.
function getScenarioBatteryPercent(systemType, batterySizePercent) {
  if (systemType === 'gridtied') return 0;
  return Math.min(100, Math.max(0, Number(batterySizePercent) || 0));
}

// Daytime Use is fully shared across Off-Grid, Grid-Tied, and Hybrid — a drag on any tab
// updates the same value every other tab sees, with no per-type override.
function getScenarioDaytimeUsePercent(systemType, simulated) {
  return clampDaytimePercent(simulated);
}

const loadScenarioSimulatorState = () => {
  try {
    const raw = localStorage.getItem(SCENARIO_SIMULATOR_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
};

/** Persist What-If slider snapshot — only call from Apply or Set to Default (not on every slider move). */
function persistScenarioSimulatorState(payload) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCENARIO_SIMULATOR_STATE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Could not persist scenario simulator state:', error);
  }
}

const loadAppliedConfig = (systemType) => {
  try {
    const raw = localStorage.getItem(APPLIED_CONFIG_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all?.[systemType] || null;
  } catch (error) {
    return null;
  }
};

const saveAppliedConfig = (systemType, config) => {
  try {
    const raw = localStorage.getItem(APPLIED_CONFIG_KEY);
    const all = (raw ? JSON.parse(raw) : null) || {};
    all[systemType] = config;
    localStorage.setItem(APPLIED_CONFIG_KEY, JSON.stringify(all));
  } catch (error) {
    console.warn('Could not save applied config:', error);
  }
};

/** Post–Apply Configuration: shared slider snapshot survives tab / route changes until Set to Default */
const SCENARIO_APPLIED_SLIDERS_KEY = 'solar_scenario_applied_sliders_v1';

function loadAppliedSlidersSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SCENARIO_APPLIED_SLIDERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveAppliedSlidersSnapshot(snapshot) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCENARIO_APPLIED_SLIDERS_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Could not save applied sliders snapshot:', error);
  }
}

function clearAppliedSlidersSnapshot() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SCENARIO_APPLIED_SLIDERS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * True when shared Apply inputs match last successful Apply.
 * Tab (Off-Grid / Grid-Tied / Hybrid) is excluded — preset switches only change how shared sliders are interpreted,
 * not whether there are unsaved changes. Daytime Use is fully shared across all three, so it's compared directly.
 */
function sharedApplyInputsMatch(last, budget, panelSize, batterySizePercent, rate, daytimeNow) {
  if (!last) return false;
  const near = (x, y, eps) => Math.abs(Number(x) - Number(y)) <= eps;
  const lastDaytime = clampDaytimePercent(Number(last.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT));
  const pLast = Number(last.panelSize);
  const pNow = Number(panelSize);
  const panelOk =
    Number.isFinite(pLast) &&
    Number.isFinite(pNow) &&
    Math.abs(pLast - pNow) <= 0.0015; /* slider float + 0.05 steps — stable across preset tabs */

  return (
    near(last.budget, budget, 1) &&
    panelOk &&
    near(last.batterySizePercent ?? 100, batterySizePercent ?? 100, 0.05) &&
    near(last.rate, rate, 1e-3) &&
    near(lastDaytime, daytimeNow, 0.05)
  );
}

/**
 * ScenarioSimulator - Interactive what-if analysis tool
 * Allows users to explore different solar system configurations in real-time
 * 
 * @param {Object} props - Component props
 * @param {Object} props.baseParameters - Original calculator parameters
 * @param {Object} [props.mainCalculatorBaseParameters] - Raw main calculator inputs used by Set to Default baseline
 * @param {Object} props.baseResults - Original calculation results
 * @param {Function} props.onApply - Callback when user applies simulated configuration
 * @param {Function} props.onCalculate - Function to perform calculations with new parameters
 * @param {Function} [props.onSetToDefault] - Called after What-If resets to defaults (e.g. clear Summary tab What-If overlay)
 * @param {'offgrid'|'gridtied'|'gridtied_copy'} [props.recommendedSystemType] - Default system type from System Comparison (budget thresholds)
 */
const ScenarioSimulator = ({
  baseParameters,
  mainCalculatorBaseParameters,
  baseResults,
  sunPeakHoursData,
  onApply,
  onCalculate,
  onSetToDefault,
  recommendedSystemType
}) => {
  const defaultBaseParameters = mainCalculatorBaseParameters || baseParameters;
  const storedState = loadScenarioSimulatorState();
  const appliedSlidersSnap = useMemo(() => loadAppliedSlidersSnapshot(), []);
  const useComparisonDefaults = recommendedSystemType != null;
  // Roof area & tilt follow calculator input (not slider-controlled)
  const baseRoofArea = Number(baseParameters?.area) || 50;
  const isConsumptionMode = (baseParameters?.calculationMode || defaultBaseParameters?.calculationMode) === 'consumption';
  const baseMonthlyConsumptionKwh = Number(baseParameters?.monthlyConsumptionKwh || defaultBaseParameters?.monthlyConsumptionKwh) || null;
  const baseTiltAngle =
    baseParameters?.tilt != null && baseParameters?.tilt !== '' && !Number.isNaN(Number(baseParameters.tilt))
      ? Number(baseParameters.tilt)
      : OPTIMAL_TILT;

  // Start at System Comparison card max (same as slider max) so first paint shows true range position
  const [simulatedBudget, setSimulatedBudget] = useState(() => {
    if (appliedSlidersSnap?.budget != null && Number.isFinite(Number(appliedSlidersSnap.budget))) {
      return Number(appliedSlidersSnap.budget);
    }
    if (storedState?.budget != null && Number.isFinite(Number(storedState.budget))) {
      return Number(storedState.budget);
    }
    return getInitialSimulatedBudgetMax({ baseParameters, baseResults, recommendedSystemType, storedState });
  });
  const [simulatedPanelSize, setSimulatedPanelSize] = useState(() => {
    if (appliedSlidersSnap?.panelSize != null && Number.isFinite(Number(appliedSlidersSnap.panelSize))) {
      return clampPanelSizeToInputRange(appliedSlidersSnap.panelSize);
    }
    const initialType = resolveInitialScenarioSystemType({
      recommendedSystemType,
      storedState,
      baseParameters
    });
    const appliedInit = loadAppliedConfig(initialType);
    const defaultsPs = Number(baseParameters?.panelSize) || 0.6;
    return resolveScenarioPanelSize(initialType, baseParameters, appliedInit, defaultsPs);
  });
  const resolveInitialBatteryPercent = () => {
    if (
      appliedSlidersSnap?.batterySizePercent != null &&
      Number.isFinite(Number(appliedSlidersSnap.batterySizePercent))
    ) {
      return Math.min(100, Math.max(0, Number(appliedSlidersSnap.batterySizePercent)));
    }
    if (
      storedState?.batterySizePercent != null &&
      Number.isFinite(Number(storedState.batterySizePercent))
    ) {
      return Math.min(100, Math.max(0, Number(storedState.batterySizePercent)));
    }
    return Math.min(100, Math.max(0, Number(baseParameters?.batterySizePercent) || 100));
  };
  // Off-Grid and Hybrid share this one Battery Size value — a manual drag on either tab writes
  // into it, so moving one always moves the other. Only Grid-Tied stays fixed at 0% (no battery).
  const [simulatedBatterySizePercent, setSimulatedBatterySizePercent] = useState(resolveInitialBatteryPercent);
  const [daytimeInfoOpen, setDaytimeInfoOpen] = useState(false);
  // Daytime Use always starts from the calculator's own input — same value System Comparison
  // uses — for every preset including Off-Grid. (Previously Off-Grid alone defaulted to a
  // hardcoded 100% here, which silently diverged from System Comparison's Estimated Annual
  // Savings for Off-Grid whenever the calculator's actual Daytime Use wasn't 100%, and also
  // made isAtDefault/canApply disagree with the freshly-initialized slider.)
  const [simulatedDaytimeUsePercent, setSimulatedDaytimeUsePercent] = useState(() => {
    if (appliedSlidersSnap?.daytimeUsePercent != null && Number.isFinite(Number(appliedSlidersSnap.daytimeUsePercent))) {
      return clampDaytimePercent(Number(appliedSlidersSnap.daytimeUsePercent));
    }
    return clampDaytimePercent(
      useComparisonDefaults
        ? baseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT
        : storedState?.daytimeUsePercent ?? baseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT
    );
  });
  const [simulatedRate, setSimulatedRate] = useState(() => {
    if (appliedSlidersSnap?.rate != null && Number.isFinite(Number(appliedSlidersSnap.rate))) {
      const r = Number(appliedSlidersSnap.rate);
      return r > 0 ? r : 10;
    }
    const r = Number(
      useComparisonDefaults ? baseParameters?.rate : storedState?.rate ?? baseParameters?.rate
    );
    return Number.isFinite(r) && r > 0 ? r : 10;
  });
  
  // Show main calculator results until scenario calc returns (avoids empty first frame; refreshed immediately)
  const [simulatedResults, setSimulatedResults] = useState(() => baseResults ?? null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedSystemType, setSelectedSystemType] = useState(() => {
    const fromSnap = appliedSlidersSnap?.selectedSystemType;
    if (typeof fromSnap === 'string') {
      return normalizeScenarioPresetType(fromSnap);
    }
    return normalizeScenarioPresetType(
      resolveInitialScenarioSystemType({ recommendedSystemType, storedState, baseParameters })
    );
  });

  /** When true, main calculator / preset effects must not overwrite What-If sliders until Set to Default */
  const [appliedSlidersLocked, setAppliedSlidersLocked] = useState(() => !!appliedSlidersSnap);

  /**
   * After Set to Default, keep the control inactive until the user moves a slider again (all presets).
   */
  const [blockSetDefaultUntilSliderChange, setBlockSetDefaultUntilSliderChange] = useState(false);

  /**
   * After Apply without syncing budget, investment min/max stay fixed so the budget thumb does not jump when map panel updates.
   * Set true when the user moves the budget slider to resume live min/max from capacity.
   */
  const [unfreezeBudgetSliderRange, setUnfreezeBudgetSliderRange] = useState(false);

  /** Slider values at last successful Apply — used to detect unsaved tweaks and to keep results on-screen until Apply */
  const [lastAppliedSnapshot, setLastAppliedSnapshot] = useState(() => {
    const s = appliedSlidersSnap;
    if (!s) return null;
    const st = s.selectedSystemType;
    const stNorm = typeof st === 'string' ? normalizeScenarioPresetType(st) : 'gridtied';
    return {
      budget: Number(s.budget),
      panelSize: clampPanelSizeToInputRange(s.panelSize),
      batterySizePercent:
        s.batterySizePercent != null && Number.isFinite(Number(s.batterySizePercent))
          ? Number(s.batterySizePercent)
          : 100,
      daytimeUsePercent: Number(s.daytimeUsePercent),
      rate: Number(s.rate),
      selectedSystemType: stNorm
    };
  });

  /** Simulated results last committed by Apply (shown when sliders differ before next Apply) */
  const [committedScenarioCache, setCommittedScenarioCache] = useState(() => {
    const next = emptyScenarioCache();
    if (!appliedSlidersSnap) return next;
    SCENARIO_SYSTEM_TYPES.forEach((systemType) => {
      const cfg = loadAppliedConfig(systemType);
      if (cfg?.results) {
        next[systemType] = {
          ...cfg.results,
          systemType: cfg.results.systemType ?? systemType
        };
      }
    });
    return next;
  });

  const [scenarioCacheByType, setScenarioCacheByType] = useState(() => emptyScenarioCache());
  const scenarioCacheRef = useRef(emptyScenarioCache());
  /** Prevent stale async preview results from older slider states from overwriting the latest UI state. */
  const livePreviewRunRef = useRef(0);
  /**
   * Synchronous re-entrancy guard for Apply Configuration: canApply/isCalculating disable the
   * button reactively, but that only takes effect on the next render — a fast repeat click (or
   * click-and-hold) can fire handleApplySimulation again before that re-render lands. This ref
   * blocks any second invocation immediately, with no render round-trip to wait on.
   */
  const isApplyingRef = useRef(false);
  useEffect(() => {
    scenarioCacheRef.current = scenarioCacheByType;
  }, [scenarioCacheByType]);


  /**
   * Which What-If sliders the user actually moved (since last Apply / Set to Default).
   * Apply Configuration merges main calculator values for untouched fields so only adjusted inputs sync downstream.
   */
  const applyTouchesRef = useRef({
    budget: false,
    panelSize: false,
    batterySize: false,
    daytimeUsePercent: false,
    rate: false
  });
  /** Keep investment pinned at profile max until manually adjusted. */
  const budgetWasAdjustedRef = useRef(false);

  /** Calculator electricity rate — used for Off-Grid (rate slider locked to this value). */
  const baseRateVal = Number(baseParameters?.rate) > 0 ? Number(baseParameters.rate) : 10;

  /**
   * Keep What-If panel kWp aligned with main calculator when the user has not moved the panel slider here.
   * If they adjusted panel in What-If, do not overwrite from map — avoids non‑adjusted sliders moving / syncing.
   */
  useEffect(() => {
    if (appliedSlidersLocked) return;
    if (applyTouchesRef.current.panelSize) return;
    setSimulatedPanelSize(clampPanelSizeToInputRange(baseParameters?.panelSize));
  }, [baseParameters?.panelSize, appliedSlidersLocked]);

  /**
   * Keep What-If battery slider aligned with main calculator battery input
   * while sliders are not locked by an applied What-If configuration.
   */
  useEffect(() => {
    if (appliedSlidersLocked) return;
    if (applyTouchesRef.current.batterySize) return;
    setSimulatedBatterySizePercent(
      Math.min(100, Math.max(0, Number(baseParameters?.batterySizePercent) || 100))
    );
  }, [baseParameters?.batterySizePercent, appliedSlidersLocked]);

  useEffect(() => {
    if (appliedSlidersLocked) return;
    if (selectedSystemType !== 'offgrid') return;
    setSimulatedRate(baseRateVal);
  }, [selectedSystemType, baseRateVal, appliedSlidersLocked]);

  /**
   * Hard rule, driven by Daytime Use: 100% daytime means every kWh produced is used as it's
   * generated, so there's nothing left to store — Battery Size snaps to 0%. Anything less than
   * 100% means some load falls at night, which must come from storage — Battery Size snaps to
   * 100%. Off-Grid and Hybrid share Battery Size, so this applies on either tab; Grid-Tied has no
   * battery concept and is excluded so dragging its (separately-persisted) Daytime Use never
   * bleeds into Off-Grid/Hybrid's battery value. Only a genuine drag of Daytime Use triggers this
   * — the ref tracks it across tabs so a mere tab switch never re-fires it. Battery Size itself
   * stays a free, always-movable slider: dragging it directly does not touch this ref/effect at
   * all, so a manual battery edit sticks until Daytime Use is dragged again.
   */
  const lastSeenDaytimeForBatteryRuleRef = useRef(simulatedDaytimeUsePercent);
  useEffect(() => {
    const daytimeChanged = lastSeenDaytimeForBatteryRuleRef.current !== simulatedDaytimeUsePercent;
    lastSeenDaytimeForBatteryRuleRef.current = simulatedDaytimeUsePercent;
    if (!daytimeChanged) return;
    if (selectedSystemType === 'gridtied') return;
    setSimulatedBatterySizePercent(clampDaytimePercent(simulatedDaytimeUsePercent) >= 100 ? 0 : 100);
  }, [simulatedDaytimeUsePercent, selectedSystemType]);

  // Always price through the same shared getInvestmentRange the rest of the app uses (System
  // Comparison, Print/Save, onCalculate) — a local hardcoded copy here previously drifted out
  // of sync with those, so the Investment slider bounded budget to a different range than
  // onCalculate actually priced against, making capacity silently diverge from the
  // Summary-synced baseline. Off-Grid/Hybrid are battery-aware (Grid-Tied-equivalent cost +
  // actual battery cost); daytime/battery default to the live sliders when not passed in.
  const getInvestmentProfile = useCallback((systemType, baseCapacity, liveInputs = {}) => {
    const targetCapacity = baseCapacity;
    const range = getInvestmentRange({
      systemType,
      capacity: targetCapacity,
      annualProduction: liveInputs.annualProduction ?? baseResults?.annualProduction,
      daytimeUsePercent: liveInputs.daytimeUsePercent ?? simulatedDaytimeUsePercent,
      batterySizePercent: liveInputs.batterySizePercent ?? simulatedBatterySizePercent
    });
    const rates = systemType === 'offgrid' ? OFF_GRID : systemType === 'gridtied' ? GRID_TIED : HYBRID;
    const perKwMin = rates.perKwMin;
    const perKwMax = rates.perKwMax;

    const minInvestment = range.min;
    const maxInvestment = range.max;
    const typicalInvestment = range.typical;

    return {
      targetCapacity,
      perKwMin,
      perKwMax,
      minInvestment,
      maxInvestment,
      typicalInvestment
    };
  }, []);

  const baseAreaForProfile = Number(baseParameters?.area) || 50;
  const basePanelForProfile = Number(baseParameters?.panelSize) || 0.6;
  const baseCapacityForProfile =
    Number(baseResults?.capacity) || calculateTechnicalCapacity(baseAreaForProfile, basePanelForProfile);

  /** Clamp budget to the investment slider range for a given system type (shared slider value across presets) */
  const clampBudgetToSystemProfile = useCallback(
    (systemType, budgetValue) => {
      const profile = getInvestmentProfile(systemType, baseCapacityForProfile);
      const maxB = profile.maxInvestment > 0 ? profile.maxInvestment : 50000;
      let minB = Math.max(50000, Math.round(maxB * 0.25));
      if (minB >= maxB) {
        minB = Math.max(50000, maxB - 10000);
      }
      const raw = budgetValue ?? maxB;
      return Math.min(maxB, Math.max(minB, raw));
    },
    [getInvestmentProfile, baseCapacityForProfile]
  );

  /** Live What-If params for each preset — shared sliders, per-type budget/daytime/rate rules. */
  const buildLiveScenarioParamsForType = useCallback(
    (st) => {
      const budgetClamped = clampBudgetToSystemProfile(st, simulatedBudget ?? undefined);
      const rateForSt = st === 'offgrid' ? baseRateVal : Number(simulatedRate) > 0 ? Number(simulatedRate) : 10;
      const daytimeSourceForType = simulatedDaytimeUsePercent;
      return {
        ...baseParameters,
        area: baseRoofArea,
        budget: budgetClamped,
        tilt: baseTiltAngle,
        panelSize: clampPanelSizeToInputRange(simulatedPanelSize),
        batterySizePercent: getScenarioBatteryPercent(st, simulatedBatterySizePercent),
        daytimeUsePercent: getScenarioDaytimeUsePercent(st, daytimeSourceForType),
        rate: rateForSt,
        systemType: st,
        // Whether the user has ever manually dragged the Investment/Budget slider this session.
        // While untouched, Budget auto-tracks the profile's max — onCalculate uses this to skip
        // the in-range/out-of-range budget math entirely and always resolve System Capacity to
        // profileMaxCapacity, so dragging only Daytime Use (which shifts the daytime-dependent
        // investment range for Off-Grid/Hybrid) can never nudge an untouched Budget in or out of
        // that range and silently change System Capacity as a side effect.
        budgetTouched: budgetWasAdjustedRef.current
      };
    },
    [
      baseParameters,
      baseRoofArea,
      baseTiltAngle,
      simulatedBudget,
      simulatedPanelSize,
      simulatedBatterySizePercent,
      simulatedDaytimeUsePercent,
      simulatedRate,
      baseRateVal,
      clampBudgetToSystemProfile
    ]
  );

  /**
   * Calculator pass for all three presets using **only** `buildLiveScenarioParamsForType`.
   * The debounced preview effect, Simulated Results, Apply → System Comparison, and `saveAppliedConfig().results`
   * all rely on this single path so annual savings and related metrics cannot drift.
   */
  const calculateLiveScenarioResultsByType = useCallback(async () => {
    if (!onCalculate) return {};
    const pairs = await Promise.all(
      SCENARIO_SYSTEM_TYPES.map(async (st) => {
        const params = buildLiveScenarioParamsForType(st);
        const r = await Promise.resolve(onCalculate(params));
        return [st, r];
      })
    );
    return Object.fromEntries(
      pairs
        .filter(([, r]) => r)
        .map(([st, r]) => [st, { ...r, systemType: r.systemType ?? st }])
    );
  }, [onCalculate, buildLiveScenarioParamsForType]);

  /**
   * Guarantee a complete per-category result bundle.
   * If any category is missing from a pass, compute it directly in background without requiring tab switches.
   */
  const ensureCompleteScenarioResultsBundle = useCallback(
    async (partialByType) => {
      let merged = { ...(partialByType || {}) };
      const backfillOnce = async (types) => {
        if (!types.length || !onCalculate) return;
        const backfillPairs = await Promise.all(
          types.map(async (st) => {
            try {
              const params = buildLiveScenarioParamsForType(st);
              const r = await Promise.resolve(onCalculate(params));
              if (!r) return [st, null];
              return [st, { ...r, systemType: r.systemType ?? st }];
            } catch (error) {
              console.warn('Background backfill failed for scenario type:', st, error);
              return [st, null];
            }
          })
        );
        backfillPairs.forEach(([st, r]) => {
          if (r) merged[st] = r;
        });
      };

      const missingTypesFirstPass = SCENARIO_SYSTEM_TYPES.filter((st) => !merged?.[st]);
      await backfillOnce(missingTypesFirstPass);
      const missingTypesSecondPass = SCENARIO_SYSTEM_TYPES.filter((st) => !merged?.[st]);
      // Retry once more before fallback to cached values; helps keep Hybrid annual savings fresh in background.
      await backfillOnce(missingTypesSecondPass);

      if (missingTypesSecondPass.length > 0) {
        const stillMissing = SCENARIO_SYSTEM_TYPES.filter((st) => !merged?.[st]);
        if (stillMissing.length > 0) {
          console.warn('Using cached scenario results for still-missing categories:', stillMissing);
        }
      }

      merged = Object.fromEntries(
        SCENARIO_SYSTEM_TYPES.map((st) => [
          st,
          merged[st] || scenarioCacheRef.current[st] || committedScenarioCache[st] || null
        ])
      );
      return merged;
    },
    [onCalculate, buildLiveScenarioParamsForType, committedScenarioCache]
  );

  /**
   * Sliders that both were interacted with and still differ from main calculator values.
   * If a control was never moved, or was moved back to match the map default, it does not sync on Apply.
   */
  const getEffectiveApplyTouches = useCallback(() => {
    const raw = applyTouchesRef.current;
    const baseBud = Number(baseParameters?.budget);
    const hasBaseBudget = Number.isFinite(baseBud) && baseBud > 0;
    const invProfile = getInvestmentProfile(selectedSystemType, baseCapacityForProfile);
    const budgetMaxForSlider =
      invProfile.maxInvestment > 0 ? invProfile.maxInvestment : 50000;
    const simBud = Number(simulatedBudget ?? budgetMaxForSlider);
    const budgetMatchesBase = hasBaseBudget && Math.abs(simBud - baseBud) <= 1;

    const basePanel = clampPanelSizeToInputRange(baseParameters?.panelSize);
    const simPanel = clampPanelSizeToInputRange(simulatedPanelSize);
    const panelMatchesBase = Math.abs(simPanel - basePanel) <= 0.02;
    const simBattery = Math.min(100, Math.max(0, Number(simulatedBatterySizePercent) || 0));
    const baseBattery = Math.min(100, Math.max(0, Number(baseParameters?.batterySizePercent) || 100));
    const batteryMatchesBase = Math.abs(simBattery - baseBattery) <= 0.05;

    const baseDay = clampDaytimePercent(baseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT);
    const simDay = clampDaytimePercent(simulatedDaytimeUsePercent);
    const daytimeMatchesBase = Math.abs(simDay - baseDay) <= 0.05;

    const baseRateNum = Number(baseParameters?.rate) > 0 ? Number(baseParameters.rate) : 10;
    const simRateNum = Number(simulatedRate) > 0 ? Number(simulatedRate) : 10;
    const rateMatchesBase = Math.abs(simRateNum - baseRateNum) <= 0.01;

    return {
      budget: Boolean(raw.budget && !budgetMatchesBase),
      panelSize: Boolean(raw.panelSize && !panelMatchesBase),
      batterySize: Boolean(raw.batterySize && !batteryMatchesBase),
      daytimeUsePercent: Boolean(raw.daytimeUsePercent && !daytimeMatchesBase),
      rate: Boolean(raw.rate && selectedSystemType !== 'offgrid' && !rateMatchesBase)
    };
  }, [
    baseParameters,
    baseCapacityForProfile,
    getInvestmentProfile,
    simulatedBudget,
    simulatedPanelSize,
    simulatedBatterySizePercent,
    simulatedDaytimeUsePercent,
    simulatedRate,
    selectedSystemType
  ]);

  /**
   * Params for **map form merge** and persisted apply **inputs** (budget, rate, …) when Apply runs.
   * Untouched sliders fall back to `baseParameters`. Does **not** define scenario metrics: those always come
   * from `calculateLiveScenarioResultsByType` (live sliders) so System Comparison matches Simulated Results.
   */
  const buildApplyParamsForType = useCallback(
    (st, touchFlags) => {
      const live = buildLiveScenarioParamsForType(st);
      const t = touchFlags ?? applyTouchesRef.current;
      const baseBud = Number(baseParameters?.budget);
      const baseBudget = Number.isFinite(baseBud) && baseBud > 0 ? baseBud : undefined;
      const basePanel = clampPanelSizeToInputRange(baseParameters?.panelSize);
      const baseDay = clampDaytimePercent(baseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT);
      const baseRateNum = Number(baseParameters?.rate) > 0 ? Number(baseParameters.rate) : 10;

      /**
       * If budget was not adjusted in What-If, never propagate the scenario budget slider into Apply for any preset
       * (off-grid / grid-tied / hybrid). Always derive from main calculator map budget (or last saved / default), then clamp per type.
       */
      let budget = live.budget;
      if (!t.budget) {
        const mapBudget =
          baseBudget != null
            ? baseBudget
            : Number(baseParameters?.budget) > 0
              ? Number(baseParameters.budget)
              : null;
        const budgetBasis =
          mapBudget != null
            ? mapBudget
            : (() => {
                const prevCfg = loadAppliedConfig(st);
                return prevCfg?.budget != null && Number.isFinite(Number(prevCfg.budget))
                  ? Number(prevCfg.budget)
                  : 200000;
              })();
        budget = clampBudgetToSystemProfile(st, budgetBasis);
      }

      let panelSize = live.panelSize;
      if (!t.panelSize) {
        panelSize = basePanel;
      }
      const daytimeSource = t.daytimeUsePercent ? simulatedDaytimeUsePercent : baseDay;
      const daytimeUsePercent = getScenarioDaytimeUsePercent(st, daytimeSource);

      let batterySizePercent = live.batterySizePercent;
      if (!t.batterySize) {
        batterySizePercent = Math.min(100, Math.max(0, Number(baseParameters?.batterySizePercent) || 100));
      }
      batterySizePercent = getScenarioBatteryPercent(st, batterySizePercent);

      let rate = live.rate;
      if (!t.rate) {
        rate = st === 'offgrid' ? baseRateVal : baseRateNum;
      }

      return {
        ...live,
        budget,
        panelSize,
        batterySizePercent,
        daytimeUsePercent,
        rate
      };
    },
    [
      buildLiveScenarioParamsForType,
      baseParameters,
      baseRateVal,
      clampBudgetToSystemProfile,
      simulatedDaytimeUsePercent,
      simulatedBatterySizePercent,
      selectedSystemType
    ]
  );

  const getSystemDefaults = useCallback((systemType) => {
    const baseArea = Number(defaultBaseParameters?.area) || 50;
    const basePanel = Number(defaultBaseParameters?.panelSize) || 0.6;
    const baseCapacity = Number(baseResults?.capacity) || calculateTechnicalCapacity(baseArea, basePanel);
    const profile = getInvestmentProfile(systemType, baseCapacity);
    const isGridTiedVariant = systemType === 'gridtied' || systemType === 'gridtied_copy';
    const useUserRoofAreaDefault = systemType === 'offgrid' || isGridTiedVariant || systemType === 'hybrid';

    // Budget default: user map budget (main calculator) as-is.
    const mapBudget = Number(defaultBaseParameters?.budget);
    const budgetBasis =
      Number.isFinite(mapBudget) && mapBudget > 0 ? mapBudget : profile.maxInvestment;
    const derivedBudgetFromUserInput = budgetBasis;

    return {
      area: useUserRoofAreaDefault ? baseArea : estimateAreaForTargetCapacity(profile.targetCapacity, basePanel, baseArea),
      budget: derivedBudgetFromUserInput,
      tilt:
        defaultBaseParameters?.tilt != null &&
        defaultBaseParameters?.tilt !== '' &&
        !Number.isNaN(Number(defaultBaseParameters.tilt))
          ? Number(defaultBaseParameters.tilt)
          : OPTIMAL_TILT,
      panelSize: basePanel
    };
  }, [defaultBaseParameters, baseResults, getInvestmentProfile]);

  /**
   * Params for Set to Default and initial prefetch: aligned with main calculator (map) inputs from Calculate,
   * not System Comparison card max — sliders reset to the user's map input defaults.
   */
  const buildDefaultScenarioParams = useCallback(
    (systemType) => {
      const defaults = getSystemDefaults(systemType);
      const panelSize = clampPanelSizeToInputRange(defaultBaseParameters?.panelSize ?? defaults.panelSize);
      const baseBudget = Number(defaultBaseParameters?.budget);
      const budgetBasis =
        Number.isFinite(baseBudget) && baseBudget > 0 ? baseBudget : defaults.budget;
      const budget = budgetBasis;
      const daytimeForType = clampDaytimePercent(defaultBaseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT);
      const rateForParams =
        systemType === 'offgrid'
          ? Number(defaultBaseParameters?.rate) > 0
            ? Number(defaultBaseParameters.rate)
            : baseRateVal
          : Number(defaultBaseParameters?.rate) > 0
            ? Number(defaultBaseParameters.rate)
            : 10;
      const defaultArea = Number(defaultBaseParameters?.area);
      const defaultTilt =
        defaultBaseParameters?.tilt != null &&
        defaultBaseParameters?.tilt !== '' &&
        !Number.isNaN(Number(defaultBaseParameters.tilt))
          ? Number(defaultBaseParameters.tilt)
          : OPTIMAL_TILT;
      return {
        ...defaultBaseParameters,
        area: Number.isFinite(defaultArea) && defaultArea > 0 ? defaultArea : baseRoofArea,
        budget,
        tilt: defaultTilt,
        panelSize,
        batterySizePercent: getScenarioBatteryPercent(
          systemType,
          Math.min(100, Math.max(0, Number(defaultBaseParameters?.batterySizePercent) || 100))
        ),
        daytimeUsePercent: daytimeForType,
        rate: rateForParams,
        systemType
      };
    },
    [getSystemDefaults, defaultBaseParameters, baseRoofArea, baseRateVal]
  );

  /** Prefetch all three system profiles — or restore cached results from last Apply when revisiting the app */
  useEffect(() => {
    if (!onCalculate) {
      setScenarioCacheByType(emptyScenarioCache());
      return;
    }
    if (loadAppliedSlidersSnapshot()) {
      const next = emptyScenarioCache();
      SCENARIO_SYSTEM_TYPES.forEach((systemType) => {
        const cfg = loadAppliedConfig(systemType);
        if (cfg?.results) {
          next[systemType] = {
            ...cfg.results,
            systemType: cfg.results.systemType ?? systemType
          };
        }
      });
      setScenarioCacheByType(next);
      return;
    }
    let cancelled = false;
    (async () => {
      const next = emptyScenarioCache();
      await Promise.all(
        SCENARIO_SYSTEM_TYPES.map(async (systemType) => {
          const params = buildDefaultScenarioParams(systemType);
          try {
            const r = await Promise.resolve(onCalculate(params));
            if (!cancelled && r) {
              next[systemType] = {
                ...r,
                systemType: r.systemType ?? systemType
              };
            }
          } catch (err) {
            console.warn('Scenario prefetch failed:', systemType, err);
          }
        })
      );
      if (!cancelled) {
        setScenarioCacheByType(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onCalculate, buildDefaultScenarioParams]);

  /**
   * Match Summary Results sizing logic:
   * rpkwp -> N (with step rules) -> capacity, then panel count.
   */
  const calculateSystemSpecs = useCallback((area, panelSize) => {
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

    const capacity = N * panelSizeVal;
    const panelCount = panelSizeVal > 0 ? Math.round(capacity / panelSizeVal) : 0;
    return { capacity, panelCount };
  }, []);

  const handleSystemTypeSelect = (event, newType) => {
    if (!newType) return;
    setBlockSetDefaultUntilSliderChange(false);
    const nextType = normalizeScenarioPresetType(newType);
    setSelectedSystemType(nextType);

    // Sliders (Daytime Use, Battery Size, Panel Size, Rate, Budget) are shared state that
    // starts from the user's own main-calculator input and never gets rewritten just because
    // the selected tab changed — switching Off-Grid <-> Grid-Tied <-> Hybrid must show exactly
    // what's already on the sliders, consistently, whether or not Apply Configuration has run
    // yet. Only Apply Configuration (or a direct drag) changes these values.
    const panelForCalc = clampPanelSizeToInputRange(simulatedPanelSize);
    const budgetForCalc = simulatedBudget ?? budgetSliderMaxUi;
    const applied = loadAppliedConfig(nextType);

    const prefetched = scenarioCacheRef.current[nextType];
    if (prefetched) {
      setSimulatedResults(prefetched);
    } else if (applied?.results) {
      setSimulatedResults(applied.results);
      // Keep in-memory cache aligned with saved applied config so tab switches stay consistent
      setScenarioCacheByType((prev) =>
        prev[nextType]
          ? prev
          : {
              ...prev,
              [nextType]: {
                ...applied.results,
                systemType: applied.results.systemType ?? nextType
              }
            }
      );
    } else if (!onCalculate) {
      setSimulatedResults(null);
    } else {
      // No cache yet and nothing applied: one immediate run so the panel matches this tab
      // (debounced effect also runs), using the exact same slider values already displayed —
      // Off-Grid's rate stays pinned to the calculator's rate since that slider is locked there.
      const rateForParams =
        nextType === 'offgrid'
          ? baseRateVal
          : Number(simulatedRate) > 0
            ? Number(simulatedRate)
            : 10;
      const params = {
        ...baseParameters,
        area: baseRoofArea,
        budget: budgetForCalc,
        tilt: baseTiltAngle,
        panelSize: panelForCalc,
        daytimeUsePercent: clampDaytimePercent(simulatedDaytimeUsePercent),
        rate: rateForParams,
        systemType: nextType
      };
      setIsCalculating(true);
      Promise.resolve(onCalculate(params))
        .then((results) => {
          if (results) setSimulatedResults(results);
        })
        .catch((error) => {
          console.error('System type calculation failed:', error);
        })
        .finally(() => {
          setIsCalculating(false);
        });
    }
  };

  // Investment must be parallel with System Comparison for every preset — computed here by
  // calling the exact same computeSystemComparisonScenarios() System Comparison itself uses
  // (same baseParameters/baseResults), instead of a second, independently-parameterized
  // getInvestmentRange() call that can drift out of sync with it one field at a time.
  const comparisonScenarios = useMemo(
    () => computeSystemComparisonScenarios(baseParameters, baseResults),
    [baseParameters, baseResults]
  );
  const comparisonScenarioId =
    selectedSystemType === 'offgrid' ? 'budget' : selectedSystemType === 'gridtied' ? 'balanced' : 'premium';
  const selectedComparisonScenario = comparisonScenarios.find((s) => s.id === comparisonScenarioId);
  const selectedProfile = selectedComparisonScenario
    ? {
        targetCapacity: selectedComparisonScenario.capacity,
        minInvestment: selectedComparisonScenario.cost.min,
        maxInvestment: selectedComparisonScenario.cost.max,
        typicalInvestment: selectedComparisonScenario.cost.typical
      }
    : getInvestmentProfile(selectedSystemType, baseCapacityForProfile, {
        annualProduction: simulatedResults?.annualProduction ?? baseResults?.annualProduction
      });
  // Slider max = exact max investment from System Comparison; the slider itself keeps a lower,
  // wider min (25% of max) so it stays useful for exploring budgets below the System Comparison
  // figure. The displayed "Investment: X - Y" text is a separate value below, pinned to System
  // Comparison's own min so the two views always show the same headline number.
  const budgetSliderMax = selectedProfile.maxInvestment > 0 ? selectedProfile.maxInvestment : 50000;
  let budgetSliderMin = Math.max(50000, Math.round(budgetSliderMax * 0.25));
  if (budgetSliderMin >= budgetSliderMax) {
    budgetSliderMin = Math.max(50000, budgetSliderMax - 10000);
  }
  const investmentDisplayMin =
    selectedProfile.minInvestment > 0 ? selectedProfile.minInvestment : budgetSliderMin;
  const investmentDisplayMax = budgetSliderMax;
  const budgetSliderStep = 10000;
  const budgetMidMark =
    selectedProfile.typicalInvestment >= budgetSliderMin && selectedProfile.typicalInvestment <= budgetSliderMax
      ? selectedProfile.typicalInvestment
      : Math.round((budgetSliderMin + budgetSliderMax) / 2);
  const budgetSliderMarks = [
    { value: budgetSliderMin, label: String(Math.round(budgetSliderMin / 1000)) },
    { value: budgetMidMark, label: String(Math.round(budgetMidMark / 1000)) },
    { value: budgetSliderMax, label: String(Math.round(budgetSliderMax / 1000)) }
  ];

  // Always follow the live investment profile range from System Comparison.
  const budgetSliderMinUi = budgetSliderMin;
  const budgetSliderMaxUi = budgetSliderMax;
  const budgetMidMarkUi = budgetMidMark;
  const budgetSliderMarksUi = budgetSliderMarks;
  const investmentDisplayMinUi = investmentDisplayMin;
  const investmentDisplayMaxUi = investmentDisplayMax;

  const currentSliderSnapshot = useMemo(
    () => ({
      budget: simulatedBudget ?? budgetSliderMaxUi,
      panelSize: clampPanelSizeToInputRange(simulatedPanelSize),
      batterySizePercent: Math.min(100, Math.max(0, Number(simulatedBatterySizePercent) || 0)),
      daytimeUsePercent: simulatedDaytimeUsePercent,
      rate: Number(simulatedRate),
      selectedSystemType
    }),
    [
      simulatedBudget,
      budgetSliderMaxUi,
      simulatedPanelSize,
      simulatedBatterySizePercent,
      simulatedDaytimeUsePercent,
      simulatedRate,
      selectedSystemType
    ]
  );

  const isDirtyVsLastApply =
    Boolean(appliedSlidersLocked && lastAppliedSnapshot) &&
    !sharedApplyInputsMatch(
      lastAppliedSnapshot,
      simulatedBudget ?? budgetSliderMaxUi,
      clampPanelSizeToInputRange(simulatedPanelSize),
      Math.min(100, Math.max(0, Number(simulatedBatterySizePercent) || 0)),
      Number(simulatedRate),
      clampDaytimePercent(simulatedDaytimeUsePercent)
    );

  // Keep investment at profile max until user adjustment; then preserve user-selected value (clamped to range).
  // Stops once Apply has locked the sliders (matches every other "keep aligned pre-Apply" effect
  // in this file, e.g. panel size/battery). Without this guard, Apply's own onApply callback
  // updates calculatorResults -> baseResults -> budgetSliderMax shifts -> this effect silently
  // re-pins simulatedBudget to the new max even though the user never touched Budget, which then
  // makes isDirtyVsLastApply see a "changed" budget and immediately re-enable Apply on its own.
  useEffect(() => {
    if (appliedSlidersLocked) return;
    if (budgetSliderMax <= 0) return;
    if (!budgetWasAdjustedRef.current) {
      if (simulatedBudget !== budgetSliderMax) {
        setSimulatedBudget(budgetSliderMax);
      }
      return;
    }
    if (simulatedBudget == null) return;
    if (simulatedBudget < budgetSliderMin) {
      setSimulatedBudget(budgetSliderMin);
    } else if (simulatedBudget > budgetSliderMax) {
      setSimulatedBudget(budgetSliderMax);
    }
  }, [budgetSliderMin, budgetSliderMax, simulatedBudget, appliedSlidersLocked]);

  /**
   * Determine system type based on budget
   */
  const getSystemType = useCallback((budget) => {
    if (budget < 150000) return 'Budget Grid-Tied';
    if (budget < 300000) return 'Standard Grid-Tied';
    if (budget < 450000) return 'Premium Grid-Tied';
    return 'Hybrid with Battery';
  }, []);

  /**
   * Check if tilt angle is optimal for Philippines
   * Optimal range: 10-20 degrees for locations between 8°N-18°N
   */
  const isOptimalTilt = useCallback((tilt) => {
    return tilt >= 10 && tilt <= 20;
  }, []);

  /**
   * Calculate tilt efficiency percentage
   * Optimal tilt = 100%, decreases with deviation
   */
  const calculateTiltEfficiency = useCallback((tilt) => {
    const optimalTilt = 15; // Optimal for Philippines (14.6°N average)
    const deviation = Math.abs(tilt - optimalTilt);
    
    if (deviation === 0) return 100;
    if (deviation <= 5) return Math.max(95, 100 - deviation);
    if (deviation <= 10) return Math.max(90, 100 - deviation * 1.5);
    return Math.max(75, 100 - deviation * 2);
  }, []);

  /**
   * Calculate impact text for parameter changes
   */
  const calculateImpact = useCallback((parameter, newValue, oldValue) => {
    const diff = ((newValue - oldValue) / oldValue) * 100;
    const absDiff = Math.abs(diff);
    
    if (absDiff < 1) return 'No significant change';
    if (diff > 0) return `+${absDiff.toFixed(1)}% increase`;
    return `${absDiff.toFixed(1)}% decrease`;
  }, []);

  /**
   * Real-time What-If preview: same calculator pass as Apply (`calculateLiveScenarioResultsByType`).
   * Debounced 350ms — with effectively no delay, every slider tick during a drag (Rate, Daytime
   * Use, etc.) spawned its own calculateLiveScenarioResultsByType() call for all three presets
   * (each doing real network/compute work via onCalculate). Adjusting more than one slider in
   * quick succession — e.g. Rate then Daytime Use on Off-Grid — could produce several overlapping
   * in-flight calculations; whichever one's runId got invalidated by a later one first fires
   * `if (runId !== livePreviewRunRef.current) return;` and its result is dropped, and any transient
   * failure among the overlapping calls hits the catch-all `setSimulatedResults(baseResults)` reset
   * — either way one preset's numbers intermittently appear to just stop updating. Waiting for the
   * sliders to settle before running one calculation removes the overlap entirely.
   */
  useEffect(() => {
    const runId = livePreviewRunRef.current + 1;
    livePreviewRunRef.current = runId;
    const timeoutId = setTimeout(() => {
      if (!onCalculate) {
        if (runId === livePreviewRunRef.current) {
          setSimulatedResults(baseResults);
        }
        return;
      }

      setIsCalculating(true);
      calculateLiveScenarioResultsByType()
        .then(async (next) => {
          const completeNext = await ensureCompleteScenarioResultsBundle(next);
          if (runId !== livePreviewRunRef.current) return;
          let latestByType = completeNext;
          setScenarioCacheByType((prev) => {
            // Keep every preset row warm in the background on each slider move,
            // even when the user is currently viewing only one selected category.
            latestByType = Object.fromEntries(
              SCENARIO_SYSTEM_TYPES.map((st) => [
                st,
                completeNext[st] || prev[st] || null
              ])
            );
            return latestByType;
          });
          const cur = latestByType[selectedSystemType];
          setSimulatedResults(cur || baseResults);
        })
        .catch((error) => {
          if (runId !== livePreviewRunRef.current) return;
          console.error('Scenario calculation failed:', error);
          setSimulatedResults(baseResults);
        })
        .finally(() => {
          if (runId === livePreviewRunRef.current) {
            setIsCalculating(false);
          }
        });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [
    calculateLiveScenarioResultsByType,
    selectedSystemType,
    baseResults,
    onCalculate,
    ensureCompleteScenarioResultsBundle
  ]);

  const handleApplySimulation = async () => {
    // Block re-entrant clicks (rapid double-click, click-and-hold) immediately — canApply and
    // isCalculating also disable the button, but only once React re-renders with the new state.
    if (isApplyingRef.current) return;
    isApplyingRef.current = true;
    try {
      await runApplySimulation();
    } finally {
      isApplyingRef.current = false;
    }
  };

  const runApplySimulation = async () => {
    // Invalidate any in-flight live preview response so Apply uses the latest authoritative values.
    livePreviewRunRef.current += 1;
    setBlockSetDefaultUntilSliderChange(false);
    const touchEffective = getEffectiveApplyTouches();
    const applyFieldTouches = touchEffective;

    let resultsBySystemType = {};
    let latestResults = simulatedResults;

    if (onCalculate) {
      setIsCalculating(true);
      try {
        // One authoritative pass for all three categories (same shared sliders every preset reads
        // from — see buildLiveScenarioParamsForType), backfilled by ensureCompleteScenarioResultsBundle
        // for any category a first pass missed. This mirrors exactly what the debounced background
        // live-preview effect already keeps warm in scenarioCacheByType on every slider move, so
        // Apply does not need to redundantly recompute every category two or three more times —
        // that duplicate work was what made Apply feel like it was blocking instead of reusing
        // background-computed results.
        resultsBySystemType = await calculateLiveScenarioResultsByType();
        resultsBySystemType = await ensureCompleteScenarioResultsBundle(resultsBySystemType);
        latestResults = resultsBySystemType[selectedSystemType] ?? simulatedResults;
        if (latestResults) {
          setSimulatedResults(latestResults);
        }
        setScenarioCacheByType((prev) => ({ ...prev, ...resultsBySystemType }));
        setCommittedScenarioCache((prev) => ({ ...prev, ...resultsBySystemType }));
      } catch (error) {
        console.error('Apply configuration calculation failed:', error);
      } finally {
        setIsCalculating(false);
      }
    }

    const hasCompleteResultsBundle =
      !onCalculate ||
      SCENARIO_SYSTEM_TYPES.every((st) => Boolean(resultsBySystemType?.[st]));
    if (!hasCompleteResultsBundle) {
      console.error('Apply configuration aborted: incomplete scenario bundle for offgrid/gridtied/hybrid.');
      return;
    }

    setUnfreezeBudgetSliderRange(false);
    setLastAppliedSnapshot({
      ...currentSliderSnapshot,
      freezeBudgetSliderRange: !touchEffective.budget,
      frozenBudgetSliderMin: budgetSliderMin,
      frozenBudgetSliderMax: budgetSliderMax,
      frozenBudgetSliderMidMark: budgetMidMark
    });

    const resultsToSave = latestResults || simulatedResults;

    if (onCalculate && Object.keys(resultsBySystemType).length > 0) {
      SCENARIO_SYSTEM_TYPES.forEach((st) => {
        const r = resultsBySystemType[st];
        if (!r) return;
        const p = buildApplyParamsForType(st, touchEffective);
        saveAppliedConfig(st, {
          area: baseRoofArea,
          budget: p.budget,
          tilt: baseTiltAngle,
          panelSize: p.panelSize,
          batterySizePercent: p.batterySizePercent,
          daytimeUsePercent: p.daytimeUsePercent,
          rate: p.rate,
          results: r
        });
      });
    } else {
      const pSingle = buildApplyParamsForType(selectedSystemType, touchEffective);
      saveAppliedConfig(selectedSystemType, {
        area: baseRoofArea,
        budget: pSingle.budget,
        tilt: baseTiltAngle,
        panelSize: pSingle.panelSize,
        batterySizePercent: pSingle.batterySizePercent,
        daytimeUsePercent: pSingle.daytimeUsePercent,
        rate: pSingle.rate,
        results: resultsToSave
      });
      if (resultsToSave) {
        setCommittedScenarioCache((prev) => ({
          ...prev,
          [selectedSystemType]: {
            ...resultsToSave,
            systemType: resultsToSave.systemType ?? selectedSystemType
          }
        }));
      }
    }

    const persistedSelectedDaytime = clampDaytimePercent(simulatedDaytimeUsePercent);
    const appliedSnapshotPayload = {
      budget: simulatedBudget ?? budgetSliderMax,
      panelSize: clampPanelSizeToInputRange(simulatedPanelSize),
      batterySizePercent: Math.min(100, Math.max(0, Number(simulatedBatterySizePercent) || 0)),
      daytimeUsePercent: persistedSelectedDaytime,
      rate: simulatedRate,
      selectedSystemType
    };
    saveAppliedSlidersSnapshot(appliedSnapshotPayload);
    persistScenarioSimulatorState(appliedSnapshotPayload);
    setAppliedSlidersLocked(true);

    applyTouchesRef.current = {
      budget: false,
      panelSize: false,
      batterySize: false,
      daytimeUsePercent: false,
      rate: false
    };

    if (onApply) {
      const primary = buildApplyParamsForType(selectedSystemType, touchEffective);
      onApply(
        {
          ...primary,
          resultsBySystemType,
          applyFieldTouches,
          sharedSlidersSnapshot: {
            budget: simulatedBudget ?? budgetSliderMax,
            panelSize: clampPanelSizeToInputRange(simulatedPanelSize),
            batterySizePercent: Math.min(100, Math.max(0, Number(simulatedBatterySizePercent) || 0)),
            daytimeUsePercent: simulatedDaytimeUsePercent,
            rate: simulatedRate
          }
        },
        resultsToSave
      );
    }
  };

  /**
   * Reset all three presets to values derived from the user’s main Calculate inputs (map form), not card-only defaults.
   */
  const handleSetToDefault = async () => {
    // Invalidate pending preview responses before resetting sliders/results.
    livePreviewRunRef.current += 1;
    budgetWasAdjustedRef.current = false;
    setUnfreezeBudgetSliderRange(false);
    applyTouchesRef.current = {
      budget: false,
      panelSize: false,
      batterySize: false,
      daytimeUsePercent: false,
      rate: false
    };
    clearAppliedSlidersSnapshot();
    setAppliedSlidersLocked(false);
    setLastAppliedSnapshot(null);
    setCommittedScenarioCache(emptyScenarioCache());

    const applyUiForSelectedTab = () => {
      const params = buildDefaultScenarioParams(selectedSystemType);
      setSimulatedBudget(params.budget);
      setSimulatedPanelSize(clampPanelSizeToInputRange(params.panelSize));
      setSimulatedBatterySizePercent(
        params.batterySizePercent != null ? Math.min(100, Math.max(0, Number(params.batterySizePercent))) : 100
      );
      setSimulatedDaytimeUsePercent(params.daytimeUsePercent);
      setSimulatedRate(params.rate);
    };

    if (onCalculate) {
      setIsCalculating(true);
      try {
        const pairs = await Promise.all(
          SCENARIO_SYSTEM_TYPES.map(async (st) => {
            const params = buildDefaultScenarioParams(st);
            const r = await Promise.resolve(onCalculate(params));
            return [st, params, r];
          })
        );
        const nextCache = emptyScenarioCache();
        pairs.forEach(([st, params, r]) => {
          if (r) {
            nextCache[st] = { ...r, systemType: r.systemType ?? st };
          }
          saveAppliedConfig(st, {
            area: baseRoofArea,
            budget: params.budget,
            tilt: params.tilt,
            panelSize: params.panelSize,
            batterySizePercent: params.batterySizePercent,
            daytimeUsePercent: params.daytimeUsePercent,
            rate: params.rate,
            results: r || null
          });
        });
        setScenarioCacheByType((prev) => ({ ...prev, ...nextCache }));
        applyUiForSelectedTab();
        setSimulatedResults(
          nextCache[selectedSystemType] ?? baseResults ?? null
        );
      } catch (error) {
        console.error('Set to default failed:', error);
      } finally {
        setIsCalculating(false);
      }
    } else {
      SCENARIO_SYSTEM_TYPES.forEach((st) => {
        const params = buildDefaultScenarioParams(st);
        saveAppliedConfig(st, {
          area: baseRoofArea,
          budget: params.budget,
          tilt: params.tilt,
          panelSize: params.panelSize,
          batterySizePercent: params.batterySizePercent,
          daytimeUsePercent: params.daytimeUsePercent,
          rate: params.rate,
          results: null
        });
      });
      applyUiForSelectedTab();
    }

    const p = buildDefaultScenarioParams(selectedSystemType);
    persistScenarioSimulatorState({
      budget: p.budget,
      panelSize: p.panelSize,
      batterySizePercent: p.batterySizePercent,
      daytimeUsePercent: p.daytimeUsePercent,
      rate: p.rate,
      systemType: selectedSystemType
    });

    if (typeof onSetToDefault === 'function') {
      onSetToDefault();
    }
    setBlockSetDefaultUntilSliderChange(true);
  };

  // Use simulated or base results for display (scenario onCalculate — incl. after Set to Default from main inputs).
  const defaults = getSystemDefaults(selectedSystemType);
  const budgetAtDefault = defaults.budget;
  const baseDayForDefault = clampDaytimePercent(baseParameters?.daytimeUsePercent ?? DEFAULT_DAYTIME_USE_PERCENT);
  const daytimeMatchesDefault =
    clampDaytimePercent(simulatedDaytimeUsePercent) === baseDayForDefault;
  const nearMoney = (a, b) => Math.abs(Number(a) - Number(b)) <= 1;
  const nearNum = (a, b, eps = 0.001) => Math.abs(Number(a) - Number(b)) <= eps;
  const rateMatchesDefault =
    selectedSystemType === 'offgrid'
      ? true
      : nearNum(Number(simulatedRate) > 0 ? Number(simulatedRate) : 10, baseRateVal, 0.001);
  const isAtDefault =
    nearMoney(simulatedBudget ?? budgetSliderMaxUi, budgetAtDefault) &&
    nearNum(simulatedPanelSize, defaults.panelSize, 0.001) &&
    nearNum(
      Math.min(100, Math.max(0, Number(simulatedBatterySizePercent) || 0)),
      Math.min(100, Math.max(0, Number(defaults.batterySizePercent) || 100)),
      0.05
    ) &&
    daytimeMatchesDefault &&
    rateMatchesDefault;

  /**
   * Apply: after a successful Apply (locked + snapshot), only re-enable when sliders differ from that snapshot.
   * Before that, require a deviation from scenario defaults so an empty first click does not apply.
   */
  const canApply =
    appliedSlidersLocked && lastAppliedSnapshot ? isDirtyVsLastApply : !isAtDefault;

  /** After Apply, match the Apply button (isDirtyVsLastApply); before Apply, keep per-tab default hints */
  const showWhatIfChangeIndicators =
    appliedSlidersLocked && lastAppliedSnapshot
      ? isDirtyVsLastApply
      : !isAtDefault || isDirtyVsLastApply;

  /** Prefer live scenario calc; if it belongs to another system type, use prefetched row for this type */
  const simulatedMatchesSelection =
    !!simulatedResults &&
    (simulatedResults.systemType === selectedSystemType ||
      (selectedSystemType === 'gridtied_copy' &&
        (simulatedResults.systemType === 'hybrid' || simulatedResults.systemType === 'gridtied_copy')));

  const rawDisplayResults = simulatedMatchesSelection
    ? simulatedResults
    : scenarioCacheByType[selectedSystemType] ?? baseResults ?? simulatedResults ?? {};

  // Daytime Use is adjustable for every system type. Battery Size is a free input for both
  // Off-Grid and Hybrid — only Grid-Tied stays fixed at 0% (no battery by definition).
  const daytimeSliderLocked = false;
  const batterySliderLocked = selectedSystemType === 'gridtied';
  const daytimeSliderValue = getScenarioDaytimeUsePercent(selectedSystemType, simulatedDaytimeUsePercent);
  const batterySliderValue = getScenarioBatteryPercent(selectedSystemType, simulatedBatterySizePercent);
  const electricityRateSliderLocked = selectedSystemType === 'offgrid';
  const electricityRateDisplayVal = electricityRateSliderLocked
    ? baseRateVal
    : Number(simulatedRate) > 0
      ? Number(simulatedRate)
      : 10;
  const daytimeDisplayLabel =
    Math.abs(daytimeSliderValue - Math.round(daytimeSliderValue)) > 1e-6
      ? daytimeSliderValue.toFixed(1)
      : String(Math.round(daytimeSliderValue));

  const displayResults = rawDisplayResults;
  const batterySizeKwhDisplay = calculateBatteryKwh({
    annualProduction: displayResults.annualProduction,
    daytimeUsePercent: daytimeSliderValue,
    batterySizePercent: batterySliderValue
  });
  const utilizationFactorsDisplay = getUtilizationFactors(
    getScenarioDaytimeUsePercent(selectedSystemType, simulatedDaytimeUsePercent),
    batterySliderValue
  );

  return (
    <Card sx={{ 
      mt: 3, mb: 4,
      border: '2px solid #1976d2',
      boxShadow: '0 4px 12px rgba(25,118,210,0.2)'
    }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: '#1976d2' }}>
            <ScienceIcon />
          </Avatar>
        }
        title="What-If Scenario Simulator"
        subheader="Explore how changes affect your solar system performance and savings"
        sx={{
          bgcolor: '#e3f2fd',
          p: 3,
          '& .MuiCardHeader-title': { fontSize: '1.5rem', fontWeight: 700, color: '#1976d2' }
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" paragraph color="textSecondary" sx={{ mb: 3, lineHeight: 1.8 }}>
          {isConsumptionMode
            ? 'System size and tilt match your calculator inputs. Adjust the sliders below to explore scenarios:'
            : 'Roof area and tilt match your calculator inputs. Adjust the sliders below to explore scenarios:'}
        </Typography>

        <Card
          variant="outlined"
          sx={{
            mb: 3,
            borderColor: 'primary.light',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)'
          }}
        >
          <Grid container>
            <Grid
              item
              xs={12}
              sm={6}
              sx={{
                p: 2.5,
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                borderRight: { sm: '1px solid' },
                borderBottom: { xs: '1px solid', sm: 'none' },
                borderColor: 'divider'
              }}
            >
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.12, fontWeight: 600 }}>
                {isConsumptionMode ? 'Monthly consumption' : 'Roof top area'}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  lineHeight: 1.15,
                  mt: 0.5
                }}
              >
                {isConsumptionMode ? (baseMonthlyConsumptionKwh ?? '—') : baseRoofArea}
                <Typography component="span" variant="h6" color="text.secondary" sx={{ fontWeight: 600, ml: 0.5 }}>
                  {isConsumptionMode ? 'kWh' : 'm²'}
                </Typography>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ p: 2.5, bgcolor: 'rgba(25, 118, 210, 0.04)' }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.12, fontWeight: 600 }}>
                Tilt angle
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mt: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.15 }}>
                  {baseTiltAngle}°
                </Typography>
                {Math.abs(Number(baseTiltAngle) - OPTIMAL_TILT) < 0.01 && (
                  <Chip label="Optimal" size="small" color="success" sx={{ fontWeight: 700 }} />
                )}
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Select System Type Preset
          </Typography>
          <ToggleButtonGroup
            value={selectedSystemType}
            exclusive
            onChange={handleSystemTypeSelect}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                py: 0.75,
                borderColor: '#1976d2',
                color: '#1976d2',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: 4
                  }
                }
              }
            }}
          >
            <ToggleButton value="offgrid">Off-Grid</ToggleButton>
            <ToggleButton value="gridtied">Grid-Tied</ToggleButton>
            <ToggleButton value="gridtied_copy">Hybrid System</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {/* Interactive Controls */}
        <Grid container spacing={3} sx={{ '& > .MuiGrid-item': { pb: 1 } }}>
          {/* Daytime use — adjustable for every system type */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: daytimeSliderLocked ? 'text.secondary' : 'inherit', mb: 0 }}>
                Daytime Use: {daytimeDisplayLabel}%
              </Typography>
              <IconButton
                size="small"
                aria-label="What is Daytime Use?"
                onClick={() => setDaytimeInfoOpen(true)}
                sx={{
                  p: 0.25,
                  mb: 0.5,
                  color: daytimeInfoOpen ? SLIDER_DAYTIME_COLOR : 'text.secondary',
                  transition: 'color 0.15s ease'
                }}
              >
                <InfoOutlinedIcon fontSize="small" sx={{ fontSize: '1.05rem' }} />
              </IconButton>
              <Dialog
                open={daytimeInfoOpen}
                onClose={() => setDaytimeInfoOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                  sx: {
                    borderRadius: 2.5,
                    overflow: 'hidden'
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2.5,
                    py: 1.5,
                    bgcolor: SLIDER_DAYTIME_COLOR,
                    color: '#fff'
                  }}
                >
                  <WbSunnyIcon />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                    Daytime Use Percentage
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Close"
                    onClick={() => setDaytimeInfoOpen(false)}
                    sx={{ color: '#fff', p: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ px: 3.5, py: 3.5, bgcolor: 'background.paper' }}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ lineHeight: 2, fontSize: '1.02rem', letterSpacing: 0.15, mb: 2.5 }}
                  >
                    Is the proportion of your total daily electricity consumption that occurs
                    during peak sunlight hours when solar panels are actively generating
                    electricity.
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      px: 2,
                      py: 1.25,
                      borderRadius: 2,
                      bgcolor: `${SLIDER_DAYTIME_COLOR}14`
                    }}
                  >
                    <WbSunnyIcon sx={{ color: SLIDER_DAYTIME_COLOR, fontSize: '1.3rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: SLIDER_DAYTIME_COLOR }}>
                      Typically 8:00 AM to 5:00 PM
                    </Typography>
                  </Box>
                </Box>
              </Dialog>
            </Box>
            <Slider
              disabled={daytimeSliderLocked}
              value={daytimeSliderValue}
              onChange={(e, value) => {
                setBlockSetDefaultUntilSliderChange(false);
                applyTouchesRef.current.daytimeUsePercent = true;
                // Daytime Use is shared across all three presets — Off-Grid, Grid-Tied, and
                // Hybrid — so a drag on any tab updates the same value every other tab sees.
                setSimulatedDaytimeUsePercent(value);
              }}
              min={0}
              max={100}
              step={selectedSystemType === 'gridtied_copy' ? 0.5 : 1}
              marks={[
                { value: 0, label: '0' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
              sx={{
                ...SCENARIO_SLIDER_MARK_SX,
                ...(daytimeSliderLocked
                  ? {
                      '& .MuiSlider-thumb': {
                        bgcolor: '#9e9e9e'
                      },
                      '& .MuiSlider-track': {
                        bgcolor: '#bdbdbd'
                      },
                      '& .MuiSlider-rail': {
                        bgcolor: '#e0e0e0'
                      }
                    }
                  : {
                      '& .MuiSlider-thumb': {
                        bgcolor: SLIDER_DAYTIME_COLOR
                      },
                      '& .MuiSlider-track': {
                        bgcolor: SLIDER_DAYTIME_COLOR
                      }
                    })
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Daytime Use is adjustable in this slider.
            </Typography>
          </Grid>

          {/* Budget Slider — range matches System Comparison investment min–max; default at max */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Investment: {formatPesoRange(investmentDisplayMinUi, investmentDisplayMaxUi)}
            </Typography>
            <Slider
              value={simulatedBudget ?? budgetSliderMaxUi}
              onChange={(e, value) => {
                setBlockSetDefaultUntilSliderChange(false);
                applyTouchesRef.current.budget = true;
                budgetWasAdjustedRef.current = true;
                setUnfreezeBudgetSliderRange(true);
                setSimulatedBudget(value);
              }}
              min={budgetSliderMinUi}
              max={budgetSliderMaxUi}
              step={budgetSliderStep}
              marks={budgetSliderMarksUi}
              sx={{
                ...SCENARIO_SLIDER_MARK_SX,
                '& .MuiSlider-thumb': {
                  bgcolor: SLIDER_BUDGET_COLOR
                },
                '& .MuiSlider-track': {
                  bgcolor: SLIDER_BUDGET_COLOR
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Investment is adjustable in this slider.
            </Typography>
          </Grid>

          {/* Panel Size Slider */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Panel Size: {simulatedPanelSize} kWp
            </Typography>
            <Slider
              disabled
              value={simulatedPanelSize}
              onChange={(e, value) => {
                setBlockSetDefaultUntilSliderChange(false);
                applyTouchesRef.current.panelSize = true;
                setSimulatedPanelSize(clampPanelSizeToInputRange(value));
              }}
              min={PANEL_SIZE_INPUT_MIN}
              max={PANEL_SIZE_INPUT_MAX}
              step={0.05}
              valueLabelDisplay="off"
              marks={[
                { value: 0.5, label: '0.5' },
                { value: 0.6, label: '0.6' },
                { value: 0.7, label: '0.7' }
              ]}
              sx={{
                ...SCENARIO_SLIDER_MARK_SX,
                '& .MuiSlider-thumb': {
                  bgcolor: '#9e9e9e'
                },
                '& .MuiSlider-track': {
                  bgcolor: '#bdbdbd'
                },
                '& .MuiSlider-rail': {
                  bgcolor: '#e0e0e0'
                }
              }}
            />
            <Typography variant="caption" color="textSecondary">
              Panels: {displayResults.panelCount ?? calculateSystemSpecs(baseRoofArea, simulatedPanelSize).panelCount}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Battery Size (%): {Math.round(batterySliderValue)}%
            </Typography>
            <Slider
              disabled={batterySliderLocked}
              value={batterySliderValue}
              onChange={(e, value) => {
                setBlockSetDefaultUntilSliderChange(false);
                applyTouchesRef.current.batterySize = true;
                // Off-Grid and Hybrid share this value, so a drag on either tab moves both.
                setSimulatedBatterySizePercent(value);
              }}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
              sx={{
                ...SCENARIO_SLIDER_MARK_SX,
                ...(batterySliderLocked
                  ? {
                      '& .MuiSlider-thumb': { bgcolor: '#9e9e9e' },
                      '& .MuiSlider-track': { bgcolor: '#bdbdbd' },
                      '& .MuiSlider-rail': { bgcolor: '#e0e0e0' }
                    }
                  : {
                      '& .MuiSlider-thumb': { bgcolor: SLIDER_BATTERY_COLOR },
                      '& .MuiSlider-track': { bgcolor: SLIDER_BATTERY_COLOR }
                    })
              }}
            />
            {selectedSystemType === 'gridtied' ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Battery Size for Grid-Tied is fixed to 0%.
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Battery Size is adjustable in this slider.
              </Typography>
            )}
          </Grid>

          {/* Electricity rate — fixed to calculator rate when Off-Grid */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: 600, color: electricityRateSliderLocked ? 'text.secondary' : 'inherit' }}
            >
              Electricity Rate: ₱{electricityRateDisplayVal.toFixed(2)}/kWh
            </Typography>
            <Slider
              disabled={electricityRateSliderLocked}
              value={electricityRateDisplayVal}
              onChange={(e, value) => {
                setBlockSetDefaultUntilSliderChange(false);
                applyTouchesRef.current.rate = true;
                setSimulatedRate(value);
              }}
              min={5}
              max={30}
              step={0.5}
              marks={[
                { value: 5, label: '5' },
                { value: 12.5, label: '12.5' },
                { value: 20, label: '20' },
                { value: 30, label: '30' }
              ]}
              sx={{
                ...SCENARIO_SLIDER_MARK_SX,
                ...(electricityRateSliderLocked
                  ? {
                      '& .MuiSlider-thumb': {
                        bgcolor: '#9e9e9e'
                      },
                      '& .MuiSlider-track': {
                        bgcolor: '#bdbdbd'
                      },
                      '& .MuiSlider-rail': {
                        bgcolor: '#e0e0e0'
                      }
                    }
                  : {
                      '& .MuiSlider-thumb': {
                        bgcolor: SLIDER_ELECTRICITY_RATE_COLOR
                      },
                      '& .MuiSlider-track': {
                        bgcolor: SLIDER_ELECTRICITY_RATE_COLOR
                      }
                    })
              }}
            />
            {selectedSystemType === 'offgrid' ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Electricity rate for Off-Grid matches your calculator input (not adjustable here).
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Electricity Rate is adjustable in this slider.
              </Typography>
            )}
          </Grid>
        </Grid>

        <CardActions sx={{ justifyContent: 'center', gap: 2, px: 0, pt: 3, pb: 1 }}>
          <Tooltip
            title={
              blockSetDefaultUntilSliderChange
                ? 'Adjust any slider to enable Set to Default again.'
                : 'Resets all three presets (Off-Grid, Grid-Tied, Hybrid) to each System Comparison card default and your main calculator inputs.'
            }
            arrow
            placement="top"
          >
            <span>
              <Button
                variant="outlined"
                onClick={handleSetToDefault}
                disabled={isCalculating || isAtDefault || blockSetDefaultUntilSliderChange}
                sx={{ px: 3, py: 1.5 }}
              >
                Set to Default
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              !canApply
                ? lastAppliedSnapshot && appliedSlidersLocked && !isDirtyVsLastApply
                  ? 'Configuration applied. Adjust any slider to enable Apply again.'
                  : 'Adjust any slider to enable Apply. Results update as you move sliders; Apply saves to storage and syncs Summary & Results.'
                : 'Save Off-Grid, Grid-Tied, and Hybrid with your current sliders to persistent storage and sync the main calculator.'
            }
            arrow
            placement="top"
          >
            <span>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplySimulation}
                disabled={!canApply || isCalculating}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                {isCalculating ? 'Applying...' : 'Apply Configuration'}
              </Button>
            </span>
          </Tooltip>
        </CardActions>

        {/* Real-time Results Comparison */}
        <Box sx={{ mt: 2, p: 3, bgcolor: '#f5f5f5', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
            {isCalculating ? 'Calculating...' : 'Simulated Results:'}
          </Typography>
          
          <Grid container spacing={2}>
            {[
              { label: 'System Capacity', key: 'capacity', fallbackKey: 'systemCapacity', format: (v) => v != null ? `${Number(v).toFixed(1)} kW` : '—', color: 'primary.main' },
              { label: 'Battery Capacity (kWh)', key: 'batterySizeKwh', format: (v) => v != null ? `${Number(v).toFixed(1)} kWh` : '—', color: SLIDER_BATTERY_COLOR, noCompare: true },
              { label: 'Payback Period', key: 'paybackPeriod', format: (v) => v != null ? `${v} years` : '—', color: '#8e24aa', noCompare: true, higherIsBetter: false },
              { label: 'ROI', key: 'roi', format: (v) => v != null ? `${v}%` : '—', color: '#00897b', noCompare: true },
              { label: 'Number of Panels', key: 'panelCount', format: (v, r) => v != null ? `${v} panels${(r?.panelSizeKw ?? baseParameters?.panelSize) ? ` @ ${(r?.panelSizeKw ?? baseParameters?.panelSize)} kW` : ''}` : '—', color: SLIDER_PANEL_COLOR },
              { label: 'Annual Energy Production', key: 'annualProduction', format: (v) => v ? `${Math.round(v).toLocaleString()} kWh` : '—', color: '#ef6c00' },
              { label: 'Estimated Annual Savings', key: 'annualSavings', format: (v) => v ? `₱${v.toLocaleString()}` : '—', color: 'success.main', noCompare: true },
              { label: 'Investment', key: 'investment', format: (v) => v && (v.min > 0 || v.max > 0) ? formatPesoRange(v.min, v.max) : '—', color: SLIDER_BUDGET_COLOR, noCompare: true }
            ].map((metric) => {
              // Payback Period, ROI, and Investment are min-max RANGES tied to System Comparison's
              // own capacity/cost formulas, not a single live-slider value — so they're sourced
              // directly from selectedComparisonScenario (the same object
              // computeSystemComparisonScenarios() produces for System Comparison itself) rather
              // than a locally-recalculated value, and stay in sync with it including right after
              // Apply Configuration. Annual Savings, by contrast, is a single number using the
              // same formula on both sides — it stays on the live onCalculate value below so it
              // keeps previewing as sliders move, and it already converges with System Comparison's
              // number once Apply Configuration commits the live figures into the shared cache both
              // panels read from.
              const val =
                metric.key === 'batterySizeKwh'
                  ? batterySizeKwhDisplay
                  : metric.key === 'paybackPeriod'
                    ? (selectedComparisonScenario?.paybackPeriod ?? displayResults[metric.key])
                    : metric.key === 'roi'
                      ? (selectedComparisonScenario?.roi ?? displayResults[metric.key])
                      : metric.key === 'investment'
                        ? (selectedComparisonScenario?.cost ?? null)
                        : (displayResults[metric.key] ?? displayResults[metric.fallbackKey]);
              return (
                <Grid item xs={12} sm={6} md={4} key={metric.label}>
                  <Box
                    sx={{
                      p: 2,
                      height: '100%',
                      minHeight: 88,
                      bgcolor: 'background.paper',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      gap: 0.5
                    }}
                  >
                    <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.2 }}>
                      {metric.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: metric.color, lineHeight: 1.3 }}>
                      {metric.format(val, displayResults)}
                    </Typography>
                    {metric.sublabel && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        {metric.sublabel}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
            <Grid item xs={12} sm={6} md={4}>
              <Box
                sx={{
                  p: 2,
                  height: '100%',
                  minHeight: 88,
                  bgcolor: 'background.paper',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  gap: 1
                }}
              >
                <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.2 }}>
                  Utilization Factor
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: SLIDER_DAYTIME_COLOR, lineHeight: 1.3, mt: 0.5 }}>
                  {selectedSystemType === 'offgrid' && `${(utilizationFactorsDisplay.offGrid * 100).toFixed(1)}%`}
                  {selectedSystemType === 'gridtied' && `${(utilizationFactorsDisplay.gridTied * 100).toFixed(1)}%`}
                  {(selectedSystemType === 'gridtied_copy' || selectedSystemType === 'hybrid') &&
                    `${(utilizationFactorsDisplay.hybrid * 100).toFixed(1)}%`}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Monthly Sun Peak Hours table in its own container below Simulated Results */}
        {(Array.isArray(sunPeakHoursData?.monthlyData) && sunPeakHoursData.monthlyData.length > 0) && (
          <Box sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2, boxShadow: 1 }}>
            <SunPeakHoursDisplay
              sunPeakHoursData={sunPeakHoursData}
              systemCapacity={displayResults.capacity ?? displayResults.systemCapacity}
              monthlyOnly
              electricityRate={electricityRateDisplayVal}
              utilizationFactor={utilizationFactorsDisplay.gridTied}
            />
          </Box>
        )}
        {(Array.isArray(sunPeakHoursData?.monthlyData) && sunPeakHoursData.monthlyData.length > 0) && (
          <Box
            sx={{
              mt: 2,
              p: 3,
              bgcolor: '#f8f9fa',
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
              <strong>📊 Weather Data Source:</strong> NREL PVWatts API v8 |
              <strong> 💰 Monthly Savings:</strong> Monthly Energy Production × Rate × Utilization Factor |
              <strong> ⏰ Updated:</strong>{' '}
              {sunPeakHoursData?.metadata?.calculationDate
                ? new Date(sunPeakHoursData.metadata.calculationDate).toLocaleString()
                : 'N/A'}
            </Typography>
          </Box>
        )}
        
        {/* Change Indicator — after Apply, same as Apply button on all presets */}
        {showWhatIfChangeIndicators && (
          <Chip 
            label={
              appliedSlidersLocked && lastAppliedSnapshot && isDirtyVsLastApply
                ? 'Unsaved slider changes'
                : 'Configuration Modified'
            }
            color="primary"
            size="medium"
            sx={{ mt: 2, fontWeight: 600 }}
          />
        )}
      </CardContent>
      
    </Card>
  );
};

export default ScenarioSimulator;

