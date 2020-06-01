import { main, Main, PlayChannel } from "./main.js"
import { getEl } from "./common/util.js"
import { playerUI, ToggleFnEvent, buttonUI, hubUI } from "./ui.js"
import { F } from "./common/interfaces.js"
import { lstn } from "./common/dom.js"

type DOMItems = [
    HTMLDivElement,
    HTMLDivElement,
    HTMLInputElement,
    HTMLButtonElement,
    HTMLDivElement,
    HTMLDivElement
]
;(async (): Promise<void> => {
    try {
        const [
            btnContainer,
            addHubs,
            hubInput,
            hubAddBtn,
            hubsContainer,
            outputsContainer
        ]: DOMItems = await Promise.all<
            HTMLDivElement,
            HTMLDivElement,
            HTMLInputElement,
            HTMLButtonElement,
            HTMLDivElement,
            HTMLDivElement
        >([
            getEl<HTMLDivElement>({
                selector: "#buttons"
            }),
            getEl<HTMLDivElement>({
                selector: "#addHub"
            }),
            getEl<HTMLInputElement>({
                selector: "#hubUrlInput"
            }),
            getEl<HTMLButtonElement>({
                selector: "#hubUrlAddBtn"
            }),
            getEl<HTMLDivElement>({
                selector: "#hubs"
            }),
            getEl<HTMLDivElement>({
                selector: "#output"
            })
        ])
        const playingChannels: Promise<PlayChannel>[] = []
        const stops: F<void, void>[] = []

        buttonUI({
            container: btnContainer,
            onStop: (): void => {
                stops.forEach((s: F<void, void>): void => s())

                addHubs.classList.remove("visible")
                outputsContainer.innerHTML = ""
                hubsContainer.innerHTML = ""
            },
            onInit: (): void => {
                const {
                    addHub,
                    channels,
                    playChannel,
                    removeHubs,
                    stop
                }: Main = main()

                stops.push(stop)

                playerUI({
                    container: outputsContainer,
                    onEvent: async ({
                        cOut,
                        mode
                    }: ToggleFnEvent): Promise<void> => {
                        if (mode) {
                            playingChannels.push(playChannel(cOut))
                        } else {
                            const {
                                stopChannel
                            }: PlayChannel = await playingChannels[cOut]
                            stopChannel()
                        }
                    },
                    outputCount: channels
                })

                addHubs.classList.add("visible")

                function deleteHubs(indices: number[]): void {
                    const hubs: string[] = removeHubs(indices)
                    hubUI({
                        container: hubsContainer,
                        hubs,
                        onDelete: deleteHubs
                    })
                }

                lstn(hubAddBtn)
                    .on("click")
                    .do((): void => {
                        const hubs: string[] = addHub(hubInput.value)
                        hubUI({
                            container: hubsContainer,
                            hubs,
                            onDelete: deleteHubs
                        })
                    })
            }
        })
    } catch (e) {
        console.error("Application Error", e)
    }
})()
