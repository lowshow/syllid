declare function importScripts( ...urls: string[] ): void
declare class OpusStreamDecoder 
{
	constructor( args: { onDecode: any } )

    public ready: boolean

    public decode( arg: Uint8Array ): void
}

// reference aliased via nginx
importScripts( `./opus-stream-decoder.js` )

;( ( self as unknown ) as Worker ).onmessage = async (
	event: MessageEvent
): Promise<void> => 
{
	let totalSamples = 0

	const decoder: any = new OpusStreamDecoder( {
		onDecode: ( { left, samplesDecoded }: any ): void => 
		{
			// Decoder recovers when it receives new files,
			// and samplesDecoded is negative.
			// For cause, see
			// https://github.com/AnthumChris/opus-stream-decoder/issues/7
			const previous: number = totalSamples

			totalSamples += samplesDecoded

			if ( samplesDecoded < 0 || previous >= 44000 ) return
			else if ( previous < 50 ) 
			{
				for ( let i = 0; i < 50; i++ ) 
				{
					left[ i ] = ( left[ i ] * i ) / 50
				}

				( ( self as unknown ) as Worker ).postMessage( { decoded: left } )
			}
			else if ( totalSamples >= 44000 - 50 ) 
			{
				const final: number = samplesDecoded - ( totalSamples - 44000 )

				const fArr: Float32Array = new Float32Array( final )

				let decrement = 50

				for ( let i = 0; i < final; i++ ) 
				{
					fArr[ i ] = i > final - 50 
						? ( left[ i ] * decrement-- ) / 50 
						: left[ i ]
				}

				( ( self as unknown ) as Worker ).postMessage( {
					decoded: fArr
				} )
			}
			else 
			{
				( ( self as unknown ) as Worker ).postMessage( { decoded: left } )
			}
		}
	} )

	await decoder.ready

	decoder.decode( new Uint8Array( event.data.decode ) )

	await decoder.ready

	decoder.ready.then( (): void => decoder.free() )

	;( ( self as unknown ) as Worker ).postMessage( { done: true } )
}
