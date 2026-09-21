const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['solar_panels', 'inverters', 'installation', 'mounting', 'electrical', 'battery', 'permits', 'total_system']
  },
  subcategory: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  unit: {
    type: String,
    required: true,
    enum: ['per_kw', 'per_unit', 'per_sqm', 'per_system', 'fixed']
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  currency: {
    type: String,
    default: 'PHP',
    enum: ['PHP', 'USD', 'EUR']
  },
  region: {
    type: String,
    required: true,
    enum: ['provinces', 'urban', 'all']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String
  }],
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      default: 'admin'
    },
    notes: {
      type: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
pricingSchema.index({ category: 1, subcategory: 1, region: 1, isActive: 1 });
pricingSchema.index({ name: 1 });
pricingSchema.index({ priority: -1 });

// Virtual for formatted price range
pricingSchema.virtual('formattedPriceRange').get(function() {
  const { min, max } = this.priceRange;
  const currency = this.currency || '₱';
  return `${currency}${min.toLocaleString()}–${currency}${max.toLocaleString()}`;
});

// Virtual for average price
pricingSchema.virtual('averagePrice').get(function() {
  return Math.round((this.priceRange.min + this.priceRange.max) / 2);
});

// Static method to get pricing by category and region
pricingSchema.statics.getPricingByCategory = async function(category, region = 'all') {
  return this.find({
    category,
    region: { $in: [region, 'all'] },
    isActive: true
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get all active pricing
pricingSchema.statics.getActivePricing = async function() {
  return this.find({ isActive: true }).sort({ category: 1, priority: -1 });
};

// Static method to get pricing for AI context
pricingSchema.statics.getPricingForAI = async function() {
  const pricing = await this.find({ isActive: true }).sort({ category: 1, priority: -1 }).lean();
  
  // Group by category for better AI context
  const groupedPricing = pricing.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    
    // Format price range manually since we're using lean()
    const { min, max } = item.priceRange;
    const currency = item.currency || '₱';
    const formattedPriceRange = `${currency}${min.toLocaleString()}–${currency}${max.toLocaleString()}`;
    
    acc[item.category].push({
      name: item.name,
      subcategory: item.subcategory,
      priceRange: formattedPriceRange,
      unit: item.unit,
      region: item.region,
      description: item.description
    });
    return acc;
  }, {});

  return groupedPricing;
};

// Instance method to update pricing
pricingSchema.methods.updatePricing = async function(updateData, userId) {
  Object.assign(this, updateData);
  this.metadata.lastUpdated = new Date();
  this.metadata.updatedBy = userId;
  return this.save();
};

// Pre-save middleware to validate price range
pricingSchema.pre('save', function(next) {
  if (this.priceRange.min > this.priceRange.max) {
    return next(new Error('Minimum price cannot be greater than maximum price'));
  }
  next();
});

module.exports = mongoose.model('Pricing', pricingSchema);
