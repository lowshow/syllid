import { ListProcessorHandler } from "./listProcessor";
import { PlayerHandler } from "./player";
import { ChannelStream, StreamHandler } from "./channelStream";
export interface SyllidContextInterface {
    sampleRate: () => number;
    onWarning: (message: string | Error | ErrorEvent) => void;
    onFailure: (error: string | Error | ErrorEvent) => void;
}
export declare class Syllid implements StreamHandler, ListProcessorHandler, PlayerHandler {
    private context;
    private locations;
    private urlLocationMap;
    private streams;
    private player;
    private processor;
    /**
     *
     * @param context Interface to the context importing this lib
     */
    constructor(context: SyllidContextInterface);
    private createStreams;
    getChannels(): number;
    randomInt(from: number, to: number): number;
    private validatePlaylist;
    private addSlash;
    getSegmentURLs(stream: ChannelStream): void;
    bufferSegmentData(fetchList: string[], index: number): Promise<void>;
    onBuffer(buffer: Float32Array, index: number): void;
    playChannel(index: number): void;
    stopChannel(index: number): void;
    addURL(url: URL): this;
    removeURL(url: URL): this;
    stop(): this;
    onWarning(message: string | Error | ErrorEvent): void;
    onFailure(error: string | Error | ErrorEvent): void;
}
//# sourceMappingURL=syllid.d.ts.map