import { apiSlice } from '../../app/api/apiSlice';

export const pricingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get pricing by category
    getPricingByCategory: builder.query({
      query: ({ category, region }) => ({
        url: `/pricing/category/${category}`,
        params: { region }
      }),
      providesTags: ['Pricing']
    }),

    // Get pricing for AI context
    getPricingForAI: builder.query({
      query: () => '/pricing/ai',
      providesTags: ['Pricing']
    })
  })
});

export const {
  useGetPricingByCategoryQuery,
  useGetPricingForAIQuery
} = pricingApiSlice;
