const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  aiAgent: {
    enabled: {
      type: Boolean,
      default: true
    },
    chatbotVisible: {
      type: Boolean,
      default: true
    },
    reason: {
      type: String,
      default: 'Available'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  pricing: {
    enabled: {
      type: Boolean,
      default: true
    },
    autoUpdate: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    currency: {
      type: String,
      default: 'PHP',
      enum: ['PHP', 'USD', 'EUR']
    },
    region: {
      type: String,
      default: 'all',
      enum: ['all', 'provinces', 'urban']
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({});
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
