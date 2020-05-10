// TODO: add docs
declare global {
    interface Window {
        AudioContext: typeof AudioContext
        webkitAudioContext: typeof AudioContext
    }
}

// TODO: add docs
export interface PlayerFn {
    feed: (data: Float32Array) => void
    stop: () => void
    init: () => void
}

/**
 *
 * @param channels
 * @param sampleRate
 */
// TODO: add docs
// TODO: make work for multi-channels (stolons)
export function player({
    channels: c,
    sampleRate: s
}: {
    channels: number
    sampleRate: number
}): PlayerFn {
    const flushingTime: number = 200
    const channels: number = c
    const sampleRate: number = s
    const ctx: AudioContext = new (AudioContext || window.webkitAudioContext)()

    let samples: Float32Array = new Float32Array(0)
    let startTime: number = ctx.currentTime
    let interval: number = 0

    const gainNode: GainNode = ctx.createGain()
    gainNode.gain.value = 1
    gainNode.connect(ctx.destination)

    function init(): void {
        clearInterval(interval)
        interval = setInterval(flush, flushingTime)
    }

    function feed(data: Float32Array): void {
        const tmp: Float32Array = new Float32Array(samples.length + data.length)
        tmp.set(samples, 0)
        tmp.set(data, samples.length)
        samples = tmp
    }

    function flush(): void {
        if (!channels || !sampleRate || !samples.length) return
        const bufferSource: AudioBufferSourceNode = ctx.createBufferSource()
        const length: number = samples.length / channels
        const audioBuffer: AudioBuffer = ctx.createBuffer(
            channels,
            length,
            sampleRate
        )

        for (let channel: number = 0; channel < channels; channel++) {
            const audioData: Float32Array = audioBuffer.getChannelData(channel)
            let offset: number = channel
            let decrement: number = 50
            for (let i: number = 0; i < length; i++) {
                audioData[i] = samples[offset]
                /* fadein */
                if (i < 50) {
                    audioData[i] = (audioData[i] * i) / 50
                }
                /* fadeout*/
                if (i >= length - 51) {
                    audioData[i] = (audioData[i] * decrement--) / 50
                }
                offset += channels
            }
        }

        if (startTime < ctx.currentTime) {
            startTime = ctx.currentTime
        }

        bufferSource.buffer = audioBuffer
        bufferSource.connect(gainNode)
        bufferSource.start(startTime)
        startTime += audioBuffer.duration
        samples = new Float32Array(0)
    }

    function stop(): void {
        clearInterval(interval)
        interval = 0
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(
            0.000001,
            ctx.currentTime + 1
        )
        setTimeout((): void => {
            ctx.suspend()
        }, 1010)
    }

    return {
        feed,
        stop,
        init
    }
}
