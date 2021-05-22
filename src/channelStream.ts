export interface StreamHandler
{
	bufferSegmentData: ( fileList: string[], index: number ) => Promise<void>
}

export interface StreamProvider
{
	randomInt: ( min: number, max: number ) => number

	getSegmentURLs: ( stream: ChannelStream ) => void
}

export class ChannelStream
{
	public fileList: string[]

	public idList: string[]

	public processedIndex: number

	public location: string

	public freshLocation: boolean

	public count: number

	public running: boolean

	public interval: number

	public fetchInterval: number

	constructor(
		private index: number,
		private handler: StreamHandler,
		private provider: StreamProvider )
	{
		this.start = this.start.bind( this )

		this.stop = this.stop.bind( this )

		this.processURLs = this.processURLs.bind( this )
		
		this.count = 0

		this.fileList = []

		this.idList = []

		this.location = ``

		this.processedIndex = 0

		this.running = false

		this.freshLocation = false

		this.interval = 0

		this.fetchInterval = 0
	}

	private setFreshLocation( location: string ): void
	{
		if ( this.count > 0 ) return

		this.count = this.provider.randomInt( 0, 5 )

		this.location = location

		this.idList = []

		this.freshLocation = true
	}

	public setStaleLocation( location: string ): void
	{
		if ( this.freshLocation )
		{
			this.location = location
			
			this.freshLocation = false
		}
	}

	public start(): void
	{
		this.provider.getSegmentURLs( this )

		this.processURLs()

		this.interval = window.setInterval( () => 
			this.provider.getSegmentURLs( this ), 3000 )

		this.running = true

		this.fetchInterval = window.setInterval( () => 
			this.processURLs(), 1000 )
	}

	private processURLs()
	{
		// All queued files have been or are being processed for this stream
		if ( this.fileList.length === this.processedIndex )
			return

		const fetchList = this.fileList.slice(
			this.processedIndex
		)

		this.processedIndex += fetchList.length

		this.handler.bufferSegmentData( fetchList, this.index )
	}
	
	public stop(): void
	{
		clearInterval( this.interval )

		clearInterval( this.fetchInterval )

		this.running = false
	}

	public getPath( location: string ): string 
	{
		this.setFreshLocation( location )

		this.count = this.count - 1

		return this.idList.length > 0
			? new URL(
				`${this.idList[ this.idList.length - 1 ]}`,
				this.location
			).toString()
			: this.location
	}

	public addItemsFromPlaylist( playlist: Playlist ): void
	{
		for ( const { id, url } of playlist )
		{
			this.fileList.push( url )

			this.idList.push( id )
		}
	}
}