/**
 * 0x04「读取枕头数据」：须 App 先下发 readPillowStatus()，notify 收到后 PillowBleManager 会调 logPillowStatus0x04Debug。
 *
 * - 默认：控制台输出【枕头 0x04 中文】多行说明（对照协议「读取枕头高度 0x04」表）。
 * - 附加原始 HEX / JSON：微信开发者工具 Console 执行 wx.setStorageSync('DEBUG_BLE_0X04', true)
 * - 关闭附加：wx.removeStorageSync('DEBUG_BLE_0X04')
 */

export const STORAGE_KEY_DEBUG_BLE_0X04 = 'DEBUG_BLE_0X04'

export function isBle04DebugEnabled() {
	try {
		const v = uni.getStorageSync(STORAGE_KEY_DEBUG_BLE_0X04)
		return v === true || v === '1' || v === 1
	} catch (e) {
		return false
	}
}

export function setBle04DebugEnabled(on) {
	try {
		if (on) {
			uni.setStorageSync(STORAGE_KEY_DEBUG_BLE_0X04, true)
		} else {
			uni.removeStorageSync(STORAGE_KEY_DEBUG_BLE_0X04)
		}
	} catch (e) {}
}

/** 协议「读取枕头高度 0x04」工作状态 */
const WORK_STATE_ZH = {
	0: '空闲',
	1: '仰卧',
	2: '侧卧'
}

function pumpStateZh(v) {
	const n = Number(v)
	if (n === 0) return '工作正常'
	if (n === 1) return '异常'
	return `值=${n}`
}

/**
 * 故障码1 各 bit（协议：读取枕头高度 0x04）
 */
function fault1BitsZh(fault1) {
	const f = fault1 & 0xff
	const items = [
		['bit0', '气泵1故障', (f >> 0) & 1],
		['bit1', '气泵2故障', (f >> 1) & 1],
		['bit2', '气压传感器1故障', (f >> 2) & 1],
		['bit3', '气压传感器2故障', (f >> 3) & 1],
		['bit4', '加热NTC故障', (f >> 4) & 1],
		['bit5', 'RTC故障', (f >> 5) & 1],
		['bit6', '睡姿传感器故障', (f >> 6) & 1]
	]
	return items.map(([bit, label, on]) => `  ${bit} ${label}: ${on ? '有故障' : '无故障'}`)
}

/**
 * 按《枕头蓝牙通讯协议》0x04 表生成中文说明（供控制台阅读）
 * @param {object} parsed - handleNotifyBuffer 返回的 parsed（含 func、workState、fault1…）
 * @returns {string}
 */
