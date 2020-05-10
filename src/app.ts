import { main, Main } from "./main.js"
import { getEl } from "./common/util.js"

function toggleVisible(el: HTMLElement[]): void {
    el.forEach((i: HTMLElement): void => {
        i.classList.toggle("visible")
    })
}

;(async (): Promise<void> => {
    try {
        const stopBtn: HTMLButtonElement = await getEl<HTMLButtonElement>({
            selector: "#stop"
        })
        const runBtn: HTMLButtonElement = await getEl<HTMLButtonElement>({
            selector: "#run"
        })
        const locationText: HTMLTextAreaElement = await getEl<
            HTMLTextAreaElement
        >({ selector: "#text" })

        runBtn.addEventListener("click", (): void => {
            const locations: string[] = locationText.value.split("\n")
            console.log("Locations", locations)
            const { run, stop }: Main = main(locations)
            toggleVisible([stopBtn, runBtn, locationText])
            stopBtn.addEventListener("click", stop)
            run()
        })
    } catch (e) {
        console.error("Application Error", e)
    }
})()
