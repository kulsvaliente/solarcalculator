import { useState, useEffect, useCallback } from 'react';
import { getSunPeakHours } from '../services/solarIrradianceService';

/**
 * Custom hook for managing sun peak hours data
 * Provides standardized sun peak hours calculation using NREL PVWatts API
 */
export const useSunPeakHours = (latitude, longitude, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSunPeakHours = useCallback(async () => {
    if (!latitude || !longitude) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getSunPeakHours(latitude, longitude, options);
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error);
        setData(null);
      }
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, JSON.stringify(options)]);

  useEffect(() => {
    fetchSunPeakHours();
  }, [fetchSunPeakHours]);

  const refetch = useCallback(() => {
    fetchSunPeakHours();
  }, [fetchSunPeakHours]);

  return {
    data,
    loading,
    error,
    refetch,
    // Convenience getters
    annualAverage: data?.annualAverage || null,
    seasonalAverages: data?.seasonalAverages || null,
    monthlyData: data?.monthlyData || null,
    isSuccess: data?.success || false
  };
};

export default useSunPeakHours;

