class App {
    syllid;
    el;
    startBtn;
    constructor() {
        this.load = this.load.bind(this);
        this.btnClick = this.btnClick.bind(this);
        this.el = this.getEl(`#main`);
        this.startBtn = this.getEl(`#startBtn`);
        this.startBtn.addEventListener(`click`, this.load);
    }
    existsOrThrow(item, selector) {
        if (!item) {
            throw Error(`No item ${selector}`);
        }
        return item;
    }
    getEl(selector) {
        return this.existsOrThrow(document.querySelector(selector), selector);
    }
    btnClick(event) {
        const btn = event.target;
        const channel = parseInt(btn.dataset.channel ?? `-1`, 10);
        const state = btn.dataset.state;
        if (state === `mute`) {
            this.syllid?.playChannel(channel);
            btn.textContent = `Mute channel ${channel}`;
            btn.dataset.state = `playing`;
        }
        else {
            this.syllid?.stopChannel(channel);
            btn.textContent = `Play channel ${channel}`;
            btn.dataset.state = `mute`;
        }
    }
    btn(channel) {
        const b = document.createElement(`button`);
        b.textContent = `Play channel ${channel}`;
        b.dataset.channel = `${channel}`;
        b.dataset.state = `mute`;
        b.addEventListener(`click`, this.btnClick);
        this.el.appendChild(b);
    }
    start() {
        this.syllid?.addURL(new URL(`/playlist`, window.origin));
        for (let c = 0; c < (this.syllid?.getChannels() ?? 0); c++) {
            this.btn(c);
        }
    }
    load() {
        if (!this.syllid) {
            import(`../build/syllid.js`).then(({ Syllid }) => {
                this.syllid = new Syllid(this);
                this.start();
            });
        }
        else {
            this.start();
        }
        this.startBtn.remove();
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
