const express = require('express')
const router = express.Router()
const {
    createSolarCalculatorActivityLog,
    getSolarCalculatorActivityLogs,
    deleteSolarCalculatorActivityLog
} = require('../controllers/solarCalculatorActivityLogController')

router.route('/')
    .get(getSolarCalculatorActivityLogs)
    .post(createSolarCalculatorActivityLog)

router.route('/:id')
    .delete(deleteSolarCalculatorActivityLog)

module.exports = router
