/**
 * Result Narrative Generator
 * Converts calculation results into natural language explanations
 * Provides AI-powered insights and personalized recommendations
 */

/**
 * Generate complete narrative for calculation results
 * Provides summary, financial analysis, recommendations, and next steps
 * 
 * @param {Object} parameters - Input parameters used for calculation
 * @param {Object} results - Calculation results
 * @param {Object} userContext - User's conversation history and preferences
 * @returns {Object} Complete narrative with all sections
 */
export function generateResultNarrative(parameters, results, userContext = {}) {
  const narrative = {
    summary: generateSummary(parameters, results),
    systemOverview: generateSystemOverview(results),
    financialAnalysis: generateFinancialNarrative(results, parameters),
    recommendations: generateRecommendations(parameters, results, userContext),
    nextSteps: generateNextSteps(results, userContext),
    warnings: generateWarnings(parameters, results),
    insights: generateInsights(parameters, results)
  };
  
  return narrative;
}

/**
 * Generate executive summary of the solar system
 * Provides high-level overview in conversational tone
 */
function generateSummary(parameters, results) {
  const location = parameters.location?.city || parameters.location?.province || 'your location';
  const area = parameters.area || parameters.dimensions?.area;
  const capacity = results.systemCapacity?.toFixed(1) || results.capacity?.toFixed(1);
  const production = results.annualProduction?.toLocaleString() || '—';
  const savings = results.annualSavings?.toLocaleString() || '—';
  const payback = results.paybackPeriod?.gridTied || results.paybackPeriod || 'N/A';

  const basedOnSentence =
    parameters.calculationMode === 'consumption' && parameters.monthlyConsumptionKwh
      ? `Based on your average monthly consumption of ${parameters.monthlyConsumptionKwh} kWh in ${location}, we recommend a ${capacity} kW solar system.`
      : `Based on your ${area} sqm roof in ${location}, we recommend a ${capacity} kW solar system.`;

  return `${basedOnSentence}

This system will produce approximately ${production} kWh per year, saving you about ₱${savings} annually on electricity bills.

With grid-tied installation, you can expect to recover your investment in approximately ${payback} years. Over 25 years, this system will save you approximately ₱${(results.annualSavings * 25).toLocaleString()}.`;
}

/**
 * Generate detailed system overview
 * Technical specifications in accessible language
 */
function generateSystemOverview(results) {
  const panels = results.panelCount || Math.floor(results.systemCapacity / 0.6);
  const capacity = results.systemCapacity?.toFixed(1) || results.capacity?.toFixed(1);
  const dailyProduction = ((results.annualProduction || 0) / 365).toFixed(1);
  const monthlyProduction = ((results.annualProduction || 0) / 12).toFixed(0);
  
  return {
    title: 'System Overview',
    content: `Your ${capacity} kW solar system will consist of approximately ${panels} high-efficiency solar panels.

**Daily Production:** On average, your system will generate ${dailyProduction} kWh per day, enough to power typical household appliances.

**Monthly Production:** You can expect about ${monthlyProduction} kWh monthly, which varies by season due to sun peak hours.

**System Components:**
- Solar Panels: ${panels} units (grid-connected)
- Inverter: Converts DC to AC power
- Mounting System: Roof-mounted with optimal tilt
- Monitoring: Real-time production tracking`,
    
    keyMetrics: [
      { label: 'System Size', value: `${capacity} kW`, icon: '⚡' },
      { label: 'Panel Count', value: `${panels} panels`, icon: '☀️' },
      { label: 'Daily Output', value: `${dailyProduction} kWh`, icon: '📊' },
      { label: 'Monthly Output', value: `${monthlyProduction} kWh`, icon: '📈' }
    ]
  };
}

/**
 * Generate financial analysis narrative
 * Investment overview, ROI, payback period in plain English
 */
