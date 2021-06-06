import worker from "worker!/opus-recorder/dist/decoder/decoderWorker.min.js"

export interface WorkerWrapperHandler
{
	onBuffer: ( buffer: Float32Array, index: number ) => void

	onFailure: ( error: string | Error | ErrorEvent ) => void
}

export class WorkerWrapper
{
	private worker: Worker

	private decoding: string[]

	private decodeFiles: Record<string, boolean>

	constructor( private index: number, private handler: WorkerWrapperHandler, sampleRate: number )
	{
		this.worker = new Worker( this.createWorkerScriptBlob( worker ), {
			name: `decode-worker`,
			type: `module`,
		} )

		this.decodeFiles = {}

		this.decoding = []

		this.onMessage = this.onMessage.bind( this )

		this.worker.onmessage = this.onMessage

		this.worker.onerror = err => this.handler.onFailure( err )

		this.worker.postMessage( { 
			command: `init`,
			decoderSampleRate: sampleRate,
			outputBufferSampleRate: sampleRate
		} )
	}

	private onMessage( { data }: MessageEvent<Float32Array[]> ): void
	{
		// null means decoder is finished
		if ( data === null )
		{
			this.decodeFiles[ this.decoding[ this.decoding.length - 1 ] ] = true
		}
		else
		{
			// data contains decoded buffers as float32 values
			for( const buffer of data )
			{
				this.handler.onBuffer( buffer, this.index )
			}
		}
	}

	private createWorkerScriptBlob( script: string ): URL
	{
		const blob = new Blob( [ script ], { type: `text/javascript` } )

		return new URL( URL.createObjectURL( blob ), import.meta.url )
	}

	public decode( bytes: Uint8Array, file: string ): Promise<void>
	{
		return new Promise( resolve =>
		{
			this.worker.postMessage( {
				command: `decode`,
				pages: bytes
			}, [ bytes.buffer ] )

			const interval: number = window.setInterval( (): void =>
			{
				if ( !this.decodeFiles[ file ] ) return
				
				resolve()
				
				clearInterval( interval )
			}, 50 )
		} )
	}

	public queueFile( file: string ): void
	{
		this.decoding.push( file )
			
		this.decodeFiles[ file ] = false
	}
}