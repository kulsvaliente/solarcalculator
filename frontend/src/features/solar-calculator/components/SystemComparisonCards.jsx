// System Comparison Cards - visual comparison of different solar system types
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Battery, Grid, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn, formatCurrency } from '../../../lib/utils';

// Individual system type card
const SystemCard = ({ systemType, data, isPopular }) => {
  // State for expanded view showing pros/cons
  const [isExpanded, setIsExpanded] = useState(false);

  // Icon mapping for each system type
  const icons = {
    'Grid-Tied': Grid,
    'Hybrid': Battery,
    'Off-Grid': Zap,
  };

  // Color schemes for each system type
  const colorSchemes = {
    'Grid-Tied': {
      gradient: 'from-primary to-primary-dark',
      border: 'border-primary/30',
      bg: 'bg-primary-light',
      text: 'text-primary',
      icon: 'text-primary',
    },
    'Hybrid': {
      gradient: 'from-teal-400 to-teal-600',
      border: 'border-teal-400/30',
      bg: 'bg-teal-light',
      text: 'text-teal-dark',
      icon: 'text-teal-600',
    },
    'Off-Grid': {
      gradient: 'from-cyan-400 to-cyan-600',
      border: 'border-cyan-400/30',
      bg: 'bg-cyan-light',
      text: 'text-cyan-dark',
      icon: 'text-cyan-600',
    },
  };

  // Pros and cons for each system type
  const features = {
    'Grid-Tied': {
      pros: [
        'Most affordable and simple setup',
        'Fewer components, easier maintenance',
        'No load restrictions or overloading concerns',
      ],
      cons: [
        'System shuts down during grid outages',
        'No battery backup means no energy independence during emergencies',
      ],
    },
    'Hybrid': {
      pros: [
        'Keeps running even during outages',
        'Flexible usage, ideal for time-of-use rate optimization',
        'Reduces grid dependency through battery-assisted net metering',
      ],
      cons: [
        'More costly than a standard grid-tied setup',
        'Longer return on investment compared to simpler systems',
        'Battery degradation over time adds to long-term maintenance costs',
        'System complexity means higher installation and configuration expenses',
      ],
    },
    'Off-Grid': {
      pros: [
        'Works well in off-grid or remote locations',
        'Handles areas with unstable power supply',
        'Supports clean energy and decarbonization goals',
      ],
      cons: [
        'Highest upfront cost among solar PV options',
        'May need a sizable battery bank',
        'Charging can be unreliable during prolonged cloudy or rainy weather',
        'Load capacity limited by inverter size',
      ],
    },
  };

  const Icon = icons[systemType];
  const colors = colorSchemes[systemType];
  const feature = features[systemType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Card
        className={cn(
          'overflow-hidden border-2 transition-all duration-300 hover:shadow-xl',
          colors.border,
          isExpanded && 'ring-2 ring-offset-2',
          isPopular && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              MOST POPULAR
            </div>
          </div>
        )}

        {/* Header with gradient */}
        <div className={cn('bg-gradient-to-r p-1', colors.gradient)}>
          <div className="bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', colors.bg)}>
                <Icon className={cn('w-6 h-6', colors.icon)} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{systemType}</h3>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Cost range */}
          <div>
            <p className="text-sm text-gray-600 mb-1">System Cost Range</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(data.minCost)}
              </p>
              <p className="text-sm text-gray-500">
                to {formatCurrency(data.maxCost)}
              </p>
            </div>
          </div>

          {/* Payback period */}
          <div className={cn('p-3 rounded-lg', colors.bg)}>
            <p className="text-xs text-gray-600 mb-1">Payback Period</p>
            <p className={cn('text-lg font-bold', colors.text)}>
              {data.paybackMin} – {data.paybackMax}
            </p>
          </div>

          {/* ROI information */}
          {data.roi && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">ROI</p>
                <p className="text-sm font-semibold text-gray-800">
                  {data.roi.roi || 'N/A'}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Net Savings/Year</p>
                <p className="text-sm font-semibold text-gray-800">
                  {data.roi.netSavings ? formatCurrency(data.roi.netSavings) : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg',
              'transition-colors duration-200',
              colors.bg,
              colors.text,
              'hover:opacity-80 font-medium text-sm'
            )}
          >
            {isExpanded ? (
              <>
                <span>Hide Details</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Show Details</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Expanded pros/cons section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t space-y-4">
                  {/* Pros */}
                  <div>
                    <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Advantages
                    </h4>
                    <ul className="space-y-1">
                      {feature.pros.map((pro, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <Check className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <h4 className="text-sm font-semibold text-error mb-2 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {feature.cons.map((con, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <X className="w-3 h-3 text-error mt-0.5 flex-shrink-0" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main component displaying all system type cards
const SystemComparisonCards = ({ summary, loading }) => {
  // Show loading skeleton
  if (loading || !summary) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for each system type
  const systems = [
    {
      type: 'Grid-Tied',
      data: {
        minCost: summary.gridtiedCost_Min,
        maxCost: summary.gridtiedCost_Max,
        paybackMin: summary.OG_Savings_Min,
        paybackMax: summary.OG_Savings_Max,
        roi: summary.roi?.gridTied,
      },
      isPopular: true,
    },
    {
      type: 'Hybrid',
      data: {
        minCost: summary.hybridCost_Min,
        maxCost: summary.hybridCost_Max,
        paybackMin: summary.H_Savings_Min,
        paybackMax: summary.H_Savings_Max,
        roi: summary.roi?.hybrid,
      },
      isPopular: false,
    },
    {
      type: 'Off-Grid',
      data: {
        minCost: summary.offgridCost_Min,
        maxCost: summary.offgridCost_Max,
        paybackMin: summary.GT_Savings_Min,
        paybackMax: summary.GT_Savings_Max,
        roi: summary.roi?.offGrid,
      },
      isPopular: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-2 border-teal-500/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-12 bg-teal-500 rounded-full" />
            <div>
              <CardTitle className="text-2xl text-teal-600">
                System Cost Comparison
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the system type that best fits your needs and budget
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.map((system, index) => (
              <motion.div
                key={system.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SystemCard
                  systemType={system.type}
                  data={system.data}
                  isPopular={system.isPopular}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SystemComparisonCards;