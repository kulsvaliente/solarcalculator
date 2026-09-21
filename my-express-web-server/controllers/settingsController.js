const Settings = require('../models/Settings');

// Get current settings (public AI agent status)
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    res.json({
      success: true,
      data: {
        aiAgent: {
          available: settings.aiAgent.enabled,
          chatbotVisible: settings.aiAgent.chatbotVisible,
          reason: settings.aiAgent.reason,
          lastUpdated: settings.aiAgent.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

module.exports = {
  getSettings
};
