require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');

// Import seed functions
const seedPricing = require('./seeds/seedPricing');

const runSeeds = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    console.log('\n💰 Seeding pricing data...');
    await seedPricing();
    
    console.log('\n🎉 All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
