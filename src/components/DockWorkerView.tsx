import React, { useRef, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, TextField } from '@mui/material';
import { analyzeScene } from '../services/geminiService';
import { speakWithElevenLabs } from '../services/elevenLabsService';

const DockWorkerView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeScene = async () => {
    if (!videoRef.current) {
      return;
    }

    const elevenLabsApiKey = process.env.REACT_APP_ELEVEN_LABS_API_KEY;
    if (!elevenLabsApiKey) {
      setError('ElevenLabs API key is not configured in .env file.');
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    setError(null);

    try {
      const video = videoRef.current;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        throw new Error('Could not get canvas context');
      }

      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      const imageData = tempCanvas.toDataURL('image/jpeg').replace('data:image/jpeg;base64,', '');
      
      const result = await analyzeScene(imageData);
      setAnalysis(result);
      await speakWithElevenLabs(result, elevenLabsApiKey);

    } catch (err) {
      console.error('Analysis or speech error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes sweep {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
      <video
        ref={videoRef}
        src="/electrician.mov"
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {isLoading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 120, 255, 0.3)',
          zIndex: 15,
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            background: 'linear-gradient(to right, rgba(0, 120, 255, 0.1) 0%, rgba(0, 120, 255, 0.5) 50%, rgba(0, 120, 255, 0.1) 100%)',
            animation: 'sweep 2s infinite linear',
            zIndex: 16
          }}/>
        </Box>
      )}
      <Box sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2
      }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAnalyzeScene}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Analyze Scene'}
        </Button>
        {analysis && (
          <Alert severity="info" sx={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
            <Typography variant="body1">{analysis}</Typography>
          </Alert>
        )}
        {error && (
          <Alert severity="error">{error}</Alert>
        )}
      </Box>
    </Box>
  );
};

export default DockWorkerView; 