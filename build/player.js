/**
 *
 * @param channels
 * @param sampleRate
 */
// TODO: add docs
// TODO: make work for multi-channels (stolons)
export function player({ channels: c, sampleRate: s }) {
    const flushingTime = 200;
    const channels = c;
    const sampleRate = s;
    const ctx = new (AudioContext || window.webkitAudioContext)();
    let samples = new Float32Array(0);
    let startTime = ctx.currentTime;
    let interval = 0;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(ctx.destination);
    function init() {
        clearInterval(interval);
        interval = setInterval(flush, flushingTime);
    }
    function feed(data) {
        const tmp = new Float32Array(samples.length + data.length);
        tmp.set(samples, 0);
        tmp.set(data, samples.length);
        samples = tmp;
    }
    function flush() {
        if (!channels || !sampleRate || !samples.length)
            return;
        const bufferSource = ctx.createBufferSource();
        const length = samples.length / channels;
        const audioBuffer = ctx.createBuffer(channels, length, sampleRate);
        for (let channel = 0; channel < channels; channel++) {
            const audioData = audioBuffer.getChannelData(channel);
            let offset = channel;
            let decrement = 50;
            for (let i = 0; i < length; i++) {
                audioData[i] = samples[offset];
                /* fadein */
                if (i < 50) {
                    audioData[i] = (audioData[i] * i) / 50;
                }
                /* fadeout*/
                if (i >= length - 51) {
                    audioData[i] = (audioData[i] * decrement--) / 50;
                }
                offset += channels;
            }
        }
        if (startTime < ctx.currentTime) {
            startTime = ctx.currentTime;
        }
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(gainNode);
        bufferSource.start(startTime);
        startTime += audioBuffer.duration;
        samples = new Float32Array(0);
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
        init
    };
}
