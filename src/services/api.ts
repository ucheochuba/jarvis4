import OpenAI from 'openai';

// Get API key from environment
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error('OpenAI API key is not configured');
}

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Required for browser usage
});

// Log API key status (without exposing the key)
console.log('OpenAI API key is configured');

interface AnalysisOptions {
  prompt?: string;
  technicianId?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeVideoFrames = async (imageDataArray: string[], options: AnalysisOptions = {}) => {
  const technicianId = options.technicianId || 'unknown';
  const prompt = options.prompt || 
    `Describe what you see in this image in 8 words or fewer. 
    Format your response exactly as: "Technician ${technicianId} is [action]"`;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`API Request (Attempt ${attempt}/${MAX_RETRIES}):`, {
        model: 'gpt-4.1-2025-04-14',
        prompt,
        imageCount: imageDataArray.length,
        hasApiKey: !!API_KEY
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an AI that observes technicians at work. Your responses must start with "Technician [ID] is" followed by a brief description of their current action. Never repeat the word "Technician" in your response.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageDataArray.map(imageData => ({
                type: 'image_url' as const,
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`,
                  detail: 'low' as const
                }
              }))
            ]
          }
        ],
        max_tokens: 300
      });

      console.log('API Response:', {
        status: 'success',
        data: response
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from API');
      }

      return content;
    } catch (error: any) {
      lastError = error;
      console.error(`API Error (Attempt ${attempt}/${MAX_RETRIES}):`, {
        message: error.message,
        type: error.type,
        code: error.code,
        hasApiKey: !!API_KEY
      });

      // Don't retry on certain errors
      if (error.type === 'invalid_request_error' || error.type === 'authentication_error') {
        throw error;
      }

      // If this wasn't the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
        continue;
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('All retry attempts failed');
}; 