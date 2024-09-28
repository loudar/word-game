import FormData from "form-data";
import {Readable} from "stream";
import axios from "axios";
import {CLI} from "./CLI.mjs";

export class OpenAiTranscriptionProvider {
    static async transcribe(file, OPENAI_API_KEY) {
        if (!file) {
            return `Error recognizing text: No file provided`;
        }

        const formData = new FormData();
        formData.append('model', 'whisper-1');
        const fileStream = new Readable();
        fileStream.push(file.buffer);
        fileStream.push(null);

        formData.append('file', fileStream, {
            filename: 'audio.webm',
            contentType: 'audio/webm; codecs=opus',
            knownLength: file.size
        });
        formData.append('response_format', 'json');
        try {
            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                validateStatus: () => true
            });
            if (response.status !== 200) {
                CLI.error(`${response.status} | ${JSON.stringify(response.data)}`);
                throw new Error(`Response status code: ${response.status}`);
            }
            const data = await response.data;
            return data.text;
        } catch (err) {
            return `Error recognizing text: ${err}`;
        }
    }
}