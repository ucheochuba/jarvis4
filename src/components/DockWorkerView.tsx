import React, { useRef, useState, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';
import { analyzeScene, continueConversation } from '../services/geminiService';
import { speakWithElevenLabs } from '../services/elevenLabsService';
import { useSpeechRecognition } from '../hooks';

const DANGEROUS_SCENE_PROMPT = "What's dangerous in the scene?";

const DockWorkerView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [initialAnalysisDone, setInitialAnalysisDone] = useState(false);

  const handleContinueConversation = useCallback(async (prompt: string) => {
    const elevenLabsApiKey = process.env.REACT_APP_ELEVEN_LABS_API_KEY;
    if (!elevenLabsApiKey) {
      setError('ElevenLabs API key is not configured. Speech responses will not work, but recording is still available.');
      // Continue without speech synthesis
    }

    setIsProcessing(true);
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await continueConversation(conversationHistory, prompt);
      setIsAnalyzing(false);
      setAnalysis(result);
      setConversationHistory(prev => [...prev, prompt, result]);
      
      // Only try to speak if API key is available
      if (elevenLabsApiKey) {
        try {
          await speakWithElevenLabs(result, elevenLabsApiKey);
        } catch (speechError) {
          console.warn('Speech synthesis failed:', speechError);
          // Don't show error to user, just log it
        }
      }
    } catch (err) {
      console.error('Conversation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      setIsAnalyzing(false);
    } finally {
      setIsProcessing(false);
    }
  }, [conversationHistory]);

  const handleSpeechResult = useCallback((text: string) => {
    // If no initial analysis is done yet, perform it first
    if (!initialAnalysisDone) {
      setError('Please analyze the scene first before asking questions.');
      return;
    }
    handleContinueConversation(text);
  }, [initialAnalysisDone, handleContinueConversation]);

  const { isRecording, isSupported, permissionGranted, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: setError,
  });

  const handleAnalyzeScene = async () => {
    if (!videoRef.current) {
      return;
    }

    const elevenLabsApiKey = process.env.REACT_APP_ELEVEN_LABS_API_KEY;
    if (!elevenLabsApiKey) {
      setError('ElevenLabs API key is not configured. Analysis will work, but speech responses will not.');
      // Continue without speech synthesis
    }

    setIsProcessing(true);
    setIsAnalyzing(true);
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
      
      const result = await analyzeScene(imageData, DANGEROUS_SCENE_PROMPT);
      setIsAnalyzing(false);
      setAnalysis(result);
      setInitialAnalysisDone(true);
      setConversationHistory([`${DANGEROUS_SCENE_PROMPT}\n${result}`]);
      
      // Only try to speak if API key is available
      if (elevenLabsApiKey) {
        try {
          await speakWithElevenLabs(result, elevenLabsApiKey);
        } catch (speechError) {
          console.warn('Speech synthesis failed:', speechError);
          // Don't show error to user, just log it
        }
      }

    } catch (err) {
      console.error('Analysis or speech error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      setIsAnalyzing(false);
    } finally {
      setIsProcessing(false);
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
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
            }
            70% {
              transform: scale(1.05);
              box-shadow: 0 0 10px 20px rgba(255, 82, 82, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
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
      {isAnalyzing && (
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
          disabled={isProcessing}
        >
          {isProcessing ? <CircularProgress size={24} /> : 'Analyze Scene'}
        </Button>
        {error && (
          <Alert severity="error" sx={{ animation: 'fadeIn 0.5s' }}>{error}</Alert>
        )}
      </Box>
      <Box sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '12px',
        borderRadius: '8px',
      }}>
        {isRecording ? (
          <Button 
            variant="contained" 
            color="error" 
            onClick={stopListening}
            size="large"
            sx={{
              animation: 'pulse 1.5s infinite'
            }}
            startIcon={<MicOff />}
          >
            Stop Recording
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color={initialAnalysisDone ? "primary" : "warning"}
            onClick={startListening}
            disabled={isProcessing || !isSupported}
            size="large"
            startIcon={<Mic />}
          >
            {!isSupported ? 'Recording Not Supported' :
             !permissionGranted ? 'Enable Microphone' :
             initialAnalysisDone ? 'Start Recording' : 'Start Recording (Analyze scene first for questions)'}
          </Button>
        )}
        
        {isRecording && <Typography variant="caption" sx={{color: 'white'}}>🎤 Listening for your question...</Typography>}
        
        {/* Status info */}
        <Typography variant="caption" sx={{color: 'white', fontSize: '10px'}}>
          Mic: {isSupported ? (permissionGranted ? '✓' : '❌') : 'Not supported'} | 
          Analysis: {initialAnalysisDone ? '✓' : '❌'}
        </Typography>
        
        {!isSupported && (
          <Typography variant="caption" sx={{color: 'orange', fontSize: '11px'}}>
            Speech recognition requires Chrome, Safari, or Edge
          </Typography>
        )}
        
        {isSupported && !permissionGranted && (
          <Typography variant="caption" sx={{color: 'orange', fontSize: '11px'}}>
            Click "Enable Microphone" to start recording
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DockWorkerView; 