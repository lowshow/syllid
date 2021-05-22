import { ListProcessor, ListProcessorHandler } from "./listProcessor"
import { Player } from "./player"
import { ChannelStream, StreamHandler } from "./channelStream"

export interface SyllidContextInterface
{
	sampleRate: () => number

	onWarning: ( message: string | Error | ErrorEvent ) => void

	onFailure: ( error: Error ) => void
}

export class Syllid implements StreamHandler, ListProcessorHandler
{
	private locations: string[]

	private urlLocationMap: Record<string, number>

	private streams: ChannelStream[]

	private player: Player

	private processor: ListProcessor

	/**
	 * 
	 * @param context Interface to the context importing this lib
	 */
	constructor( private context: SyllidContextInterface ) 
	{
		this.onBuffer = this.onBuffer.bind( this )

		this.getSegmentURLs = this.getSegmentURLs.bind( this )

		this.bufferSegmentData = this.bufferSegmentData.bind( this )

		this.stopChannel = this.stopChannel.bind( this )
		
		this.locations = []

		this.urlLocationMap = {}

		this.player = new Player( this.context.sampleRate() )

		this.processor = new ListProcessor( this )

		this.streams = []

		this.createStreams()

		this.player.init()
	}

	private createStreams(): void 
	{
		for ( let i = 0; i < this.getChannels(); i++ ) 
		{
			this.streams[ i ] = new ChannelStream( i, this, this )
		}
	}

	public getChannels(): number
	{
		return this.player.channels
	}

	public randomInt( from: number, to: number ): number
	{
		if ( to < from ) return from
		
		return Math.floor( Math.random() * ( to - from ) + from )
	}

	private validatePlaylist( items: Playlist ): Playlist 
	{
		if ( !Array.isArray( items ) ) 
		{
			throw Error( `Playlist is not an array.` )
		}

		items.forEach( ( i: PlaylistItem ): void => 
		{
			try 
			{
				new URL( i.url ).toString()
			}
			catch
			{
				throw Error( `${i.url} in playlist is invalid URL.` )
			}

			if ( !i.id || typeof i.id !== `string` ) 
			{
				throw Error( `${i.id || `Missing ID`} in playlist is invalid ID.` )
			}
		} )

		return items
	}

	private addSlash( url: string ): string 
	{
		return url.endsWith( `/` ) ? url : `${url}/`
	}

	public getSegmentURLs( stream: ChannelStream ): void 
	{
		const randomLocation = this.locations[ this.randomInt( 0, this.locations.length ) ]

		const path: string = stream.getPath( randomLocation )

		if ( !path ) return

		// start=random query required to hint server
		// to return samples from a random start point
		fetch( `${path}?start=random` )
			.then( response => 
			{
				/**
				 * Because of redirects, the actual url we want
				 * to store is the one that fulfilled our request,
				 * this is why response.url is passed to this method
				 */
				stream.setStaleLocation( this.addSlash( response.url ) )

				return response.json()
			} )
			.then( ( items: Playlist ) => 
				this.validatePlaylist( items )
					.slice( 0, this.randomInt( 0, items.length ) ) )
			.then( items => stream.addItemsFromPlaylist( items ) )
			.catch( ( e: Error ) => console.error( e.message ) )
	}

	public async bufferSegmentData( fetchList: string[], index: number ): Promise<void> 
	{
		await this.processor.processURLList( fetchList, index )
	}

	public onBuffer( buffer: Float32Array, index: number ): void
	{
		if ( this.streams[ index ].running )
			this.player.feed( index, buffer )
	}

	public playChannel( index: number ): void
	{
		this.streams[ index ].start()
	}

	public stopChannel( index: number ): void
	{
		this.player.stopChannel( index )

		this.streams[ index ].stop()
	}

	public addURL( url: URL ): this
	{
		try
		{
			const index = this.locations.length

			const _url = url.toString()

			this.urlLocationMap[ _url ] = index

			this.locations.push( this.addSlash( _url ) )

			return this
		}
		catch
		{
			throw Error( `${url} is not a valid URL.` )
		}
	}

	public removeURL( url: URL ): this
	{
		const _url = url.toString()

		const index = this.urlLocationMap[ _url ]

		if ( index === undefined ) return this

		this.locations.splice( index, 1 )

		delete this.urlLocationMap[ _url ]

		return this
	}

	public stop(): this
	{
		this.player.stop()

		for ( const stream of this.streams ) 
		{
			stream.stop()
		}

		return this
	}

	public onWarning( message: string ): void 
	{
		this.context.onWarning( message )
	}

	public onFailure( error: Error ): void 
	{
		this.context.onFailure( error )
	}
}