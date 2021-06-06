export interface PlayerHandler {
    onWarning: (error: string | Error) => void;
}
export declare class Player {
    private sampleRate;
    private handler;
    channels: number;
    private flushingTime;
    private merger;
    private samples;
    private startTimes;
    private interval;
    private buffers;
    private ctx;
    constructor(sampleRate: number, handler: PlayerHandler);
    private flush;
    feed(channel: number, data: Float32Array): void;
    stopChannel(channel: number): void;
    stop(): void;
    init(): void;
}
//# sourceMappingURL=player.d.ts.map