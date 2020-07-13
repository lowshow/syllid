import { main } from "./main.js";
import { getEl } from "./common/util.js";
import { playerUI, buttonUI, hubUI } from "./ui.js";
import { lstn, el, mnt, umnt } from "./common/dom.js";
(async () => {
    try {
        const root = await getEl({
            selector: "#appContainer"
        });
        const btnContainer = el("div");
        const outputsContainer = el("div");
        const addHubs = el("div");
        addHubs.classList.add("addHub");
        const hubInput = el("input");
        hubInput.type = "url";
        hubInput.placeholder = "hub url e.g. http://hub.url/1234";
        const hubAddBtn = el("button");
        hubAddBtn.classList.add("btn");
        hubAddBtn.textContent = "Add hub";
        const hubsContainer = el("div");
        const mntHub = mnt(addHubs);
        mntHub([hubInput, hubAddBtn]);
        mnt(root)([btnContainer, outputsContainer, addHubs, hubsContainer]);
        const playingChannels = [];
        const stops = [];
        buttonUI({
            container: btnContainer,
            onStop: () => {
                stops.forEach((s) => s());
                addHubs.classList.remove("visible");
                outputsContainer.innerHTML = "";
                hubsContainer.innerHTML = "";
            },
            onInit: () => {
                const { addHub, channels, playChannel, removeHubs, stop } = main();
                stops.push(stop);
                playerUI({
                    container: outputsContainer,
                    onEvent: async ({ cOut, mode }) => {
                        if (mode) {
                            playingChannels[cOut] = playChannel(cOut);
                        }
                        else {
                            const { stopChannel } = await playingChannels[cOut];
                            stopChannel();
                        }
                    },
                    outputCount: channels
                });
                addHubs.classList.add("visible");
                function deleteHubs(indices) {
                    if (!indices.length)
                        return;
                    const hubs = removeHubs(indices);
                    hubsContainer.innerHTML = "";
                    hubUI({
                        container: hubsContainer,
                        hubs,
                        onDelete: deleteHubs
                    });
                }
                lstn(hubAddBtn)
                    .on("click")
                    .do(() => {
                    addHub(hubInput.value)
                        .then((hubs) => {
                        hubsContainer.innerHTML = "";
                        hubUI({
                            container: hubsContainer,
                            hubs,
                            onDelete: deleteHubs
                        });
                    })
                        .catch((err) => {
                        const hubErr = el("p");
                        hubErr.textContent = err;
                        mntHub(hubErr, { prepend: true });
                        setTimeout(() => {
                            umnt(hubErr);
                        }, 5000);
                    });
                });
            }
        });
    }
    catch (e) {
        console.error("Application Error", e);
    }
})();
