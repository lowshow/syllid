import { main } from "./main.js";
import { getEl } from "./common/util.js";
import { playerUI, buttonUI, hubUI } from "./ui.js";
import { lstn } from "./common/dom.js";
(async () => {
    try {
        const [btnContainer, addHubs, hubInput, hubAddBtn, hubsContainer, outputsContainer] = await Promise.all([
            getEl({
                selector: "#buttons"
            }),
            getEl({
                selector: "#addHub"
            }),
            getEl({
                selector: "#hubUrlInput"
            }),
            getEl({
                selector: "#hubUrlAddBtn"
            }),
            getEl({
                selector: "#hubs"
            }),
            getEl({
                selector: "#output"
            })
        ]);
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
                            playingChannels.push(playChannel(cOut));
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
                    const hubs = removeHubs(indices);
                    hubUI({
                        container: hubsContainer,
                        hubs,
                        onDelete: deleteHubs
                    });
                }
                lstn(hubAddBtn)
                    .on("click")
                    .do(() => {
                    const hubs = addHub(hubInput.value);
                    hubUI({
                        container: hubsContainer,
                        hubs,
                        onDelete: deleteHubs
                    });
                });
            }
        });
    }
    catch (e) {
        console.error("Application Error", e);
    }
})();
