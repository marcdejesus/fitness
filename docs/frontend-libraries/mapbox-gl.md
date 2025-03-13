# MapBox GL & Geolocation Features

## Overview
MapBox GL JS is a JavaScript library that uses WebGL to render interactive maps from vector tiles and MapBox styles, perfect for tracking outdoor workouts and finding gyms.

## Features Used in Our Fitness App

- **Route Tracking**: Recording running, cycling, and hiking paths
- **Gym Locator**: Finding nearby fitness facilities and displaying ratings
- **Heatmaps**: Visualizing popular workout areas in the community
- **Distance Calculation**: Measuring distances for running and cycling routes
- **Elevation Data**: Showing elevation changes during outdoor workouts
- **Customized Map Styles**: Different map styles for various activities

## Implementation Examples

### Workout Route Tracker
```tsx
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

function RouteTracker({ coordinates }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: coordinates[0] || [-74.5, 40],
        zoom: 13
      });
      
      map.current.on('load', () => {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });
        
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0080ff',
            'line-width': 5
          }
        });
      });
    }
  }, []);

  return <div ref={mapContainer} style={{ height: '400px', width: '100%' }} />;
}
```

### Nearby Gyms Finder
```tsx
function NearbyGyms({ userLocation }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [gyms, setGyms] = useState([]);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: userLocation,
        zoom: 14
      });

      // Add user location marker
      new mapboxgl.Marker({ color: '#0080ff' })
        .setLngLat(userLocation)
        .addTo(map.current);
        
      // Fetch nearby gyms
      fetchNearbyGyms(userLocation).then(gymsData => {
        setGyms(gymsData);
        
        // Add markers for each gym
        gymsData.forEach(gym => {
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${gym.name}</h3><p>Rating: ${gym.rating}/5</p>`);
            
          new mapboxgl.Marker({ color: '#ff8c00' })
            .setLngLat(gym.location)
            .setPopup(popup)
            .addTo(map.current);
        });
      });
    }
  }, [userLocation]);

  return <div ref={mapContainer} style={{ height: '500px', width: '100%' }} />;
}
```

### Workout Statistics with Elevation Profile
```tsx
function WorkoutMapWithElevation({ route, elevationData }) {
  // Map initialization code...

  // Add elevation profile chart
  return (
    <div>
      <div ref={mapContainer} style={{ height: '400px', width: '100%' }} />
      <div className="elevation-chart">
        <AreaChart
          width={600}
          height={200}
          data={elevationData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="distance" label="Distance (km)" />
          <YAxis label="Elevation (m)" />
          <Tooltip />
          <Area type="monotone" dataKey="elevation" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </div>
      <div className="workout-stats">
        <div>Total Distance: {calculateTotalDistance(route)}km</div>
        <div>Elevation Gain: {calculateElevationGain(elevationData)}m</div>
        <div>Estimated Calories: {calculateCalories(route, elevationData)}</div>
      </div>
    </div>
  );
}
```

## Mobile Integration with React Native Maps
- Using React Native Maps for the mobile app version
- Tracking user's location in real-time during workouts
- Storing routes for offline viewing
- Sharing routes with friends and on social media