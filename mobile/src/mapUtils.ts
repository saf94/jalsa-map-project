import { LocationData } from './locations';
import proj4 from 'proj4';

/**
 * Creates a GeoJSON FeatureCollection of polygons from a list of corner locations.
 * It groups corners by location name, converts their coordinates, and builds a polygon feature for each group of four.
 * @param cornerLocations - An array of location data for the corners.
 * @param osgb - The projection string for the source coordinate system (OSGB).
 * @param wgs84 - The projection string for the destination coordinate system (WGS84).
 * @returns An object containing two GeoJSON FeatureCollections: one for polygons and one for their center-point labels.
 */
export const createPolygonFeatures = (
  cornerLocations: Omit<LocationData, 'latitude' | 'longitude'>[],
  osgb: string,
  wgs84: string
) => {
  // Group corner locations to create polygons.
  const cornerGroups: { [key: string]: LocationData[] } = {};
  cornerLocations.forEach(loc => {
      const locationName = loc.label.replace(/\s\d+$/, '');
      const groupKey = `${loc.section}-${locationName}`;
      if (!cornerGroups[groupKey]) {
          cornerGroups[groupKey] = [];
      }
      cornerGroups[groupKey].push(loc as LocationData);
  });

  // Create GeoJSON features for each group of 4 corners.
  const polygonFeatures: any[] = [];
  const labelFeatures: any[] = [];

  Object.values(cornerGroups)
    .filter(group => group.length === 4)
    .forEach(group => {
        // To prevent twisted "bow-tie" polygons, we sort the vertices by their angle
        // around the geometric center (centroid) before drawing.

        // 1. Calculate the centroid of the points.
        const centroid = group.reduce(
          (acc, corner) => ({
            easting: acc.easting + corner.easting / group.length,
            northing: acc.northing + corner.northing / group.length,
          }),
          { easting: 0, northing: 0 }
        );

        // 2. Sort the corners by the angle they make with the centroid.
        group.sort((a, b) => {
          const angleA = Math.atan2(a.northing - centroid.northing, a.easting - centroid.easting);
          const angleB = Math.atan2(b.northing - centroid.northing, b.easting - centroid.easting);
          return angleA - angleB;
        });
        
        const coordinates = group.map(corner => {
            return proj4(osgb, wgs84, [corner.easting, corner.northing]);
        });
        coordinates.push(coordinates[0]); // Close the polygon.

        const name = group[0].label.replace(/\s\d+$/, '');

        // Add the polygon feature.
        polygonFeatures.push({
            type: 'Feature',
            properties: { section: group[0].section, name },
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates],
            },
        });

        // Add the label feature for the polygon's center.
        const [lon, lat] = proj4(osgb, wgs84, [centroid.easting, centroid.northing]);
        labelFeatures.push({
            type: 'Feature',
            properties: { name },
            geometry: {
                type: 'Point',
                coordinates: [lon, lat],
            },
        });
    });

  return {
    polygons: {
      type: 'FeatureCollection',
      features: polygonFeatures,
    },
    labels: {
      type: 'FeatureCollection',
      features: labelFeatures,
    },
  };
}; 