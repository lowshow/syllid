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
    ctx.destination.channelCount = ctx.destination.maxChannelCount
    ctx.destination.channelInterpretation = "discrete"

    const samples: Float32Array[] = Array(channels)
        .fill(0)
        .map((): Float32Array => new Float32Array(0))
    let startTime: number = ctx.currentTime
    let interval: number = 0

    const gainNode: GainNode = ctx.createGain()
    gainNode.gain.value = 1
    gainNode.connect(ctx.destination)

    function init(): void {
        clearInterval(interval)
        interval = setInterval(flush, flushingTime)
    }

    function feed(data: Float32Array, channel: number): void {
        const tmp: Float32Array = new Float32Array(
            samples[channel].length + data.length
        )
        tmp.set(samples[channel], 0)
        tmp.set(data, samples[channel].length)
        samples[channel] = tmp
        // console.log("channel", channel, samples[channel])
    }

    function flush(): void {
        if (!sampleRate) return

        const length: number = samples.reduce(
            (l: number, s: Float32Array): number => {
                return s.length > l ? s.length : l
            },
            0
        )
        // console.log(length)
        if (!length) return

        const bufferSource: AudioBufferSourceNode = ctx.createBufferSource()

        const audioBuffer: AudioBuffer = ctx.createBuffer(
            channels,
            // 1,
            length,
            sampleRate
        )

        for (let channel: number = 0; channel < channels; channel++) {
            const audioData: Float32Array = audioBuffer.getChannelData(channel)
            for (let i: number = 0; i < length; i++) {
                audioData[i] = samples[channel][i] || 0
            }
        }

        if (startTime < ctx.currentTime) {
            startTime = ctx.currentTime
        }

        bufferSource.buffer = audioBuffer
        // bufferSource.connect(gainNode)
        bufferSource.connect(ctx.destination)
        bufferSource.start(startTime)
        startTime += audioBuffer.duration

        for (let i: number = 0; i < samples.length; i++) {
            samples[i] = new Float32Array(0)
        }
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
        init,
        channels
    }
}
