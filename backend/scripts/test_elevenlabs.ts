import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testTTS() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = 'EXAVITOxlAnEFE0Cwd44'; // Use Bella (Standard Pre-made)
  
  console.log('Testing ElevenLabs...');
  console.log('API Key detected:', apiKey ? 'YES (starts with ' + apiKey.substring(0, 5) + '...)' : 'NO');

  if (!apiKey || apiKey === 'your_key_here') {
    console.error('ERROR: API Key is missing or default.');
    return;
  }

  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      data: {
        text: "Hello, this is a test of the Eleven Labs voice system.",
        model_id: 'eleven_multilingual_v2',
      },
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    console.log('SUCCESS! Received audio buffer of size:', response.data.byteLength);
  } catch (error: any) {
    const msg = error.response?.data ? Buffer.from(error.response.data).toString() : error.message;
    console.error('FAILED:', msg);
  }
}

testTTS();
