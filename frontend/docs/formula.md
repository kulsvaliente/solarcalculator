# Solar Rooftop Calculator — Formula Reference

All formulas below are extracted directly from the current source code. Where a formula is
shared across multiple tabs (Summary/Results, System Comparison, What-If Scenario Simulator,
Print/Save, Analysis), the single source-of-truth file is named so the values can't drift apart.

---

## 1. Utilization Factor (UF)

**Source:** `src/features/solar-calculator/constants/utilizationFactors.js` — `getUnifiedUtilizationFactor()`

```
UF = D + 0.5 × (N + B × N) × multiplier
```

| Symbol | Meaning |
|---|---|
| `D` | Daytime Use fraction (0–1), from the Daytime Use % slider/input |
| `N` | Nighttime fraction = `1 − D` |
| `B` | Battery Size fraction (0–1), from the Battery Size % slider |
| `multiplier` | Per-system-type factor applied to the night-time/battery term |

**Multipliers** (`OFFGRID_UF_MULTIPLIER`, `GRIDTIED_UF_MULTIPLIER`, `HYBRID_UF_MULTIPLIER`):

| System type | multiplier |
|---|---|
| Off-Grid | 0.8 |
| Grid-Tied | 1 |
| Hybrid | 1 |

Grid-Tied's battery fraction `B` is always treated as `0` (no battery by definition).

**Identity (Grid-Tied / Hybrid only, multiplier = 1):** when `B = 1` (Battery Size = 100%),
`0.5 × (N + N) × 1 = N`, so `UF = D + N = 1` (100%) always, regardless of `D`.
**This does not hold for Off-Grid** (multiplier = 0.8): at `B = 1`, `UF = D + 0.8 × N`, which
only reaches exactly 100% when `D = 100%` (`N = 0`) — e.g. at `D = 70%`, `B = 100%`,
`UF = 0.7 + 0.8 × 0.3 = 0.94` (94%), not 100%.

---

## 2. Battery Capacity (kWh)

**Source:** `utilizationFactors.js` — `calculateBatteryKwh()`

```
nighttimePercent = 100 − DaytimeUse%
avgDailyProduction = AnnualProduction (kWh) / 365
BatteryCapacity (kWh) = (nighttimePercent / 100 × avgDailyProduction / 0.8) × (BatterySize% / 100)
```

The `/ 0.8` converts the *usable* nighttime energy need into *nameplate* battery capacity,
assuming 80% usable depth-of-discharge.

**System Comparison display:** `computeSystemComparisonScenarios()` computes this once per
scenario (`offgridBatteryKwh`, `hybridBatteryKwh`) using each type's own Daytime Use / Battery
Size, and exposes it as `scenario.batteryCapacityKwh` — shown as a "Battery Capacity (kWh)" row
below Daytime Use on the Off-Grid and Hybrid cards only (Grid-Tied has no battery, so the row is
omitted there).

---

## 3. System Capacity — Roof Area mode

**Source:** `CalculatorEnhanced.jsx` (main calculator) and `utils/roofAreaEstimator.js` —
`calculateTechnicalCapacity()` (used to bridge Monthly Consumption mode into this same formula).

```
rpkwp = RoofArea (m²) × 0.6 × n          (n = generation constant, default 0.23)

PanelCount (N) =
  if rpkwp < 1          → 2
  else if rpkwp < 2      → 4
  else if RoofArea < 32  → 8
  else                   → round(rpkwp / PanelSize) up to the nearest multiple of 4

System Capacity = PanelCount × PanelSize   (kWp)
```

### 3a. System Capacity — What-If Scenario Simulator (live, slider-driven)

**Source:** `MapComponent.jsx` — `onCalculate` handler (fed by `ScenarioSimulator.jsx`)

```
capacity            = PanelCount(RoofArea, PanelSize) via the formula above
referenceCapacity   = same formula, using the reference/base Panel Size
capacitySyncScale   = SummaryCapacityTarget / referenceCapacity
capacityMultiplier  = 1                         (Off-Grid, Grid-Tied)
                     = HYBRID.capacityMultiplier (Hybrid)

profileMaxCapacity  = capacity × capacitySyncScale × capacityMultiplier
```

Then, **only if the Investment/Budget slider has been manually touched this session**:

```
System Capacity =
  profileMaxCapacity                                if Budget is within [Investment.min, Investment.max]
  max(PanelSize × 2, Budget / effectiveMinPerKw)      if Budget < Investment.min
  Budget / effectiveMaxPerKw                          if Budget > Investment.max
```

`effectiveMinPerKw = Investment.min / profileMaxCapacity`,
`effectiveMaxPerKw = Investment.max / profileMaxCapacity`.

While Budget is untouched (its normal state — auto-pinned to the Investment max), System
Capacity always equals `profileMaxCapacity`, which has no Daytime Use term, so dragging Daytime
Use alone never changes System Capacity.

---

## 4. System Capacity — Monthly Consumption mode

