const mongoose = require('mongoose')

const solarCalculatorActivityLogSchema = new mongoose.Schema(
    {
        locationInput: {
            type: String,
            required: true,
            trim: true
        },
        searchQuery: {
            type: String,
            trim: true,
            default: ''
        },
        locationName: {
            type: String,
            trim: true,
            default: ''
        },
        latitude: {
            type: Number,
            required: false
        },
        longitude: {
            type: Number,
            required: false
        },
        source: {
            type: String,
            trim: true,
            default: 'main_calculator'
        },
        searchedBy: {
            type: String,
            trim: true,
            default: 'Anonymous'
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('SolarCalculatorActivityLog', solarCalculatorActivityLogSchema)
