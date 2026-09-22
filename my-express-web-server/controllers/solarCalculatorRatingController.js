const SolarCalculatorRating = require('../models/SolarCalculatorRating')
const { verifyAdminToken } = require('../utils/adminToken')

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const submitSolarCalculatorRating = async (req, res) => {
    const rating = Number(req.body?.rating)
    const comment = String(req.body?.comment || '').trim()
    const context = req.body?.context || {}

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'rating must be between 1 and 5' })
    }
    if (!comment) {
        return res.status(400).json({ message: 'comment is required' })
    }

    const payload = {
        rating,
        comment,
        locationName: String(context?.locationName || req.body?.locationName || '').trim(),
        submittedBy: req.user || 'Anonymous'
    }

    const latitude = context?.latitude ?? req.body?.latitude
    const longitude = context?.longitude ?? req.body?.longitude
    if (latitude !== undefined && latitude !== null && !Number.isNaN(Number(latitude))) {
        payload.latitude = Number(latitude)
    }
    if (longitude !== undefined && longitude !== null && !Number.isNaN(Number(longitude))) {
        payload.longitude = Number(longitude)
    }

    const created = await SolarCalculatorRating.create(payload)
    return res.status(201).json(created)
}

const getSolarCalculatorRatings = async (req, res) => {
    const page = toPositiveInt(req.query?.page, 1)
    const limit = toPositiveInt(req.query?.limit, 20)
    const search = String(req.query?.search || '').trim()
    const skip = (page - 1) * limit

    const filter = {}
    if (search) {
        const regex = new RegExp(search, 'i')
        filter.$or = [{ comment: regex }, { locationName: regex }, { submittedBy: regex }]
    }

    const [total, data, average] = await Promise.all([
        SolarCalculatorRating.countDocuments(filter),
        SolarCalculatorRating.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SolarCalculatorRating.aggregate([
            { $match: filter },
            { $group: { _id: null, averageRating: { $avg: '$rating' } } }
        ])
    ])

    const averageRating = average?.[0]?.averageRating
        ? Number(average[0].averageRating.toFixed(2))
        : 0

    // Comments are admin-only — strip them out for everyone else so they never appear in the
    // public response (not just hidden in the UI, since the raw response is inspectable too).
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const isAdmin = verifyAdminToken(token)
    const responseData = isAdmin ? data : data.map(({ comment, ...rest }) => rest)

    return res.json({
        data: responseData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        averageRating
    })
}

const deleteSolarCalculatorRating = async (req, res) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ message: 'Rating ID is required' })
    }

    const deleted = await SolarCalculatorRating.findByIdAndDelete(id).lean()
    if (!deleted) {
        return res.status(404).json({ message: 'Rating not found' })
    }

    return res.json({ message: 'Rating deleted successfully' })
}

module.exports = {
    submitSolarCalculatorRating,
    getSolarCalculatorRatings,
    deleteSolarCalculatorRating
}
