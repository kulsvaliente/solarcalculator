const express = require('express')
const router = express.Router()
const verifyAdmin = require('../middleware/verifyAdmin')
const {
    createSolarCalculatorActivityLog,
    getSolarCalculatorActivityLogs,
    deleteSolarCalculatorActivityLog
} = require('../controllers/solarCalculatorActivityLogController')

// Activity logs have no public view (unlike ratings, which show star values to everyone) —
// only the admin panel reads this list, so both GET and DELETE require the admin token.
router.route('/')
    .get(verifyAdmin, getSolarCalculatorActivityLogs)
    .post(createSolarCalculatorActivityLog)

router.route('/:id')
    .delete(verifyAdmin, deleteSolarCalculatorActivityLog)

module.exports = router
