export class SttApi {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.apiKey = null;
        this.preventRecording = true;
        this.language = "de";
    }

    setApiKey(apiKey) {
        console.log(`Setting API key to ${apiKey.substring(0, 3)}...`);
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
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm; codecs=opus'
        });
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let audioBuffers = [];
        let recording = false;

        source.connect(analyser);

        const checkAudioLevels = () => {
            analyser.getByteTimeDomainData(dataArray);
            let maxAmplitude = 0;
            for (let i = 0; i < bufferLength; i++) {
                const amplitude = Math.abs(dataArray[i] - 128); // Normalize waveform value
                if (amplitude > maxAmplitude) {
                    maxAmplitude = amplitude;
                }
            }
            const lastAmplitude = Math.abs(dataArray[dataArray.length - 1] - 128);

            const hadDataThreshold = 5; // Define your threshold level here
            const startTreshhold = .5;

            if (lastAmplitude > startTreshhold) {
                if (!recording && maxAmplitude > hadDataThreshold && !this.preventRecording) {
                    recording = true;
                    mediaRecorder.start();
                    console.log("Recording started...");
                }
            } else if (lastAmplitude < startTreshhold) {
                if (recording) {
                    mediaRecorder.stop();
                    console.log("Recording stopped...");
                    recording = false;
                }
            }
        };

        mediaRecorder.ondataavailable = event => {
            console.log('Data available:', event.data);
            audioBuffers.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioBuffers, { type: 'audio/webm' });
            audioBuffers = []; // Clear buffer

            if (audioBlob.size > 0) {
                console.log('Audio blob size:', audioBlob.size);
                if (this.apiKey) {
                    await this.transcribeAudio(audioBlob);
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