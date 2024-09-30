import {GenericTemplates} from "./generic.templates.mjs";
import {computedSignal, create, ifjs, signal, store} from "https://fjs.targoninc.com/f.mjs";
import {WordApi} from "../localApi/word.api.mjs";
import {Local} from "../strings.mjs";

export const languages = [
    { value: "de", text: "Deutsch" },
    { value: "en", text: "English" },
];

export class UniqueTemplates {
    static page() {
        const input = store().get("input");
        const wordProcessing = store().get("wordProcessing");
        input.subscribe(newInput => {
            if (!newInput || newInput.trim().length === 0) {
                return;
            }

            wordProcessing.value = true;
            const found = WordApi.processGuessedWords(newInput, guessedWords, knownWords);
            wordProcessing.value = false;
            if (!found) {
                error.value = Local.noValidWordInText(newInput);
            } else {
                error.value = null;
            }
            input.value = "";
        })
        const selectedLetter = store().get("selectedLetter");
        const selectedLanguage = store().get("selectedLanguage");
        const guessedWords = store().get("guessedWords");
        guessedWords.subscribe(guessed => {
            localStorage.setItem(`guessed_${selectedLanguage.value}_${selectedLetter.value}`, JSON.stringify(guessed));
        });
        const knownWords = store().get("knownWords");
        const loadKnownWords = async () => {
            const cache = localStorage.getItem(`guessed_${selectedLanguage.value}_${selectedLetter.value}`);
            if (cache) {
                guessedWords.value = JSON.parse(cache);
            } else {
                guessedWords.value = [];
            }
            knownWords.value = await WordApi.getWordsForLetter(selectedLetter.value, selectedLanguage.value);
        };
        selectedLetter.subscribe(loadKnownWords);
        selectedLanguage.subscribe(loadKnownWords);
        loadKnownWords().then();
        const notYetGuessedWords = signal([]);
        const getNotYetGuessedWords = () => {
            notYetGuessedWords.value = knownWords.value.filter(known => !guessedWords.value.some(guessed => guessed.word.toLowerCase() === known.toLowerCase()));
        };
        guessedWords.subscribe(getNotYetGuessedWords);
        knownWords.subscribe(getNotYetGuessedWords);
        getNotYetGuessedWords();
        const notYetGuessedCount = computedSignal(notYetGuessedWords, notYetGuessed => Local.stats(guessedWords.value.length, notYetGuessed.length));
        const error = signal(null);
        const sttApiKey = store().get("sttApiKey");
        sttApiKey.subscribe(apiKey => {
            window.sttApi.setApiKey(apiKey);
        });
        const preventRecording = store().get("preventRecording");
        const recordingIcon = computedSignal(preventRecording, preventRecording => preventRecording ? "mic_off" : "mic");
        const uploading = signal(false);
        const uploadIcon = computedSignal(uploading, uploading => uploading ? "progress_activity" : "upload");
        const micAmp = store().get("micAmp");
        const loadingWords = store().get("loadingWords");
        const keyIcon = computedSignal(sttApiKey, sttApiKey => (sttApiKey && sttApiKey.startsWith("sk-")) ? "vpn_key" : "vpn_key_off");
        const keyClass = computedSignal(sttApiKey, sttApiKey => (sttApiKey && sttApiKey.startsWith("sk-")) ? "positive" : "negative");
        const enteringKey = signal(false);

        return create("div")
            .classes("content", "flex-v")
            .children(
                create("div")
                    .classes("flex", "wrap", "space-between")
                    .children(
                        GenericTemplates.select(Local.language(), languages, selectedLanguage, newLanguage => {
                            selectedLanguage.value = newLanguage;
                        }),
                        create("div")
                            .classes("flex", "align-content", "wrap")
                            .children(
                                GenericTemplates.hoverInfo("help_outline", Local.apiKeyHelp()),
                                ifjs(enteringKey, GenericTemplates.iconButton(keyIcon, async () => {
                                    enteringKey.value = true;
                                }, [keyClass]), true),
                                ifjs(enteringKey, GenericTemplates.input("password", Local.apiKey(), sttApiKey, newInput => {
                                    enteringKey.value = false;
                                    sttApiKey.value = newInput;
                                })),
                                GenericTemplates.micButton(recordingIcon, () => {
                                    preventRecording.value = !preventRecording.value;
                                }, [], "Toggle microphone", micAmp),
                            ).build(),
                    ).build(),
                create("div")
                    .classes("flex", "wrap", "space-between")
                    .children(
                        GenericTemplates.select(Local.letter(), Array.from({length: 26}, (_, i) => {
                            return {
                                text: String.fromCharCode(97 + i),
                                value: String.fromCharCode(97 + i),
                            };
                        }), selectedLetter, newLetter => {
                            selectedLetter.value = newLetter.toLowerCase();
                        }),
                        ifjs(loadingWords, UniqueTemplates.stateButtons(guessedWords, selectedLanguage, selectedLetter, uploadIcon, uploading), true),
                    ).build(),
                ifjs(loadingWords, GenericTemplates.loading()),
                ifjs(loadingWords, UniqueTemplates.guessArea(input, guessedWords, notYetGuessedCount, error), true),
            ).build();
    }

    static guessArea(input, guessedWords, notYetGuessedCount, error) {
        return create("div")
            .classes("flex-v")
            .children(
                create("h2")
                    .text(Local.listTitle())
                    .build(),
                GenericTemplates.text(notYetGuessedCount, ["text-small"]),
                GenericTemplates.wordList(guessedWords, "guessed"),
                GenericTemplates.error(error),
                GenericTemplates.guessTextInput(null, input, newInput => {
                    input.value = newInput.replaceAll(/[^\w\säöüß]/gi, " ")
                        .replaceAll(/\s+/g, " ")
                        .trim()
                        .toLowerCase();
                    setTimeout(() => {
                        input.value = "";
                    }, 0);
                }),
            ).build();
    }

    static stateButtons(guessedWords, selectedLanguage, selectedLetter, uploadIcon, uploading) {
        return create("div")
            .classes("flex", "align-content")
            .children(
                GenericTemplates.iconButton("content_copy", async () => {
                    await navigator.clipboard.writeText(JSON.stringify(guessedWords.value, null, 4));
                }, []),
                GenericTemplates.iconButton("content_paste", async () => {
                    const text = await navigator.clipboard.readText();
                    let words = JSON.parse(text);
                    words = words.filter(word => word.word.startsWith(selectedLetter.value));
                    guessedWords.value = [
                        ...guessedWords.value,
                        ...words.filter(word => !guessedWords.value.some(g => g.word === word.word)),
                    ];
                }, []),
                GenericTemplates.iconButton("download", () => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(new Blob([JSON.stringify(guessedWords.value, null, 4)], {type: 'application/json'}));
                    link.download = `${Local.listTitle()}_${selectedLanguage.value}_${selectedLetter.value}.json`;
                    link.click();
                }, []),
                GenericTemplates.iconButton(uploadIcon, () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    uploading.value = true;
                    input.onchange = e => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = e => {
                            let words = JSON.parse(e.target.result);
                            words = words.filter(word => word.word.startsWith(selectedLetter.value));
                            guessedWords.value = [
                                ...guessedWords.value,
                                ...words.filter(word => !guessedWords.value.some(g => g.word === word.word)),
                            ];
                            uploading.value = false;
                        };
                        reader.readAsText(file);
                    };
                    input.onabort = () => {
                        uploading.value = false;
                    };
                    input.click();
                }, [uploadIcon]),
            ).build();
    }
}