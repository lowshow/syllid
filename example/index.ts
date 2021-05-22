import type { Syllid, SyllidContextInterface } from "../build/syllid.js"

class App implements SyllidContextInterface
{
	private syllid?: Syllid

	constructor()
	{
		this.playAudio = this.playAudio.bind( this )

		const btn = document.querySelector( `#startBtn` )

		if ( !btn ) throw Error( `No btn` )

		btn.addEventListener( `click`, this.playAudio )
	}

	private start()
	{
		this.syllid?.addURL( new URL( `/playlist`, window.origin ) )
		
		this.syllid?.playChannel( 0 )
	}

	private playAudio()
	{
		if ( !this.syllid )
		{
			import( `../build/syllid.js` ).then( ( { Syllid } ) =>
			{
				this.syllid = new Syllid( this )

				this.start()
			} )
		}
		else
		{
			this.start()
		}
	}

	public static init()
	{
		new App()
	}

	public sampleRate(): number
	{
		return 48000
	}

	public onWarning( message: string | Error | ErrorEvent ): void
	{
		console.warn( message )
	}

	public onFailure( error: Error ): void
	{
		console.error( error )
	}
}

App.init()