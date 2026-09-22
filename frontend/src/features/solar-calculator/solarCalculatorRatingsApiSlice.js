import { apiSlice } from '../../app/api/apiSlice'

export const solarCalculatorRatingsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitSolarCalculatorRating: builder.mutation({
      query: (payload) => ({
        url: '/solar-calculator-ratings',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: [{ type: 'SolarCalculatorRating', id: 'LIST' }]
    }),
    getSolarCalculatorRatings: builder.query({
      query: ({ page = 1, limit = 20, search = '', adminToken = '' } = {}) => ({
        url: '/solar-calculator-ratings',
        params: {
          page,
          limit,
          search
        },
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined
      }),
      providesTags: (result) =>
        result?.data
          ? [
              { type: 'SolarCalculatorRating', id: 'LIST' },
              ...result.data.map((item) => ({ type: 'SolarCalculatorRating', id: item._id }))
            ]
          : [{ type: 'SolarCalculatorRating', id: 'LIST' }]
    }),
    deleteSolarCalculatorRating: builder.mutation({
      query: ({ id, adminToken }) => ({
        url: `/solar-calculator-ratings/${id}`,
        method: 'DELETE',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined
      }),
      invalidatesTags: [{ type: 'SolarCalculatorRating', id: 'LIST' }]
    }),
    adminLogin: builder.mutation({
      query: ({ email, password }) => ({
        url: '/admin/login',
        method: 'POST',
        body: { email, password }
      })
    })
  })
})

export const {
  useSubmitSolarCalculatorRatingMutation,
  useGetSolarCalculatorRatingsQuery,
  useDeleteSolarCalculatorRatingMutation,
  useAdminLoginMutation
} = solarCalculatorRatingsApiSlice
