<template>
	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='连接设备'></z-nav-bar>
	<public-module></public-module>
	<view class="">
		<image class="topKV" :style="menuStyle" mode="widthFix" src="@/static/SY_01_000.png"></image>
		<view class="tips">检测到以下设备</view>
		<view class="tips" v-if="tempDeviceIdList.length == 0">暂无设备</view>
		<view v-for="(item,index) in tempDeviceIdList" :key="index">
			<view class="device-item">
				<view class="item-name">
					{{item.name}}
				</view>
				<view class="blue-tooth">
					<image mode="widthFix" :src="checkConnectList(item)"></image>
				</view>
				<view class="connect-btn" @click="disconnectBlueToothHandler(item)"
					v-if="isConnected && item.deviceId == currentDeviceId">断开连接</view>
				<view class="connect-btn" @click="connectBlueToothSleepHandler(item)" v-else>连接</view>
			</view>
		</view>
		<view class="spetips">
			<div class="item" style="margin-left: 42rpx;">特别说明:</div>
			<div class="item flex align-center" style="padding-bottom: 60rpx;">
				<image class="iconblue" mode="widthFix" src="../../static/SY_01_IconLY.png"></image>
				<div>睡眠枕基本使用功能，需要蓝牙连接</div>
			</div>
		</view>
		<uni-popup ref="ppp" style="z-index: 10000; position: absolute;" border-radius="40rpx 40rpx 0rpx 0rpx"
			background-color='white' :safe-area="false" class="popup" :mask-click="false" @change="change">
			<view class="container">
				<image class="close-btn" @click="closePopUpHandle"
					src="@/page_subject/static/adjust/SY_05_buttonCOLa.png" mode="widthFix">
				</image>
				<image class="tip" src="@/static/adjust/SY_05_B001.png" mode="widthFix"></image>
				<view class="touch">
					<view class="item" @click="autoHandler">
						<image class="icon1" src="@/page_subject/static/adjust/SY_02_Icon01.png" mode=""></image>
						<label>AI识别全自动设置</label>
					</view>
					<view class="item" @click="showAdjustHandler">
						<image class="icon2" src="@/page_subject/static/adjust/SY_02_Icon02.png" mode=""></image>
						<label>手动调整</label>
					</view>
					<view class="item" @click="showModeHandler">
						<image class="icon3" src="@/page_subject/static/adjust/SY_02_Icon03.png" mode=""></image>
						<label>选择已有数据</label>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import {
		object2Query,
		ab2hex,
		ensureLoginBeforeConnectBle
	} from '@/common/util.js'
	import { PillowBleManager, pickPillowBleService, pickPillowBleCharacteristics, WifiToolManager } from '@/utils/BlueUtils';
	import {
		checkBluetoothAndLocationByDeviceType,
		ensureLocationForBleScan,
		handleBleScanFail,
		isAwaitingLocationPermissionReturn,
		clearLocationPermissionAwaitingReturn,
		probeWifiLocationPermission
	} from '@/utils/permissionUtil.js';
	import { isIOSPlatform } from '@/utils/platformBle.js';
	import {
		nextTick
	} from 'vue';
	export default {
		computed: {
			loginDeviceId() {
				return PillowBleManager.getInstance().deviceId;
			},
			blueDeviceIdList() {
				return PillowBleManager.getInstance().deviceIdList;
			}
		},
		onShow() {
			// 每次页面显示时重置蓝牙错误弹窗标记，避免上一轮的状态影响本次
			this.bluetoothErrorShown = false;
			if (isAwaitingLocationPermissionReturn()) {
				probeWifiLocationPermission().then((granted) => {
					clearLocationPermissionAwaitingReturn();
					if (granted) {
						console.log('[work] 从系统设置返回，位置权限已可用，重新初始化蓝牙');
						this.checkBlueToothSetting();
					}
				});
			} else {
				this.checkBlueToothSetting();
			}
			this.refreshDeviceList();

			this.onShowing = true;
			// 初始化连接状态
			this.isConnected = PillowBleManager.getInstance().loginSuccess;
			let app = getApp();
			this.$set(this.menuStyle, '--menuButtonTop', (app.globalData.top + 80) + 'px');
			
			// 先移除旧监听，避免 onShow 多次注册重复触发
			if (this.adapterStateHandler) {
				if (typeof uni.offBluetoothAdapterStateChange === 'function') {
					uni.offBluetoothAdapterStateChange(this.adapterStateHandler);
				} else {
					uni.onBluetoothAdapterStateChange(null);
				}
				this.adapterStateHandler = null;
			}
			this.adapterStateHandler = (res) => {
				console.log('蓝牙适配器状态变化:', res);
				if (!this.onShowing) {
					return;
				}
				if (res.available) {
					console.log('检测到蓝牙已打开，重新开始搜索设备');
					this.bluetoothErrorShown = false;
					this.openBlueTooth();
				} else {
					console.log('检测到蓝牙已关闭');
					this.searching = false;
				}
			};
			uni.onBluetoothAdapterStateChange(this.adapterStateHandler);

			// this.deviceIdList = [];
			// // 如果正在搜索中
			if (this.searching) {
				// uni.closeBluetoothAdapter({
				// 	complete: () => {
				// 		this.searching = false
				// 	}
				// })
			} else {
				// 如果正在连接
				if (PillowBleManager.getInstance().deviceId != '') {
					// console.log(PillowBleManager.getInstance().deviceName, PillowBleManager.getInstance().deviceId)
					// PillowBleManager.getInstance().deviceIdList.push({
					// 	name: PillowBleManager.getInstance().deviceName,
					// 	deviceId: PillowBleManager.getInstance().deviceId
					// });
				} else {
					if (app.globalData.versionCode == 0) {
						PillowBleManager.getInstance().deviceIdList.push({
							name: this.testName,
							deviceId: 'deviceId'
						})
					}
				}
			}
			// 新协议走 0xAA 帧，由各自页面监听 uni.$emit('xx')；本页不再做旧握手解析
			this.bluetoothStatusChangeHandler = () => {
				this.handleDisconnect();
				// 根據全局狀態同步當前設備ID，便於按鈕顯示
				if (PillowBleManager.getInstance().loginSuccess) {
					this.currentDeviceId = PillowBleManager.getInstance().deviceId;
				} else {
					this.currentDeviceId = '';
				}
			};
			uni.$on('bluetooth_status_change', this.bluetoothStatusChangeHandler)
			// 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
			// uni.onBLECharacteristicValueChange(this.handleMessage)
		},
		onHide() {
			this.teardownBluetoothPage();
		},
		onUnload() {
			this.teardownBluetoothPage();
		},
		onLoad() {
			// 监听设备发现
			let that = this
			console.log("onload!!!!!!")
		},
		data() {
			return {
				currentDeviceId: PillowBleManager.getInstance().deviceId,
				menuStyle: {
					'--menuButtonTop': "0",
				},
				tempDeviceIdList: [],
				currentItem: {},
				onShowing: false, //页面是否显示
				show: false,
				success: false, //第一次握手成功
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				characteristicStringId: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', //write，string，rx；
				searching: false, // 搜索中
				deviceId: '', // 连接的蓝牙id
				serviceId: '', // 连接的服务id
				// deviceIdList: [], // 检测列表
				testName: '测试专用',
				connectList: [], // 连接列表
				isConnected: false, // 连接状态
				bluetoothErrorShown: false, // 是否已弹出过蓝牙初始化失败提示
				deviceFoundHandler: null,
				adapterStateHandler: null,
				isIOS: false,
				_wifiToolManager: null,
			}
		},
		methods: {
			getWifiToolManager() {
				if (!this._wifiToolManager) {
					this._wifiToolManager = new WifiToolManager(this)
				}
				return this._wifiToolManager
			},
			normalizeScanDeviceAdvertisData(device) {
				const d = device || {}
				if (d.advertisData) {
					d.advertisData = ab2hex(d.advertisData)
				} else {
					d.advertisData = ''
				}
				return d
			},
			/** 扫描到 GoodSleep/RTK_BT：解析 advertisData 写入 WiFi MAC，不展示在连接列表 */
			tryPersistGoodSleepMacFromScan(device) {
				const saved = this.getWifiToolManager().handleGoodSleepDeviceOnScan(device, { force: true })
				if (saved) {
					const mgr = this.getWifiToolManager()
					const displayName = mgr.formatMingaDisplayNameFromWifiMac(saved)
					const adv = String((device && device.advertisData) || '').slice(0, 40)
					console.log('[work] GoodSleep 配网 WiFi MAC:', saved, '→', displayName, 'advertisData:', adv || '(empty)')
				}
				return saved
			},
			isTargetPillowDevice(device) {
				const d = device || {};
				const name = String(d.name || '').trim();
				const localName = String(d.localName || '').trim();
				const startsWithMinga = (s) => /^minga/i.test(String(s || '').trim());
				return startsWithMinga(name) || startsWithMinga(localName);
			},
			/** 离开连接页时必须停止扫描并卸监听，避免回到首页仍持续搜蓝牙 */
			teardownBluetoothPage() {
				this.onShowing = false;
				if (this.bluetoothStatusChangeHandler) {
					uni.$off('bluetooth_status_change', this.bluetoothStatusChangeHandler);
				}
				uni.stopBluetoothDevicesDiscovery({
					complete: () => {
						this.searching = false;
					}
				});
				if (this.deviceFoundHandler && typeof uni.offBluetoothDeviceFound === 'function') {
					try {
						uni.offBluetoothDeviceFound(this.deviceFoundHandler);
					} catch (e) {
						console.warn('offBluetoothDeviceFound', e);
					}
					this.deviceFoundHandler = null;
				} else {
					uni.onBluetoothDeviceFound(null);
					this.deviceFoundHandler = null;
				}
				if (this.adapterStateHandler) {
					if (typeof uni.offBluetoothAdapterStateChange === 'function') {
						try {
							uni.offBluetoothAdapterStateChange(this.adapterStateHandler);
						} catch (e) {
							console.warn('offBluetoothAdapterStateChange', e);
						}
					} else {
						uni.onBluetoothAdapterStateChange(null);
					}
					this.adapterStateHandler = null;
				}
			},
			// 处理蓝牙断开连接
			handleDisconnect() {
				console.log('handleDisconnect 被调用，当前 loginSuccess:', PillowBleManager.getInstance().loginSuccess);
				// 检查是否真的断开了
				if (!PillowBleManager.getInstance().loginSuccess) {
					console.log('工作页面检测到蓝牙断开');
					
					// 更新连接状态
					this.isConnected = false;
					console.log('设置 isConnected = false');
					
					this.tempDeviceIdList = [];
					
					// 停止搜索
					this.stopBlueTooth();
				} else {
					// 连接成功时也更新状态
					this.isConnected = true;
					console.log('工作页面检测到蓝牙连接，设置 isConnected = true');
				}
			},
			disconnectBlueToothHandler(item) {
				let that = this;
				// 标记为手动断开，避免弹出“意外断开”提示
				PillowBleManager.getInstance().setManualDisconnecting(true);
				uni.closeBLEConnection({
					deviceId: item.deviceId,
					success: function(res) {
						console.log("断开连接成功", res);
						let index = that.tempDeviceIdList.findIndex(device => device.deviceId == item
						.deviceId);
						if (index != -1) {
							that.tempDeviceIdList.splice(index, 1);
						}
						that.currentDeviceId = '';
						PillowBleManager.getInstance().deviceId = '';
						PillowBleManager.getInstance().deviceName = '';
						PillowBleManager.getInstance().loginSuccess = false;
						console.log('手动断开：设置 loginSuccess = false，准备触发事件');
						// 触发连接状态变化事件，通知页面更新
						uni.$emit('bluetooth_status_change');
						console.log('手动断开：已触发 bluetooth_status_change 事件');
						uni.showModal({
							title: '蓝牙断开提示',
							content: `设备${item.name}已断开连接`,
							showCancel: false,
							success: (res) => {
								that.refreshDeviceList();
							}
						})
					},
					fail: function(err) {
						console.log('断开蓝牙连接失败：', err);
					}
				});
			},
			refreshDeviceList() {
				this.tempDeviceIdList.length = 0;
				for (var item in PillowBleManager.getInstance().deviceIdList) {
					this.tempDeviceIdList.push(PillowBleManager.getInstance().deviceIdList[item]);
				}
				// this.tempDeviceIdList = PillowBleManager.getInstance().deviceIdList;
				console.log("refreshDeviceList:", this.tempDeviceIdList)
			},
			addCallBack() {
				const that = this;
				const deviceIdList = PillowBleManager.getInstance().deviceIdList;
				if (this.deviceFoundHandler && typeof uni.offBluetoothDeviceFound === 'function') {
					try {
						uni.offBluetoothDeviceFound(this.deviceFoundHandler);
					} catch (e) {}
					this.deviceFoundHandler = null;
				}
				this.deviceFoundHandler = (result) => {
					if (!that.onShowing) {
						return;
					}
					const rawDevices = (result && result.devices) || [];
					if (!rawDevices.length) {
						return;
					}
					console.log("onBluetoothDeviceFound:", result);

					rawDevices.forEach((raw) => {
						const first = that.normalizeScanDeviceAdvertisData({ ...raw });

						if (WifiToolManager.isGoodSleepBleDevice(first)) {
							that.tryPersistGoodSleepMacFromScan(first);
							console.log('result.devices GoodSleep/RTK:', first.name || first.localName, first.advertisData ? first.advertisData.slice(0, 24) : '(no adv)');
							return;
						}

						const isnotexist = !deviceIdList.some((device) => device.deviceId === first.deviceId);
						const existIdx = deviceIdList.findIndex((device) => device.deviceId === first.deviceId);
						if (existIdx >= 0) {
							if (first.advertisData) {
								deviceIdList[existIdx].advertisData = first.advertisData;
							}
							if (first.name && !deviceIdList[existIdx].name) {
								deviceIdList[existIdx].name = first.name;
							}
							return;
						}

						if (isnotexist && that.isTargetPillowDevice(first)) {
							deviceIdList.push(first);
							console.log('result.devices[0].name:', first.name);
						}
					});

					that.refreshDeviceList();
					console.log('new device list has founded', deviceIdList.length, rawDevices.length);
				};
				uni.onBluetoothDeviceFound(this.deviceFoundHandler);
			},
			checkBlueToothSetting() {
				console.log('checkBlueToothSetting');
				this.isIOS = isIOSPlatform();
				this.bluetoothErrorShown = false;
				checkBluetoothAndLocationByDeviceType()
					.then(() => {
						if (!this.onShowing) return;
						this.openBlueTooth();
					})
					.catch((err) => {
						console.log('checkBlueToothSetting权限未就绪:', err);
					});
			},
			//  統一處理藍牙初始化失敗的提示（錯誤碼對照官方表）
			handleOpenBluetoothFail(err) {
				// 避免同一次流程中連續彈多次相同提示
				if (this.bluetoothErrorShown) {
					return;
				}
				this.bluetoothErrorShown = true;
				console.log('openBluetoothAdapter fail:', err);
				let message = '蓝牙初始化失败，请稍后重试';
				const code = err.errCode || err.errno;
				switch (code) {
					case 10001: // not available：當前藍牙適配器不可用（藍牙關閉、硬件不可用）
						message = '请检查手机蓝牙是否打开';
						break;
					case 10000: // not init：未初始化藍牙適配器
					case 3:
						message = '蓝牙尚未初始化，请检查微信是否已开启附近设备权限或蓝牙权限';
						break;
					case 10008: // system error：其餘系統上拋的異常
						message = '系统蓝牙出现异常，请重启手机后重试';
						break;
					case 10009: // system not support：Android 系統特有，版本過低或不支持 BLE
						message = '当前系统不支持蓝牙低功耗功能，请更换设备后重试或重新进入小程序';
						break;
					default:
						if (code !== undefined) {
							message = `蓝牙初始化失败（错误码：${code}），请检查系统设置或稍后重试`;
						}
						break;
				}
				uni.showModal({
					title: '提示',
					content: message,
					showCancel: false,
					success: () => {
						this.searching = false;
					}
				});
			},
			// 开始搜索蓝牙设备（提取为独立方法，避免重复代码）
			startBluetoothDiscovery() {
				if (!this.onShowing) {
					console.log('startBluetoothDiscovery跳过：页面已离开');
					return;
				}
				this.addCallBack();
				ensureLocationForBleScan().then(() => {
					uni.startBluetoothDevicesDiscovery({
						services: [],
						success: (res) => {
							console.log('startBluetoothDevicesDiscovery success:', res)
							this.searching = true
						},
						fail: (err) => {
							console.log('startBluetoothDevicesDiscovery fail:', err)
							handleBleScanFail(err)
							this.searching = false
						}
					})
				})
			},
			openBlueTooth() {
				if (!this.onShowing) {
					console.log('openBlueTooth 跳过：页面已离开');
					return;
				}
				// 先检查适配器状态，避免重复初始化
				uni.getBluetoothAdapterState({
					success: (res) => {
						if (!this.onShowing) {
							return;
						}
						console.log('蓝牙适配器已打开，直接开始搜索设备');
						this.startBluetoothDiscovery();
					},
					fail: (err) => {
						if (!this.onShowing) {
							return;
						}
						console.log('蓝牙适配器未打开，尝试初始化:', err);
						this.addCallBack();
						uni.openBluetoothAdapter({
							success: (res) => {
								if (!this.onShowing) {
									return;
								}
								console.log('openBluetoothAdapter success');
								this.startBluetoothDiscovery();
							},
							fail: (res) => {
								console.log('openBluetoothAdapter fail:', JSON.stringify(res));
								this.handleOpenBluetoothFail(res);
							}
						});
					}
				})
			},
			// ai识别
			autoHandler() {
				this.closePopUpHandle()
				var url_ = '/page_subject/measure/measure' + object2Query({
					pillowName: '',
					deviceId: this.deviceId,
					serviceId: this.serviceId
				})
				console.log('url:', url_)
				uni.navigateTo({
					url: url_
				})
			},
			// 我的模式
			showModeHandler() {
				this.closePopUpHandle()
				var url_ = '/page_subject/mode/mode' + object2Query({
					pillowName: '自定义模式',
					deviceId: this.deviceId,
					serviceId: this.serviceId
				})
				console.log('url:', url_)
				uni.navigateTo({
					url: url_
				})
			},
			showAdjustHandler() {
				this.closePopUpHandle()
				uni.switchTab({
					url: "/pages/status/status"
				})
			},

			closePopUpHandle() {
				this.$refs.ppp.close()
			},
			// 停止蓝牙扫描
			stopBlueTooth() {
				uni.stopBluetoothDevicesDiscovery({
					complete: () => {
						this.searching = false;
					}
				});
			},

			// 连接蓝牙
			connectBlueToothSleepHandler(item) {
				uni.showLoading({
					title: '连接蓝牙设备中...',
				})

				// 再次防护：点击连接按钮时也校验登录状态
				if (!ensureLoginBeforeConnectBle(() => {
					// 这里不做额外处理，仅用于通过校验
				})) {
					uni.hideLoading();
					return;
				}


				let app = getApp();
				if (app.globalData.versionCode == 0) {
					wx.showToast({
						title: '连接成功',
						icon: 'success',
						duration: 1000
					})
					this.stopBlueTooth();
					app.globalData.deviceId = 'deviceId';
					app.globalData.deviceName = this.testName;

					PillowBleManager.getInstance().deviceId = 'deviceId';
					PillowBleManager.getInstance().deviceName = this.testName;
					PillowBleManager.getInstance().loginSuccess = true;
					
					// 同步當前已連接設備ID，便於按鈕狀態即時切換
					this.currentDeviceId = 'deviceId';
					
					// 更新连接状态
					this.isConnected = true;
					
					uni.$emit('bluetooth_status_change');
					
					this.showAdjustHandler();
					return;
				}
				let deviceId = item.deviceId;
				const mgr = PillowBleManager.getInstance();
				mgr.deviceId = deviceId;
				mgr.deviceName = item.name;
				uni.createBLEConnection({
					deviceId: deviceId,
					success: (res) => {
						wx.showToast({
							title: '连接成功',
							icon: 'success',
							duration: 1000
						})
						this.stopBlueTooth();
						app.globalData.deviceId = deviceId;

					console.log('connectBluetooth success!:', deviceId, res)
					console.log('连接成功，设备信息已设置，等待握手...')
					
					this.isConnected = true;
					this.currentDeviceId = deviceId;
						uni.getBLEDeviceServices({
							deviceId,
							success: (res) => {
								console.log('getBLEDeviceServices success:', res)
								console.log('getBLEDeviceServices res.services:', res.services)
								const services = (res && res.services) || []
								const selected = pickPillowBleService(services)
								if (!selected) {
									uni.showToast({ title: '未找到蓝牙服务', icon: 'none' })
									return
								}
								this.getBLEDeviceCharacteristics(deviceId, selected.uuid)
							},
							fail: (res) => {
								console.log('getBLEDeviceServices fail:', res)
							}
						})
					},
					fail: (res) => {
						console.log("connectBluetooth fail: ", res)
					},
					complete: () => {
						uni.hideLoading()
					}
				})
			},
			// 获取蓝牙设备某个服务中所有特征值
			getBLEDeviceCharacteristics(deviceId, serviceId) {
				const mgr = PillowBleManager.getInstance()
				console.log('getBLEDeviceCharacteristics:', deviceId, serviceId)
				uni.getBLEDeviceCharacteristics({
					deviceId: deviceId,
					serviceId: serviceId,
					success: (res) => {
						const chars = res.characteristics || []
						const { notifyUUID, writeUUID } = pickPillowBleCharacteristics(chars)
						if (!notifyUUID) {
							uni.showToast({ title: '未找到可用通知特征，已进入首页', icon: 'none' })
							return
						}
						mgr.startNotice(
							{
								deviceUUID: deviceId,
								serviceUUID: serviceId,
								notifyUUID,
								writeUUID: writeUUID || mgr.characteristicId
							},
							{
								onReady: () => {
									nextTick(() => {
										this.showAdjustHandler()
									})
								},
								onFail: (err) => {
									console.warn('[work] notify 失败，继续进入首页', err)
									uni.showToast({
										title: '通知开启失败，已进入首页',
										icon: 'none'
									})
									nextTick(() => {
										this.showAdjustHandler()
									})
								}
							}
						)
					},
					fail: (res) => {
						console.log('%c getBLEDeviceCharacteristics fail', 'color:red;', res)
					}
				})
			},

			// 检测是否连接
			checkConnectList(item) {
				if (this.connectList.indexOf(item.deviceId) > -1) {
					return '../static/SY_01WIEI_IconLY.png'
				}
				return '../static/SY_01WIEI_IconLY.png'
			},
			change(e) {
				this.show = e.show
			}
		}
	}
