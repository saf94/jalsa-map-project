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
  const [selectedPolygon, setSelectedPolygon] = useState<any>(null);

  // This effect runs once on component mount to convert location and corner data.
  useEffect(() => {
    // Convert main locations for markers.
    const converted = rawLocations.map(loc => {
      const [longitude, latitude] = proj4(osgb, wgs84, [loc.easting, loc.northing]);
      return { ...loc, latitude, longitude };
    });
    setConvertedLocations(converted);

    // Generate polygons using the utility function.
    const polygonData = createPolygonFeatures(cornerLocations, osgb, wgs84);
    setPolygonGeoJSON(polygonData);
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

  // Handles press events on a polygon, setting state to show a callout.
  const handlePolygonPress = (e: any) => {
    const feature = e.features[0];
    // The type for e.coordinates is not correctly inferred, so we cast to array of numbers
    const coordinate = e.coordinates as [number, number];
    setSelectedPolygon({
      name: feature.properties.name,
      section: feature.properties.section,
      coordinate: coordinate,
    });
  };

  // Renders a custom marker for each location in the `convertedLocations` array.
  const renderCustomMarkers = () => {
    return convertedLocations.map((location, index) => {
      if (!location.longitude || !location.latitude) return null;
      return (
        <Mapbox.PointAnnotation
          key={index.toString()}
          id={`marker-${index}`}
          coordinate={[location.longitude, location.latitude]}
        >
          {/* Custom marker view with color based on section */}
          <View style={[styles.customMarker, { backgroundColor: location.section === 'Mens' ? '#3498db' : '#e74c3c' }]} />
          {/* Callout (popup) that appears when the marker is tapped */}
          <Mapbox.Callout title={`${location.label} (${location.section})`} />
        </Mapbox.PointAnnotation>
      );
    });
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
        onPress={() => setSelectedPolygon(null)} // Clear selection on map press
      >
        {/* The Camera controls the map's viewport (center, zoom, etc.). */}
        <Mapbox.Camera
          zoomLevel={15}
          // Center the map on the first custom location.
          centerCoordinate={[convertedLocations[0].longitude!, convertedLocations[0].latitude!]}
          followUserLocation={false}
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
            onPress={handlePolygonPress}
            hitbox={{ width: 44, height: 44 }}
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

        {/* Show a callout for the selected polygon */}
        {selectedPolygon && (
          <Mapbox.PointAnnotation
            id="selected-polygon"
            coordinate={selectedPolygon.coordinate}
          >
            <Mapbox.Callout title={`${selectedPolygon.name} (${selectedPolygon.section})`} />
          </Mapbox.PointAnnotation>
        )}

        {/* Render all the custom location markers on the map. */}
        {renderCustomMarkers()}
      </Mapbox.MapView>
      
      {/* A floating info box to display the user's coordinates and tracking status. */}
      <View style={styles.locationInfo}>
        <Text style={styles.locationText}>
          {userLocation 
            ? `Your Location: ${userLocation[1].toFixed(4)}, ${userLocation[0].toFixed(4)}`
            : 'Getting your location...'
          }
        </Text>
        <Text style={styles.liveText}>
          {userLocation ? 'Live tracking active' : 'Waiting for location...'}
        </Text>
        <Text style={styles.debugText}>
          Platform: {Platform.OS} | Permission: {locationPermission}
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
  locationInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  liveText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginTop: 2,
  },
  debugText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#999',
    marginTop: 4,
  },
  customMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
});
