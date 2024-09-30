import {GenericTemplates} from "./generic.templates.mjs";
import {computedSignal, create, signal, store} from "https://fjs.targoninc.com/f.mjs";
import {WordApi} from "../localApi/word.api.mjs";
import {Local} from "../strings.mjs";

export const languages = [
    { value: "de", text: "Deutsch" },
    { value: "en", text: "English" },
];

export class UniqueTemplates {
    static page() {
        const input = store().get("input");
        input.subscribe(newInput => {
            if (!newInput || newInput.trim().length === 0) {
                return;
            }

            const found = WordApi.processGuessedWords(newInput, guessedWords, knownWords);
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

        return create("div")
            .classes("content", "flex-v")
            .children(
                create("div")
                    .classes("flex", "wrap", "space-between")
                    .children(
                        GenericTemplates.select(Local.language(), languages, selectedLanguage, newLanguage => {
                            selectedLanguage.value = newLanguage;
                        }),
                        GenericTemplates.input("password", Local.apiKey(), sttApiKey, newInput => {
                            sttApiKey.value = newInput;
                        }),
                        GenericTemplates.micButton(recordingIcon, () => {
                            preventRecording.value = !preventRecording.value;
                        }, ["positive"], "Toggle microphone", micAmp),
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
                        UniqueTemplates.stateButtons(guessedWords, selectedLanguage, selectedLetter, uploadIcon, uploading),
                    ).build(),
                create("h2")
                    .text(Local.listTitle())
                    .build(),
                GenericTemplates.text(notYetGuessedCount, ["text-small"]),
                GenericTemplates.wordList(guessedWords, "guessed"),
                GenericTemplates.error(error),
                GenericTemplates.fullWidthTextInput(null, input, newInput => {
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
                }, ["positive"]),
                GenericTemplates.iconButton("content_paste", async () => {
                    const text = await navigator.clipboard.readText();
                    guessedWords.value = JSON.parse(text);
                }, ["positive"]),
                GenericTemplates.iconButton("download", () => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(new Blob([JSON.stringify(guessedWords.value, null, 4)], {type: 'application/json'}));
                    link.download = `${Local.listTitle()}_${selectedLanguage.value}_${selectedLetter.value}.json`;
                    link.click();
                }, ["positive"]),
                GenericTemplates.iconButton(uploadIcon, () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    uploading.value = true;
                    input.onchange = e => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = e => {
                            guessedWords.value = JSON.parse(e.target.result);
                            uploading.value = false;
                        };
                        reader.readAsText(file);
                    };
                    input.onabort = () => {
                        uploading.value = false;
                    };
                    input.click();
                }, ["positive", uploadIcon]),
            ).build();
    }
}