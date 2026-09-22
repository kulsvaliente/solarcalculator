const mongoose = require('mongoose')

const solarCalculatorRatingSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true,
            trim: true
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
        submittedBy: {
            type: String,
            trim: true,
            default: 'Anonymous'
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('SolarCalculatorRating', solarCalculatorRatingSchema)
