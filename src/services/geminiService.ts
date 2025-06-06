import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Initialize genAI only if API key is available
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const systemInstruction = 'You are a helpful AI assistant speaking to a technician who is on-site. Your goal is to help them work safely and efficiently. Respond in one sentence or less. Address the technician directly using "you".';

export const analyzeScene = async (imageData: string, prompt: string): Promise<string> => {
  if (!API_KEY || !genAI) {
    throw new Error('Gemini API key is not configured in environment variables. Please add REACT_APP_GEMINI_API_KEY to your .env file.');
  }

  console.log('Making Gemini API request to analyze scene...');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction });

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

export const continueConversation = async (history: string[], newPrompt: string): Promise<string> => {
  if (!API_KEY || !genAI) {
    throw new Error('Gemini API key is not configured in environment variables. Please add REACT_APP_GEMINI_API_KEY to your .env file.');
  }

  console.log('Continuing conversation with Gemini...');

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction });
    
    const chat = model.startChat({
      history: history.map((content, i) => ({
        role: i % 2 === 0 ? 'user' : 'model',
        parts: [{ text: content }],
      })),
    });

    const result = await chat.sendMessage(newPrompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API response:', text);

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}; 