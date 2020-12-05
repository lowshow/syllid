import { el, mnt, lstn, umnt } from "./common/dom.js";
// TODO: add doc
function getBox({ appendTo, id, labelText, onChange }) {
    const box = el("div");
    box.classList.add("item__box");
    mnt(appendTo)(box);
    const check = el("input");
    check.type = "checkbox";
    check.classList.add("item__check");
    check.id = id;
    mnt(box)(check);
    lstn(check)
        .on("change")
        .do(() => {
        onChange(check.checked);
    });
    const title = el("label");
    title.textContent = labelText;
    title.classList.add("item__label");
    title.htmlFor = id;
    mnt(box)(title);
}
// TODO: add doc
export async function playerUI({ container, onEvent, outputCount }) {
    // row per input
    // make titles labels, emit events on label clicks with details, call arg fn
    const row = el("div");
    row.classList.add("item__row");
    mnt(container)(row);
    for (let o = 0; o < outputCount; o++) {
        getBox({
            appendTo: row,
            id: `o${o}`,
            labelText: `Send to output channel ${o + 1}`,
            onChange: (mode) => {
                onEvent({ cOut: o, mode });
            }
        });
    }
}
// TODO: add/rem hub UI
// populate table with hub urls/ checkbox/ rm button
export function hubUI({ container, hubs, onDelete }) {
    if (hubs.length === 0)
        return;
    const selected = [];
    const delBtn = el("button");
    delBtn.className = "btn";
    delBtn.textContent = "Delete selected hubs";
    lstn(delBtn)
        .on("click")
        .do(() => {
        onDelete(selected.reduce((arr, s, i) => {
            if (s)
                arr.push(i);
            return arr;
        }, []));
    });
    const hubMnt = mnt(container);
    hubMnt(delBtn);
    const hubsRow = el("div");
    hubsRow.classList.add("item__row");
    hubMnt(hubsRow);
    hubs.forEach((hub, index) => {
        getBox({
            appendTo: hubsRow,
            id: `hub${index}`,
            labelText: hub,
            onChange: (mode) => {
                selected[index] = mode;
            }
        });
    });
}
// TODO: add doc
export function buttonUI({ container, onInit, onStop }) {
    const initBtn = el("button");
    initBtn.textContent = "Start stream";
    initBtn.classList.add("btn");
    const push = mnt(container);
    push(initBtn);
    const stopBtn = el("button");
    stopBtn.textContent = "Stop stream";
    stopBtn.classList.add("btn");
    lstn(initBtn)
        .on("click")
        .do(() => {
        onInit();
        umnt(initBtn);
        push(stopBtn);
    });
    lstn(stopBtn)
        .on("click")
        .do(() => {
        onStop();
        umnt(stopBtn);
        push(initBtn);
    });
}
