import { player } from "./player.js";
import { processURLList } from "./fetch.js";
import { randInt, sleep } from "./common/util.js";
export function main(locations) {
    // TODO: setup channel selection
    const { feed, init, stop: pStop } = player({
        channels: 1,
        sampleRate: 48000
    });
    init();
    const location = locations[randInt(0, locations.length)];
    const fileList = [];
    const idList = [];
    let processedIndex = 0;
    let running = true;
    let fetchListInterval = 0;
    const run = async () => {
        // fetch opus list (loop per channel)
        // NOTE: because of redirect, list of ids will need to be
        // URLs (or an id/url map, or provide a base url)
        function populate() {
            const path = idList.length > 0
                ? new URL(`/${idList[idList.length - 1]}`, location).toString()
                : location;
            fetch(path)
                .then((response) => response.json())
                .then((items) => {
                if (!Array.isArray(items)) {
                    console.error(items);
                    throw Error("Data not correct format");
                }
                items.forEach(([id, file]) => {
                    fileList.push(file);
                    idList.push(id);
                });
            })
                .catch((e) => {
                console.error(e);
            });
        }
        populate();
        fetchListInterval = setInterval(populate, 5000);
        while (running) {
            if (fileList.length === processedIndex) {
                await sleep(1);
                continue;
            }
            const fetchList = fileList.slice(processedIndex);
            processedIndex += fetchList.length;
            await processURLList(fetchList, feed);
        }
    };
    const stop = () => {
        running = false;
        clearInterval(fetchListInterval);
        pStop();
    };
    return { run, stop };
}
