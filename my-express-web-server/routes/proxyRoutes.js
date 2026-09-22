const express = require('express')
const router = express.Router()
const { reverseGeocode, aiChat, getIrradiance } = require('../controllers/proxyController')

router.post('/geo/reverse', reverseGeocode)
router.post('/ai/chat', aiChat)
router.post('/irradiance', getIrradiance)

module.exports = router
