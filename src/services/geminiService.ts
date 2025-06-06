import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Gemini API key is not configured');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeScene = async (imageData: string): Promise<string> => {
  console.log('Making Gemini API request to analyze scene...');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = 'You are speaking to a technician. In one sentence or less, tell them what they need to be careful of or aware of in this scene. Address them directly using "you".';

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('Gemini API response:', text);

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}; 