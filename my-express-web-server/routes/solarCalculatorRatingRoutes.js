const express = require('express')
const router = express.Router()
const verifyAdmin = require('../middleware/verifyAdmin')
const {
    submitSolarCalculatorRating,
    getSolarCalculatorRatings,
    deleteSolarCalculatorRating
} = require('../controllers/solarCalculatorRatingController')

router.route('/')
    .get(getSolarCalculatorRatings)
    .post(submitSolarCalculatorRating)

router.route('/:id')
    .delete(verifyAdmin, deleteSolarCalculatorRating)

module.exports = router
