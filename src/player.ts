// TODO: add docs
declare global {
    interface Window {
        AudioContext: typeof AudioContext
        webkitAudioContext: typeof AudioContext
    }
}

// TODO: add docs
export interface PlayerFn {
    getState: () => PlayerState
    feed: (args: { data: Float32Array; channel: number }) => void
    stop: () => void
    stopChannel: (channel: number) => void
    init: () => void
    channels: number
}

interface PlayerState {
    samples: Float32Array[]
    startTimes: number[]
    interval: number
    channels: number
    sampleRate: number
    buffers: (AudioBufferSourceNode | undefined)[][]
}

function flush({
    ctx,
    merger,
    state
}: {
    ctx: AudioContext
    merger: ChannelMergerNode
    state: PlayerState
}): void {
    for (let channel: number = 0; channel < state.channels; channel++) {
        const s: Float32Array = state.samples[channel]
        state.samples[channel] = new Float32Array(0)
        if (!s.length) continue

        const bufferSource: AudioBufferSourceNode = ctx.createBufferSource()
        const audioBuffer: AudioBuffer = ctx.createBuffer(
            1,
            s.length,
            state.sampleRate
        )

        const audioData: Float32Array = audioBuffer.getChannelData(0)
        audioData.set(s, 0)

        if (state.startTimes[channel] < ctx.currentTime) {
            state.startTimes[channel] = ctx.currentTime
        }

        bufferSource.buffer = audioBuffer
        bufferSource.connect(merger, 0, channel)

        bufferSource.start(state.startTimes[channel])
        const index: number = state.buffers[channel].length
        bufferSource.addEventListener("ended", (): void => {
            state.buffers[channel][index] = undefined
            try {
                bufferSource.disconnect(merger, 0, channel)
            } catch {
                //
            }
        })
        state.buffers[channel].push(bufferSource)
        state.startTimes[channel] += audioBuffer.duration
    }
}

/**
 *
 * @param sampleRate
 */
// TODO: add docs
export function player({
    sampleRate: _sampleRate
}: {
    sampleRate: number
}): PlayerFn {
    if (!_sampleRate) throw Error("No sample rate provided.")

    const flushingTime: number = 200
    const sampleRate: number = _sampleRate
    const Ctx: typeof AudioContext =
        window.AudioContext || window.webkitAudioContext
    const ctx: AudioContext = new Ctx()
    ctx.suspend()
    const channels: number = ctx.destination.maxChannelCount
    ctx.destination.channelCount = channels
    ctx.destination.channelInterpretation = "discrete"

    const state: PlayerState = {
        channels,
        sampleRate,
        samples: Array(channels)
            .fill(0)
            .map((): Float32Array => new Float32Array(0)),
        startTimes: Array(channels).fill(ctx.currentTime),
        interval: 0,
        buffers: Array(channels).fill([])
    }

    const merger: ChannelMergerNode = ctx.createChannelMerger(channels)
    merger.connect(ctx.destination)

    return {
        channels,
        getState: (): PlayerState => state,
        feed: ({
            channel,
            data
        }: {
            data: Float32Array
            channel: number
        }): void => {
            const tmp: Float32Array = new Float32Array(
                state.samples[channel].length + data.length
            )
            tmp.set(state.samples[channel], 0)
            tmp.set(data, state.samples[channel].length)
            state.samples[channel] = tmp
        },
        stopChannel: (channel: number): void => {
            state.buffers[channel].forEach(
                (buffer: AudioBufferSourceNode | undefined): void => {
                    try {
                        if (!buffer) return
                        buffer.disconnect(merger, 0, channel)
                        buffer.stop(ctx.currentTime)
                    } catch {
                        //
                    }
                }
            )
            state.samples[channel] = new Float32Array(0)
        },
        stop: (): void => {
            clearInterval(state.interval)
            state.interval = 0
            ctx.suspend()
        },
        init: (): void => {
            clearInterval(state.interval)
            state.interval = setInterval((): void => {
                flush({
                    ctx,
                    merger,
                    state
                })
            }, flushingTime)
            ctx.resume()
        }
    }
}
