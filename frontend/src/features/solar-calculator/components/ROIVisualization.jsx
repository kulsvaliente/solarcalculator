// ROI Visualization - displays return on investment with gauge and profit curve
import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, PiggyBank, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { formatCurrency } from '../../../lib/utils';

// ROI Gauge component (semi-circular gauge)
const ROIGauge = ({ roi, systemType, color }) => {
  // Clamp ROI to reasonable display range (0-50%)
  const clampedROI = Math.min(Math.max(roi || 0, 0), 50);
  const percentage = (clampedROI / 50) * 100;
  
  // Calculate rotation for gauge needle (-90deg to 90deg)
  const rotation = -90 + (percentage * 1.8);

  return (
    <div className="relative w-full aspect-square max-w-xs mx-auto">
      {/* Gauge background arc */}
      <svg className="w-full h-full" viewBox="0 0 200 120">
        {/* Background arc (gray) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Colored progress arc */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: percentage / 100 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray="1"
          strokeDashoffset="0"
        />

        {/* Center needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="40"
            stroke="#2c3e50"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill="#2c3e50" />
        </motion.g>

        {/* Scale markers */}
        {[0, 10, 20, 30, 40, 50].map((value) => {
          const angle = -90 + ((value / 50) * 180);
          const radians = (angle * Math.PI) / 180;
          const x = 100 + 85 * Math.cos(radians);
          const y = 100 + 85 * Math.sin(radians);
          return (
            <text
              key={value}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#666"
            >
              {value}%
            </text>
          );
        })}
      </svg>

      {/* Center display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-4xl font-bold" style={{ color }}>
            {clampedROI.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">{systemType}</p>
        </motion.div>
      </div>
    </div>
  );
};

// 25-Year Profit Curve Chart
const ProfitCurveChart = ({ summary }) => {
  // Calculate cumulative profit over 25 years
  const annualSavings = parseFloat(summary.totalSavings);
  const gridTiedCost = summary.gridtiedCost_Min;
  
  // Generate data for 25 years
  const chartData = [];
  for (let year = 0; year <= 25; year++) {
    const cumulativeSavings = annualSavings * year;
    const profit = cumulativeSavings - gridTiedCost;
    
    chartData.push({
      year,
      profit: profit / 1000, // Convert to thousands for better readability
      savings: cumulativeSavings / 1000,
    });
  }

  // Find break-even year
  const breakEvenYear = chartData.find(d => d.profit >= 0)?.year || 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-primary mb-1">Year {label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold">
                {formatCurrency(entry.value * 1000)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke="#546e7a"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            label={{ value: 'Amount (₱ thousands)', angle: -90, position: 'insideLeft' }}
            stroke="#546e7a"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Zero reference line */}
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          
          {/* Break-even vertical line */}
          <ReferenceLine 
            x={breakEvenYear} 
            stroke="#2e7d32" 
            strokeDasharray="5 5"
            label={{ value: `Break-even: Year ${breakEvenYear}`, position: 'top', fill: '#2e7d32', fontSize: 12 }}
          />
          
          {/* Cumulative savings line */}
          <Line 
            type="monotone" 
            dataKey="savings" 
            stroke="#00acc1" 
            strokeWidth={2}
            name="Cumulative Savings"
            dot={false}
          />
          
          {/* Net profit line */}
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="#2e7d32" 
            strokeWidth={3}
            name="Net Profit"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main ROI Visualization component
const ROIVisualization = ({ summary, loading }) => {
  // Show loading skeleton
  if (loading || !summary || !summary.roi) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // System ROI data
  const roiData = [
    {
      type: 'Grid-Tied',
      roi: summary.roi.gridTied?.roi || 0,
      color: '#1976d2',
    },
    {
      type: 'Hybrid',
      roi: summary.roi.hybrid?.roi || 0,
      color: '#26a69a',
    },
    {
      type: 'Off-Grid',
      roi: summary.roi.offGrid?.roi || 0,
      color: '#00acc1',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="border-2 border-purple-500/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-12 bg-purple-500 rounded-full" />
            <div>
              <CardTitle className="text-2xl text-purple-700">
                Return on Investment (ROI)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Long-term financial performance of your solar investment
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ROI Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roiData.map((system, index) => (
              <motion.div
                key={system.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <ROIGauge
                  roi={system.roi}
                  systemType={system.type}
                  color={system.color}
                />
              </motion.div>
            ))}
          </div>

          {/* ROI Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-4 bg-gradient-to-br from-primary-light to-white rounded-lg border border-primary/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-gray-800">Best ROI</h4>
              </div>
              <p className="text-2xl font-bold text-primary">
                {Math.max(...roiData.map(d => d.roi)).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {roiData.reduce((best, curr) => curr.roi > best.roi ? curr : best).type} System
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg border border-teal-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-5 h-5 text-teal-600" />
                <h4 className="font-semibold text-gray-800">25-Year Savings</h4>
              </div>
              <p className="text-2xl font-bold text-teal-600">
                {formatCurrency(parseFloat(summary.totalSavings) * 25)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Total over system lifespan
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-4 bg-gradient-to-br from-success-light to-white rounded-lg border border-success/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <h4 className="font-semibold text-gray-800">Annual Return</h4>
              </div>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(summary.totalSavings)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Estimated yearly savings
              </p>
            </motion.div>
          </div>

          {/* 25-Year Profit Curve */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                25-Year Profit Projection
              </h3>
              <p className="text-sm text-gray-600">
                See how your investment grows over time (based on Grid-Tied system)
              </p>
            </div>
            <ProfitCurveChart summary={summary} />
          </motion.div>

          {/* Info box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-700 mb-1">
                  Understanding ROI
                </h4>
                <p className="text-sm text-gray-600">
                  ROI (Return on Investment) shows the percentage return you'll earn annually 
                  on your solar investment. A higher ROI means better financial performance. 
                  Solar panels typically last 25-30 years, providing decades of savings after 
                  the payback period.
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ROIVisualization;

