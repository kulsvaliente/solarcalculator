import { configureStore } from "@reduxjs/toolkit"
import { apiSlice } from './api/apiSlice'
import { settingsApiSlice } from '../features/settings/settingsApiSlice'
import { pricingApiSlice } from '../features/pricing/pricingApiSlice'
import { setupListeners } from "@reduxjs/toolkit/query"

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        [settingsApiSlice.reducerPath]: settingsApiSlice.reducer,
        [pricingApiSlice.reducerPath]: pricingApiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                ignoredActionsPaths: ['meta.arg', 'payload.timestamp', 'meta.baseQueryMeta'],
                ignoredPaths: ['_persist', 'meta.arg', 'meta.baseQueryMeta']
            },
            immutableCheck: {
                ignoredPaths: ['_persist', 'meta.arg', 'meta.baseQueryMeta']
            }
        }).concat(apiSlice.middleware, settingsApiSlice.middleware, pricingApiSlice.middleware),
    devTools: process.env.NODE_ENV !== 'production'
})

setupListeners(store.dispatch)