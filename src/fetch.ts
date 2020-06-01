import { last } from "./common/util.js"

// TODO: add docs
export async function processURLList(
    fileList: string[],
    worker: Worker,
    onBuffer: (buffer: Float32Array) => void
): Promise<void> {
    const decoding: string[] = []
    const decodeFiles: { [index: string]: boolean } = {}

    // const decodeIndex: { [index: string]: number } = {}
    // const decodedData: Float32Array[][] = []

    function decode(bytes: Uint8Array, file: string): Promise<any> {
        return new Promise((resolve: any): void => {
            worker.postMessage({ decode: bytes.buffer }, [bytes.buffer])
            const interval: number = setInterval((): void => {
                if (!decodeFiles[file]) return
                resolve()
                clearInterval(interval)
            }, 50)
        })
    }

    worker.onmessage = (event: MessageEvent): void => {
        const { decoded, done }: any = event.data
        if (decoded) {
            onBuffer(decoded)
            // decodedData[decodeIndex[last(decoding)]].push(decoded)
        } else if (done) {
            decodeFiles[last(decoding)] = true
        }
    }

    for (const file of fileList) {
        const response: Response = await fetch(file)
        if (!response.ok)
            throw Error(
                `Invalid Response: ${response.status} ${response.statusText}`
            )
        if (!response.body) throw Error("ReadableStream not supported.")

        const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader()

        async function evalChunk({
            done,
            value
        }: ReadableStreamReadResult<Uint8Array>): Promise<any> {
            if (done) return
            if (value) {
                await decode(value, file)
            }

            return reader.read().then(evalChunk)
        }

        // TODO fail on decode() error and exit read() loop
        decoding.push(file)
        decodeFiles[file] = false
        // const index: number = decoding.length - 1
        // decodedData[decodeIndex[index]] = []
        await reader.read().then(evalChunk)
        // console.log("done", file, decodedData[decodeIndex[index]])
    }
}
