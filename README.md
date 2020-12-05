# syllid &bull; experimental audio decoder and multi player

experimental multi-channel multi-stream audio decoder and player

## Summary

This project is a component of [\_noisecrypt](low.show/noisecrypt/). The component acts as a decoding and playback interface, where a list of audio stream segments are provided by an endpoint and the segments are sequentially downloaded, decoded and passed to the web audio api for output on a selected output channel. Random endpoints are provided by adding [sortition](https://github.com/lowshow/sortition) hubs that contain references to the endpoints of [sludge](https://github.com/lowshow/sludge) servers. The sludge servers are stores for audio segments created when recording using the [splutter](https://github.com/lowshow/splutter) app. The sludge app has an open CORS permission on the endpoint provided, so the syllid app can make requests to any given sludge domain.

## Setup

### UI

```shell
make init
```

NOTE: You will need to provide values for these variables

**Nginx port**

This is the port from which the nginx proxy server for sludge will run

**Service hostname**

This is the base URL hostname where sludge will be accessed

**Additional hostnames**

More hostnames (not required)

## Dev

```shell
npm i
npm run dev
```