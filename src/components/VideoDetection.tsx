import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const VideoDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectionCount, setDetectionCount] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading YOLOv8 model...');
        // Load the YOLOv8 model
        const loadedModel = await tf.loadGraphModel('https://tfhub.dev/tensorflow/tfjs-model/yolov8n/1/default/1');
        console.log('Model loaded successfully');
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };

    loadModel();
  }, []);

  const detectObjects = async () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === 4 &&
      model &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Prepare the image for the model
        const image = tf.browser.fromPixels(video);
        const resized = tf.image.resizeBilinear(image, [640, 640]);
        const expanded = resized.expandDims(0);
        const normalized = expanded.div(255.0);

        // Run detection
        const predictions = await model.predict(normalized) as tf.Tensor;
        const boxes = await predictions.array() as number[][][];

        // Clean up tensors
        tf.dispose([image, resized, expanded, normalized, predictions]);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Process detections
        let personCount = 0;
        const detections = boxes[0];
        
        for (let i = 0; i < detections.length; i++) {
          const [x1, y1, x2, y2, confidence, classId] = detections[i];
          
          // Only process if confidence is high enough and it's a person (class 0)
          if (confidence > 0.5 && classId === 0) {
            personCount++;
            
            // Convert normalized coordinates to pixel coordinates
            const width = x2 - x1;
            const height = y2 - y1;
            const x = x1 * canvas.width;
            const y = y1 * canvas.height;
            
            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width * canvas.width, height * canvas.height);

            // Draw label
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(
              `Person ${Math.round(confidence * 100)}%`,
              x,
              y > 20 ? y - 5 : y + 20
            );
          }
        }
        
        setDetectionCount(personCount);
      } catch (error) {
        console.error('Error during detection:', error);
      }

      // Continue detection loop if video is playing
      if (!video.paused) {
        requestAnimationFrame(detectObjects);
      }
    }
  };

  useEffect(() => {
    if (!isModelLoading && model && videoRef.current) {
      console.log('Starting detection loop');
      videoRef.current.play().then(() => {
        detectObjects();
      }).catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, [isModelLoading, model]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <video
        ref={videoRef}
        src="/forklift.mov"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        loop
        muted
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />
      {isModelLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 2
        }}>
          Loading YOLOv8 model...
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 2
      }}>
        People detected: {detectionCount}
      </div>
    </div>
  );
};

export default VideoDetection; 