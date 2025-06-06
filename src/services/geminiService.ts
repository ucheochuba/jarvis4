import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Gemini API key is not configured');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface DetectionResult {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  label: string;
}

const parseBox2D = (box2d: number[]): DetectionResult['boundingBox'] => {
  // box2d format: [x1, y1, x2, y2]
  return {
    x: box2d[0],
    y: box2d[1],
    width: box2d[2] - box2d[0],
    height: box2d[3] - box2d[1]
  };
};

const normalizeDetection = (detection: any): DetectionResult | null => {
  try {
    // Handle box_2d format
    if (detection.box_2d) {
      return {
        boundingBox: parseBox2D(detection.box_2d),
        confidence: 0.8, // Default confidence for box_2d format
        label: detection.label
      };
    }

    // Handle standard format
    if (detection.boundingBox) {
      return {
        boundingBox: {
          x: Number(detection.boundingBox.x),
          y: Number(detection.boundingBox.y),
          width: Number(detection.boundingBox.width),
          height: Number(detection.boundingBox.height)
        },
        confidence: Number(detection.confidence || 0.8),
        label: detection.label
      };
    }

    return null;
  } catch (error) {
    console.error('Error normalizing detection:', error);
    return null;
  }
};

export const detectPeople = async (imageData: string): Promise<DetectionResult[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      },
      `Detect people in this image. Return a JSON array of detections. Each detection should have either:
      1. A "boundingBox" object with "x", "y", "width", "height" and "confidence" values, or
      2. A "box_2d" array with [x1, y1, x2, y2] coordinates.
      Include a "label" field with value "person" for each detection.
      Return ONLY the JSON array, no other text.`
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Log the raw response for debugging
    console.log('Raw Gemini response:', text);
    
    try {
      // Handle empty array response
      if (text.trim() === '[]') {
        return [];
      }

      // Handle text responses
      if (text.toLowerCase().includes('did not find any people')) {
        return [];
      }

      // Try to clean the response text before parsing
      const cleanedText = text.trim()
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '')
        .replace(/^\[/, '[')
        .replace(/\]$/, ']');

      const detections = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!Array.isArray(detections)) {
        console.error('Invalid response format: not an array');
        return [];
      }
      
      // Normalize and filter detections
      return detections
        .map(normalizeDetection)
        .filter((detection): detection is DetectionResult => 
          detection !== null && 
          detection.label === 'person' &&
          detection.confidence > 0.5
        );
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response text:', text);
      return [];
    }
  } catch (error) {
    console.error('Error detecting people with Gemini:', error);
    throw error;
  }
}; 