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
    ctx.destination.channelCount = ctx.destination.maxChannelCount;
    ctx.destination.channelInterpretation = "discrete";
    const samples = Array(channels)
        .fill(0)
        .map(() => new Float32Array(0));
    let startTime = ctx.currentTime;
    let interval = 0;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(ctx.destination);
    function init() {
        clearInterval(interval);
        interval = setInterval(flush, flushingTime);
    }
    function feed(data, channel) {
        const tmp = new Float32Array(samples[channel].length + data.length);
        tmp.set(samples[channel], 0);
        tmp.set(data, samples[channel].length);
        samples[channel] = tmp;
        // console.log("channel", channel, samples[channel])
    }
    function flush() {
        if (!sampleRate)
            return;
        const length = samples.reduce((l, s) => {
            return s.length > l ? s.length : l;
        }, 0);
        // console.log(length)
        if (!length)
            return;
        const bufferSource = ctx.createBufferSource();
        const audioBuffer = ctx.createBuffer(channels, 
        // 1,
        length, sampleRate);
        for (let channel = 0; channel < channels; channel++) {
            const audioData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                audioData[i] = samples[channel][i] || 0;
            }
        }
        if (startTime < ctx.currentTime) {
            startTime = ctx.currentTime;
        }
        bufferSource.buffer = audioBuffer;
        // bufferSource.connect(gainNode)
        bufferSource.connect(ctx.destination);
        bufferSource.start(startTime);
        startTime += audioBuffer.duration;
        for (let i = 0; i < samples.length; i++) {
            samples[i] = new Float32Array(0);
        }
    }
    function stop() {
        clearInterval(interval);
        interval = 0;
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.000001, ctx.currentTime + 1);
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
