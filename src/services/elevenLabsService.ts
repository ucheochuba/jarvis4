const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

export const speakWithElevenLabs = async (text: string, apiKey: string): Promise<void> => {
  if (!apiKey) {
    throw new Error('ElevenLabs API key is not provided.');
  }

  const url = `${ELEVENLABS_API_URL}/${DEFAULT_VOICE_ID}`;
  
  const headers = {
    'Accept': 'audio/mpeg',
    'Content-Type': 'application/json',
    'xi-api-key': apiKey,
  };

  const body = JSON.stringify({
    text: text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Wrap the play() call in a promise to handle potential interruptions
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error:', e);
        reject(new Error('Audio playback failed.'));
      };
      audio.play().catch(reject);
    });

  } catch (error) {
    console.error('Error with ElevenLabs API:', error);
    throw error;
  }
}; 