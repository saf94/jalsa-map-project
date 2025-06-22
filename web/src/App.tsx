import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { MAPBOX_ACCESS_TOKEN } from './config';
import { locations as rawLocations, cornerLocations, LocationData } from './locations';
import proj4 from 'proj4';
import { createPolygonFeatures } from './mapUtils';

// Define the coordinate systems for converting from British National Grid to standard WGS84
const osgb = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [convertedLocations, setConvertedLocations] = useState<LocationData[]>([]);
  const [polygons, setPolygons] = useState<any>(null);

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
    setPolygons(polygonData);
  }, []);

  // Retrieves the user's initial GPS location.
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
    }
  };

  // Sets up a watcher to track the user's location in real-time.
  const watchUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          
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

  // This effect initializes the map and sets up markers once location data is ready.
  // It runs when `convertedLocations` is populated.
  useEffect(() => {
    // Prevent initialization if the map is already created, data isn't ready, or the container isn't available.
    if (map.current || convertedLocations.length === 0 || !mapContainer.current) return;

    // Fetch the user's location and start watching for changes.
    getUserLocation();
    watchUserLocation();

    // Initialize the Mapbox map instance.
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      // Center the map on the first custom location.
      center: [convertedLocations[0].longitude!, convertedLocations[0].latitude!],
      zoom: 15,
    });

    // Add zoom and rotation controls to the map.
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // The 'load' event fires when the map style has finished loading.
    // Markers and other layers should be added here to ensure the map is ready.
    map.current.on('load', () => {
      // Add a custom marker for the user's location if it's available.
      if (userLocation && map.current) {
        const el = document.createElement('div');
        el.className = 'user-location-dot';
        el.innerHTML = `
          <div class="pulse-ring"></div>
          <div class="location-dot"></div>
        `;
        userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(userLocation)
          .addTo(map.current);
      }
      
      // Add a marker for each of the converted custom locations.
      const currentMap = map.current;
      if (currentMap) {
        convertedLocations.forEach(location => {
          if (location.longitude && location.latitude) {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.backgroundColor = location.section === 'Mens' ? '#3498db' : '#e74c3c';

            new mapboxgl.Marker(el)
              .setLngLat([location.longitude, location.latitude])
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${location.label}</h3><p>${location.section}</p>`))
              .addTo(currentMap);
          }
        });
      }
      
      // Add polygon layers if they have been processed.
      if (polygons && currentMap) {
        currentMap.addSource('polygons-source', {
          type: 'geojson',
          data: polygons,
        });

        currentMap.addLayer({
          id: 'polygons-layer',
          type: 'fill',
          source: 'polygons-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'section'],
              'Mens', '#3498db',
              'Lajna', '#e74c3c',
              '#000000'
            ],
            'fill-opacity': 0.3,
          },
        });

        // Add a click listener for the polygon layer to show a popup with the location name.
        currentMap.on('click', 'polygons-layer', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const name = feature.properties?.name;
            const section = feature.properties?.section;
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`<h3>${name}</h3><p>${section}</p>`)
              .addTo(currentMap);
          }
        });
      }
    });

    // Handle any map errors.
    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });
    // The dependency array includes `convertedLocations` to trigger initialization, but not `userLocation`
    // to prevent re-initializing the entire map every time the user's location updates.
  }, [convertedLocations, polygons]);

  // This effect ensures the user's location marker is created or updated
  // whenever `userLocation` state changes, without re-initializing the whole map.
  useEffect(() => {
    if (map.current && userLocation) {
      if (userMarker.current) {
        // If the marker already exists, just update its position.
        userMarker.current.setLngLat(userLocation);
      } else if (map.current.isStyleLoaded()) {
        // If the marker doesn't exist and the map is ready, create it.
        const el = document.createElement('div');
        el.className = 'user-location-dot';
        el.innerHTML = `
          <div class="pulse-ring"></div>
          <div class="location-dot"></div>
        `;
        userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(userLocation)
          .addTo(map.current);
      }
    }
  }, [userLocation]);

  return (
    <div className="App">
      <h1>Jalsa Map</h1>
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      {/* Display user's current coordinates in a floating box */}
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
