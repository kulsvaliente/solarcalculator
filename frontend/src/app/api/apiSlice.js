import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
})

export const apiSlice = createApi({
    baseQuery,
    tagTypes: ['Pricing', 'PricingStats', 'Settings', 'SolarCalculatorRating', 'SolarCalculatorActivityLog'],
    endpoints: builder => ({})
})