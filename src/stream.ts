export interface StreamHandler
{
	onStopChannel: ( index: number ) => void
}

export interface StreamProvider
{
	randomInt: ( min: number, max: number ) => number
}

export class Stream
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
	
	public stopChannel(): void
	{
		this.handler.onStopChannel( this.index )
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
}