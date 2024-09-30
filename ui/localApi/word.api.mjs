import {store} from "https://fjs.targoninc.com/f.mjs";

export class WordApi {
    static async getWordsForLetter(letter, language) {
        const words = await WordApi.loadWords(language);
        return words.filter(word => word.toLowerCase().startsWith(letter));
    }

    static async loadWords(language) {
        store().setSignalValue("loadingWords", true);
        const words = await WordApi.loadFile(`wordlists/${language}.txt`);
        store().setSignalValue("loadingWords", false);
        return words;
    }

    static async loadFile(fileName) {
        const response = await fetch(fileName);
        const text = await response.text();
        return text.replaceAll("\r", "").split("\n");
    }

    static processGuessedWords(input, guessedWords, knownWords) {
        const words = input.split(" ");
        let anyWordFound = false;
        for (const word of words) {
            if (!knownWords.value.some(known => known.toLowerCase() === word)) {
                console.log(`Unknown word ${word}`);
                continue;
            }
            const existing = guessedWords.value.some(g => g.word === word);
            if (existing) {
                const words = guessedWords.value.filter(g => g.word !== word);
                words.push({
                    word,
                    count: existing.count + 1,
                    lastGuessed: Date.now()
                });
                guessedWords.value = words;
            } else {
                const words = guessedWords.value;
                words.push({
                    word,
                    count: 1,
                    lastGuessed: Date.now()
                });
                guessedWords.value = words;
            }
            anyWordFound = true;
        }
        return anyWordFound;
    }

    static deleteWord(word) {
        const guessedWords = store().get("guessedWords");
        guessedWords.value = guessedWords.value.filter(g => g.word !== word);
    }
}