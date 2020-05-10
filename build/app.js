import { main } from "./main.js";
import { getEl } from "./common/util.js";
function toggleVisible(el) {
    el.forEach((i) => {
        i.classList.toggle("visible");
    });
}
;
(async () => {
    try {
        const stopBtn = await getEl({
            selector: "#stop"
        });
        const runBtn = await getEl({
            selector: "#run"
        });
        const locationText = await getEl({ selector: "#text" });
        runBtn.addEventListener("click", () => {
            const locations = locationText.value.split("\n");
            console.log("Locations", locations);
            const { run, stop } = main(locations);
            toggleVisible([stopBtn, runBtn, locationText]);
            stopBtn.addEventListener("click", stop);
            run();
        });
    }
    catch (e) {
        console.error("Application Error", e);
    }
})();
