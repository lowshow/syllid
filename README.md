# syllid &bull; audio decoder and player

multi-channel multi-stream audio decoder and player


## TODO

Bug, muting one channel messes up other channels

-----

Different streams can have different playback modes
Streams will play on any channel
A channel is "playing" based on the playing state of the stream

- A stream therefore needs its own buffer
- A stream's connectivity/buffering/playback is based on its playing state
- A stream needs to provide updates on its no data/buffering/playing state

Utilisation of audio worklet for ring buffer, with fallback
	- borrowing implementation ideas from splutter
	- tiny fade between buffers to prevent clicks/pops


- playback modes
	- latest (live)
	- normal (w/ seek)
	- random (random start point)

- channel choice
	- urls (listen/group) played through only active channels (not muted)
	- normal/latest plays as normal through all active channels
	- random will play random data through any active channel