import { apiSlice } from '../../app/api/apiSlice';

export const settingsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getSettings: builder.query({
            query: () => '/settings',
            providesTags: ['Settings']
        }),
    })
});

export const {
    useGetSettingsQuery
} = settingsApiSlice;
