// TODO: add docs
interface Decoder {
    push: (messageData: any) => void
    decode: (bytes: Uint8Array) => Promise<any>
}

// TODO: add docs
export async function processURLList(
    fileList: string[],
    onBuffer: (buffer: Float32Array) => void
): Promise<void> {
    const worker: Worker = new Worker("/static/decoder/decoder.js")

    const { decode, push }: Decoder = ((): Decoder => {
        const data: number[] = []
        let lastCheck: number = 0
        return {
            push: (state: number): void => {
                data.push(state)
            },
            decode: (bytes: Uint8Array): Promise<any> => {
                return new Promise((resolve: any): void => {
                    worker.postMessage({ decode: bytes.buffer }, [bytes.buffer])
                    const interval: number = setInterval((): void => {
                        if (data.length === lastCheck) {
                            clearInterval(interval)
                            data.length = 0
                            resolve()
                        } else {
                            lastCheck = data.length
                        }
                    }, 100)
                })
            }
        }
    })()

    worker.onmessage = (event: MessageEvent): void => {
        const { decoded }: any = event.data
        if (decoded) {
            onBuffer(decoded)
            push(1)
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
                await decode(value)
            }

            return reader.read().then(evalChunk)
        }

        // TODO fail on decode() error and exit read() loop
        await reader.read().then(evalChunk)
    }
}