function generateFinancialNarrative(results, parameters) {
  const narrative = [];
  
  // Investment Overview
  const minCost = results.systemCosts?.gridTied?.min || results.minCost;
  const maxCost = results.systemCosts?.gridTied?.max || results.maxCost;
  const typicalCost = results.systemCosts?.gridTied?.typical || ((minCost + maxCost) / 2);
  const annualSavings = results.annualSavings || 0;
  const payback = results.paybackPeriod?.gridTied || results.paybackPeriod;
  const roi = results.roi?.gridTied || results.roi;
  
  narrative.push({
    type: 'investment',
    title: '💰 Investment Overview',
    content: `Your solar system investment of ₱${minCost?.toLocaleString()} - ₱${maxCost?.toLocaleString()} (typical: ₱${typicalCost?.toLocaleString()}) will generate returns through:

**Electricity Savings:** ₱${annualSavings.toLocaleString()} per year
**Payback Period:** ${payback} years - when your savings equal your investment
**25-Year Savings:** ₱${(annualSavings * 25).toLocaleString()} total
**ROI:** ${roi}% over system lifetime (25 years)`,
    
    highlights: [
      `Break even in ${payback} years`,
      `Save ₱${(annualSavings * 25).toLocaleString()} over 25 years`,
      `${roi}% return on investment`
    ]
  });
  
  // Budget Fit Analysis
  if (parameters.budget || parameters.financial?.budget) {
    const budget = parameters.budget || parameters.financial.budget;
    const budgetFit = analyzeBudgetFit(budget, results);
    narrative.push(budgetFit);
  }
  
  // Monthly Savings Breakdown
  const monthlySavings = (annualSavings / 12).toFixed(0);
  narrative.push({
    type: 'savings',
    title: '📉 Monthly Savings Breakdown',
    content: `On average, you'll save ₱${monthlySavings.toLocaleString()} per month on electricity:

**Before Solar:** ₱${(parameters.monthlyBill || parameters.financial?.monthlyBill || 3500).toLocaleString()}/month
**After Solar:** ₱${Math.max(0, (parameters.monthlyBill || 3500) - monthlySavings).toLocaleString()}/month (estimated)
**Savings:** ₱${monthlySavings.toLocaleString()}/month

Your actual savings depend on your electricity consumption and current rate.`
  });
  
  // Financing Options
  if (typicalCost > (parameters.budget || 0) * 0.8) {
    narrative.push({
      type: 'financing',
      title: '🏦 Financing Options',
      content: `Consider these financing options to make solar more affordable:

**Bank Loans:** Some Philippine banks offer green energy loans at 5-8% interest
**Solar Company Financing:** Many installers offer 0% installment plans (12-24 months)
**Cooperative Loans:** Credit cooperatives may have special solar programs
**DOE Programs:** Check for government-backed financing options

With financing, you could start saving immediately while paying off the system.`
    });
  }
  
  return narrative;
}

/**
 * Analyze budget fit and provide guidance
 */
function analyzeBudgetFit(budget, results) {
  const typicalCost = results.systemCosts?.gridTied?.typical || 
                      ((results.systemCosts?.gridTied?.min + results.systemCosts?.gridTied?.max) / 2);
  
  const difference = budget - typicalCost;
  const percentDiff = (difference / typicalCost) * 100;
  
  if (percentDiff < -20) {
    return {
      type: 'budget_warning',
      title: '⚠️ Budget Consideration',
      content: `Your budget of ₱${budget.toLocaleString()} may be insufficient for the recommended system (₱${typicalCost.toLocaleString()}).

**Options:**
1. **Reduce System Size:** Install fewer panels to match budget
2. **Phased Installation:** Start small, expand later
3. **Financing:** Spread cost over 12-24 months
4. **Save More:** Wait until you have additional funds

A smaller system will still provide savings, just at a reduced scale.`,
      severity: 'warning',
      recommendation: 'adjust_size'
    };
  } else if (percentDiff < 0) {
    return {
      type: 'budget_tight',
      title: '💡 Budget Status',
      content: `Your budget of ₱${budget.toLocaleString()} is close to the estimated cost of ₱${typicalCost.toLocaleString()}.

You may need to adjust specifications slightly or consider:
- Choosing standard vs. premium components
- Simpler mounting systems
- Negotiating with installers

The system is achievable with minor adjustments.`,
      severity: 'info',
      recommendation: 'fine_tune'
    };
  } else if (percentDiff > 50) {
    return {
      type: 'budget_surplus',
      title: '✨ Budget Opportunity',
      content: `Great news! Your budget of ₱${budget.toLocaleString()} exceeds the system cost of ₱${typicalCost.toLocaleString()}.

**Consider upgrading:**
- **Battery Storage:** Add backup power (₱80k-150k)
- **Larger System:** Maximize roof space
- **Premium Panels:** Higher efficiency, better warranty
- **Smart Monitoring:** Advanced tracking systems

These upgrades enhance reliability and future-proof your investment.`,
      severity: 'success',
      recommendation: 'upgrade_options'
    };
  }
  
  return {
    type: 'budget_good',
    title: '✓ Budget Status',
    content: `Your budget of ₱${budget.toLocaleString()} aligns well with the estimated cost of ₱${typicalCost.toLocaleString()}.

You're in a good position to proceed with installation. Work with installers to get detailed quotes.`,
    severity: 'success',
    recommendation: 'proceed'
  };
}

