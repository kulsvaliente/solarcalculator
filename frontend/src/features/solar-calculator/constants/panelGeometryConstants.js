/**
 * Fixed panel geometry for solar modeling (UI no longer exposes tilt).
 * Daytime use (% of load during solar hours) scales estimated savings in the calculator.
 */

export const FIXED_PANEL_TILT_DEGREES = 18;

/** Slider default: initial value only — fully adjustable by the user (0–100%, step 10). */
export const DEFAULT_DAYTIME_USE_PERCENT = 50;
