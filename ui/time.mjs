import {signal} from "https://fjs.targoninc.com/f.mjs";

export class Time {
    static secondsAgo(timestamp) {
        const result = signal(null);
        setInterval(() => {
            result.value = Time.getTimeAgo(timestamp);
        }, 1000);
        result.value = Time.getTimeAgo(timestamp);
        return result;
    }

    static getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        return Time.formatAsSeconds(diff);
    }

    static formatAsSeconds(timespan) {
        return Math.round(timespan / 1000) + "s";
    }
}