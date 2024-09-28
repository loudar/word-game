export class SttApi {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.apiKey = null;
    }

    setApiKey(apiKey) {
        console.log(`Setting API key to ${apiKey.substring(0, 3)}...`);
        this.apiKey = apiKey;
    }

    async transcribeAudio(voiceData) {
        try {
            const formData = new FormData();
            formData.append('file', voiceData, 'file');
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'OPENAI_API_KEY': this.apiKey
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
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            console.log('Data available:', event.data);
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            if (audioBlob.size > 0) {
                console.log('Audio blob size:', audioBlob.size);
                if (this.apiKey) {
                    this.transcribeAudio(audioBlob);
                }
            } else {
                console.warn('Audio blob is empty');
            }
        };

        mediaRecorder.start();
        setTimeout(() => {
            mediaRecorder.stop();
        }, 5000);
    }
}