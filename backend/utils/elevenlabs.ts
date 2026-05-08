import axios from 'axios';

/**
 * Generates audio from text using ElevenLabs API
 * Returns audio as a base64 string for immediate frontend playback
 */
export const generateSpeech = async (text: string, voiceId: string = 'Xb7hH8MSUJpSbSDYk0k2') => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    console.warn('[ElevenLabs] API Key missing, skipping TTS');
    return null;
  }

  try {
    console.log(`[ElevenLabs] Generating speech with voiceId: ${voiceId}`);
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      data: {
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    const base64 = Buffer.from(response.data).toString('base64');
    console.log(`[ElevenLabs] Successfully generated audio (${base64.length} chars)`);
    return base64;
  } catch (error: any) {
    const errorMsg = error.response?.data ? Buffer.from(error.response.data).toString() : error.message;
    console.error('[ElevenLabs] TTS Error:', errorMsg);
    return null;
  }
};
