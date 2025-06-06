import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Paper, Typography } from '@mui/material';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTechnicians, Technician } from '../services/technicianService';
import { useTheme } from '@mui/material/styles';

// Create a custom pulsing marker
const createPulsingIcon = (color: string) => {
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
    background: white;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 1px solid #ddd;
  }

  .speech-bubble:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 10px 10px 0;
    border-style: solid;
    border-color: white transparent transparent;
  }

  .leaflet-popup {
    margin-bottom: 30px !important;
  }
`;
document.head.appendChild(style);

const GeoFeed: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const theme = useTheme();

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
    <Box sx={{ width: '100%', height: '100%', position: 'relative', p: 2, boxSizing: 'border-box' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
        Technician Geo-location Feed
      </Typography>
      <Paper elevation={4} sx={{ width: '100%', height: 'calc(100% - 48px)', overflow: 'hidden', borderRadius: 2 }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {technicians.map((technician) => (
            <React.Fragment key={technician.id}>
              <Marker
                position={[technician.location.latitude, technician.location.longitude]}
                icon={createPulsingIcon(theme.palette.primary.main)}
              >
                <Popup
                  position={[technician.location.latitude, technician.location.longitude]}
                  closeButton={false}
                  autoPan={false}
                  className="speech-bubble"
                  offset={[0, -25]}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5, color: 'primary.dark' }}>
                    {technician.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Status: {technician.status}
                  </Typography>
                  {technician.summary && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {technician.summary}
                    </Typography>
                  )}
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </Paper>
    </Box>
  );
};

export default GeoFeed; 