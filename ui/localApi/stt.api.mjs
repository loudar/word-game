import {signal, store} from "https://fjs.targoninc.com/f.mjs";

export class SttApi {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.apiKey = null;
        this.preventRecording = true;
        this.language = "de";
        this.interval = null;
    }

    setApiKey(apiKey) {
        if (apiKey && !apiKey.startsWith("sk-")) {
            console.warn("Invalid API-Key");
            return;
        }
        this.apiKey = apiKey;
        if (apiKey) {
            localStorage.setItem("sttApiKey", apiKey);
            this.recordContinuously().then();
        } else {
            localStorage.removeItem("sttApiKey");
        }
    }

    toggleRecording() {
        this.preventRecording = !this.preventRecording;
    }

    async transcribeAudio(voiceData) {
        try {
            const formData = new FormData();
            formData.append('file', voiceData, 'file');
            store().setSignalValue("transcribing", true);
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'OPENAI_API_KEY': this.apiKey,
                    'language': this.language
                },
                body: formData
            });
            store().setSignalValue("transcribing", false);
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
        if (this.interval) {
            return;
        }
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

        const nSeconds = 1;
        const sampleRate = analyser.context.sampleRate;
        const n = nSeconds * sampleRate;
        const interval = 25;
        const historySize = Math.floor(nSeconds * .5 * 1000) / interval;
        const lastDataArrays = Array.from({length: historySize}, () => new Uint8Array(n));
        let recordingStoppedAt = Infinity;
        console.log(`Sample rate: ${sampleRate}, n: ${n}`);

        const checkAudioLevels = () => {
            analyser.getByteTimeDomainData(dataArray);
            lastDataArrays.shift();
            lastDataArrays.push(dataArray.slice());
            let maxAmplitude = 0, averageOfAll;
            let currentAverage = 0;
            for (let i = 0; i < bufferLength; i++) {
                const amplitude = Math.abs(dataArray[i] - 128); // Normalize waveform value
                currentAverage += amplitude;
                if (amplitude > maxAmplitude) {
                    maxAmplitude = amplitude;
                }
            }
            averageOfAll = lastDataArrays.reduce((sum, array) => sum + array.reduce((sum, value) => sum + (Math.abs(value - 128)), 0), 0) / historySize / bufferLength;
            currentAverage /= bufferLength;
            store().setSignalValue("micAmp", currentAverage / 128);

            if (recording.value) {
                mediaRecorder.requestData();
            }

            const startTreshhold = averageOfAll * .1;
            if (currentAverage > startTreshhold && currentAverage > 1) {
                if (this.apiKey && !recording.value && !this.preventRecording) {
                    recording.value = true;
                    mediaRecorder.start();
                    console.log("Recording started...");
                    recordingStoppedAt = Infinity;
                }
            } else if (currentAverage < 1 && currentAverage < averageOfAll * .2) {
                if (recording.value && recordingStoppedAt === Infinity) {
                    recordingStoppedAt = Date.now();
                    setTimeout(() => {
                        if (recording.value && Date.now() - recordingStoppedAt >= (nSeconds * 1000) - 10) {
                            mediaRecorder.stop();
                            console.log("Recording stopped...");
                            recording.value = false;
                        } else {
                            console.log(Date.now() - recordingStoppedAt);
                        }
                    }, nSeconds * 1000);
                }
            }
        };

        mediaRecorder.ondataavailable = event => {
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
        this.interval = setInterval(checkAudioLevels, interval); // Check audio level every 100ms
    }

    setPreventRecording(preventRecording) {
        this.preventRecording = preventRecording;
    }

    setLanguage(code) {
        this.language = code;
    }
}