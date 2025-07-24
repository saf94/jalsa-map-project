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
  const [polygonLabels, setPolygonLabels] = useState<any>(null);

  // This effect runs once on component mount to convert location and corner data.
  useEffect(() => {
    // Convert main locations for markers.
    const converted = rawLocations.map(loc => {
      const [longitude, latitude] = proj4(osgb, wgs84, [loc.easting, loc.northing]);
      return { ...loc, latitude, longitude };
    });
    setConvertedLocations(converted);

    // Generate polygons and their labels using the utility function.
    const { polygons: polygonData, labels: labelData } = createPolygonFeatures(cornerLocations, osgb, wgs84);
    setPolygons(polygonData);
    setPolygonLabels(labelData);
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

  // Function to pan and zoom to user's current location
  const goToUserLocation = () => {
    if (userLocation && map.current) {
      map.current.flyTo({
        center: userLocation,
        zoom: 16,
        duration: 2000
      });
    } else if (navigator.geolocation) {
      // If we don't have the user location yet, get it first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 16,
              duration: 2000
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your location permissions.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
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
      
      // Location markers removed for now
      const currentMap = map.current;
      
      // Add polygon layers if they have been processed.
      if (polygons && polygonLabels && currentMap) {
        // Add source and layer for the polygon fill.
        currentMap.addSource('polygons-source', { type: 'geojson', data: polygons });
        currentMap.addLayer({
          id: 'polygons-layer',
          type: 'fill',
          source: 'polygons-source',
          paint: {
            'fill-color': ['match', ['get', 'section'], 'Mens', '#3498db', 'Lajna', '#e74c3c', '#000000'],
            'fill-opacity': 0.3,
          },
        });

        // Add source and layer for the polygon labels.
        currentMap.addSource('polygon-labels-source', { type: 'geojson', data: polygonLabels });
        currentMap.addLayer({
          id: 'polygon-labels-layer',
          type: 'symbol',
          source: 'polygon-labels-source',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1
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
  }, [convertedLocations, polygons, polygonLabels]);

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
      } else {
        // If map isn't ready yet, wait for it
        const handleStyleLoad = () => {
          const el = document.createElement('div');
          el.className = 'user-location-dot';
          el.innerHTML = `
            <div class="pulse-ring"></div>
            <div class="location-dot"></div>
          `;
          userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(userLocation)
            .addTo(map.current!);
          map.current!.off('styledata', handleStyleLoad);
        };
        map.current.on('styledata', handleStyleLoad);
      }
    }
  }, [userLocation]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100%',
      margin: 0,
      padding: 0
    }}>
      <header style={{
        backgroundColor: '#282c34',
        color: 'white',
        padding: '10px 20px',
        textAlign: 'center',
        flexShrink: 0
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Jalsa Map</h1>
      </header>
      <div style={{ 
        position: 'relative', 
        flex: 1,
        width: '100%'
      }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        <button 
          onClick={goToUserLocation}
          style={{
            position: 'absolute',
            top: '120px',
            right: '5px',
            zIndex: 1000,
            width: '44px',
            height: '44px',
            backgroundColor: 'white',
            color: '#5f6368',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
          title="My Location"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;
