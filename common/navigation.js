/** 小程序 Tab 首页（返回兜底） */
export const TAB_HOME_PATH = '/pages/status/status'

/** page_device 分包：Wi-Fi 配网 */
export const PAGE_WIFI_PROVISION = '/page_device/wifiProvision/wifiProvision'

/** page_device 分包：蓝牙协议测试 */
export const PAGE_BLE_TEST = '/page_device/bleTest/bleTest'

export const MAIN_TAB_ROUTES = [
	'pages/status/status',
	'pages/report/report',
	'pages/newMine/newMine'
]

function isTabPagePath(url) {
	const path = String(url || '').split('?')[0]
	return MAIN_TAB_ROUTES.some((route) => path === `/${route}` || path === route)
}

/** 左上角返回：有栈则 navigateBack，否则回 Tab 首页 */
export function safeNavigateBack(fallbackUrl = TAB_HOME_PATH) {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack({
			delta: 1,
			fail: () => {
				goHomeOrFallback(fallbackUrl)
			}
		})
		return
	}
	goHomeOrFallback(fallbackUrl)
}

/** 回 Tab 首页（优先 switchTab，失败 reLaunch） */
export function safeNavigateHome(homePath = TAB_HOME_PATH) {
	goHomeOrFallback(homePath)
}

function goHomeOrFallback(url) {
	const target = url || TAB_HOME_PATH
	if (isTabPagePath(target)) {
		uni.switchTab({
			url: target,
			fail: () => {
				uni.reLaunch({ url: target })
			}
		})
		return
	}
	uni.reLaunch({ url: target })
}

export function isOnlyPageInStack() {
	return getCurrentPages().length <= 1
}
