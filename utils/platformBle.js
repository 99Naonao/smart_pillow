/**
 * 蓝牙相关平台判断（微信小程序）
 * iOS / 鸿蒙：deviceId 常为 UUID，需从 advertisData 解析真实 MAC
 */

const MAC_FROM_ADVERTIS_PLATFORMS = new Set(['ios', 'ohos', 'ohos_pc', 'harmonyos'])

export function getRuntimePlatform() {
	try {
		if (typeof uni.getDeviceInfo === 'function') {
			const d = uni.getDeviceInfo()
			if (d && d.platform) {
				return String(d.platform).toLowerCase()
			}
		}
	} catch (e) {}
	try {
		const s = uni.getSystemInfoSync()
		return String(s.platform || '').toLowerCase()
	} catch (e) {
		return ''
	}
}

/** 是否需从广播数据 advertisData 解析蓝牙 MAC（iOS / 鸿蒙等） */
export function needsBleMacFromAdvertisData(platform) {
	const p = String(platform != null ? platform : getRuntimePlatform()).toLowerCase()
	return MAC_FROM_ADVERTIS_PLATFORMS.has(p)
}

export function isHarmonyOsPlatform(platform) {
	const p = String(platform != null ? platform : getRuntimePlatform()).toLowerCase()
	return p === 'ohos' || p === 'ohos_pc' || p === 'harmonyos'
}

/** android / ios / ohos / other（对齐 pillow commonUtil.getSystemType） */
export function getSystemType() {
	try {
		const sys = typeof uni.getDeviceInfo === 'function'
			? uni.getDeviceInfo()
			: uni.getSystemInfoSync()
		const platform = String(sys.platform || '').toLowerCase()
		const system = String(sys.system || '')
		if (platform === 'ohos' || platform === 'ohos_pc') return 'ohos'
		if (platform === 'android') return 'android'
		if (platform === 'ios') return 'ios'
		if (platform === 'devtools' && system.includes('HarmonyOS')) return 'ohos'
		return 'other'
	} catch (e) {
		return 'other'
	}
}

/** 与 Android 共用蓝牙/Wi-Fi 权限逻辑（含鸿蒙） */
export function isAndroidLike(type) {
	const p = type || getSystemType()
	return p === 'android' || p === 'ohos' || p === 'other'
}

export function isIOSPlatform(type) {
	return (type || getSystemType()) === 'ios'
}
