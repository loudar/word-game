import {signal, store} from "https://fjs.targoninc.com/f.mjs";
import {languages, UniqueTemplates} from "./templates/unique.templates.mjs";
import {SttApi} from "./localApi/stt.api.mjs";

store().set("input", signal(""));
store().set("selectedLetter", signal(localStorage.getItem("selectedLetter") ?? "a"));
store().get("selectedLetter").subscribe(letter => {
    localStorage.setItem("selectedLetter", letter);
});
store().set("selectedLanguage", signal(languages[0].value));
store().set("guessedWords", signal([]));
store().set("knownWords", signal([]));
store().set("sttApiKey", signal(null));
store().set("micAmp", signal(0));
store().set("recording", signal(false));
store().set("transcribing", signal(false));
store().set("loadingWords", signal(false));
store().set("wordProcessing", signal(false));
store().set("preventRecording", signal(true));
store().get("preventRecording").subscribe(preventRecording => {
    sttApi.setPreventRecording(preventRecording);
});

if (localStorage.getItem("sttApiKey")) {
    store().get("sttApiKey").value = localStorage.getItem("sttApiKey");
}

store().get("selectedLanguage").subscribe(language => {
    sttApi.setLanguage(language);
    document.body.innerHTML = "";
    document.body.appendChild(UniqueTemplates.page());
});

const sttApi = new SttApi("/api/stt");
sttApi.setApiKey(store().get("sttApiKey").value);
window.sttApi = sttApi;

document.body.appendChild(UniqueTemplates.page());
