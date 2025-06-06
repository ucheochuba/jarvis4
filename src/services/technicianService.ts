import logger from './logger';
import { analyzeVideoFrames } from './api';

export interface Technician {
  id: string;
  name: string;
  location: {
    longitude: number;
    latitude: number;
  };
  summary: string;
  videoSrc: string;
  status: string;
}

// This would typically come from your backend API
const sampleTechnicians: Technician[] = [
  {
    id: '42',
    name: 'Technician 42',
    location: {
      longitude: -122.4194,
      latitude: 37.7749
    },
    summary: '',
    videoSrc: '/mechanic.mov',
    status: 'Junior Mechanic'
  },
  {
    id: '43',
    name: 'Technician 43',
    location: {
      longitude: -122.4313,
      latitude: 37.7749
    },
    summary: '',
    videoSrc: '/electrician.mov',
    status: 'Apprentice Electrician'
  },
  // Additional technicians
  {
    id: '44',
    name: 'Technician 44',
    location: {
      longitude: -122.4064,
      latitude: 37.7858
    },
    summary: '',
    videoSrc: '',
    status: 'Senior Plumber'
  },
  {
    id: '45',
    name: 'Technician 45',
    location: {
      longitude: -122.4477,
      latitude: 37.7680
    },
    summary: '',
    videoSrc: '',
    status: 'HVAC Specialist'
  },
  {
    id: '46',
    name: 'Technician 46',
    location: {
      longitude: -122.4037,
      latitude: 37.7600
    },
    summary: '',
    videoSrc: '',
    status: 'Field Engineer'
  },
  {
    id: '47',
    name: 'Technician 47',
    location: {
      longitude: -122.4376,
      latitude: 37.8000
    },
    summary: '',
    videoSrc: '',
    status: 'Master Electrician'
  },
  {
    id: '48',
    name: 'Technician 48',
    location: {
      longitude: -122.4200,
      latitude: 37.7650
    },
    summary: '',
    videoSrc: '',
    status: 'Rookie Mechanic'
  },
  {
    id: '49',
    name: 'Technician 49',
    location: {
      longitude: -122.4100,
      latitude: 37.7800
    },
    summary: '',
    videoSrc: '',
    status: 'Maintenance Tech'
  },
  {
    id: '50',
    name: 'Technician 50',
    location: {
      longitude: -122.4500,
      latitude: 37.7700
    },
    summary: '',
    videoSrc: '',
    status: 'Journeyman Plumber'
  }
];

let currentTechnicians = [...sampleTechnicians];

export const getTechnicians = async (): Promise<Technician[]> => {
  try {
    // In a real application, this would be an API call
    // For now, we'll return the current technicians with their latest summaries
    return currentTechnicians;
  } catch (error) {
    logger.error('Error fetching technicians:', error);
    throw error;
  }
};

export const updateTechnicianSummary = async (technicianId: string, summary: string): Promise<void> => {
  try {
    // Update the technician's summary in our local state
    currentTechnicians = currentTechnicians.map(tech => 
      tech.id === technicianId ? { ...tech, summary } : tech
    );
    logger.info(`Updated summary for technician ${technicianId}:`, summary);
  } catch (error) {
    logger.error('Error updating technician summary:', error);
    throw error;
  }
};

export const updateTechnicianLocation = async (
  technicianId: string,
  location: { longitude: number; latitude: number }
): Promise<void> => {
  try {
    // Update the technician's location in our local state
    currentTechnicians = currentTechnicians.map(tech => 
      tech.id === technicianId ? { ...tech, location } : tech
    );
    logger.info(`Updated location for technician ${technicianId}:`, location);
  } catch (error) {
    logger.error('Error updating technician location:', error);
    throw error;
  }
};

// Function to analyze video frames and update technician summaries
export const analyzeTechnicianVideo = async (technicianId: string, imageData: string): Promise<void> => {
  try {
    const analysis = await analyzeVideoFrames([imageData], { technicianId });
    await updateTechnicianSummary(technicianId, analysis.trim());
  } catch (error) {
    logger.error(`Error analyzing video for technician ${technicianId}:`, error);
    throw error;
  }
}; 