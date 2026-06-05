/**
 * 位置 / 蓝牙权限（对齐 pillow/utils/permissionUtil.js）
 * 小程序 scope.userLocation 与微信 App 系统位置权限是两层，需分别处理。
 */
import { getSystemType } from '@/utils/platformBle.js'

let _locationPermissionModalVisible = false
let _locationPermissionAwaitingReturn = false

export function isSystemLocationPermissionError(error) {
	if (!error) return false
	const errCode = Number(error.errCode)
	const errno = Number(error.errno)
	const errMsg = String(error.errMsg || '').toLowerCase()
	return errCode === 12012
		|| errCode === 12010
		|| errCode === -1
		|| errno === 1505004
		|| error.type === 'system_permission'
		|| error.type === 'permission'
		|| errMsg.includes('gps permission')
		|| errMsg.includes('location permission')
		|| errMsg.includes('obtain gps')
}

export function openWechatAppAuthSetting() {
	return new Promise((resolve) => {
		if (typeof uni.openAppAuthorizeSetting === 'function') {
			uni.openAppAuthorizeSetting({
				success: () => resolve(true),
				fail: () => {
					uni.openSetting({
						success: () => resolve(true),
						fail: () => resolve(false)
					})
				}
			})
			return
		}
		uni.openSetting({
			success: () => resolve(true),
			fail: () => resolve(false)
		})
	})
}

/** 微信 App 未授予系统位置权限时的引导（防重复弹窗） */
export function showWechatAppLocationPermissionModal() {
	if (_locationPermissionModalVisible) {
		return Promise.resolve(false)
	}
	_locationPermissionModalVisible = true

	return new Promise((resolve) => {
		uni.showModal({
			title: '权限提醒',
			content: '需要开启手机定位服务，并允许微信使用位置信息，才能搜索蓝牙设备或使用 Wi-Fi 功能。\n\n请按以下步骤操作：\n1. 打开手机系统设置中的「定位服务」\n2. 找到「微信」应用\n3. 开启「位置信息」权限\n4. 返回小程序重试',
			confirmText: '前往开启',
			cancelText: '取消',
			showCancel: true,
			complete: () => {
				_locationPermissionModalVisible = false
			},
			success: async (modalRes) => {
				if (modalRes.confirm) {
					_locationPermissionAwaitingReturn = true
					await openWechatAppAuthSetting()
					resolve(true)
				} else {
					resolve(false)
				}
			}
		})
	})
}

export function isAwaitingLocationPermissionReturn() {
	return _locationPermissionAwaitingReturn
}

export function clearLocationPermissionAwaitingReturn() {
	_locationPermissionAwaitingReturn = false
}

/** 探测系统位置是否可用（小程序已授权 + Wi-Fi API 不报系统定位错误） */
export function probeWifiLocationPermission() {
	return new Promise((resolve) => {
		uni.getSetting({
			success(res) {
				if (!res.authSetting['scope.userLocation']) {
					resolve(false)
					return
				}
				if (typeof uni.getConnectedWifi !== 'function') {
					resolve(true)
					return
				}
				uni.getConnectedWifi({
					success: () => resolve(true),
					fail: (error) => resolve(!isSystemLocationPermissionError(error))
				})
			},
			fail: () => resolve(false)
		})
	})
}

/** 鸿蒙上 BLE 扫描前触发一次 getLocation，激活系统定位 */
export function ensureLocationForBleScan() {
	if (getSystemType() !== 'ohos') {
		return Promise.resolve()
	}
	return new Promise((resolve) => {
		uni.getLocation({
			type: 'gcj02',
			isHighAccuracy: false,
			success: () => {
				console.log('[permissionUtil] 鸿蒙扫描前 getLocation 成功')
				resolve()
			},
			fail: (err) => {
				console.warn('[permissionUtil] 鸿蒙扫描前 getLocation 失败，可能影响 BLE 扫描:', err)
				resolve()
			}
		})
	})
}

