import * as ffmpeg from 'fluent-ffmpeg';
import {CLI} from "./CLI.mjs";

export class AudioFileConverter {
    static convertToFormat(file, format = 'mp3') {
        return new Promise((resolve, reject) => {
            const outputFilePath = `${file.path.split('.')[0]}.${format}`;
            ffmpeg(file.path)
                .format('webm')
                .on('error', (err) => {
                    CLI.error(`${file.path} An error occurred while converting audio file: ${err.message}`);
                    reject(err);
                })
                .on('end', () => {
                    CLI.success(`${file.path} Conversion completed!`);
                    resolve(outputFilePath);
                })
                .save(outputFilePath);
        });
    }
}