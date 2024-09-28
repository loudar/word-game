import express from 'express';
import {fileURLToPath} from "url";
import path from "path";
import {initializeStt} from "./api/stt.mjs";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initializeStt(app);

app.use(express.static(path.join(__dirname, "ui")));
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/ui/index.html');
});

const port = 6347;
app.listen(port, () => {
    console.log(`Listening on ${process.env.DEPLOYMENT_URL || `http://localhost:${port}`}`);
});
