import {store} from "https://fjs.targoninc.com/f.mjs";

function getLang() {
    return store().get("selectedLanguage").value;
}

export class Local {
    static noValidWordInText(word) {
        switch (getLang()) {
            case "de":
                return `"${word}" enthält kein gültiges Wort`;
            case "en":
                return `No valid word found in "${word}"`;
        }
    }

    static listTitle() {
        switch (getLang()) {
            case "de":
                return "Erratene Wörter";
            case "en":
                return "Guessed Words";
        }
    }

    static stats(guessed, left) {
        switch (getLang()) {
            case "de":
                return `${guessed} erraten, ${left} übrig`;
            case "en":
                return `${guessed} guessed, ${left} left`;
        }
    }

    static letter() {
        switch (getLang()) {
            case "de":
                return "Buchstabe";
            case "en":
                return "Letter";
        }
    }

    static apiKey() {
        switch (getLang()) {
            case "de":
                return "OpenAI-Schlüssel";
            case "en":
                return "OpenAI API Key";
        }
    }

    static language() {
        switch (getLang()) {
            case "de":
                return "Sprache";
            case "en":
                return "Language";
        }
    }

    static apiKeyHelp() {
        switch (getLang()) {
            case "de":
                return "Dein OpenAI-Schlüssel wird für Transkription verwendet und wird niemals von uns gespeichert.";
            case "en":
                return "Your OpenAI API key will be used for speech recognition and will never be stored by us.";
        }
    }

    static transcribing() {
        switch (getLang()) {
            case "de":
                return "Transkribiere...";
            case "en":
                return "Transcribing...";
        }
    }

    static loadingWords() {
        switch (getLang()) {
            case "de":
                return "Lade Wörter...";
            case "en":
                return "Loading words...";
        }
    }
}