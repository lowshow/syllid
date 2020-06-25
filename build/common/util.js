// TODO: add doc
export function getEl({ selector, timeout = 1000 }) {
    return new Promise((resolve, reject) => {
        const base = performance.now();
        requestAnimationFrame((time) => {
            if (time - base >= timeout)
                return reject();
            const el = document.querySelector(selector);
            if (el)
                return resolve(el);
        });
    });
}
// TODO: add doc
export function randInt(from, to) {
    if (to < from)
        return from;
    return ~~(Math.random() * (to - from) + from);
}
// TODO: add doc
export function sleep(seconds) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), seconds * 1000);
    });
}
export function slsh(url) {
    return url.endsWith("/") ? url : `${url}/`;
}
export function last(arr) {
    return arr[arr.length - 1];
}
