import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Collapse,
  Divider,
  IconButton,
  Typography,
  Avatar
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { computeSystemComparisonScenarios } from '../utils/systemComparisonScenarios';
import { formatPesoRange } from '../constants/systemComparisonConstants';

const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pesos = (v) => (v != null ? `₱${Math.round(v).toLocaleString()}` : null);

/** paybackPeriod/roi on calculator results can be a plain number or a {gridTied, hybrid, offGrid} map. */
const pickScalar = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'object') return asNumber(v.gridTied ?? v.gridtied);
  return asNumber(v);
};

/** One compact figure in the stat strip (Investment / Payback / ROI) — label on top, value below,
 *  separated from its neighbors by a thin vertical divider. Mirrors the Investment/Payback/ROI
 *  figures on the System Comparison tab's own cards so the two views never show different numbers. */
const StatFigure = ({ label, value, color }) => (
  <Box sx={{ flex: 1, textAlign: 'center', px: 1 }}>
    <Typography
      variant="caption"
      sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', fontSize: '0.68rem', mb: 0.4 }}
    >
      {label}
    </Typography>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color, lineHeight: 1.3 }}>
      {value}
    </Typography>
  </Box>
);

/** Card for one System Comparison scenario — teaser + at-a-glance stat strip always visible,
 *  full paragraph revealed on expand. `expanded`/`onToggle` are shared across all three cards by
 *  the parent, so expanding one expands them all together. */
const ScenarioCard = ({ name, color, teaser, stats, body, expanded, onToggle }) => {
  return (
    <Grid item xs={12} md={4}>
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderTop: `4px solid ${color}`,
          borderRadius: 2,
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color, mb: 1.25 }}>
            {name}
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary', mb: 2 }}>
            {teaser}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              bgcolor: 'action.hover',
              borderRadius: 1.5,
              py: 1.25
            }}
          >
            <StatFigure label="Investment" value={stats.investment} color={color} />
            <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />
            <StatFigure label="Payback" value={stats.payback} color="text.primary" />
            <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />
            <StatFigure label="25-yr ROI" value={stats.roi} color="text.primary" />
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ mt: 2, mb: 1.75 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.75 }}>
              {body}
            </Typography>
          </Collapse>
        </CardContent>
        <CardActions sx={{ pt: 0, px: 2.5, pb: 1.5 }}>
          <IconButton
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? 'Show less' : 'Show more'}
            size="small"
            sx={{
              ml: 'auto',
              mr: 1,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mr: 1, cursor: 'pointer', fontWeight: 600 }}
            onClick={onToggle}
          >
            {expanded ? 'Show less' : 'Read more'}
          </Typography>
        </CardActions>
      </Card>
    </Grid>
  );
};

/**
 * Analysis tab — a paragraph writeup of the same figures shown on the Results/Summary tab and
 * the System Comparison tab, in a proper card layout instead of a plain wall of text. Pulls
 * System Comparison's numbers from computeSystemComparisonScenarios (the same single source of
 * truth System Comparison and Print/Save use) so nothing here can drift from what those tabs show.
 */
