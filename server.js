require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs').promises; // Use the promise-based functions
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.post('/webhook', upload.single('audio'), async (req, res) => {
    try {
        const audioFile = req.file.path;
        const transcription = await transcribeAudio(audioFile);

        await sendMessage(req.body.From, transcription);

        await fs.unlink(audioFile); // Use async unlink

        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        res.sendStatus(500);
    }
});

async function transcribeAudio(audioFile) {
    try {
        const audioBuffer = await fs.readFile(audioFile); // Use async readFile

        const response = await axios.post('https://speech.googleapis.com/v1p1beta1/speech:recognize', {
            audio: {
                content: audioBuffer.toString('base64')
            },
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`
            }
        });

        const transcription = response.data.results.map(result => result.alternatives[0].transcript).join('\n');
        return transcription;
    } catch (error) {
        console.error('Error transcribing audio:', error.message);
        throw error; // Rethrow to handle it in the calling function
    }
}

async function sendMessage(to, message) {
    try {
        await client.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: to
        });
    } catch (error) {
        console.error('Error sending message:', error.message);
        throw error; // Rethrow to handle it in the calling function
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});