export function checkLocationAuth() {
	return new Promise((resolve, reject) => {
		uni.getSetting({
			success(res) {
				if (res.authSetting['scope.userLocation']) {
					resolve()
					return
				}
				uni.authorize({
					scope: 'scope.userLocation',
					success: () => resolve(),
					fail: () => {
						uni.showModal({
							title: '权限提醒',
							content: '需要获取您的位置信息以使用蓝牙和 Wi-Fi 功能。\n\n请按以下步骤操作：\n1. 在小程序设置中开启「位置信息」\n2. 在手机系统设置中开启微信的「位置信息」',
							confirmText: '去设置',
							cancelText: '取消',
							success: (modalRes) => {
								if (modalRes.confirm) {
									uni.openSetting()
								}
								reject(new Error('scope.userLocation denied'))
							}
						})
					}
				})
			},
			fail: (err) => {
				console.error('[permissionUtil] getSetting fail:', err)
				reject(err)
			}
		})
	})
}

export function checkBluetoothAuth() {
	return new Promise((resolve, reject) => {
		checkLocationAuth()
			.then(() => {
				uni.openBluetoothAdapter({
					success: resolve,
					fail: () => {
						uni.showModal({
							title: '蓝牙权限提醒',
							content: '请确保已开启蓝牙，并在系统设置中授权微信使用蓝牙和位置信息，否则无法正常连接设备。',
							confirmText: '去设置',
							cancelText: '取消',
							success: (modalRes) => {
								if (modalRes.confirm) {
									uni.openSetting()
								}
								reject(new Error('openBluetoothAdapter fail'))
							}
						})
					}
				})
			})
			.catch(reject)
	})
}

export function checkWifiAuth() {
	return checkLocationAuth()
}

function checkBluetoothAuthIOS() {
	return new Promise((resolve, reject) => {
		console.log('[permissionUtil] iOS 尝试直接打开蓝牙适配器')
		uni.openBluetoothAdapter({
			success: () => {
				console.log('[permissionUtil] iOS 蓝牙适配器初始化成功')
				resolve()
			},
			fail: (err) => {
				console.error('[permissionUtil] iOS 蓝牙适配器初始化失败:', err)
				if (err.errCode === 10004 || err.errCode === 10009) {
					uni.showModal({
						title: '蓝牙权限未开启',
						content: '需要开启微信的位置/蓝牙权限。\n\n请打开手机系统设置 → 微信 → 开启相关权限后重试。',
						confirmText: '知道了',
						showCancel: false,
						success: () => reject(err)
					})
					return
				}
				if (err.errCode === 10001) {
					uni.getSetting({
						success: (res) => {
							if (!res.authSetting['scope.bluetooth']) {
								uni.authorize({
									scope: 'scope.bluetooth',
									success: () => {
										uni.openBluetoothAdapter({
											success: () => resolve(),
											fail: (retryErr) => reject(retryErr)
										})
									},
									fail: () => {
										uni.showModal({
											title: '蓝牙权限未开启',
											content: '请在小程序设置中开启「蓝牙」权限，并在系统设置中允许微信使用蓝牙。',
											confirmText: '去设置',
											success: (modalRes) => {
												if (modalRes.confirm) uni.openSetting()
												reject(err)
											}
										})
									}
								})
							} else {
								uni.showModal({
									title: '蓝牙未开启',
									content: '请在系统设置中开启蓝牙，并确保微信已获得蓝牙/位置权限。',
									showCancel: false,
									success: () => reject(err)
								})
							}
						},
						fail: () => reject(err)
					})
					return
				}
				uni.showModal({
					title: '蓝牙初始化失败',
					content: '请检查蓝牙是否已开启，并确保已授予相关权限。',
					showCancel: false,
					success: () => reject(err)
				})
			}
		})
	})
}

/**
 * 按平台申请蓝牙/位置权限
 * iOS：优先 openBluetoothAdapter
 * Android / 鸿蒙：先位置再蓝牙
 */
export function checkBluetoothAndLocationByDeviceType() {
	const type = getSystemType()
	if (type === 'ios') {
		return checkBluetoothAuthIOS()
	}
	if (type === 'android' || type === 'ohos') {
		return checkBluetoothAuth()
	}
	return checkBluetoothAuth()
}

/** BLE 扫描失败时统一处理（系统定位未开等） */
export function handleBleScanFail(err) {
	console.warn('[permissionUtil] BLE 扫描失败:', err)
	if (isSystemLocationPermissionError(err)) {
		return showWechatAppLocationPermissionModal()
	}
	return Promise.resolve(false)
}