const ResultNarrativeDisplay = ({ parameters, results, comparisonBaseParameters, comparisonBaseResults }) => {
  // Shared across all three scenario cards, so expanding/collapsing one expands/collapses them all.
  const [scenariosExpanded, setScenariosExpanded] = useState(false);

  if (!results) return null;

  const locationName = parameters?.location?.city;
  const panelSize = asNumber(parameters?.panelSize);
  const rate = asNumber(parameters?.rate);

  const capacity = asNumber(results.systemCapacity ?? results.capacity);
  const panelCount = asNumber(results.panelCount);
  const annualProduction = asNumber(results.annualProduction);
  const dailyProduction = annualProduction != null ? annualProduction / 365 : null;
  const annualSavings = asNumber(results.annualSavings);
  const investment = asNumber(results.investment);
  const payback = pickScalar(results.paybackPeriod);
  const roi = pickScalar(results.roi);

  const scenarios = computeSystemComparisonScenarios(comparisonBaseParameters, comparisonBaseResults);
  const offgrid = scenarios.find((s) => s.id === 'budget');
  const gridtied = scenarios.find((s) => s.id === 'balanced');
  const hybrid = scenarios.find((s) => s.id === 'premium');

  const summaryParagraph = (
    <>
      {locationName ? `For a rooftop system at ${locationName}, ` : 'For this rooftop, '}
      the recommended setup is a{capacity != null ? ` ${capacity.toFixed(1)} kW` : ''} solar array
      {panelCount != null ? `, made up of ${panelCount} panel${panelCount === 1 ? '' : 's'}` : ''}
      {panelSize != null ? ` at ${panelSize} kWp each` : ''}. This system is estimated to generate about{' '}
      {annualProduction != null ? `${Math.round(annualProduction).toLocaleString()} kWh` : 'a meaningful amount of energy'} per year
      {dailyProduction != null ? ` — roughly ${dailyProduction.toFixed(1)} kWh a day` : ''}
      {rate != null ? `, which at your electricity rate of ₱${rate.toFixed(2)}/kWh` : ''}
      {annualSavings != null ? ` works out to about ${pesos(annualSavings)} in savings every year.` : '.'}
      {investment != null && payback != null
        ? ` With an estimated investment of ${pesos(investment)}, the system is expected to pay for itself in about ${payback.toFixed(1)} years`
        : ''}
      {roi != null ? `, for an estimated return on investment of ${roi.toFixed(1)}% over 25 years.` : investment != null && payback != null ? '.' : ''}
    </>
  );

  return (
    <Box sx={{ mt: 3, mb: 4 }}>
      {/* System Results, in prose, inside its own container */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
          border: '2px solid #1976d2',
          borderRadius: 3,
          boxShadow: '0 6px 20px rgba(25,118,210,0.15)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>
              <InsightsIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1976d2', mb: 1.5 }}>
                Analysis
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
                {summaryParagraph}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* System Comparison, in prose, one interactive card per configuration */}
      {(offgrid || gridtied || hybrid) && (
        <>
          <Typography
            variant="overline"
            sx={{ display: 'block', fontWeight: 700, color: 'text.secondary', letterSpacing: 0.6, mb: 2 }}
          >
            How the three configurations compare
          </Typography>
          <Grid container spacing={2.5}>
            {offgrid && (
              <ScenarioCard
                name="Off-Grid"
                color={offgrid.color}
                expanded={scenariosExpanded}
                onToggle={() => setScenariosExpanded((prev) => !prev)}
                teaser={`Sizes the same roof at about ${offgrid.capacity.toFixed(1)} kW (${offgrid.panelCount} panels), fully independent from the utility company.`}
                stats={{
                  investment: formatPesoRange(offgrid.cost.min, offgrid.cost.max),
                  payback: `${offgrid.paybackPeriod} yrs`,
                  roi: `${offgrid.roi}%`
                }}
                body={
                  <>
                    Its cost is driven mostly by battery size. Its real value is full energy independence — it
                    generates and stores its own electricity, which suits remote areas or locations with
                    unstable grid power — though it does need a sizable battery bank and can be affected by
                    prolonged cloudy weather.
                  </>
                }
              />
            )}
            {gridtied && (
              <ScenarioCard
                name="Grid-Tied"
                color={gridtied.color}
                expanded={scenariosExpanded}
                onToggle={() => setScenariosExpanded((prev) => !prev)}
                teaser={`The most affordable and simplest option, sizing the roof at about ${gridtied.capacity.toFixed(1)} kW (${gridtied.panelCount} panels).`}
                stats={{
                  investment: formatPesoRange(gridtied.cost.min, gridtied.cost.max),
                  payback: `${gridtied.paybackPeriod} yrs`,
                  roi: `${gridtied.roi}%`
                }}
                body={
                  <>
                    It stays connected to the grid, reducing your bill without the added cost of batteries. The
                    trade-off is that it shuts down during outages, offering no backup power when the grid goes
                    down.
                  </>
                }
              />
            )}
            {hybrid && (
              <ScenarioCard
                name="Hybrid"
                color={hybrid.color}
                expanded={scenariosExpanded}
                onToggle={() => setScenariosExpanded((prev) => !prev)}
                teaser={`Combines grid connection plus battery backup, sized at about ${hybrid.capacity.toFixed(1)} kW (${hybrid.panelCount} panels).`}
                stats={{
                  investment: formatPesoRange(hybrid.cost.min, hybrid.cost.max),
                  payback: `${hybrid.paybackPeriod} yrs`,
                  roi: `${hybrid.roi}%`
                }}
                body={
                  <>
                    This is the highest upfront cost of the three. It keeps essential loads running during an
                    outage, the best fit for anyone who wants savings on their bill and a safety net when the
                    power goes out.
                  </>
                }
              />
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default ResultNarrativeDisplay;
