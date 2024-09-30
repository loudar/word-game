import {store} from "https://fjs.targoninc.com/f.mjs";

export class WordApi {
    static async getWordsForLetter(letter, language) {
        const words = await WordApi.loadWords(language);
        return words.filter(word => word.toLowerCase().startsWith(letter));
    }

    static async loadWords(language) {
        return await WordApi.loadFile(`wordlists/${language}.txt`);
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
            const existing = guessedWords.value.find(g => g.word === word);
            if (existing) {
                guessedWords.value = [
                    ...guessedWords.value.filter(g => g.word !== word),
                    {
                        word,
                        count: existing.count + 1,
                        lastGuessed: Date.now()
                    }
                ];
            } else {
                guessedWords.value = [
                    ...guessedWords.value,
                    {
                        word,
                        count: 1,
                        lastGuessed: Date.now()
                    }
                ];
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