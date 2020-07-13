import { player } from "./player.js";
import { processURLList } from "./fetch.js";
import { randInt, slsh } from "./common/util.js";
function createStreams({ streams, channels, stopChannel }) {
    for (let i = 0; i < channels; i++) {
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
            stopChannel: () => {
                stopChannel(i);
                clearInterval(streams[i].interval);
                clearInterval(streams[i].fetchInterval);
                streams[i].running = false;
            }
        };
    }
}
function setStreamLocation({ locations, stream }) {
    if (stream.count > 0)
        return;
    stream.count = randInt(0, 5);
    stream.location = locations[randInt(0, locations.length)];
    stream.idList = [];
    stream.freshLocation = true;
}
function updateStreamLocation({ location, stream }) {
    if (!stream.freshLocation)
        return;
    stream.location = location;
    stream.freshLocation = false;
}
function getStreamPath(stream) {
    stream.count = stream.count - 1;
    return stream.idList.length > 0
        ? new URL(`${stream.idList[stream.idList.length - 1]}`, stream.location).toString()
        : stream.location;
}
function validatePlaylist(items) {
    if (!Array.isArray(items)) {
        throw Error("Playlist is not an array.");
    }
    items.forEach((i) => {
        try {
            new URL(i.url).toString();
        }
        catch (_a) {
            throw Error(`${i.url} in playlist is invalid URL.`);
        }
        if (!i.id || typeof i.id !== "string") {
            throw Error(`${i.id || "Missing ID"} in playlist is invalid ID.`);
        }
    });
    return items;
}
export function main() {
    // TODO: setup channel selection
    const { feed, init, stop: playerStop, channels, stopChannel } = player({
        sampleRate: 48000
    });
    init();
    const locations = [];
    const streams = [];
    createStreams({ streams, channels, stopChannel });
    function playChannel(index) {
        return new Promise(async (resolve) => {
            // fetch opus list (loop per channel)
            // NOTE: because of redirect, list of ids will need to be
            // URLs (or an id/url map, or provide a base url)
            resolve(streams[index]);
            const worker = new Worker("static/decoder/decoder.js");
            function populate() {
                const stream = streams[index];
                setStreamLocation({ locations, stream });
                const path = getStreamPath(stream);
                if (!path)
                    return;
                fetch(path)
                    .then((response) => {
                    updateStreamLocation({
                        stream,
                        location: slsh(response.url)
                    });
                    return response.json();
                })
                    .then((items) => {
                    validatePlaylist(items)
                        .slice(0, randInt(0, items.length))
                        .forEach(({ id, url }) => {
                        stream.fileList.push(url);
                        stream.idList.push(id);
                    });
                })
                    .catch((e) => {
                    console.error(e.message);
                });
            }
            populate();
            streams[index].interval = setInterval(populate, 3000);
            streams[index].running = true;
            async function fetchloop() {
                if (streams[index].fileList.length ===
                    streams[index].processedIndex) {
                    return;
                }
                const fetchList = streams[index].fileList.slice(streams[index].processedIndex);
                streams[index].processedIndex += fetchList.length;
                await processURLList(fetchList, worker, (buffer) => {
                    if (streams[index].running)
                        feed({ channel: index, data: buffer });
                });
            }
            fetchloop();
            streams[index].fetchInterval = setInterval(fetchloop, 1000);
        });
    }
    return {
        playChannel,
        addHub: (hub) => {
            return new Promise((resolve, reject) => {
                try {
                    locations.push(slsh(new URL(hub).toString()));
                    resolve(locations);
                }
                catch (e) {
                    reject(`${hub} is not a valid URL.`);
                }
            });
        },
        removeHubs: (indices) => {
            indices.forEach((index) => {
                locations.splice(index, 1);
            });
            return locations;
        },
        stop: () => {
            playerStop();
            streams.forEach((stream) => {
                stream.stopChannel();
            });
        },
        channels
    };
}
