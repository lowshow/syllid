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
	id: string
	streamId: string
	url: string
}
    
type Playlist = PlaylistItem[]