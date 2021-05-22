class App {
    syllid;
    constructor() {
        this.playAudio = this.playAudio.bind(this);
        const btn = document.querySelector(`#startBtn`);
        if (!btn)
            throw Error(`No btn`);
        btn.addEventListener(`click`, this.playAudio);
    }
    start() {
        this.syllid?.addURL(new URL(`/playlist`, window.origin));
        this.syllid?.playChannel(0);
    }
    playAudio() {
        if (!this.syllid) {
            import(`../build/syllid.js`).then(({ Syllid }) => {
                this.syllid = new Syllid(this);
                this.start();
            });
        }
        else {
            this.start();
        }
    }
    static init() {
        new App();
    }
    sampleRate() {
        return 48000;
    }
    onWarning(message) {
        console.warn(message);
    }
    onFailure(error) {
        console.error(error);
    }
}
App.init();
export {};
