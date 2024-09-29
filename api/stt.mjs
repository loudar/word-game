import multer from "multer";
import { OpenAiTranscriptionProvider } from "./transcriptionProvider.mjs";
import * as os from "node:os";
import path from "path";
import fs from "fs";

const upload = multer({ dest: 'tmp/' });

export function initializeStt(app) {
    app.post('/api/stt', upload.single('file'), async (req, res) => {
        try {
            const apiKey = req.headers['openai_api_key'];
            if (!apiKey) {
                return res.status(400).send("Missing OPENAI_API_KEY header");
            }
            const language = req.headers['language'] ?? "de";

            if (!req.file) {
                return res.status(400).send("No file uploaded");
            }

            let file = req.file;
            const tempDir = os.tmpdir();
            const filePath = path.join(tempDir, file.filename + ".wav");

            fs.writeFileSync(filePath, fs.readFileSync(file.path));
            let text = await OpenAiTranscriptionProvider.transcribe(filePath, language, apiKey);

            return res.send(text);
        } catch (err) {
            console.error(err);
            res.status(500).send("Internal server error");
        } finally {
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
        }
    });
}