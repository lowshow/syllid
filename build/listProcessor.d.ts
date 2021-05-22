import { WorkerWrapperHandler } from "./workerWrapper";
export interface ListProcessorHandler {
    onBuffer: (buffer: Float32Array, index: number) => void;
}
export declare class ListProcessor implements WorkerWrapperHandler {
    private handler;
    private sampleRate;
    private workers;
    onBuffer: (buffer: Float32Array, index: number) => void;
    constructor(handler: ListProcessorHandler, sampleRate?: number);
    private createWorkerForIndex;
    private evalChunk;
    processURLList(fileList: string[], index: number): Promise<void>;
}
//# sourceMappingURL=listProcessor.d.ts.map