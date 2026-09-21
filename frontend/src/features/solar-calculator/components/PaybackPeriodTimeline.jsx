// Payback Period Timeline - visual representation of ROI timeline with progress bars
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn, parsePaybackPeriod } from '../../../lib/utils';

// Individual timeline bar for a system type
const TimelineBar = ({ systemType, paybackMin, paybackMax, color, delay }) => {
  // Parse payback periods to get numeric values
  const minYears = parseFloat(paybackMin);
  const maxYears = parseFloat(paybackMax);
  const avgYears = (minYears + maxYears) / 2;

  // Calculate progress percentage (assuming 25-year lifespan as 100%)
  const maxLifespan = 25;
  const minProgress = (minYears / maxLifespan) * 100;
  const maxProgress = (maxYears / maxLifespan) * 100;
  const avgProgress = (avgYears / maxLifespan) * 100;

  // Color coding based on payback speed (green for fast, yellow for medium, red for slow)
  const getProgressColor = (years) => {
    if (years <= 5) return 'bg-success';
    if (years <= 10) return 'bg-teal-500';
    if (years <= 15) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="space-y-3"
    >
      {/* System type header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', color)} />
          <h4 className="font-semibold text-gray-800">{systemType}</h4>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-600">
            {parsePaybackPeriod(paybackMin)} – {parsePaybackPeriod(paybackMax)}
          </p>
        </div>
      </div>

      {/* Visual timeline bar */}
      <div className="relative">
        {/* Background bar representing 25-year lifespan */}
        <div className="w-full h-12 bg-gray-100 rounded-lg relative overflow-hidden">
          {/* Min payback marker */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${minProgress}%` }}
            transition={{ delay: delay + 0.3, duration: 1, ease: 'easeOut' }}
            className={cn(
              'absolute left-0 top-0 h-full opacity-30',
              getProgressColor(minYears)
            )}
          />
          
          {/* Max payback marker */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${maxProgress}%` }}
            transition={{ delay: delay + 0.3, duration: 1, ease: 'easeOut' }}
            className={cn(
              'absolute left-0 top-0 h-full opacity-20',
              getProgressColor(maxYears)
            )}
          />

          {/* Average marker with line */}
          <motion.div
            initial={{ left: 0 }}
            animate={{ left: `${avgProgress}%` }}
            transition={{ delay: delay + 0.5, duration: 0.8, ease: 'easeOut' }}
            className="absolute top-0 h-full w-0.5 bg-gray-800"
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Avg: {avgYears.toFixed(1)} yrs
              </div>
            </div>
          </motion.div>

          {/* Content showing years */}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <span className="text-xs font-medium text-gray-600">0 yr</span>
            <span className="text-xs font-medium text-gray-600">25 yrs</span>
          </div>
        </div>

        {/* Milestone markers */}
        <div className="absolute -bottom-6 left-0 w-full flex justify-between px-0">
          {[5, 10, 15, 20].map((year) => {
            const position = (year / maxLifespan) * 100;
            return (
              <div
                key={year}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className="w-px h-2 bg-gray-300" />
                <span className="text-xs text-gray-400 ml-1">{year}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Main Payback Period Timeline component
const PaybackPeriodTimeline = ({ summary, loading }) => {
  // Show loading skeleton
  if (loading || !summary) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // System data for timeline
  const systems = [
    {
      type: 'Grid-Tied System',
      paybackMin: summary.OG_Savings_Min,
      paybackMax: summary.OG_Savings_Max,
      color: 'bg-primary',
      delay: 0,
    },
    {
      type: 'Hybrid System',
      paybackMin: summary.H_Savings_Min,
      paybackMax: summary.H_Savings_Max,
      color: 'bg-teal-500',
      delay: 0.1,
    },
    {
      type: 'Off-Grid System',
      paybackMin: summary.GT_Savings_Min,
      paybackMax: summary.GT_Savings_Max,
      color: 'bg-cyan-500',
      delay: 0.2,
    },
  ];

  // Find the best (shortest) payback period
  const bestSystem = systems.reduce((best, current) => {
    const currentAvg = (parseFloat(current.paybackMin) + parseFloat(current.paybackMax)) / 2;
    const bestAvg = (parseFloat(best.paybackMin) + parseFloat(best.paybackMax)) / 2;
    return currentAvg < bestAvg ? current : best;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="border-2 border-success/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-12 bg-success rounded-full" />
              <div>
                <CardTitle className="text-2xl text-success">
                  Payback Period Timeline
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Time required to recover your initial investment through savings
                </p>
              </div>
            </div>

            {/* Best option badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-success-light rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
              <div>
                <p className="text-xs text-gray-600">Fastest Payback</p>
                <p className="text-sm font-bold text-success">{bestSystem.type}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Timeline bars for each system */}
          {systems.map((system) => (
            <TimelineBar
              key={system.type}
              systemType={system.type}
              paybackMin={system.paybackMin}
              paybackMax={system.paybackMax}
              color={system.color}
              delay={system.delay}
            />
          ))}

          {/* Info section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 p-4 bg-gradient-to-r from-success-light to-teal-50 rounded-lg border border-success/20"
          >
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-success mb-1">
                  Understanding Payback Period
                </h4>
                <p className="text-sm text-gray-600">
                  The payback period shows how long it takes for your solar system's savings 
                  to equal its initial cost. After this point, you'll enjoy pure savings for 
                  the remaining 15-20+ years of the system's lifespan. Shorter payback periods 
                  mean faster returns on your investment.
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PaybackPeriodTimeline;

