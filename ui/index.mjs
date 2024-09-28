import {signal, store} from "https://fjs.targoninc.com/f.mjs";
import {UniqueTemplates} from "./templates/unique.templates.mjs";
import {SttApi} from "./localApi/stt.api.mjs";

store().set("selectedLetter", signal("a"));
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

const sttApi = new SttApi("/api/stt");
sttApi.recordContinuously().then();
window.sttApi = sttApi;

document.body.appendChild(UniqueTemplates.page());
