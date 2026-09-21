// Recommended Capacity Calculator - inline calculator for determining ideal system size
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator as CalcIcon, Zap, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn, formatNumber } from '../../../lib/utils';

const RecommendedCapacityCalculator = ({ summary, onCalculate }) => {
  // State for user inputs
  const [avgMonthlyBill, setAvgMonthlyBill] = useState('');
  const [avgRate, setAvgRate] = useState('');
  const [result, setResult] = useState(null);
  const [showCalc, setShowCalc] = useState(true);

  // Handle calculation
  const handleCalculate = () => {
    // Validate inputs
    if (!avgMonthlyBill || !avgRate || !summary) {
      return;
    }

    // Calculate monthly consumption and recommended capacity
    const monthlyConsumption = parseFloat(avgMonthlyBill) / parseFloat(avgRate);
    const avgSunHours = parseFloat(summary.avgSun || 0);

    if (!avgSunHours || avgSunHours <= 0) {
      return;
    }

    // Calculate recommended capacity
    const recommendedCapacity = monthlyConsumption / (avgSunHours * 30);
    
    // Compare with potential capacity
    const potentialCapacity = summary.Rcapacity;
    const percentOfPotential = (recommendedCapacity / potentialCapacity) * 100;
    
    // Determine status
    let status;
    let statusColor;
    let statusIcon;
    
    if (percentOfPotential <= 80) {
      status = 'Right-Sized';
      statusColor = 'success';
      statusIcon = CheckCircle;
    } else if (percentOfPotential <= 100) {
      status = 'Well-Matched';
      statusColor = 'teal-600';
      statusIcon = CheckCircle;
    } else if (percentOfPotential <= 120) {
      status = 'Slightly Under-Sized';
      statusColor = 'warning';
      statusIcon = Info;
    } else {
      status = 'Under-Sized';
      statusColor = 'error';
      statusIcon = AlertTriangle;
    }

    setResult({
      consumption: monthlyConsumption,
      capacity: recommendedCapacity,
      potentialCapacity,
      percentOfPotential,
      status,
      statusColor,
      statusIcon,
    });

    // Callback to parent if provided
    if (onCalculate) {
      onCalculate({
        consumption: monthlyConsumption,
        recommendedCapacity,
      });
    }
  };

  // Reset calculator
  const handleReset = () => {
    setAvgMonthlyBill('');
    setAvgRate('');
    setResult(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="border-2 border-cyan-500/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <CalcIcon className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-cyan-600">
                  Recommended Capacity Calculator
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Find your ideal system size based on energy consumption
                </p>
              </div>
            </div>
            
            {/* Toggle button for mobile */}
            <button
              onClick={() => setShowCalc(!showCalc)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Zap className="w-5 h-5 text-cyan-600" />
            </button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showCalc && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-4">
                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Bill Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average Monthly Electric Bill (₱)
                    </label>
                    <input
                      type="number"
                      value={avgMonthlyBill}
                      onChange={(e) => setAvgMonthlyBill(e.target.value)}
                      placeholder="e.g., 3500"
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border-2",
                        "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
                        "transition-all duration-200",
                        "bg-gray-50 border-gray-200 text-gray-800"
                      )}
                    />
                  </div>

                  {/* Rate Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Electricity Rate (₱/kWh)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={avgRate}
                      onChange={(e) => setAvgRate(e.target.value)}
                      placeholder="e.g., 11.50"
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border-2",
                        "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
                        "transition-all duration-200",
                        "bg-gray-50 border-gray-200 text-gray-800"
                      )}
                    />
                  </div>
                </div>

                {/* Calculate Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCalculate}
                    disabled={!avgMonthlyBill || !avgRate || !summary}
                    className={cn(
                      "flex-1 py-3 rounded-lg font-semibold transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2",
                      !avgMonthlyBill || !avgRate || !summary
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:scale-105 focus:ring-cyan-500"
                    )}
                  >
                    Calculate Recommended Size
                  </button>
                  
                  {result && (
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 rounded-lg font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Results Display */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 pt-4 border-t-2 border-gray-100"
                    >
                      {/* Status Badge */}
                      <div className="flex items-center justify-center">
                        <div
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full",
                            `bg-${result.statusColor}`,
                            result.statusColor === 'success' && "bg-success-light",
                            result.statusColor === 'warning' && "bg-warning-light",
                            result.statusColor === 'error' && "bg-error-light"
                          )}
                        >
                          <result.statusIcon
                            className={cn(
                              "w-5 h-5",
                              result.statusColor === 'success' && "text-success",
                              result.statusColor === 'warning' && "text-warning",
                              result.statusColor === 'error' && "text-error",
                              result.statusColor === 'teal-600' && "text-teal-600"
                            )}
                          />
                          <span
                            className={cn(
                              "font-semibold",
                              result.statusColor === 'success' && "text-success",
                              result.statusColor === 'warning' && "text-warning",
                              result.statusColor === 'error' && "text-error",
                              result.statusColor === 'teal-600' && "text-teal-600"
                            )}
                          >
                            {result.status}
                          </span>
                        </div>
                      </div>

                      {/* Results Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Monthly Consumption */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-600 mb-1">
                            Monthly Energy Consumption
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {formatNumber(result.consumption.toFixed(0))} kWh
                          </p>
                        </div>

                        {/* Recommended Capacity */}
                        <div className="p-4 bg-gradient-to-br from-cyan-50 to-white rounded-lg border border-cyan-100">
                          <p className="text-xs text-gray-600 mb-1">
                            Recommended Solar Capacity
                          </p>
                          <p className="text-2xl font-bold text-cyan-600">
                            {result.capacity.toFixed(2)} kWp
                          </p>
                        </div>
                      </div>

                      {/* Comparison Bar */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Capacity Comparison
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {result.percentOfPotential.toFixed(0)}% of roof potential
                          </span>
                        </div>
                        
                        {/* Visual comparison bar */}
                        <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                          {/* Recommended capacity bar */}
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(result.percentOfPotential, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={cn(
                              "absolute left-0 top-0 h-full",
                              result.statusColor === 'success' && "bg-success",
                              result.statusColor === 'warning' && "bg-warning",
                              result.statusColor === 'error' && "bg-error",
                              result.statusColor === 'teal-600' && "bg-teal-500"
                            )}
                          />
                          
                          {/* Labels */}
                          <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                            <span className="text-white z-10">
                              Recommended: {result.capacity.toFixed(2)} kWp
                            </span>
                            <span className="text-gray-600">
                              Available: {result.potentialCapacity.toFixed(2)} kWp
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation Message */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={cn(
                          "p-4 rounded-lg flex items-start gap-3",
                          result.statusColor === 'success' && "bg-success-light border border-success/20",
                          result.statusColor === 'warning' && "bg-warning-light border border-warning/20",
                          result.statusColor === 'error' && "bg-error-light border border-error/20",
                          result.statusColor === 'teal-600' && "bg-teal-50 border border-teal-200"
                        )}
                      >
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-600" />
                        <div className="text-sm text-gray-700">
                          {result.percentOfPotential <= 80 && (
                            <p>
                              Great news! Your roof has enough space for your recommended system 
                              with room to spare. You could even expand in the future if needed.
                            </p>
                          )}
                          {result.percentOfPotential > 80 && result.percentOfPotential <= 100 && (
                            <p>
                              Perfect match! Your roof size is well-suited for your energy needs. 
                              The system will efficiently utilize your available space.
                            </p>
                          )}
                          {result.percentOfPotential > 100 && result.percentOfPotential <= 120 && (
                            <p>
                              Your roof can accommodate most of your energy needs, but you may need 
                              to supplement with grid power or consider energy efficiency improvements.
                            </p>
                          )}
                          {result.percentOfPotential > 120 && (
                            <p>
                              Your energy consumption exceeds what your roof can support. Consider 
                              energy efficiency upgrades, additional roof space, or a supplemental 
                              grid connection to meet your needs.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default RecommendedCapacityCalculator;

