// TODO: add doc
export function getEl({ selector, timeout = 1000 }) {
    return new Promise((resolve, reject) => {
        const base = performance.now();
        requestAnimationFrame((time) => {
            if (time - base >= timeout)
                return reject();
            const l = document.querySelector(selector);
            if (l)
                return resolve(l);
        });
    });
}
// TODO: add doc
export function el(tagName, options) {
    return document.createElement(tagName, options);
}
// TODO: add doc
export function mnt(parent) {
    return (children) => {
        if (Array.isArray(children)) {
            children.forEach((c) => {
                parent.appendChild(c);
            });
        }
        else {
            parent.appendChild(children);
        }
    };
}
// TODO: add doc
export function lstn(element) {
    const fns = [];
    return {
        on: (type) => {
            element.addEventListener(type, (e) => {
                fns.forEach((f) => {
                    f(e);
                });
            });
            return {
                do: (fn) => {
                    fns.push(fn);
                }
            };
        }
    };
}
// TODO: add doc
export function umnt(element) {
    var _a;
    (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(element);
}
// TODO: add doc
export function emt(element) {
    element.innerHTML = "";
}
