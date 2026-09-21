const express = require('express');
const router = express.Router();
const {
  getPricingByCategory,
  getPricingForAI
} = require('../controllers/pricingController');

// Public routes (no authentication required)
router.get('/ai', getPricingForAI); // For AI chatbot context
router.get('/category/:category', getPricingByCategory); // Used by the calculator's cost estimator

module.exports = router;
