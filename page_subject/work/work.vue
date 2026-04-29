<template>
	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='连接设备'></z-nav-bar>
	<public-module></public-module>
	<view class="">
		<image class="topKV" :style="menuStyle" mode="widthFix" src="@/static/SY_01_000.png"></image>
		<view class="tips">监测到以下设备</view>
		<view class="tips" v-if="tempDeviceIdList.length == 0">暂无设备</view>
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
	import { PillowBleManager, BlueWifiToolManager } from '@/utils/BlueUtils';
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
			this.checkBlueToothSetting();
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
			// 如果正在搜索中
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
				wifiMacToolManager: null,
			}
		},
		methods: {
			isGoodSleepName(name) {
				const n = String(name || '').trim();
				return /^goodsleep/i.test(n);
			},
			isTargetPillowDevice(device) {
				const d = device || {};
				const name = String(d.name || '').trim();
				const localName = String(d.localName || '').trim();
				const startsWithMinga = (s) => /^minga/i.test(String(s || '').trim());
				return startsWithMinga(name) || startsWithMinga(localName);
			},
			resolveCachedSoapMac() {
				const keys = ['wifi_device_mac', 'soap_device_mac', 'device_mac', 'wifiMac', 'mac'];
				for (let i = 0; i < keys.length; i++) {
					const v = uni.getStorageSync(keys[i]);
					if (typeof v === 'string' && v.trim()) return v.trim();
				}
				return '';
			},
			tryPersistIosMacFromScanDevice(device) {
				if (!this.isIOS) return;
				const d = device || {};
				const name = d.name || d.localName || '';
				if (!this.isGoodSleepName(name)) return;
				if (!d.advertisData || typeof d.advertisData !== 'string') return;
				// 首次扫描阶段拿到并落库即可，避免后续反复覆盖。
				if (this.resolveCachedSoapMac()) return;
				if (!this.wifiMacToolManager) {
					this.wifiMacToolManager = new BlueWifiToolManager(this);
				}
				const saved = this.wifiMacToolManager.persistWifiMacForSoap({
					advertisData: d.advertisData,
					deviceId: d.deviceId || '',
					uuid: d.uuid || ''
				});
				if (saved) {
					try {
						uni.setStorageSync('ios_goodsleep_advertisData', d.advertisData);
					} catch (e) {}
					console.log('[work] iOS 首次扫描已保存 MAC:', saved);
				}
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
					
				// 清空设备列表
				// this.deviceIdList = []; // 已注释，使用 tempDeviceIdList 代替
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
					if (!rawDevices[0]) {
						return;
					}
					const first = rawDevices[0];
					let isnotexist = !deviceIdList.some(device => device.deviceId === first.deviceId);
					let devices = rawDevices;
					console.log("onBluetoothDeviceFound:", result);

					if (first.advertisData) {
						first.advertisData = ab2hex(first.advertisData);
					} else {
						first.advertisData = '';
					}
					that.tryPersistIosMacFromScanDevice(first);

					if (isnotexist) {
						if (that.isTargetPillowDevice(first)) {
							deviceIdList.push(first);
							that.refreshDeviceList();
						}
						console.log('result.devices[0].name:', first.name);
					}

					console.log('new device list has founded', deviceIdList.length, devices.length, devices);
				};
				uni.onBluetoothDeviceFound(this.deviceFoundHandler);
			},
			checkBlueToothSetting() {
				console.log("checkBlueToothSetting");
				let that = this;
				const systemInfo = uni.getSystemInfoSync();
				const isIOS = systemInfo.platform === 'ios';
				this.isIOS = isIOS;
				// 每次进来先重置蓝牙错误弹窗标记，避免上一轮的状态影响本次
				this.bluetoothErrorShown = false;

				// 获取用户权限设置
				uni.getSetting({
					success(res) {
						console.log("getSetting", res);
						// 检查蓝牙权限（小程序層級）
						if (!res.authSetting["scope.bluetooth"]) {
							that.requestPermission(
								"scope.bluetooth",
								() => {
									console.log("蓝牙权限已授予");
									// iOS 不需要再申請地理位置權限，直接開啟藍牙
									if (isIOS) {
										that.openBlueTooth();
									} else {
										// Android 再檢查地理位置權限
										that.checkLocationPermission();
									}
								},
								() => {
									console.log("蓝牙权限被拒绝");
									that.showPermissionDeniedMessage("蓝牙");
								}
							);
						} else {
							console.log("蓝牙权限已存在");
							if (isIOS) {
								// iOS 已有藍牙權限，直接開啟藍牙
								that.openBlueTooth();
							} else {
								// Android 再檢查地理位置權限
								that.checkLocationPermission();
							}
						}
					},
					fail(err) {
						console.error("获取权限设置失败", err);
						that.showPermissionDeniedMessage("蓝牙");
					}
				});
			},

			// 检查地理位置权限
			checkLocationPermission() {
				let that = this;
				// 只在 Android 等需要定位權限的平台調用；iOS 直接在 checkBlueToothSetting 裡 openBlueTooth
				uni.getSetting({
					success(res) {
						if (!res.authSetting["scope.userLocation"]) {
							that.requestPermission(
								"scope.userLocation",
								() => {
									console.log("地理位置权限已授予");
									that.openBlueTooth(); // 初始化蓝牙功能
								},
								() => {
									console.log("地理位置权限被拒绝");
									that.showPermissionDeniedMessage("地理位置");
								}
							);
						} else {
							console.log("地理位置权限已存在");
							that.openBlueTooth(); // 初始化蓝牙功能
						}
					},
					fail(err) {
						console.error("获取权限设置失败", err);
						that.showPermissionDeniedMessage("地理位置");
					}
				});
			},

			// 请求权限的通用方法
			requestPermission(scope, successCallback, errorCallback) {
				uni.authorize({
					scope: scope,
					success: successCallback,
					fail: errorCallback
				});
			},

			// 显示权限被拒绝的提示信息
			showPermissionDeniedMessage(permissionName) {
				uni.showModal({
					title: "权限不足",
					content: `请前往设置页面开启 ${permissionName} 权限`,
					success: (modalRes) => {
						if (modalRes.confirm) {
							uni.openSetting({
								success: (settingRes) => {
									console.log("用户打开了设置页面", settingRes);
								}
							});
						}
					}
				});
			},
			// 統一處理藍牙初始化失敗的提示（錯誤碼對照官方表）
			handleOpenBluetoothFail(err) {
				// 避免同一次流程中連續彈多次相同提示
				if (this.bluetoothErrorShown) {
					console.log('handleOpenBluetoothFail 已顯示過，本次忽略:', err);
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
						// 其它錯誤碼（10002 / 10003 / 10004 / 10005 / 10006...）統一給出通用提示並附帶錯誤碼
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
					console.log('startBluetoothDiscovery 跳过：页面已离开');
					return;
				}
				this.addCallBack();
				uni.startBluetoothDevicesDiscovery({
					services: [],
					success: (res) => {
						console.log('startBluetoothDevicesDiscovery success:', res)
						this.searching = true
					},
					fail: (err) => {
						console.log('startBluetoothDevicesDiscovery fail:', err)
						if(err.errCode == -1){
							uni.showModal({
								title:'微信位置权限未授予提示',
								content:'当前系统未开启定位服务或未授权微信使用定位，无法搜索蓝牙设备\n请在手机系统设置打开定位服务兵允许微信使用位置信息后重试',
								showCancel:false
							})
						}
						this.searching = false
					}
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
			// 跳转手动调整
			showAdjustHandler() {
				this.closePopUpHandle()
				uni.switchTab({
					url: "/pages/status/status"
				})
			},

			closePopUpHandle() {
				this.$refs.ppp.close()
			},
			// 停止蓝牙扫描（连接前只停止扫描，不关闭适配器，参考 xxxx.vue）
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
					
					// 测试模式下也需要触发状态更新事件
					console.log('测试模式：触发 bluetooth_status_change 事件')
					uni.$emit('bluetooth_status_change');
					
					this.showAdjustHandler();
					return;
				}
				let deviceId = item.deviceId;
				uni.createBLEConnection({
					// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
					deviceId: deviceId,
					success: (res) => {
						wx.showToast({
							title: '连接成功',
							icon: 'success',
							duration: 1000
						})
						this.stopBlueTooth();
						app.globalData.deviceId = deviceId;

					PillowBleManager.getInstance().deviceId = deviceId;
					PillowBleManager.getInstance().deviceName = item.name;
					// 不要在这里设置 loginSuccess = true，让握手流程正常进行

					console.log('connectBluetooth success!:', deviceId, res)
					console.log('连接成功，设备信息已设置，等待握手...')
					
					// 更新连接状态（物理连接已建立）
					this.isConnected = true;
					// 同步當前已連接設備ID，便於按鈕狀態即時切換
					this.currentDeviceId = deviceId;
						uni.getBLEDeviceServices({
							deviceId,
							success: (res) => {
								console.log('getBLEDeviceServices success:', res)
								console.log('getBLEDeviceServices res.services:', res.services)
								for (let i = 0; i < res.services.length; i++) {
									if (res.services[i].isPrimary) {
										// this.addNotify(deviceId, res.services[i]
										// 	.uuid, '6E400003-B5A3-F393-E0A9-E50E24DCCA9E')
										this.getBLEDeviceCharacteristics(deviceId, res
											.services[i]
											.uuid)
										//这里只取第一个哈！！！！！！！！
										break;
										// 可根据具体业务需要，选择一个主服务进行通信
									}
								}

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
			// 获取蓝牙设备某个服务中所有特征值(characteristic)。
			getBLEDeviceCharacteristics(deviceId, serviceId) {
				const mgr = PillowBleManager.getInstance()
				console.log('getBLEDeviceCharacteristics:', deviceId, serviceId)
				uni.getBLEDeviceCharacteristics({
					deviceId: deviceId,
					serviceId: serviceId,
					success: (res) => {
						const chars = res.characteristics || []
						let notifyUUID = ''
						let writeUUID = ''
						chars.forEach((ch) => {
							const p = ch.properties || {}
							if (!notifyUUID && p.notify) notifyUUID = ch.uuid
							if (!writeUUID && (p.write || p.writeNoResponse)) writeUUID = ch.uuid
						})
						if (!notifyUUID && chars[1]) notifyUUID = chars[1].uuid
						if (!notifyUUID && chars[0]) notifyUUID = chars[0].uuid
						if (!writeUUID && chars[0]) writeUUID = chars[0].uuid
						if (!notifyUUID) {
							uni.showToast({ title: '未找到通知特征', icon: 'none' })
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
								}
							}
						)
					},
					fail: (res) => {
						console.log('%c getBLEDeviceCharacteristics fail', 'color:red;', res)
					}
				})
			},

			// 检测是否
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
		color: #5B7897;
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
		box-shadow: 0rpx 0rpx 20rpx #5B7897;
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
		border: 1px solid #5B7897;
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
			background-color: #5B7897;
			line-height: 78rpx;
			color: white;
			margin: 20rpx;
			border-radius: 25rpx;
		}

		.item-name {
			line-height: 38rpx;
			color: #5B7897;
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
			box-shadow: 0rpx 0rpx 20rpx #5B7897;
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
			box-shadow: 0rpx 0rpx 20rpx #5B7897;
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
		/* iphonex 等安全区设置，底部安全区适配 */

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
				background-color: #5B7897;
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