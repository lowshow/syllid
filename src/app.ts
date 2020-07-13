import { main, Main, PlayChannel } from "./main.js"
import { getEl } from "./common/util.js"
import { playerUI, ToggleFnEvent, buttonUI, hubUI } from "./ui.js"
import { F } from "./common/interfaces.js"
import { lstn, el, mnt, MntFn, umnt } from "./common/dom.js"
;(async (): Promise<void> => {
    try {
        const root: HTMLDivElement = await getEl<HTMLDivElement>({
            selector: "#appContainer"
        })

        const btnContainer: HTMLDivElement = el("div")
        const outputsContainer: HTMLDivElement = el("div")
        const addHubs: HTMLDivElement = el("div")
        addHubs.classList.add("addHub")
        const hubInput: HTMLInputElement = el("input")
        hubInput.type = "url"
        hubInput.placeholder = "hub url e.g. http://hub.url/1234"
        const hubAddBtn: HTMLButtonElement = el("button")
        hubAddBtn.classList.add("btn")
        hubAddBtn.textContent = "Add hub"
        const hubsContainer: HTMLDivElement = el("div")

        const mntHub: MntFn = mnt(addHubs)
        mntHub([hubInput, hubAddBtn])
        mnt(root)([btnContainer, outputsContainer, addHubs, hubsContainer])

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
                            playingChannels[cOut] = playChannel(cOut)
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
                    if (!indices.length) return
                    const hubs: string[] = removeHubs(indices)
                    hubsContainer.innerHTML = ""
                    hubUI({
                        container: hubsContainer,
                        hubs,
                        onDelete: deleteHubs
                    })
                }

                lstn(hubAddBtn)
                    .on("click")
                    .do((): void => {
                        addHub(hubInput.value)
                            .then((hubs: string[]): void => {
                                hubsContainer.innerHTML = ""
                                hubUI({
                                    container: hubsContainer,
                                    hubs,
                                    onDelete: deleteHubs
                                })
                            })
                            .catch((err: string): void => {
                                const hubErr: HTMLParagraphElement = el("p")
                                hubErr.textContent = err
                                mntHub(hubErr, { prepend: true })
                                setTimeout((): void => {
                                    umnt(hubErr)
                                }, 5000)
                            })
                    })
            }
        })
    } catch (e) {
        console.error("Application Error", e)
    }
})()
