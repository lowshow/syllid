export interface StreamHandler {
    onStopChannel: (index: number) => void;
}
export interface StreamProvider {
    randomInt: (min: number, max: number) => number;
}
export declare class Stream {
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
    setFreshLocation(location: string): void;
    setStaleLocation(location: string): void;
    stopChannel(): void;
    getPath(): string;
}
//# sourceMappingURL=stream.d.ts.map