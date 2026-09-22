const express = require('express')
const router = express.Router()
const {
    submitSolarCalculatorRating,
    getSolarCalculatorRatings,
    deleteSolarCalculatorRating
} = require('../controllers/solarCalculatorRatingController')

router.route('/')
    .get(getSolarCalculatorRatings)
    .post(submitSolarCalculatorRating)

router.route('/:id')
    .delete(deleteSolarCalculatorRating)

module.exports = router
