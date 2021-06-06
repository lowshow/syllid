interface Window
{
	AudioContext: typeof AudioContext
	webkitAudioContext: typeof AudioContext
}

declare module "worker!*" {
	const Content: string;
	export default Content;
}

interface PlaylistItem
{
	segmentID: string
	streamPublicID: string
	segmentURL: string
}
    
type Playlist = PlaylistItem[]