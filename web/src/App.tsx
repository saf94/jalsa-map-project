import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { MAPBOX_ACCESS_TOKEN } from './config';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
console.log(MAPBOX_ACCESS_TOKEN)
  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          
          // Center map on user location if map is loaded
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 12,
              duration: 2000
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to default location
          setUserLocation([-74.5, 40]);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      setUserLocation([-74.5, 40]);
    }
  };

  // Watch user's location for live updates
  const watchUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          
          // Update marker position
          if (map.current && userMarker.current) {
            userMarker.current.setLngLat([longitude, latitude]);
          }
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    // Get user location first
    getUserLocation();
    // Start watching for location updates
    watchUserLocation();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: userLocation || [-74.5, 40], // Use user location or default
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add event listeners
    map.current.on('load', () => {
      console.log('Map loaded successfully');
      
      // If we have user location, center the map and add marker
      if (userLocation && map.current) {
        map.current.flyTo({
          center: userLocation,
          zoom: 12,
          duration: 2000
        });

        // Create Google Maps-style location dot
        const el = document.createElement('div');
        el.className = 'user-location-dot';
        el.innerHTML = `
          <div class="pulse-ring"></div>
          <div class="location-dot"></div>
        `;

        // Add user location marker
        userMarker.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(userLocation)
          .addTo(map.current);
      }
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });
  }, []);

  // Update map when user location changes
  useEffect(() => {
    if (map.current && userLocation) {
      // Update marker if it exists, or create new one
      if (userMarker.current) {
        userMarker.current.setLngLat(userLocation);
      } else if (map.current.isStyleLoaded()) {
        // Create Google Maps-style location dot
        const el = document.createElement('div');
        el.className = 'user-location-dot';
        el.innerHTML = `
          <div class="pulse-ring"></div>
          <div class="location-dot"></div>
        `;

        userMarker.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(userLocation)
          .addTo(map.current);
      }
    }
  }, [userLocation]);

  return (
    <div className="App">
      <h1>Jalsa Map</h1>
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      {userLocation && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <p>Your Location: {userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)}</p>
          <p style={{ fontSize: '12px', color: '#666' }}>Live tracking active</p>
        </div>
      )}
    </div>
  );
}

export default App;
