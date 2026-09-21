import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  Polygon,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import * as turf from '@turf/turf';
import '../plugins/L.Graticule';

const OPENCAGE_API_KEY = '***REMOVED***';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

function SetMapRef({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

async function fetchLocationName(lat, lng, setLocationName) {
  try {
    const res = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`
    );
    const data = await res.json();
    const name = data.results[0]?.formatted || 'Unknown location';
    setLocationName(name);
  } catch {
    setLocationName('Failed to fetch location');
  }
}

export default function MapDisplay({
  mapRef,
  markerPosition,
  setMarkerPosition,
  locationName,
  setLocationName,
  setLatitude,
  setLongitude,
  polygonPoints = [],
  centroid = null,
  setPolygonPoints = () => {},
  setArea = () => {}
}) {
  const markerRef = useRef();
  const editablePolygonRef = useRef(null);
  const popupRef = useRef();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Add click handler only once
    const handleMapClick = async (e) => {
      // Prevent placing marker if drawing polygon
      if (map.pm.globalDrawModeEnabled()) return;

      const { lat, lng } = e.latlng;
      const newPos = [lat, lng];
      setMarkerPosition(newPos);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      await fetchLocationName(lat, lng, setLocationName);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      const map = mapRef.current;
      if (!map || !map.pm) return;

      if (!map._geomanControlsAdded) {
        map.pm.addControls({
          position: 'topleft',
          drawPolygon: false,
          drawMarker: false,
          drawPolyline: false,
          drawCircle: false,
          drawCircleMarker: false,
          drawRectangle: false,
          editMode: true,
          dragMode: false,
          cutPolygon: true,
          removalMode: true,
        });
        map._geomanControlsAdded = true;

        map.on('pm:create', (e) => {
          const layer = e.layer;
          editablePolygonRef.current = layer;

          const geojson = layer.toGeoJSON();
          const area = turf.area(geojson).toFixed(2);
          setArea(area);

          const coords = geojson.geometry.coordinates[0];
          const lngLatPairs = coords.map(([lng, lat]) => [lng, lat]);
          setPolygonPoints(lngLatPairs);

          map.pm.disableDraw('Polygon');
        });

        map.on('pm:edit', (e) => {
          e.layers.eachLayer((layer) => {
            const geojson = layer.toGeoJSON();
            const area = turf.area(geojson).toFixed(2);
            setArea(area);

            const coords = geojson.geometry.coordinates[0];
            const lngLatPairs = coords.map(([lng, lat]) => [lng, lat]);
            setPolygonPoints(lngLatPairs);
          });
        });
      }

      clearInterval(interval);
    }, 500);

    return () => clearInterval(interval);
  }, [mapRef]);

  const onMarkerDragEnd = async () => {
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      const newPos = [latlng.lat, latlng.lng];
      setMarkerPosition(newPos);
      setLatitude(latlng.lat.toFixed(6));
      setLongitude(latlng.lng.toFixed(6));
      await fetchLocationName(latlng.lat, latlng.lng, setLocationName);
    }
  };

  // Auto-open popup when marker is placed
  useEffect(() => {
    if (markerRef.current && markerPosition) {
      const marker = markerRef.current;
      marker.openPopup();
    }
  }, [markerPosition, locationName]);

  function ClickToSetMarker({
    mapRef,
    setMarkerPosition,
    setLatitude,
    setLongitude,
    setLocationName,
    polygonPoints
  }) {
    useMapEvents({
      click: async (e) => {
        const map = mapRef.current;

        // Don't place marker if currently drawing a polygon
        if (map && map.pm && map.pm.globalDrawModeEnabled()) return;

        // Ignore click if there's an existing polygon (optional)
        if (polygonPoints.length >= 3) return;

        const { lat, lng } = e.latlng;
        const newPos = [lat, lng];
        setMarkerPosition(newPos);
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        await fetchLocationName(lat, lng, setLocationName);
      }
    });

    return null;
  }

  return (
    <MapContainer
      center={[12.8797, 121.7740]}
      zoom={5.5}
      style={{ height: '100%', width: '100%' }}
    >
      <SetMapRef mapRef={mapRef} />
      <ClickToSetMarker
        mapRef={mapRef}
        setMarkerPosition={setMarkerPosition}
        setLatitude={setLatitude}
        setLongitude={setLongitude}
        setLocationName={setLocationName}
        polygonPoints={polygonPoints}
      />


      <LayersControl position="bottomleft">
        <LayersControl.BaseLayer checked name="3D Terrain (Esri)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="2D Map (OSM)">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="OpenStreetMap"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

             {markerPosition && (
         <Marker
           position={markerPosition}
           draggable={true}
           ref={markerRef}
           eventHandlers={{ dragend: onMarkerDragEnd }}
         >
           <Popup 
             ref={popupRef}
             position={markerPosition}
             closeButton={true}
             autoClose={false}
             closeOnClick={false}
             className="custom-popup"
           >
             <div style={{ minWidth: '200px', padding: '8px' }}>
               <strong>{locationName || 'Loading location...'}</strong><br />
               <strong>Latitude:</strong> {markerPosition[0].toFixed(5)} <br />
               <strong>Longitude:</strong> {markerPosition[1].toFixed(5)}
             </div>
           </Popup>
         </Marker>
       )}

      {polygonPoints.length >= 3 && (
        <Polygon
          positions={polygonPoints.map(([lng, lat]) => [lat, lng])}
          pathOptions={{ color: 'blue', fillOpacity: 0.3 }}
        />
      )}

      {centroid && (
        <Marker
          position={centroid}
          icon={L.divIcon({
            className: 'centroid-marker',
            html: '<div style="background: orange; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>',
          })}
        />
      )}
    </MapContainer>
  );
}
