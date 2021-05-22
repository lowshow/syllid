interface Window
{
	AudioContext: typeof AudioContext
	webkitAudioContext: typeof AudioContext
}

declare module "worker!*" {
	const Content: string;
	export default Content;
}
