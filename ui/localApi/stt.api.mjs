import {signal, store} from "https://fjs.targoninc.com/f.mjs";

export class SttApi {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.apiKey = null;
        this.preventRecording = true;
        this.language = "de";
    }

    setApiKey(apiKey) {
        if (apiKey && apiKey.length > 0) {
           console.log(`Setting API key to ${apiKey.substring(0, 3)}...`);
        }
        this.apiKey = apiKey;
        localStorage.setItem("sttApiKey", apiKey);
    }

    toggleRecording() {
        this.preventRecording = !this.preventRecording;
    }

    async transcribeAudio(voiceData) {
        try {
            const formData = new FormData();
            formData.append('file', voiceData, 'file');
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'OPENAI_API_KEY': this.apiKey,
                    'language': this.language
                },
                body: formData
            });
            if (!response.ok) {
                throw new Error(`HTTP error, status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error in transcribeAudio:', error);
            throw error;
        }
    }

    async recordContinuously() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        let mediaRecorder, mimeType;
        try {
             mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/wav'
            });
             mimeType = 'audio/wav';
        } catch (error) {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            mimeType = 'audio/webm';
        }
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let audioBuffers = [];
        let recording = signal(false);
        recording.subscribe(newRecording => {
            store().setSignalValue("recording", newRecording);
        });

        source.connect(analyser);

        const nSeconds = 2;
        const sampleRate = analyser.context.sampleRate;
        const n = nSeconds * sampleRate;
        console.log(`Sample rate: ${sampleRate}, n: ${n}`);
        const checkAudioLevels = () => {
            analyser.getByteTimeDomainData(dataArray);
            let maxAmplitude = 0, averageOfAll = 0;
            for (let i = 0; i < bufferLength; i++) {
                const amplitude = Math.abs(dataArray[i] - 128); // Normalize waveform value
                averageOfAll += amplitude;
                if (amplitude > maxAmplitude) {
                    maxAmplitude = amplitude;
                }
            }
            averageOfAll /= bufferLength;
            const averageOfLastN = dataArray.slice(dataArray.length - n).reduce((sum, value) => sum + (Math.abs(value - 128)), 0) / n;
            const lastAmplitude = Math.abs(dataArray[dataArray.length - 1] - 128);
            store().setSignalValue("micAmp", lastAmplitude / 128);

            const hadDataThreshold = 5;
            const startTreshhold = averageOfAll * .02;
            const endTreshhold = averageOfAll * .015;

            if (lastAmplitude > startTreshhold) {
                if (this.apiKey && !recording.value && maxAmplitude > hadDataThreshold && !this.preventRecording) {
                    recording.value = true;
                    mediaRecorder.start();
                    console.log("Recording started...");
                }
            } else if (averageOfLastN < endTreshhold) {
                if (recording.value) {
                    mediaRecorder.stop();
                    console.log("Recording stopped...");
                    recording.value = false;
                }
            }
        };

        mediaRecorder.ondataavailable = event => {
            console.log('Data available:', event.data);
            audioBuffers.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioBuffers, { type: mimeType });
            audioBuffers = []; // Clear buffer

            if (audioBlob.size > 0) {
                console.log('Audio blob size:', audioBlob.size);
                if (this.apiKey) {
                    const transcription = await this.transcribeAudio(audioBlob);
                    const input = store().get("input");
                    const processed = transcription
                        .replaceAll(/[^\w\säöüß]/gi, " ")
                        .replaceAll(/\s+/g, " ")
                        .trim()
                        .toLowerCase();
                    const bullshitPhrases = [
                        "untertitel",
                        "vielen dank fürs zuhören",
                        "bis zum nächsten mal",
                    ];
                    if (bullshitPhrases.some(phrase => processed.includes(phrase))) {
                        console.log("Bullshit phrase detected, ignoring transcription");
                        return;
                    }
                    input.value = processed;
                }
            } else {
                console.warn('Audio blob is empty');
            }
        };

        // Check audio levels at a regular interval
        setInterval(checkAudioLevels, 100); // Check audio level every 100ms
    }

    setPreventRecording(preventRecording) {
        this.preventRecording = preventRecording;
    }

    setLanguage(code) {
        this.language = code;
    }
}