import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Custom pin icon for better visibility
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: #ff4444;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          color: white;
          font-size: 16px;
          font-weight: bold;
          transform: rotate(45deg);
          margin-top: -2px;
        ">📍</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// Component to handle map events
function MapEventHandler({ onPinDrag, pinPosition }) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onPinDrag([lat, lng]);
    }
  });

  // Update map view when pin position changes
  useEffect(() => {
    if (pinPosition) {
      map.setView(pinPosition, map.getZoom());
    }
  }, [pinPosition, map]);

  return null;
}

// Draggable marker component
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef();

  const eventHandlers = {
    dragend: () => {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        onDragEnd([lat, lng]);
      }
    }
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
      icon={createCustomPinIcon()}
    />
  );
}

const DraggablePinMap = ({ pinPosition, onPinDrag, height = '400px' }) => {
  const mapRef = useRef();

  // Default to Philippines center if no position provided
  const center = pinPosition || [12.8797, 121.7740];

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEventHandler 
          onPinDrag={onPinDrag} 
          pinPosition={pinPosition}
        />
        
        {pinPosition && (
          <DraggableMarker
            position={pinPosition}
            onDragEnd={onPinDrag}
          />
        )}
      </MapContainer>
      
      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
        zIndex: 1000,
        textAlign: 'center'
      }}>
        📍 Click anywhere on the map or drag the pin to select your location
      </div>
      
      {/* Coordinates display */}
      {pinPosition && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          Lat: {pinPosition[0].toFixed(6)}<br/>
          Lng: {pinPosition[1].toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default DraggablePinMap;
