import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import HeroSummaryCard from './HeroSummaryCard';
import { computeSystemComparisonScenarios } from '../utils/systemComparisonScenarios';
import { formatPesoRange } from '../constants/systemComparisonConstants';

/**
 * SystemComparison Component
 * Displays 3 solar system configurations side-by-side for comparison
 * Helps users choose between budget, balanced, and premium options
 * 
 * @param {Object} props - Component props
 * @param {Object} props.baseParameters - Original calculator parameters
 * @param {Object} props.baseResults - Original calculation results
 * @param {Function} props.onSelect - Callback when user selects a scenario
 * @param {Function} [props.onApply] - Callback for top-level Apply button
 * @param {Function} [props.onReset] - Callback for top-level Reset button
 */
const SHOW_SELECTION_BUTTONS = false;

/** Matches Off-Grid scenario card accent (border, estimated savings figure) — distinct from primary/ROI blue */
const OFF_GRID_COMPARISON_COLOR = '#42a5f5';

/** Matches Grid-Tied scenario card accent */
const GRID_TIED_COMPARISON_COLOR = '#26a69a';

/** Matches Hybrid scenario card accent */
const HYBRID_COMPARISON_COLOR = '#7e57c2';

const SystemComparison = ({ baseParameters, baseResults, onSelect, onApply, onReset }) => {
  const [scenarios, setScenarios] = useState([]);
  const userPanelSizeKw = parseFloat(baseParameters?.panelSize) || 0.6;
  const summaryCapacity = Number(baseResults?.systemCapacity || baseResults?.capacity || 0);
  const summaryAnnualProduction = Number(baseResults?.annualProduction || 0);
  const summaryAnnualSavings = Number(baseResults?.annualSavings || 0);
  const summaryPanelCount = Number(baseResults?.panelCount || (summaryCapacity > 0 ? Math.max(1, Math.ceil(summaryCapacity / userPanelSizeKw)) : 0));
  const summaryDailyProduction = summaryAnnualProduction > 0 ? (summaryAnnualProduction / 365) : 0;
  const heroSummary = {
    Rcapacity: summaryCapacity,
    eeannual: summaryAnnualProduction,
    eeave: summaryDailyProduction.toFixed(1),
    totalSavings: summaryAnnualSavings,
    panelCount: summaryPanelCount,
    panelWattage: Math.round(userPanelSizeKw * 1000),
    pricingSource: baseResults?.pricingSource || 'Calculated Estimate'
  };

  useEffect(() => {
    setScenarios(computeSystemComparisonScenarios(baseParameters, baseResults));
  }, [baseParameters, baseResults]);

  const handleSelect = (scenario) => {
    if (onSelect) {
      onSelect(scenario);
    }
  };

  const recommendedScenario = scenarios.find((scenario) => scenario.recommended) || scenarios[0] || null;

  const handleApply = () => {
    if (!recommendedScenario) return;
    if (typeof onApply === 'function') {
      onApply(recommendedScenario);
      return;
    }
    handleSelect(recommendedScenario);
  };

  const handleReset = () => {
    if (typeof onReset === 'function') {
      onReset();
    }
  };

  return (
    <Box sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1976d2', mb: 3 }}>
        Compare Solar System Options
      </Typography>
      
      <Typography variant="body1" paragraph color="textSecondary" sx={{ mb: 5, lineHeight: 1.8, fontSize: '1.1rem' }}>
        We've prepared three solar system configurations optimized for your needs.
        Compare features, costs, and benefits to find the best fit for you.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <HeroSummaryCard summary={heroSummary} loading={false} hideHeader hideAnnualSavings />
      </Box>

      <Alert severity="warning" sx={{ mb: 2, fontSize: '1.05rem', '& .MuiAlert-message': { fontSize: '1.05rem' } }}>
        Disclaimer: These figures are theoretical and do not reflect actual market conditions.
      </Alert>

      <Grid container spacing={3}>
        {scenarios.map((scenario, index) => (
          <Grid item xs={12} md={4} key={scenario.id}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: `3px solid ${scenario.color}`,
              position: 'relative',
              transition: 'all 0.3s ease-in-out',
              minHeight: '400px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 16px ${scenario.color}40`
              }
            }}>
              <CardHeader
                title={scenario.name}
                subheader={scenario.subtitle}
                sx={{
                  bgcolor: '#ffffff',
                  borderBottom: `2px solid ${scenario.color}`,
                  p: 2,
                  '& .MuiCardHeader-title': {
                    fontWeight: 600,
                    fontSize: '1.3rem',
                    mb: 0.5
                  },
                  '& .MuiCardHeader-subheader': {
                    fontSize: '1rem',
                    fontWeight: 500
                  }
                }}
              />

              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* Key Metrics */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: scenario.color, fontWeight: 'bold', mb: 1, fontSize: '2rem' }}>
                    {['budget', 'balanced', 'premium'].includes(scenario.id)
                      ? `₱${scenario.annualSavings.toLocaleString()}`
                      : `${scenario.capacity.toFixed(1)} kW`}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                    {['budget', 'balanced', 'premium'].includes(scenario.id)
                      ? 'Estimated Annual Savings'
                      : `System Capacity • ${scenario.panelCount} Panels`}
                  </Typography>
                </Box>

                {/* Cost & Savings Table */}
                <Table size="small" sx={{ mb: 3 }}>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem', py: 1.5 }}>Investment</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem', py: 1.5, fontWeight: 600 }}>
                        {formatPesoRange(scenario.cost.min, scenario.cost.max)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem', py: 1.5 }}>Payback Period</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem', py: 1.5, fontWeight: 600 }}>
                        {scenario.paybackPeriod} years
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem', py: 1.5 }}>ROI (25 years)</TableCell>
                      <TableCell align="right" sx={{ color: '#1976d2', fontWeight: 600, fontSize: '0.95rem', py: 1.5 }}>
                        {scenario.roi}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem', py: 1.5 }}>Daytime Use</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.95rem', py: 1.5, fontWeight: 600 }}>
                        {scenario.daytimeUsePercent}%
                      </TableCell>
                    </TableRow>
                    {scenario.batteryCapacityKwh != null && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem', py: 1.5 }}>Battery Capacity (kWh)</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.95rem', py: 1.5, fontWeight: 600 }}>
                          {scenario.batteryCapacityKwh.toFixed(1)} kWh
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', fontWeight: 400, display: 'block', mb: 2, lineHeight: 1.5, fontSize: '0.9rem' }}
                >
                  {scenario.id === 'balanced'
                    ? 'Total cost depends on location, structure, and warranty coverage.'
                    : 'Total cost depends on location, structure, warranty coverage and battery size.'}
                </Typography>

                {/* Pros */}
                <Typography variant="subtitle1" color="success.main" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2, fontSize: '1rem' }}>
                  ✓ Advantages:
                </Typography>
                <List dense sx={{ mb: 3 }}>
                  {scenario.pros.slice(0, 3).map((pro, index) => (
                    <ListItem key={index} sx={{ py: 0.75, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1.2rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={pro}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          sx: { lineHeight: 1.5, fontSize: '0.9rem' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Cons */}
                <Typography variant="subtitle1" color="warning.main" gutterBottom sx={{ fontWeight: 600, mb: 2, fontSize: '1rem' }}>
                  ⚠ Considerations:
                </Typography>
                <List dense sx={{ mb: 2 }}>
                  {scenario.cons.map((con, index) => (
                    <ListItem key={index} sx={{ py: 0.75, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon sx={{ color: '#ed6c02', fontSize: '1.2rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={con}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          sx: { lineHeight: 1.5, fontSize: '0.9rem' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              {SHOW_SELECTION_BUTTONS && (
                <CardActions sx={{ p: 3, pt: 1 }}>
                  <Button
                    variant={scenario.recommended ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleSelect(scenario)}
                    sx={{
                      bgcolor: scenario.recommended ? scenario.color : 'transparent',
                      borderColor: scenario.color,
                      color: scenario.recommended ? 'white' : scenario.color,
                      fontWeight: 600,
                      py: 2,
                      fontSize: '1rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      borderWidth: '2px',
                      '&:hover': {
                        bgcolor: scenario.recommended ? `${scenario.color}dd` : `${scenario.color}15`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${scenario.color}40`,
                        borderWidth: '2px'
                      }
                    }}
                  >
                    {scenario.recommended ? 'Select Recommended' : 'Select This Option'}
                  </Button>
                </CardActions>
              )}

            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Comparison Tips */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 4, color: '#1976d2', textAlign: 'center' }}>
          💡 Comparison Tips
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2, boxShadow: 1, height: '100%' }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2, fontSize: '1.1rem', color: OFF_GRID_COMPARISON_COLOR }}
              >
                Off-Grid PV System
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                Perfect for set ups seeking full energy independence and a complete break from utility grid reliance.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2, boxShadow: 1, height: '100%' }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2, fontSize: '1.1rem', color: GRID_TIED_COMPARISON_COLOR }}
              >
                Grid-Tied PV System
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                Best suited for set ups looking to cut electricity costs affordably, particularly households or businesses
                that consume most of their energy during daytime.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2, boxShadow: 1, height: '100%' }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2, fontSize: '1.1rem', color: HYBRID_COMPARISON_COLOR }}
              >
                Hybrid PV System
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                Perfect for set ups who need uninterrupted power during planned or unexpected outages and typhoons,
                ensuring critical loads stay running through prolonged disruptions and harsh weather conditions.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SystemComparison;

