import OpenAI from "openai";
import fs from "fs";

export class OpenAiTranscriptionProvider {
    static async transcribe(file, language, OPENAI_API_KEY) {
        if (!file) {
            return `Error recognizing text: No file path provided`;
        }

        try {
            const openai = new OpenAI({apiKey: OPENAI_API_KEY});
            const transcription = await openai.audio.transcriptions.create({
                language,
                file: fs.createReadStream(file),
                model: "whisper-1",
                response_format: "json"
            });
            return transcription.text;
        } catch (err) {
            return `Error recognizing text: ${err}`;
        }
    }
}