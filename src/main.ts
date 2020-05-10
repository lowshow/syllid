import { player, PlayerFn } from "./player.js"
import { processURLList } from "./fetch.js"
import { randInt, sleep } from "./common/util.js"

export interface Main {
    run: () => Promise<void>
    stop: () => void
}

export function main(locations: string[]): Main {
    // TODO: setup channel selection
    const { feed, init, stop: pStop }: PlayerFn = player({
        channels: 1,
        sampleRate: 48000
    })

    init()

    const location: string = locations[randInt(0, locations.length)]
    const fileList: string[] = []
    const idList: string[] = []
    let processedIndex: number = 0
    let running: boolean = true
    let fetchListInterval: number = 0

    const run = async (): Promise<void> => {
        // fetch opus list (loop per channel)
        // NOTE: because of redirect, list of ids will need to be
        // URLs (or an id/url map, or provide a base url)
        function populate(): void {
            const path: string =
                idList.length > 0
                    ? new URL(
                          `/${idList[idList.length - 1]}`,
                          location
                      ).toString()
                    : location

            fetch(path)
                .then((response: Response): any => response.json())
                .then((items: string[][]): void => {
                    if (!Array.isArray(items)) {
                        console.error(items)
                        throw Error("Data not correct format")
                    }
                    items.forEach(([id, file]: string[]): void => {
                        fileList.push(file)
                        idList.push(id)
                    })
                })
                .catch((e: Error): void => {
                    console.error(e)
                })
        }

        populate()
        fetchListInterval = setInterval(populate, 5000)

        while (running) {
            if (fileList.length === processedIndex) {
                await sleep(1)
                continue
            }
            const fetchList: string[] = fileList.slice(processedIndex)
            processedIndex += fetchList.length
            await processURLList(fetchList, feed)
        }
    }

    const stop = (): void => {
        running = false
        clearInterval(fetchListInterval)
        pStop()
    }

    return { run, stop }
}
