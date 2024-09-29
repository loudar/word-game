import {computedSignal, create, signalMap} from "https://fjs.targoninc.com/f.mjs";
import {Time} from "../time.mjs";
import {WordApi} from "../localApi/word.api.mjs";

export class GenericTemplates {
    static fullWidthTextInput(label, value, onchange = () => {}) {
        const id = Math.random().toString(36).substring(7);

        return create("label")
            .classes("flex", "full-width")
            .for(label)
            .text(label)
            .children(
                create("input")
                    .type("text")
                    .name(label)
                    .id(id)
                    .value(value)
                    .styles("flex-grow", "1")
                    .onchange(e => {
                        onchange(e.target.value);
                    })
                    .oninput(e => {
                        if (e.key === "Enter") {
                            e.target.blur();
                            setTimeout(() => {
                                e.target.focus();
                            }, 0);
                        }
                    })
                    .build(),
                GenericTemplates.iconButton("send", () => {
                    onchange(document.getElementById(id)?.value);
                }, ["positive"]),
            ).build();
    }

    static iconButton(icon, onclick = () => {}, classes = [], title = "") {
        return create("button")
            .classes("icon-button", ...classes)
            .title(title)
            .onclick(onclick)
            .children(
                GenericTemplates.icon(icon),
            ).build();
    }

    static icon(icon, classes = [], title = "", tag = "span") {
        return create(tag)
            .classes("material-symbols-outlined", ...classes)
            .text(icon)
            .title(title)
            .build();
    }

    static word(word, state) {
        const lastGuessed = Time.secondsAgo(word.lastGuessed);
        const isNew = word.count === 1;

        return create("div")
            .classes("flex", "word", "align-content", state)
            .children(
                create("span")
                    .classes("word-text", isNew ? "new" : "_")
                    .text(word.word)
                    .build(),
                create("div")
                    .classes("flex", "align-content")
                    .children(
                        create("span")
                            .classes("word-count")
                            .text(lastGuessed)
                            .build(),
                        GenericTemplates.iconButton("delete", () => {
                            const confirmed = confirm("Are you sure you want to delete this word?");
                            if (confirmed) {
                                WordApi.deleteWord(word.word);
                            }
                        }, ["negative"]),
                    ).build()
            ).build();
    }

    static wordList(words, state) {
        const sortedWords = computedSignal(words, words => words.sort((a, b) => b.lastGuessed - a.lastGuessed));

        return signalMap(
            sortedWords,
            create("div").classes("flex-v", "word-list"),
            word => GenericTemplates.word(word, state)
        );
    }

    static select(label, options, value, onchange) {
        return create("div")
            .classes("flex", "align-content")
            .children(
                create("label")
                    .text(label),
                create("span")
                    .classes("select")
                    .children(
                        create("select")
                            .onchange((e) => {
                                onchange(e.target.value);
                            })
                            .children(
                                ...options.map(option => {
                                    const selected = computedSignal(value, value => option.value === value);

                                    return this.option(option, selected);
                                })
                            ).build()
                    ).build()
            ).build();
    }

    static option(option, selected) {
        return create("option")
            .text(option.text)
            .value(option.value)
            .selected(selected)
            .build();
    }

    static text(text, classes = []) {
        return create("span")
            .classes(...classes)
            .text(text)
            .build();
    }

    static error(error) {
        return create("span")
            .classes("error")
            .text(error)
            .build();
    }

    static input(type, label, value, onchange = () => {}) {
        return create("label")
            .classes("flex", "align-content")
            .for(label)
            .text(label)
            .children(
                create("input")
                    .type(type)
                    .name(label)
                    .value(value)
                    .onchange(e => {
                        onchange(e.target.value);
                    })
                    .build()
            ).build();
    }
}