**Source:** `MapComponent.jsx` — `computeRecommendationFromRows()` / the Calculate handler's
consumption branch; `utils/roofAreaEstimator.js` — `estimateCapacityFromMonthlyConsumption()`,
`estimateAreaForTargetCapacity()`

**Step 1 — target capacity needed to cover usage**, per month with data entered:

```
RequiredCapacity (kW) = MonthlyConsumption (kWh) / Efficiency / MonthlySunPeakHours / DaysInMonth
TargetCapacity = max(RequiredCapacity across all filled-in months)
```

**Step 2 — convert to a synthetic Roof Area**, then re-derive System Capacity through the exact
same formula as §3, so Monthly Consumption mode and Roof Area mode always agree on how a given
capacity gets rounded to whole panels:

```
SyntheticArea = the Roof Area (10–200 m², searched in 1 m² steps) whose Roof-Area-mode capacity
                is closest to TargetCapacity
System Capacity = calculateTechnicalCapacity(SyntheticArea, PanelSize)   — same as §3
```

The "Solar Capacity" card shown in the Monthly Consumption input form uses this same two-step
round-trip, so it matches exactly what Calculate will produce.

---

## 5. Annual Energy Production

**Source:** `CalculatorEnhanced.jsx`, `MapComponent.jsx` (What-If)

```
Monthly Production[i] (kWh) = ns × SunPeakHours[i] × DaysInMonth[i] × Capacity   (AC-side table)
Annual Production (kWh)      = Σ (NightSun constant × SunPeakHours[i] × DaysInMonth[i] × Capacity × 0.8)
                                for i = Jan..Dec
```

`n`, `ns` are tunable "solar constants" (defaults `n = 0.23`, `ns = 0.8`), stored in
`localStorage` under `solarConstants`.

---

## 6. Investment (₱ cost range)

**Source:** `constants/systemComparisonConstants.js` — `getInvestmentRange()` — the single
source of truth used by System Comparison, Print/Save, the What-If Investment slider, and the
main calculator's Off-Grid/Hybrid pricing.

**Grid-Tied** — a genuine min–max range, flat ₱/kW rate, no battery:

```
Investment.min = Capacity (kW) × GRID_TIED.perKwMin   (₱35,000/kW)
Investment.max = Capacity (kW) × GRID_TIED.perKwMax   (₱50,000/kW)
```

**Hybrid** — base is the Grid-Tied min..max range PLUS a per-kW premium (it carries both
battery AND grid-tie/net-metering equipment, unlike either Off-Grid or Grid-Tied alone),
**plus** the actual cost of the battery the system needs — all terms vary between min and max:

```
GridTiedMin = Capacity × GRID_TIED.perKwMin
GridTiedMax = Capacity × GRID_TIED.perKwMax
Premium     = HYBRID_DUAL_SYSTEM_PREMIUM_PER_KW × Capacity   (₱5,000/kW)
BatteryKwh  = see §2, using this type's Daytime Use / Battery Size

BaseMin (Hybrid) = GridTiedMin + Premium
BaseMax (Hybrid) = GridTiedMax + Premium

Investment.min = BaseMin + BatteryKwh × BatteryRate.perKwhMin
Investment.max = BaseMax + BatteryKwh × BatteryRate.perKwhMax
```

At Daytime Use = 100%, `BatteryKwh` is always 0, so Hybrid Investment reduces to exactly
`[GridTiedMin, GridTiedMax] + ₱5,000 × Capacity` — a genuine range.

**Off-Grid** — same shape, but the Grid-Tied min..max range is discounted per-kW instead
(applied to both ends) since Off-Grid has no grid connection / net metering equipment:

```
Discount = OFF_GRID_NO_GRIDTIE_DISCOUNT_PER_KW × Capacity   (₱5,000/kW)

BaseMin (Off-Grid) = GridTiedMin − Discount
BaseMax (Off-Grid) = GridTiedMax − Discount

Investment.min = BaseMin + BatteryKwh × BatteryRate.perKwhMin
Investment.max = BaseMax + BatteryKwh × BatteryRate.perKwhMax
```

At Daytime Use = 100%, Off-Grid Investment reduces to exactly `[GridTiedMin, GridTiedMax] −
₱5,000 × Capacity` — also a genuine range. The UI (`formatPesoRange()`) still shows a single ₱
value only in the general edge case where `min === max` (e.g. Grid-Tied with equal per-kW
rates), which no longer happens for Off-Grid or Hybrid at 100% Daytime Use.

| Constant | Off-Grid | Hybrid |
|---|---|---|
| `perKwMin` / `perKwMax` (Grid-Tied-equivalent, shared) | ₱35,000 / ₱50,000 | ₱35,000 / ₱50,000 |
| `BatteryRate.perKwhMin` / `perKwhMax` | ₱6,000 / ₱11,000 | ₱9,000 / ₱14,000 |
| No-grid-tie discount (`OFF_GRID_NO_GRIDTIE_DISCOUNT_PER_KW`) | ₱5,000/kW | — (n/a) |
| Dual-system premium (`HYBRID_DUAL_SYSTEM_PREMIUM_PER_KW`) | — (n/a) | ₱5,000/kW |

