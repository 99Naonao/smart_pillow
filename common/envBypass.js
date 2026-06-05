/**
 * 非正式环境（develop / trial）能力开关，避免 util ↔ PillowBleManager 循环依赖。
 */

/** @returns {boolean} 当前是否为 develop 或 trial */
export function canBypassNonReleaseEnv() {
	try {
		const envVersion = uni.getAccountInfoSync().miniProgram.envVersion
		return envVersion === 'develop' || envVersion === 'trial'
	} catch (e) {
		return false
	}
}

/** 非正式环境可跳过登录校验 */
export function canBypassLoginInCurrentEnv() {
	return canBypassNonReleaseEnv()
}

/** 非正式环境可跳过「须先连接蓝牙」的 UI 拦截（真实下发仍须物理连接） */
export function canBypassBleConnectInCurrentEnv() {
	return canBypassNonReleaseEnv()
}
