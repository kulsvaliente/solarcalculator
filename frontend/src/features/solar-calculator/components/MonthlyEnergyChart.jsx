// Monthly Energy Chart - displays energy production with chart/table toggle
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Table as TableIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { cn, formatNumber, formatCurrency } from '../../../lib/utils';

// Custom tooltip for chart hover
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-primary mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold">
              {entry.name.includes('Savings') ? 
                formatCurrency(entry.value) : 
                `${formatNumber(entry.value)} kWh`
              }
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MonthlyEnergyChart = ({ resultRows, loading }) => {
  // State for active view (chart or table)
  const [activeView, setActiveView] = useState('chart');

  // Show loading skeleton
  if (loading || !resultRows || resultRows.length === 0) {
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

  // Filter out the Total/Avg row for the chart (but keep it for the table)
  const chartData = resultRows
    .filter(row => row.month !== 'Total/Avg')
    .map(row => ({
      month: row.month,
      // Convert string with commas back to number for charting
      energy: parseFloat(row.kwh.replace(/,/g, '')),
      savings: parseFloat(row.savings.replace(/,/g, '')),
      sunHours: parseFloat(row.radiation),
    }));

  // Get the Total/Avg row for summary display
  const totalRow = resultRows.find(row => row.month === 'Total/Avg');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-2 border-cyan-500/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-12 bg-cyan-500 rounded-full" />
              <div>
                <CardTitle className="text-2xl text-cyan-600">
                  Monthly Energy Production
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Estimated solar energy generation and savings per month
                </p>
              </div>
            </div>

            {/* Toggle between chart and table view */}
            <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
              <TabsList>
                <TabsTrigger value="chart" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Chart View</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Table View</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeView} onValueChange={setActiveView}>
            {/* Chart View */}
            <TabsContent value="chart" className="mt-0">
              <div className="space-y-6">
                {/* Bar Chart for Energy Production */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Energy Production (kWh)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#546e7a"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#546e7a"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="energy" 
                        fill="#00acc1" 
                        name="Energy (kWh)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart for Savings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Monthly Savings (₱)
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#546e7a"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#546e7a"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="savings" 
                        stroke="#2e7d32" 
                        strokeWidth={3}
                        name="Savings (₱)"
                        dot={{ fill: '#2e7d32', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Table View */}
            <TabsContent value="table" className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-cyan-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-cyan-900">
                        Month
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-cyan-900">
                        AC Energy (kWh)
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-cyan-900">
                        Savings (₱)
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-cyan-900">
                        Sun Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((row, index) => {
                      const isTotal = row.month === 'Total/Avg';
                      return (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            "transition-colors hover:bg-gray-50",
                            isTotal && "bg-cyan-100 font-bold"
                          )}
                        >
                          <td className={cn(
                            "border border-gray-200 px-4 py-3 text-sm",
                            isTotal ? "text-cyan-900 font-bold" : "text-gray-700"
                          )}>
                            {row.month}
                          </td>
                          <td className={cn(
                            "border border-gray-200 px-4 py-3 text-sm text-right",
                            isTotal ? "text-cyan-900 font-bold" : "text-gray-700"
                          )}>
                            {row.kwh}
                          </td>
                          <td className={cn(
                            "border border-gray-200 px-4 py-3 text-sm text-right",
                            isTotal ? "text-success font-bold" : "text-gray-700"
                          )}>
                            {row.savings}
                          </td>
                          <td className={cn(
                            "border border-gray-200 px-4 py-3 text-sm text-right",
                            isTotal ? "text-cyan-900 font-bold" : "text-gray-700"
                          )}>
                            {row.radiation}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>

          {/* Summary footer */}
          {totalRow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg border border-cyan-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Annual Energy</p>
                  <p className="text-xl font-bold text-cyan-600">
                    {totalRow.kwh} kWh
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Annual Savings</p>
                  <p className="text-xl font-bold text-success">
                    ₱{totalRow.savings}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Sun Peak Hours</p>
                  <p className="text-xl font-bold text-teal-600">
                    {totalRow.radiation} hrs/day
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MonthlyEnergyChart;

