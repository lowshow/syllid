import { el, mnt, lstn, umnt, MntFn } from "./common/dom.js"

// TODO: add doc
export interface ToggleFnEvent {
    cOut: number
    mode: boolean
}
export type ToggleFn = (args: ToggleFnEvent) => void

// TODO: add doc
function getBox({
    appendTo,
    id,
    labelText,
    onChange
}: {
    appendTo: HTMLElement
    labelText: string
    id: string
    onChange: (mode: boolean) => void
}): void {
    const box: HTMLDivElement = el("div")
    box.classList.add("item__box")
    mnt(appendTo)(box)
    const check: HTMLInputElement = el("input")
    check.type = "checkbox"
    check.classList.add("item__check")
    check.id = id
    mnt(box)(check)
    lstn(check)
        .on("change")
        .do((): void => {
            onChange(check.checked)
        })
    const title: HTMLLabelElement = el("label")
    title.textContent = labelText
    title.classList.add("item__label")
    title.htmlFor = id
    mnt(box)(title)
}

// TODO: add doc
export async function playerUI({
    container,
    onEvent,
    outputCount
}: {
    outputCount: number
    container: HTMLElement
    onEvent: ToggleFn
}): Promise<void> {
    // row per input
    // make titles labels, emit events on label clicks with details, call arg fn
    const row: HTMLDivElement = el("div")
    row.classList.add("item__row")
    mnt(container)(row)

    for (let o: number = 0; o < outputCount; o++) {
        getBox({
            appendTo: row,
            id: `o${o}`,
            labelText: `Send to output channel ${o + 1}`,
            onChange: (mode: boolean): void => {
                onEvent({ cOut: o, mode })
            }
        })
    }
}

// TODO: add/rem hub UI
// populate table with hub urls/ checkbox/ rm button
export function hubUI({
    container,
    hubs,
    onDelete
}: {
    container: HTMLElement
    hubs: string[]
    onDelete: (hubs: number[]) => void
}): void {
    const selected: boolean[] = []

    const delBtn: HTMLButtonElement = el("button")
    delBtn.className = "btn"
    delBtn.textContent = "Delete selected hubs"
    lstn(delBtn)
        .on("click")
        .do((): void => {
            onDelete(
                selected.reduce<number[]>(
                    (arr: number[], s: boolean, i: number): number[] => {
                        if (s) arr.push(i)
                        return arr
                    },
                    []
                )
            )
        })

    const hubMnt: MntFn = mnt(container)
    hubMnt(delBtn)

    hubs.forEach((hub: string, index: number): void => {
        getBox({
            appendTo: container,
            id: `hub${index}`,
            labelText: hub,
            onChange: (mode: boolean): void => {
                selected[index] = mode
            }
        })
    })
}

// TODO: add doc
export function buttonUI({
    container,
    onInit,
    onStop
}: {
    container: HTMLElement
    onInit: () => void
    onStop: () => void
}): void {
    const initBtn: HTMLButtonElement = el("button")
    initBtn.textContent = "Start stream"
    initBtn.classList.add("btn")
    const push: MntFn = mnt(container)
    push(initBtn)
    const stopBtn: HTMLButtonElement = el("button")
    stopBtn.textContent = "Stop stream"
    stopBtn.classList.add("btn")

    lstn(initBtn)
        .on("click")
        .do((): void => {
            onInit()
            umnt(initBtn)
            push(stopBtn)
        })

    lstn(stopBtn)
        .on("click")
        .do((): void => {
            onStop()
            umnt(stopBtn)
            push(initBtn)
        })
}
