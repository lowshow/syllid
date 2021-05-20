import { WorkerWrapper, WorkerWrapperHandler } from "./workerWrapper"

type Result = ReadableStreamDefaultReadResult<Uint8Array>

type Reader = ReadableStreamDefaultReader<Uint8Array>

export interface ListProcessorHandler
{
	onBuffer: ( buffer: Float32Array, index: number ) => void
}

export class ListProcessor implements WorkerWrapperHandler
{
	private workers: WorkerWrapper[]

	public onBuffer: ( buffer: Float32Array, index: number ) => void

	constructor( private handler: ListProcessorHandler, private sampleRate: number = 48000 )
	{
		this.workers = []

		this.onBuffer = this.handler.onBuffer
	}

	private createWorkerForIndex( index: number )
	{
		this.workers[ index ] = new WorkerWrapper( index, this, this.sampleRate )
	}

	private async evalChunk(
		reader: Reader,
		file: string,
		{ done, value }: Result,
		index: number ): Promise<void> 
	{
		if ( done ) return

		if ( value ) await this.workers[ index ].decode( value, file )

		return reader.read().then( res => this.evalChunk( reader, file, res, index ) )
	}

	// TODO: fail on decode() error and exit read() loop
	public async processURLList( fileList: string[], index: number ): Promise<void>
	{
		if ( !this.workers[ index ] ) this.createWorkerForIndex( index )

		for ( const file of fileList )
		{
			const response = await fetch( file )

			if ( !response.ok )
				throw Error(
					`Invalid Response: ${response.status} ${response.statusText}`
				)

			if ( !response.body ) throw Error( `ReadableStream not supported.` )
		
			const reader = response.body.getReader()
		
			this.workers[ index ].queueFile( file )

			await reader.read().then( res => this.evalChunk( reader, file, res, index ) )
		}
	}
}