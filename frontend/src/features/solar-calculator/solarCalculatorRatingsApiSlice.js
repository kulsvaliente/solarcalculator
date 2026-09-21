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
      query: ({ page = 1, limit = 20, search = '' } = {}) => ({
        url: '/solar-calculator-ratings',
        params: {
          page,
          limit,
          search
        }
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
      query: (id) => ({
        url: `/solar-calculator-ratings/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'SolarCalculatorRating', id: 'LIST' }]
    })
  })
})

export const {
  useSubmitSolarCalculatorRatingMutation,
  useGetSolarCalculatorRatingsQuery,
  useDeleteSolarCalculatorRatingMutation
} = solarCalculatorRatingsApiSlice
