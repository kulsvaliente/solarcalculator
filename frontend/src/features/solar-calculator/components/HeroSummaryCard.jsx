// Hero Summary Card - displays key solar system metrics with large animated numbers
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Zap, DollarSign, Leaf } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { cn, formatNumber } from '../../../lib/utils';

// Counter animation component for number count-up effect
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  // State to hold the current displayed number during animation
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Early exit if value is not set
    if (!value) return;

    // Configuration for count-up animation
    const duration = 1500; // Total animation duration in milliseconds
    const steps = 60; // Number of steps for smooth animation
    const increment = value / steps; // Value to add per step
    const stepDuration = duration / steps; // Time between each step
    let currentStep = 0;

    // Interval to update the displayed value incrementally
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        // Animation complete - set to final value
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        // Update to intermediate value
        setDisplayValue(increment * currentStep);
      }
    }, stepDuration);

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, [value]);

  // Format the displayed value with specified decimals
  const formatted = displayValue.toFixed(decimals);
  
  return (
    <span>
      {prefix}{formatNumber(formatted)}{suffix}
    </span>
  );
};

// Main Hero Summary Card component
const HeroSummaryCard = ({ summary, loading, hideHeader = false, hideAnnualSavings = false }) => {
  // Show loading skeleton if data is not ready
  if (loading || !summary) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="h-48 animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Use user-selected panel size when available
  const panelWattage = summary.panelWattage || summary.panelSizeWattage || 500;

  // Configuration for each metric card
  const metrics = [
    {
      icon: Sun,
      label: 'System Capacity',
      value: summary.Rcapacity,
      suffix: ' kWp',
      decimals: 2,
      color: 'from-primary to-cyan-500',
      iconColor: 'text-primary',
    },
    {
      icon: Zap,
      label: 'Annual Energy Production',
      value: parseFloat(summary.eeannual),
      suffix: ' kWh',
      decimals: 0,
      color: 'from-cyan-400 to-teal-500',
      iconColor: 'text-cyan-600',
    },
    {
      icon: DollarSign,
      label: 'Annual Savings',
      value: parseFloat(summary.totalSavings),
      prefix: '₱',
      decimals: 0,
      color: 'from-teal-400 to-success',
      iconColor: 'text-teal-600',
    },
    {
      icon: Leaf,
      label: 'Annual Carbon Dioxide Equivalent Avoided',
      value: parseFloat(summary.eeannual) * 0.0007582,
      suffix: ' tCO2e',
      decimals: 2,
      color: 'from-success to-success-light',
      iconColor: 'text-success',
    },
  ].filter((metric) => !(hideAnnualSavings && metric.label === 'Annual Savings'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden shadow-xl">
        {/* Gradient background header */}
        {!hideHeader && (
          <div className="bg-gradient-to-r from-primary via-cyan-500 to-teal-500 p-1">
            <div className="bg-white p-4 sm:p-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1976d2' }}>
                Your Solar System Summary
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Based on your location and roof specifications
              </p>
            </div>
          </div>
        )}

        <CardContent className="p-4 sm:p-6">
          {/* Grid of metric cards */}
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",
            hideAnnualSavings ? "lg:grid-cols-3" : "lg:grid-cols-4"
          )}>
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg p-4 sm:p-6 bg-gradient-to-br",
                      metric.color,
                      "shadow-md hover:shadow-lg transition-shadow duration-300"
                    )}
                  >
                    {/* Background icon for decoration */}
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-10">
                      <Icon className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                    
                    {/* Metric content */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-1 sm:gap-2 mb-2">
                        <Icon className={cn("w-4 h-4 sm:w-6 sm:h-6", metric.iconColor)} />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                          {metric.label}
                        </span>
                      </div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
                        <AnimatedNumber
                          value={metric.value}
                          prefix={metric.prefix}
                          suffix={metric.suffix}
                          decimals={metric.decimals}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Additional info section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-success-light rounded-lg border border-success/20"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-success">
                  Daily Energy Production
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-success break-words">
                  {formatNumber(summary.eeave)} kWh/day
                </p>
              </div>
              <div className="flex-1 sm:text-center">
                <p className="text-xs sm:text-sm font-medium text-success">
                  Solar Panels ({panelWattage} Wp)
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-success break-words">
                  {formatNumber(summary.panelCount)} panels
                </p>
              </div>
              <div className="text-left sm:text-right flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  💰 Pricing Estimates
                </p>
                <p className="text-xs sm:text-sm font-semibold text-success break-words">
                  {summary.pricingSource}
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HeroSummaryCard;

