import {signal, store} from "https://fjs.targoninc.com/f.mjs";
import {languages, UniqueTemplates} from "./templates/unique.templates.mjs";
import {SttApi} from "./localApi/stt.api.mjs";

store().set("input", signal(""));
store().set("selectedLetter", signal("a"));
store().set("selectedLanguage", signal(languages[0].value));
store().set("guessedWords", signal([]));
store().set("knownWords", signal([]));
store().set("sttApiKey", signal(null));
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
sttApi.recordContinuously().then();
sttApi.setApiKey(store().get("sttApiKey").value);
window.sttApi = sttApi;

document.body.appendChild(UniqueTemplates.page());
