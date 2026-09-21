const express = require('express')
const router = express.Router()
const activityLogController = require('../controllers/solarCalculatorActivityLogController')

router.route('/')
    .post(activityLogController.createSolarCalculatorActivityLog)

module.exports = router
