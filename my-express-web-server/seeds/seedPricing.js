const Pricing = require('../models/Pricing');

const seedPricing = async () => {
  try {
    console.log('Starting pricing seed...');

    // No user accounts in the standalone app; leave attribution unset.
    const adminId = null;

    // Clear existing pricing data
    await Pricing.deleteMany({});

    // Sample pricing data
    const pricingData = [
      // Solar Panels
      {
        category: 'solar_panels',
        subcategory: 'monocrystalline',
        name: '700W Monocrystalline Panels',
        description: 'High-efficiency monocrystalline solar panels',
        unit: 'per_unit',
        priceRange: { min: 4500, max: 5300 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 10,
        tags: ['premium', 'high-efficiency'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'solar_panels',
        subcategory: 'monocrystalline',
        name: '550W Monocrystalline Panels',
        description: 'Standard monocrystalline solar panels',
        unit: 'per_unit',
        priceRange: { min: 3400, max: 4300 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 9,
        tags: ['standard', 'popular'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'solar_panels',
        subcategory: 'monocrystalline',
        name: '450W Monocrystalline Panels',
        description: 'Budget-friendly monocrystalline solar panels',
        unit: 'per_unit',
        priceRange: { min: 2800, max: 3500 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 8,
        tags: ['budget', 'entry-level'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },

      // Inverters
      {
        category: 'inverters',
        subcategory: 'grid_tied',
        name: 'Grid-Tied Inverters',
        description: 'Standard grid-tied inverters',
        unit: 'per_kw',
        priceRange: { min: 3800, max: 4800 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 10,
        tags: ['grid-tied', 'standard'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'inverters',
        subcategory: 'hybrid',
        name: 'Hybrid On-Grid Inverters',
        description: 'Hybrid inverters with battery backup capability',
        unit: 'per_kw',
        priceRange: { min: 6500, max: 8500 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 9,
        tags: ['hybrid', 'battery-ready'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },

      // Installation
      {
        category: 'installation',
        subcategory: 'labor',
        name: 'Installation Labor - Provinces',
        description: 'Professional installation labor in provincial areas',
        unit: 'per_kw',
        priceRange: { min: 25000, max: 35000 },
        currency: 'PHP',
        region: 'provinces',
        isActive: true,
        priority: 10,
        tags: ['labor', 'provinces'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'installation',
        subcategory: 'labor',
        name: 'Installation Labor - Urban',
        description: 'Professional installation labor in urban areas',
        unit: 'per_kw',
        priceRange: { min: 45000, max: 55000 },
        currency: 'PHP',
        region: 'urban',
        isActive: true,
        priority: 10,
        tags: ['labor', 'urban'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },

      // Mounting
      {
        category: 'mounting',
        subcategory: 'roof_mount',
        name: 'Roof Mounting System',
        description: 'Complete roof mounting system including rails and clamps',
        unit: 'per_kw',
        priceRange: { min: 3000, max: 5000 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 10,
        tags: ['roof', 'mounting'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },

      // Electrical
      {
        category: 'electrical',
        subcategory: 'components',
        name: 'Electrical Components',
        description: 'Wiring, breakers, and electrical components',
        unit: 'per_kw',
        priceRange: { min: 2000, max: 4000 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 10,
        tags: ['electrical', 'wiring'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },

      // Battery Storage
      {
        category: 'battery',
        subcategory: 'lithium',
        name: '100Ah Lithium Battery',
        description: '100Ah lithium-ion battery for energy storage',
        unit: 'per_unit',
        priceRange: { min: 32000, max: 42000 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 10,
        tags: ['lithium', '100ah'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'battery',
        subcategory: 'lithium',
        name: '200Ah Lithium Battery',
        description: '200Ah lithium-ion battery for energy storage',
        unit: 'per_unit',
        priceRange: { min: 65000, max: 80000 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 9,
        tags: ['lithium', '200ah'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'battery',
        subcategory: 'lithium',
        name: '300Ah Lithium Battery',
        description: '300Ah lithium-ion battery for energy storage',
        unit: 'per_unit',
        priceRange: { min: 100000, max: 125000 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 8,
        tags: ['lithium', '300ah'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },

      // Permits
      {
        category: 'permits',
        subcategory: 'documentation',
        name: 'Permits & Documentation',
        description: 'All necessary permits and documentation',
        unit: 'per_system',
        priceRange: { min: 10000, max: 20000 },
        currency: 'PHP',
        region: 'all',
        isActive: true,
        priority: 10,
        tags: ['permits', 'documentation'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },

      // Total System Costs
      {
        category: 'total_system',
        subcategory: 'grid_tied',
        name: 'Grid-Tied System - Provinces',
        description: 'Complete grid-tied solar system in provincial areas',
        unit: 'per_kw',
        priceRange: { min: 50000, max: 65000 },
        currency: 'PHP',
        region: 'provinces',
        isActive: true,
        priority: 10,
        tags: ['complete', 'grid-tied', 'provinces'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'total_system',
        subcategory: 'grid_tied',
        name: 'Grid-Tied System - Urban',
        description: 'Complete grid-tied solar system in urban areas',
        unit: 'per_kw',
        priceRange: { min: 75000, max: 90000 },
        currency: 'PHP',
        region: 'urban',
        isActive: true,
        priority: 10,
        tags: ['complete', 'grid-tied', 'urban'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'total_system',
        subcategory: 'hybrid',
        name: 'Hybrid System - Provinces',
        description: 'Complete hybrid solar system in provincial areas',
        unit: 'per_kw',
        priceRange: { min: 53000, max: 68000 },
        currency: 'PHP',
        region: 'provinces',
        isActive: true,
        priority: 9,
        tags: ['complete', 'hybrid', 'provinces'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      },
      {
        category: 'total_system',
        subcategory: 'hybrid',
        name: 'Hybrid System - Urban',
        description: 'Complete hybrid solar system in urban areas',
        unit: 'per_kw',
        priceRange: { min: 78000, max: 93000 },
        currency: 'PHP',
        region: 'urban',
        isActive: true,
        priority: 9,
        tags: ['complete', 'hybrid', 'urban'],
        metadata: {
          updatedBy: adminId,
          source: 'seed',
          notes: 'Initial seed data'
        }
      }
    ];

    // Insert pricing data
    await Pricing.insertMany(pricingData);

    console.log(`✅ Successfully seeded ${pricingData.length} pricing items`);
    
    // Log summary by category
    const categoryCounts = pricingData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Pricing data by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} items`);
    });

  } catch (error) {
    console.error('❌ Error seeding pricing data:', error);
    throw error;
  }
};

module.exports = seedPricing;
