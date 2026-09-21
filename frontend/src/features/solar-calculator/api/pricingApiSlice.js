import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPricingData, fetchAllPricingData, calculateSystemCost, getMultipleSystemCosts } from '../services/pricingService';

// Async thunks
export const fetchPricing = createAsyncThunk(
  'pricing/fetchPricing',
  async ({ category = 'total_system', region = 'all' }, { rejectWithValue }) => {
    try {
      const data = await fetchPricingData(category, region);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllPricing = createAsyncThunk(
  'pricing/fetchAllPricing',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchAllPricingData();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const calculateSystemCosts = createAsyncThunk(
  'pricing/calculateSystemCosts',
  async ({ capacity, systemType = 'grid_tied', region = 'all' }, { rejectWithValue }) => {
    try {
      const data = await calculateSystemCost(capacity, systemType, region);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const calculateMultipleSystemCosts = createAsyncThunk(
  'pricing/calculateMultipleSystemCosts',
  async ({ capacity, region = 'all' }, { rejectWithValue }) => {
    try {
      const data = await getMultipleSystemCosts(capacity, region);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const pricingSlice = createSlice({
  name: 'pricing',
  initialState: {
    data: null,
    allPricing: null,
    systemCosts: null,
    multipleSystemCosts: null,
    loading: false,
    error: null,
    lastFetched: null
  },
  reducers: {
    clearPricingData: (state) => {
      state.data = null;
      state.systemCosts = null;
      state.multipleSystemCosts = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch pricing
      .addCase(fetchPricing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPricing.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchPricing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch all pricing
      .addCase(fetchAllPricing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPricing.fulfilled, (state, action) => {
        state.loading = false;
        state.allPricing = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchAllPricing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Calculate system costs
      .addCase(calculateSystemCosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateSystemCosts.fulfilled, (state, action) => {
        state.loading = false;
        state.systemCosts = action.payload;
      })
      .addCase(calculateSystemCosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Calculate multiple system costs
      .addCase(calculateMultipleSystemCosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateMultipleSystemCosts.fulfilled, (state, action) => {
        state.loading = false;
        state.multipleSystemCosts = action.payload;
      })
      .addCase(calculateMultipleSystemCosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearPricingData, clearError } = pricingSlice.actions;
export default pricingSlice.reducer;
