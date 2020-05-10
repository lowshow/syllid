declare function importScripts(...urls: string[]): void
declare class OpusStreamDecoder {
    constructor(args: { onDecode: any })
    public ready: boolean
    public decode(arg: Uint8Array): void
}

// reference aliased via nginx
importScripts("./opus-stream-decoder.js")

const decoder: any = new OpusStreamDecoder({ onDecode })

;((self as unknown) as Worker).onmessage = async (
    event: MessageEvent
): Promise<void> => {
    await decoder.ready
    decoder.decode(new Uint8Array(event.data.decode))
}

function onDecode({ left, samplesDecoded }: any): void {
    // Decoder recovers when it receives new files,
    // and samplesDecoded is negative.
    // For cause, see
    // https://github.com/AnthumChris/opus-stream-decoder/issues/7
    if (samplesDecoded < 0) {
        return
    }
    ;((self as unknown) as Worker).postMessage({ decoded: left })
}
