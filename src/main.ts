import { player, PlayerFn } from "./player.js"
import { processURLList } from "./fetch.js"
import { sleep, randInt, slsh } from "./common/util.js"
import { Resolve } from "./common/interfaces.js"

export interface Main {
    playChannel: (index: number) => Promise<PlayChannel>
    addHub: (hub: string) => string[]
    removeHubs: (indices: number[]) => string[]
    stop: () => void
    channels: number
}

export interface PlayChannel {
    stopChannel: () => void
}

interface Stream {
    fileList: string[]
    idList: string[]
    processedIndex: number
    location: string
    freshLocation: boolean
    count: number
    running: boolean
    interval: number
    stopChannel: () => void
}

interface PlaylistItem {
    id: string
    streamId: string
    url: string
}

type Playlist = PlaylistItem[]

function createStreams({
    streams,
    channels
}: {
    streams: Stream[]
    channels: number
}): void {
    for (let i: number = 0; i < channels; i++) {
        streams[i] = {
            count: 0,
            fileList: [],
            idList: [],
            location: "",
            processedIndex: 0,
            running: false,
            freshLocation: false,
            interval: 0,
            stopChannel: (): void => {
                clearInterval(streams[i].interval)
                streams[i].running = false
            }
        }
    }
}

function setStreamLocation({
    locations,
    stream
}: {
    locations: string[]
    stream: Stream
}): void {
    if (stream.count > 0) return

    stream.count = randInt(0, 5)
    stream.location = locations[randInt(0, locations.length)]
    stream.idList = []
    stream.freshLocation = true
}

function updateStreamLocation({
    location,
    stream
}: {
    location: string
    stream: Stream
}): void {
    if (!stream.freshLocation) return

    stream.location = location
    stream.freshLocation = false
}

function getStreamPath(stream: Stream): string {
    stream.count = stream.count - 1
    return stream.idList.length > 0
        ? new URL(
              `${stream.idList[stream.idList.length - 1]}`,
              stream.location
          ).toString()
        : stream.location
}

function addHub(locations: string[]): (hub: string) => string[] {
    return (hub: string): string[] => {
        locations.push(slsh(hub))
        return locations
    }
}

function removeHubs(locations: string[]): (indices: number[]) => string[] {
    return (indices: number[]): string[] => {
        locations = locations.filter((_: string, i: number): boolean => {
            return indices.indexOf(i) > -1
        })
        return locations
    }
}

export function main(): Main {
    // TODO: setup channel selection
    const { feed, init, stop: playerStop, channels }: PlayerFn = player({
        sampleRate: 48000
    })

    init()

    const locations: string[] = []
    const streams: Stream[] = []
    createStreams({ streams, channels })

    function playChannel(index: number): Promise<PlayChannel> {
        return new Promise(
            async (resolve: Resolve<PlayChannel>): Promise<void> => {
                // fetch opus list (loop per channel)
                // NOTE: because of redirect, list of ids will need to be
                // URLs (or an id/url map, or provide a base url)

                resolve(streams[index])

                const worker: Worker = new Worker("/static/decoder/decoder.js")

                function populate(): void {
                    const stream: Stream = streams[index]
                    setStreamLocation({ locations, stream })
                    const path: string = getStreamPath(stream)
                    if (!path) return
                    fetch(path)
                        .then((response: Response): any => {
                            updateStreamLocation({
                                stream,
                                location: slsh(response.url)
                            })
                            return response.json()
                        })
                        .then((items: Playlist): void => {
                            if (!Array.isArray(items)) {
                                console.error(items)
                                throw Error("Data not correct format")
                            }
                            items.forEach(({ id, url }: PlaylistItem): void => {
                                stream.fileList.push(url)
                                stream.idList.push(id)
                            })
                        })
                        .catch((e: Error): void => {
                            console.error(e.message)
                        })
                }

                populate()
                streams[index].interval = setInterval(populate, 5000)
                streams[index].running = true

                while (true) {
                    const stream: Stream = streams[index]
                    if (!stream.running) {
                        break
                    }
                    if (stream.fileList.length === stream.processedIndex) {
                        await sleep(1)
                        continue
                    }
                    const fetchList: string[] = stream.fileList.slice(
                        stream.processedIndex
                    )
                    stream.processedIndex += fetchList.length
                    await processURLList(
                        fetchList,
                        worker,
                        (buffer: Float32Array): void => {
                            feed(buffer, index)
                        }
                    )
                }
            }
        )
    }

    return {
        playChannel,
        addHub: addHub(locations),
        removeHubs: removeHubs(locations),
        stop: (): void => {
            playerStop()
            streams.forEach((stream: Stream): void => {
                stream.stopChannel()
            })
        },
        channels
    }
}
