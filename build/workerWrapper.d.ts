export interface WorkerWrapperHandler {
    onBuffer: (buffer: Float32Array, index: number) => void;
    onFailure: (error: string | Error | ErrorEvent) => void;
}
export declare class WorkerWrapper {
    private index;
    private handler;
    private worker;
    private decoding;
    private decodeFiles;
    constructor(index: number, handler: WorkerWrapperHandler, sampleRate: number);
    private onMessage;
    private createWorkerScriptBlob;
    decode(bytes: Uint8Array, file: string): Promise<void>;
    queueFile(file: string): void;
}
//# sourceMappingURL=workerWrapper.d.ts.map