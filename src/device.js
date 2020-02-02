const usb = require('usb')


// const OMRON_NULL_MODE = 0,0
const OMRON_VID = 0x0590
const OMRON_PID = 0x0028
const OMRON_IN_ENDPT = 0x81
const OMRON_OUT_ENDPT = 0x02

const device = {
	dev: null,
	in: null,
	out: null,
	async controlTransfer () {
		return new Promise((resolve, reject) => device.dev.controlTransfer(
			33, // bmRequestType
			9, // bRequest
			0x300, // wValue
			0, // wIndex
			Buffer.from([0, 0]), // data_or_length
			(err, data) => {
				console.log(err, data)
				resolve()
			}
		))
	},
	async write (data) {
		// console.log('<<=', data)
		return new Promise((resolve, reject) => {
			device.out.transfer(data, (err) => {
				if (err) return reject(err)
				resolve()
			})
		})
	},
	async read (length) {
		return new Promise((resolve, reject) => {
			device.in.transfer(length, (err, data) => {
				if (err) return reject(err)
				resolve(data)
			})
		})
	},
	async get (checkOk) {
		while (true) {
			const data = await device.read(8)
			// console.log('=>>', data, data.slice(1).toString('ascii'))
			if (data[0] === 0x08) continue // not ready
			if (checkOk) {
				if (data.slice(1, 3).toString('ascii') !== 'OK') throw new Error('NOT OK')
				return data.slice(3, data[0] + 3)
			}
			return data.slice(1, data[0] + 1)
		}
	},
	checksum (data) {
		if (data.reduce((a, b) => a ^ b, 0)) throw new Error('Checksum failed')
		return data
	},
	async waitUntilReady () {
		for (const i of Array(5)) {
			await device.write(Buffer.from([7, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0]))
			try {
				await device.get(true)
				return
			} catch (e) {}
		}
	},
	async pollForData () {
		const dev = usb.findByIds(OMRON_VID, OMRON_PID)
		if (!dev) throw new Error('device not connected')
		device.dev = dev
		dev.open()
		// dev.setConfiguration(0, console.error)
		// dev.claim()
		await device.controlTransfer()
		device.in = dev.interface().endpoint(OMRON_IN_ENDPT)
		device.out = dev.interface().endpoint(OMRON_OUT_ENDPT)
		device.in.timeout = 500
		// console.log(endpointIN)
		// console.log(await device.read(0))
		await device.waitUntilReady()
		device.in.timeout = 2000
		// number of measurements
		await device.write(Buffer.from('\x05CNT00', 'ascii'))
		const measurementsAmount = device.checksum([...await device.get(true), ...await device.get()])[2]

		const measurements = []
		for (let i = 0; i < measurementsAmount; i++) {
			await device.write([7, ...Buffer.from('MES', 'ascii'), 0, 0, i, i])
			const r = device.checksum([...await device.get(true), ...await device.get(), ...await device.get()])
			console.log(`${2000 + r[1]}-${r[2]}+${r[3]}T${r[4]}:${r[5]}:${r[6]}`)
			const measurement = {
				date: new Date(2000 + r[1], r[2] - 1, r[3], r[4], r[5], r[6]), // `${2000 + r[1]}-${r[2]}+${r[3]}T${r[4]}:${r[5]}:${r[6]}`,
				systolic: r[9],
				diastolic: r[10],
				pulse: r[11]
			}
			console.log(measurement)
			measurements.push(measurement)
		}
		return measurements
	}
}

module.exports = device

device.pollForData()
