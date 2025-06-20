import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Platform } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from './src/config';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationPermission, setLocationPermission] = useState<string>('unknown');

  // Request location permissions and get user location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          console.log('Requesting Android location permissions...');
          const granted = await Mapbox.requestAndroidLocationPermissions();
          if (granted) {
            console.log('Android location permission granted');
            setLocationPermission('granted');
          } else {
            console.log('Android location permission denied');
            setLocationPermission('denied');
            Alert.alert('Location Permission', 'Please enable location services to use this app');
          }
        } else {
          console.log('iOS - location permissions will be requested by the system');
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
    console.log('Location update received:', location);
    setUserLocation([location.coords.longitude, location.coords.latitude]);
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
      >
        <Mapbox.Camera
          zoomLevel={12}
          centerCoordinate={userLocation || [-74.5, 40]}
          followUserLocation={true}
        />
        
        {/* Google Maps-style user location indicator */}
        <Mapbox.UserLocation
          visible={true}
          animated={true}
          onUpdate={handleLocationUpdate}
          showsUserHeadingIndicator={true}
          androidRenderMode="normal"
        />
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
  },
  map: {
    flex: 1,
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
});
