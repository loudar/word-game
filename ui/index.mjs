import {signal, store} from "https://fjs.targoninc.com/f.mjs";
import {UniqueTemplates} from "./templates/unique.templates.mjs";
import {SttApi} from "./localApi/stt.api.mjs";

store().set("selectedLetter", signal("a"));
store().set("guessedWords", signal([]));
store().set("knownWords", signal([]));
store().set("sttApiKey", signal(null));

const sttApi = new SttApi("/api/stt");
sttApi.recordContinuously().then();
window.sttApi = sttApi;

document.body.appendChild(UniqueTemplates.page());
