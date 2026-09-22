const mongoose = require('mongoose')
const { baseLogger } = require('../middleware/logger')

const connectDB = async () => {
    const uri = process.env.DATABASE_URI
    if (!uri || uri.trim() === '') {
        baseLogger.fatal('DATABASE_URI is missing in .env. Add: DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/YourDbName?retryWrites=true&w=majority')
        process.exit(1)
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            retryWrites: true,
        })
        baseLogger.info('MongoDB connection established')
    } catch (err) {
        baseLogger.fatal({ err: err.message, name: err.name }, 'MongoDB connection failed')
        console.error('\n--- MongoDB connection error ---')
        console.error(err.message)
        console.error('\nCommon causes:')
        console.error('  1. Wrong or missing DATABASE_URI in .env (include database name: ...net/YourDbName?...)')
        console.error('  2. MongoDB Atlas: add your IP (or 0.0.0.0/0 for dev) in Network Access')
        console.error('  3. Wrong username/password; special characters in password must be URL-encoded')
        console.error('  4. No internet or firewall blocking port 27017')
        console.error('---\n')
        process.exit(1)
    }
}
module.exports = connectDB