/**
 * Generate personalized recommendations
 * Based on parameters, results, and user context
 */
function generateRecommendations(parameters, results, userContext) {
  const recommendations = [];
  
  // System Type Recommendation
  recommendations.push(recommendSystemType(parameters, results));
  
  // Optimization Recommendations
  const optimizations = findOptimizations(parameters, results);
  if (optimizations.length > 0) {
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      title: '🎯 Potential Improvements',
      content: `We found ${optimizations.length} way(s) to improve your setup:`,
      items: optimizations
    });
  }
  
  // Additional Features
  recommendations.push({
    type: 'features',
    priority: 'low',
    title: '🔧 Consider Adding',
    items: [
      {
        feature: 'Battery Storage',
        benefit: 'Backup power during outages',
        cost: '+₱80,000 - ₱150,000',
        worthIt: evaluateBatteryWorth(parameters, userContext),
        reason: 'Essential for areas with frequent blackouts'
      },
      {
        feature: 'Smart Monitoring System',
        benefit: 'Track production via smartphone app',
        cost: '+₱15,000 - ₱25,000',
        worthIt: true,
        reason: 'Helps detect issues early and maximize production'
      },
      {
        feature: 'Net Metering',
        benefit: 'Sell excess power back to grid',
        cost: 'Free (requires application to utility)',
        worthIt: results.annualProduction > ((parameters.monthlyBill || 3500) / (parameters.rate || 10) * 12),
        reason: results.annualProduction > ((parameters.monthlyBill || 3500) / (parameters.rate || 10) * 12) 
          ? 'Your system produces more than you consume - ideal for net metering'
          : 'Your production matches consumption - net metering optional'
      }
    ]
  });
  
  return recommendations;
}

/**
 * Recommend optimal system type
 */
function recommendSystemType(parameters, results) {
  const budget = parameters.budget || parameters.financial?.budget || 200000;
  const hasBlackouts = parameters.location?.hasBlackouts || false;
  
  let recommendation = {};
  
  if (budget < 150000) {
    recommendation = {
      type: 'grid-tied',
      title: '⚡ Recommended: Grid-Tied System',
      reason: 'Best value for your budget',
      description: 'Simple, cost-effective, and reliable. Perfect for urban areas with stable grid.',
      pros: [
        'Lowest upfront cost',
        'Fast payback (5-7 years)',
        'Simple installation and maintenance',
        'Excellent ROI'
      ],
      cons: [
        'No backup during outages',
        'Dependent on utility grid'
      ]
    };
  } else if (budget < 400000 && !hasBlackouts) {
    recommendation = {
      type: 'grid-tied-premium',
      title: '✨ Recommended: Premium Grid-Tied',
      reason: 'Better panels and inverters for long-term value',
      description: 'High-efficiency components with extended warranties.',
      pros: [
        'Higher energy production',
        'Better warranties (15-25 years)',
        'More reliable components',
        'Still affordable'
      ],
      cons: [
        'Slightly higher cost',
        'No backup power'
      ]
    };
  } else {
    recommendation = {
      type: 'hybrid',
      title: '🔋 Recommended: Hybrid System with Battery',
      reason: 'Budget allows for backup power and grid independence',
      description: 'Best of both worlds: grid connection plus battery backup.',
      pros: [
        'Backup power during outages',
        'Partial grid independence',
        'Store excess energy',
        'Future-proof investment'
      ],
      cons: [
        'Higher upfront cost',
        'Battery replacement (10-15 years)',
        'More complex maintenance'
      ]
    };
  }
  
  return {
    type: 'system_type',
    priority: 'high',
    ...recommendation
  };
}

/**
 * Find optimization opportunities
 */
