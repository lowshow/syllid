import { player, PlayerFn } from "./player.js"
import { processURLList } from "./fetch.js"
import { sleep, randInt, slsh } from "./common/util.js"
import { Resolve, Reject } from "./common/interfaces.js"

export interface Main {
    playChannel: (index: number) => Promise<PlayChannel>
    addHub: (hub: string) => Promise<string[]>
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
    fetchInterval: number
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
    channels,
    stopChannel
}: {
    streams: Stream[]
    channels: number
    stopChannel: (channel: number) => void
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
            fetchInterval: 0,
            stopChannel: (): void => {
                stopChannel(i)
                clearInterval(streams[i].interval)
                clearInterval(streams[i].fetchInterval)
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

function validatePlaylist(items: Playlist): Playlist {
    if (!Array.isArray(items)) {
        throw Error("Playlist is not an array.")
    }
    items.forEach((i: PlaylistItem): void => {
        try {
            new URL(i.url).toString()
        } catch {
            throw Error(`${i.url} in playlist is invalid URL.`)
        }
        if (!i.id || typeof i.id !== "string") {
            throw Error(`${i.id || "Missing ID"} in playlist is invalid ID.`)
        }
    })
    return items
}

export function main(): Main {
    // TODO: setup channel selection
    const {
        feed,
        init,
        stop: playerStop,
        channels,
        stopChannel
    }: PlayerFn = player({
        sampleRate: 48000
    })

    init()

    const locations: string[] = []
    const streams: Stream[] = []
    createStreams({ streams, channels, stopChannel })

    function playChannel(index: number): Promise<PlayChannel> {
        return new Promise(
            async (resolve: Resolve<PlayChannel>): Promise<void> => {
                // fetch opus list (loop per channel)
                // NOTE: because of redirect, list of ids will need to be
                // URLs (or an id/url map, or provide a base url)

                resolve(streams[index])

                const worker: Worker = new Worker("static/decoder/decoder.js")

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
                            validatePlaylist(items)
                                .slice(0, randInt(0, items.length))
                                .forEach(({ id, url }: PlaylistItem): void => {
                                    stream.fileList.push(url)
                                    stream.idList.push(id)
                                })
                        })
                        .catch((e: Error): void => {
                            console.error(e.message)
                        })
                }

                populate()
                streams[index].interval = setInterval(populate, 3000)
                streams[index].running = true

                async function fetchloop(): Promise<void> {
                    if (
                        streams[index].fileList.length ===
                        streams[index].processedIndex
                    ) {
                        return
                    }
                    const fetchList: string[] = streams[index].fileList.slice(
                        streams[index].processedIndex
                    )
                    streams[index].processedIndex += fetchList.length
                    await processURLList(
                        fetchList,
                        worker,
                        (buffer: Float32Array): void => {
                            if (streams[index].running)
                                feed({ channel: index, data: buffer })
                        }
                    )
                }

                fetchloop()
                streams[index].fetchInterval = setInterval(fetchloop, 1000)
            }
        )
    }

    return {
        playChannel,
        addHub: (hub: string): Promise<string[]> => {
            return new Promise(
                (resolve: Resolve<string[]>, reject: Reject): void => {
                    try {
                        locations.push(slsh(new URL(hub).toString()))
                        resolve(locations)
                    } catch (e) {
                        reject(`${hub} is not a valid URL.`)
                    }
                }
            )
        },
        removeHubs: (indices: number[]): string[] => {
            indices.forEach((index: number): void => {
                locations.splice(index, 1)
            })
            return locations
        },
        stop: (): void => {
            playerStop()
            streams.forEach((stream: Stream): void => {
                stream.stopChannel()
            })
        },
        channels
    }
}