</script>

<style lang="scss">
	.topKV {
		width: 100%;
		padding-top: var(--menuButtonTop);
	}

	.header {
		height: 80rpx;
	}

	.tips {
		text-align: center;
		color: rgba(5, 28, 44, 0.7);
		font-size: 32rpx;
		padding: 20rpx;
	}

	.spetips {
		text-align: left;
		font-size: 32rpx;
		padding: 30rpx;

		position: absolute;
		left: 0;
		right: 0;
		background-color: #ffffff;
		box-shadow: 0rpx 0rpx 20rpx rgba(5, 28, 44, 0.7);
		border-top-left-radius: 15rpx;
		border-top-right-radius: 15rpx;
		bottom: 0rpx;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);

		.item {
			line-height: 32rpx;
			padding: 5rpx;
			letter-spacing: 1rpx;
			padding-bottom: 20rpx;
		}

		.iconblue {
			width: 30rpx;
			padding: 5rpx;
			margin-right: 10rpx;
		}

	}

	.device-item {
		border: 1px solid rgba(5, 28, 44, 0.7);
		border-radius: 20rpx;
		margin-left: 41rpx;
		margin-right: 41rpx;
		height: 118rpx;
		line-height: 118rpx;
		display: flex;
		align-items: center;

		.connect-btn {
			width: 225rpx;
			height: 78rpx;
			text-align: center;
			background-color: rgba(5, 28, 44, 0.7);
			line-height: 78rpx;
			color: white;
			margin: 20rpx;
			border-radius: 25rpx;
		}

		.item-name {
			line-height: 38rpx;
			color: rgba(5, 28, 44, 0.7);
			font-size: 32rpx;
			padding-left: 30rpx;
			padding-right: 30rpx;
			flex: 1;
			text-overflow: ellipsis;
			overflow: hidden;
			margin-right: auto;
		}

		.blue-tooth {
			width: 80rpx;
			height: 80rpx;
			background-color: white;
			border-radius: 30rpx;
			box-shadow: 0rpx 0rpx 20rpx rgba(5, 28, 44, 0.7);
			display: flex;
			align-items: center;
			justify-content: center;
			// margin-right: 30rpx;

			image {
				display: inline-block;
				width: 28rpx;
				height: 43rpx;
			}
		}

		.wifi {
			background-color: white;
			border-radius: 30rpx;
			box-shadow: 0rpx 0rpx 20rpx rgba(5, 28, 44, 0.7);
			display: flex;
			align-items: center;
			justify-content: center;

			width: 80rpx;
			height: 80rpx;

			image {
				display: inline-block;
				width: 42rpx;
				height: 29rpx;
			}
		}
	}

	.uni-popup__wrapper-box {

		display: block;
		position: relative;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}

	.container {
		background-color: white;
		border-radius: 50rpx 50rpx 0rpx 0rpx;
		position: relative;

		::after {
			content: '';
			display: block;
			clear: both;
		}

		.tip {
			width: 322rpx;
			height: 161rpx;
			position: absolute;
			left: 50%;
			top: -60rpx;
			margin-left: -161rpx;
		}

		.close-btn {
			width: 26rpx;
			height: 27rpx;
			right: 30rpx;
			top: 20rpx;
			position: absolute;
		}



		.touch {
			text-align: center;
			padding-top: 100rpx;


			.item {
				text-align: center;
				color: white;
				background-color: rgba(5, 28, 44, 0.7);
				border-radius: 30rpx;
				margin-top: 10rpx;
				margin-bottom: 10rpx;
				margin-left: 35rpx;
				margin-right: 35rpx;
				line-height: 100rpx;
				position: relative;

				.item-btn {
					width: 713rpx;
					height: 100rpx;
					margin: 0 auto;
				}

				.icon1 {
					width: 81rpx;
					height: 81rpx;
					left: 20rpx;
					top: 10rpx;
					position: absolute;

				}

				.icon2 {
					left: 20rpx;
					top: 10rpx;
					width: 81rpx;
					height: 81rpx;
					position: absolute;
				}

				.icon3 {
					left: 20rpx;
					top: 10rpx;
					width: 81rpx;
					height: 81rpx;
					position: absolute;
				}

			}


		}
	}
</style>


