import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Tabs, Tab } from '@mui/material';
import { analyzeVideoFrames } from '../services/api';
import { analyzeTechnicianVideo } from '../services/technicianService';
import logger from '../services/logger';
import GeoFeed from './GeoFeed';
import ElectricalWorkView from './ElectricalWorkView';
import FluxCapacitorView from './FluxCapacitorView';

interface VideoFrameProps {
  videoSrc: string;
  technicianId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const VideoFrame: React.FC<VideoFrameProps> = ({ videoSrc, technicianId, videoRef }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [summary, setSummary] = useState<string>('Analyzing video...');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging for video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    logger.info(`[${technicianId}] Setting up video event listeners`);

    const events = [
      'loadstart',
      'durationchange',
      'loadedmetadata',
      'loadeddata',
      'canplay',
      'canplaythrough',
      'play',
      'playing',
      'pause',
      'ended',
      'error'
    ];

    events.forEach(event => {
      video.addEventListener(event, () => {
        logger.info(`[${technicianId}] Video event: ${event}`, {
          duration: video.duration,
          currentTime: video.currentTime,
          readyState: video.readyState,
          error: video.error
        });
      });
    });

    return () => {
      events.forEach(event => {
        video.removeEventListener(event, () => {});
      });
    };
  }, [technicianId, videoRef]);

  const captureAndAnalyzeFrames = useCallback(async (video: HTMLVideoElement) => {
    if (!video) {
      logger.error(`[${technicianId}] No video element available`);
      return;
    }

    // Wait for video to be ready
    if (video.readyState < 2) {
      logger.info(`[${technicianId}] Waiting for video to be ready...`);
      await new Promise<void>((resolve) => {
        const handleCanPlay = () => {
          video.removeEventListener('canplay', handleCanPlay);
          resolve();
        };
        video.addEventListener('canplay', handleCanPlay);
      });
    }

    // Check if video has a valid source
    if (!video.src && !video.srcObject) {
      logger.error(`[${technicianId}] No video source available`);
      return;
    }

    const canvas = document.createElement('canvas');
    // Set canvas size to match video dimensions while maintaining aspect ratio
    const aspectRatio = video.videoWidth / video.videoHeight;
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.round(canvas.width / aspectRatio);
    
    const context = canvas.getContext('2d');

    if (!context) {
      logger.error(`[${technicianId}] Could not get canvas context`);
      return;
    }

    try {
      // Capture current frame with proper scaling
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to JPEG with quality 0.8 for better quality while maintaining reasonable size
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Extract base64 data from the data URL
      const base64Data = imageData.split(',')[1];
      
      // Log the image data for debugging
      logger.info(`[${technicianId}] Captured frame at ${video.currentTime.toFixed(2)}s`, {
        dimensions: `${canvas.width}x${canvas.height}`,
        dataUrlLength: imageData.length,
        dataUrlPrefix: imageData.substring(0, 50) + '...',
        videoDimensions: `${video.videoWidth}x${video.videoHeight}`,
        videoReadyState: video.readyState
      });

      // Analyze single frame and update both local state and technician service
      setIsAnalyzing(true);
      await analyzeTechnicianVideo(technicianId, base64Data);
      const analysis = await analyzeVideoFrames([base64Data], { technicianId });
      setSummary(analysis.trim());
    } catch (error) {
      logger.error(`[${technicianId}] Error analyzing frame:`, error);
      setSummary('Error analyzing video. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [technicianId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      logger.info(`[${technicianId}] Video ready, starting analysis`);
      // Start initial analysis after a short delay to ensure video is playing
      setTimeout(() => {
        captureAndAnalyzeFrames(video);
      }, 1000);
    };

    // Set up periodic analysis
    const startPeriodicAnalysis = () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }

      analysisIntervalRef.current = setInterval(() => {
        logger.info(`[${technicianId}] Starting periodic analysis`);
        captureAndAnalyzeFrames(video);
      }, 10000); // Analyze every 10 seconds
    };

    // Start analysis when video is ready
    if (video.readyState >= 2) {
      handleVideoReady();
    } else {
      video.addEventListener('canplay', handleVideoReady);
    }

    // Start periodic analysis
    startPeriodicAnalysis();

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      video.removeEventListener('canplay', handleVideoReady);
    };
  }, [technicianId, videoRef, captureAndAnalyzeFrames]);

  const handleClick = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      logger.error('Error toggling fullscreen:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '600px', margin: 'auto' }}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="body1" sx={{ flex: 1, whiteSpace: 'pre-wrap' }}>
          {summary}
        </Typography>
        {isAnalyzing && <CircularProgress size={24} color="primary" />}
      </Paper>
      <Paper
        ref={containerRef}
        elevation={3}
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            filter: 'brightness(1.1)',
            transition: 'filter 0.3s ease'
          }
        }}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          autoPlay
          loop
          muted
          playsInline
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 1,
            fontWeight: 'bold',
          }}
        >
          {technicianId}
        </Typography>
      </Paper>
    </Box>
  );
};

const MentorView: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname.includes('/technician') ? 1 : 0);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setActiveSubTab(0); // Reset sub-tab when main tab changes
  };

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveSubTab(newValue);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
        {activeTab === 0 ? 'Mentor Dashboard' : 'Technician View'}
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered indicatorColor="primary" textColor="primary">
          <Tab label="Mentor" />
          <Tab label="Technician" />
        </Tabs>
      </Box>
      {activeTab === 0 && (
        <Box sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
          <Tabs value={activeSubTab} onChange={handleSubTabChange} centered indicatorColor="secondary" textColor="secondary">
            <Tab label="Live Feed" />
            <Tab label="Geo Feed" />
          </Tabs>
          {activeSubTab === 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 4,
                p: 2,
                boxSizing: 'border-box',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <VideoFrame videoSrc="/mechanic.mov" technicianId="Technician 42" videoRef={videoRef1} />
              <VideoFrame videoSrc="/mechanic2.mov" technicianId="Technician 43" videoRef={videoRef2} />
            </Box>
          )}
          {activeSubTab === 1 && <GeoFeed />}
        </Box>
      )}
      {activeTab === 1 && (
        <Box sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
          <Tabs value={activeSubTab} onChange={handleSubTabChange} centered indicatorColor="secondary" textColor="secondary">
            <Tab label="Electrical Work" />
            <Tab label="Flux Capacitor" />
          </Tabs>
          {activeSubTab === 0 && <ElectricalWorkView />}
          {activeSubTab === 1 && <FluxCapacitorView />}
        </Box>
      )}
    </Box>
  );
};

export default MentorView; 