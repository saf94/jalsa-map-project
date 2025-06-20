export const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

if (!MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is not set. Please set REACT_APP_MAPBOX_ACCESS_TOKEN environment variable.');
} 