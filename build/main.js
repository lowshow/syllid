import { player } from "./player.js";
import { processURLList } from "./fetch.js";
import { sleep, randInt, slsh } from "./common/util.js";
function createStreams({ streams, channels }) {
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
            stopChannel: () => {
                clearInterval(streams[i].interval);
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
function addHub(locations) {
    return (hub) => {
        locations.push(slsh(hub));
        return locations;
    };
}
function removeHubs(locations) {
    return (indices) => {
        locations = locations.filter((_, i) => {
            return indices.indexOf(i) > -1;
        });
        return locations;
    };
}
export function main() {
    // TODO: setup channel selection
    const { feed, init, stop: playerStop, channels } = player({
        sampleRate: 48000
    });
    init();
    const locations = [];
    const streams = [];
    createStreams({ streams, channels });
    function playChannel(index) {
        return new Promise(async (resolve) => {
            // fetch opus list (loop per channel)
            // NOTE: because of redirect, list of ids will need to be
            // URLs (or an id/url map, or provide a base url)
            resolve(streams[index]);
            const worker = new Worker("/static/decoder/decoder.js");
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
                    if (!Array.isArray(items)) {
                        console.error(items);
                        throw Error("Data not correct format");
                    }
                    items.forEach(({ id, url }) => {
                        stream.fileList.push(url);
                        stream.idList.push(id);
                    });
                })
                    .catch((e) => {
                    console.error(e.message);
                });
            }
            populate();
            streams[index].interval = setInterval(populate, 5000);
            streams[index].running = true;
            while (true) {
                const stream = streams[index];
                if (!stream.running) {
                    break;
                }
                if (stream.fileList.length === stream.processedIndex) {
                    await sleep(1);
                    continue;
                }
                const fetchList = stream.fileList.slice(stream.processedIndex);
                stream.processedIndex += fetchList.length;
                await processURLList(fetchList, worker, (buffer) => {
                    feed(buffer, index);
                });
            }
        });
    }
    return {
        playChannel,
        addHub: addHub(locations),
        removeHubs: removeHubs(locations),
        stop: () => {
            playerStop();
            streams.forEach((stream) => {
                stream.stopChannel();
            });
        },
        channels
    };
}
