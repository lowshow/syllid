import { last } from "./common/util.js";
// TODO: add docs
export async function processURLList(fileList, worker, onBuffer) {
    const decoding = [];
    const decodeFiles = {};
    // const decodeIndex: { [index: string]: number } = {}
    // const decodedData: Float32Array[][] = []
    function decode(bytes, file) {
        return new Promise((resolve) => {
            worker.postMessage({ decode: bytes.buffer }, [bytes.buffer]);
            const interval = setInterval(() => {
                if (!decodeFiles[file])
                    return;
                resolve();
                clearInterval(interval);
            }, 50);
        });
    }
    worker.onmessage = (event) => {
        const { decoded, done } = event.data;
        if (decoded) {
            onBuffer(decoded);
            // decodedData[decodeIndex[last(decoding)]].push(decoded)
        }
        else if (done) {
            decodeFiles[last(decoding)] = true;
        }
    };
    for (const file of fileList) {
        const response = await fetch(file);
        if (!response.ok)
            throw Error(`Invalid Response: ${response.status} ${response.statusText}`);
        if (!response.body)
            throw Error("ReadableStream not supported.");
        const reader = response.body.getReader();
        async function evalChunk({ done, value }) {
            if (done)
                return;
            if (value) {
                await decode(value, file);
            }
            return reader.read().then(evalChunk);
        }
        // TODO fail on decode() error and exit read() loop
        decoding.push(file);
        decodeFiles[file] = false;
        // const index: number = decoding.length - 1
        // decodedData[decodeIndex[index]] = []
        await reader.read().then(evalChunk);
        // console.log("done", file, decodedData[decodeIndex[index]])
    }
}
