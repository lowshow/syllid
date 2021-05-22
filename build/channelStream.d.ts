export interface StreamHandler {
    bufferSegmentData: (fileList: string[], index: number) => Promise<void>;
}
export interface StreamProvider {
    randomInt: (min: number, max: number) => number;
    getSegmentURLs: (stream: ChannelStream) => void;
}
export declare class ChannelStream {
    private index;
    private handler;
    private provider;
    fileList: string[];
    idList: string[];
    processedIndex: number;
    location: string;
    freshLocation: boolean;
    count: number;
    running: boolean;
    interval: number;
    fetchInterval: number;
    constructor(index: number, handler: StreamHandler, provider: StreamProvider);
    private setFreshLocation;
    setStaleLocation(location: string): void;
    start(): void;
    private processURLs;
    stop(): void;
    getPath(location: string): string;
    addItemsFromPlaylist(playlist: Playlist): void;
}
//# sourceMappingURL=channelStream.d.ts.map