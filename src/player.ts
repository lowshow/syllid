// TODO: add docs
declare global {
    interface Window {
        AudioContext: typeof AudioContext
        webkitAudioContext: typeof AudioContext
    }
}

// TODO: add docs
export interface PlayerFn {
    feed: (data: Float32Array, channel: number) => void
    stop: () => void
    init: () => void
    channels: number
}

/**
 *
 * @param channels
 * @param sampleRate
 */
// TODO: add docs
// TODO: make work for multi-channels (stolons)
export function player({
    sampleRate: _sampleRate
}: {
    sampleRate: number
}): PlayerFn {
    const flushingTime: number = 200
    const sampleRate: number = _sampleRate
    const Ctx: typeof AudioContext =
        window.AudioContext || window.webkitAudioContext
    const ctx: AudioContext = new Ctx()
    ctx.suspend()
    const channels: number = ctx.destination.maxChannelCount
    ctx.destination.channelCount = channels
    ctx.destination.channelInterpretation = "discrete"

    const samples: Float32Array[] = Array(channels)
        .fill(0)
        .map((): Float32Array => new Float32Array(0))
    const starts: number[] = Array(channels).fill(ctx.currentTime)
    let interval: number = 0

    const merger: ChannelMergerNode = ctx.createChannelMerger(channels)
    merger.connect(ctx.destination)

    function init(): void {
        clearInterval(interval)
        interval = setInterval(flush, flushingTime)
        ctx.resume()
    }

    function feed(data: Float32Array, channel: number): void {
        const tmp: Float32Array = new Float32Array(
            samples[channel].length + data.length
        )
        tmp.set(samples[channel], 0)
        tmp.set(data, samples[channel].length)
        samples[channel] = tmp
    }

    function flush(): void {
        if (!sampleRate) return

        for (let channel: number = 0; channel < channels; channel++) {
            const s: Float32Array = samples[channel]
            samples[channel] = new Float32Array(0)
            if (!s.length) continue
            const bufferSource: AudioBufferSourceNode = ctx.createBufferSource()

            const audioBuffer: AudioBuffer = ctx.createBuffer(
                1,
                s.length,
                sampleRate
            )

            const audioData: Float32Array = audioBuffer.getChannelData(0)
            audioData.set(s, 0)

            if (starts[channel] < ctx.currentTime) {
                starts[channel] = ctx.currentTime
            }

            bufferSource.buffer = audioBuffer
            bufferSource.connect(merger, 0, channel)
            bufferSource.start(starts[channel])
            starts[channel] += audioBuffer.duration
        }
    }

    function stop(): void {
        clearInterval(interval)
        interval = 0
        setTimeout((): void => {
            ctx.suspend()
        }, 1010)
    }

    return {
        feed,
        stop,
        init,
        channels
    }
}
