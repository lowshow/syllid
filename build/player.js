/**
 *
 * @param channels
 * @param sampleRate
 */
// TODO: add docs
// TODO: make work for multi-channels (stolons)
export function player({ sampleRate: _sampleRate }) {
    const flushingTime = 200;
    const sampleRate = _sampleRate;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    ctx.suspend();
    const channels = ctx.destination.maxChannelCount;
    ctx.destination.channelCount = channels;
    ctx.destination.channelInterpretation = "discrete";
    const samples = Array(channels)
        .fill(0)
        .map(() => new Float32Array(0));
    const starts = Array(channels).fill(ctx.currentTime);
    let interval = 0;
    const merger = ctx.createChannelMerger(channels);
    merger.connect(ctx.destination);
    function init() {
        clearInterval(interval);
        interval = setInterval(flush, flushingTime);
        ctx.resume();
    }
    function feed(data, channel) {
        const tmp = new Float32Array(samples[channel].length + data.length);
        tmp.set(samples[channel], 0);
        tmp.set(data, samples[channel].length);
        samples[channel] = tmp;
    }
    function flush() {
        if (!sampleRate)
            return;
        for (let channel = 0; channel < channels; channel++) {
            const s = samples[channel];
            samples[channel] = new Float32Array(0);
            if (!s.length)
                continue;
            const bufferSource = ctx.createBufferSource();
            const audioBuffer = ctx.createBuffer(1, s.length, sampleRate);
            const audioData = audioBuffer.getChannelData(0);
            audioData.set(s, 0);
            if (starts[channel] < ctx.currentTime) {
                starts[channel] = ctx.currentTime;
            }
            bufferSource.buffer = audioBuffer;
            bufferSource.connect(merger, 0, channel);
            bufferSource.start(starts[channel]);
            starts[channel] += audioBuffer.duration;
        }
    }
    function stop() {
        clearInterval(interval);
        interval = 0;
        setTimeout(() => {
            ctx.suspend();
        }, 1010);
    }
    return {
        feed,
        stop,
        init,
        channels
    };
}
