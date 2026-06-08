/** 枕头 BLE 连接：优先 0xFFE0 服务，避免误选 Generic Access 导致 notify 失败 */

const PILLOW_SERVICE_FFE0 = '0000FFE0-0000-1000-8000-00805F9B34FB'
const PILLOW_SERVICE_NUS = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'
const PREFER_NOTIFY = [
	'0000FFE2-0000-1000-8000-00805F9B34FB',
	'6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
]
const PREFER_WRITE = [
	'0000FFE1-0000-1000-8000-00805F9B34FB',
	'6E400004-B5A3-F393-E0A9-E50E24DCCA9E'
]

function normUuid(s) {
	return String(s || '').toUpperCase()
}

export function pickPillowBleService(services = []) {
	if (!services.length) return null
	const ffe0 = services.find((s) => normUuid(s.uuid).indexOf(PILLOW_SERVICE_FFE0) >= 0)
	if (ffe0) return ffe0
	const nus = services.find((s) => normUuid(s.uuid).indexOf(PILLOW_SERVICE_NUS) >= 0)
	if (nus) return nus
	return services.find((s) => s.isPrimary) || services[0]
}

export function pickPillowBleCharacteristics(chars = []) {
	let notifyUUID = ''
	let writeUUID = ''
	for (let i = 0; i < PREFER_NOTIFY.length; i++) {
		const hit = chars.find((ch) => normUuid(ch.uuid) === PREFER_NOTIFY[i])
		if (hit) {
			notifyUUID = hit.uuid
			break
		}
	}
	for (let i = 0; i < PREFER_WRITE.length; i++) {
		const hit = chars.find((ch) => normUuid(ch.uuid) === PREFER_WRITE[i])
		if (hit) {
			writeUUID = hit.uuid
			break
		}
	}
	if (!notifyUUID) {
		const n = chars.find((ch) => {
			const p = ch.properties || {}
			return p.notify || p.indicate
		})
		if (n) notifyUUID = n.uuid
	}
	if (!writeUUID) {
		const w = chars.find((ch) => {
			const p = ch.properties || {}
			return p.write || p.writeNoResponse
		})
		if (w) writeUUID = w.uuid
	}
	if (!notifyUUID && chars[0]) notifyUUID = chars[0].uuid
	if (!writeUUID && chars[0]) writeUUID = chars[0].uuid
	return { notifyUUID, writeUUID }
}
