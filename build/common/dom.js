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
    return (children, options = {
        prepend: false
    }) => {
        const c = Array.isArray(children) ? children : [children];
        c.forEach((child) => {
            if (options.prepend) {
                parent.prepend(child);
            }
            else {
                parent.append(child);
            }
        });
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
    element.remove();
}
// TODO: add doc
export function emt(element) {
    element.innerHTML = "";
}
