const Pricing = require('../models/Pricing');

// Get pricing by category
const getPricingByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { region } = req.query;

    const pricing = await Pricing.getPricingByCategory(category, region);

    res.json({
      success: true,
      data: pricing,
      count: pricing.length
    });
  } catch (error) {
    console.error('Error fetching pricing by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing by category',
      error: error.message
    });
  }
};

// Get pricing for AI context
const getPricingForAI = async (req, res) => {
  try {
    const pricing = await Pricing.getPricingForAI();

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching pricing for AI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing for AI',
      error: error.message
    });
  }
};

module.exports = {
  getPricingByCategory,
  getPricingForAI
};
