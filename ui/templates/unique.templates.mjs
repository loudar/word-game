import {GenericTemplates} from "./generic.templates.mjs";
import {computedSignal, create, signal, store} from "https://fjs.targoninc.com/f.mjs";
import {WordApi} from "../localApi/word.api.mjs";

export class UniqueTemplates {
    static page() {
        const selectedLetter = store().get("selectedLetter");
        const guessedWords = store().get("guessedWords");
        const guessedCache = localStorage.getItem(`guessed_${selectedLetter.value}`);
        if (guessedCache) {
            guessedWords.value = JSON.parse(guessedCache);
        }
        guessedWords.subscribe(guessed => {
            localStorage.setItem(`guessed_${selectedLetter.value}`, JSON.stringify(guessed));
        });
        const knownWords = store().get("knownWords");
        WordApi.getWordsForLetter(selectedLetter.value).then(words => knownWords.value = words);
        selectedLetter.subscribe(async selectedLetter => {
            const cache = localStorage.getItem(`guessed_${selectedLetter}`);
            if (cache) {
                guessedWords.value = JSON.parse(cache);
            } else {
                guessedWords.value = [];
            }
            knownWords.value = await WordApi.getWordsForLetter(selectedLetter);
        });
        const notYetGuessedWords = signal([]);
        const getNotYetGuessedWords = () => {
            notYetGuessedWords.value = knownWords.value.filter(known => !guessedWords.value.some(guessed => guessed.word === known.word));
        };
        guessedWords.subscribe(getNotYetGuessedWords);
        knownWords.subscribe(getNotYetGuessedWords);
        getNotYetGuessedWords();
        const notYetGuessedCount = computedSignal(notYetGuessedWords, notYetGuessedWords => guessedWords.value.length + " erraten, " + notYetGuessedWords.length + " übrig");
        const input = signal("");
        const error = signal(null);
        const sttApiKey = store().get("sttApiKey");
        sttApiKey.subscribe(apiKey => {
            window.sttApi.setApiKey(apiKey);
        });

        return create("div")
            .classes("content", "flex-v")
            .children(
                create("div")
                    .classes("flex")
                    .children(
                        GenericTemplates.select("Buchstabe", Array.from({length: 26}, (_, i) => {
                            return {
                                text: String.fromCharCode(97 + i),
                                value: String.fromCharCode(97 + i),
                            };
                        }), selectedLetter, newLetter => {
                            selectedLetter.value = newLetter.toLowerCase();
                        }),
                        GenericTemplates.input("password", "OpenAI-Api-Key", input, newInput => {
                            sttApiKey.value = newInput;
                        }),
                    ).build(),
                create("h2")
                    .text("Erratene Wörter")
                    .build(),
                GenericTemplates.wordList(guessedWords, "guessed"),
                GenericTemplates.text(notYetGuessedCount),
                GenericTemplates.error(error),
                GenericTemplates.fullWidthTextInput(null, input, newInput => {
                    const found = WordApi.processGuessedWords(newInput, guessedWords, knownWords);
                    if (!found) {
                        error.value = `"${newInput}" enthält kein gültiges Wort`;
                    } else {
                        error.value = null;
                    }
                    input.value = "";
                }),
            ).build();
    }
}