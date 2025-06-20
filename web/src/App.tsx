import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { MAPBOX_ACCESS_TOKEN } from './config';
import { locations as rawLocations, LocationData } from './locations';
import proj4 from 'proj4';

// Define the coordinate systems
const osgb = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [convertedLocations, setConvertedLocations] = useState<LocationData[]>([]);

  // Process and convert locations on component mount
  useEffect(() => {
    // Group marquee corners
    const marqueeCorners: { [key: string]: (typeof rawLocations[0])[] } = {};
    const otherLocations: (typeof rawLocations[0])[] = [];

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

  // Get user's current location
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

  // Watch user's location for live updates
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

  useEffect(() => {
    if (map.current || convertedLocations.length === 0 || !mapContainer.current) return;

    getUserLocation();
    watchUserLocation();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [convertedLocations[0].longitude!, convertedLocations[0].latitude!],
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded successfully');
      
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
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });
  }, [convertedLocations, userLocation]);

  useEffect(() => {
    if (map.current && userLocation) {
      if (userMarker.current) {
        userMarker.current.setLngLat(userLocation);
      } else if (map.current.isStyleLoaded()) {
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
