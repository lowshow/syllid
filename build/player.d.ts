export declare class Player {
    private sampleRate;
    channels: number;
    private flushingTime;
    private merger;
    private samples;
    private startTimes;
    private interval;
    private buffers;
    private ctx;
    constructor(sampleRate: number);
    private flush;
    feed(channel: number, data: Float32Array): void;
    stopChannel(channel: number): void;
    stop(): void;
    init(): void;
}
//# sourceMappingURL=player.d.ts.map