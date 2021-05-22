export class Player
{
	public channels: number

	private flushingTime = 200

	private merger: ChannelMergerNode

	private samples: Float32Array[]

	private startTimes: number[]

	private interval: number

	private buffers: ( AudioBufferSourceNode | undefined )[][]

	private ctx: AudioContext

	constructor( private sampleRate: number )
	{
		this.init = this.init.bind( this )

		this.flush = this.flush.bind( this )

		this.feed = this.feed.bind( this )

		this.stop = this.stop.bind( this )

		this.stopChannel = this.stopChannel.bind( this )

		this.flushingTime = 200

		this.ctx = new ( window.AudioContext || window.webkitAudioContext )()

		this.ctx.suspend()

		const { maxChannelCount, channelCount } = this.ctx.destination

		this.channels = Math.max( maxChannelCount, channelCount )

		this.samples = Array( this.channels )
			.fill( 0 )
			.map( () => new Float32Array( 0 ) )

		this.startTimes = Array( this.channels ).fill( this.ctx.currentTime )

		this.interval = 0

		this.buffers = Array( this.channels ).fill( [] )
		
		if ( maxChannelCount > channelCount ) this.ctx.destination.channelCount = this.channels

		this.ctx.destination.channelInterpretation = `discrete`

		this.merger = this.ctx.createChannelMerger( this.channels )

		this.merger.connect( this.ctx.destination )
	}

	private flush(): void
	{
		for ( let channel = 0; channel < this.channels; channel++ ) 
		{
			const s = this.samples[ channel ]

			this.samples[ channel ] = new Float32Array( 0 )

			if ( !s.length ) continue
		
			const bufferSource = this.ctx.createBufferSource()

			const audioBuffer = this.ctx.createBuffer(
				1,
				s.length,
				this.sampleRate
			)
		
			const audioData = audioBuffer.getChannelData( 0 )

			audioData.set( s, 0 )
		
			if ( this.startTimes[ channel ] < this.ctx.currentTime ) 
			{
				this.startTimes[ channel ] = this.ctx.currentTime
			}
		
			bufferSource.buffer = audioBuffer

			bufferSource.connect( this.merger, 0, channel )
		
			bufferSource.start( this.startTimes[ channel ] )

			const index = this.buffers[ channel ].length

			bufferSource.addEventListener( `ended`, (): void => 
			{
				this.buffers[ channel ][ index ] = undefined

				try 
				{
					bufferSource.disconnect( this.merger, 0, channel )
				}
				catch ( e ) 
				{
					console.warn( `Buffer not disconnected on end`, channel, e )
				}
			} )

			this.buffers[ channel ].push( bufferSource )

			this.startTimes[ channel ] += audioBuffer.duration
		}
	}

	public feed( channel: number, data: Float32Array ): void
	{
		const tmp: Float32Array = new Float32Array(
			this.samples[ channel ].length + data.length
		)

		tmp.set( this.samples[ channel ], 0 )

		tmp.set( data, this.samples[ channel ].length )

		this.samples[ channel ] = tmp
	}

	public stopChannel( channel: number ): void
	{
		for ( const buffer of this.buffers[ channel ] )
		{
			try
			{
				if ( !buffer ) continue

				buffer.stop( this.ctx.currentTime )
			}
			catch ( e )
			{
				console.warn(
					`Buffer not disconnected on stop`,
					channel,
					e
				)
			}
		}

		this.samples[ channel ] = new Float32Array( 0 )
	}

	public stop(): void
	{
		clearInterval( this.interval )

		this.interval = 0

		this.ctx.suspend()
	}

	public init(): void
	{
		clearInterval( this.interval )

		this.interval = window.setInterval( this.flush, this.flushingTime )

		this.ctx.resume()
	}
}