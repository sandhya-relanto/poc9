import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  console.log('Fetching available voices...');

  if (!apiKey || apiKey === 'your_key_here') {
    console.error('ERROR: API Key is missing.');
    return;
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.elevenlabs.io/v1/voices`,
      headers: {
        'xi-api-key': apiKey,
      },
    });

    console.log('--- AVAILABLE VOICES ---');
    response.data.voices.slice(0, 10).forEach((v: any) => {
      console.log(`- ${v.name}: ${v.voice_id} (Category: ${v.category})`);
    });
    console.log('------------------------');
  } catch (error: any) {
    const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error('FAILED:', msg);
  }
}

listVoices();
