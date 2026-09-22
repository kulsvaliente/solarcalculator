const express = require('express')
const router = express.Router()
const { forwardToArecgis } = require('../services/arecgisProxy')

// Activity logs ("solar logs") are forwarded to arecgis's own API so they land in the
// arecgis admin account, even though this backend is otherwise standalone.
const forward = forwardToArecgis('/solar-calculator-activity-logs')

router.route('/')
    .get(forward)
    .post(forward)

router.route('/:id')
    .delete(forward)

module.exports = router
