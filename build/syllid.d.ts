import { ListProcessorHandler } from "./listProcessor";
import { Stream, StreamHandler } from "./stream";
export interface SyllidContextInterface {
    sampleRate: () => number;
    onWarning: (message: string | Error | ErrorEvent) => void;
    onFailure: (error: Error) => void;
}
export declare class Syllid implements StreamHandler, ListProcessorHandler {
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
    onStopChannel(index: number): void;
    randomInt(from: number, to: number): number;
    private validatePlaylist;
    private addSlash;
    private populate;
    private fetchloop;
    onBuffer(buffer: Float32Array, index: number): void;
    playChannel(index: number): Promise<Stream>;
    addURL(url: URL): Promise<this>;
    removeURL(url: URL): this;
    stop(): this;
    onWarning(message: string): void;
    onFailure(error: Error): void;
}
//# sourceMappingURL=syllid.d.ts.map