import type { Syllid, SyllidContextInterface } from "../build/syllid.js"

class App implements SyllidContextInterface
{
	private syllid?: Syllid

	private el: HTMLElement

	private startBtn: HTMLButtonElement

	constructor()
	{
		this.load = this.load.bind( this )

		this.btnClick = this.btnClick.bind( this )

		this.el = this.getEl( `#main` )

		this.startBtn = this.getEl( `#startBtn` )

		this.startBtn.addEventListener( `click`, this.load )
	}

	private existsOrThrow<T>( item: unknown, selector: string )
	{
		if ( !item )
		{
			throw Error( `No item ${selector}` )
		}

		return item as T
	}

	private getEl<T extends HTMLElement>( selector: string ): T
	{
		return this.existsOrThrow( document.querySelector( selector ), selector )
	}

	private btnClick( event: MouseEvent )
	{
		const btn = event.target as HTMLButtonElement

		const channel = parseInt( btn.dataset.channel ?? `-1`, 10 )

		const state = btn.dataset.state

		if ( state === `mute` )
		{
			this.syllid?.playChannel( channel )

			btn.textContent = `Mute channel ${channel}`

			btn.dataset.state = `playing`
		}
		else
		{
			this.syllid?.stopChannel( channel )

			btn.textContent = `Play channel ${channel}`

			btn.dataset.state = `mute`
		}
	}

	private btn( channel: number )
	{
		const b = document.createElement( `button` )

		b.textContent = `Play channel ${channel}`

		b.dataset.channel = `${channel}`

		b.dataset.state = `mute`

		b.addEventListener( `click`, this.btnClick )

		this.el.appendChild( b )
	}

	private start()
	{
		this.syllid?.addURL( new URL( `/playlist`, window.origin ) )

		for ( let c = 0; c < ( this.syllid?.getChannels() ?? 0 ); c++ )
		{
			this.btn( c )
		}
	}

	private load()
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
		
		this.startBtn.remove()
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