(`OFF_GRID.perKwMin/perKwMax` = ₱40,000/₱55,000 and `HYBRID.perKwMin/perKwMax` = ₱45,000/₱60,000
exist as constants but are **not** used by `getInvestmentRange` — they remain only as fallbacks
for `getHybridInvestmentProfile`, a deprecated capacity-only helper.)

`Investment.typical = round((Investment.min + Investment.max) / 2)` in all cases.

---

## 7. Estimated Annual Savings

### 7a. System Comparison / What-If "Estimated Annual Savings" (unified formula)

**Source:** `utils/systemComparisonScenarios.js` — `estimatedAnnualSavingsFromFormula()`

```
Estimated Annual Savings = round(Annual Production (kWh) × Electricity Rate (₱/kWh) × UF)
```

- **Electricity Rate** = the calculator's rate input (`baseParameters.rate`), falling back to
  ₱10/kWh — the *same* rate for Off-Grid, Grid-Tied, and Hybrid (no per-type override).
- **UF** = §1, using this type's Daytime Use / Battery Size (Grid-Tied's battery forced to 0).
  Off-Grid's Daytime Use and Battery Size both start from — and always track — the calculator's
  own inputs, exactly like Grid-Tied and Hybrid (no hardcoded default value for Off-Grid).

If a value was already committed via **Apply Configuration**, the stored per-scenario
`annualSavings` is used directly instead of recomputing this formula.

### 7b. What-If live preview (per-slider-drag)

**Source:** `MapComponent.jsx` — `onCalculate`

```
Estimated Annual Savings = round(EstimatedAnnualProduction × Rate × UF)
```

Same shape as §7a, but fed by the *live* What-If sliders (Daytime Use, Battery Size, Rate,
Budget-derived capacity) rather than the static calculator baseline — this is what updates in
real time as you drag a slider, and converges with §7a once Apply Configuration commits it (and
already matches it at first load, since every slider's initial value is seeded from the same
calculator inputs §7a uses).

### 7c. Main calculator's Summary table (grid-tied savings model)

**Source:** `CalculatorEnhanced.jsx`

```
Monthly Savings[i] = MonthlyProduction[i] (kWh) × Rate × UF_gridTied
Total Annual Savings = Σ Monthly Savings[i]
```

---

## 8. Payback Period & ROI

### 8a. System Comparison ranges

**Source:** `utils/systemComparisonScenarios.js` — `paybackRangeFromInvestment()`,
`roiRangeFromInvestment()`

```
Payback Period range (years) = [Investment.min / AnnualSavings, Investment.max / AnnualSavings]

ROI (25-year, annualized) = ((TotalSavings25yr / Investment) ^ (1/25) − 1) × 100
  where TotalSavings25yr = AnnualSavings × 25
  computed at both Investment.min and Investment.max to form the ROI range
```

Grid-Tied uses its own true min/max Investment; Off-Grid/Hybrid use the battery-aware range
from §6. If Annual Savings is 0 or Investment is invalid, both formulas return `null` (shown as
"N/A"/"—") rather than falling back to an unrelated estimate.

### 8b. Main calculator / What-If single-point Payback & ROI

**Source:** `services/pricingService.js` — `calculateROI()`

```
Payback Period (years) = SystemCost / AnnualSavings
ROI (%)                 = (AnnualSavings / SystemCost) × 100
NetSavings               = AnnualSavings − SystemCost / 20   (assumes 20-year system life)
```

Off-Grid and Hybrid then apply a tuning multiplier on top:

```
Off-Grid: Payback × 1.05,  ROI × 0.90
Hybrid:   Payback × 1.40,  ROI × 0.95
Grid-Tied: × 1 (unchanged)
```

---

## 9. Off-Grid Electricity Rate

Off-Grid's Electricity Rate slider is **locked**, not adjustable — it always mirrors the main
calculator's own Rate input (`baseRateVal`), the same value used to compute the Grid-Tied and
Hybrid figures. It is **not** hardcoded to 0; Off-Grid's Annual Savings, Payback Period, and ROI
are computed with the real rate like every other system type.

---

## Summary of shared/single-source files

| Formula | File |
|---|---|
| Utilization Factor, Battery kWh | `constants/utilizationFactors.js` |
| Investment range | `constants/systemComparisonConstants.js` |
| Annual Savings / Payback / ROI ranges (System Comparison) | `utils/systemComparisonScenarios.js` |
| Roof-Area ↔ Capacity bridge (Monthly Consumption mode) | `utils/roofAreaEstimator.js` |
| calculateROI (single-point Payback/ROI) | `services/pricingService.js` |
| Live What-If capacity/savings/payback/roi | `components/MapComponent.jsx` (`onCalculate`) |
| Main calculator Summary table | `components/CalculatorEnhanced.jsx` |
