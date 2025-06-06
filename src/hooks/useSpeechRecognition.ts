import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
}

export const useSpeechRecognition = ({ onResult, onError }: SpeechRecognitionOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      onError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      setPermissionGranted(true);
      isManuallyStoppedRef.current = false;
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      
      // If it wasn't manually stopped and we're still supposed to be recording,
      // restart it (this handles cases where the API stops unexpectedly)
      if (!isManuallyStoppedRef.current && recognitionRef.current) {
        console.log('Recognition ended unexpectedly, not restarting');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      isManuallyStoppedRef.current = true;
      
      // Handle specific error types
      switch (event.error) {
        case 'not-allowed':
          onError('Microphone access denied. Please enable microphone permissions and try again.');
          setPermissionGranted(false);
          break;
        case 'no-speech':
          onError('No speech detected. Please try speaking again.');
          break;
        case 'network':
          onError('Network error occurred. Please check your internet connection.');
          break;
        case 'aborted':
          // Don't show error for manual abort
          break;
        default:
          onError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      
      if (event.results[0].isFinal) {
        console.log('Final transcript:', transcript);
        onResult(transcript);
        // Auto-stop after getting a result
        if (recognitionRef.current && isRecording) {
          console.log('Auto-stopping after result');
          isManuallyStoppedRef.current = true;
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.warn('Error stopping recognition after result:', error);
            setIsRecording(false);
          }
        }
      }
    };

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.warn('Error stopping recognition during cleanup:', error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onResult, onError]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      onError('Microphone access denied. Please enable microphone permissions in your browser settings.');
      setPermissionGranted(false);
      return false;
    }
  };

  const startListening = async () => {
    if (!isSupported) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      console.log('Already recording, ignoring start request');
      return;
    }

    // Request microphone permission if not already granted
    if (!permissionGranted) {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        return;
      }
    }

    try {
      console.log('Starting speech recognition...');
      isManuallyStoppedRef.current = false;
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError('Failed to start speech recognition. Please try again.');
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    console.log('Stop listening called, isRecording:', isRecording);
    
    // Always try to stop and reset state, even if we think we're not recording
    isManuallyStoppedRef.current = true;
    setIsRecording(false);
    
    if (recognitionRef.current) {
      try {
        console.log('Stopping speech recognition...');
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  return {
    isRecording,
    isSupported,
    permissionGranted,
    startListening,
    stopListening,
  };
}; 