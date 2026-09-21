// src/pages/MapComponent.jsx
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CssBaseline, Box, Fab, Drawer, IconButton, Typography,
  AppBar, Toolbar, Divider, TextField, Stack, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Snackbar, Alert, Tooltip, Tabs, Tab, Slider, Rating
} from '@mui/material';
import { MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import ClearIcon from '@mui/icons-material/Clear';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import PersonPinCircleRoundedIcon from '@mui/icons-material/PersonPinCircleRounded';
import CloseIcon from '@mui/icons-material/Close';
import StraightenIcon from '@mui/icons-material/Straighten';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import RoofingIcon from '@mui/icons-material/Roofing';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import * as turf from '@turf/turf';
import MapDisplay from './MapDisplay';
import Calculator from './CalculatorEnhanced';
import SolarAIChatbot from './SolarAIChatbot';
import AIParameterReview from './AIParameterReview';
import { getCurrentLocation } from '../utils/getCurrentLocation';
import Textpopup from './Textpopup';
import { useGetSettingsQuery } from '../../settings/settingsApiSlice';
import { useCreateSolarCalculatorActivityLogMutation } from '../solarCalculatorActivityLogsApiSlice';
import {
  useSubmitSolarCalculatorRatingMutation,
  useGetSolarCalculatorRatingsQuery
} from '../solarCalculatorRatingsApiSlice';
import { useConversation } from '../context/ConversationContext';
import { useCalculatorUI } from '../context/CalculatorUIContext';
import ResultNarrativeDisplay from './ResultNarrativeDisplay';
import PrintSaveReport from './PrintSaveReport';
import ScenarioSimulator from './ScenarioSimulator';
import SystemComparison from './SystemComparison';
import { OFF_GRID, HYBRID, GRID_TIED, getInvestmentRange } from '../constants/systemComparisonConstants';
import { FIXED_PANEL_TILT_DEGREES, DEFAULT_DAYTIME_USE_PERCENT } from '../constants/panelGeometryConstants';
import {
  getUtilizationFactorForSystemType,
  getUtilizationFactors,
  clampDaytimePercent
} from '../constants/utilizationFactors';
import { getRecommendedScenarioSystemType } from '../utils/systemComparisonDefaults';
import { getSunPeakHours } from '../services/solarIrradianceService';
import { calculateROI } from '../services/pricingService';
import { estimateAreaForTargetCapacity, calculateTechnicalCapacity } from '../utils/roofAreaEstimator';

const OPENCAGE_API_KEY = '***REMOVED***';

/** What-If / ScenarioSimulator localStorage keys — cleared when main Calculate runs so presets reset to current inputs */
const SCENARIO_LS_KEYS_RESET_ON_CALCULATE = [
  'solar_scenario_simulator_state_v1',
  'solar_scenario_applied_config_v1',
  'solar_scenario_applied_sliders_v1'
];

const RECOMMENDATION_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
const RECOMMENDATION_EFFICIENCY_PERCENT = 80;
const RECOMMENDATION_DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const SHOW_AREC_HELIOS_FLOATING_ICON = false;

/** The two calculation procedures the user picks between in the pop-up selector. Definitions
 *  are shown verbatim in the dialog so the choice is informed, not just a toggle. */
const CALCULATION_PROCEDURES = [
  {
    mode: 'rooftop',
    Icon: RoofingIcon,
    title: 'Solar Rooftop Potential',
    calculatorName: 'Solar Rooftop Calculator',
    definition: 'It is a calculator of the potential capacity it could handle from the rooftop area.',
    detail: 'Choose this if you know the usable area of your roof.',
    accent: '#1976d2',
    tint: '#e3f2fd'
  },
  {
    mode: 'consumption',
    Icon: ElectricBoltIcon,
    title: 'Monthly Consumption',
    calculatorName: 'Monthly Consumption Calculator',
    definition:
      'It is the calculator of the possible system capacity it needs based on their monthly consumption.',
    detail: 'Choose this if you know your monthly electric bill or kWh usage.',
    accent: '#00897b',
    tint: '#e0f2f1'
  }
];

/** Map What-If scenario result → HeroSummaryCard shape for Summary & Results tab */
function buildHeroSummaryFromWhatIfResult(r, panelSizeKw, panelWattageFallback) {
  if (!r) return null;
  const capRaw = r.systemCapacity ?? r.capacity;
  const cap =
    capRaw != null && capRaw !== '' && Number.isFinite(Number(capRaw)) ? Number(capRaw) : 0;
  const kwp = Number(panelSizeKw) > 0 ? Number(panelSizeKw) : 0;
  /** Prefer What-If panel kWp; map form is not updated on Apply, so do not let stale calculator Wp override. */
  const wp =
    kwp > 0
      ? Math.round(kwp * 1000)
      : Number.isFinite(Number(panelWattageFallback)) && Number(panelWattageFallback) > 0
        ? Number(panelWattageFallback)
        : 600;
  const eeannualNum = parseFloat(r.annualProduction);
  const eeaveNum = Number.isFinite(eeannualNum) ? eeannualNum / 365 : 0;
  return {
    Rcapacity: cap,
    eeannual: String(r.annualProduction ?? ''),
    totalSavings: String(r.annualSavings ?? ''),
    panelCount: r.panelCount,
    panelWattage: wp,
    eeave: eeaveNum.toFixed(1),
    pricingSource: 'What-If scenario (applied)'
  };
}

/**
 * Apply Configuration always ships one bundle for all presets. Map simulator keys → System Comparison keys
 * (Hybrid card uses `hybrid`, not `gridtied_copy`). When all three rows exist, use this only — do not blend
 * with older `scenarioResultsByType` or the selected tab only, so each card stays tied to its own system type.
 */
function buildScenarioResultsByTypeForComparison(resultsBySystemType) {
  if (!resultsBySystemType || typeof resultsBySystemType !== 'object') return null;
  const offgrid = resultsBySystemType.offgrid;
  const gridtied = resultsBySystemType.gridtied;
  const hybridRow = resultsBySystemType.gridtied_copy ?? resultsBySystemType.hybrid;
  if (!offgrid || !gridtied || !hybridRow) return null;
  return {
    offgrid: { ...offgrid, systemType: 'offgrid' },
    gridtied: { ...gridtied, systemType: 'gridtied' },
    hybrid: { ...hybridRow, systemType: 'hybrid' }
  };
}

// Modern light theme input styles
const inputStyles = {
  '& .MuiInputLabel-root': {
    color: '#1976d2',  // Blue labels for clean modern look
    fontWeight: 500,
    '&.Mui-focused': { color: '#1565c0' }
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',  // White background
    color: '#2c3e50',  // Dark text for readability
    borderRadius: 2,
    '& fieldset': { 
      borderColor: '#e0e0e0',  // Light gray border
      borderWidth: '1.5px'
    },
    '&:hover fieldset': { 
      borderColor: '#1976d2',  // Blue on hover
      borderWidth: '1.5px'
    },
    '&.Mui-focused fieldset': { 
      borderColor: '#1976d2',  // Blue when focused
      borderWidth: '2px'
    }
  },
  '& input': { 
    color: '#2c3e50',  // Dark text
    fontWeight: 500
  },
  '& input::placeholder': { 
    color: '#90a4ae',  // Light gray placeholder
    opacity: 0.8 
  }
};

/**
 * Get input styles with AI-filled indicator
 * Applies teal border to fields that were auto-filled by AI
 * 
 * @param {boolean} isAiFilled - Whether this field was filled by AI
 * @returns {Object} Combined MUI input styles
 */
const getInputStyles = (isAiFilled) => {
  if (!isAiFilled) return inputStyles;

  return {
    ...inputStyles,
    '& .MuiOutlinedInput-root': {
      ...inputStyles['& .MuiOutlinedInput-root'],
      '& fieldset': { 
        borderColor: '#26a69a !important',  // Teal border for AI-filled fields
        borderWidth: '2px !important'
      },
      '&:hover fieldset': { 
        borderColor: '#00897b !important',
        borderWidth: '2px !important'
      },
      '&.Mui-focused fieldset': { 
        borderColor: '#00695c !important',
        borderWidth: '2px !important'
      }
    }
  };
};

/**
 * Merge default/AI styles with a red glow indicator for required fields that are missing.
 */
const getFieldInputStyles = (isAiFilled, hasError = false) => {
  const baseStyles = getInputStyles(isAiFilled);
  if (!hasError) return baseStyles;

  return {
    ...baseStyles,
    '& .MuiInputLabel-root': {
      ...(baseStyles['& .MuiInputLabel-root'] || {}),
      color: '#d32f2f',
      '&.Mui-focused': { color: '#c62828' }
    },
    '& .MuiOutlinedInput-root': {
      ...(baseStyles['& .MuiOutlinedInput-root'] || {}),
      boxShadow: '0 0 0 3px rgba(211, 47, 47, 0.18)',
      '& fieldset': {
        borderColor: '#d32f2f !important',
        borderWidth: '2px !important'
      },
      '&:hover fieldset': {
        borderColor: '#c62828 !important',
        borderWidth: '2px !important'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#b71c1c !important',
        borderWidth: '2px !important'
      }
    }
  };
};

const getAzimuthDirection = (angle) => {
  const deg = (parseFloat(angle) + 360) % 360;
  if (deg >= 337.5 || deg < 22.5) return 'North';
  if (deg >= 22.5 && deg < 67.5) return 'Northeast';
  if (deg >= 67.5 && deg < 112.5) return 'East';
  if (deg >= 112.5 && deg < 157.5) return 'Southeast';
  if (deg >= 157.5 && deg < 202.5) return 'South';
  if (deg >= 202.5 && deg < 247.5) return 'Southwest';
  if (deg >= 247.5 && deg < 292.5) return 'West';
  if (deg >= 292.5 && deg < 337.5) return 'Northwest';
  return 'Unknown';
};

export default function MapComponent() {
  const mapRef = useRef(null);

  const { drawerOpen, setDrawerOpen } = useCalculatorUI();
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState('about');
  const [searchText, setSearchText] = useState('');
  const [searchError, setSearchError] = useState('');

  const [markerPosition, setMarkerPosition] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // CALCULATION PROCEDURE: 'rooftop' sizes the system from roof area; 'consumption' sizes
  // it from the monthly electricity usage table. The choice is made in a pop-up selector
  // that opens on arrival, and can be changed any time from the input card header.
  const [calculationMode, setCalculationMode] = useState('rooftop');
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(true);
  /** False until the user picks a procedure in the pop-up. While false the selector is the
   *  only thing on screen — the input card stays hidden behind it. */
  const [hasChosenProcedure, setHasChosenProcedure] = useState(false);
  const [isEstimatingConsumption, setIsEstimatingConsumption] = useState(false);
  const isConsumptionMode = calculationMode === 'consumption';
  const activeProcedure =
    CALCULATION_PROCEDURES.find((p) => p.mode === calculationMode) || CALCULATION_PROCEDURES[0];
  const ActiveProcedureIcon = activeProcedure.Icon;
  // The Monthly Consumption procedure edits a 12-row table, so the floating input card widens
  // to keep every column comfortably typeable; the roof-area procedure keeps the narrow card.
  const inputCardWidth = isConsumptionMode ? { xs: '96vw', sm: 720, md: 820 } : { xs: 320, sm: 520 };
  const inputCardClearance = isConsumptionMode ? { xs: 20, sm: 740, md: 840 } : { xs: 340, sm: 540 };

  // FORM FIELDS
  const [area, setArea] = useState('');
  const [tilt, setTilt] = useState(String(FIXED_PANEL_TILT_DEGREES));
  const [daytimeUsePercent, setDaytimeUsePercent] = useState(DEFAULT_DAYTIME_USE_PERCENT);
  const nighttimeUsePercent = 100 - clampDaytimePercent(daytimeUsePercent);
  const [batterySizePercent, setBatterySizePercent] = useState(100);
  const [azimuth, setAzimuth] = useState('180');
  const [panelSize, setPanelSize] = useState('');
  const [rate, setRate] = useState('10');
  const [budget, setBudget] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [recommendationRows, setRecommendationRows] = useState(() =>
    RECOMMENDATION_MONTHS.map((month) => ({
      month,
      electricBill: '',
      electricRate: '',
      monthlyConsumption: '',
      efficiency: RECOMMENDATION_EFFICIENCY_PERCENT
    }))
  );

  const [calculatorUses, setCalculatorUses] = useState(() => parseInt(localStorage.getItem('calcUses') || '0', 10));
  const [submitted, setSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcTrigger, setCalcTrigger] = useState(0);
  /** Increments when What-If Apply syncs inputs so Summary recalculates without bumping calcTrigger (What-If key uses calcTrigger only). */
  const [whatIfApplyTrigger, setWhatIfApplyTrigger] = useState(0);
  /** Metrics shown on Summary & Results hero card from last What-If Apply (cleared on main Calculate). */
  const [whatIfHeroSummary, setWhatIfHeroSummary] = useState(null);
  /** Exact per-type What-If results from the last Apply; used to sync System Comparison cards. */
  const [appliedScenarioResultsByType, setAppliedScenarioResultsByType] = useState(null);
  /** Last applied What-If slider values used to keep System Comparison synced after Apply. */
  const [whatIfAppliedComparisonParams, setWhatIfAppliedComparisonParams] = useState(null);
  /** Summary override from System Recommendation tab Apply action. */
  const [recommendationHeroSummary, setRecommendationHeroSummary] = useState(null);
  /** Increments when recommendation apply/reset should force downstream tab sync. */
  const [recommendationSyncVersion, setRecommendationSyncVersion] = useState(0);

  const [polygonPoints, setPolygonPoints] = useState([]);
  const [measuredArea, setMeasuredArea] = useState(null);
  
  // AI Chatbot state
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [calculatorData, setCalculatorData] = useState({});
  
  // Calculator results state for Phase 4 components
  const [calculatorResults, setCalculatorResults] = useState(null);
  
  // AI auto-fill state - tracks which fields were filled by AI
  const [aiFilledFields, setAiFilledFields] = useState({});
  const [hasAISuggestions, setHasAISuggestions] = useState(false);
  
  // AI Parameter Review modal state
  const [showParameterReview, setShowParameterReview] = useState(false);
  const [reviewParameters, setReviewParameters] = useState(null);
  
  // Results modal state
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // "Start Calculating" lands here with the procedure selector as the very first thing on
  // screen: hide the input card on arrival so nothing competes with the choice. It opens as
  // soon as a procedure is picked (see handleSelectProcedure).
  useEffect(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  // Only one of {input card, results modal} is shown at a time: whenever the
  // input card is unhidden (by any means - FAB toggle, closing results, etc.),
  // make sure the results modal isn't left open behind it.
  useEffect(() => {
    if (drawerOpen) {
      setShowResultsModal(false);
    }
  }, [drawerOpen]);

  // Snackbar notification state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Floating user evaluation state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  
  // Drawer fixed size (no resizing) - full height
  const drawerHeight = '100vh';
  
  // Track last shown parameters to prevent duplicate notifications
  const lastShownParamsRef = useRef(null);
  
  // Check AI agent status
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useGetSettingsQuery();
  const [createSolarCalculatorActivityLog] = useCreateSolarCalculatorActivityLogMutation();
  const [submitSolarCalculatorRating, { isLoading: isSubmittingFeedback }] = useSubmitSolarCalculatorRatingMutation();
  const { data: ratingSummary } = useGetSolarCalculatorRatingsQuery(
    { page: 1, limit: 20, search: '' },
    {
      refetchOnMountOrArgChange: true
    }
  );
  
    const isAIAgentAvailable = !settingsLoading && settings?.data?.aiAgent?.available && settings?.data?.aiAgent?.chatbotVisible;

  // Get conversation context for AI parameter extraction
  const { extractedParams, validatedParams } = useConversation();

  const azimuthDirection = azimuth !== '' ? getAzimuthDirection(azimuth) : null;
  const overallRatingValue = Number(ratingSummary?.averageRating) || 0;
  const totalRatings = Number(ratingSummary?.total) || 0;
  const overallRatingLabel = totalRatings > 0 ? `${overallRatingValue.toFixed(1)}/5` : 'No ratings';
  const averageRatingBadgeLabel =
    totalRatings > 0 ? overallRatingValue.toFixed(1) : '0.0';

  const shouldShowError = (field, value) =>
    (submitted || touchedFields[field]) && value === '';

  useEffect(() => {
    if (!showResultsModal) return;
    setRecommendationRows((prev) =>
      prev.map((row) => ({
        ...row,
        electricBill: row.electricBill,
        electricRate: row.electricRate,
        monthlyConsumption: row.monthlyConsumption ?? ''
      }))
    );
  }, [showResultsModal, monthlyBill, rate]);

  // Monthly Consumption procedure needs per-month sun peak hours to size the system as the
  // user fills in the usage table — fetch it as soon as a location is set, ahead of Calculate
  // (getSunPeakHours caches for 24h, so CalculatorEnhanced's later fetch reuses this for free).
  useEffect(() => {
    if (calculationMode !== 'consumption') return;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    let cancelled = false;
    (async () => {
      try {
        const sunPeakResult = await getSunPeakHours(lat, lng, {
          tilt: parseFloat(tilt) || FIXED_PANEL_TILT_DEGREES,
          azimuth: parseFloat(azimuth) || 180,
          systemCapacity: 1,
          arrayType: 1,
          moduleType: 1,
          losses: 20
        });
        if (cancelled || !sunPeakResult?.success) return;
        setCalculatorData((prev) => ({
          ...prev,
          sunPeakHoursData: {
            annualAverage: sunPeakResult.annualAverage,
            seasonalAverages: sunPeakResult.seasonalAverages,
            monthlyData: sunPeakResult.monthlyData,
            metadata: sunPeakResult.metadata,
            success: sunPeakResult.success
          }
        }));
      } catch {
        // Non-fatal: table just shows "—" for sun hours until the main Calculate flow retries.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [calculationMode, latitude, longitude, tilt, azimuth]);

  const handleRecommendationCellChange = useCallback((rowIdx, field, value) => {
    setRecommendationRows((prev) =>
      prev.map((row, idx) => (idx === rowIdx ? { ...row, [field]: value } : row))
    );
  }, []);

  const resolveMonthlyConsumption = useCallback((row) => {
    const bill = Number(row.electricBill);
    const ratePerKwh = Number(row.electricRate);
    if (Number.isFinite(bill) && Number.isFinite(ratePerKwh) && ratePerKwh > 0) {
      return {
        value: bill / ratePerKwh,
        isAutoComputed: true
      };
    }

    const manualConsumption = Number(row.monthlyConsumption);
    if (Number.isFinite(manualConsumption) && manualConsumption >= 0) {
      return {
        value: manualConsumption,
        isAutoComputed: false
      };
    }

    return {
      value: null,
      isAutoComputed: false
    };
  }, []);

  const computeRecommendationFromRows = useCallback((rows) => {
    const monthlySunPeakRows = Array.isArray(calculatorData?.sunPeakHoursData?.monthlyData)
      ? calculatorData.sunPeakHoursData.monthlyData
      : [];
    const monthlyRequiredCapacitiesKw = rows
      .map((row, idx) => {
        const { value: monthlyConsumption } = resolveMonthlyConsumption(row);
        const monthlySunPeak = Number(monthlySunPeakRows[idx]?.sunPeakHours);
        const efficiency = Number(row.efficiency) / 100;
        const daysInMonth = RECOMMENDATION_DAYS_IN_MONTH[idx] ?? 30;
        if (
          monthlyConsumption == null ||
          !Number.isFinite(monthlySunPeak) ||
          monthlySunPeak <= 0 ||
          !Number.isFinite(efficiency) ||
          efficiency <= 0 ||
          daysInMonth <= 0
        ) {
          return null;
        }
        return monthlyConsumption / efficiency / monthlySunPeak / daysInMonth;
      })
      .filter((v) => Number.isFinite(v) && v > 0);
    const targetCapacityKw =
      monthlyRequiredCapacitiesKw.length > 0 ? Math.max(...monthlyRequiredCapacitiesKw) : null;
    const panelSizeKw = Number(panelSize);
    // Clicking Calculate converts this target into a synthetic roof area and re-derives capacity
    // through the same area-based formula CalculatorEnhanced.jsx uses (round panel count to the
    // nearest multiple of 4) — so the actual post-Calculate System Capacity is this rounded value,
    // not the raw target above. Run that same round-trip here so the preview shown in this card
    // always equals what Calculate will actually produce.
    let recommendedCapacityKw = targetCapacityKw;
    let recommendedPanels = null;
    if (targetCapacityKw != null && Number.isFinite(panelSizeKw) && panelSizeKw > 0) {
      const syntheticArea = estimateAreaForTargetCapacity(targetCapacityKw, panelSizeKw, 50);
      recommendedCapacityKw = calculateTechnicalCapacity(syntheticArea, panelSizeKw);
      recommendedPanels = Math.round(recommendedCapacityKw / panelSizeKw);
    }
    return { recommendedCapacityKw, recommendedPanels, panelSizeKw };
  }, [calculatorData?.sunPeakHoursData?.monthlyData, panelSize, resolveMonthlyConsumption]);

  /** `options.silent` skips the toast — used when a procedure switch clears the table as a
   *  side effect, where a "reset" notice would just be noise. */
  const handleResetRecommendationRows = useCallback((options = {}) => {
    const silent = options?.silent === true;
    setRecommendationRows(
      RECOMMENDATION_MONTHS.map((month) => ({
        month,
        electricBill: '',
        electricRate: '',
        monthlyConsumption: '',
        efficiency: RECOMMENDATION_EFFICIENCY_PERCENT
      }))
    );
    SCENARIO_LS_KEYS_RESET_ON_CALCULATE.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
    setRecommendationHeroSummary(null);
    setWhatIfHeroSummary(null);
    setAppliedScenarioResultsByType(null);
    setWhatIfAppliedComparisonParams(null);
    setWhatIfApplyTrigger((n) => n + 1);
    setRecommendationSyncVersion((v) => v + 1);
    if (!silent) {
      setSnackbarMessage('Monthly usage inputs reset.');
      setSnackbarOpen(true);
    }
  }, []);

  const handleToggleDrawer = () => {
    // Mutually exclusive: close chatbot when opening calculator
    if (!drawerOpen && chatbotOpen) {
      setChatbotOpen(false);
    }
    setDrawerOpen(!drawerOpen);
  };

  const handlePopupOpen = (type) => {
    setPopupType(type);
    setPopupOpen(true);
  };
  const handlePopupClose = () => setPopupOpen(false);

  // Ensure mutual exclusivity if external changes toggle states
  useEffect(() => {
    if (chatbotOpen && drawerOpen) {
      // Prefer the most recently opened: close drawer if chatbot just opened
      setDrawerOpen(false);
    }
  }, [chatbotOpen]);

  const handleCalculateClick = async () => {
    console.log('Calculate button clicked'); // Debug log
    console.log('Current values:', { area, latitude, longitude, tilt, daytimeUsePercent, azimuth, panelSize, rate }); // Debug log
    
    setSubmitted(true);
    setTouchedFields({
      area: true,
      lat: true,
      lon: true,
      tilt: true,
      daytimeUse: true,
      azimuth: true,
      panelSize: true,
      rate: true
    });

    // Check if location is set
    if (!latitude || !longitude) {
      setSnackbarMessage('Please set a location first. Click on the map, use "📍 Current Location", or tell the AI your location.');
      setSnackbarOpen(true);
      setShowCalculator(false);
      return;
    }

    // Check if all required fields are filled and build helpful error message.
    // Monthly Consumption only asks for what its own form shows — the roof-design fields it
    // hides are filled from defaults instead of blocking on inputs the user cannot see.
    const missingFields = [];
    if (isConsumptionMode) {
      const hasUsageData = recommendationRows.some((row) => {
        const { value } = resolveMonthlyConsumption(row);
        return value != null && value > 0;
      });
      if (!hasUsageData) missingFields.push('Monthly Electricity Usage (at least one month)');
      if (!panelSize) missingFields.push('Panel Size');
    } else {
      if (!area || parseFloat(area) <= 0) missingFields.push('Roof Area');
      if (String(tilt).trim() === '' || Number.isNaN(parseFloat(tilt))) missingFields.push('Tilt');
      if (!azimuth && parseFloat(azimuth) !== 0) missingFields.push('Azimuth');
      if (!panelSize) missingFields.push('Panel Size');
      if (!rate || parseFloat(rate) <= 0) missingFields.push('Electricity Rate');
    }

    if (missingFields.length > 0) {
      setSnackbarMessage(`Please fill in the following fields: ${missingFields.join(', ')}`);
      setSnackbarOpen(true);
      setShowCalculator(false);
      console.log('Validation failed. Missing fields:', missingFields); // Debug log
      return;
    }

    // All fields valid - proceed with calculation
    console.log('All fields valid, proceeding with calculation'); // Debug log

    // Monthly-consumption procedure: size the system from the monthly usage table (same
    // math as computeRecommendationFromRows), then derive a synthetic roof area that
    // reproduces that capacity through the existing area-based formula — so every
    // downstream consumer (Calculator, ScenarioSimulator, SystemComparison, Analysis)
    // works unchanged.
    if (isConsumptionMode) {
      setIsEstimatingConsumption(true);
      // Tilt / azimuth / electricity rate are not shown in this procedure — resolve them here
      // (defaults, or the average of the rates typed into the usage table) and push them back
      // into state so every downstream consumer sees the same values this calculation used.
      const effectiveTilt = Number.isFinite(parseFloat(tilt)) ? parseFloat(tilt) : FIXED_PANEL_TILT_DEGREES;
      const effectiveAzimuth = Number.isFinite(parseFloat(azimuth)) ? parseFloat(azimuth) : 180;
      const tableRates = recommendationRows
        .map((row) => Number(row.electricRate))
        .filter((v) => Number.isFinite(v) && v > 0);
      const effectiveRate = tableRates.length > 0
        ? Number((tableRates.reduce((sum, v) => sum + v, 0) / tableRates.length).toFixed(2))
        : (parseFloat(rate) > 0 ? parseFloat(rate) : 10);
      setTilt(String(effectiveTilt));
      setAzimuth(String(effectiveAzimuth));
      setRate(String(effectiveRate));

      try {
        const sunPeakResult = await getSunPeakHours(parseFloat(latitude), parseFloat(longitude), {
          tilt: effectiveTilt,
          azimuth: effectiveAzimuth,
          systemCapacity: 1,
          arrayType: 1,
          moduleType: 1,
          losses: 20
        });
        const monthlySunPeakRows =
          sunPeakResult?.success && Array.isArray(sunPeakResult.monthlyData)
            ? sunPeakResult.monthlyData
            : Array.isArray(calculatorData?.sunPeakHoursData?.monthlyData)
              ? calculatorData.sunPeakHoursData.monthlyData
              : [];

        if (sunPeakResult?.success) {
          setCalculatorData((prev) => ({
            ...prev,
            sunPeakHoursData: {
              annualAverage: sunPeakResult.annualAverage,
              seasonalAverages: sunPeakResult.seasonalAverages,
              monthlyData: sunPeakResult.monthlyData,
              metadata: sunPeakResult.metadata,
              success: sunPeakResult.success
            }
          }));
        }

        const monthlyRequiredCapacitiesKw = recommendationRows
          .map((row, idx) => {
            const { value: monthlyConsumption } = resolveMonthlyConsumption(row);
            const monthlySunPeak = Number(monthlySunPeakRows[idx]?.sunPeakHours);
            const efficiency = Number(row.efficiency) / 100;
            const daysInMonth = RECOMMENDATION_DAYS_IN_MONTH[idx] ?? 30;
            if (
              monthlyConsumption == null ||
              !Number.isFinite(monthlySunPeak) ||
              monthlySunPeak <= 0 ||
              !Number.isFinite(efficiency) ||
              efficiency <= 0 ||
              daysInMonth <= 0
            ) {
              return null;
            }
            return monthlyConsumption / efficiency / monthlySunPeak / daysInMonth;
          })
          .filter((v) => Number.isFinite(v) && v > 0);

        if (monthlyRequiredCapacitiesKw.length === 0) {
          setSnackbarMessage(
            'Could not size a system from the entered usage — check that at least one month has a valid consumption value and that sun-hour data has loaded for this location.'
          );
          setSnackbarOpen(true);
          setIsEstimatingConsumption(false);
          return;
        }

        const recommendedCapacityKw = Math.max(...monthlyRequiredCapacitiesKw);
        const syntheticArea = estimateAreaForTargetCapacity(recommendedCapacityKw, parseFloat(panelSize), 50);
        setArea(String(syntheticArea));
      } catch (error) {
        setSnackbarMessage('Could not fetch solar data for this location. Please try again.');
        setSnackbarOpen(true);
        setIsEstimatingConsumption(false);
        return;
      } finally {
        setIsEstimatingConsumption(false);
      }
    }

    const normalizedLocationInput = String(locationName || '').trim() || `${latitude}, ${longitude}`;
    try {
      await createSolarCalculatorActivityLog({
        locationInput: normalizedLocationInput,
        locationName: String(locationName || '').trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        source: 'main_calculator'
      }).unwrap();
    } catch (error) {
      // Do not block calculation if activity logging fails.
    }

    SCENARIO_LS_KEYS_RESET_ON_CALCULATE.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });

    setWhatIfHeroSummary(null);
    setAppliedScenarioResultsByType(null);
    setWhatIfAppliedComparisonParams(null);
    setRecommendationHeroSummary(null);

    // Set marker position if not already set (for AI-filled coordinates)
    if (!markerPosition && latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      setMarkerPosition([lat, lng]);
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
      }
    }
    
    setShowCalculator(true);
    setCalcTrigger((prev) => prev + 1);
    setShowResultsModal(true); // Open the big results modal
    setDrawerOpen(false); // Hide the input card while results are shown
    setSelectedTab(0); // Reset to first tab
    console.log('Calculator triggered, calcTrigger updated'); // Debug log
  };

  const handleCloseResultsModal = () => {
    setShowResultsModal(false);
    setDrawerOpen(true); // Bring the input card back once results are dismissed
  };

  /** Monthly Consumption hides the roof-design inputs (tilt, azimuth, daytime/battery %,
   *  electricity rate), so make sure they still hold usable values behind the scenes —
   *  the irradiance fetch and the ROI math downstream both depend on them. */
  const applyHiddenConsumptionDefaults = useCallback(() => {
    if (String(tilt).trim() === '' || Number.isNaN(parseFloat(tilt))) {
      setTilt(String(FIXED_PANEL_TILT_DEGREES));
    }
    if (String(azimuth).trim() === '' || Number.isNaN(parseFloat(azimuth))) {
      setAzimuth('180');
    }
    if (!(parseFloat(rate) > 0)) {
      setRate('10');
    }
  }, [tilt, azimuth, rate]);

  /** Pop-up selector: commits the chosen procedure and clears whichever mode-specific input
   *  no longer applies, keeping all shared fields intact. */
  const handleSelectProcedure = (mode) => {
    setProcedureDialogOpen(false);
    setHasChosenProcedure(true);
    setDrawerOpen(true);
    if (!mode || mode === calculationMode) return;
    setCalculationMode(mode);
    setArea('');
    handleResetRecommendationRows({ silent: true });
    if (mode === 'consumption') applyHiddenConsumptionDefaults();
  };

  /** The selector always shows on a clear stage — the input card is hidden while it is open,
   *  whether it opened on arrival or from the "Change" button. */
  const handleOpenProcedureDialog = () => {
    setProcedureDialogOpen(true);
    setDrawerOpen(false);
  };

  /** Dismissing the selector brings the input card back, so the user is never left on a bare
   *  map; a first-time dismiss falls back to the default procedure. */
  const handleCloseProcedureDialog = () => {
    setProcedureDialogOpen(false);
    setHasChosenProcedure(true);
    setDrawerOpen(true);
  };

  /** "Switch procedure" from the results header: flips to the other method, clears the
   *  procedure-specific input so it is re-entered, and reopens the input card. Since that
   *  input is always cleared as part of the switch, it is always missing right after — flag
   *  it (and anything else still empty) instead of leaving the user to notice a blank form. */
  const handleSwitchProcedure = () => {
    const nextMode = calculationMode === 'consumption' ? 'rooftop' : 'consumption';
    setCalculationMode(nextMode);
    setArea('');
    handleResetRecommendationRows({ silent: true });
    if (nextMode === 'consumption') applyHiddenConsumptionDefaults();
    setShowResultsModal(false);
    setDrawerOpen(true);

    const missingFields = nextMode === 'consumption'
      ? ['Monthly Electricity Usage (at least one month)', ...(!panelSize ? ['Panel Size'] : [])]
      : ['Roof Area', ...(!panelSize ? ['Panel Size'] : [])];
    setSnackbarMessage(`Please fill in the required inputs to continue: ${missingFields.join(', ')}`);
    setSnackbarOpen(true);
    setSubmitted(true);
    setTouchedFields((prev) => ({ ...prev, area: true, panelSize: true }));
  };

  /** Clears the form but keeps the chosen procedure — Reset should not silently switch the
   *  user back to roof area after they deliberately picked Monthly Consumption. */
  const handleResetInputs = () => {
    handleResetRecommendationRows({ silent: true });
    setArea('');
    setTilt(String(FIXED_PANEL_TILT_DEGREES));
    setDaytimeUsePercent(DEFAULT_DAYTIME_USE_PERCENT);
    setBatterySizePercent(100);
    setAzimuth('');
    setPanelSize('');
    setRate('');
    setSubmitted(false);
    setTouchedFields({});
    setShowCalculator(false);
    setCalculatorData({});
    setRecommendationHeroSummary(null);
    setAiFilledFields({});  // Clear AI-filled field tracking
    setHasAISuggestions(false);
  };

  /**
   * Populate calculator fields from AI-extracted parameters
   * Maps AI parameters to calculator state and tracks which fields were AI-filled
   * Validates parameters before applying them
   * 
   * This function is called when user accepts AI suggestions
   */
  const populateFromAI = () => {
    if (!extractedParams) return;

    const fieldsUpdated = {};
    let updateCount = 0;

    // Map location coordinates to calculator fields
    if (extractedParams.location && extractedParams.location.lat && extractedParams.location.lng) {
      const lat = extractedParams.location.lat;
      const lng = extractedParams.location.lng;
      
      setLatitude(lat.toString());
      setLongitude(lng.toString());
      setMarkerPosition([lat, lng]);
      fieldsUpdated.latitude = true;
      fieldsUpdated.longitude = true;
      updateCount += 2;

      // Fly to location on map
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
      }

      // Fetch location name for display
      fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`)
        .then(res => res.json())
        .then(data => setLocationName(data.results[0]?.formatted || 'Unknown location'))
        .catch(() => setLocationName('Location loaded'));
    }

    // Map area to calculator field
    if (extractedParams.area && extractedParams.area.value) {
      if (validatedParams.area?.isValid) {
        setArea(extractedParams.area.value.toString());
        fieldsUpdated.area = true;
        updateCount++;
      }
    }

    // Map tilt angle to calculator field
    if (extractedParams.technical && extractedParams.technical.tilt !== null) {
      if (validatedParams.tilt?.isValid) {
        setTilt(extractedParams.technical.tilt.toString());
        fieldsUpdated.tilt = true;
        updateCount++;
      }
    }

    // Map azimuth to calculator field
    if (extractedParams.technical && extractedParams.technical.azimuth !== null) {
      if (validatedParams.azimuth?.isValid) {
        setAzimuth(extractedParams.technical.azimuth.toString());
        fieldsUpdated.azimuth = true;
        updateCount++;
      }
    }
    
    // Map budget to calculator field
    if (extractedParams.financial && extractedParams.financial.budget) {
      if (validatedParams.budget?.isValid) {
        setBudget(extractedParams.financial.budget.toString());
        fieldsUpdated.budget = true;
        updateCount++;
      }
    }
    
    // Map monthly bill to calculator field
    if (extractedParams.financial && extractedParams.financial.monthlyBill) {
      if (validatedParams.monthlyBill?.isValid) {
        setMonthlyBill(extractedParams.financial.monthlyBill.toString());
        fieldsUpdated.monthlyBill = true;
        updateCount++;
      }
    }

    // Update AI-filled fields tracking
    setAiFilledFields(fieldsUpdated);

    // Log auto-fill usage for analytics
    const currentCount = parseInt(localStorage.getItem('autoFillUsageCount') || '0', 10);
    localStorage.setItem('autoFillUsageCount', (currentCount + 1).toString());
    console.log('AI Auto-fill applied:', { fieldsUpdated, updateCount });

    // Show success message if fields were updated
    if (updateCount > 0) {
      alert(`✨ ${updateCount} field${updateCount > 1 ? 's' : ''} auto-filled from AI suggestions!`);
      setHasAISuggestions(false);
    }
  };

  /**
   * Clear AI suggestions and reset AI-filled field tracking
   * Removes visual feedback for AI-filled fields
   */
  const clearAISuggestions = () => {
    setAiFilledFields({});
    setHasAISuggestions(false);
  };

  /**
   * Handle opening the AI Parameter Review modal
   * Shows the modal with current extracted parameters
   */
  const handleOpenParameterReview = () => {
    setShowParameterReview(true);
    setSnackbarOpen(false);  // Close snackbar when opening modal
  };

  /**
   * Handle closing the AI Parameter Review modal
   */
  const handleCloseParameterReview = () => {
    setShowParameterReview(false);
  };

  /**
   * Handle applying parameters from AI Parameter Review modal
   * This is called when user clicks "Apply to Calculator" in the review modal
   * 
   * @param {Object} parameters - Parameters to apply from the review modal
   */
  const handleApplyParametersFromReview = (parameters) => {
    if (!parameters) return;

    const fieldsUpdated = {};
    let updateCount = 0;

    // Map location coordinates to calculator fields
    // IMPORTANT: This also sets markerPosition which makes the form visible
    if (parameters.location && parameters.location.lat && parameters.location.lng) {
      if (validatedParams.coordinates?.isValid) {
        const lat = parameters.location.lat;
        const lng = parameters.location.lng;
        
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        
        // Set marker position - this makes the calculator form appear!
        setMarkerPosition([lat, lng]);
        
        fieldsUpdated.latitude = true;
        fieldsUpdated.longitude = true;
        updateCount += 2;

        // Fly to location on map
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
        }

        // Fetch location name for display
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`)
          .then(res => res.json())
          .then(data => setLocationName(data.results[0]?.formatted || 'Unknown location'))
          .catch(() => setLocationName('Location loaded'));
      }
    }
    
    // Note: Form is now always visible, so we can apply params even without location
    // Location will be validated when user clicks Calculate

    // Map area to calculator field
    if (parameters.area && parameters.area.value) {
      if (validatedParams.area?.isValid) {
        setArea(parameters.area.value.toString());
        fieldsUpdated.area = true;
        updateCount++;
      }
    }

    // Map tilt angle to calculator field
    if (parameters.technical && parameters.technical.tilt !== null) {
      if (validatedParams.tilt?.isValid) {
        setTilt(parameters.technical.tilt.toString());
        fieldsUpdated.tilt = true;
        updateCount++;
      }
    }

    // Map azimuth to calculator field
    if (parameters.technical && parameters.technical.azimuth !== null) {
      if (validatedParams.azimuth?.isValid) {
        setAzimuth(parameters.technical.azimuth.toString());
        fieldsUpdated.azimuth = true;
        updateCount++;
      }
    }

    // Update AI-filled fields tracking
    setAiFilledFields(fieldsUpdated);

    // Log auto-fill usage for analytics
    const currentCount = parseInt(localStorage.getItem('autoFillUsageCount') || '0', 10);
    localStorage.setItem('autoFillUsageCount', (currentCount + 1).toString());
    console.log('AI Auto-fill applied from review modal:', { fieldsUpdated, updateCount });

    // Close the review modal
    setShowParameterReview(false);
    
    // Show success snackbar
    if (updateCount > 0) {
      setSnackbarMessage(`✨ ${updateCount} field${updateCount > 1 ? 's' : ''} successfully applied!`);
      setSnackbarOpen(true);
      setHasAISuggestions(false);
      
      // Optionally minimize or close chatbot
      // Uncomment the line below if you want to close chatbot after applying
      // setChatbotOpen(false);
    }
  };

  /**
   * Handle editing a parameter value in the review modal
   * 
   * @param {string} paramKey - Key of the parameter being edited
   * @param {*} newValue - New value for the parameter
   */
  const handleEditParameter = (paramKey, newValue) => {
    // Update the review parameters with the new value
    if (reviewParameters) {
      const updatedParams = { ...reviewParameters };
      // Parse the paramKey and update the appropriate field
      // This is a placeholder for more complex parameter editing logic
      console.log('Parameter edited:', paramKey, newValue);
      setReviewParameters(updatedParams);
    }
  };

  /**
   * Handle closing the snackbar notification
   */
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleOpenFeedbackDialog = () => {
    setFeedbackError('');
    setFeedbackOpen(true);
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackOpen(false);
    setFeedbackError('');
  };

  const handleSubmitFeedback = async () => {
    const trimmedComment = feedbackComment.trim();
    if (feedbackRating < 1 || !trimmedComment) {
      setFeedbackError('Please provide a star rating and a comment before submitting.');
      return;
    }

    const feedbackPayload = {
      rating: feedbackRating,
      comment: trimmedComment,
      submittedAt: new Date().toISOString(),
      context: {
        latitude: latitude || null,
        longitude: longitude || null,
        locationName: locationName || null
      }
    };

    try {
      await submitSolarCalculatorRating(feedbackPayload).unwrap();
    } catch (error) {
      setFeedbackError(error?.data?.message || 'Failed to submit evaluation. Please try again.');
      return;
    }

    setFeedbackRating(0);
    setFeedbackComment('');
    setFeedbackError('');
    setFeedbackOpen(false);
    setSnackbarMessage('Thank you! Your calculator evaluation has been recorded.');
    setSnackbarOpen(true);
  };


  const handleCalculatorDataUpdate = (data) => {
    setCalculatorData(prev => {
      const newData = {
        ...prev,
        ...data
      };
      return newData;
    });
    
    // Store calculation results for Phase 4 components
    if (data.results) {
      setCalculatorResults(data.results);
      // What-If Apply metrics stay on Summary until the user runs main map Calculate (clears hero there)
    }
  };

  /** What-If Set to Default: drop scenario overlay on Summary and rerun main calculator so all tabs match map inputs */
  const handleWhatIfSetToDefault = useCallback(() => {
    setRecommendationHeroSummary(null);
    setWhatIfHeroSummary(null);
    setAppliedScenarioResultsByType(null);
    setWhatIfAppliedComparisonParams(null);
    setWhatIfApplyTrigger((n) => n + 1);
  }, []);

  /** Active overlay metrics currently shown on Summary (recommendation apply takes priority over What-If apply). */
  const activeSummaryOverlay = recommendationHeroSummary ?? whatIfHeroSummary;
  /** Keep AI Analysis narrative in sync with the latest computed/overlayed calculator metrics. */
  const aiAnalysisResults = useMemo(() => {
    if (!calculatorResults) return null;
    if (!activeSummaryOverlay) return calculatorResults;

    const capacityVal = Number(activeSummaryOverlay.Rcapacity);
    const annualProductionVal = Number(activeSummaryOverlay.eeannual);
    const annualSavingsVal = Number(activeSummaryOverlay.totalSavings);
    const panelCountVal = Number(activeSummaryOverlay.panelCount);

    return {
      ...calculatorResults,
      systemCapacity:
        Number.isFinite(capacityVal) && capacityVal > 0
          ? capacityVal
          : calculatorResults.systemCapacity,
      capacity:
        Number.isFinite(capacityVal) && capacityVal > 0
          ? capacityVal
          : calculatorResults.capacity,
      annualProduction:
        Number.isFinite(annualProductionVal) && annualProductionVal >= 0
          ? annualProductionVal
          : calculatorResults.annualProduction,
      annualSavings:
        Number.isFinite(annualSavingsVal) && annualSavingsVal >= 0
          ? annualSavingsVal
          : calculatorResults.annualSavings,
      panelCount:
        Number.isFinite(panelCountVal) && panelCountVal >= 0
          ? panelCountVal
          : calculatorResults.panelCount,
      investment:
        Number.isFinite(Number(calculatorResults.investment)) && Number(calculatorResults.investment) > 0
          ? Number(calculatorResults.investment)
          : Number.isFinite(Number(budget)) && Number(budget) > 0
            ? Number(budget)
            : 200000
    };
  }, [calculatorResults, activeSummaryOverlay, budget]);
  /** Dynamic budget baseline (map input first, then latest computed investment/cost, then fallback). */
  const resolvedBudgetValue = useMemo(() => {
    const mapBudget = Number(budget);
    if (Number.isFinite(mapBudget) && mapBudget > 0) return mapBudget;
    const computedInvestment = Number(calculatorResults?.investment);
    if (Number.isFinite(computedInvestment) && computedInvestment > 0) return computedInvestment;
    const typicalSystemCost = Number(calculatorResults?.systemCosts?.gridTied?.typical);
    if (Number.isFinite(typicalSystemCost) && typicalSystemCost > 0) return typicalSystemCost;
    return 200000;
  }, [budget, calculatorResults]);

  /** Average monthly consumption (kWh) across the usage table — display-only, for the
   * Monthly Consumption procedure's mode-aware UI text (Analysis headline, What-If stat card). */
  const averageMonthlyConsumptionKwh = useMemo(() => {
    const values = recommendationRows
      .map((row) => resolveMonthlyConsumption(row).value)
      .filter((v) => Number.isFinite(v) && v >= 0);
    if (values.length === 0) return undefined;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }, [recommendationRows, resolveMonthlyConsumption]);

  /** Use applied What-If values for System Comparison while What-If overlay is active. */
  const systemComparisonBaseParameters = useMemo(() => ({
    area: parseFloat(area),
    calculationMode,
    monthlyConsumptionKwh: averageMonthlyConsumptionKwh,
    budget: resolvedBudgetValue,
    tilt: parseFloat(tilt) || FIXED_PANEL_TILT_DEGREES,
    panelSize: parseFloat(panelSize),
    rate:
      Number(activeSummaryOverlay ? whatIfAppliedComparisonParams?.rate : undefined) > 0
        ? Number(whatIfAppliedComparisonParams.rate)
        : parseFloat(rate) || 10,
    daytimeUsePercent:
      activeSummaryOverlay && whatIfAppliedComparisonParams?.daytimeUsePercent != null
        ? whatIfAppliedComparisonParams.daytimeUsePercent
        : daytimeUsePercent,
    nighttimeUsePercent:
      activeSummaryOverlay && whatIfAppliedComparisonParams?.daytimeUsePercent != null
        ? 100 - clampDaytimePercent(whatIfAppliedComparisonParams.daytimeUsePercent)
        : nighttimeUsePercent,
    batterySizePercent:
      activeSummaryOverlay && whatIfAppliedComparisonParams?.batterySizePercent != null
        ? whatIfAppliedComparisonParams.batterySizePercent
        : batterySizePercent
  }), [
    area,
    calculationMode,
    averageMonthlyConsumptionKwh,
    budget,
    tilt,
    panelSize,
    rate,
    daytimeUsePercent,
    nighttimeUsePercent,
    batterySizePercent,
    resolvedBudgetValue,
    activeSummaryOverlay,
    whatIfHeroSummary,
    whatIfAppliedComparisonParams
  ]);

  /**
   * Aligns System Comparison with Summary & Results: same capacity, production, savings, and panel count.
   * When What-If hero metrics are shown on Summary, comparison cards use those figures too.
   */
  const systemComparisonBaseResults = useMemo(() => {
    if (!calculatorResults) return null;
    // Recommendation Apply uses summary-scaled values; avoid stale per-scenario bundle overriding annual savings.
    const scenarioResultsForComparison = recommendationHeroSummary
      ? null
      : (appliedScenarioResultsByType || calculatorResults.scenarioResultsByType);
    if (!activeSummaryOverlay) {
      return {
        systemCapacity: calculatorResults.systemCapacity,
        capacity: calculatorResults.systemCapacity,
        cost: calculatorResults.systemCosts?.gridTied?.typical || resolvedBudgetValue,
        annualSavings: calculatorResults.annualSavings,
        annualProduction: calculatorResults.annualProduction,
        paybackPeriod: calculatorResults.paybackPeriod,
        roi: calculatorResults.roi,
        utilizationFactors: calculatorResults.utilizationFactors,
        utilizationFactorsByCategory: calculatorResults.utilizationFactorsByCategory,
        panelCount: calculatorResults.panelCount,
        monthlyGenerationKwh: calculatorResults.monthlyGenerationKwh,
        pricingSource: 'Calculated Estimate',
        scenarioResultsByType: scenarioResultsForComparison
      };
    }
    const h = activeSummaryOverlay;
    const annualProd = parseFloat(String(h.eeannual ?? ''));
    const annualSav = parseFloat(String(h.totalSavings ?? ''));
    return {
      systemCapacity: h.Rcapacity,
      capacity: h.Rcapacity,
      cost: calculatorResults.systemCosts?.gridTied?.typical || resolvedBudgetValue,
      annualSavings: Number.isFinite(annualSav) ? annualSav : calculatorResults.annualSavings,
      annualProduction: Number.isFinite(annualProd) ? annualProd : calculatorResults.annualProduction,
      paybackPeriod: calculatorResults.paybackPeriod,
      roi: calculatorResults.roi,
      utilizationFactors: calculatorResults.utilizationFactors,
      utilizationFactorsByCategory: calculatorResults.utilizationFactorsByCategory,
      panelCount: h.panelCount ?? calculatorResults.panelCount,
      monthlyGenerationKwh: undefined,
      pricingSource: h.pricingSource || 'What-If scenario (applied)',
      /** Per preset simulated savings/production so System Comparison cards match What-If Simulated Results */
      scenarioResultsByType: scenarioResultsForComparison
    };
  }, [
    calculatorResults,
    activeSummaryOverlay,
    appliedScenarioResultsByType,
    recommendationHeroSummary,
    resolvedBudgetValue
  ]);

  /** Single normalized baseline passed to What-If so sliders/results follow Summary/System Comparison state. */
  const whatIfBaseParameters = useMemo(() => ({
    ...systemComparisonBaseParameters,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    azimuth: parseFloat(azimuth)
  }), [systemComparisonBaseParameters, latitude, longitude, azimuth]);

  /**
   * Must match systemComparisonBaseResults exactly — feeds the same computeSystemComparisonScenarios()
   * call System Comparison uses, so What-If's Payback Period / ROI / Investment agree with it for
   * every preset. Memoized (rather than an inline object literal in JSX) so its identity stays
   * stable across unrelated MapComponent re-renders — without this, ScenarioSimulator's internal
   * useMemo(() => computeSystemComparisonScenarios(...)) would recompute on every keystroke
   * anywhere on the page, not just when these underlying values actually change.
   */
  const whatIfBaseResults = useMemo(() => {
    if (!calculatorResults) return null;
    return {
      capacity: activeSummaryOverlay?.Rcapacity ?? calculatorResults.systemCapacity,
      annualSavings:
        activeSummaryOverlay?.totalSavings != null
          ? Number(activeSummaryOverlay.totalSavings)
          : calculatorResults.annualSavings,
      annualProduction:
        activeSummaryOverlay?.eeannual != null
          ? Number(activeSummaryOverlay.eeannual)
          : calculatorResults.annualProduction,
      paybackPeriod: calculatorResults.paybackPeriod?.gridTied || 6,
      roi: calculatorResults.roi?.gridTied || 250,
      panelCount: activeSummaryOverlay?.panelCount ?? calculatorResults.panelCount,
      investment: calculatorResults.investment || resolvedBudgetValue,
      scenarioResultsByType: recommendationHeroSummary
        ? null
        : (appliedScenarioResultsByType || calculatorResults.scenarioResultsByType)
    };
  }, [
    calculatorResults,
    activeSummaryOverlay,
    recommendationHeroSummary,
    appliedScenarioResultsByType,
    resolvedBudgetValue
  ]);

  /** Memoized so identity stays stable across unrelated re-renders (see whatIfBaseResults above). */
  const whatIfMainCalculatorBaseParameters = useMemo(() => ({
    area: parseFloat(area),
    calculationMode,
    monthlyConsumptionKwh: averageMonthlyConsumptionKwh,
    budget: resolvedBudgetValue,
    tilt: parseFloat(tilt) || FIXED_PANEL_TILT_DEGREES,
    panelSize: parseFloat(panelSize),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    azimuth: parseFloat(azimuth),
    rate: parseFloat(rate),
    daytimeUsePercent,
    nighttimeUsePercent,
    batterySizePercent
  }), [
    area,
    calculationMode,
    averageMonthlyConsumptionKwh,
    resolvedBudgetValue,
    tilt,
    panelSize,
    latitude,
    longitude,
    azimuth,
    rate,
    daytimeUsePercent,
    nighttimeUsePercent,
    batterySizePercent
  ]);

  /** Remount What-If when summary overlay changes so slider/result baselines resync immediately. */
  const whatIfSyncKey = useMemo(() => {
    const cap = Number(activeSummaryOverlay?.Rcapacity);
    const prod = Number(activeSummaryOverlay?.eeannual);
    const sav = Number(activeSummaryOverlay?.totalSavings);
    const panelCount = Number(activeSummaryOverlay?.panelCount);
    const rateVal = Number(whatIfBaseParameters?.rate);
    const dayVal = Number(whatIfBaseParameters?.daytimeUsePercent);
    const battVal = Number(whatIfBaseParameters?.batterySizePercent);
    const budgetVal = Number(whatIfBaseParameters?.budget);
    return [
      Number.isFinite(cap) ? cap.toFixed(3) : 'base',
      Number.isFinite(prod) ? prod.toFixed(1) : 'base',
      Number.isFinite(sav) ? sav.toFixed(2) : 'base',
      Number.isFinite(panelCount) ? panelCount : 'base',
      Number.isFinite(rateVal) ? rateVal.toFixed(2) : '10.00',
      Number.isFinite(dayVal) ? dayVal.toFixed(2) : '0.00',
      Number.isFinite(battVal) ? battVal.toFixed(2) : '0.00',
      Number.isFinite(budgetVal) ? Math.round(budgetVal) : '200000',
      recommendationSyncVersion
    ].join('|');
  }, [activeSummaryOverlay, whatIfBaseParameters, recommendationSyncVersion]);

  const handleFindCurrentLocation = async () => {
    try {
      const { lat, lng } = await getCurrentLocation();
      const coords = [lat, lng];
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      setMarkerPosition(coords);

      const geoRes = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`
      );
      const geoData = await geoRes.json();
      setLocationName(geoData.results[0]?.formatted || 'Unknown location');
      mapRef.current?.flyTo(coords, 16, { duration: 1.5 });
    } catch (error) {
      alert(error.message || 'Failed to get current location.');
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim() || !mapRef.current) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const position = [parseFloat(lat), parseFloat(lon)];
        setMarkerPosition(position);
        setLatitude(parseFloat(lat).toFixed(6));
        setLongitude(parseFloat(lon).toFixed(6));
        setSearchError('');

        const geoRes = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPENCAGE_API_KEY}`
        );
        const geoData = await geoRes.json();
        const resolvedLocationName = geoData.results[0]?.formatted || 'Unknown location';
        setLocationName(resolvedLocationName);
        mapRef.current.flyTo(position, 16, { duration: 1.5 });

        try {
          await createSolarCalculatorActivityLog({
            locationInput: searchText.trim(),
            searchQuery: searchText.trim(),
            locationName: resolvedLocationName,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            source: 'text_search'
          }).unwrap();
        } catch (error) {
          // Do not block the main search flow if activity logging fails.
        }
      } else {
        setSearchError('Location not found');
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    }
  };

  const centroid = useMemo(() => {
    if (polygonPoints.length >= 3) {
      const polygon = turf.polygon([[...polygonPoints, polygonPoints[0]]]);
      const center = turf.centroid(polygon);
      return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
    }
    return null;
  }, [polygonPoints]);

  useEffect(() => {
    if (polygonPoints.length >= 3) {
      const polygon = turf.polygon([[...polygonPoints, polygonPoints[0]]]);
      const areaInSqMeters = turf.area(polygon);
      setMeasuredArea(areaInSqMeters.toFixed(2));
    } else {
      setMeasuredArea(null);
    }
  }, [polygonPoints]);

  // Check if AI has extracted parameters that can be auto-filled
  // This determines if we show the "Accept AI Suggestions" button
  useEffect(() => {
    // Debug logging to help troubleshoot
    console.log('Checking AI suggestions:', { 
      hasExtractedParams: !!extractedParams,
      extractedFields: extractedParams?.extractedFields,
      validatedParams: validatedParams 
    });

    if (!extractedParams) {
      setHasAISuggestions(false);
      return;
    }

    // Check if any parameters are available from AI extraction
    // We'll be more lenient - show suggestions if we have ANY extracted parameters
    const hasAnyParams = extractedParams.extractedFields && extractedParams.extractedFields.length > 0;
    
    // Check if parameters are valid (but allow some to be invalid)
    const hasValidParams = hasAnyParams && (
      (extractedParams.location?.confidence > 0) ||
      (extractedParams.area?.confidence > 0) ||
      (extractedParams.financial?.confidence > 0) ||
      (extractedParams.technical?.confidence > 0)
    );

    console.log('Has valid params:', hasValidParams);
    
    setHasAISuggestions(hasValidParams);
    
    // Show snackbar notification when parameters are extracted
    // Show even for just 1 parameter to be more helpful
    // Only show if these are NEW parameters (different from last shown) AND snackbar is not already open
    if (hasValidParams && extractedParams.extractedFields && extractedParams.extractedFields.length >= 1 && !snackbarOpen) {
      const currentParamKey = JSON.stringify(extractedParams.extractedFields.sort());
      const isNewParams = currentParamKey !== lastShownParamsRef.current;
      
      // Additional check: only show if we actually have meaningful parameter values
      const hasMeaningfulParams = extractedParams.extractedFields.some(field => {
        switch(field) {
          case 'area':
            return extractedParams.area?.value && extractedParams.area.value > 0;
          case 'financial':
            return (extractedParams.financial?.budget && extractedParams.financial.budget > 0) ||
                   (extractedParams.financial?.monthlyBill && extractedParams.financial.monthlyBill > 0);
          case 'location':
            return extractedParams.location?.lat && extractedParams.location?.lng;
          case 'technical':
            return extractedParams.technical?.tilt || extractedParams.technical?.azimuth;
          default:
            return false;
        }
      });
      
      if (isNewParams && hasMeaningfulParams) {
        const paramCount = extractedParams.extractedFields.length;
        const paramTypes = extractedParams.extractedFields.join(', ');
        
        setSnackbarMessage(`AI found ${paramCount} parameter${paramCount > 1 ? 's' : ''} (${paramTypes})! Review and apply?`);
        setSnackbarOpen(true);
        
        // Don't auto-open the drawer - let user decide when to open it
        // The snackbar notification will guide them to open the drawer if needed
        console.log('AI suggestions available - user can open drawer via snackbar or buttons');
        
        // Prepare parameters for review modal
        setReviewParameters(extractedParams);
        
        // Track that we've shown these parameters
        lastShownParamsRef.current = currentParamKey;
        
        console.log('Snackbar shown with message:', `AI found ${paramCount} parameters`);
      }
    }
  }, [extractedParams, validatedParams, snackbarOpen]);

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    const map = mapRef.current;
    if (!map || map.pm.globalDrawModeEnabled() || map.pm.globalEditModeEnabled()) return;

    const position = [lat, lng];
    setMarkerPosition(position);
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setLocationName('Fetching address...');

    try {
      const geoRes = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`
      );
      const geoData = await geoRes.json();
      setLocationName(geoData.results[0]?.formatted || 'Unknown location');
    } catch {
      setLocationName('Error fetching location');
    }
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>

        <MapDisplay
          mapRef={mapRef}
          markerPosition={markerPosition}
          setMarkerPosition={setMarkerPosition}
          locationName={locationName}
          setLocationName={setLocationName}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
          polygonPoints={polygonPoints}
          centroid={centroid}
          setPolygonPoints={setPolygonPoints}
          setArea={setArea}
        />

        {/* Floating FABs - Always show for easy access */}
        <Box sx={{ 
          position: 'fixed', 
          top: { xs: 80, sm: 90 }, 
          right: (() => {
            if (drawerOpen) {
              // Only drawer open: position to avoid drawer
              return inputCardClearance;
            } else {
              // Neither open OR chatbot open: normal position (chatbot is modal overlay)
              return { xs: 20, sm: 30 };
            }
          })(), 
          zIndex: 9999,
          transition: 'right 0.3s ease-in-out',
          // Debug: Ensure buttons are visible
          display: 'block !important',
          visibility: 'visible !important',
          opacity: '1 !important'
        }}>
            {/* AI Chatbot Button (temporarily hidden) */}
            {SHOW_AREC_HELIOS_FLOATING_ICON && (
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Fab
                  size="large"
                  aria-label="ai-assistant"
                  onClick={() => {
                    // Mutually exclusive: close calculator when opening chatbot
                    if (drawerOpen) setDrawerOpen(false);
                    setChatbotOpen(true);
                  }}
                  sx={{
                    bgcolor: '#1976d2',
                    color: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(25,118,210,0.4)',
                    '&:hover': {
                      bgcolor: '#1565c0',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease-in-out',
                    border: '2px solid white',
                    // Debug: Ensure button is visible
                    display: 'inline-flex !important',
                    visibility: 'visible !important',
                    opacity: '1 !important'
                  }}
                >
                  <SmartToyIcon />
                </Fab>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    color: 'white',
                    mt: 0.5,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  cAIre
                </Typography>
              </Box>
            )}

            {/* Calculator Button */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Fab
                size="large"
                aria-label="calculate"
                onClick={handleToggleDrawer}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                  '&:hover': {
                    bgcolor: '#1565c0',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease-in-out',
                  border: '2px solid white',
                  // Debug: Ensure button is visible
                  display: 'inline-flex !important',
                  visibility: 'visible !important',
                  opacity: '1 !important'
                }}
              >
                <CalculateRoundedIcon />
              </Fab>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  color: 'white', 
                  mt: 0.5,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Calculator
              </Typography>
            </Box>
          </Box>

        {/* Floating user evaluation button */}
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 20, sm: 28 },
            right: drawerOpen ? inputCardClearance : { xs: 20, sm: 30 },
            zIndex: 9999,
            transition: 'right 0.3s ease-in-out'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.7)',
                px: 1.25,
                py: 0.75,
                borderRadius: 1.5,
                fontSize: { xs: '12px', sm: '14px' },
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              How is your experience?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  textAlign: 'center',
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1.5,
                  fontSize: { xs: '10px', sm: '11px' },
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                {averageRatingBadgeLabel}
                <StarRoundedIcon sx={{ fontSize: '13px' }} />
              </Typography>
              <Tooltip title="Rate the solar calculator" arrow>
                <Fab
                  size="large"
                  aria-label="rate-calculator"
                  onClick={handleOpenFeedbackDialog}
                  sx={{
                    bgcolor: '#f57c00',
                    color: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(245,124,0,0.4)',
                    '&:hover': {
                      bgcolor: '#ef6c00',
                      transform: 'scale(1.08)'
                    },
                    transition: 'all 0.2s ease-in-out',
                    border: '2px solid white'
                  }}
                >
                  <StarRoundedIcon />
                </Fab>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Right panel - floating card, map stays fully visible (no backdrop) */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          variant="persistent"
          sx={{
            zIndex: chatbotOpen ? 1301 : 9998, // Higher z-index when chatbot is open
            '& .MuiDrawer-paper': {
              width: inputCardWidth,
              backgroundColor: '#ffffff',  // Clean white background
              backgroundImage: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)',  // Subtle gradient
              top: 16,
              right: 16,
              height: `calc(${drawerHeight} - 32px)`,
              maxHeight: 'calc(100vh - 32px)',
              borderRadius: 3,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',  // Floating card shadow
              maxWidth: 'calc(100vw - 32px)',
              transition: 'width 0.25s ease-in-out, height 0.2s ease-in-out',
              position: 'fixed',
            },
          }}
        >
          <AppBar 
            position="sticky" 
            sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #00acc1 100%)',  // Modern gradient
              boxShadow: '0 2px 8px rgba(25,118,210,0.15)'
            }} 
            elevation={0}
          >
            <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="white">
                {activeProcedure.calculatorName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`Used ${calculatorUses} ${calculatorUses === 1 ? 'time' : 'times'}`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                />
                <IconButton onClick={() => setDrawerOpen(false)}>
                  <ClearIcon sx={{ color: 'white' }} />
                </IconButton>
              </Box>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          </AppBar>

          <Box p={3} sx={{ backgroundColor: '#ffffff', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {/* Search form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => handlePopupOpen('about')} 
                    sx={{ 
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      fontWeight: 600,
                      '&:hover': { 
                        borderColor: '#1565c0',
                        bgcolor: '#e3f2fd'
                      }
                    }}
                  >
                    About
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => handlePopupOpen('definition')} 
                    sx={{ 
                      borderColor: '#00acc1',
                      color: '#00acc1',
                      fontWeight: 600,
                      '&:hover': { 
                        borderColor: '#00838f',
                        bgcolor: '#e0f7fa'
                      }
                    }}
                  >
                    Definition
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => handlePopupOpen('howto')} 
                    sx={{ 
                      borderColor: '#26a69a',
                      color: '#26a69a',
                      fontWeight: 600,
                      '&:hover': { 
                        borderColor: '#00897b',
                        bgcolor: '#e0f2f1'
                      }
                    }}
                  >
                    How to Use
                  </Button>
                </Stack>

                {/* Active calculation procedure — chosen in the pop-up selector, changeable any time */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: activeProcedure.accent,
                    bgcolor: activeProcedure.tint
                  }}
                >
                  <ActiveProcedureIcon sx={{ color: activeProcedure.accent, fontSize: 26 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: '#607d8b', fontWeight: 700, display: 'block', lineHeight: 1.2, letterSpacing: 0.4 }}
                    >
                      CALCULATION PROCEDURE
                    </Typography>
                    <Typography noWrap sx={{ fontWeight: 700, color: activeProcedure.accent }}>
                      {activeProcedure.title}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<SyncAltIcon />}
                    onClick={handleOpenProcedureDialog}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      color: activeProcedure.accent
                    }}
                  >
                    Change
                  </Button>
                </Box>

                <Stack direction="row" spacing={1}>
                  <TextField
                    placeholder="Search location (e.g. Batac, Manila)"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#ffffff',
                        color: '#2c3e50',
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
                        },
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: '#90a4ae',
                        opacity: 0.9,
                      },
                    }}
                  />
                  <Tooltip title="Search location" arrow>
                    <Button 
                      variant="contained" 
                      type="submit" 
                      sx={{ 
                        bgcolor: '#1976d2',
                        color: 'white',
                        minWidth: 48,
                        '&:hover': { 
                          bgcolor: '#1565c0',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                    <TravelExploreRoundedIcon />
                  </Button>
                  </Tooltip>
                  <Tooltip title="Use current location" arrow>
                    <Button 
                      variant="contained" 
                      onClick={handleFindCurrentLocation} 
                      sx={{ 
                        bgcolor: '#00acc1',
                        color: 'white',
                        minWidth: 48,
                        '&:hover': { 
                          bgcolor: '#00838f',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                    <PersonPinCircleRoundedIcon />
                  </Button>
                  </Tooltip>
                </Stack>
                {searchError && (
                  <Typography 
                    color="error" 
                    variant="caption" 
                    sx={{ 
                      mt: 1, 
                      display: 'block',
                      p: 1,
                      bgcolor: '#ffebee',
                      borderRadius: 1,
                      border: '1px solid #ffcdd2'
                    }}
                  >
                    {searchError}
                  </Typography>
                )}


                {/* Always show the form - removed markerPosition condition */}
                <>
                  {/* Info Banner - Show when no location is set AND no AI suggestions */}
                  {!markerPosition && !latitude && !longitude && !hasAISuggestions && (
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#e3f2fd', 
                      borderRadius: 2,
                      border: '1px solid #90caf9',
                      mb: 2
                    }}>
                      <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 600 }}>
                        💡 Get Started: Click on the map, use current location, or chat with AI to set your location
                      </Typography>
                    </Box>
                  )}

                    <Stack spacing={2}>

                      {calculationMode === 'rooftop' && (
                      <Stack direction="row" spacing={1} alignItems="flex-end">
                        <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Roof Area (m²)"
                          value={area}
                            onChange={(e) => {
                              setArea(e.target.value);
                              // Clear AI-filled indicator when user manually edits
                              if (aiFilledFields.area) {
                                setAiFilledFields(prev => ({ ...prev, area: false }));
                              }
                            }}
                            sx={getFieldInputStyles(aiFilledFields.area, shouldShowError('area', area))}
                          size="small"
                          type="number"
                          error={shouldShowError('area', area)}
                          helperText={shouldShowError('area', area) ? 'Required field' : ''}
                            fullWidth
                          />
                          {aiFilledFields.area && (
                            <Chip 
                              label="✨ Suggested by AI" 
                              size="small" 
                              sx={{ 
                                mt: 0.5, 
                                bgcolor: '#e0f2f1', 
                                color: '#00695c',
                                fontSize: '0.7rem',
                                height: 20
                              }} 
                            />
                          )}
                        </Box>

                        <Tooltip title="Measure area on map" arrow>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<StraightenIcon />}
                          sx={{
                            height: '40px',
                            minWidth: '100px',
                            px: 2,
                              bgcolor: '#26a69a',  // Teal for measure tool
                            color: 'white',
                              fontWeight: 600,
                              '&:hover': { 
                                bgcolor: '#00897b',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(38,166,154,0.3)'
                              },
                              transition: 'all 0.2s ease-in-out'
                          }}
                          onClick={() => {
                            setPolygonPoints([]);
                            mapRef.current?.pm.enableDraw('Polygon');
                          }}
                        >
                          Measure
                        </Button>
                        </Tooltip>
                      </Stack>
                      )}

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Latitude"
                          value={latitude}
                          onChange={(e) => {
                            setLatitude(e.target.value);
                            if (aiFilledFields.latitude) {
                              setAiFilledFields(prev => ({ ...prev, latitude: false }));
                            }
                          }}
                          sx={getFieldInputStyles(aiFilledFields.latitude, shouldShowError('lat', latitude))} 
                          size="small" 
                          error={shouldShowError('lat', latitude)}
                          helperText={shouldShowError('lat', latitude) ? 'Required field' : ''}
                          fullWidth 
                        />
                        {aiFilledFields.latitude && (
                          <Chip 
                            label="✨ Suggested by AI" 
                            size="small" 
                            sx={{ 
                              mt: 0.5, 
                              bgcolor: '#e0f2f1', 
                              color: '#00695c',
                              fontSize: '0.7rem',
                              height: 20
                            }} 
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Longitude"
                          value={longitude} 
                          onChange={(e) => {
                            setLongitude(e.target.value);
                            if (aiFilledFields.longitude) {
                              setAiFilledFields(prev => ({ ...prev, longitude: false }));
                            }
                          }}
                          sx={getFieldInputStyles(aiFilledFields.longitude, shouldShowError('lon', longitude))} 
                          size="small" 
                          error={shouldShowError('lon', longitude)}
                          helperText={shouldShowError('lon', longitude) ? 'Required field' : ''}
                          fullWidth 
                        />
                        {aiFilledFields.longitude && (
                          <Chip 
                            label="✨ Suggested by AI" 
                            size="small" 
                            sx={{ 
                              mt: 0.5, 
                              bgcolor: '#e0f2f1', 
                              color: '#00695c',
                              fontSize: '0.7rem',
                              height: 20
                            }} 
                          />
                        )}
                      </Box>
                      </Stack>

                      {/* Usage profile — shown in both procedures: it shapes how much of the
                          generated energy is actually consumed and how much is stored. */}
                      <Box sx={{ px: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600, mb: 0.5 }}>
                          Daytime use (%)
                        </Typography>
                        <Slider
                          value={daytimeUsePercent}
                          onChange={(_, value) => {
                            setDaytimeUsePercent(value);
                            if (aiFilledFields.daytimeUse) {
                              setAiFilledFields((prev) => ({ ...prev, daytimeUse: false }));
                            }
                          }}
                          min={0}
                          max={100}
                          step={10}
                          marks
                          valueLabelDisplay="auto"
                          valueLabelFormat={(v) => `${v}%`}
                          sx={{
                            color: '#1976d2',
                            '& .MuiSlider-markLabel': { fontSize: '0.7rem' }
                          }}
                        />
                        {aiFilledFields.daytimeUse && (
                          <Chip 
                            label="✨ Suggested by AI" 
                            size="small" 
                            sx={{ 
                              mt: 0.5, 
                              bgcolor: '#e0f2f1', 
                              color: '#00695c',
                              fontSize: '0.7rem',
                              height: 20
                            }} 
                          />
                        )}
                      </Box>
                      {/* Roof-design inputs — only part of the Solar Rooftop Potential procedure.
                          Monthly Consumption sizes from usage, so these stay hidden there and
                          fall back to their defaults. */}
                      {!isConsumptionMode && (
                      <>
                      <Box>
                        <TextField
                          label="Tilt (°)"
                          value={tilt}
                          onChange={(e) => {
                            setTilt(e.target.value);
                            if (aiFilledFields.tilt) {
                              setAiFilledFields((prev) => ({ ...prev, tilt: false }));
                            }
                          }}
                          sx={getFieldInputStyles(aiFilledFields.tilt, shouldShowError('tilt', tilt))}
                          size="small"
                          fullWidth
                          type="number"
                          error={shouldShowError('tilt', tilt)}
                          helperText={shouldShowError('tilt', tilt) ? 'Required field' : ''}
                          inputProps={{ min: 0, max: 90, step: 1 }}
                        />
                        {aiFilledFields.tilt && (
                          <Chip
                            label="✨ Suggested by AI"
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: '#e0f2f1',
                              color: '#00695c',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        )}
                      </Box>
                      <Box>
                        <TextField 
                          label="Azimuth (°)" 
                          value={azimuth} 
                          onChange={(e) => {
                            setAzimuth(e.target.value);
                            if (aiFilledFields.azimuth) {
                              setAiFilledFields(prev => ({ ...prev, azimuth: false }));
                            }
                          }}
                          sx={getFieldInputStyles(aiFilledFields.azimuth, shouldShowError('azimuth', azimuth))} 
                          size="small" 
                          fullWidth 
                          type="number"
                          error={shouldShowError('azimuth', azimuth)}
                          helperText={shouldShowError('azimuth', azimuth) ? 'Required field' : ''} 
                        />
                        {aiFilledFields.azimuth && (
                          <Chip 
                            label="✨ Suggested by AI" 
                            size="small" 
                            sx={{ 
                              mt: 0.5, 
                              bgcolor: '#e0f2f1', 
                              color: '#00695c',
                              fontSize: '0.7rem',
                              height: 20
                            }} 
                          />
                        )}
                      </Box>
                      {azimuthDirection && (
                        <Box sx={{ 
                          p: 1.5, 
                          bgcolor: '#e3f2fd', 
                          borderRadius: 2,
                          border: '1px solid #90caf9'
                        }}>
                          <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>
                            Orientation: <strong>{azimuthDirection}</strong>
                        </Typography>
                        </Box>
                      )}
                      </>
                      )}

                      <Box>
                        <FormControl
                          size="small" 
                          fullWidth
                          error={shouldShowError('panelSize', panelSize)}
                        >
                          <InputLabel>Panel Size (kWp)</InputLabel>
                          <Select
                            value={panelSize}
                            onChange={(e) => {
                              setPanelSize(e.target.value);
                              if (aiFilledFields.panelSize) {
                                setAiFilledFields(prev => ({ ...prev, panelSize: false }));
                              }
                            }}
                            onBlur={() => setTouchedFields({ ...touchedFields, panelSize: true })}
                            label="Panel Size (kWp)"
                            sx={getFieldInputStyles(aiFilledFields.panelSize, shouldShowError('panelSize', panelSize))}
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 300,
                                  zIndex: 99999,
                                  backgroundColor: '#ffffff',
                                },
                                sx: {
                                  boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
                                  zIndex: '99999 !important',
                                }
                              },
                              disablePortal: false,
                              style: {
                                zIndex: 99999,
                              }
                            }}
                          >
                            {[0.5, 0.55, 0.6, 0.65, 0.7].map((val) => (
                              <MenuItem key={val} value={val}>{val} kWp ({val * 1000} Wp)</MenuItem>
                            ))}
                          </Select>
                          {shouldShowError('panelSize', panelSize) && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                              Panel size is required
                            </Typography>
                          )}
                        </FormControl>
                        {aiFilledFields.panelSize && (
                          <Chip 
                            label="✨ Suggested by AI" 
                            size="small" 
                            sx={{ 
                              mt: 0.5, 
                              bgcolor: '#e0f2f1', 
                              color: '#00695c',
                              fontSize: '0.7rem',
                              height: 20
                            }} 
                          />
                        )}
                      </Box>

                      {/* Monthly Consumption procedure — this table IS its input form. The system
                          is sized from the highest monthly requirement across the 12 rows. */}
                      {isConsumptionMode && (() => {
                        const monthlySunPeakRows = Array.isArray(calculatorData?.sunPeakHoursData?.monthlyData)
                          ? calculatorData.sunPeakHoursData.monthlyData
                          : [];
                        const hasSunData = monthlySunPeakRows.length > 0;
                        const { recommendedCapacityKw, recommendedPanels } =
                          computeRecommendationFromRows(recommendationRows);
                        const panelSizeKw = Number(panelSize);
                        const cellFieldSx = {
                          '& .MuiOutlinedInput-input': { py: 0.65, px: 1, fontSize: '0.82rem' }
                        };
                        return (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00695c', mb: 0.5 }}>
                              Monthly electricity usage
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#607d8b', display: 'block', mb: 1.5 }}>
                              Fill in whichever you know. Consumption is computed automatically when both the
                              bill and the rate are entered — otherwise type the kWh directly. One month is
                              enough to get a result; all twelve gives the most accurate sizing.
                            </Typography>

                            {!hasSunData && (
                              <Alert severity="info" sx={{ mb: 1.5, py: 0.25, fontSize: '0.8rem' }}>
                                Set a location above to load monthly sun-hour data — it is what turns your
                                usage into a system size.
                              </Alert>
                            )}

                            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                              <Box sx={{ flex: '1 1 160px', p: 1.5, borderRadius: 2, border: '2px solid #26a69a', bgcolor: '#ffffff' }}>
                                <Typography variant="caption" color="text.secondary">Solar Capacity</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e' }}>
                                  {recommendedCapacityKw != null ? `${recommendedCapacityKw.toFixed(2)} kW` : '—'}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: '1 1 160px', p: 1.5, borderRadius: 2, border: '2px solid #7e57c2', bgcolor: '#ffffff' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Panels ({Number.isFinite(panelSizeKw) && panelSizeKw > 0 ? `${panelSizeKw.toFixed(2)} kW` : '—'})
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#4a148c' }}>
                                  {recommendedPanels != null ? `${recommendedPanels.toLocaleString()} Panels` : '—'}
                                </Typography>
                              </Box>
                            </Box>

                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 0.5 }}>
                              <Table
                                size="small"
                                sx={{
                                  tableLayout: 'fixed',
                                  width: '100%',
                                  '& td, & th': { px: 1, py: 0.5, fontSize: '0.8rem' }
                                }}
                              >
                                <TableHead>
                                  <TableRow sx={{ '& th': { bgcolor: '#e0f2f1', color: '#00695c', fontWeight: 700, whiteSpace: 'nowrap' } }}>
                                    <TableCell sx={{ width: '11%' }}>Month</TableCell>
                                    <TableCell sx={{ width: '14%' }}>Sun Hrs</TableCell>
                                    <TableCell sx={{ width: '25%' }}>Bill (₱)</TableCell>
                                    <TableCell sx={{ width: '25%' }}>Rate (₱/kWh)</TableCell>
                                    <TableCell sx={{ width: '25%' }}>Consumption (kWh)</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {recommendationRows.map((row, idx) => {
                                    const { value: resolvedMonthlyConsumption, isAutoComputed } =
                                      resolveMonthlyConsumption(row);
                                    const monthlyRow = monthlySunPeakRows[idx];
                                    const sunPeakDisplay = monthlyRow
                                      ? monthlyRow.sunPeakHoursFormatted ??
                                        (Number.isFinite(Number(monthlyRow.sunPeakHours))
                                          ? Number(monthlyRow.sunPeakHours).toFixed(2)
                                          : '—')
                                      : '—';
                                    return (
                                      <TableRow
                                        key={row.month}
                                        sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}
                                      >
                                        <TableCell sx={{ fontWeight: 700, color: '#37474f' }}>
                                          {row.month.slice(0, 3)}
                                        </TableCell>
                                        <TableCell sx={{ color: hasSunData ? '#00695c' : '#b0bec5', fontWeight: 600 }}>
                                          {sunPeakDisplay}
                                        </TableCell>
                                        <TableCell>
                                          <TextField
                                            value={row.electricBill}
                                            onChange={(e) => handleRecommendationCellChange(idx, 'electricBill', e.target.value)}
                                            type="number"
                                            size="small"
                                            placeholder="0.00"
                                            fullWidth
                                            sx={cellFieldSx}
                                            inputProps={{ min: 0, step: '0.01' }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <TextField
                                            value={row.electricRate}
                                            onChange={(e) => handleRecommendationCellChange(idx, 'electricRate', e.target.value)}
                                            type="number"
                                            size="small"
                                            placeholder="0.00"
                                            fullWidth
                                            sx={cellFieldSx}
                                            inputProps={{ min: 0, step: '0.01' }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {isAutoComputed && Number.isFinite(resolvedMonthlyConsumption) ? (
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: 32.75,
                                                px: 1,
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'rgba(0,0,0,0.23)',
                                                bgcolor: '#f5f5f5'
                                              }}
                                            >
                                              <Typography sx={{ fontWeight: 700, color: '#00695c', fontSize: '0.82rem' }}>
                                                {resolvedMonthlyConsumption.toFixed(0)} kWh
                                              </Typography>
                                            </Box>
                                          ) : (
                                            <TextField
                                              value={row.monthlyConsumption ?? ''}
                                              onChange={(e) => handleRecommendationCellChange(idx, 'monthlyConsumption', e.target.value)}
                                              type="number"
                                              size="small"
                                              placeholder="kWh"
                                              fullWidth
                                              sx={cellFieldSx}
                                              inputProps={{ min: 0, step: '0.01' }}
                                            />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            <Button
                              size="small"
                              onClick={handleResetRecommendationRows}
                              sx={{ textTransform: 'none', fontWeight: 600, mt: 0.5, color: '#00695c' }}
                            >
                              Reset monthly usage
                            </Button>
                          </Box>
                        );
                      })()}

                      {!isConsumptionMode && (
                      <TextField
                        label="Electricity Rate (₱/kWh)"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        sx={getFieldInputStyles(aiFilledFields.rate, shouldShowError('rate', rate))}
                        size="small"
                        fullWidth
                        type="number"
                        error={shouldShowError('rate', rate)}
                        helperText={shouldShowError('rate', rate) ? 'Required field' : ''}
                      />
                      )}

                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: '#fff3e0', 
                        borderRadius: 2,
                        border: '1px solid #ffcc80'
                      }}>
                        <Typography variant="body2" sx={{ color: '#e65100', lineHeight: 1.6 }}>
                          <strong>Disclaimer:</strong> This calculator provides estimates only. Actual savings may vary. Contact <a href="https://mail.google.com/mail/?view=cm&fs=1&to=care@mmsu.edu.ph" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'none' }}>care@mmsu.edu.ph</a> for professional consultation.
                      </Typography>
                      </Box>
                    </Stack>
                  </>
              </Stack>
            </form>

            {/* Always show Calculate/Reset buttons */}
              <>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCalculateClick}
                    disabled={isEstimatingConsumption}
                    startIcon={<CalculateRoundedIcon />}
                    sx={{ 
                      bgcolor: '#1976d2',  // Modern blue
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
                  >
                    {isEstimatingConsumption ? 'Estimating…' : 'Calculate'}
                  </Button>

                  <Tooltip title="Clear all fields" arrow>
                  <Button
                      variant="outlined"
                    onClick={handleResetInputs}
                    sx={{
                        borderColor: '#d32f2f',
                        color: '#d32f2f',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': { 
                          borderColor: '#c62828',
                          bgcolor: '#ffebee'
                        },
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Reset
                  </Button>
                  </Tooltip>
                </Box>

                {/* Results now show in big modal - just show a message here */}
                {showCalculator && (
                  <Box sx={{ 
                    mt: 3, 
                    p: 4, 
                    bgcolor: '#e3f2fd', 
                    borderRadius: 3,
                    border: '2px solid #90caf9',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 'bold', mb: 2 }}>
                      ✅ Calculation Complete!
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#1976d2' }}>
                      Your solar system analysis results are ready to view.
                    </Typography>
                  </Box>
                )}
              </>
          </Box>
          
        </Drawer>

        {/* Calculation procedure selector — pops up on arrival and whenever "Change" is
            pressed, so the choice is made against a definition rather than a bare toggle. */}
        <Dialog
          open={procedureDialogOpen}
          onClose={handleCloseProcedureDialog}
          fullWidth
          maxWidth="sm"
          sx={{ zIndex: 10050 }}
          PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #00acc1 100%)',
              color: '#ffffff',
              px: 3,
              py: 2.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                How would you like to calculate?
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                Pick the procedure that matches what you already know. You can switch to the other one
                at any time — your results stay complete either way.
              </Typography>
            </Box>
            {/* No dismiss on the very first open: a procedure has to be picked before the
                input card makes any sense. */}
            {hasChosenProcedure && (
              <IconButton onClick={handleCloseProcedureDialog} sx={{ color: '#ffffff', mt: -0.5, mr: -1 }}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
          <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
            <Stack spacing={2}>
              {CALCULATION_PROCEDURES.map((option) => {
                const OptionIcon = option.Icon;
                const isSelected = calculationMode === option.mode;
                return (
                  <Box
                    key={option.mode}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectProcedure(option.mode)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectProcedure(option.mode);
                      }
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      p: 2.5,
                      borderRadius: 2.5,
                      border: '2px solid',
                      borderColor: isSelected ? option.accent : '#e0e0e0',
                      bgcolor: isSelected ? option.tint : '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover, &:focus-visible': {
                        borderColor: option.accent,
                        bgcolor: option.tint,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.10)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: option.tint,
                        border: `1px solid ${option.accent}`,
                        color: option.accent
                      }}
                    >
                      <OptionIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1.05rem' }}>
                          {option.title}
                        </Typography>
                        {isSelected && (
                          <Chip
                            label="Current"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: option.accent,
                              color: '#ffffff'
                            }}
                          />
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#546e7a', mt: 0.5, lineHeight: 1.5 }}>
                        {option.definition}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: option.accent, fontWeight: 600, display: 'block', mt: 0.75 }}
                      >
                        {option.detail}
                      </Typography>
                    </Box>
                    {isSelected && (
                      <CheckCircleIcon sx={{ color: option.accent, fontSize: 24, mt: 0.5 }} />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </DialogContent>
        </Dialog>

        {/* Popup Dialog */}
        <Dialog open={popupOpen} onClose={handlePopupClose} fullWidth maxWidth="md">
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{popupType.charAt(0).toUpperCase() + popupType.slice(1)}</Typography>
            <IconButton onClick={handlePopupClose}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Textpopup type={popupType} />
          </DialogContent>
        </Dialog>

        {/* Floating evaluation dialog */}
        <Dialog
          open={feedbackOpen}
          onClose={handleCloseFeedbackDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.55)',
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.8) 55%, rgba(245,245,245,0.72) 100%)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: '0 18px 42px rgba(15, 23, 42, 0.22)'
            }
          }}
        >
          <DialogTitle
            sx={{
              pb: 1,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarRoundedIcon sx={{ color: '#f57c00' }} />
              <Typography variant="h6" fontWeight={700}>
                Solar Calculator Evaluation
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            dividers
            sx={{
              borderTopColor: 'rgba(255,255,255,0.45)',
              borderBottomColor: 'rgba(255,255,255,0.45)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.18) 100%)'
            }}
          >
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Rate your experience and share a quick comment to help us improve this calculator.
              </Typography>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Rating
                </Typography>
                <Rating
                  name="solar-calculator-rating"
                  size="large"
                  value={feedbackRating}
                  onChange={(_, newValue) => {
                    setFeedbackRating(newValue ?? 0);
                    if (feedbackError) {
                      setFeedbackError('');
                    }
                  }}
                />
              </Box>
              <TextField
                label="Comment"
                placeholder="Tell us what worked well or what we can improve..."
                multiline
                minRows={4}
                fullWidth
                value={feedbackComment}
                onChange={(event) => {
                  setFeedbackComment(event.target.value);
                  if (feedbackError) {
                    setFeedbackError('');
                  }
                }}
              />
              {feedbackError && (
                <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 500 }}>
                  {feedbackError}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              background: 'linear-gradient(0deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 100%)'
            }}
          >
            <Button onClick={handleCloseFeedbackDialog} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              variant="contained"
              startIcon={<StarRoundedIcon />}
              disabled={isSubmittingFeedback}
              sx={{ bgcolor: '#f57c00', '&:hover': { bgcolor: '#ef6c00' } }}
            >
              {isSubmittingFeedback ? 'Submitting...' : 'Submit Evaluation'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* AI Chatbot */}
          <SolarAIChatbot
            calculatorData={(() => {
              const data = {
                latitude,
                longitude,
                area,
                panelSize,
                tilt: parseFloat(tilt) || FIXED_PANEL_TILT_DEGREES,
                daytimeUsePercent,
                nighttimeUsePercent,
                utilizationFactors:
                  calculatorResults?.utilizationFactors ??
                  getUtilizationFactors(daytimeUsePercent, batterySizePercent),
                azimuth,
                rate,
                estimatedCapacity: showCalculator ? 'Calculated' : null,
                annualProduction: showCalculator ? 'Calculated' : null,
                annualSavings: showCalculator ? 'Calculated' : null,
                // Always pass calculator data including sun peak hours data
                ...calculatorData
              };
              return data;
            })()}
            isOpen={chatbotOpen}
            onClose={() => setChatbotOpen(false)}
          />

        {/* AI Parameter Review Modal */}
        <AIParameterReview
          open={showParameterReview}
          parameters={reviewParameters}
          onApply={handleApplyParametersFromReview}
          onClose={handleCloseParameterReview}
          onEdit={handleEditParameter}
        />

        {/* Big Results Modal */}
        <Dialog
          open={showResultsModal}
          onClose={handleCloseResultsModal}
          maxWidth="xl"
          fullWidth
          fullScreen={false}
          PaperProps={{
            sx: {
              height: '90vh',
              maxHeight: '90vh',
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #64b5f6 100%)',
            color: 'white',
            p: 3,
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalculateRoundedIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Solar System Analysis Results
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Complete analysis for {locationName || 'your location'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip
                title={
                  calculationMode === 'consumption'
                    ? 'Switch to Solar Rooftop Potential'
                    : 'Switch to Monthly Consumption'
                }
                arrow
              >
                <Button
                  onClick={handleSwitchProcedure}
                  startIcon={<SyncAltIcon />}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    textTransform: 'none',
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'inline-flex' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', borderColor: 'white' }
                  }}
                  variant="outlined"
                  size="small"
                >
                  {calculationMode === 'consumption' ? 'Use Roof Area Instead' : 'Use Monthly Consumption Instead'}
                </Button>
              </Tooltip>
              <IconButton
                onClick={handleCloseResultsModal}
                sx={{
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <CloseIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Box>
          </DialogTitle>
          
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
            <Tabs 
              value={selectedTab} 
              onChange={(e, newValue) => setSelectedTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  minHeight: 64,
                  '&.Mui-selected': {
                    color: '#1976d2'
                  }
                }
              }}
            >
              <Tab label="📊 Summary & Results" />
              <Tab label="🔋 System Comparison" />
              <Tab label="🎯 What-If Scenarios" />
              <Tab label="📝 Analysis" />
              <Tab label="🖨️ Print / Save" />
            </Tabs>
          </Box>
          
          <DialogContent sx={{ p: 0, overflow: 'auto' }}>
            {showCalculator && (
              <Box sx={{ p: 3 }}>
                {/* Tab 0: keep Calculator mounted while modal is open so What-If panel-size sync updates Summary live */}
                <Box sx={{ display: selectedTab === 0 ? 'block' : 'none' }}>
                  <Calculator
                    lat={parseFloat(latitude)}
                    lng={parseFloat(longitude)}
                    area={parseFloat(area)}
                    sp={parseFloat(panelSize)}
                    tilt={parseFloat(tilt) || FIXED_PANEL_TILT_DEGREES}
                    azimuth={parseFloat(azimuth)}
                    rate={parseFloat(rate)}
                    daytimeUsePercent={daytimeUsePercent}
                    batterySizePercent={batterySizePercent}
                    trigger={`${calcTrigger}-${whatIfApplyTrigger}`}
                    heroSummaryFromWhatIf={activeSummaryOverlay}
                    onCalculate={() => {
                      setCalculatorUses((prev) => prev + 1);
                      localStorage.setItem('calcUses', calculatorUses + 1);
                    }}
                    onDataUpdate={handleCalculatorDataUpdate}
                    onError={(message) => {
                      setSnackbarMessage(message);
                      setSnackbarOpen(true);
                    }}
                  />
                </Box>
                
                {/* Tab 1: keep mounted when results exist so data stays in sync with Summary (same pattern as Calculator tab) */}
                {calculatorResults && systemComparisonBaseResults && (
                  <Box sx={{ display: selectedTab === 1 ? 'block' : 'none' }}>
                    <SystemComparison
                      key={`system-comparison-${recommendationSyncVersion}`}
                      baseParameters={systemComparisonBaseParameters}
                      baseResults={systemComparisonBaseResults}
                      onApply={(scenario) => {
                        console.log('Applied recommendation:', scenario);
                        setSnackbarMessage(`${scenario.name} recommendation applied.`);
                        setSnackbarOpen(true);
                      }}
                      onReset={() => {
                        handleWhatIfSetToDefault();
                        setSnackbarMessage('Recommendation view reset to current calculator defaults.');
                        setSnackbarOpen(true);
                      }}
                      onSelect={(scenario) => {
                        console.log('Selected scenario:', scenario);
                        setSnackbarMessage(`${scenario.name} system selected! Adjust parameters to match.`);
                        setSnackbarOpen(true);
                      }}
                    />
                  </Box>
                )}
                
                {/* Tab Panel 2: What-If Scenarios */}
                {selectedTab === 2 && calculatorResults && (
                  <Box>
                    <ScenarioSimulator
                      key={`whatif-${calcTrigger}-${whatIfSyncKey}`}
                      onSetToDefault={handleWhatIfSetToDefault}
                      recommendedSystemType={getRecommendedScenarioSystemType(
                        whatIfBaseParameters.budget
                      )}
                      baseParameters={whatIfBaseParameters}
                      mainCalculatorBaseParameters={whatIfMainCalculatorBaseParameters}
                      baseResults={whatIfBaseResults}
                      sunPeakHoursData={calculatorData?.sunPeakHoursData}
                      onCalculate={async (newParams) => {
                        // Mirror CalculatorEnhanced formulas for consistency.
                        const savedConstants = JSON.parse(localStorage.getItem('solarConstants') || '{"n":0.23,"ns":0.8}');
                        const nConst = Number(savedConstants?.n) || 0.23;
                        const nsConst = Number(savedConstants?.ns) || 0.8;
                        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

                        const areaVal = Number(newParams.area) || 0;
                        const panelSizeVal = Number(newParams.panelSize) || 0.6;
                        const tiltVal =
                          newParams.tilt != null && newParams.tilt !== '' && !Number.isNaN(Number(newParams.tilt))
                            ? Number(newParams.tilt)
                            : (parseFloat(tilt) || FIXED_PANEL_TILT_DEGREES);
                        const budgetVal = Number(newParams.budget) || 0;
                        const budgetTouched = newParams.budgetTouched === true;
                        const selectedSystemType = newParams.systemType
                          || (budgetVal < 180000 ? 'offgrid' : budgetVal >= 400000 ? 'hybrid' : 'gridtied');
                        const azimuthVal = Number(newParams.azimuth) || Number(azimuth) || 180;
                        const latVal = Number(newParams.latitude) || Number(latitude);
                        const lngVal = Number(newParams.longitude) || Number(longitude);
                        const rateVal = Number(newParams.rate) || Number(rate) || 10;
                        const rawDaytime = Number(
                          newParams.daytimeUsePercent !== undefined && newParams.daytimeUsePercent !== null
                            ? newParams.daytimeUsePercent
                            : daytimeUsePercent
                        );
                        const daytimeClamped = clampDaytimePercent(rawDaytime);
                        // Battery Size is a free live input for every system type — this always
                        // honors whatever value was actually passed in.
                        const batterySizePct = Math.min(
                          100,
                          Math.max(0, Number(newParams.batterySizePercent ?? batterySizePercent) || 0)
                        );

                        let monthlySunPeakHours = calculatorData?.sunPeakHoursData?.monthlyData?.map((m) => Number(m.sunPeakHours)) || null;
                        let avgSun = Number(calculatorData?.sunPeakHoursData?.annualAverage?.sunPeakHours) || 4.5;

                        try {
                          if (latVal && lngVal) {
                            const sunPeakData = await getSunPeakHours(latVal, lngVal, {
                              tilt: tiltVal,
                              azimuth: azimuthVal,
                              systemCapacity: 1,
                              arrayType: 1,
                              moduleType: 1,
                              losses: 20
                            });
                            if (sunPeakData?.success) {
                              avgSun = Number(sunPeakData.annualAverage?.sunPeakHours) || avgSun;
                              monthlySunPeakHours = sunPeakData.rawData?.monthlySunPeakHours || monthlySunPeakHours;
                            }
                          }
                        } catch (error) {
                          console.warn('Scenario sun peak hours fallback used:', error);
                        }

                        if (!monthlySunPeakHours || monthlySunPeakHours.length !== 12) {
                          monthlySunPeakHours = Array(12).fill(avgSun);
                        }

                        // Same sizing logic as main calculator.
                        const computeCapacityForPanelSize = (panelKw) => {
                          const pKw = Number(panelKw) > 0 ? Number(panelKw) : 0.6;
                          const rpkwp = areaVal * 0.6 * nConst;
                          let panelCountRaw = 0;
                          if (rpkwp < 1) panelCountRaw = 2;
                          else if (rpkwp < 2) panelCountRaw = 4;
                          else if (areaVal < 32) panelCountRaw = 8;
                          else {
                            panelCountRaw = rpkwp / pKw;
                            if (panelCountRaw % 4 !== 0) {
                              panelCountRaw += 4 - (panelCountRaw % 4);
                            }
                          }
                          return panelCountRaw * pKw;
                        };
                        const rpkwp = areaVal * 0.6 * nConst;
                        const capacity = computeCapacityForPanelSize(panelSizeVal);
                        const referencePanelSizeKw =
                          Number(whatIfBaseParameters?.panelSize) > 0
                            ? Number(whatIfBaseParameters.panelSize)
                            : panelSizeVal;
                        const referenceCapacity = computeCapacityForPanelSize(referencePanelSizeKw);
                        const summaryCapacityTarget =
                          Number(activeSummaryOverlay?.Rcapacity) > 0
                            ? Number(activeSummaryOverlay.Rcapacity)
                            : Number(calculatorResults?.systemCapacity) > 0
                              ? Number(calculatorResults.systemCapacity)
                              : referenceCapacity;
                        const capacitySyncScale =
                          Number.isFinite(summaryCapacityTarget) &&
                          summaryCapacityTarget > 0 &&
                          Number.isFinite(referenceCapacity) &&
                          referenceCapacity > 0
                            ? summaryCapacityTarget / referenceCapacity
                            : 1;
                        const eeave = rpkwp * avgSun * nsConst;
                        // Same monthly savings accumulation logic as main calculator.
                        let totalAnnualProductionBase = 0;
                        let totalSavings = 0;
                        monthlySunPeakHours.forEach((sh, i) => {
                          const monthlyKwh = nsConst * Number(sh) * daysInMonth[i] * capacity;
                          totalAnnualProductionBase += monthlyKwh;
                          totalSavings += monthlyKwh * rateVal;
                        });

                        // System profile (investment range, ROI/payback tuning) — annual savings use System Comparison formula below.
                        // Investment range comes from the same shared getInvestmentRange as System Comparison /
                        // Print-Save (Grid-Tied-equivalent cost + actual battery cost for Off-Grid/Hybrid), so
                        // this never drifts out of sync with those again.
                        let capacityMultiplier = 1;
                        let paybackMultiplier = 1;
                        let roiMultiplier = 1;

                        if (selectedSystemType === 'offgrid') {
                          paybackMultiplier = OFF_GRID.paybackMultiplier;
                          roiMultiplier = OFF_GRID.roiMultiplier;
                        } else if (selectedSystemType === 'hybrid' || selectedSystemType === 'gridtied_copy') {
                          capacityMultiplier = HYBRID.capacityMultiplier;
                          paybackMultiplier = HYBRID.paybackMultiplier;
                          roiMultiplier = HYBRID.roiMultiplier;
                        }

                        // Capacity follows slider movement while anchoring to current Summary/System baseline.
                        const computedCapacityFromSliders = capacity * capacitySyncScale * capacityMultiplier;
                        const profileMaxCapacity = computedCapacityFromSliders;
                        const profileInvestmentRange = getInvestmentRange({
                          systemType: selectedSystemType,
                          capacity: profileMaxCapacity,
                          annualProduction: totalAnnualProductionBase,
                          daytimeUsePercent: daytimeClamped,
                          batterySizePercent: batterySizePct
                        });
                        const profileMinInvestment = profileInvestmentRange.min;
                        const profileMaxInvestment = profileInvestmentRange.max;
                        const isBudgetInProfileRange = budgetVal > 0 &&
                          budgetVal >= profileMinInvestment &&
                          budgetVal <= profileMaxInvestment;

                        // Battery cost isn't purely linear in capacity, so inverting "budget -> capacity" for an
                        // out-of-range budget uses an effective ₱/kW rate anchored to this operating point
                        // (the pricing that actually applies at profileMaxCapacity), rather than solving a
                        // circular capacity <-> production <-> battery-kWh <-> cost system exactly.
                        const effectiveMinPerKw =
                          profileMaxCapacity > 0 ? profileMinInvestment / profileMaxCapacity : GRID_TIED.perKwMin;
                        const effectiveMaxPerKw =
                          profileMaxCapacity > 0 ? profileMaxInvestment / profileMaxCapacity : GRID_TIED.perKwMax;

                        let estimatedCapacity = profileMaxCapacity;
                        // Only a manually-touched Budget slider can move Capacity off profileMaxCapacity.
                        // While Budget is untouched (auto-tracking the profile max), Capacity always
                        // resolves to profileMaxCapacity — which has no Daytime Use term — so dragging
                        // Daytime Use alone (which shifts the daytime-dependent investment range for
                        // Off-Grid/Hybrid via battery sizing) can never nudge an untouched Budget in or
                        // out of that range and silently change System Capacity as a side effect.
                        if (budgetTouched && budgetVal > 0) {
                          if (isBudgetInProfileRange) {
                            // Budget is in-range: keep calculated capacity (matches System Comparison card behavior)
                            estimatedCapacity = profileMaxCapacity;
                          } else if (budgetVal < profileMinInvestment) {
                            // Budget below range: downscale from lower bound per-kW
                            estimatedCapacity = Math.max(panelSizeVal * 2, budgetVal / effectiveMinPerKw);
                          } else {
                            // Budget above range: upscale from upper bound per-kW
                            estimatedCapacity = budgetVal / effectiveMaxPerKw;
                          }
                        }

                        // Annual savings use unified UF based on daytime/nighttime use and battery size (%).
                        let estimatedAnnualProduction = 0;
                        monthlySunPeakHours.forEach((sh, i) => {
                          const monthlyKwh = nsConst * Number(sh) * daysInMonth[i] * estimatedCapacity;
                          estimatedAnnualProduction += monthlyKwh;
                        });
                        const scenarioUF = getUtilizationFactorForSystemType(
                          selectedSystemType,
                          daytimeClamped,
                          batterySizePct
                        );
                        const estimatedAnnualSavings = Math.round(
                          estimatedAnnualProduction * rateVal * scenarioUF
                        );

                        // Investment is based on user slider when provided. Recompute the range at the final
                        // capacity/production (not the profile-anchor one above) so it reflects exactly what
                        // this specific system would cost, including battery sized to its own production.
                        const finalInvestmentRange = getInvestmentRange({
                          systemType: selectedSystemType,
                          capacity: estimatedCapacity,
                          annualProduction: estimatedAnnualProduction,
                          daytimeUsePercent: daytimeClamped,
                          batterySizePercent: batterySizePct
                        });
                        const estimatedMinCost = finalInvestmentRange.min;
                        const estimatedMaxCost = finalInvestmentRange.max;
                        const estimatedInvestment = budgetVal > 0 ? budgetVal : estimatedMinCost;
                        const roiResult = calculateROI(estimatedInvestment, estimatedAnnualSavings);
                        const estimatedPayback = (roiResult.paybackPeriod || 0) * paybackMultiplier;
                        const estimatedRoi = (roiResult.roi || 0) * roiMultiplier;
                        // For Hybrid in-range, panel count should match recommended card behavior.
                        const panelCountBasis = ((selectedSystemType === 'hybrid' || selectedSystemType === 'gridtied_copy') && isBudgetInProfileRange)
                          ? (Number(panelSize) || panelSizeVal)
                          : panelSizeVal;

                        const computedCapacity = parseFloat(estimatedCapacity.toFixed(1));
                        const computedPanelCount = panelCountBasis > 0 ? Math.ceil(estimatedCapacity / panelCountBasis) : 0;

                        return {
                          capacity: computedCapacity,
                          systemCapacity: computedCapacity,
                          panelCount: computedPanelCount,
                          annualSavings: parseFloat(estimatedAnnualSavings.toFixed(2)),
                          annualProduction: parseFloat(estimatedAnnualProduction.toFixed(1)),
                          paybackPeriod: parseFloat(estimatedPayback.toFixed(1)),
                          roi: Math.round(estimatedRoi * 10) / 10,
                          investment: Math.round(estimatedInvestment),
                          systemType: selectedSystemType,
                          panelSizeKw: panelSizeVal,
                          estimatedInvestment: {
                            min: estimatedMinCost,
                            max: estimatedMaxCost,
                            basis: budgetVal > 0 ? 'user-budget' : 'calculated-min'
                          }
                        };
                      }}
                      onApply={(simulatedParams, simulatedResultValues) => {
                        console.log('Applying scenario:', simulatedParams);
                        const {
                          resultsBySystemType,
                          sharedSlidersSnapshot: _shared,
                          applyFieldTouches,
                          ...applyFields
                        } = simulatedParams || {};
                        const selectedType = applyFields?.systemType;
                        const comparisonBundle = buildScenarioResultsByTypeForComparison(resultsBySystemType);

                        /** Only explicitly touched sliders (off map default) update form fields — others stay unchanged. */
                        const touches = applyFieldTouches ?? {};
                        if (
                          touches.budget === true &&
                          applyFields.budget != null &&
                          Number.isFinite(Number(applyFields.budget))
                        ) {
                          setBudget(String(Math.round(Number(applyFields.budget))));
                        }
                        if (touches.budget === true) {
                          setWhatIfApplyTrigger((n) => n + 1);
                        }

                        const daytimeForFactors =
                          applyFields.daytimeUsePercent != null
                            ? clampDaytimePercent(Number(applyFields.daytimeUsePercent))
                            : daytimeUsePercent;

                        if (!comparisonBundle) {
                          setSnackbarMessage('Apply Configuration failed to sync all presets. Please try again.');
                          setSnackbarOpen(true);
                          return;
                        }

                        if (comparisonBundle) {
                          const resolveUfForType = (systemType) => {
                            const normalizedType =
                              systemType === 'gridtied_copy' ? 'hybrid' : systemType;
                            // Daytime Use is a free, fully shared slider across Off-Grid, Grid-Tied,
                            // and Hybrid — no per-type override.
                            const resolvedDaytime = daytimeForFactors;
                            const resolvedBatteryPercent =
                              normalizedType === 'gridtied'
                                ? 0
                                : Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(
                                        applyFields.batterySizePercent != null
                                          ? applyFields.batterySizePercent
                                          : batterySizePercent
                                      ) || 0
                                    )
                                  );
                            return getUtilizationFactors(resolvedDaytime, resolvedBatteryPercent);
                          };

                          const offgridUF = resolveUfForType('offgrid').offGrid;
                          const gridtiedUF = resolveUfForType('gridtied').gridTied;
                          const hybridUF = resolveUfForType('hybrid').hybrid;

                          const utilizationFactorsFromWhatIf = {
                            daytimeUsePercent: daytimeForFactors,
                            offGrid: offgridUF,
                            gridTied: gridtiedUF,
                            hybrid: hybridUF
                          };
                          const utilizationFactorsByCategoryFromWhatIf = {
                            offgrid: offgridUF,
                            gridtied: gridtiedUF,
                            hybrid: hybridUF
                          };
                          const normalizedRateForSync =
                            Number(applyFields.rate != null ? applyFields.rate : rate) > 0
                              ? Number(applyFields.rate != null ? applyFields.rate : rate)
                              : parseFloat(rate) || 10;
                          const ensureAnnualSavings = (row, categoryKey, uf) => {
                            if (!row) return row;
                            const direct = Number(row.annualSavings);
                            if (Number.isFinite(direct) && direct >= 0) return row;
                            const prod = Number(row.annualProduction);
                            if (!Number.isFinite(prod) || prod < 0 || !Number.isFinite(uf) || uf < 0) return row;
                            return {
                              ...row,
                              annualSavings: Math.round(prod * normalizedRateForSync * uf)
                            };
                          };
                          const scenarioResultsByTypeForSync = {
                            offgrid: ensureAnnualSavings(comparisonBundle.offgrid, 'offgrid', offgridUF),
                            gridtied: ensureAnnualSavings(comparisonBundle.gridtied, 'gridtied', gridtiedUF),
                            hybrid: ensureAnnualSavings(comparisonBundle.hybrid, 'hybrid', hybridUF)
                          };
                          const selectedResultForSync =
                            selectedType === 'offgrid'
                              ? scenarioResultsByTypeForSync.offgrid
                              : selectedType === 'gridtied'
                                ? scenarioResultsByTypeForSync.gridtied
                                : scenarioResultsByTypeForSync.hybrid;
                          setAppliedScenarioResultsByType(scenarioResultsByTypeForSync);
                          setRecommendationHeroSummary(null);
                          const heroSource = selectedResultForSync;
                          setWhatIfHeroSummary(
                            buildHeroSummaryFromWhatIfResult(
                              heroSource,
                              applyFields.panelSize,
                              calculatorResults?.panelWattage
                            )
                          );
                          setWhatIfAppliedComparisonParams({
                            rate: normalizedRateForSync,
                            daytimeUsePercent: daytimeForFactors,
                            batterySizePercent: Math.min(
                              100,
                              Math.max(
                                0,
                                Number(
                                  applyFields.batterySizePercent != null
                                    ? applyFields.batterySizePercent
                                    : batterySizePercent
                                ) || 0
                              )
                            )
                          });
                          setCalculatorResults((prev) => {
                            const r = selectedResultForSync;
                            const cap = r.systemCapacity ?? r.capacity;
                            const paybackFlat =
                              typeof r.paybackPeriod === 'number' ? r.paybackPeriod : undefined;
                            const roiFlat = typeof r.roi === 'number' ? r.roi : undefined;

                            if (!prev) {
                              return {
                                systemCapacity: cap,
                                annualSavings: r.annualSavings,
                                annualProduction: r.annualProduction,
                                panelCount: r.panelCount,
                                investment: r.investment,
                                paybackPeriod: {
                                  gridTied: selectedType === 'gridtied' ? paybackFlat : undefined,
                                  hybrid:
                                    selectedType === 'gridtied_copy' || selectedType === 'hybrid'
                                      ? paybackFlat
                                      : undefined,
                                  offGrid: selectedType === 'offgrid' ? paybackFlat : undefined
                                },
                                roi: {
                                  gridTied: selectedType === 'gridtied' ? roiFlat : undefined,
                                  hybrid:
                                    selectedType === 'gridtied_copy' || selectedType === 'hybrid'
                                      ? roiFlat
                                      : undefined,
                                  offGrid: selectedType === 'offgrid' ? roiFlat : undefined
                                },
                                utilizationFactors: utilizationFactorsFromWhatIf,
                                utilizationFactorsByCategory:
                                  utilizationFactorsByCategoryFromWhatIf,
                                scenarioResultsByType: scenarioResultsByTypeForSync
                              };
                            }

                            const nextPayback = { ...prev.paybackPeriod };
                            const nextRoi = { ...prev.roi };
                            if (selectedType === 'offgrid') {
                              if (paybackFlat != null) nextPayback.offGrid = paybackFlat;
                              if (roiFlat != null) nextRoi.offGrid = roiFlat;
                            } else if (selectedType === 'gridtied') {
                              if (paybackFlat != null) nextPayback.gridTied = paybackFlat;
                              if (roiFlat != null) nextRoi.gridTied = roiFlat;
                            } else if (selectedType === 'gridtied_copy' || selectedType === 'hybrid') {
                              if (paybackFlat != null) nextPayback.hybrid = paybackFlat;
                              if (roiFlat != null) nextRoi.hybrid = roiFlat;
                            }

                            return {
                              ...prev,
                              systemCapacity: cap ?? prev.systemCapacity,
                              annualSavings: r.annualSavings ?? prev.annualSavings,
                              annualProduction: r.annualProduction ?? prev.annualProduction,
                              panelCount: r.panelCount ?? prev.panelCount,
                              investment: r.investment ?? prev.investment,
                              paybackPeriod: nextPayback,
                              roi: nextRoi,
                              utilizationFactors: utilizationFactorsFromWhatIf,
                              utilizationFactorsByCategory:
                                utilizationFactorsByCategoryFromWhatIf,
                              scenarioResultsByType: scenarioResultsByTypeForSync
                            };
                          });
                        }

                        const savedMessage = comparisonBundle
                          ? 'What-If applied — System Summary & System Comparison updated (Off-Grid, Grid-Tied, and Hybrid).'
                          : selectedType === 'offgrid'
                            ? 'What-If applied — System Summary & System Comparison updated (Off-Grid).'
                            : selectedType === 'gridtied'
                              ? 'What-If applied — System Summary & System Comparison updated (Grid-Tied).'
                              : selectedType === 'gridtied_copy'
                                ? 'What-If applied — System Summary & System Comparison updated (Hybrid).'
                                : 'What-If applied — System Summary & System Comparison updated.';
                        setSnackbarMessage(savedMessage);
                        setSnackbarOpen(true);
                        /** No trigger bump: a full recalc would use map inputs and overwrite applied scenario results */
                      }}
                    />
                  </Box>
                )}
                

                {/* Tab Panel 3: Analysis */}
                {selectedTab === 3 && aiAnalysisResults && (
                  <Box>
                    <ResultNarrativeDisplay
                      parameters={{
                        location: { city: locationName, lat: parseFloat(latitude), lng: parseFloat(longitude) },
                        area: parseFloat(area),
                        calculationMode,
                        monthlyConsumptionKwh: averageMonthlyConsumptionKwh ?? null,
                        tilt: parseFloat(tilt) || FIXED_PANEL_TILT_DEGREES,
                        daytimeUsePercent,
                        nighttimeUsePercent,
                        utilizationFactors:
                  calculatorResults?.utilizationFactors ??
                  getUtilizationFactors(daytimeUsePercent, batterySizePercent),
                        azimuth: parseFloat(azimuth),
                        panelSize: parseFloat(panelSize),
                        rate: parseFloat(rate),
                        budget: parseFloat(budget) || null,
                        monthlyBill: parseFloat(monthlyBill) || null
                      }}
                      results={aiAnalysisResults}
                      comparisonBaseParameters={systemComparisonBaseParameters}
                      comparisonBaseResults={systemComparisonBaseResults}
                    />
                  </Box>
                )}

                {/* Tab Panel 4: Print / Save */}
                {selectedTab === 4 && (
                  <PrintSaveReport
                    locationName={locationName}
                    latitude={latitude}
                    longitude={longitude}
                    calculationMode={calculationMode}
                    area={area}
                    monthlyConsumptionKwh={averageMonthlyConsumptionKwh}
                    tilt={tilt}
                    azimuth={azimuth}
                    panelSize={panelSize}
                    rate={rate}
                    daytimeUsePercent={daytimeUsePercent}
                    batterySizePercent={batterySizePercent}
                    results={aiAnalysisResults}
                    comparisonBaseParameters={systemComparisonBaseParameters}
                    comparisonBaseResults={systemComparisonBaseResults}
                  />
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbar Notification */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            top: { xs: 80, sm: 90 },  // Below header bar
            width: { xs: '90%', sm: '600px', md: '700px' },  // Wider on all screens
            maxWidth: '95vw'
          }}
        >
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            variant="filled"
            sx={{
              bgcolor: '#26a69a',
              color: 'white',
              width: '100%',
              fontSize: '0.95rem',
              alignItems: 'center',
              py: 1.5,
              px: 2,
              boxShadow: '0 4px 20px rgba(38, 166, 154, 0.4)',
              '& .MuiAlert-icon': {
                color: 'white',
                fontSize: '1.5rem'
              },
              '& .MuiAlert-message': {
                flex: 1,
                py: 0.5
              }
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                {snackbarMessage}
              </Typography>
            </Box>
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}
