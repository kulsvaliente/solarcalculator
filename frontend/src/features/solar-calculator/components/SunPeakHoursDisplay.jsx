import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import {
  WbSunny as SunIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

/** Days per month (Jan–Dec). December uses 31 (standard calendar). */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Monthly energy production (kWh): sun peak hours × system capacity (kW) × days × 0.8
 */
const estimatedGenerationKwh = (sunPeakHours, systemCapacityKw, monthIndex) => {
  const days = DAYS_IN_MONTH[monthIndex] ?? 31;
  const cap = Number(systemCapacityKw);
  if (!cap || cap <= 0 || sunPeakHours == null) return null;
  return sunPeakHours * cap * days * 0.8;
};

/** Monthly Savings = monthly energy (kWh) × rate (₱/kWh) × utilization factor */
const monthlySavingsPhp = (monthlyEnergyKwh, electricityRate, utilizationFactor) => {
  const kwh = monthlyEnergyKwh != null ? Number(monthlyEnergyKwh) : NaN;
  const rate = Number(electricityRate);
  const uf = Number(utilizationFactor);
  if (
    !Number.isFinite(kwh) ||
    kwh < 0 ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    !Number.isFinite(uf) ||
    uf < 0
  ) {
    return null;  
  }
  return kwh * rate * uf;
};

const SunPeakHoursDisplay = ({
  sunPeakHoursData,
  location,
  loading,
  error,
  systemCapacity,
  /** Electricity rate (₱/kWh). With utilizationFactor, drives Monthly Savings column. */
  electricityRate,
  /** Utilization factor (0–1+). With electricityRate, drives Monthly Savings column. */
  utilizationFactor,
  monthlyOnly = false
}) => {
  if (loading) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SunIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Loading Sun Peak Hours Data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading sun peak hours data: {error}
      </Alert>
    );
  }

  const hasMonthlyData = Array.isArray(sunPeakHoursData?.monthlyData) && sunPeakHoursData.monthlyData.length > 0;
  const hasSuccessfulPayload = Boolean(sunPeakHoursData?.success) || hasMonthlyData;

  if (!sunPeakHoursData || !hasSuccessfulPayload) {
    return null;
  }

  const { annualAverage, seasonalAverages, monthlyData } = sunPeakHoursData;
  const formatToTwoDecimals = (value) => Number(value || 0).toFixed(2);
  const monthlyRows = Array.isArray(monthlyData) ? monthlyData : [];
  const fallbackAnnualSunPeak =
    monthlyRows.length > 0
      ? monthlyRows.reduce((sum, m) => sum + (Number(m?.sunPeakHours) || 0), 0) / monthlyRows.length
      : 0;
  const annualSunPeakValue = Number(annualAverage?.sunPeakHours) || fallbackAnnualSunPeak;

  const monthlyWithEnergy = monthlyRows.map((month, index) => {
    const days = DAYS_IN_MONTH[index] ?? 31;
    const monthlyEnergy = estimatedGenerationKwh(month.sunPeakHours, systemCapacity, index);
    const dailyEnergy = monthlyEnergy != null && days > 0 ? monthlyEnergy / days : null;
    const monthlySavings = monthlySavingsPhp(monthlyEnergy, electricityRate, utilizationFactor);
    return {
      ...month,
      monthIndex: index,
      days,
      monthlyEnergy,
      dailyEnergy,
      monthlySavings
    };
  });
  const totals = monthlyWithEnergy.reduce(
    (acc, month) => {
      acc.sunPeakHours += Number(month.sunPeakHours) || 0;
      acc.solarIrradiance += Number(month.solarIrradiance) || 0;
      acc.monthlyEnergy += month.monthlyEnergy != null ? Number(month.monthlyEnergy) : 0;
      acc.dailyEnergy += month.dailyEnergy != null ? Number(month.dailyEnergy) : 0;
      acc.monthlySavings += month.monthlySavings != null ? Number(month.monthlySavings) : 0;
      return acc;
    },
    { sunPeakHours: 0, solarIrradiance: 0, monthlyEnergy: 0, dailyEnergy: 0, monthlySavings: 0 }
  );
  const monthCount = monthlyWithEnergy.length || 1;
  const averages = {
    sunPeakHours: totals.sunPeakHours / monthCount,
    solarIrradiance: totals.solarIrradiance / monthCount,
    monthlyEnergy: totals.monthlyEnergy / monthCount,
    dailyEnergy: totals.dailyEnergy / monthCount,
    monthlySavings: totals.monthlySavings / monthCount
  };
  const averageRowMonthlySavings = monthlySavingsPhp(
    averages.monthlyEnergy,
    electricityRate,
    utilizationFactor
  );

  const monthlyBreakdownSection = (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ 
        fontWeight: 600, 
        color: '#1976d2',
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        📅 Monthly Sun Peak Hours
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{
        borderRadius: 3,
        border: '2px solid #e0e0e0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <Table sx={{
          '& td, & th': {
            border: '1px solid #e0e0e0',
            color: '#2c3e50',
            fontWeight: '600',
            textAlign: 'center',
            fontSize: '1rem',
            py: 2.5,
            px: 3
          },
          '& th': {
            bgcolor: '#e3f2fd',
            color: '#1976d2',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            py: 3
          },
          '& tbody tr:hover': {
            bgcolor: '#f8f9fa',
            transform: 'scale(1.01)',
            transition: 'all 0.2s ease'
          },
          '& tbody tr': {
            transition: 'all 0.2s ease'
          }
        }}>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell align="right">Sun Peak Hours</TableCell>
              <TableCell align="right">Solar Irradiance</TableCell>
              <TableCell align="right">Monthly Energy Production</TableCell>
              <TableCell align="right">Daily Energy Production</TableCell>
              <TableCell align="right">Monthly Savings</TableCell>
              <TableCell align="center">Performance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {monthlyWithEnergy.map((month) => {
              const isHigh = month.sunPeakHours >= annualSunPeakValue * 1.1;
              const isLow = month.sunPeakHours <= annualSunPeakValue * 0.9;
              
              return (
                <TableRow key={month.month}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{month.month}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 400 }}>
                      {month.sunPeakHoursFormatted}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                      {month.solarIrradiance.toFixed(2)} kWh/m²
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                      {month.monthlyEnergy != null
                        ? `${month.monthlyEnergy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                      {month.dailyEnergy != null
                        ? `${month.dailyEnergy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                      {month.monthlySavings != null
                        ? `₱${Math.round(month.monthlySavings).toLocaleString()}`
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {isHigh && (
                      <Chip 
                        label="High" 
                        size="medium" 
                        color="success" 
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {isLow && (
                      <Chip 
                        label="Low" 
                        size="medium" 
                        color="warning" 
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {!isHigh && !isLow && (
                      <Chip 
                        label="Average" 
                        size="medium" 
                        color="default" 
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ bgcolor: '#e3f2fd' }}>
              <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Average</TableCell>
              <TableCell align="right" sx={{ fontWeight: 400, color: '#1976d2' }}>
                {averages.sunPeakHours.toFixed(2)} hours/day
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {averages.solarIrradiance.toFixed(2)} kWh/m²
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {averages.monthlyEnergy.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} kWh
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {averages.dailyEnergy.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} kWh
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {averageRowMonthlySavings != null
                  ? `₱${Math.round(averageRowMonthlySavings).toLocaleString()}`
                  : '—'}
              </TableCell>
              <TableCell align="center">—</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (monthlyOnly) {
    return monthlyBreakdownSection;
  }

  return (
    <Box sx={{ mt: 4, mb: 3 }}>
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '2px solid #e0e0e0'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            fontWeight: 600, 
            color: '#1976d2',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <SunIcon sx={{ fontSize: '2rem' }} />
            Sun Peak Hours Analysis
          </Typography>
          
          {location && (
            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ 
              mb: 3,
              fontSize: '1rem',
              fontWeight: 500
            }}>
              📍 Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Typography>
          )}

          <Divider sx={{ my: 4 }} />

          {/* Annual Average */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 600, 
              color: '#1976d2',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <TrendingUpIcon sx={{ fontSize: '1.5rem' }} />
              Annual Average
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  bgcolor: '#e3f2fd', 
                  borderRadius: 3,
                  border: '2px solid #90caf9',
                  boxShadow: '0 4px 12px rgba(25,118,210,0.15)',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25,118,210,0.2)'
                  }
                }}>
                  <Typography variant="h3" sx={{ 
                    color: '#1976d2', 
                    fontWeight: 'bold',
                    mb: 1
                  }}>
                    {formatToTwoDecimals(annualAverage.sunPeakHours)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#1565c0',
                    fontWeight: 'bold'
                  }}>
                    Hours per Day
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  bgcolor: '#e8f5e9', 
                  borderRadius: 3,
                  border: '2px solid #a5d6a7',
                  boxShadow: '0 4px 12px rgba(76,175,80,0.15)',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(76,175,80,0.2)'
                  }
                }}>
                  <Typography variant="h3" sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 'bold',
                    mb: 1
                  }}>
                    {formatToTwoDecimals(annualAverage.solarIrradiance)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#388e3c',
                    fontWeight: 600
                  }}>
                    kWh/m²/day
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Seasonal Averages */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 600, 
              color: '#1976d2',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CalendarIcon sx={{ fontSize: '1.5rem' }} />
              Seasonal Averages
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  border: '3px solid #ff9800', 
                  borderRadius: 3,
                  bgcolor: '#fff3e0',
                  boxShadow: '0 4px 12px rgba(255,152,0,0.15)',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(255,152,0,0.25)'
                  }
                }}>
                  <Typography variant="h4" sx={{ 
                    color: '#f57c00',
                    fontWeight: 'bold',
                    mb: 2,
                    fontSize: '2.5rem'
                  }}>
                    {formatToTwoDecimals(seasonalAverages.hotDry ?? seasonalAverages.summer)} kWh/m²
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#ef6c00',
                    fontWeight: 600,
                    mb: 1
                  }}>
                    ☀️ Hot/Dry Season
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#e65100',
                    fontStyle: 'italic'
                  }}>
                    November - May
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  border: '3px solid #2196f3', 
                  borderRadius: 3,
                  bgcolor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(33,150,243,0.15)',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(33,150,243,0.25)'
                  }
                }}>
                  <Typography variant="h4" sx={{ 
                    color: '#1565c0',
                    fontWeight: 'bold',
                    mb: 2,
                    fontSize: '2.5rem'
                  }}>
                    {formatToTwoDecimals(seasonalAverages.wetRainy ?? seasonalAverages.winter)} kWh/m²
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#0d47a1',
                    fontWeight: 600,
                    mb: 1
                  }}>
                    🌧️ Wet/Rainy Season
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#01579b',
                    fontStyle: 'italic'
                  }}>
                    June - October
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {monthlyBreakdownSection}

          {/* Data Source Info */}
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            bgcolor: '#f8f9fa', 
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{
              fontSize: '0.95rem',
              lineHeight: 1.6
            }}>
              <strong>📊 Weather Data Source:</strong> NREL PVWatts API v8 |
              <strong> 💰 Monthly Savings:</strong> Monthly Energy Production × Rate × Utilization Factor |
              <strong> ⏰ Updated:</strong> {new Date(sunPeakHoursData.metadata.calculationDate).toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SunPeakHoursDisplay;