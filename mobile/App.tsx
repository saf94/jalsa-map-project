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
  const [cameraCenter, setCameraCenter] = useState<[number, number]>([-0.5, 51.5]);
  const [cameraZoom, setCameraZoom] = useState<number>(15);

  // This effect runs once on component mount to convert location and corner data.
  useEffect(() => {
    // Convert main locations for markers.
    const converted = rawLocations.map(loc => {
      const [longitude, latitude] = proj4(osgb, wgs84, [loc.easting, loc.northing]);
      return { ...loc, latitude, longitude };
    });
    setConvertedLocations(converted);

    // Set initial camera center to first location
    if (converted.length > 0 && converted[0].longitude && converted[0].latitude) {
      setCameraCenter([converted[0].longitude, converted[0].latitude]);
    }

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

  // Function to pan and zoom to user's current location
  const goToUserLocation = () => {
    if (userLocation) {
      setCameraCenter(userLocation);
      setCameraZoom(16);
    } else {
      Alert.alert('Location', 'Unable to get your location. Please check your location permissions.');
    }
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
      {/* Beta indicator */}
      <View style={styles.betaBadge}>
        <Text style={styles.betaText}>BETA</Text>
      </View>
      
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
      >
        {/* The Camera controls the map's viewport (center, zoom, etc.). */}
        <Mapbox.Camera
          zoomLevel={cameraZoom}
          centerCoordinate={cameraCenter}
          followUserLocation={false}
          animationMode="flyTo"
          animationDuration={2000}
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
      
      {/* Floating button to go to user location */}
      <View style={styles.locationButton}>
        <Text style={styles.locationButtonText} onPress={goToUserLocation}>
          🎯
        </Text>
      </View>
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
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButtonText: {
    fontSize: 20,
    color: '#5f6368',
  },
  betaBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b35',
    paddingHorizontal: 15,
    paddingVertical: 0,
    zIndex: 1000,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  betaText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