function findOptimizations(parameters, results) {
  const optimizations = [];
  
  // Tilt optimization
  const lat = parameters.latitude || parameters.location?.lat;
  if (lat && parameters.tilt !== undefined) {
    const optimalTilt = calculateOptimalTilt(lat);
    const currentTilt = parameters.tilt;
    const difference = Math.abs(optimalTilt - currentTilt);
    
    if (difference > 5) {
      const impact = estimateEfficiencyImpact(difference);
      optimizations.push({
        parameter: 'Tilt Angle',
        current: `${currentTilt}°`,
        suggested: `${optimalTilt}°`,
        impact: `+${impact}% energy production`,
        message: `Adjusting tilt from ${currentTilt}° to ${optimalTilt}° could increase annual production by ${impact}%`,
        priority: difference > 10 ? 'high' : 'medium'
      });
    }
  }
  
  // Azimuth optimization
  if (parameters.azimuth !== undefined && parameters.azimuth !== 180) {
    const deviation = Math.abs(parameters.azimuth - 180);
    const impact = estimateAzimuthImpact(deviation);
    
    if (impact > 5) {
      optimizations.push({
        parameter: 'Azimuth (Orientation)',
        current: `${parameters.azimuth}° (${getDirection(parameters.azimuth)})`,
        suggested: '180° (South)',
        impact: `+${impact}% energy production`,
        message: `South-facing panels (180°) would increase production by ${impact}%`,
        priority: impact > 10 ? 'high' : 'medium'
      });
    }
  }
  
  // Area utilization
  const area = parameters.area || parameters.dimensions?.area;
  if (area && area > 50) {
    const utilizationRate = (results.systemCapacity * 1.67) / area; // Approx sqm per kW
    if (utilizationRate < 0.5) {
      optimizations.push({
        parameter: 'Roof Utilization',
        current: `${(utilizationRate * 100).toFixed(0)}%`,
        suggested: '60-70%',
        impact: 'More capacity potential',
        message: `You're only using ${(utilizationRate * 100).toFixed(0)}% of your roof. Consider adding more panels to maximize savings.`,
        priority: 'low'
      });
    }
  }
  
  return optimizations;
}

/**
 * Calculate optimal tilt angle based on latitude
 */
function calculateOptimalTilt(latitude) {
  // For Philippines (8°N to 18°N): optimal tilt ≈ latitude
  // Simplified: use 15° as optimal for most of Philippines
  return Math.round(Math.abs(latitude));
}

/**
 * Estimate efficiency impact of tilt deviation
 */
function estimateEfficiencyImpact(deviation) {
  // Rough estimate: 0.5% loss per degree deviation up to 15°
  // Then 1% loss per degree beyond 15°
  if (deviation <= 15) {
    return Math.round(deviation * 0.5);
  }
  return Math.round(15 * 0.5 + (deviation - 15) * 1);
}

/**
 * Estimate impact of azimuth deviation from south
 */
function estimateAzimuthImpact(deviation) {
  // Cosine loss: roughly 1% per 10° up to 45°
  if (deviation <= 45) {
    return Math.round(deviation / 10);
  }
  // Steeper loss beyond 45°
  return Math.round(45 / 10 + (deviation - 45) / 5);
}

/**
 * Get compass direction from azimuth
 */
function getDirection(azimuth) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

/**
 * Evaluate if battery storage is worth it
 */
function evaluateBatteryWorth(parameters, userContext) {
  // Worth it if: frequent blackouts, high consumption, or expressed need
  const location = parameters.location?.province || '';
  const blackoutProneAreas = ['Mindanao', 'Visayas', 'Rural'];
  
  const inBlackoutArea = blackoutProneAreas.some(area => 
    location.toLowerCase().includes(area.toLowerCase())
  );
  
  const mentionedBlackouts = userContext.messages?.some(m => 
    m.text?.toLowerCase().includes('blackout') || 
    m.text?.toLowerCase().includes('outage')
  );
  
  return inBlackoutArea || mentionedBlackouts || false;
}

/**
 * Generate next steps for the user
 */
function generateNextSteps(results, userContext) {
  return {
    title: '📋 Next Steps',
    steps: [
      {
        step: 1,
        title: 'Get Professional Quotes',
        description: 'Contact 3-5 solar installers for detailed proposals',
        tips: [
          'Compare warranties and service agreements',
          'Ask about panel brands and inverter types',
          'Request references from past installations'
        ]
      },
      {
        step: 2,
        title: 'Site Inspection',
        description: 'Professional assessment of your roof and electrical system',
        tips: [
          'Ensure roof can support panel weight',
          'Check electrical panel capacity',
          'Identify shading issues'
        ]
      },
      {
        step: 3,
        title: 'Financing & Permits',
        description: 'Secure funding and obtain necessary permits',
        tips: [
          'Apply for bank loans if needed',
          'Submit net metering application to utility',
          'Get building/electrical permits'
        ]
      },
      {
        step: 4,
        title: 'Installation',
        description: 'Professional installation (typically 1-3 days)',
        tips: [
          'Schedule during dry season',
          'Ensure proper safety measures',
          'Document the installation'
        ]
      },
      {
        step: 5,
        title: 'Activation & Monitoring',
        description: 'System activation and ongoing monitoring',
        tips: [
          'Test all components',
          'Set up monitoring app',
          'Schedule regular maintenance'
        ]
      }
    ]
  };
}

