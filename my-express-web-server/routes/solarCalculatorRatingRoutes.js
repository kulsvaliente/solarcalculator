const express = require('express')
const router = express.Router()
const { forwardToArecgis } = require('../services/arecgisProxy')

// Ratings ("evaluations") are forwarded to arecgis's own API so they land in the
// arecgis admin account, even though this backend is otherwise standalone.
const forward = forwardToArecgis('/solar-calculator-ratings')

router.route('/')
    .get(forward)
    .post(forward)

router.route('/:id')
    .delete(forward)

module.exports = router
