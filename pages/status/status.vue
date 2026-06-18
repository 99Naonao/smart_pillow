<template>
	<view class="main">
		<!-- 与微信胶囊同一行的顶栏：白底，标题居中；右侧仅睡姿（已连接时） -->
		<view class="status-nav" :style="navHeaderStyle">
			<view class="status-nav-row" :style="navRowStyle">
				<view class="nav-side nav-side-left"></view>
				<view class="nav-title-wrap">
					<text class="nav-title">{{ navTitle }}</text>
				</view>
				<view class="nav-side nav-side-right">
					<view v-if="loginStatus" class="nav-pillow-status nav-pillow-status--on">
						<text class="pillow-status-sub">睡姿 · {{ blePostureOnly }}</text>
					</view>
				</view>
			</view>
		</view>
		<scroll-view scroll-y class="status-scroll" :show-scrollbar="false">
			<!-- 横幅仅展示图片，信息已移到顶栏 -->
			<view class="banner-card">
				<image class="banner-img" mode="aspectFill" src="../../static/SY_01_000.png"></image>
				<view class="banner-mask"></view>
			</view>

			<!-- 头枕/颈枕高度：仅 develop / trial 展示（0x04 同步） -->
			<view v-if="showHomePillowHeightDevOnly" class="card card-height">
				<view class="height-col">
					<view class="height-col-head">
						<text class="height-label">头枕高度</text>
					</view>
					<view class="height-row-metric">
						<text class="height-value">{{ pillowHeadHeightDisplay }}</text>
						<text v-if="loginStatus" class="height-unit">%</text>
					</view>
				</view>
				<view class="height-v-divider"></view>
				<view class="height-col">
					<view class="height-col-head">
						<text class="height-label">颈枕高度</text>
					</view>
					<view class="height-row-metric">
						<text class="height-value">{{ pillowNeckHeightDisplay }}</text>
						<text v-if="loginStatus" class="height-unit">%</text>
					</view>
				</view>
			</view>

			<!-- 睡姿 0x0B 最高值：仅 develop / trial 展示与轮询 -->
			<view v-if="showHomePillowHeightDevOnly" class="card card-posture-0b">
				<text class="posture-0b-label">睡姿数据最高值</text>
				<text class="posture-0b-value">{{ posture0bMaxDisplay }}</text>
			</view>

			<!-- 生命特征：卡片常显；未连枕、离床、睡姿空闲或无数据时显示 -- -->
			<view class="card card-vitals">
				<view class="vital-col">
					<view class="vital-col-head">
						<image class="vital-icon" src="../../static/icon/heart.png" mode="aspectFit"></image>
						<text class="vital-label">心率</text>
					</view>
					<view class="vital-row-metric">
						<text class="vital-value">{{ realtimeHeartRateDisplay }}</text>
						<text class="vital-unit">次/分</text>
					</view>
				</view>
				<view class="vital-v-divider"></view>
				<view class="vital-col">
					<view class="vital-col-head">
						<image class="vital-icon" src="../../static/icon/breath.png" mode="aspectFit"></image>
						<text class="vital-label">呼吸率</text>
					</view>
					<view class="vital-row-metric">
						<text class="vital-value">{{ realtimeBreathRateDisplay }}</text>
						<text class="vital-unit">次/分</text>
					</view>
				</view>
			</view>

			<!-- 枕头加热：开关 + 档位 + 加热时间 -->
			<view class="card card-heat">
				<view class="heat-row heat-row-between">
					<view class="heat-title-wrap">
						<image class="heat-title-icon" src="../../static/icon/warm.png" mode="aspectFit"></image>
						<text class="heat-title">颈部加热</text>
					</view>
					<view class="heat-switch-wrap">
						<switch
							:key="'heat-sw-' + heatSwitchKey"
							:checked="heatSwitchOn"
							:disabled="!heatBleUiReady"
							color="#1C6A51"
							class="heat-switch"
							@change="onHeatSwitchChange"
						/>
						<!-- 未连接时拦截触摸：避免微信小程序 switch 先翻状态再进 @change，导致 UI 与数据不一致 -->
						<view
							v-if="!heatBleUiReady"
							class="heat-switch-mask"
							@tap.stop="onNeckHeatSwitchBlocked"
						/>
					</view>
				</view>
				<view v-if="heatSwitchOn" class="heat-expand">
					<view class="heat-row heat-row-duration">
						<text class="heat-sub-label">加热时间</text>
						<view class="heat-duration-grid">
							<view
								v-for="item in heatDurationOptions"
								:key="item.id"
								class="heat-level-btn heat-duration-btn"
								:class="{ active: heatDurationPresetId === item.id }"
								@click="onHeatDurationTap(item.id)"
							>{{ item.label }}</view>
						</view>
						<view v-if="heatDurationPresetId === 'custom'" class="heat-custom-duration">
							<input
								class="heat-custom-input"
								type="number"
								:disabled="!heatBleUiReady"
								v-model="heatCustomDurationMinutesStr"
								placeholder="1~180"
								@blur="syncHeatCustomDurationFromStr"
							/>
							<text class="heat-custom-unit">分钟（最长3小时）</text>
						</view>
					</view>
					<view class="heat-row heat-row-last">
						<text class="heat-sub-label">加热档位</text>
						<view class="heat-levels">
							<view
								v-for="(lv, idx) in heatLevels"
								:key="idx"
								class="heat-level-btn"
								:class="{ active: heatLevelIndex === idx }"
								@click="onHeatLevelTap(idx)"
							>{{ lv }}</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 功能入口：上排 3 个，下排 脊柱调整 + 手动微调 + 设备配网 -->
			<view class="card card-grid">
				<view class="grid-row grid-row-3">
					<view class="grid-item" @click="aiHandler">
						<view class="grid-icon-wrap">
							<image class="grid-icon" src="../../static/icon/take_picture.png" mode="aspectFit"></image>
						</view>
						<text class="grid-text">AI拍照</text>
					</view>
					<view class="grid-item" @click="hotHandler">
						<view class="grid-icon-wrap">
							<image class="grid-icon" src="../../static/icon/bluetooth.png" mode="aspectFit"></image>
						</view>
						<text class="grid-text">模式选择</text>
					</view>
					<view class="grid-item" @click="statusCheck">
						<view class="grid-icon-wrap">
							<image class="grid-icon" src="../../static/icon/study.png" mode="aspectFit"></image>
						</view>
						<text class="grid-text">睡姿学习</text>
					</view>
				</view>
				<view class="grid-row grid-row-3 grid-row-bottom">
					<view class="grid-item" @click="spineCheck">
						<view class="grid-icon-wrap">
							<image class="grid-icon" src="../../static/icon/spine.png" mode="aspectFit"></image>
						</view>
						<text class="grid-text">脊柱调整</text>
					</view>
					<view class="grid-item" @click="manualFineTune">
						<view class="grid-icon-wrap">
							<image class="grid-icon" src="../../static/icon/operation.png" mode="aspectFit"></image>
						</view>
						<text class="grid-text">手动微调</text>
					</view>
					<view class="grid-item" @click="openDeviceProvision">
						<view class="grid-icon-wrap">
							<image class="grid-icon" src="../../static/icon/device_config.png" mode="aspectFit"></image>
						</view>
						<text class="grid-text">设备配网</text>
					</view>
				</view>
			</view>

			<!-- 底部：设备连接；已连接时设备名在按钮内主文案下方 -->
			<view class="bottom-btns">
				<view
					class="btn-primary btn-full"
					:class="loginStatus ? 'btn-ble-connected' : 'btn-outline'"
					@click="adjustHandler"
				>
					<view class="btn-ble-inner">
						<view class="btn-ble-line1">
							<image class="btn-icon" src="../../static/icon/bluetooth.png" mode="aspectFit"></image>
							<text>{{ loginStatus ? '已连接 · 点按管理设备' : '连接设备' }}</text>
						</view>
						<text v-if="loginStatus && connectedDeviceName" class="btn-ble-device-name">{{ connectedDeviceName }}</text>
					</view>
				</view>
			</view>
			<view class="scroll-bottom-spacer"></view>
		</scroll-view>
		<uni-popup ref="ppp" style="z-index: 10000; position: absolute;" border-radius="40rpx 40rpx 0rpx 0rpx"
			background-color='white' :safe-area="false" class="popup" :mask-click="false" @change="change">
			<view class="popupcontainer">
				<image class="close-btn" @click="closePopUpHandle" :src="'../../static/adjust/SY_05_buttonCOLa.png'"
					mode="widthFix">
				</image>
				<image class="tip" src="@/static/adjust/SY_05_B001.png" mode="widthFix"></image>
				<view class="touch">
					<view class="item" @click="showMineHandler">
						<label>我的数据</label>
					</view>
					<view class="item" @click="showDefaultHandler">
						<label>默认数据</label>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	// import getBehavior from '../../utils/behavior'
	// import yuvBehavior from '../../utils/yuvBehavior'

	// 引入文件夹
	import {
		createScopedThreejs
	} from 'threejs-miniprogram'
	import {
		nextTick
	} from 'vue';
  import { PillowBleManager, WifiToolManager, readFirmwareVersionCache, pickPillowBleService, pickPillowBleCharacteristics } from '@/utils/BlueUtils';
  import { object2Query, buildHeartModuleWifiFrame9, parseHeartWifiStatusFromPayloadHex, resolveManualAdjustMode, canBypassBleConnectInCurrentEnv, maxPostureDataFromSnap } from '@/common/util.js'
  import { canBypassNonReleaseEnv } from '@/common/envBypass.js'
  import { PAGE_WIFI_PROVISION } from '@/common/navigation.js'
	import {
		getappVersion
	} from '../../utils/miniapp';
	import base from '@/utils/baseUrl';
	import deviceRealtimeManager from '@/utils/deviceRealtimeManager.js';

	/** 首页 0x04 readPillowStatus 周期性轮询间隔（毫秒） */
	const HOME_PILLOW_STATUS_POLL_MS = 1000
	/** 首页 0x0B 睡姿采样轮询间隔（毫秒，仅 develop/trial） */
	const HOME_POSTURE_0B_POLL_MS = 1000
	/** 首页 0x01 固件版本读取轮询间隔（毫秒） */
	const HOME_FIRMWARE_01_POLL_MS = 2000
	/** 首页 0x0F 联网状态查询轮询间隔（毫秒） */
	const HOME_WIFI_STATUS_QUERY_POLL_MS = 3000
	/** 先 0x0F 写透传后，再发 0x8F 读取的间隔（毫秒） */
	const HOME_WIFI_STATUS_READ_DELAY_MS = 220
	/** 命中一次联网成功（0x0A）即停止 0x0F 轮询 */
	const HOME_WIFI_STATUS_SUCCESS_STREAK_TARGET = 1

	export default {
		computed: {
			/** 已连接时：睡姿文案（顶栏右侧） */
			blePostureOnly() {
				if (!this.loginStatus) {
					return ''
				}
				let baseStatus = ''
				if (this.pillowStatus == 0) {
					baseStatus = '空闲'
				} else if (this.pillowStatus == 1) {
					baseStatus = '仰卧'
				} else if (this.pillowStatus == 2) {
					baseStatus = '侧卧'
				}
				if (this.isSpineAdjusting) {
					baseStatus = '微调中'
				}
				return baseStatus
			},
			login() {
				return this.loginStatus;
			},
			showNeckArrow() {
				return this.showNeckArrowFlag;
			},
			neckArrowSrc() {
				return this.neckArrowDirection === 'up' ? '../../static/SY_11_UP.png' : '../../static/SY_11_DOW.png';
			},
			showHeadArrow() {
				return this.showHeadArrowFlag;
			},
			headArrowSrc() {
				return this.headArrowDirection === 'up' ? '../../static/SY_11_UP.png' : '../../static/SY_11_DOW.png';
			},
			/** 未连枕 / 离床 / 睡姿空闲时不展示 WebSocket 实时心率、呼吸 */
			shouldHideRealtimeVitals() {
				if (!this.loginStatus) {
					return true;
				}
				if (this.deviceIsLeaveBed) {
					return true;
				}
				if (this.pillowStatus === 0) {
					return true;
				}
				return false;
			},
			realtimeHeartRateDisplay() {
				if (this.shouldHideRealtimeVitals) {
					return '--';
				}
				return this.realtimeHeartRate == null ? '--' : String(this.realtimeHeartRate);
			},
			realtimeBreathRateDisplay() {
				if (this.shouldHideRealtimeVitals) {
					return '--';
				}
				return this.realtimeBreathRate == null ? '--' : String(this.realtimeBreathRate);
			},
			/** 正式版须连蓝牙；develop/trial 可跳过连接拦截（加热区） */
			heatBleUiReady() {
				return this.loginStatus || canBypassBleConnectInCurrentEnv()
			},
			/** 首页头/颈枕高度：仅非正式环境显示 */
			showHomePillowHeightDevOnly() {
				return canBypassNonReleaseEnv()
			},
			/** 0x04 数据区头枕高度 uint16（0~100%），经 PillowBleManager 写入 pillowHeight */
			pillowHeadHeightDisplay() {
				if (!this.loginStatus) {
					return '--';
				}
				if (this.pillowHeight == null || this.pillowHeight === '') {
					return '--';
				}
				return String(this.pillowHeight);
			},
			/** 0x04 数据区颈枕高度 uint16（0~100%），经 PillowBleManager 写入 pillowSideHeight */
			pillowNeckHeightDisplay() {
				if (!this.loginStatus) {
					return '--';
				}
				if (this.pillowSideHeight == null || this.pillowSideHeight === '') {
					return '--';
				}
				return String(this.pillowSideHeight);
			},
			posture0bMaxDisplay() {
				if (!this.loginStatus || this.posture0bMaxValue == null) {
					return '--';
				}
				return String(this.posture0bMaxValue);
			}
		},
		watch: {
			pillowSideHeight(newVal, oldVal) {
				if (newVal !== oldVal && oldVal !== undefined && this.isInitialized) {
					this.showNeckArrowFlag = true;
					this.neckArrowDirection = newVal > oldVal ? 'up' : 'down';
					this.lastNeckHeight = newVal; // 更新最后记录的高度
					// 清除之前的定时器
					if (this.neckArrowTimer) {
						clearTimeout(this.neckArrowTimer);
					}
					// 设置新的定时器，2秒后检查是否还在调整
					this.neckArrowTimer = setTimeout(() => {
						
						this.checkNeckAdjustment();
					}, 1000);
				}
				this.prevPillowSideHeight = newVal;
			},
			pillowHeight(newVal, oldVal) {
				if (newVal !== oldVal && oldVal !== undefined && this.isInitialized) {
					this.showHeadArrowFlag = true;
					this.headArrowDirection = newVal > oldVal ? 'up' : 'down';
					this.lastHeadHeight = newVal; // 更新最后记录的高度
					// 清除之前的定时器
					if (this.headArrowTimer) {
						clearTimeout(this.headArrowTimer);
					}
					// 设置新的定时器，2秒后检查是否还在调整
					this.headArrowTimer = setTimeout(() => {
						this.checkHeadAdjustment();
					}, 1000);
				}
				this.prevPillowHeight = newVal;
			}
		},
		data() {
			return {
				hotLast: 0, // 热敷持续时间
				show: false,
				imgData: '',
				session: '',
				bodyImgUrl: '',
				bodyImgWidth: 0,
				bodyImgHeight: 0,
				bodyImgOriginWidth: 0,
				bodyImgOriginHeight: 0,
				deviceId: '', // 设备蓝牙id
				connectDeviceId: 'deviceId', // 链接上的蓝牙设备id
				serviceId: '', // 通知uuid
				writeServicweId: '', //写uuid
				readServicweId: '', //通知uuid
				msg: '',
				receiveInfo: '',
				deviceIdList: [], //
				searching: false, // 搜索中
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				loginStatus: false,
				pillowHeight: null,
				pillowSideHeight: null,
				pillowPower: 1,
				pillowStatus: 0,
				pillowPowerCharging: 0, // 充电状态
				prevPillowSideHeight: 0, // 记录上一次的颈枕高度
				prevPillowHeight: 0, // 记录上一次的头枕高度
				showNeckArrowFlag: false, // 控制颈枕箭头显示
				showHeadArrowFlag: false, // 控制头枕箭头显示
				neckArrowDirection: 'up', // 颈枕箭头方向
				headArrowDirection: 'up', // 头枕箭头方向
				neckArrowTimer: null, // 颈枕箭头定时器
				headArrowTimer: null, // 头枕箭头定时器
				lastNeckHeight: 0, // 记录最后一次颈枕高度
				lastHeadHeight: 0, // 记录最后一次头枕高度
				isInitialized: false, // 标记是否已初始化
				isSpineAdjusting: false, // 是否正在进行脊柱调整
				// 枕头加热
				heatSwitchOn: false,
				/** -1 表示未选档位，不默认「低」 */
				heatLevelIndex: -1,
				heatLevels: ['低', '中', '高'],
				/** 加热时间预设：15/30/60 分钟或自定义（最长 8 小时） */
				heatDurationOptions: [
					{ id: '15', label: '15分钟', seconds: 15 * 60 },
					{ id: '30', label: '30分钟', seconds: 30 * 60 },
					{ id: '60', label: '1小时', seconds: 60 * 60 },
					{ id: 'custom', label: '自定义', seconds: null }
				],
				heatDurationPresetId: '30',
				heatCustomDurationMinutes: 45,
				heatCustomDurationMinutesStr: '45',
				/** 首页 0x04 readPillowStatus 轮询定时器 */
				pillow04PollTimer: null,
				/** 首页 0x01 版本读取轮询定时器：拿到有效版本后自动停止 */
				firmware01PollTimer: null,
				/** 最近一次确认的固件版本原始字节（0x01 data[0]） */
				firmwareVersionRawCache: null,
				/** 微信小程序 switch 拒绝切换时需变更 key 才能与 :checked 同步 */
				heatSwitchKey: 0,
				navHeaderStyle: {},
				navRowStyle: {},
				navTitle: '首页',
				/** 蓝牙连接后展示设备名（来自 PillowBleManager） */
				connectedDeviceName: '',
				/** 实时生命体征（WebSocket + GetDeviceInfo 心跳） */
				realtimeHeartRate: null,
				realtimeBreathRate: null,
				deviceSoapMac: '',
				deviceIsLeaveBed: false,
				_realtimeVitalUnsub: null,
				/** 首页 0x0F 联网状态查询轮询 */
				wifiStatusQueryTimer: null,
				wifiStatusReadTimer: null,
				wifiStatusSuccessStreak: 0,
				wifiStatusPollingDone: false,
				/** 首页 0x0B 睡姿采样轮询（仅 develop/trial） */
				posture0bPollTimer: null,
				posture0bPollInFlight: false,
				posture0bMaxValue: null,
			}
		},

		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 0,
					onshow: true
				});
			}

			uni.$on('update_pillow_info', this.updateInfo);
			this.updateInfo()
			// 引导悬浮提示已移除
			
			// 检查是否学习完成，显示弹窗
			this.checkStudyCompleted()
			// 检查手动微调是否完成，显示弹窗
			this.checkManualAdjustCompleted()
			// 检查模式发送完成，提示可手动微调
			this.checkModeSentCompleted()

			let app = getApp();
			this.initNavLayout();

			console.log('menui:', (app.globalData.top + 120) + 'px')

			const mgr = PillowBleManager.getInstance()
			this.loginStatus = mgr.loginSuccess
			this.connectedDeviceName = mgr.loginSuccess ? (mgr.deviceName || '') : ''
			getappVersion({
				appId: base.publicAppId
			}).then(res => {
				// console.log('aba', res)
				app.globalData.versionCode = res.versionCode;
			})
			uni.$on('bluetooth_status_change',this.updateConnectionStatus);
			uni.$on('wifi_provision_success', this.onWifiProvisionSuccess);
			uni.$on('xx', this.onStatusBleNotify);
			uni.$on('pillow_firmware_version', this.onFirmwareVersionEvent);
			this.initFirmwareVersionState();
			this.tryStartDeviceRealtime();
			if (this.loginStatus) {
				this.startHomePillow04Poll();
				this.startHomePosture0bPoll();
				this.startHomeFirmware01Poll();
				this.startWifiStatusQueryPoll();
			}
		},
		onHide() {
			let that = this
			that.deviceIdList = [];
			if (this.searching) {
				uni.stopBluetoothDevicesDiscovery({
					success: function(res) {
						that.searching = false
					}
				})
			}

			// 清理定时器
			if (this.neckArrowTimer) {
				clearTimeout(this.neckArrowTimer);
			}
			if (this.headArrowTimer) {
				clearTimeout(this.headArrowTimer);
			}

			// 重置初始化标志
			this.isInitialized = false;
			this.showNeckArrowFlag = false;
			this.showHeadArrowFlag = false;

			uni.$off('update_pillow_info', this.updateInfo);
			uni.$off('bluetooth_status_change',this.updateConnectionStatus);
			uni.$off('wifi_provision_success', this.onWifiProvisionSuccess);
			uni.$off('xx', this.onStatusBleNotify);
			uni.$off('pillow_firmware_version', this.onFirmwareVersionEvent);
			this.stopHomePillow04Poll();
			this.stopHomePosture0bPoll();
			this.stopHomeFirmware01Poll();
			this.stopDeviceRealtime();
			this.stopWifiStatusQueryPoll();
		},
		onLoad() {
			this.initNavLayout();
			// 设备发现仅由「连接设备」页统一注册，避免与 work 页互相覆盖导致扫描无法停止
		},
		onShareAppMessage() {


		},

		methods: {
			resolveSoapMac() {
				const mac = WifiToolManager.resolveWifiDeviceMac();
				if (mac) {
					return mac;
				}
				const name = String(this.connectedDeviceName || '').trim();
				const macLike = /^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/;
				return macLike.test(name) ? name : '';
			},
			onDeviceRealtimeUpdate(payload) {
				const p = payload || {};
				this.deviceIsLeaveBed = !!p.isLeaveBed;
				if (p.isLeaveBed) {
					this.$set(this, 'realtimeHeartRate', null);
					this.$set(this, 'realtimeBreathRate', null);
					return;
				}
				this.$set(this, 'realtimeHeartRate', p.heartRate != null ? p.heartRate : null);
				this.$set(this, 'realtimeBreathRate', p.breathRate != null ? p.breathRate : null);
			},
			tryStartDeviceRealtime() {
				const mac = this.resolveSoapMac();
				this.deviceSoapMac = mac;
				if (!mac) {
					console.log('[status] 无 wifi_device_mac，不启动 WebSocket/SOAP 实时');
					this.stopDeviceRealtime(false);
					return;
				}
				if (!WifiToolManager.isWifiProvisionSuccess()) {
					console.log('[status] 尚未完成 Wi-Fi 配网，不启动 WebSocket 实时', { mac });
					this.stopDeviceRealtime(false);
					return;
				}
				console.log('[status] 启动实时数据（仅 WebSocket + 心跳）', { mac });
				if (!this._realtimeVitalUnsub) {
					this._realtimeVitalUnsub = deviceRealtimeManager.onUpdate(this.onDeviceRealtimeUpdate);
				}
				deviceRealtimeManager.connect(mac);
			},
			onWifiProvisionSuccess() {
				this.tryStartDeviceRealtime();
			},
			stopDeviceRealtime(clearMac = true) {
				if (this._realtimeVitalUnsub) {
					deviceRealtimeManager.offUpdate(this._realtimeVitalUnsub);
					this._realtimeVitalUnsub = null;
				}
				deviceRealtimeManager.disconnect();
				if (clearMac) {
					this.deviceSoapMac = '';
				}
				this.deviceIsLeaveBed = false;
				this.$set(this, 'realtimeHeartRate', null);
				this.$set(this, 'realtimeBreathRate', null);
			},
			sendWifiStatusQuery0f() {
				if (!this.loginStatus || this.wifiStatusPollingDone) return;
				const mgr = PillowBleManager.getInstance();
				if (!mgr.isConnected()) return;
				const frame9 = buildHeartModuleWifiFrame9({
					configWifi: false,
					queryStatus: true,
					byte3: 0,
					spare567: [0, 0, 0]
				});
				mgr.heartRateModule({ read: false, data: frame9 });
				// 与 bleTest 一致：先 0x0F 写透传，再延时发 0x8F 读取模块返回。
				if (this.wifiStatusReadTimer) {
					clearTimeout(this.wifiStatusReadTimer);
					this.wifiStatusReadTimer = null;
				}
				this.wifiStatusReadTimer = setTimeout(() => {
					this.wifiStatusReadTimer = null;
					if (!this.loginStatus || this.wifiStatusPollingDone) return;
					const m = PillowBleManager.getInstance();
					if (!m.isConnected()) return;
					m.heartRateModule({ read: true });
				}, HOME_WIFI_STATUS_READ_DELAY_MS);
			},
			startWifiStatusQueryPoll() {
				this.stopWifiStatusQueryPoll();
				if (!this.loginStatus || this.wifiStatusPollingDone) return;
				this.sendWifiStatusQuery0f();
				this.wifiStatusQueryTimer = setInterval(() => {
					this.sendWifiStatusQuery0f();
				}, HOME_WIFI_STATUS_QUERY_POLL_MS);
			},
			stopWifiStatusQueryPoll() {
				if (this.wifiStatusQueryTimer) {
					clearInterval(this.wifiStatusQueryTimer);
					this.wifiStatusQueryTimer = null;
				}
				if (this.wifiStatusReadTimer) {
					clearTimeout(this.wifiStatusReadTimer);
					this.wifiStatusReadTimer = null;
				}
			},
			/**
			 * 0x0F 心率/WiFi 模块回传里，按固定成功标志判定“联网成功”。
			 * 兼容二进制 5B5B 与 ASCII 文本（如 "5b 5b 0 0 a 0 0 0 a"）两种格式。
			 */
			isWifiConnectedByHeartPayloadHex(hex) {
				const parsed = parseHeartWifiStatusFromPayloadHex(hex);
				return !!(parsed && parsed.ok && parsed.connected);
			},
			/** 顶栏与微信胶囊对齐：左侧 Logo，右侧信息，右侧预留胶囊宽度避免重叠 */
			initNavLayout() {
				try {
					const sys = uni.getSystemInfoSync();
					const menu = uni.getMenuButtonBoundingClientRect();
					if (!menu || typeof menu.left !== 'number') {
						return;
					}
					const statusBarHeight = sys.statusBarHeight || 20;
					const bandHeight = (menu.top - statusBarHeight) * 2 + menu.height;
					const gapRight = Math.max(8, sys.windowWidth - menu.left + 8);
					this.navHeaderStyle = {
						paddingTop: statusBarHeight + 'px',
					};
					this.navRowStyle = {
						height: bandHeight + 'px',
						paddingRight: gapRight + 'px',
						paddingLeft: '12px',
						boxSizing: 'border-box',
					};
				} catch (e) {
					const sh = uni.getSystemInfoSync().statusBarHeight || 44;
					this.navHeaderStyle = { paddingTop: sh + 'px' };
					this.navRowStyle = { height: '44px', paddingRight: '96px', paddingLeft: '12px', boxSizing: 'border-box' };
				}
			},
			/** 原悬浮球「手动微调」逻辑，现由底部按钮触发 */
			/** Wi-Fi 配网（分包）：需先连接枕头，配网页内会校验 */
			openDeviceProvision() {
				uni.navigateTo({
					url: PAGE_WIFI_PROVISION
				});
			},
			manualFineTune() {
				const mode = resolveManualAdjustMode()
				if (mode && mode.name) {
					uni.navigateTo({ url: '/page_subject/adjust/adjust' + object2Query(mode) })
					return
				}
				uni.navigateTo({ url: '/page_subject/mode/setMode' })
			},
			/** 低/中/高对应目标温度（0x08），需在 0~40℃；未选档位时返回 null */
			heatTargetTempForLevel() {
				const map = [30, 35, 40];
				const i = this.heatLevelIndex;
				if (i < 0 || i > 2) {
					return null;
				}
				return map[i];
			},
			clampHeatCustomMinutes(m) {
				const n = Math.floor(Number(m))
				if (Number.isNaN(n)) return 1
				return Math.max(1, Math.min(180, n))
			},
			syncHeatCustomDurationFromStr() {
				const m = this.clampHeatCustomMinutes(this.heatCustomDurationMinutesStr)
				this.heatCustomDurationMinutes = m
				this.heatCustomDurationMinutesStr = String(m)
				if (this.heatDurationPresetId === 'custom') {
					this.sendNeckHeatCommandIfReady()
				}
			},
			getHeatDurationSeconds() {
				if (this.heatDurationPresetId === 'custom') {
					return this.clampHeatCustomMinutes(this.heatCustomDurationMinutes) * 60
				}
				const preset = this.heatDurationOptions.find((o) => o.id === this.heatDurationPresetId)
				return preset && preset.seconds ? preset.seconds : 30 * 60
			},
			sendNeckHeatCommandIfReady() {
				if (!this.heatSwitchOn) {
					return false
				}
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					return false
				}
				const temp = this.heatTargetTempForLevel()
				if (temp === null) {
					return false
				}
				if (this.heatDurationPresetId === 'custom') {
					this.syncHeatCustomDurationFromStr()
				}
				ble.heating({
					on: true,
					targetTemperature: temp,
					durationSeconds: this.getHeatDurationSeconds()
				})
				return true
			},
			onNeckHeatSwitchBlocked() {
				if (canBypassBleConnectInCurrentEnv()) {
					return
				}
				uni.showToast({ title: '请先连接设备', icon: 'none' });
			},
			onHeatDurationTap(presetId) {
				if (!this.heatBleUiReady) {
					this.onNeckHeatSwitchBlocked()
					return
				}
				this.heatDurationPresetId = presetId
				if (presetId === 'custom') {
					this.syncHeatCustomDurationFromStr()
				}
				this.sendNeckHeatCommandIfReady()
			},
			onHeatSwitchChange(e) {
				const on = !!(e.detail && e.detail.value);
				const ble = PillowBleManager.getInstance();
				if (!ble.isConnected() && !canBypassBleConnectInCurrentEnv()) {
					this.onNeckHeatSwitchBlocked();
					this.heatSwitchOn = false;
					this.heatSwitchKey += 1;
					return;
				}
				this.heatSwitchOn = on;
				if (!on) {
					if (ble.isConnected()) {
						ble.heating({
							on: false,
							targetTemperature: 0,
							durationSeconds: 0
						});
					}
					this.heatLevelIndex = -1;
					return;
				}
				if (this.heatDurationPresetId === 'custom') {
					this.syncHeatCustomDurationFromStr()
				}
				const temp = this.heatTargetTempForLevel();
				if (temp === null) {
					// 未选档位：仅展开 UI，不下发加热，等用户点击低/中/高
					return;
				}
				ble.heating({
					on: true,
					targetTemperature: temp,
					durationSeconds: this.getHeatDurationSeconds()
				});
			},
			onHeatLevelTap(idx) {
				this.heatLevelIndex = idx;
				if (!this.heatSwitchOn) {
					return;
				}
				this.sendNeckHeatCommandIfReady()
			},
			/** 0x04 设备状态 bit3：与遥控器同步——设备在加热则打开开关并选高档；设备未加热则关开关 */
			syncNeckHeatUiFromPillow04(p) {
				if (!p || !p.ok) {
					return;
				}
				const heatingOn =
					p.heatingOn === true ||
					((((p.deviceStatus != null ? p.deviceStatus : p.valveBits) ?? 0) >> 3) & 1) === 1;
				const HIGH_LEVEL_INDEX = 2;
				if (heatingOn) {
					if (!this.heatSwitchOn) {
						this.$set(this, 'heatSwitchOn', true);
						this.$set(this, 'heatLevelIndex', HIGH_LEVEL_INDEX);
						this.heatSwitchKey += 1;
					} else if (this.heatLevelIndex < 0) {
						this.$set(this, 'heatLevelIndex', HIGH_LEVEL_INDEX);
					}
				} else if (this.heatSwitchOn) {
					this.$set(this, 'heatSwitchOn', false);
					this.$set(this, 'heatLevelIndex', -1);
					this.heatSwitchKey += 1;
				}
			},
			/** notify 里对「先下发 readPillowStatus」的 0x04 读应答，更新加热片温度 */
			onStatusBleNotify(res) {
				try {
					const buf = res && res.value;
					if (!buf) {
						return;
					}
					const mgr = PillowBleManager.getInstance();
					const parsed = mgr.handleNotifyBuffer(buf);
					if (parsed && parsed.type === 'heart_rate_module') {
						const dataHex = (parsed.parsed && parsed.parsed.dataHex) || '';
						if (this.isWifiConnectedByHeartPayloadHex(dataHex)) {
							this.wifiStatusSuccessStreak += 1;
							if (this.wifiStatusSuccessStreak >= HOME_WIFI_STATUS_SUCCESS_STREAK_TARGET) {
								this.wifiStatusPollingDone = true;
								this.stopWifiStatusQueryPoll();
								console.log(
									`[status] 0x0F 联网状态连续成功 ${this.wifiStatusSuccessStreak} 次，停止轮询`
								);
							}
						} else {
							// 未命中成功标志时重置连胜计数，确保“连续 3 次”语义。
							this.wifiStatusSuccessStreak = 0;
						}
					}
					if (!parsed || parsed.type !== 'pillow_status') {
						return;
					}
					const p = parsed.parsed;
					if (p && p.ok) {
						this.syncNeckHeatUiFromPillow04(p);
						this.updateInfo();
					}
				} catch (err) {
					console.warn('[status] onStatusBleNotify', err);
				}
			},
			/** 已连接且在本页展示时：每 5s 读一次 0x04（与是否加热无关） */
			startHomePillow04Poll() {
				this.stopHomePillow04Poll();
				if (!this.loginStatus || !PillowBleManager.getInstance().isConnected()) {
					return;
				}
				const tick = () => {
					const mgr = PillowBleManager.getInstance();
					if (!this.loginStatus || !mgr.isConnected()) {
						return;
					}
					mgr.readPillowStatus({ silent: true });
				};
				tick();
				this.pillow04PollTimer = setInterval(tick, HOME_PILLOW_STATUS_POLL_MS);
			},
			stopHomePillow04Poll() {
				if (this.pillow04PollTimer) {
					clearInterval(this.pillow04PollTimer);
					this.pillow04PollTimer = null;
				}
			},
			async fetchHomePosture0bOnce() {
				if (!canBypassNonReleaseEnv()) return;
				if (!this.loginStatus) return;
				const mgr = PillowBleManager.getInstance();
				if (!mgr.isConnected()) return;
				if (mgr.isPosture0bExternalPollBlocked && mgr.isPosture0bExternalPollBlocked()) return;
				if (this.posture0bPollInFlight) return;
				this.posture0bPollInFlight = true;
				try {
					const snap = await mgr.readPostureSnapshot0x0B({ silent: true, timeoutMs: 8000, retries: 2 });
					const maxVal = maxPostureDataFromSnap(snap);
					this.$set(this, 'posture0bMaxValue', maxVal);
				} catch (err) {
					if (err && err.message === 'posture_poll_blocked') {
						return;
					}
					console.warn('[status] fetchHomePosture0bOnce failed:', err);
				} finally {
					this.posture0bPollInFlight = false;
				}
			},
			/** 已连接且非正式环境：每 1s 读一次 0x0B */
			startHomePosture0bPoll() {
				this.stopHomePosture0bPoll();
				if (!canBypassNonReleaseEnv()) return;
				if (!this.loginStatus || !PillowBleManager.getInstance().isConnected()) {
					return;
				}
				this.fetchHomePosture0bOnce();
				this.posture0bPollTimer = setInterval(() => {
					this.fetchHomePosture0bOnce();
				}, HOME_POSTURE_0B_POLL_MS);
			},
			stopHomePosture0bPoll() {
				if (this.posture0bPollTimer) {
					clearInterval(this.posture0bPollTimer);
					this.posture0bPollTimer = null;
				}
				this.posture0bPollInFlight = false;
			},
			initFirmwareVersionState() {
				const c = readFirmwareVersionCache();
				const raw = c && c.versionRaw;
				this.firmwareVersionRawCache = Number.isFinite(Number(raw)) ? Number(raw) : null;
			},
			isValidFirmwareVersionRaw(raw) {
				const n = Number(raw);
				return Number.isFinite(n) && n > 0 && n <= 255;
			},
			requestHomeFirmware01Once() {
				const mgr = PillowBleManager.getInstance();
				if (!this.loginStatus || !mgr.isConnected()) return;
				mgr.requestFirmwareReadIfNeededToday();
			},
			startHomeFirmware01Poll() {
				this.stopHomeFirmware01Poll();
				const mgr = PillowBleManager.getInstance();
				if (!this.loginStatus || !mgr.isConnected()) return;
				this.requestHomeFirmware01Once();
				this.firmware01PollTimer = setInterval(() => {
					this.requestHomeFirmware01Once();
				}, HOME_FIRMWARE_01_POLL_MS);
			},
			stopHomeFirmware01Poll() {
				if (this.firmware01PollTimer) {
					clearInterval(this.firmware01PollTimer);
					this.firmware01PollTimer = null;
				}
			},
			/** 收到 0x01 解析结果后：拿到有效版本即停止轮询；仅在版本变化时更新本地缓存标记 */
			onFirmwareVersionEvent(payload) {
				const raw = payload && payload.versionRaw;
				if (!this.isValidFirmwareVersionRaw(raw)) return;
				const next = Number(raw);
				if (this.firmwareVersionRawCache !== next) {
					this.firmwareVersionRawCache = next;
				}
				this.stopHomeFirmware01Poll();
			},
			// 检查学习是否完成，显示弹窗
			checkStudyCompleted() {
				const studyCompleted = uni.getStorageSync('study_completed')
				if (studyCompleted) {
					// 清除标记，避免重复显示
					uni.removeStorageSync('study_completed')
					// 延迟显示弹窗，确保页面完全加载
					setTimeout(() => {
						uni.showModal({
							title: '学习完成',
							content: '恭喜您完成睡姿学习！现在请开始享受吧。',
							showCancel: false,
							confirmText: '我知道了'
						})
					}, 300)
				}
			},
			// 检查手动微调是否完成，显示弹窗
			checkManualAdjustCompleted() {
				const manualAdjustCompleted = uni.getStorageSync('manual_adjust_completed')
				if (manualAdjustCompleted) {
					// 清除标记，避免重复显示
					uni.removeStorageSync('manual_adjust_completed')
					// 延迟显示弹窗，确保页面完全加载
					setTimeout(() => {
						uni.showModal({
							title: '调整完成',
							content: '您已完成手动微调流程！是否进行睡姿学习？',
							showCancel: true,
							cancelText: '稍后学习',
							confirmText: '开始学习',
							success: (res) => {
								if (res.confirm) {
									// 跳转到睡姿学习页面
									uni.navigateTo({
										url: '/page_subject/study/study'
									})
								}
							}
						})
					}, 300)
				}
			},
			checkModeSentCompleted(){
				const sent = uni.getStorageSync('mode_sent_success');
				if(sent){
					uni.removeStorageSync('mode_sent_success');
					setTimeout(()=>{
						uni.showModal({
							title:'默认数据设置成功提示',
							content:'模式已设置成功，若您觉得高度不够可点击首页下方「手动微调」按钮进行调整。',
							showCancel:false,
							confirmText:'我知道了'
						})
					},300)
				}
			},
			// 检查颈枕是否还在调整
			checkNeckAdjustment() {
				if (this.pillowSideHeight === this.lastNeckHeight) {
					// 如果高度没有变化，说明停止调整了
					this.showNeckArrowFlag = false;
				} else {
					// 如果高度还在变化，继续显示箭头
					this.lastNeckHeight = this.pillowSideHeight;
					// 重新设置定时器
					this.neckArrowTimer = setTimeout(() => {
						this.checkNeckAdjustment();
					}, 2000);
				}
			},
			// 检查头枕是否还在调整
			checkHeadAdjustment() {
				if (this.pillowHeight === this.lastHeadHeight) {
					// 如果高度没有变化，说明停止调整了
					this.showHeadArrowFlag = false;
				} else {
					// 如果高度还在变化，继续显示箭头
					this.lastHeadHeight = this.pillowHeight;
					// 重新设置定时器
					this.headArrowTimer = setTimeout(() => {
						this.checkHeadAdjustment();
					}, 2000);
				}
			},
			updateConnectionStatus(){
				const mgr = PillowBleManager.getInstance()
				console.log('收到 bluetooth_status_change 事件，当前 loginSuccess:', mgr.loginSuccess)
				this.$set(this, 'loginStatus', mgr.loginSuccess);
				this.$set(this, 'connectedDeviceName', mgr.deviceName || '')
				console.log('蓝牙连接状态更新:',this.loginStatus)
				console.log('页面 login 计算属性值:', this.login)
				if (!this.loginStatus) {
					this.stopHomePillow04Poll();
					this.stopHomePosture0bPoll();
					this.stopHomeFirmware01Poll();
					// 实时心率走 WebSocket，不依赖蓝牙；断开枕头时仅停轮询，保留 MAC 与卡片
					this.stopWifiStatusQueryPoll();
					this.wifiStatusSuccessStreak = 0;
					this.wifiStatusPollingDone = false;
					this.$set(this, 'connectedDeviceName', '')
					this.$set(this, 'posture0bMaxValue', null);
					this.$set(this, 'pillowHeight', null);
					this.$set(this, 'pillowSideHeight', null);
					this.$set(this, 'heatSwitchOn', false);
					this.heatLevelIndex = -1;
					this.heatSwitchKey += 1;
				} else {
					this.initFirmwareVersionState();
					this.updateInfo();
					this.startHomePillow04Poll();
					this.startHomePosture0bPoll();
					this.startHomeFirmware01Poll();
					this.tryStartDeviceRealtime();
					this.startWifiStatusQueryPoll();
				}
			},
		updateInfo(){
			const mgr = PillowBleManager.getInstance()
			this.$set(this, 'pillowHeight', mgr.pillowHeight);
			this.$set(this, 'pillowSideHeight', mgr.pillowSideHeight);
			this.$set(this, 'pillowPower', mgr.pillowPower);
			this.$set(this, 'pillowPowerCharging', mgr.chargingStatus);
			this.$set(this, 'pillowStatus', mgr.pillowStatus);
			if (mgr.loginSuccess) {
				this.$set(this, 'connectedDeviceName', mgr.deviceName || '')
			}
			
			// 更新脊柱调整状态
			this.$set(this, 'isSpineAdjusting', mgr.isSpineAdjusting);

			// 设置初始化标志
			if (!this.isInitialized) {
				this.isInitialized = true;
				// 初始化时记录当前高度
				this.lastNeckHeight = mgr.pillowSideHeight;
				this.lastHeadHeight = mgr.pillowHeight;
				// 初始化时设置prev值，避免初始触发watch
				this.prevPillowSideHeight = mgr.pillowSideHeight;
				this.prevPillowHeight = mgr.pillowHeight;
			}

			console.log('menui11111:', this.pillowHeight)
			console.log('menui1111122:', this.pillowSideHeight)
			console.log('menui1111122333:', this.pillowPower)
			console.log('--bateryWidth:', (mgr.pillowPower * 50 / 1000) + 'rpx')
		},
			aiHandler() {
				uni.navigateTo({
					url: "/page_subject/measure/measure"
				})
			},

			closePopUpHandle() {
				this.$refs.ppp.close()
			},
			// 默认数据
			showDefaultHandler() {
				this.closePopUpHandle()
				uni.navigateTo({
					url: "/page_subject/mode/mode"
				})
			},
			// my数据
			showMineHandler() {
				this.closePopUpHandle()
				uni.navigateTo({
					url: "/page_subject/mode/setMode"
				})
			},
			adjustHandler(item) {
				this.connectHandler()
			},
			spineCheck() {
				// uni.showToast({
				// 	title: "暂未开放!"
				// })

				// return;
				uni.navigateTo({
					// url: "/page_subject/ano/ano",
					url: "/page_subject/anoMoving/anoMoving"
				})
			},

			statusCheck() {
				uni.navigateTo({
					url: "/page_subject/study/study"
				})
				return;
				uni.navigateTo({
					url: "/page_subject/ano/ano"
				})
			},
			hotHandler() {
				this.$refs.ppp.open('bottom')
			},
			change(e) {

			},
			// 开始拍照
			startCamera() {
				uni.navigateTo({
					url: '/pages/camera/camera'
				})
			},
			base64({
				url
			}) {
				return new Promise((resolve, reject) => {
					console.log('url:', url)
					wx.getFileSystemManager().readFile({
						filePath: url, //选择图片返回的相对路径
						encoding: 'base64', //编码格式
						success: res => {
							resolve(res.data)
							// resolve('data:image/' + type.toLocaleLowerCase() + ';base64,' + res.data)
						},
						fail: res => reject(res.errMsg)
					})
				})
			},
			urlTobase64(url) {
				console.log('urlTobase641')
				return new Promise(function(resolve, reject) {
					console.log('urlTobase6421111')
					uni.request({
						url: url,
						responseType: 'arraybuffer', //最关键的参数，设置返回的数据格式为arraybuffer
						// responseType: 'text', //最关键的参数，设置返回的数据格式为arraybuffer
						success: (res) => {
							console.log('urlTobase642')
							//把arraybuffer转成base64
							let base64 = wx.arrayBufferToBase64(res.data);
							// let base65 = String.fromCharCode.apply(null, new Uint16Array(res.data));
							// ArrayBuffer转为字符串，参数为ArrayBuffer对象
							//不加上这串字符，在页面无法显示的哦
							let base64_new = 'data:image/jpeg;base64,' + base64;
							//打印出base64字符串，可复制到网页校验一下是否是你选择的原图片呢
							console.log(base64);
							resolve(base64)
						},
						fail: (error) => {
							console.log('err:', error)
						}
					})
				})
			},
			// ArrayBuffer转16进度字符串示例
			ab2hex(buffer) {
				const hexArr = Array.prototype.map.call(
					new Uint8Array(buffer),
					function(bit) {
						return ('00' + bit.toString(16)).slice(-2)
					}
				)
				return hexArr.join('')
			},
			// 停止蓝牙
			stopBlueTooth() {
				uni.stopBluetoothDevicesDiscovery({
					success: (res) => {
						console.log("stopBlueTooth success!")
						this.searching = false
					},
					fail: (res) => {
						console.log("stopBlueTooth fail!")
					}
				})
				// uni.closeBluetoothAdapter({
				// 	success() {
				// 		console.log('closeBluetoothAdapter success!')
				// 	}
				// })
			},
			// 主动点击连接枕头
			connectSleepHandler(item) {
				uni.showLoading({
					title: '连接蓝牙设备中...',
				})
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
						this.stopBlueTooth()

						console.log('connectBluetooth success!:', deviceId, res)
						uni.getBLEDeviceServices({
							deviceId,
							success: (res) => {
								console.log('getBLEDeviceServices success:', res)
								const services = (res && res.services) || []
								const selected = pickPillowBleService(services)
								if (!selected) {
									console.warn('未找到蓝牙服务')
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
			// 获取蓝牙设备某个服务中所有特征值(characteristic)。
			getBLEDeviceCharacteristics(deviceId, serviceId) {
				let that = this
				console.log('getBLEDeviceCharacteristics:', deviceId, serviceId)
				uni.getBLEDeviceCharacteristics({
					deviceId: deviceId,
					serviceId: serviceId,
					success: (cres) => {
						console.log("%c getBLEDeviceCharacteristics success", "color:red;", cres
							.characteristics);
						const chars = cres.characteristics || []
						const { notifyUUID, writeUUID } = pickPillowBleCharacteristics(chars)
						const inst = PillowBleManager.getInstance()
						if (!notifyUUID) {
							console.warn('未找到 notify 特征')
							return
						}
						inst.startNotice({
							deviceUUID: deviceId,
							serviceUUID: serviceId,
							notifyUUID,
							writeUUID: writeUUID || inst.characteristicId
						})
						that.deviceId = deviceId
						that.serviceId = serviceId
					},
					fail: (res) => {
						console.log("%c getBLEDeviceCharacteristics fail", "color:red;", res);
					}
				})
			},
			// 开始监听
			notifyBluetooth(deviceId, serviceId, characteristicId) {
				// 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。注意：必须设备的特征值支持 notify 或者 indicate 才可以成功调用。 另外，必须先启用 notifyBLECharacteristicValueChange 才能监听到设备 characteristicValueChange 事件
				console.log("%c notifyBluetooth start", "color:red;", deviceId, serviceId);
				uni.notifyBLECharacteristicValueChange({
					deviceId: deviceId,
					state: true,
					serviceId: serviceId,
					characteristicId: characteristicId,
					success: (res) => {
						var msg = '启动notify:' + res.errMsg
						this.receiveInfo = msg;
						console.log('notifyBLECharacteristicValueChange success', res)
					},
					fail: (res) => {
						console.log('notifyBLECharacteristicValueChange fail', res)
					}
				})


			},
			write2tooth(deviceId, serviceId, characteristicId, buffer) {
				// 向蓝牙设备发送一个0x00的16进制数据
				uni.writeBLECharacteristicValue({
					// 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
					deviceId,
					// 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
					serviceId,
					// 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
					characteristicId,
					// 这里的value是ArrayBuffer类型
					value: buffer,
					writeType: 'writeNoResponse',
					success(res) {
						console.log('writeBLECharacteristicValue success', res)
					}
				})
			},
			// 生成第一步握手数据
			hand1Shake(checkNum, arrayUnit8Buffer_) {
				// 向蓝牙设备发送一个0x00的2进制数据

				let littleEdition = true
				const buffer = new ArrayBuffer(8)
				const dataView = new DataView(buffer)
				dataView.setUint8(0, 0)
				dataView.setUint8(1, checkNum)
				dataView.setUint8(2, arrayUnit8Buffer_[0])
				dataView.setUint8(3, arrayUnit8Buffer_[1])
				dataView.setUint8(4, arrayUnit8Buffer_[2])
				dataView.setUint8(5, arrayUnit8Buffer_[3])
				dataView.setUint8(6, 0)
				dataView.setUint8(7, 0)

				// dataView.setUint8(7, 0)
				// dataView.setUint8(6, checkNum)
				// dataView.setUint8(5, arrayUnit8Buffer_[3])
				// dataView.setUint8(4, arrayUnit8Buffer_[2])
				// dataView.setUint8(3, arrayUnit8Buffer_[1])
				// dataView.setUint8(2, arrayUnit8Buffer_[0])
				// dataView.setUint8(1, 0)
				// dataView.setUint8(0, 0)
				return buffer
			},
			connectHandler() {
				uni.navigateTo({
					url: '/page_subject/work/work'
				})
				return
				let that = this;
				// 监听设备变化
				uni.onBLEConnectionStateChange((res) => {
					// 该方法回调中可以用于处理连接意外断开等异常情况
					uni.showToast({
						title: ` ${res.deviceId} state has changed`
					})
					console.log(
						`onBLEConnectionStateChange device ${res.deviceId} state has changed, connected: ${res.connected}`
					)
				})
				// 如果正在搜索中
				if (this.searching) {
					uni.closeBluetoothAdapter({
						complete: () => {

						}
					})
				}

				// uni.closeBLEConnection({
				// 	deviceId: this.deviceId
				// })
				uni.openBluetoothAdapter({
					success: (res) => {
						console.log('startBluetoothDevicesDiscovery')
						// 开始搜索蓝牙设备
						uni.startBluetoothDevicesDiscovery({
							services: [],
							success(res) {
								console.log('startBluetoothDevicesDiscovery success:', res)
								this.searching = true
							}
						})

						uni.getBluetoothAdapterState({
							success: (res) => {
								console.log('getBluetoothAdapterState success!', res)
							}
						})
						// //  50s扫描结束
						// setTimeout(function() {
						// 	that.stopBlueTooth()
						// }, 500000);

					},
					fail(res) {
						// if (res.errCode == 10001) {
						// 	uni.showToast({
						// 		duration: 3000,
						// 		title: '请打开蓝牙'
						// 	})
						// }

						uni.showModal({
							title: '提示',
							content: '请检查手机蓝牙是否打开',
							showCancel: false,
							success: (res) => {
								this.searching = false
							}
						})
					}
				})

				uni.onBluetoothAdapterStateChange(function(res) {
					console.log('adapterState changed, now is', res)
				})
				return;
				uni.navigateTo({
					url: '/page_subject/work/work'
				})
			},
			onBluetoothDeviceFound() {

			},
			async detecting(tempFilePaths) {
				let base64 = await this.base64({
					url: tempFilePaths[0]
				});
				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhBaiduAip',
					filePath: tempFilePaths[0],
					name: 'file',
					formData: {
						'fileName': base64,
						'user': 'test',
					},
					success: (uploadFileRes) => {
						let obj = JSON.parse(uploadFileRes.data)
						console.log('success', obj)
						let person = obj.person_info[0]
						let body_parts = person.body_parts
						let left_shoulder = body_parts.left_shoulder
						let right_shoulder = body_parts.right_shoulder
						let leftShoulder = left_shoulder.x;
						let rightShoulder = right_shoulder.x;

						let space = Math.abs(rightShoulder - leftShoulder);
						space = space / this.bodyImgOriginWidth
						space = space.toFixed(2)
						uni.showToast({
							title: '肩宽约:' + space + 'm',
							icon: 'none', //如果要纯文本，不要icon，将值设为'none'
							duration: 5000 //持续时间为 2秒
						})

					},
					fail: () => {
						console.log('fail')
					}
				})
			},
			chooseMedia() {
				if (!this.session) {
					this.session = wx.createVKSession({
						track: {
							body: {
								mode: 1
							} // mode: 1 - 使用摄像头；2 - 手动传入图像
						},
						version: 'v2',
					})


					// 静态图片检测模式下，每调一次 detectBody 接口就会触发一次 updateAnchors 事件
					this.session.on('updateAnchors', anchors => {
						// console.log('anchors:', anchors)
						anchors.forEach(anchor => {

							console.log('anchor.points', anchor.points)

							console.log('anchor.origin', anchor.origin)

							console.log('anchor.size', anchor.size)

							console.log('anchor.angle', anchor.angle)

						})
						// this.anchor2DList = anchors.map(anchor => {
						// 	points: anchor.points, // 关键点坐标
						// 	origin: anchor.origin, // 识别框起始点坐标
						// 	size: anchor.size // 识别框的大小
						// })
					})
				}

				// this.session.start(errno => {
				// 	if (errno) {
				// 		console.log('errno', errno)
				// 		// 如果失败，将返回 errno
				// 	} else {
				// 		// this.session.detectBody({
				// 		// 	frameBuffer: this.imgData.data.buffer,
				// 		// 	width: this.bodyImgOriginWidth,
				// 		// 	height: this.bodyImgOriginHeight,
				// 		// 	scoreThreshold: 0.1, // 评分阈值
				// 		// 	sourceType: 1
				// 		// })
				// 	}
				// })
				// return
				wx.chooseMedia({
					count: 1,
					mediaType: ['image'],
					success: res => {
						console.log('chooseMedia res', res)
						const imgUrl = res.tempFiles[0].tempFilePath
						wx.getImageInfo({
							src: imgUrl,
							success: res => {
								const fixWidth = 300
								const {
									width,
									height
								} = res
								console.log('getImageInfo res', res)
								this.bodyImgUrl = imgUrl;
								console.log('bodyImgUrl', this.bodyImgUrl)
								this.bodyImgWidth = fixWidth;
								this.bodyImgHeight = (fixWidth / width) * height;
								this.bodyImgOriginWidth = width;
								this.bodyImgOriginHeight = height;
							},
							fail: res => {
								console.error(res)
							}
						})

					},
					fail: res => {
						console.error(res)
					}
				})
			},
			async detectbody() {
				if (this.bodyImgUrl) {
					const canvas = wx.createOffscreenCanvas({
						type: '2d',
						width: this.bodyImgOriginWidth,
						height: this.bodyImgOriginHeight,
					})
					const context = canvas.getContext('2d')
					const img = canvas.createImage()
					await new Promise(resolve => {
						img.onload = resolve
						img.src = this.bodyImgUrl
					})

					context.clearRect(0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight)
					context.drawImage(img, 0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight)

					this.imgData = context.getImageData(0, 0, this.bodyImgOriginWidth, this
						.bodyImgOriginHeight)

					console.log('[frameBuffer] --> ', this.imgData.data.buffer)
					console.log('this.session.detectBody', this.session.detectBody)
					console.log('width', this.bodyImgOriginWidth)
					console.log('height', this.bodyImgOriginHeight)


					this.session.start(errno => {
						if (errno) {
							console.log('errno', errno)
							// 如果失败，将返回 errno
						} else {
							this.session.detectBody({
								frameBuffer: this.imgData.data.buffer,
								width: this.bodyImgOriginWidth,
								height: this.bodyImgOriginHeight,
								scoreThreshold: 0.1, // 评分阈值
								sourceType: 1
							})
						}
					})
				}
			},
		}
	}
</script>

<style lang="scss">
	.main {
		width: 100%;
		height: 100vh;
		box-sizing: border-box;
		background-color: #F0F6F7;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.status-nav {
		flex-shrink: 0;
		width: 100%;
		background: #F0F6F7;
		border-bottom: 1rpx solid rgba(175, 160, 201, 0.45);
		box-sizing: border-box;
		z-index: 200;
	}

	.status-nav-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
	}

	.nav-side {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
	}

	.nav-side-left {
		flex-shrink: 0;
	}

	.nav-side-right {
		justify-content: flex-end;
		max-width: 42%;
	}

	.nav-title-wrap {
		flex-shrink: 0;
		max-width: 36%;
		text-align: center;
		pointer-events: none;
	}

	.nav-title-wrap .nav-title {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-title {
		font-size: 34rpx;
		color: #051C2C;
		font-weight: 600;
	}

	.nav-pillow-status {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		max-width: 100%;
		padding-left: 8rpx;
		box-sizing: border-box;
		flex-shrink: 1;
	}

	.nav-pillow-status--on .pillow-status-sub {
		color: #1C6A51;
		font-weight: 600;
	}

	.pillow-status-sub {
		font-size: 24rpx;
		color: rgba(5, 28, 44, 0.7);
		line-height: 1.2;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.btn-ble-connected {
		background: linear-gradient(180deg, #1C6A51 0%, #005578 100%) !important;
		color: #fff !important;
		border: none !important;
		box-shadow: 0 8rpx 24rpx rgba(5, 28, 44, 0.22);
	}

	.status-scroll {
		flex: 1;
		height: 0;
		min-height: 0;
		box-sizing: border-box;
	}

	.banner-card {
		position: relative;
		margin: 24rpx 28rpx 0;
		border-radius: 24rpx;
		overflow: hidden;
		border: 4rpx solid #4C8CB6;
		min-height: 280rpx;
		background: #F0F6F7;

		.banner-img {
			width: 100%;
			height: 320rpx;
			display: block;
		}

		.banner-mask {
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 120rpx;
			background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.35));
		}
	}



	.logo {
		width: 256rpx;
		height: 101rpx;
		margin: 0 auto;
		margin-top: -450rpx;
	}

	.logo image {
		width: 100%;
		height: 100%;
	}

	.logoTip {
		width: 450rpx;
		height: 45rpx;
		margin: 0 auto;
		margin-top: -200rpx;
	}

	.logoTip image {
		width: 100%;
		height: 100%;
	}

	.card {
		margin: 24rpx 28rpx 0;
		border-radius: 24rpx;
		padding: 28rpx 32rpx;
		box-sizing: border-box;
	}

	.card-height {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		background: linear-gradient(180deg, rgba(28, 106, 81, 0.12) 0%, rgba(76, 140, 182, 0.18) 55%, #F0F6F7 100%);
		box-shadow: 0 4rpx 20rpx rgba(5, 28, 44, 0.08);
		padding: 28rpx 24rpx;
	}

	.card-posture-0b {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(180deg, rgba(28, 106, 81, 0.08) 0%, rgba(76, 140, 182, 0.12) 100%);
		box-shadow: 0 4rpx 20rpx rgba(5, 28, 44, 0.06);
		padding: 24rpx 32rpx;
	}

	.posture-0b-label {
		font-size: 26rpx;
		color: #051C2C;
		font-weight: 500;
	}

	.posture-0b-value {
		font-size: 40rpx;
		font-weight: 600;
		color: #1C6A51;
		font-variant-numeric: tabular-nums;
	}

	.height-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		min-width: 0;
	}

	.height-col-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		margin-bottom: 12rpx;
	}

	.height-row-metric {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		justify-content: center;
		flex-wrap: wrap;
	}

	.height-icon {
		width: 44rpx;
		height: 44rpx;
		margin-right: 10rpx;
		flex-shrink: 0;
	}

	.height-label {
		font-size: 26rpx;
		color: #051C2C;
		font-weight: 500;
	}

	.height-value {
		font-size: 44rpx;
		font-weight: 600;
		color: #1C6A51;
		line-height: 1.3;
	}

	.height-unit {
		font-size: 24rpx;
		color: rgba(5, 28, 44, 0.65);
		margin-left: 6rpx;
	}

	.height-v-divider {
		width: 2rpx;
		background: rgba(76, 140, 182, 0.45);
		align-self: stretch;
		margin: 8rpx 0;
		flex-shrink: 0;
	}

	.card-vitals {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		background: linear-gradient(180deg, rgba(76, 140, 182, 0.24) 0%, rgba(175, 160, 201, 0.2) 45%, #F0F6F7 100%);
		box-shadow: 0 4rpx 20rpx rgba(5, 28, 44, 0.08);
		padding: 32rpx 24rpx;
	}

	.vital-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		min-width: 0;
	}

	.vital-col-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
	}

	.vital-row-metric {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		justify-content: center;
		flex-wrap: wrap;
	}

	.vital-icon {
		width: 48rpx;
		height: 48rpx;
		margin-right: 12rpx;
		flex-shrink: 0;
	}

	.vital-label {
		font-size: 28rpx;
		color: #051C2C;
		font-weight: 500;
	}

	.vital-value {
		font-size: 48rpx;
		font-weight: 600;
		color: #051C2C;
		line-height: 1.3;
	}

	.vital-unit {
		font-size: 24rpx;
		color: rgba(5, 28, 44, 0.7);
		margin-left: 8rpx;
	}

	.vital-v-divider {
		width: 2rpx;
		background: rgba(175, 160, 201, 0.5);
		align-self: stretch;
		margin: 8rpx 0;
		flex-shrink: 0;
	}

	.card-heat {
		background: #ffffff;
		box-shadow: 0 4rpx 16rpx rgba(5, 28, 44, 0.08);
	}

	.heat-row {
		margin-bottom: 20rpx;
	}

	.heat-row-between {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.heat-row-last {
		margin-bottom: 0;
	}

	.heat-expand {
		margin-top: 8rpx;
	}

	.heat-expand .heat-row-duration {
		margin-bottom: 20rpx;
	}

	.heat-title-wrap {
		display: flex;
		align-items: center;
	}

	.heat-title-icon {
		width: 44rpx;
		height: 44rpx;
		margin-right: 12rpx;
	}

	.heat-title {
		font-size: 30rpx;
		color: #051C2C;
		font-weight: 500;
	}

	.heat-switch-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.heat-switch-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
	}

	.heat-switch {
		transform: scale(0.92);
	}

	.heat-sub-label {
		font-size: 26rpx;
		color: rgba(5, 28, 44, 0.7);
		display: block;
		margin-bottom: 16rpx;
	}

	.heat-levels {
		display: flex;
		gap: 20rpx;
	}

	.heat-level-btn {
		flex: 1;
		text-align: center;
		padding: 18rpx 0;
		border-radius: 12rpx;
		border: 2rpx solid #4C8CB6;
		color: #083969;
		font-size: 28rpx;
		background: #fff;
	}

	.heat-level-btn.active {
		background: rgba(76, 140, 182, 0.16);
		font-weight: 600;
	}

	.heat-row-duration {
		margin-bottom: 0;
	}

	.heat-duration-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.heat-duration-btn {
		flex: 1 1 calc(50% - 16rpx);
		min-width: calc(50% - 16rpx);
		padding: 16rpx 0;
	}

	.heat-custom-duration {
		display: flex;
		align-items: center;
		margin-top: 16rpx;
		gap: 12rpx;
	}

	.heat-custom-input {
		flex: 1;
		height: 72rpx;
		padding: 0 20rpx;
		border: 2rpx solid #4C8CB6;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #051C2C;
		background: #fff;
	}

	.heat-custom-unit {
		font-size: 24rpx;
		color: rgba(5, 28, 44, 0.65);
		white-space: nowrap;
	}

	.card-grid {
		background: linear-gradient(180deg, rgba(76, 140, 182, 0.22) 0%, rgba(175, 160, 201, 0.2) 100%);
		box-shadow: 0 4rpx 20rpx rgba(5, 28, 44, 0.08);
		padding-bottom: 36rpx;
	}

	.grid-row {
		display: flex;
		justify-content: space-around;
	}

	.grid-row-3 {
		margin-bottom: 32rpx;
	}

	.grid-row-bottom {
		margin-bottom: 0;
	}

	.grid-row-2 {
		justify-content: space-between;
		padding: 0 8rpx;
	}

	.grid-row-2 .grid-item {
		flex: 1;
		min-width: 0;
	}

	.grid-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.grid-icon-wrap {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		background: rgba(255, 255, 255, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(5, 28, 44, 0.14);
	}

	.grid-icon {
		width: 64rpx;
		height: 64rpx;
	}

	.grid-text {
		font-size: 26rpx;
		color: #051C2C;
		text-align: center;
	}

	.bottom-btns {
		margin: 32rpx 28rpx 0;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.btn-full {
		width: 100%;
		box-sizing: border-box;
	}

	.btn-primary {
		min-height: 96rpx;
		padding: 20rpx 24rpx;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 600;
		background: linear-gradient(180deg, #083969 0%, #005578 100%);
		color: #fff;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.btn-ble-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-width: 0;
	}

	.btn-ble-line1 {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.btn-ble-device-name {
		margin-top: 8rpx;
		font-size: 24rpx;
		font-weight: 500;
		line-height: 1.3;
		opacity: 0.95;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
	}

	.btn-outline {
		background: #fff;
		color: #083969;
		border: 2rpx solid #083969;
	}

	.btn-icon {
		width: 40rpx;
		height: 40rpx;
		margin-right: 12rpx;
		flex-shrink: 0;
	}

	.scroll-bottom-spacer {
		height: 200rpx;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.connectBtn {
		width: 727rpx;
		height: 188rpx;
		margin: 0 auto;
		margin-top: -0rpx;
	}

	.connectBtn image {
		width: 100%;
		height: 100%;
	}

	.rotateimgblock {
		margin-top: -50rpx;
		width: 750rpx;
		height: 494rpx;
	}

	.rotateimg {
		width: 100%;
		height: 100%;
	}


	.popupcontainer {
		background-color: #F0F6F7;
		border-radius: 50rpx 50rpx 0rpx 0rpx;
		position: relative;
		padding-bottom: env(safe-area-inset-bottom);
		padding-bottom: constant(safe-area-inset-bottom);

		::after {
			content: '';
			display: block;
			clear: both;
		}

		.tip {
			width: 106rpx;
			height: 95rpx;
			position: absolute;
			left: 50%;
			top: -40rpx;
			margin-left: -53rpx;
		}

		.close-btn {
			width: 26rpx;
			height: 27rpx;
			right: 30rpx;
			top: 20rpx;
			padding: 20rpx;
			position: absolute;
		}



		.touch {
			text-align: center;
			padding-top: 100rpx;


			.item {
				text-align: center;
				color: white;
				background-color: #083969;
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

	.uni-popup__wrapper-box {

		display: block;

		position: relative;
		/* iphonex 等安全区设置，底部安全区适配 */

		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);

	}
</style>