export function formatPillowStatus0x04ProtocolZh(parsed) {
	if (!parsed || typeof parsed !== 'object') {
		return String(parsed)
	}
	const lines = []
	const func = parsed.func
	const fl = parsed.funcLogical != null ? parsed.funcLogical : func != null ? func & 0x7f : undefined
	if (parsed.ok === false) {
		lines.push(`【0x04】解析失败: ${parsed.error || 'unknown'}`)
		return lines.join('\n')
	}
	lines.push('【0x04 读取枕头数据】协议字段（中文）')
	if (func != null) {
		lines.push(
			`功能字节: 0x${(func & 0xff).toString(16).toUpperCase()}（逻辑功能号 0x${(fl & 0xff).toString(16).toUpperCase()}，${parsed.isReadResponse ? '读应答' : '数据'}）`
		)
	}
	if (parsed.workState != null) {
		const w = parsed.workState & 0xff
		const name = WORK_STATE_ZH[w] != null ? WORK_STATE_ZH[w] : '协议未列'
		lines.push(`工作状态: ${w}（${name}）`)
	}
	if (parsed.fault1 != null) {
		lines.push(`故障码1: 0x${(parsed.fault1 & 0xff).toString(16).toUpperCase()}（逐 bit 含义如下）`)
		lines.push(...fault1BitsZh(parsed.fault1))
	}
	if (parsed.fault2 != null) {
		lines.push(
			`故障码2: 0x${(parsed.fault2 & 0xff).toString(16).toUpperCase()}（协议表未展开逐 bit，保留原始字节）`
		)
	}
	if (parsed.pump1 != null) {
		lines.push(`气压泵1工作状态: ${parsed.pump1}（${pumpStateZh(parsed.pump1)}）`)
	}
	if (parsed.pump2 != null) {
		lines.push(`气压泵2工作状态: ${parsed.pump2}（${pumpStateZh(parsed.pump2)}）`)
	}
	if (parsed.heatTemp != null) {
		lines.push(`加热片温度: ${parsed.heatTemp}℃（uint8）`)
	}
	if (parsed.valveBits != null) {
		const v = parsed.valveBits & 0xff
		lines.push(`气阀状态: 0x${v.toString(16).toUpperCase()}（bit0~3 对应阀1~阀，1=开启 0=关闭）`)
		for (let i = 0; i < 4; i++) {
			const on = (v >> i) & 1
			lines.push(`  第${i + 1}路气阀: ${on ? '开启' : '关闭'}`)
		}
	}
	if (parsed.rtc && parsed.rtc.length >= 6) {
		const [y, mo, d, h, mi, s] = parsed.rtc
		const p2 = (n) => (Number(n) < 10 ? '0' : '') + n
		lines.push(
			`RTC: 协议顺序为 年/月/日/时/分/秒；字节 [${parsed.rtc.join(',')}] → 20${p2(y)}-${p2(mo)}-${p2(d)} ${p2(h)}:${p2(mi)}:${p2(s)}`
		)
	}
	if (parsed.pressure1Raw != null || parsed.pressure2Raw != null) {
		const r1 = parsed.pressure1Raw
		const r2 = parsed.pressure2Raw
		const k1 = parsed.pressure1Kpa != null ? parsed.pressure1Kpa.toFixed(2) : '-'
		const k2 = parsed.pressure2Kpa != null ? parsed.pressure2Kpa.toFixed(2) : '-'
		lines.push(
			`气压1: 原始 uint16=${r1}（协议为放大100倍，约 ${k1} kPa）`
		)
		lines.push(
			`气压2: 原始 uint16=${r2}（协议为放大100倍，约 ${k2} kPa）`
		)
	}
	if (parsed.headHeightPct != null || parsed.neckHeightPct != null) {
		lines.push(
			`头枕高度: ${parsed.headHeightPct}%（uint16 小端，0~100%）`
		)
		lines.push(
			`颈枕高度: ${parsed.neckHeightPct}%（uint16 小端，0~100%）`
		)
	}
	return lines.join('\n')
}

/**
 * @param {object} parsed - handleNotifyBuffer 返回的 parsed 对象（含 func、workState、heatTemp 等）
 */
export function formatPillowStatusPayloadPretty(parsed) {
	return formatPillowStatus0x04ProtocolZh(parsed)
}

/**
 * @param {{ ts?: number, rawHex?: string, parsed?: object }} payload - PillowBleManager 存的上报包
 */
/**
 * 首页等路径收到 0x04 时调用：默认打印协议中文解析（便于对照协议文档）。
 * 原始 HEX / JSON 仅在本地存储 DEBUG_BLE_0X04=true 时追加输出。
 */
export function logPillowStatus0x04Debug(payload) {
	if (!payload) {
		return
	}
	const t = new Date(payload.ts || Date.now()).toLocaleTimeString()
	const zh =
		payload.parsed && typeof payload.parsed === 'object'
			? formatPillowStatus0x04ProtocolZh(payload.parsed)
			: '【0x04】无 parsed'
	console.log(`[枕头 0x04 中文] ${t}\n${zh}`)
	if (!isBle04DebugEnabled()) {
		return
	}
	console.log('[BLE 0x04 DEBUG] 以下为调试附加信息（关闭: wx.removeStorageSync("DEBUG_BLE_0X04")）')
	if (payload.rawHex) {
		console.log('[BLE 0x04] 【原始】rawHex(' + payload.rawHex.length / 2 + 'B):', payload.rawHex)
	}
	if (payload.parsed && typeof payload.parsed === 'object') {
		try {
			console.log('[BLE 0x04] 【解析】parsed JSON:', JSON.stringify(payload.parsed))
		} catch (e) {
			console.log('[BLE 0x04] 【解析】parsed:', payload.parsed)
		}
	}
}
