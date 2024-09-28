import multer from "multer";
import {OpenAiTranscriptionProvider} from "./transcriptionProvider.mjs";
import {CLI} from "./CLI.mjs";
import {AudioFileConverter} from "./AudioFileConverter.mjs";

const upload = multer({ dest: 'tmp/' });

export function initializeStt(app) {
    app.post('/api/stt', upload.single('file'), async (req, res) => {
        try {
            // Get OPENAI_API_KEY from request header
            const apiKey = req.headers['openai_api_key'];
            if (!apiKey) {
                return res.status(400).send("Missing OPENAI_API_KEY header");
            }

            // Check if a file was uploaded
            if (!req.file) {
                return res.status(400).send("No file uploaded");
            }

            let file = req.file;
            const fileFormat = file.mimetype.split("/")[1];
            const supportedFormats = ["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "wav", "webm"];
            if (!supportedFormats.includes(fileFormat)) {
                CLI.warning(`Unsupported file format: ${fileFormat}`);
                file = AudioFileConverter.convertToFormat(file);
            }
            let text = await OpenAiTranscriptionProvider.transcribe(file, apiKey);

            return res.send(text);
        } catch (err) {
            console.error(err);
            res.status(500).send("Internal server error");
        }
    });
}