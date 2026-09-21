import { apiSlice } from '../../app/api/apiSlice'

export const solarCalculatorActivityLogsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSolarCalculatorActivityLog: builder.mutation({
      query: (payload) => ({
        url: '/solar-calculator-activity-logs',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: [{ type: 'SolarCalculatorActivityLog', id: 'LIST' }]
    }),
    getSolarCalculatorActivityLogs: builder.query({
      query: ({ page = 1, limit = 20, search = '' } = {}) => ({
        url: '/solar-calculator-activity-logs',
        params: {
          page,
          limit,
          search
        }
      }),
      providesTags: (result) =>
        result?.data
          ? [
              { type: 'SolarCalculatorActivityLog', id: 'LIST' },
              ...result.data.map((item) => ({ type: 'SolarCalculatorActivityLog', id: item._id }))
            ]
          : [{ type: 'SolarCalculatorActivityLog', id: 'LIST' }]
    }),
    deleteSolarCalculatorActivityLog: builder.mutation({
      query: (id) => ({
        url: `/solar-calculator-activity-logs/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'SolarCalculatorActivityLog', id: 'LIST' }]
    })
  })
})

export const {
  useCreateSolarCalculatorActivityLogMutation,
  useGetSolarCalculatorActivityLogsQuery,
  useDeleteSolarCalculatorActivityLogMutation
} = solarCalculatorActivityLogsApiSlice
