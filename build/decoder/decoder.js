"use strict";
// reference aliased via nginx
importScripts("./opus-stream-decoder.js");
self.onmessage = async (event) => {
    let totalSamples = 0;
    const decoder = new OpusStreamDecoder({
        onDecode: ({ left, samplesDecoded }) => {
            // Decoder recovers when it receives new files,
            // and samplesDecoded is negative.
            // For cause, see
            // https://github.com/AnthumChris/opus-stream-decoder/issues/7
            const previous = totalSamples;
            totalSamples += samplesDecoded;
            if (samplesDecoded < 0 || previous >= 44000)
                return;
            else if (previous < 50) {
                for (let i = 0; i < 50; i++) {
                    left[i] = (left[i] * i) / 50;
                }
                ;
                self.postMessage({ decoded: left });
            }
            else if (totalSamples >= 44000 - 50) {
                const final = samplesDecoded - (totalSamples - 44000);
                const fArr = new Float32Array(final);
                let decrement = 50;
                for (let i = 0; i < final; i++) {
                    fArr[i] =
                        i > final - 50 ? (left[i] * decrement--) / 50 : left[i];
                }
                ;
                self.postMessage({
                    decoded: fArr
                });
            }
            else {
                ;
                self.postMessage({ decoded: left });
            }
        }
    });
    await decoder.ready;
    decoder.decode(new Uint8Array(event.data.decode));
    await decoder.ready;
    decoder.ready.then(() => decoder.free());
    self.postMessage({ done: true });
};
