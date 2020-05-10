// TODO: add docs
export async function processURLList(fileList, onBuffer) {
    const worker = new Worker("/static/decoder/decoder.js");
    const { decode, push } = (() => {
        const data = [];
        let lastCheck = 0;
        return {
            push: (state) => {
                data.push(state);
            },
            decode: (bytes) => {
                return new Promise((resolve) => {
                    worker.postMessage({ decode: bytes.buffer }, [bytes.buffer]);
                    const interval = setInterval(() => {
                        if (data.length === lastCheck) {
                            clearInterval(interval);
                            data.length = 0;
                            resolve();
                        }
                        else {
                            lastCheck = data.length;
                        }
                    }, 100);
                });
            }
        };
    })();
    worker.onmessage = (event) => {
        const { decoded } = event.data;
        if (decoded) {
            onBuffer(decoded);
            push(1);
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
                await decode(value);
            }
            return reader.read().then(evalChunk);
        }
        // TODO fail on decode() error and exit read() loop
        await reader.read().then(evalChunk);
    }
}
