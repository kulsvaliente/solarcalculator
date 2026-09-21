const express = require('express')
const router = express.Router()
const ratingController = require('../controllers/solarCalculatorRatingController')

// Public: the calculator UI both submits ratings and displays the average-rating badge
router.route('/')
    .get(ratingController.getSolarCalculatorRatings)
    .post(ratingController.submitSolarCalculatorRating)

module.exports = router
