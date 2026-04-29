<script>
	import { onAppLaunchSpineCleanup, stopSpineAdjustSession } from '@/common/spineSession.js';
	import { PillowBleManager } from '@/utils/BlueUtils/PillowBleManager.js';

	let spinePostureWatchTimer = null;
	let spinePostureLastStatus = 1;
	let spinePostureBadSince = null;
	let spineGlobalEventsBound = false;

	function clearSpinePostureWatch() {
		if (spinePostureWatchTimer) {
			clearInterval(spinePostureWatchTimer);
			spinePostureWatchTimer = null;
		}
		spinePostureBadSince = null;
	}

	function scheduleSpinePostureWatch() {
		clearSpinePostureWatch();
		const mgr = PillowBleManager.getInstance();
		if (!mgr.getSpineAdjusting()) {
			return;
		}
		spinePostureLastStatus = mgr.getPillowStatus();
		spinePostureBadSince = null;
		spinePostureWatchTimer = setInterval(() => {
			const m = PillowBleManager.getInstance();
			if (!m.getSpineAdjusting()) {
				clearSpinePostureWatch();
				return;
			}
			if (m.isConnected() && m.loginSuccess) {
				m.readPillowStatus({ silent: true });
			}
			const st = m.getPillowStatus();
			if (spinePostureLastStatus === 1 && (st === 0 || st === 2)) {
				spinePostureBadSince = Date.now();
			} else if (st === 1) {
				spinePostureBadSince = null;
			}
			spinePostureLastStatus = st;
			if (spinePostureBadSince && (st === 0 || st === 2)) {
				if (Date.now() - spinePostureBadSince >= 60000) {
					clearSpinePostureWatch();
					stopSpineAdjustSession({
						reason: 'posture',
						showToast: '空闲/侧卧超过1分钟，已停止微调'
					});
				}
			}
		}, 4000);
	}

	function bindSpineGlobalEventsOnce() {
		if (spineGlobalEventsBound) {
			return;
		}
		spineGlobalEventsBound = true;
		uni.$on('spine_adjust_started', () => scheduleSpinePostureWatch());
		uni.$on('spine_session_stopped', () => clearSpinePostureWatch());
	}

	export default {
		data() {
			return {
				/**
				 * @description 计算导航栏信息
				 */
				calcNavBarInfo() {
					console.log('this.global', this.globalData)
					uni.getSystemInfo({
						success: res => {
							let menuButtonInfo = {}
							if (res.platform === 'ios') {
								// ios设备的胶囊按钮都是固定的
								menuButtonInfo = {
									width: 87,
									height: 32,
									left: res.screenWidth - 7 - 87,
									right: res.screenWidth - 7,
									top: res.statusBarHeight + 4,
									bottom: res.statusBarHeight + 4 + 32
								}
							} else {
								// 安卓通过api获取
								menuButtonInfo = uni.getMenuButtonBoundingClientRect()
							}
							console.log('获取胶囊信息：', menuButtonInfo, res);
							// 导航栏高度 = 状态栏到胶囊的间距（胶囊距上未知-状态栏高度）* 2 + 胶囊高度 + 状态栏高度
							this.globalData.navHeight = (menuButtonInfo.top - res.statusBarHeight) *
								2 + menuButtonInfo.height + res.statusBarHeight;
							console.log('navHeight:', this.globalData.navHeight);
							// 按钮上下边距高度
							this.globalData.menuBottom = menuButtonInfo.top - res.statusBarHeight;
							this.globalData.top = menuButtonInfo.top;
							this.globalData.navHeight = res.statusBarHeight;
							this.globalData.screenWidth = res.screenWidth;
							this.globalData.screenHeight = res.screenHeight;
							// 导航栏右边到屏幕边缘的距离
							this.globalData.menuRight = res.screenWidth - menuButtonInfo.right;
							// 导航栏高度
							this.globalData.menuHeight = menuButtonInfo.height;
						},
						fail(err) {}
					})
				},
			}
		},
		globalData: {
			characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E',
			deviceId: '', // 连接的蓝牙id
			serviceId: '', // 连接的服务id
			tabIndex: 0,
			//全局数据管理
			navBarHeight: 0, // 导航栏高度
			menuBottom: 0, // 胶囊距底部间距（顶部间距也是这个）
			menuHeight: 0, // 胶囊高度
			top: 0
		},
		onLaunch: function() {
			console.log('App Launch')
			this.calcNavBarInfo();
			// 小程序冷启动 / 从后台划掉进程后再次进入：终止未收尾的脊柱微调（未连上则标记待 BLE 就绪补发）
			onAppLaunchSpineCleanup();
		},

		onShow: function() {
			console.log('App Show')
			bindSpineGlobalEventsOnce();
			scheduleSpinePostureWatch();
		},
		onHide: function() {
			console.log('App Hide')
			clearSpinePostureWatch();
			// 兜底：进入后台时停止搜寻，避免适配器长期处于 discovery 状态影响再次扫描
			if (typeof uni !== 'undefined' && uni.stopBluetoothDevicesDiscovery) {
				uni.stopBluetoothDevicesDiscovery({
					fail() {},
					complete() {}
				})
			}
		}
	}
</script>

<style>
	@import './common/uni.css';

	page {
		width: 100%;
		height: 100%;
	}

	view {
		display: block;
	}

	/*每个页面公共css */
	.uni-tabbar .uni-tabbar__icon {
		width: 40px !important;
		height: 40px !important;
	}

	.flex {
		display: flex;
	}

	.align-center {
		align-items: center;
	}

	.justify-content-center {
		justify-content: center;
	}

	.justify-content-space-around {
		justify-content: space-around;
	}

	.justify-content-space-between {
		justify-content: space-between;
	}

	.text-align-center {
		text-align: center;
	}

	.flex1 {
		flex: 1;
	}
</style>