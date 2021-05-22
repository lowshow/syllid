import { ListProcessor, ListProcessorHandler } from "./listProcessor"
import { Player } from "./player"
import { Stream, StreamHandler } from "./stream"

export interface SyllidContextInterface
{
	sampleRate: () => number

	onWarning: ( message: string | Error | ErrorEvent ) => void

	onFailure: ( error: Error ) => void
}

interface PlaylistItem
{
	id: string
	streamId: string
	url: string
}
    
type Playlist = PlaylistItem[]

export class Syllid implements StreamHandler, ListProcessorHandler
{
	private locations: string[]

	private urlLocationMap: Record<string, number>

	private streams: Stream[]

	private player: Player

	private processor: ListProcessor

	/**
	 * 
	 * @param context Interface to the context importing this lib
	 */
	constructor( private context: SyllidContextInterface ) 
	{
		this.onBuffer = this.onBuffer.bind( this )
		
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
		for ( let i = 0; i < this.player.channels; i++ ) 
		{
			this.streams[ i ] = new Stream( i, this, this )
		}
	}

	public onStopChannel( index: number ): void
	{
		this.player.stopChannel( index )

		clearInterval( this.streams[ index ].interval )

		clearInterval( this.streams[ index ].fetchInterval )

		this.streams[ index ].running = false
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

	private populate( index: number ): void 
	{
		const stream = this.streams[ index ]

		const randomLocation = this.locations[ this.randomInt( 0, this.locations.length ) ]

		const path: string = stream.getPath( randomLocation )

		if ( !path ) return

		// start=random query required to hint server
		// to return samples from a random start point
		fetch( `${path}?start=random` )
			.then( response => 
			{
				stream.setStaleLocation( this.addSlash( response.url ) )

				return response.json()
			} )
			.then( ( items: Playlist ): void => 
			{
				this.validatePlaylist( items )
					.slice( 0, this.randomInt( 0, items.length ) )
					.forEach( ( { id, url }: PlaylistItem ): void => 
					{
						stream.fileList.push( url )

						stream.idList.push( id )
					} )
			} )
			.catch( ( e: Error ): void => 
			{
				console.error( e.message )
			} )
	}

	private async fetchloop( index: number ): Promise<void> 
	{
		// All queued files have been or are being processed for this stream
		if ( this.streams[ index ].fileList.length === this.streams[ index ].processedIndex )
			return

		const fetchList = this.streams[ index ].fileList.slice(
			this.streams[ index ].processedIndex
		)

		this.streams[ index ].processedIndex += fetchList.length

		await this.processor.processURLList( fetchList, index )
	}

	public onBuffer( buffer: Float32Array, index: number ): void
	{
		if ( this.streams[ index ].running )
			this.player.feed( index, buffer )
	}

	public playChannel( index: number ): Promise<Stream> 
	{
		return new Promise<Stream>( resolve => 
		{
			// fetch opus list (loop per channel)
			// NOTE: because of redirect, list of ids will need to be
			// URLs (or an id/url map, or provide a base url)

			resolve( this.streams[ index ] )

			this.populate( index )

			this.streams[ index ].interval = window.setInterval( () => 
				this.populate( index ), 3000 )

			this.streams[ index ].running = true

			this.fetchloop( index )

			this.streams[ index ].fetchInterval = window.setInterval( () => 
				this.fetchloop( index ), 1000 )
		} )
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
			stream.stopChannel()
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