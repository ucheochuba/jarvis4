import React, { useRef, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import Webcam from 'react-webcam';
import { analyzeScene } from '../services/geminiService';
import { speakWithElevenLabs } from '../services/elevenLabsService';

const FLUX_PROMPT = `This is a flux capacitor. A flux capacitor typically needs to have its LED connected to ground and pin 21. First, check carefully if the green LED is already illuminated. If the Green LED is off, what is wrong with what we currently have? Respond in the format: "you need to...". If the green LED is illuminated, respond seeing, it seems that the flux capacitor is fixed! great work.`;

const FluxCapacitorView: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [step, setStep] = useState<'upload'|'processing'|'webcam'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file drop/upload
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => setStep('webcam'), 4000);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Analyze scene logic
  const handleAnalyzeScene = async () => {
    setIsProcessing(true);
    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);
    try {
      // 1. Capture webcam screenshot
      const screenshot = webcamRef.current?.getScreenshot();
      if (!screenshot) throw new Error('Could not capture webcam image.');
      const webcamBase64 = screenshot.replace('data:image/jpeg;base64,', '').replace('data:image/png;base64,', '');
      // 2. Fetch flux_capacitor.jpg from public as base64
      const fluxImgResp = await fetch('/flux_capacitor.jpg');
      const fluxBlob = await fluxImgResp.blob();
      const fluxBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(fluxBlob);
      });
      // 3. Compose prompt and send to Gemini
      const prompt = `${FLUX_PROMPT}\n\nThe first image is a reference of a working flux capacitor. The second image is the one from the webcam.`;
      const result = await analyzeScene([fluxBase64, webcamBase64], prompt);
      setAnalysis(result);
      // 4. Speak with ElevenLabs (always try, even if not displayed)
      const elevenLabsApiKey = process.env.REACT_APP_ELEVEN_LABS_API_KEY;
      if (elevenLabsApiKey && result) {
        await speakWithElevenLabs(result, elevenLabsApiKey);
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsProcessing(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      {step === 'upload' && (
        <Paper
          elevation={4}
          sx={{ 
            width: 400, 
            height: 250, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: `2px dashed`,
            borderColor: 'primary.main',
            cursor: 'pointer', 
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>Add Institutional Knowledge</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Drag and drop a video here</Typography>
        </Paper>
      )}
      {step === 'processing' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <CircularProgress size={48} sx={{ mb: 3 }} color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>Processing Institutional Knowledge</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Please wait...</Typography>
        </Box>
      )}
      {step === 'webcam' && (
        <Box sx={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <style>{`
            @keyframes sweep {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
          <Box sx={{ position: 'relative', width: 900, height: 675, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              style={{ width: 900, height: 675, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              videoConstraints={{ facingMode: 'environment' }}
            />
            {isAnalyzing && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 900,
                height: 675,
                pointerEvents: 'none',
                zIndex: 20,
                overflow: 'hidden',
                borderRadius: 12,
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(to right, rgba(74, 124, 114, 0.1) 0%, rgba(74, 124, 114, 0.5) 50%, rgba(74, 124, 114, 0.1) 100%)',
                  animation: 'sweep 2s infinite linear',
                  zIndex: 21,
                  borderRadius: 12,
                }} />
              </Box>
            )}
          </Box>
          <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAnalyzeScene}
              disabled={isProcessing}
              sx={{ minWidth: 160, minHeight: 48, '&:hover': { backgroundColor: 'primary.dark' } }}
            >
              {isProcessing ? <CircularProgress size={24} color="inherit"/> : 'Analyze Scene'}
            </Button>
          </Box>
          {analysis && (
            <Paper elevation={4} sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)', maxWidth: 'calc(100% - 200px)', animation: 'fadeIn 0.5s' }}>
              <Typography variant="h6" gutterBottom color="primary.main">Analysis Result</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{analysis}</Typography>
            </Paper>
          )}
          {error && (
            <Alert severity="error" sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, minWidth: 320 }}>{error}</Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FluxCapacitorView; 