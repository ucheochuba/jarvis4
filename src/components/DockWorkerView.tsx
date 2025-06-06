import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { detectPeople, DetectionResult } from '../services/geminiService';

const DETECTION_INTERVAL = 2000; // 2 seconds between detections
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_IMAGE_SIZE = 640; // Maximum dimension for the image

const DockWorkerView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const detectionTimeoutRef = useRef<number>();

  const drawDetections = useCallback((detections: DetectionResult[]) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw each detection
    detections.forEach(detection => {
      const { boundingBox, confidence, label } = detection;
      
      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        boundingBox.x,
        boundingBox.y,
        boundingBox.width,
        boundingBox.height
      );

      // Draw label background
      const labelText = `${label} ${Math.round(confidence * 100)}%`;
      ctx.font = '16px Arial';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fillRect(
        boundingBox.x,
        boundingBox.y - 20,
        textWidth + 10,
        20
      );

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(
        labelText,
        boundingBox.x + 5,
        boundingBox.y - 5
      );
    });
  }, []);

  const detectPeopleInFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;

    const now = Date.now();
    if (now - lastDetectionTimeRef.current < DETECTION_INTERVAL) {
      return;
    }

    try {
      lastDetectionTimeRef.current = now;
      setError(null);

      // Create a temporary canvas to capture the video frame
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Set temp canvas size to match video
      tempCanvas.width = videoRef.current.videoWidth;
      tempCanvas.height = videoRef.current.videoHeight;

      // Draw current video frame to temp canvas
      tempCtx.drawImage(
        videoRef.current,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );

      // Get image data as base64
      const imageData = tempCanvas.toDataURL('image/jpeg', 0.7)
        .replace('data:image/jpeg;base64,', '');

      // Detect people
      const detections = await detectPeople(imageData);
      
      // Update detection count
      setDetectionCount(detections.length);
      
      // Draw detections on the main canvas
      drawDetections(detections);
      
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      console.error('Error detecting people:', error);
      
      // Implement retry logic
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        detectionTimeoutRef.current = window.setTimeout(
          detectPeopleInFrame,
          RETRY_DELAY * retryCountRef.current
        );
      } else {
        setError('Error detecting people. Please try again.');
        retryCountRef.current = 0;
      }
    }
  }, [drawDetections, isDetecting]);

  // Start detection loop
  const startDetectionLoop = useCallback(() => {
    if (!isDetecting) return;

    detectPeopleInFrame();
    detectionTimeoutRef.current = window.setTimeout(startDetectionLoop, DETECTION_INTERVAL);
  }, [detectPeopleInFrame, isDetecting]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      setIsDetecting(true);
      startDetectionLoop();
    };

    video.addEventListener('loadeddata', handleVideoReady);

    return () => {
      video.removeEventListener('loadeddata', handleVideoReady);
      if (detectionTimeoutRef.current) {
        window.clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [startDetectionLoop]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        src="/forklift.mov"
        autoPlay
        loop
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      {isDetecting && (
        <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="white" sx={{ textShadow: '0 0 4px rgba(0,0,0,0.5)' }}>
            Detecting people... ({detectionCount} found)
          </Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 16, left: 16, right: 16 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default DockWorkerView; 