/**
 * Generate warnings if any issues detected
 */
function generateWarnings(parameters, results) {
  const warnings = [];
  
  // Small area warning
  const area = parameters.area || parameters.dimensions?.area;
  if (area < 20) {
    warnings.push({
      type: 'warning',
      severity: 'medium',
      title: 'Limited Roof Space',
      message: `Your ${area} sqm roof area is on the smaller side. The system will be limited in capacity.`,
      recommendation: 'Consider maximizing efficiency with premium panels if budget allows.'
    });
  }
  
  // Suboptimal tilt warning
  const tilt = parameters.tilt;
  if (tilt !== undefined && (tilt < 5 || tilt > 30)) {
    warnings.push({
      type: 'warning',
      severity: 'medium',
      title: 'Suboptimal Tilt Angle',
      message: `Tilt of ${tilt}° is outside the optimal range (10-20°) for Philippines.`,
      recommendation: 'Adjust mounting angle if possible for better energy production.'
    });
  }
  
  // Budget constraint warning
  if (parameters.budget && results.systemCosts) {
    const typicalCost = results.systemCosts.gridTied?.typical;
    if (parameters.budget < typicalCost * 0.8) {
      warnings.push({
        type: 'warning',
        severity: 'high',
        title: 'Budget Constraint',
        message: `Budget may be insufficient for recommended system size.`,
        recommendation: 'Consider financing options or phased installation.'
      });
    }
  }
  
  return warnings;
}

/**
 * Generate insights about the solar system
 */
function generateInsights(parameters, results) {
  const insights = [];
  
  // Environmental impact
  const co2Offset = results.co2Offset || (results.annualProduction * 0.7); // kg CO2
  const treesEquivalent = Math.round(co2Offset / 20); // 1 tree absorbs ~20kg CO2/year
  
  insights.push({
    type: 'environmental',
    title: '🌱 Environmental Impact',
    content: `Your solar system will offset approximately ${co2Offset.toLocaleString()} kg of CO₂ annually.

That's equivalent to:
- Planting ${treesEquivalent} trees per year
- Taking ${Math.round(co2Offset / 4000)} cars off the road
- Reducing your carbon footprint by ${Math.round(co2Offset / 1000)} tons over 25 years`,
    icon: '🌍'
  });
  
  // Energy independence
  const consumption = (parameters.monthlyBill || 3500) / (parameters.rate || 10) * 12;
  const independence = Math.min(100, (results.annualProduction / consumption * 100)).toFixed(0);
  
  insights.push({
    type: 'independence',
    title: '⚡ Energy Independence',
    content: `Your system will cover approximately ${independence}% of your annual electricity needs.

${independence >= 100 ? 
  'Excellent! You may even have excess energy to sell back to the grid via net metering.' :
  independence >= 70 ?
  'Great coverage! You\'ll significantly reduce your dependence on utility power.' :
  'Good start! Consider expanding your system in the future for more independence.'
}`,
    icon: '🔋'
  });
  
  // Long-term value
  const totalSavings25Years = results.annualSavings * 25;
  const investmentMultiple = (totalSavings25Years / (results.systemCosts?.gridTied?.typical || 200000)).toFixed(1);
  
  insights.push({
    type: 'value',
    title: '💎 Long-term Value',
    content: `Over 25 years, your ₱${(results.systemCosts?.gridTied?.typical || 200000).toLocaleString()} investment will return ₱${totalSavings25Years.toLocaleString()} in savings.

That's ${investmentMultiple}x your initial investment! Solar panels typically last 25-30 years, providing decades of free electricity after payback.`,
    icon: '📈'
  });
  
  return insights;
}

// Export all functions
export {
  generateSummary,
  generateSystemOverview,
  generateFinancialNarrative,
  generateRecommendations,
  generateNextSteps,
  generateWarnings,
  generateInsights,
  analyzeBudgetFit,
  findOptimizations
};

