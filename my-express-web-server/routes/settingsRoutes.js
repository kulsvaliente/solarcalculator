const express = require('express');
const router = express.Router();
const { getSettings } = require('../controllers/settingsController');

// Public route for AI agent status (no authentication required)
router.get('/', getSettings);

module.exports = router;
