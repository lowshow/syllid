"use strict";
// reference aliased via nginx
importScripts("./opus-stream-decoder.js");
const decoder = new OpusStreamDecoder({ onDecode });
self.onmessage = async (event) => {
    await decoder.ready;
    decoder.decode(new Uint8Array(event.data.decode));
};
function onDecode({ left, samplesDecoded }) {
    // Decoder recovers when it receives new files,
    // and samplesDecoded is negative.
    // For cause, see
    // https://github.com/AnthumChris/opus-stream-decoder/issues/7
    if (samplesDecoded < 0) {
        return;
    }
    ;
    self.postMessage({ decoded: left });
}
