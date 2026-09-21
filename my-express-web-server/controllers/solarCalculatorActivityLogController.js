const SolarCalculatorActivityLog = require('../models/SolarCalculatorActivityLog')

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const createSolarCalculatorActivityLog = async (req, res) => {
    const locationInput = String(req.body?.locationInput || '').trim()
    const searchQuery = String(req.body?.searchQuery || '').trim()
    const locationName = String(req.body?.locationName || '').trim()
    const source = String(req.body?.source || 'main_calculator').trim()

    if (!locationInput) {
        return res.status(400).json({ message: 'locationInput is required' })
    }

    const latitude = req.body?.latitude
    const longitude = req.body?.longitude

    const payload = {
        locationInput,
        searchQuery,
        locationName,
        source,
        searchedBy: req.user || 'Anonymous'
    }

    if (latitude !== undefined && latitude !== null && !Number.isNaN(Number(latitude))) {
        payload.latitude = Number(latitude)
    }
    if (longitude !== undefined && longitude !== null && !Number.isNaN(Number(longitude))) {
        payload.longitude = Number(longitude)
    }

    const created = await SolarCalculatorActivityLog.create(payload)
    return res.status(201).json(created)
}

const getSolarCalculatorActivityLogs = async (req, res) => {
    const page = toPositiveInt(req.query?.page, 1)
    const limit = toPositiveInt(req.query?.limit, 20)
    const search = String(req.query?.search || '').trim()
    const skip = (page - 1) * limit

    const filter = {}
    if (search) {
        const regex = new RegExp(search, 'i')
        filter.$or = [
            { locationInput: regex },
            { searchQuery: regex },
            { locationName: regex },
            { searchedBy: regex }
        ]
    }

    const [total, data] = await Promise.all([
        SolarCalculatorActivityLog.countDocuments(filter),
        SolarCalculatorActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    ])

    return res.json({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    })
}

const deleteSolarCalculatorActivityLog = async (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ message: 'Log ID is required' })
    }

    const deleted = await SolarCalculatorActivityLog.findByIdAndDelete(id).lean()
    if (!deleted) {
        return res.status(404).json({ message: 'Activity log not found' })
    }

    return res.json({ message: 'Activity log deleted successfully' })
}

module.exports = {
    createSolarCalculatorActivityLog,
    getSolarCalculatorActivityLogs,
    deleteSolarCalculatorActivityLog
}
