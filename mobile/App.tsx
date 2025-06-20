import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Platform } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from './src/config';
import { locations as rawLocations, LocationData } from './src/locations';
import proj4 from 'proj4';

// Define the coordinate systems
const osgb = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationPermission, setLocationPermission] = useState<string>('unknown');
  const [convertedLocations, setConvertedLocations] = useState<LocationData[]>([]);

  // Process and convert locations on component mount
  useEffect(() => {
    // Group marquee corners
    const marqueeCorners: { [key: string]: LocationData[] } = {};
    const otherLocations: LocationData[] = [];

    rawLocations.forEach((loc: Omit<LocationData, 'latitude' | 'longitude'>) => {
      if (loc.label.startsWith('MM ') && !isNaN(parseInt(loc.label.split(' ')[1], 10))) {
        const sectionKey = loc.section;
        if (!marqueeCorners[sectionKey]) {
          marqueeCorners[sectionKey] = [];
        }
        marqueeCorners[sectionKey].push(loc);
      } else {
        otherLocations.push(loc);
      }
    });

    // Calculate center points for marquees
    const centerPoints = Object.keys(marqueeCorners).map(section => {
      const corners = marqueeCorners[section];
      const totalEasting = corners.reduce((sum, corner) => sum + corner.easting, 0);
      const totalNorthing = corners.reduce((sum, corner) => sum + corner.northing, 0);
      return {
        section: section,
        label: `${section} Marquee`,
        easting: totalEasting / corners.length,
        northing: totalNorthing / corners.length,
      };
    });

    const allLocationsToConvert = [...otherLocations, ...centerPoints];

    const converted = allLocationsToConvert.map(loc => {
      const [longitude, latitude] = proj4(osgb, wgs84, [loc.easting, loc.northing]);
      return { ...loc, latitude, longitude };
    });

    setConvertedLocations(converted);
  }, []);

  // Request location permissions and get user location
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
          setLocationPermission('ios');
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        setLocationPermission('error');
      }
    };
    requestLocationPermission();
  }, []);

  const handleLocationUpdate = (location: any) => {
    setUserLocation([location.coords.longitude, location.coords.latitude]);
  };

  const renderCustomMarkers = () => {
    return convertedLocations.map((location, index) => {
      if (!location.longitude || !location.latitude) return null;
      return (
        <Mapbox.PointAnnotation
          key={index.toString()}
          id={`marker-${index}`}
          coordinate={[location.longitude, location.latitude]}
        >
          <View style={[styles.customMarker, { backgroundColor: location.section === 'Mens' ? '#3498db' : '#e74c3c' }]} />
          <Mapbox.Callout title={`${location.label} (${location.section})`} />
        </Mapbox.PointAnnotation>
      );
    });
  };

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
        <Mapbox.Camera
          zoomLevel={15}
          centerCoordinate={[convertedLocations[0].longitude!, convertedLocations[0].latitude!]}
          followUserLocation={false}
        />
        
        <Mapbox.UserLocation
          visible={true}
          animated={true}
          onUpdate={handleLocationUpdate}
          showsUserHeadingIndicator={true}
          androidRenderMode="normal"
        />

        {renderCustomMarkers()}
      </Mapbox.MapView>
      
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
