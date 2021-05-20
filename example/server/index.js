const express = require( `express` )

const PORT = 5557

const ids = [
	`qDBY6h3qL3jAJ0jqbMmn`,
	`Mh-kQRQDrSArii_AjCsg`,
	`qOudnMs256rJxxF4_8Qi`,
	`ET1obHtgA77nunIL_rbF`,
	`qYUqeE7Y5okdqXpuwwYu`,
	`UPiEZZD2_A5HvkDh5W4T`,
	`DaQGJosqPceQK__nYuFD`,
	`EVRmlPeDs1KNLZvtlb8o`,
	`4v6MZCHaADh2haH4eT_N`,
	`6W89BI-xzLbsHp39G9cD`,
	`6XXb5xoXjv7OFexutxh3`,
	`7tfDcFOxnUoZCBKHfoNZ`,
	`iHBaLuYSd3-K33_jEwMo`,
	`PD8NQgXY_dbIVmub5Ig4`,
	`g0bwmOrTO-2bXSJ8J-YD`,
	`hEBiNfOFvqPjm1I9a8O8`,
]

const mapped = ids.reduce((obj, curr, i) => ({...obj, [curr]: i}), {})

const streamId = `12345`

const urls = ids.map(id => ({streamId, id, url: `http://localhost:${PORT}/audio/${id}.opus`}))

const app = express()

app.use(express.static('example'))

app.use('/build', express.static('build'))

app.use('/audio', express.static('example/audio'))

app.get('/decoderWorker.min.wasm', (req, res) => res.redirect(`/build/decoderWorker.min.wasm`))

app.get('/playlist/:id', (req, res) =>
{
	res.json([...urls.slice(mapped[req.params.id]), ...urls.slice(0, mapped[req.params.id])])
})

app.get('/playlist', (req, res) => res.json(urls))

console.log("Listening on PORT", PORT)

app.listen( PORT )