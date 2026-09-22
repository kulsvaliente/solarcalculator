/**
 * Reverse geocoding, proxied through the standalone backend so the OpenCage key
 * never ships to the browser.
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://solarcalc-backend.nbericmmsu.com';

export async function reverseGeocode(lat, lng) {
  const response = await fetch(`${API_BASE_URL}/api/geo/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  });
  return response.json();
}
