import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Platform } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from './src/config';
import { locations as rawLocations, cornerLocations, LocationData } from './src/locations';
import proj4 from 'proj4';
import { createPolygonFeatures } from './src/mapUtils';

// Define the coordinate systems for converting from British National Grid to standard WGS84
const osgb = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

// Set the Mapbox access token for the entire application.
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationPermission, setLocationPermission] = useState<string>('unknown');
  const [convertedLocations, setConvertedLocations] = useState<LocationData[]>([]);
  const [polygonGeoJSON, setPolygonGeoJSON] = useState<any>(null);
  const [polygonLabelGeoJSON, setPolygonLabelGeoJSON] = useState<any>(null);

  // This effect runs once on component mount to convert location and corner data.
  useEffect(() => {
    // Convert main locations for markers.
    const converted = rawLocations.map(loc => {
      const [longitude, latitude] = proj4(osgb, wgs84, [loc.easting, loc.northing]);
      return { ...loc, latitude, longitude };
    });
    setConvertedLocations(converted);

    // Generate polygons and labels using the utility function.
    const { polygons: polygonData, labels: labelData } = createPolygonFeatures(cornerLocations, osgb, wgs84);
    setPolygonGeoJSON(polygonData);
    setPolygonLabelGeoJSON(labelData);
  }, []);

  // This effect requests location permissions when the component mounts.
  // It handles the specific case for Android, as iOS permissions are handled by Mapbox.
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await Mapbox.requestAndroidLocationPermissions();
          setLocationPermission(granted ? 'granted' : 'denied');
          if (!granted) {
            Alert.alert('Location Permission', 'Please enable location services to use this app');
          }
        } else {
          // For iOS, permissions are typically handled by the map component itself.
          setLocationPermission('ios');
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        setLocationPermission('error');
      }
    };
    requestLocationPermission();
  }, []);

  // Callback function to update the user's location state when the map provides a new position.
  const handleLocationUpdate = (location: any) => {
    setUserLocation([location.coords.longitude, location.coords.latitude]);
  };



  // Show a loading screen while the location data is being converted.
  if (convertedLocations.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Converting locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
      >
        {/* The Camera controls the map's viewport (center, zoom, etc.). */}
        <Mapbox.Camera
          zoomLevel={15}
          // Center the map on the first custom location.
          centerCoordinate={convertedLocations.length > 0 && convertedLocations[0].longitude && convertedLocations[0].latitude 
            ? [convertedLocations[0].longitude, convertedLocations[0].latitude]
            : [-0.5, 51.5] // Fallback to London area if conversion fails
          }
          followUserLocation={false}
          animationMode="none"
          animationDuration={0}
        />
        
        {/* This component displays the user's current location on the map with a pulsing blue dot. */}
        <Mapbox.UserLocation
          visible={true}
          animated={true}
          onUpdate={handleLocationUpdate}
          showsUserHeadingIndicator={true}
          androidRenderMode="normal"
        />

        {/* Render polygons if they are available */}
        {polygonGeoJSON && (
          <Mapbox.ShapeSource
            id="polygons-source"
            shape={polygonGeoJSON}
          >
            <Mapbox.FillLayer
              id="polygons-layer"
              style={{
                fillColor: [
                  'match',
                  ['get', 'section'],
                  'Mens', '#3498db',
                  'Lajna', '#e74c3c',
                  '#000000',
                ],
                fillOpacity: 0.3,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Render polygon labels if they are available */}
        {polygonLabelGeoJSON && (
          <Mapbox.ShapeSource
            id="polygon-labels-source"
            shape={polygonLabelGeoJSON}
          >
            <Mapbox.SymbolLayer
              id="polygon-labels-layer"
              style={{
                textField: ['get', 'name'],
                textSize: 12,
                textColor: '#000000',
                textHaloColor: '#FFFFFF',
                textHaloWidth: 1,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Location markers removed for now */}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    width: '100%',
  },

});
