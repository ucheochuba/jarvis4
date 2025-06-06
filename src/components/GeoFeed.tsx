import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Paper, Typography } from '@mui/material';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTechnicians, Technician } from '../services/technicianService';

// Create a custom pulsing marker
const createPulsingIcon = (color: string = '#1976d2') => {
  return new DivIcon({
    className: 'custom-pulse-marker',
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
      ">
        <div style="
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: ${color};
          border-radius: 50%;
          opacity: 0.7;
          animation: pulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: ${color};
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Add the pulse animation to the document
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.3;
    }
    100% {
      transform: scale(1);
      opacity: 0.7;
    }
  }

  .speech-bubble {
    position: relative;
    background: #ffffff;
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .speech-bubble:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 10px 10px 0;
    border-style: solid;
    border-color: #ffffff transparent transparent;
  }

  .leaflet-popup {
    margin-bottom: 30px !important;
  }
`;
document.head.appendChild(style);

const GeoFeed: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const data = await getTechnicians();
        // Filter out the "Analyzing video..." text
        const updatedData = data.map(tech => ({
          ...tech,
          summary: tech.summary === 'Analyzing video...' ? '' : tech.summary
        }));
        setTechnicians(updatedData);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };

    fetchTechnicians();

    // Set up polling for updates
    const updateInterval = setInterval(fetchTechnicians, 10000); // Update every 10 seconds

    return () => clearInterval(updateInterval);
  }, []);

  // San Francisco coordinates
  const center = {
    lat: 37.7749,
    lng: -122.4194
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {technicians.map((technician) => (
          <React.Fragment key={technician.id}>
            <Marker
              position={[technician.location.latitude, technician.location.longitude]}
              icon={createPulsingIcon()}
            >
              <Popup
                position={[technician.location.latitude, technician.location.longitude]}
                closeButton={false}
                autoPan={false}
                className="speech-bubble"
                offset={[0, -125]}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {technician.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Status: {technician.status}
                </Typography>
                {technician.summary && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {technician.summary}
                  </Typography>
                )}
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </Box>
  );
};

export default GeoFeed; 