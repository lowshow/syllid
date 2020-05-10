import { Resolve, Reject } from "./interfaces"

// TODO: add doc
export function getEl<T extends HTMLElement>({
    selector,
    timeout = 1000
}: {
    selector: string
    timeout?: number
}): Promise<T> {
    return new Promise((resolve: Resolve<T>, reject: Reject): void => {
        const base: number = performance.now()
        requestAnimationFrame((time: number): void => {
            if (time - base >= timeout) return reject()

            const el: T | null = document.querySelector<T>(selector)
            if (el) return resolve(el)
        })
    })
}

// TODO: add doc
export function randInt(from: number, to: number): number {
    if (to < from) return from
    return ~~(Math.random() * (to - from) + from)
}

// TODO: add doc
export function sleep(seconds: number): Promise<void> {
    return new Promise((resolve: Resolve<void>): void => {
        setTimeout((): void => resolve(), seconds * 1000)
    })
}
