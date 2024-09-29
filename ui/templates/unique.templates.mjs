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
            notYetGuessedWords.value = knownWords.value.filter(known => !guessedWords.value.some(guessed => guessed.word === known.word));
        };
        guessedWords.subscribe(getNotYetGuessedWords);
        knownWords.subscribe(getNotYetGuessedWords);
        getNotYetGuessedWords();
        const notYetGuessedCount = computedSignal(notYetGuessedWords, notYetGuessedWords => Local.stats(guessedWords.value.length, notYetGuessedWords.length));
        const input = signal("");
        const error = signal(null);
        const sttApiKey = store().get("sttApiKey");
        sttApiKey.subscribe(apiKey => {
            window.sttApi.setApiKey(apiKey);
        });
        const preventRecording = store().get("preventRecording");
        const recordingIcon = computedSignal(preventRecording, preventRecording => preventRecording ? "mic_off" : "mic");

        return create("div")
            .classes("content", "flex-v")
            .children(
                GenericTemplates.select(Local.language(), languages, selectedLanguage, newLanguage => {
                    selectedLanguage.value = newLanguage;
                }),
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
                        GenericTemplates.input("password", Local.apiKey(), sttApiKey, newInput => {
                            sttApiKey.value = newInput;
                        }),
                        GenericTemplates.iconButton(recordingIcon, () => {
                            preventRecording.value = !preventRecording.value;
                        }, ["positive"]),
                    ).build(),
                create("h2")
                    .text(Local.listTitle())
                    .build(),
                GenericTemplates.wordList(guessedWords, "guessed"),
                GenericTemplates.text(notYetGuessedCount, ["text-small"]),
                GenericTemplates.error(error),
                GenericTemplates.fullWidthTextInput(null, input, newInput => {
                    const found = WordApi.processGuessedWords(newInput, guessedWords, knownWords);
                    if (!found) {
                        error.value = Local.noValidWordInText(newInput);
                    } else {
                        error.value = null;
                    }
                    input.value = "";
                }),
            ).build();
    }
}