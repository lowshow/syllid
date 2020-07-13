function flush({ ctx, merger, state }) {
    for (let channel = 0; channel < state.channels; channel++) {
        const s = state.samples[channel];
        state.samples[channel] = new Float32Array(0);
        if (!s.length)
            continue;
        const bufferSource = ctx.createBufferSource();
        const audioBuffer = ctx.createBuffer(1, s.length, state.sampleRate);
        const audioData = audioBuffer.getChannelData(0);
        audioData.set(s, 0);
        if (state.startTimes[channel] < ctx.currentTime) {
            state.startTimes[channel] = ctx.currentTime;
        }
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(merger, 0, channel);
        bufferSource.start(state.startTimes[channel]);
        const index = state.buffers[channel].length;
        bufferSource.addEventListener("ended", () => {
            state.buffers[channel][index] = undefined;
            try {
                bufferSource.disconnect(merger, 0, channel);
            }
            catch (e) {
                console.warn("Buffer not disconnected on end", channel, e);
            }
        });
        state.buffers[channel].push(bufferSource);
        state.startTimes[channel] += audioBuffer.duration;
    }
}
/**
 *
 * @param sampleRate
 */
// TODO: add docs
export function player({ sampleRate: _sampleRate }) {
    if (!_sampleRate)
        throw Error("No sample rate provided.");
    const flushingTime = 200;
    const sampleRate = _sampleRate;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    ctx.suspend();
    const channels = ctx.destination.maxChannelCount;
    ctx.destination.channelCount = channels;
    ctx.destination.channelInterpretation = "discrete";
    const state = {
        channels,
        sampleRate,
        samples: Array(channels)
            .fill(0)
            .map(() => new Float32Array(0)),
        startTimes: Array(channels).fill(ctx.currentTime),
        interval: 0,
        buffers: Array(channels).fill([])
    };
    const merger = ctx.createChannelMerger(channels);
    merger.connect(ctx.destination);
    return {
        channels,
        getState: () => state,
        feed: ({ channel, data }) => {
            const tmp = new Float32Array(state.samples[channel].length + data.length);
            tmp.set(state.samples[channel], 0);
            tmp.set(data, state.samples[channel].length);
            state.samples[channel] = tmp;
        },
        stopChannel: (channel) => {
            state.buffers[channel].forEach((buffer) => {
                try {
                    if (!buffer)
                        return;
                    buffer.disconnect(merger, 0, channel);
                    buffer.stop(ctx.currentTime);
                }
                catch (e) {
                    console.warn("Buffer not disconnected on stop", channel, e);
                }
            });
            state.samples[channel] = new Float32Array(0);
        },
        stop: () => {
            clearInterval(state.interval);
            state.interval = 0;
            ctx.suspend();
        },
        init: () => {
            clearInterval(state.interval);
            state.interval = setInterval(() => {
                flush({
                    ctx,
                    merger,
                    state
                });
            }, flushingTime);
            ctx.resume();
        }
    };
}
