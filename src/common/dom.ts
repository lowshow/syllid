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

            const l: T | null = document.querySelector<T>(selector)
            if (l) return resolve(l)
        })
    })
}

// TODO: add doc
export function el<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions
): HTMLElementTagNameMap[K] {
    return document.createElement(tagName, options)
}

export type MntFn = (children: HTMLElement | HTMLElement[]) => void

// TODO: add doc
export function mnt(parent: HTMLElement): MntFn {
    return (children: HTMLElement | HTMLElement[]): void => {
        if (Array.isArray(children)) {
            children.forEach((c: HTMLElement): void => {
                parent.appendChild(c)
            })
        } else {
            parent.appendChild(children)
        }
    }
}

// TODO: add doc
type ListenFn = <K extends keyof HTMLElementEventMap>(
    ev: HTMLElementEventMap[K]
) => void

// TODO: add doc
interface ListenAction {
    do: (fn: ListenFn) => void
}

// TODO: add doc
interface Listen {
    on: <K extends keyof HTMLElementEventMap>(type: K) => ListenAction
}

// TODO: add doc
export function lstn<T extends HTMLElement>(element: T): Listen {
    const fns: ListenFn[] = []
    return {
        on: <K extends keyof HTMLElementEventMap>(type: K): ListenAction => {
            element.addEventListener(
                type,
                (e: HTMLElementEventMap[K]): void => {
                    fns.forEach((f: ListenFn): void => {
                        f(e)
                    })
                }
            )
            return {
                do: (fn: ListenFn): void => {
                    fns.push(fn)
                }
            }
        }
    }
}

// TODO: add doc
export function umnt(element: HTMLElement): void {
    element.parentElement?.removeChild(element)
}

// TODO: add doc
export function emt(element: HTMLElement): void {
    element.innerHTML = ""
}
