<template>
	<!-- 	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='枕头调整'></z-nav-bar> -->
	<view class="main">
		<view v-if="!bleConnected" class="ble-off-tip">
			未连接枕头蓝牙，无法进行手动微调。请先在首页连接设备。
		</view>
		<view class="select-part">
			<view :class="this.selectIndex==1?'select-btn':'select-btn unselect-btn'" v-if="this.selectIndex==1">
				<image mode="widthFix" class="icon1" :src="'../static/adjust/SY_11_IconYWb.png'"></image>
				<label>仰卧调节</label>
			</view>
			<view :class="this.selectIndex==2?'select-btn':'select-btn unselect-btn'" v-if="this.selectIndex==2">
				<image mode="widthFix" class="icon2" :src="'../static/adjust/SY_11_IconCWb.png'"></image>
				<label>侧卧调节</label>
			</view>
		</view>
		<view class="text-tips">请保持{{this.selectIndex == 1?'仰卧姿态':'侧卧姿态'}}进行调节</view>
		<view class="info-part">
			<view class="info-second-part">
				<label class='desc1'>头枕部</label>
				<label class='desc1size'>{{ displayHeadCm }}cm</label>
				<label class='desc2'>颈枕部</label>
				<label class='desc2size'>{{ displayNeckCm }}cm</label>
				<image class="human-icon" :src="'../static/adjust/SY_11_bg01YW.png'"></image>
				<image class="main-icon" :src="'../static/adjust/SY_11_bg.png'"></image>
				<image class="down-icon" :src="'../static/adjust/SY_11_DOW.png'"></image>
				<image class="up-icon" :src="'../static/adjust/SY_11_UP.png'"></image>
				<!-- 				<image class="bzb-icon" :src="'../static/adjust/SY_11_buttonBZb.png'"></image>
				<image class="tzb-icon" :src="'../static/adjust/SY_11_buttonTZb.png'"></image> -->
				<view :class="this.selectHead?'bo bo-left':'bo bo-left select'" @click="onSelectHeadClick(true)">
					头枕
				</view>
				<view :class="this.selectHead?'bo bo-right select':'bo bo-right'" @click="onSelectHeadClick(false)">
					颈枕
				</view>
			</view>
			<view class="opt-part">
				<view class="slider-row" :class="{ 'opt-disabled': !bleConnected }">
					<view class="step-btn step-btn-minus" @click="onAdjustStepClick(-1)">
						<text class="step-btn-txt">−</text>
					</view>
					<slider class="height-slider" :disabled="!bleConnected" :value="currentSliderPercent" min="0" max="100" step="1"
						activeColor="#5d8ff8" backgroundColor="#e6e7eb" block-color="#7bc8e9" block-size="26"
						@changing="onSliderChanging" @change="onSliderChange" />
					<view class="step-btn step-btn-plus" @click="onAdjustStepClick(1)">
						<text class="step-btn-txt">+</text>
					</view>
				</view>
				<view class="slider-pct">{{ currentSliderPercent }}%</view>
			</view>
			<view class="opt-part" v-if="false">
				<view class="opt-btn" @click="resetHandle">
					<label>设备校准（0x0A）</label>
				</view>
			</view>
			<view class="bottom-part">
				<view class="save" :class="{ 'btn-disabled': !bleConnected }" @click="saveModeHandler">保存{{selectIndex==1?'/侧卧调整':'/返回主页'}}</view>
				<view class="text-tips text-button bottom-btn" @click="cancelSaveHandle">
					不保存{{this.selectIndex==1?'/继续调整侧卧高度':'/返回主页'}}
				</view>
			</view>
		</view>
		<input-view ref="inputView" class="input-part" v-if="showMeasure&&false"></input-view>
		<recommand-info :showTips="true" :standard="standard"></recommand-info>


		<uni-popup ref="popupSave" type="bottom" background-color="#fff" border-radius="10px 10px 0 0"
			:mask-click="false">
			<view class="popup-container">
				<view class="flex align-center" style="padding: 30rpx;padding-top: 90rpx;">
					<image class='icon' src="../../static/adjust/sicon.png" mode="widthFix"></image>
					<text class="icon-text">储存设定</text>
				</view>
				<view class="flex align-center" style="padding: 30rpx;">
					<text class="">名称</text>
					<input v-model="inputName" class="flex1 input-area" placeholder="输入我的模式" />
				</view>
				<view class="send-btn" @click="onSaveHandlerClick">保存{{selectIndex==1?'仰卧数据':'侧卧数据'}}</view>
				<image class="titleimg" src="../../static/adjust/SY_05_B001.png"></image>
				<image class="close-btn" src="../../static/adjust/SY_05_buttonCOLa.png" mode="widthFix"
					@click="closeSave">
				</image>
			</view>
		</uni-popup>
		<!-- 结果提示界面 -->
		<uni-popup ref="popupTips" type="bottom" style="z-index: 10000; position: absolute;"
			border-radius="40rpx 40rpx 40rpx 40rpx" background-color='white' :mask-click="true">
			<view class="popup-tips">
				<view class="send-btn">接下来进行侧卧调整,请保持侧卧姿势.
				</view>
				<image class="titleimg" src="../../static/adjust/SY_05_B001.png"></image>
				<image class="close-btn" src="../../static/adjust/SY_05_buttonCOLa.png" mode="widthFix"
					@click="closeTipsSave">
				</image>
			</view>
		</uni-popup>
	</view>
</template>
<script>
	import BluePillowProtocol, { PillowBleManager } from '@/utils/BlueUtils'
	import InputView from '../../pages/shootView/InputView.vue'
	import RecommandInfo from './RecommandInfo.vue'
	import { callPushSmartPillowData } from '../../utils/miniapp'
	import {
		sendModeByName,
		saveRandomMode,
		getAIModeByName,
		getMiniProgramEnv
	} from '@/common/util.js'
	import { stopSpineAdjustSession } from '@/common/spineSession.js'

	/** 手动微调：机械行程按最大 12cm 与协议 0~100% 对应；内部存 mm(0~120)，界面显示 cm */
	const MANUAL_MAX_MM = 120
	/** 加减按钮：协议百分数域每次步进（0x05/0x06） */
	const MANUAL_PERCENT_STEP = 6

	export default {
		components: {
			InputView,
			RecommandInfo
		},
		computed: {
			/** 头枕高度 cm 展示（内部 head/sideHead 为 mm 0~120） */
			displayHeadCm() {
				const mm = this.selectIndex === 1 ? this.head : this.sideHead
				return (Number(mm) / 10).toFixed(1)
			},
			/** 颈枕高度 cm 展示 */
			displayNeckCm() {
				const mm = this.selectIndex === 1 ? this.neck : this.sideNeck
				return (Number(mm) / 10).toFixed(1)
			},
			/** 当前选中通道（头/颈 × 仰/侧）对应的协议百分数 0~100，与滑块同步 */
			currentSliderPercent() {
				return this.mmToPct(this.getCurrentChannelMm())
			}
		},
		data() {
			return {
				inputName: '模式',
				pillowPressStatus: 0,
				saveOptions: {},
				showMeasure: false, // 是否显示信息
				deviceId: '', // 连接的蓝牙id
				serviceId: '', // 连接的服务id
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				characteristicStringId: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', //write，string，rx；
				pillowName: '',
				selectIndex: 1,
				selectHead: true, // 是否选中调整头枕，否则是脖枕
				head: 0, // 仰卧头部高度（mm，0~MANUAL_MAX_MM，对应 0~12cm）
				sideHead: 0, // 侧卧头部高度（mm）
				neck: 0, // 仰卧颈部高度（mm）
				sideNeck: 0, // 侧卧颈部高度（mm）
				initHeadHeight: 0,
				initNeckHeight: 0,
				initWidthHeight: 0,
				initSideNeckHeight: 0,
				initSideWdithHeight: 0,
				standard: {},
				step: 0, // 当前步骤
				/** 0x02/0x03 用户索引 0~4（路由可传 profileIndex） */
				profileIndex: 0,
				/** 若恢复进标定：0x0A 进入用 0x01，离开需发 0x05 退出（见协议 0x0A） */
				manualCalibrateEntered: false,
				_enterCalibrateApplyTimer: null,
				/** 非正式环境下 0x10 调试模式是否已进入（用于离场时补发退出） */
				manualDebugModeEntered: false,
				status04PollTimer: null,
				status04StartTimer: null,
				/** 与 PillowBleManager 同步，未连接时不允许微调下发 */
				bleConnected: false,
			}
		},
		onLoad(options) {
			console.log('options:', options)
			this.pillowName = decodeURIComponent(options.pillowName || '')
			this.deviceId = options.deviceId || ''
			this.serviceId = options.serviceId || ''
			// 路由一般为协议百分数 0~100，换算为 mm(0~120) 再参与微调
			this.initHeadHeight = this.routePctToMm(options.headHeight)
			this.initNeckHeight = this.routePctToMm(options.neckHeight)
			this.initWidthHeight = Math.floor(options.shoulderHeight || 0)
			this.initSideNeckHeight = this.routePctToMm(options.sideNeckHeight)
			this.initSideHeadHeight = this.routePctToMm(options.sideHeadHeight)
			this.initSideWdithHeight = Math.floor(options.sideShoulderHeight || 0)
			this.saveOptions = options;
			this.inputName = options.name ? decodeURIComponent(options.name) : '模式';
			let pi = options.profileIndex
			if (pi === undefined || pi === '') pi = options.userProfileIndex ?? options.userIndex
			const idx = parseInt(pi, 10)
			this.profileIndex = Number.isFinite(idx) ? Math.min(4, Math.max(0, idx)) : 0

			this.head = this.initHeadHeight;
			this.neck = this.initNeckHeight;
			this.sideNeck = this.initSideNeckHeight;
			this.sideHead = this.initSideHeadHeight
			console.log(decodeURIComponent(options.name))
			PillowBleManager.getInstance().updateDeviceName(this.pillowName);
			uni.setNavigationBarTitle({
				title: '手动微调'
			})
		},
		onShow() {
			this.syncBleConnectedState()
			if (PillowBleManager.getInstance().getSpineAdjusting()) {
				stopSpineAdjustSession({
					showModal: true,
					modalContent: '进入手动微调后已结束脊柱微调'
				});
			}
			// uni.setStorageSync('mode_switch_flag', true); // 旧标记逻辑，已改为切换时即停，保留为屏蔽
			this.step = 0;
			// 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
			// uni.onBLECharacteristicValueChange(this.handleMessage)
			uni.$on('xx', this.handleMessage);
			uni.$on('update_pillow_info', this.updateInfo);
			uni.$on('bluetooth_status_change', this.handleDisconnect);
			uni.$on('pillow_status_0x04', this.handlePillowStatus0x04);

			this.pillowPressStatus = PillowBleManager.getInstance().getPillowStatus()

			if (this.initHeadHeight >= 0 && this.initNeckHeight >= 0) {
				this.showMeasure = true;
				this.enterManualCalibrateThenApplyHeights();

				this.standard = getAIModeByName(this.inputName)
				if (!this.standard) {
					this.standard = {
						headHeight: 60,
						neckHeight: 60,
						sideHeadHeight: 60,
						sideNeckHeight: 60,
					}
				}

				// this.$refs.inputView.showParams(this.saveOptions);
			} else {
				this.showMeasure = false;
			}
		},
		onUnload() {
			console.log('work on onUnload!')
			this.stopPillowStatus0x04Polling()
			this.exitManualDebugMode0x10()
			this.exitManualCalibrateMode();
			uni.$off('xx', this.handleMessage);
			uni.$off('pillow_status_0x04', this.handlePillowStatus0x04);
		},
		onHide() {
			console.log('work on hide!')
			this.stopPillowStatus0x04Polling()
			this.exitManualDebugMode0x10()
			this.exitManualCalibrateMode();
			uni.$on('update_pillow_info', this.updateInfo);

			uni.$off('xx', this.handleMessage);
			uni.$off('bluetooth_status_change', this.handleDisconnect);
			uni.$off('pillow_status_0x04', this.handlePillowStatus0x04);
		},
		methods: {
			syncBleConnectedState() {
				this.bleConnected = PillowBleManager.getInstance().isConnected()
			},
			/** @returns {boolean} */
			ensureBleConnected() {
				this.syncBleConnectedState()
				if (this.bleConnected) return true
				uni.showToast({ title: '请先连接枕头蓝牙', icon: 'none' })
				return false
			},
			onAdjustStepClick(direction) {
				if (!this.ensureBleConnected()) return
				this.adjustPercentStep(direction)
			},
			onSelectHeadClick(bool) {
				if (!this.ensureBleConnected()) return
				this.selectHeadHandler(bool)
			},
			onSaveHandlerClick() {
				if (!this.ensureBleConnected()) return
				this.saveHandler()
			},
			startPillowStatus0x04Polling(initialDelayMs = 0) {
				this.stopPillowStatus0x04Polling()
				const delay = Math.max(0, Math.floor(Number(initialDelayMs) || 0))
				this.status04StartTimer = setTimeout(() => {
					this.status04StartTimer = null
					this.requestPillowStatus0x04()
					this.status04PollTimer = setInterval(() => {
						this.requestPillowStatus0x04()
					}, 2000)
				}, delay)
			},
			stopPillowStatus0x04Polling() {
				if (this.status04StartTimer != null) {
					clearTimeout(this.status04StartTimer)
					this.status04StartTimer = null
				}
				if (this.status04PollTimer != null) {
					clearInterval(this.status04PollTimer)
					this.status04PollTimer = null
				}
			},
			/** 0x04 协议里头/颈高度为 uint16 小端，日志用 16 进制展示与协议一致 */
			u16HexForLog(v) {
				const n = Number(v)
				if (!Number.isFinite(n)) return '0x0000'
				return '0x' + (Math.max(0, Math.min(65535, Math.floor(n))) & 0xffff).toString(16).toUpperCase().padStart(4, '0')
			},
			/** 手动微调页主动读取 0x04：查询当前头枕/颈枕高度 */
			requestPillowStatus0x04() {
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					return
				}
				ble.readPillowStatus({ silent: true })
			},
			/** 接收 0x04 结果并输出头枕/颈枕高度（协议百分比转 mm/cm 展示） */
			handlePillowStatus0x04(payload) {
				const parsed = payload && payload.parsed
				if (!parsed || !parsed.ok) {
					return
				}
				console.log(
					`[手动微调][0x04] 头枕高度=${this.u16HexForLog(parsed.headHeightPct)}, 颈枕高度=${this.u16HexForLog(parsed.neckHeightPct)}, workState=${parsed.workState}`
				)
			},
			/** 非正式环境（develop / trial）启用 0x10 睡姿注入；release 保持原流程 */
			shouldInjectSleepStateBy0x10() {
				const env = getMiniProgramEnv()
				return !!(env && !env.isRelease)
			},
			/**
			 * 0x10：调试模式 + 睡姿状态
			 * @param {number} sleepState 1=仰卧，2=侧卧
			 */
			sendManualAdjustSleepState0x10(sleepState) {
				if (!this.shouldInjectSleepStateBy0x10()) {
					return
				}
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					return
				}
				ble.headParams0x10({
					read: false,
					debugMode: 1,
					sleepState: sleepState === 2 ? 2 : 1
				})
				this.manualDebugModeEntered = true
			},
			/** 非正式环境离开手动微调时退出 0x10 调试模式 */
			exitManualDebugMode0x10() {
				if (!this.shouldInjectSleepStateBy0x10()) {
					return
				}
				if (!this.manualDebugModeEntered) {
					return
				}
				const ble = PillowBleManager.getInstance()
				if (ble.isConnected()) {
					ble.headParams0x10({
						read: false,
						debugMode: 0,
						sleepState: 0
					})
				}
				this.manualDebugModeEntered = false
			},
			/**
			 * 进入手动微调页：直接按当前睡姿下发头/颈目标（0x05/0x06）。
			 * 标定模式（0x0A）已暂时关闭，原逻辑保留在注释中便于恢复。
			 */
			enterManualCalibrateThenApplyHeights() {
				if (this._enterCalibrateApplyTimer != null) {
					clearTimeout(this._enterCalibrateApplyTimer);
					this._enterCalibrateApplyTimer = null;
				}
				const ble = PillowBleManager.getInstance();
				if (!ble.isConnected()) {
					return;
				}
				// —— 原流程：先 0x0A 进入标定，约 220ms 后再下发 0x05/0x06 ——
				// ble.send(BluePillowProtocol.calibrate(0x01), { silent: true });
				// this.manualCalibrateEntered = true;
				// this._enterCalibrateApplyTimer = setTimeout(() => {
				// 	this._enterCalibrateApplyTimer = null;
				// 	if (!PillowBleManager.getInstance().isConnected()) {
				// 		return;
				// 	}
				// 	this.send2Pillow(this.initHeadHeight, this.initNeckHeight, this.initSideHeadHeight, this
				// 		.initSideNeckHeight, 0);
				// }, 220);
				// 入口 4 条命令按 200ms 间隔发送：0x10(调试环境) -> 0x05 -> 0x06 -> 0x04
				const cmdGapMs = 200
				let cmdIndex = 0
				const schedule = (fn) => {
					setTimeout(() => {
						const m = PillowBleManager.getInstance()
						if (!m.isConnected()) return
						fn(m)
					}, cmdGapMs * cmdIndex)
					cmdIndex += 1
				}
				const sleepState = this.selectIndex === 2 ? 2 : 1
				if (this.shouldInjectSleepStateBy0x10()) {
					schedule(() => {
						this.sendManualAdjustSleepState0x10(sleepState)
					})
				}
				const headPct = this.mmToPct(this.selectIndex === 1 ? this.initHeadHeight : this.initSideHeadHeight)
				const neckPct = this.mmToPct(this.selectIndex === 1 ? this.initNeckHeight : this.initSideNeckHeight)
				schedule((m) => {
					m.send(BluePillowProtocol.headHeight(headPct), { silent: true })
				})
				schedule((m) => {
					m.send(BluePillowProtocol.neckHeight(neckPct), { silent: true })
				})
				this.step = 0
				this.startPillowStatus0x04Polling(cmdGapMs * cmdIndex)
			},
			/** 离开微调页。若曾进 0x0A 标定，应发 calibrate(0x05) 退出；当前标定流程已关闭，仅清理定时器。 */
			exitManualCalibrateMode() {
				if (this._enterCalibrateApplyTimer != null) {
					clearTimeout(this._enterCalibrateApplyTimer);
					this._enterCalibrateApplyTimer = null;
				}
				// if (!this.manualCalibrateEntered) {
				// 	return;
				// }
				// const ble = PillowBleManager.getInstance();
				// if (ble.isConnected()) {
				// 	ble.send(BluePillowProtocol.calibrate(0x05), { silent: true });
				// }
				// this.manualCalibrateEntered = false;
			},
			// 蓝牙连接状态变化（含断开 / 重连）
			handleDisconnect() {
				this.syncBleConnectedState()
				const mgr = PillowBleManager.getInstance()
				if (!mgr.loginSuccess) {
					console.log('调整页面检测到蓝牙断开');
					this.stopPillowStatus0x04Polling()

					if (this._enterCalibrateApplyTimer != null) {
						clearTimeout(this._enterCalibrateApplyTimer);
						this._enterCalibrateApplyTimer = null;
					}
					this.manualCalibrateEntered = false;
				} else if (this.showMeasure) {
					this.startPillowStatus0x04Polling()
				}
			},
			/** 路由入参多为协议 0~100%，映射到 mm 0~120（12cm 满行程） */
			routePctToMm(v) {
				const p = Math.max(0, Math.min(100, Math.floor(Number(v) || 0)))
				return Math.round((p / 100) * MANUAL_MAX_MM)
			},
			/** 内部高度 mm 夹紧 0~120 */
			clampHeightMm(v) {
				return Math.max(0, Math.min(MANUAL_MAX_MM, Math.round(Number(v) || 0)))
			},
			/** mm → 协议 0x05/0x06/0x02/0x03 用的百分数 0~100 */
			mmToPct(mm) {
				const m = this.clampHeightMm(mm)
				return Math.max(0, Math.min(100, Math.round((m / MANUAL_MAX_MM) * 100)))
			},
			/** 设备上报 0~100 为百分数时 → mm；若 >100 视为历史 mm 直夹紧 */
			deviceHeightToMm(v) {
				const n = Number(v) || 0
				if (n <= 100) {
					return Math.round((n / 100) * MANUAL_MAX_MM)
				}
				return this.clampHeightMm(n)
			},
			/** 有效窗口：按“上下浮动 10 个百分点”（固定值 10） */
			heightWindows(headMm, neckMm) {
				const h = this.mmToPct(headMm)
				const n = this.mmToPct(neckMm)
				return {
					headWindow: Math.max(0, Math.min(65535, 10)),
					neckWindow: Math.max(0, Math.min(65535, 10))
				}
			},
			getCurrentChannelMm() {
				if (this.selectIndex === 1) {
					return this.selectHead ? this.head : this.neck
				}
				return this.selectHead ? this.sideHead : this.sideNeck
			},
			setCurrentChannelMm(mm) {
				const m = this.clampHeightMm(mm)
				if (this.selectIndex === 1) {
					if (this.selectHead) this.head = m
					else this.neck = m
				} else {
					if (this.selectHead) this.sideHead = m
					else this.sideNeck = m
				}
			},
			/** 协议 0~100% → mm */
			pctToMm(pct) {
				return this.routePctToMm(pct)
			},
			sendCurrentChannelBle() {
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) return
				const mm = this.getCurrentChannelMm()
				const pct = this.mmToPct(mm)
				if (this.selectIndex === 1) {
					if (this.selectHead) {
						ble.send(BluePillowProtocol.headHeight(pct), { silent: true })
					} else {
						ble.send(BluePillowProtocol.neckHeight(pct), { silent: true })
					}
				} else {
					if (this.selectHead) {
						ble.send(BluePillowProtocol.headHeight(pct), { silent: true })
					} else {
						ble.send(BluePillowProtocol.neckHeight(pct), { silent: true })
					}
				}
			},
			/** 拖动中只更新本地高度与界面，不下发 BLE */
			onSliderChanging(e) {
				if (!this.bleConnected) return
				const v = e.detail.value
				this.setCurrentChannelMm(this.pctToMm(v))
			},
			/** 松手时下发 0x05/0x06 */
			onSliderChange(e) {
				if (!this.ensureBleConnected()) return
				const v = e.detail.value
				this.setCurrentChannelMm(this.pctToMm(v))
				this.sendCurrentChannelBle()
			},
			/**
			 * 加减：协议百分数每次 ±6，下发 0x05/0x06；低于 0 为 0，超过 100 为 100
			 * @param {number} direction +1 或 -1 表示加/减方向
			 */
			adjustPercentStep(direction) {
				const step = MANUAL_PERCENT_STEP * (direction > 0 ? 1 : -1)
				const prev = this.currentSliderPercent
				const p = Math.max(0, Math.min(100, prev + step))
				if (p === prev) return
				this.setCurrentChannelMm(this.pctToMm(p))
				this.sendCurrentChannelBle()
			},
			updateInfo() {
				this.pillowPressStatus = PillowBleManager.getInstance().getPillowStatus()
				if (this.showMeasure) {
					// 手动微调页：滑动条与高度值仅以本地设置为准，不用设备上报回写，避免数值抖动/被覆盖
				} else {

					switch (this.pillowPressStatus) {
						case 0:
							this.selectIndex = 1;
							break;
						case 1:
							console.log('枕头平躺状态')
							this.selectIndex = 1;
							break;
						case 2:
							console.log('枕头侧卧状态')
							this.selectIndex = 2;
					}
				}

				const mgr = PillowBleManager.getInstance();
				if (!this.showMeasure) {
					if (this.selectIndex == 2) {
						this.$set(this, 'sideNeck', this.deviceHeightToMm(mgr.pillowSideHeight));
						this.$set(this, 'sideHead', this.deviceHeightToMm(mgr.pillowHeight));
					} else {
						this.$set(this, 'neck', this.deviceHeightToMm(mgr.pillowSideHeight));
						this.$set(this, 'head', this.deviceHeightToMm(mgr.pillowHeight));
					}
				}

				this.$set(this, 'pillowPower', PillowBleManager.getInstance().pillowPower);
				this.$set(this, 'pillowPowerCharging', PillowBleManager.getInstance().chargingStatus);
			},
			/** 原：0x0A 再次进入标定（入口已隐藏）；标定关闭后此处已注释 */
			resetHandle() {
				// PillowBleManager.getInstance().send(BluePillowProtocol.calibrate(0x01), { silent: true });
				// this.manualCalibrateEntered = true;
			},
			// 按当前睡姿用 0x05/0x06 设置头枕、颈枕目标高度（入参为 mm 0~120，下发为协议百分数）
			send2Pillow(headHeight, neckHeight, sideHeadHeight, sideNeckHeight, step) {
				const ble = PillowBleManager.getInstance();
				if (!ble.isConnected()) return
				const ch = (mm) => this.mmToPct(mm);
				if (this.selectIndex === 1) {
					ble.send(BluePillowProtocol.headHeight(ch(headHeight)), { silent: true });
					ble.send(BluePillowProtocol.neckHeight(ch(neckHeight)), { silent: true });
				} else {
					ble.send(BluePillowProtocol.headHeight(ch(sideHeadHeight)), { silent: true });
					ble.send(BluePillowProtocol.neckHeight(ch(sideNeckHeight)), { silent: true });
				}
				this.step = step;
			},
			// 不保存
			cancelSaveHandle() {
				if (this.selectIndex == 1) {
					if (!this.ensureBleConnected()) return
					this.send2Pillow(this.initHeadHeight, this.initNeckHeight, this.initSideHeadHeight, this
						.initSideNeckHeight, 1);

					this.selectIndex = 2;
					this.sendManualAdjustSleepState0x10(2)
				} else {
					const ble = PillowBleManager.getInstance()
					if (ble.isConnected()) {
						this.send2Pillow(this.initHeadHeight, this.initNeckHeight, this.initSideHeadHeight, this
							.initSideNeckHeight, 2);
					}

					uni.setStorageSync('manual_adjust_completed', true)

					uni.switchTab({
						url: '/pages/status/status'
					})
				}
			  const pillowParams = this.buildPillowParams();

				callPushSmartPillowData(pillowParams.headHeight,pillowParams.neckHeight,pillowParams.sideHeadHeight,pillowParams.sideNeckHeight)
				.then(res => console.log('手动微调取消调整数据提交成功:', res))
				.catch(err => console.error('手动微调取消调整数据提交失败:', err));
			},
			saveModeHandler() {
				if (!this.ensureBleConnected()) return
				this.$refs.popupSave.open('bottom');
			},
			closeTipsSave() {
				this.$refs.popupTips.close()
			},
			// 关闭
			closeSave() {
				this.$refs.popupSave.close();
			},
			saveHandler() {
				let result;
				if (this.selectIndex == 1) {
					// 仰卧数据（存储仍为协议 0~100%）
					result = saveRandomMode({
						name: this.inputName,
						headHeight: this.mmToPct(this.head),
						neckHeight: this.mmToPct(this.neck),
						sideHeadHeight: this.mmToPct(this.initSideHeadHeight),
						sideNeckHeight: this.mmToPct(this.initSideNeckHeight),
					})

					if (result == false) {
						uni.showToast({
							title: '模式数据已覆盖'
						})
					}

					//更新初始的高度
					this.initHeadHeight = this.head
					this.initNeckHeight = this.neck

					this.send2Pillow(this.initHeadHeight, this.initNeckHeight, this.initSideHeadHeight, this
						.initSideNeckHeight, 1);
					const sw = this.heightWindows(this.head, this.neck);
					PillowBleManager.getInstance().writeSupineConfig({
						index: this.profileIndex,
						headHeight: this.mmToPct(this.head),
						headWindow: sw.headWindow,
						neckHeight: this.mmToPct(this.neck),
						neckWindow: sw.neckWindow
					});

					this.selectIndex = 2;
					this.sendManualAdjustSleepState0x10(2)
					this.closeSave()
					this.$refs.popupTips.open('center')

					// uni.showToast({
					// 	title: '调整中',
					// 	success: () => {}
					// })
				} else {
					result = saveRandomMode({
						name: this.inputName,
						headHeight: this.mmToPct(this.head),
						neckHeight: this.mmToPct(this.neck),
						sideHeadHeight: this.mmToPct(this.sideHead),
						sideNeckHeight: this.mmToPct(this.sideNeck),
					})

					if (result == false) {
						uni.showToast({
							title: '模式数据已覆盖'
						})
					}
					this.initSideHeadHeight = this.sideHead
					this.initSideNeckHeight = this.sideNeck

					this.send2Pillow(this.initHeadHeight, this.initNeckHeight, this.initSideHeadHeight, this
						.initSideNeckHeight, 2);
					const swSide = this.heightWindows(this.sideHead, this.sideNeck);
					PillowBleManager.getInstance().writeSideConfig({
						index: this.profileIndex,
						headHeight: this.mmToPct(this.sideHead),
						headWindow: swSide.headWindow,
						neckHeight: this.mmToPct(this.sideNeck),
						neckWindow: swSide.neckWindow
					});

					let inputName = this.inputName;
					// 设置手动微调完成标记（只有真正保存了数据才算完成）
					uni.setStorageSync('manual_adjust_completed', true)
					uni.showToast({
						title: '保存中',
						success() {
							// 跳转首页
							// 更新新的数据
							sendModeByName(inputName)
							uni.switchTab({
								url: '/pages/status/status'
							})
						}
					})
				}
				const pillowParams = this.buildPillowParams({
				  headHeight: this.head,
				  neckHeight: this.neck,
				  sideHeadHeight: this.selectIndex === 1 ? this.initSideHeadHeight : this.sideHead,
				  sideNeckHeight: this.selectIndex === 1 ? this.initSideNeckHeight : this.sideNeck,
				});
				callPushSmartPillowData(pillowParams.headHeight,pillowParams.neckHeight,pillowParams.sideHeadHeight,pillowParams.sideNeckHeight)
				.then(res => console.log('手动微调保存调整数据提交成功:', res))
				.catch(err => console.error('手动微调保存调整数据提交失败:', err));
			},
			/** 仅处理新协议上行帧 0xAA（与 PillowBleManager.handleNotifyBuffer 一致） */
			handleMessage(res) {
				const raw = res && res.value;
				if (!raw) {
					return;
				}
				const u8 = new Uint8Array(raw);
				if (u8[0] !== 0xaa) {
					return;
				}
				const mgr = PillowBleManager.getInstance();
				const parsed = mgr.handleNotifyBuffer(raw);
				if (!parsed) {
					return;
				}
				if (parsed.type === 'write_ack' && parsed.parsed) {
					const p = parsed.parsed;
					if (p.success === false) {
						uni.showToast({
							title: p.code === 1 ? '指令执行失败' : '设备应答异常',
							icon: 'none'
						});
					}
					return;
				}
				if (parsed.type === 'pillow_status' && parsed.parsed && parsed.parsed.ok) {
					const ws = parsed.parsed.workState;
					this.pillowPressStatus = ws;
				}
			},
			selectHeadHandler(bool) {
				this.selectHead = bool
			},
			selectHandler(index) {
				this.selectIndex = index
			},
			  // 通用参数构建函数（入参为 mm 时合并后统一转为协议百分数给云端）
			  buildPillowParams(heightData = {}) {
			    const defaultMm = {
			      headHeight: this.initHeadHeight,
			      neckHeight: this.initNeckHeight,
			      sideHeadHeight: this.initSideHeadHeight,
			      sideNeckHeight: this.initSideNeckHeight
			    };
			    const merged = { ...defaultMm, ...heightData };
			    return {
			      headHeight: this.mmToPct(merged.headHeight),
			      neckHeight: this.mmToPct(merged.neckHeight),
			      sideHeadHeight: this.mmToPct(merged.sideHeadHeight),
			      sideNeckHeight: this.mmToPct(merged.sideNeckHeight)
			    };
			  },
		}
	}
</script>

<style lang="scss">
	::v-deep(.input-part) {
		bottom: 0 !important;
	}

	.ble-off-tip {
		margin: 16rpx 24rpx 0;
		padding: 20rpx 24rpx;
		background: #fff3cd;
		color: #856404;
		font-size: 26rpx;
		border-radius: 12rpx;
		line-height: 1.45;
	}

	.opt-disabled {
		opacity: 0.55;
	}

	.save.btn-disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.selected {
		background-color: #1c4485;
	}

	.unselect-btn {
		background-color: #d5e0f7 !important;
		color: #354D5B !important;
	}

	.select-btn {
		background-color: rgb(28, 68, 133);
		width: 284rpx;
		height: 90rpx;
		border-radius: 20rpx;
		color: white;
		display: flex;
		justify-content: space-around;
		align-items: center;

		.icon1 {
			width: 61rpx;
			height: 36rpx;
		}

		.icon2 {
			width: 61rpx;
			height: 41rpx;
		}
	}

	.text-tips {
		text-align: center;
		color: rgb(28, 68, 133);
		font-size: 24rpx;
		padding: 10rpx;
	}

	.bottom-btn {
		width: 670rpx;
		height: 82rpx;
		border: #1c4485 1px solid;
		border-radius: 30rpx;
		background-color: rgb(255, 255, 255);
		margin: 0 auto;
		line-height: 82rpx;
		margin-top: -18rpx;
		padding: 0rpx !important;
	}

	.normal-btn {
		background-color: rgb(255, 255, 255);
		width: 284rpx;
		height: 90rpx;
		border-radius: 20rpx;
		display: flex;
		justify-content: space-around;
		align-items: center;

		.icon1 {
			width: 61rpx;
			height: 36rpx;
		}

		.icon2 {
			width: 61rpx;
			height: 41rpx;
		}

	}

	.popup-tips {
		position: relative;
		padding: 20rpx;
		top: 0;
		// background-color: rgba(255, 255, 255, 0.1);
		// border-radius: 40rpx;

		.modal-tips {
			margin-top: 25rpx;
			background-color: white;
			border-radius: 40rpx;
		}

		.titleimg {
			width: 106rpx;
			height: 95rpx;
			position: absolute;
			left: 50%;
			top: -40rpx;
			margin-left: -53rpx;
		}

		.send-btn {
			background-color: #fff;
			margin: 20rpx;
			margin-top: 50rpx;
			color: #354D5B;
			line-height: 80rpx;
			padding-left: 50rpx;
			padding-right: 50rpx;
			border-radius: 15rpx;
			text-align: center;
		}

		.sure-btn {
			background-color: #4d7fc9;
			margin: 30rpx;
			color: white;
			font-size: 28rpx;
			line-height: 68rpx;
			padding-left: 50rpx;
			padding-right: 50rpx;
			border-radius: 25rpx;
			text-align: center;
		}

		.close-btn {
			width: 26rpx;
			height: 27rpx;
			right: 30rpx;
			top: 20rpx;
			position: absolute;
		}

		.icon {
			width: 42rpx;
			height: 42rpx;
		}

		.input-area {
			margin-left: 20rpx;
			letter-spacing: 2rpx;
			background-color: #DEDEDE;
			padding: 20rpx;
			color: rgba(91, 120, 151, 1)
		}

		.icon-text {
			// line-height: 42rpx;
			margin-left: 20rpx;
			letter-spacing: 5rpx;
		}
	}

	.resetbtn {
		padding: 5rpx;
		color: white;
		background-color: rgb(109, 0, 1);
	}

	.text-button {
		font-size: 20rpx;
		padding: 20rpx;
	}

	.main {
		background-color: rgb(197, 208, 230);
		width: 100%;
		height: 100%;

		.select-part {
			padding-top: 60rpx;
			display: flex;
			justify-content: space-around;
		}


		.info-second-part {
			position: relative;
			margin: 0 auto;
			width: 634rpx;
			height: 297rpx;
			margin-top: 100rpx;
			color: #5B7897;

			.bo {
				width: 128rpx;
				height: 76rpx;
				background-color: rgb(77, 127, 201);
				color: white;
				text-align: center;
				line-height: 76rpx;
				border-radius: 30rpx 30rpx;
			}

			.bo-left {
				position: absolute;
				left: 45%;
				transform: translateX(-45%);
				top: 193rpx;
				z-index: 10;
			}

			.bo-right {
				z-index: 10;
				position: absolute;
				right: 130rpx;
				top: 193rpx;
			}

			.select {
				background-color: white;
				color: rgb(28, 68, 133);
			}

			.bzb-icon {
				position: absolute;
				left: 66rpx;
				top: 60rpx;
				width: 358rpx;
				height: 139rpx;
			}

			.tzb-icon {
				position: absolute;
				right: 66rpx;
				top: 60rpx;
				width: 327rpx;
				height: 125rpx;
			}

			.human-icon {
				position: absolute;
				right: -30rpx;
				top: -60rpx;
				width: 476rpx;
				height: 271rpx;
			}

			.desc1 {
				font-size: 30rpx;
				left: 22rpx;
				top: 20rpx;
				position: absolute;
				color: #354D5B;
				z-index: 11;
			}

			.desc1size {
				font-size: 36rpx;
				position: absolute;
				color: #003C71;
				right: 388rpx;
				top: 18rpx;
				z-index: 11;
			}

			.desc2 {
				position: absolute;
				color: #354D5B;


				left: 390rpx;
				top: 47rpx;
				font-size: 30rpx;
				z-index: 11;
			}

			.desc2size {
				font-size: 36rpx;
				color: #003C71;
				position: absolute;
				right: 25rpx;
				top: 43rpx;
				z-index: 11;
			}

			.main-icon {
				width: 644rpx;
				height: 292rpx;
				position: relative;
				z-index: 10;
			}

			.up-icon {
				width: 24rpx;
				height: 76rpx;
				position: absolute;
				left: 0rpx;
				top: 190rpx;
				z-index: 12;
				display: none;
			}

			.down-icon {
				width: 24rpx;
				height: 77rpx;
				position: absolute;
				right: 27rpx;
				top: 190rpx;
				display: none;
				z-index: 12;
			}

			.show-icon {
				display: block;
			}

			@-webkit-keyframes downEffect {
				0% {
					transform: translateY(0);
					opacity: 0.3;
					top: 50px;
				}

				30% {
					transform: translateY(120);
					opacity: 1;

				}

				100% {
					transform: translateY(0);
					top: 100px;
					opacity: 1;
				}
			}

			@keyframes downEffect {
				0% {
					transform: translateY(0);
					opacity: 0.3;
					top: 50px;
				}

				30% {
					transform: translateY(120);
					opacity: 1;
				}

				100% {
					transform: translateY(0);
					top: 100px;
					opacity: 1;
				}
			}


			.down-icon-effect {
				animation: 1s linear 0s infinite downEffect;
				-webkit-animation: 1s linear 0s infinite downEffect;
			}

			@-webkit-keyframes upEffect {
				0% {
					opacity: 0.3;
					top: 120px;
				}

				30% {
					opacity: 1;
				}

				100% {
					top: 70px;
					opacity: 1;
				}
			}

			@keyframes upEffect {
				0% {
					opacity: 0.3;
					top: 120px;
				}

				30% {
					opacity: 1;
				}

				100% {
					top: 70px;
					opacity: 1;
				}
			}

			.up-icon-effect {
				animation: 1s linear 0s infinite upEffect;
				-webkit-animation: 1s linear 0s infinite upEffect;
			}
		}

		.opt-part {
			margin-top: 48rpx;
			padding: 0 20rpx 8rpx;
			background: transparent;
			border-radius: 20rpx;

			.slider-row {
				display: flex;
				align-items: center;
				min-height: 78rpx;
			}

			.step-btn {
				width: 54rpx;
				height: 54rpx;
				flex-shrink: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.75);
				border: 1rpx solid rgba(93, 143, 248, 0.2);
				box-shadow: none;
				position: relative;
				top: -1rpx;
			}

			.step-btn:active {
				transform: scale(0.96);
			}

			.step-btn-txt {
				font-size: 38rpx;
				line-height: 1;
				color: #3c64d1;
				font-weight: 500;
			}

			.height-slider {
				flex: 1;
				margin: 0 22rpx;
				height: 54rpx;
			}

			::v-deep .height-slider .wx-slider {
				padding: 0 !important;
				margin: 0 !important;
				height: 54rpx !important;
				display: flex;
				align-items: center;
			}

			::v-deep .height-slider .wx-slider-track {
				height: 12rpx !important;
				border-radius: 999rpx !important;
			}

			.slider-pct {
				text-align: center;
				color: #2c56b8;
				font-size: 30rpx;
				margin-top: 10rpx;
				font-weight: 600;
				letter-spacing: 1rpx;
			}
		}
	}

	.popup-container {
		position: relative;
		margin: 20rpx;

		.titleimg {
			width: 106rpx;
			height: 95rpx;
			position: absolute;
			left: 50%;
			top: -50rpx;
			margin-left: -53rpx;
		}

		.send-btn {
			background-color: #ff8000;
			margin: 20rpx;
			color: white;
			line-height: 80rpx;
			padding-left: 50rpx;
			padding-right: 50rpx;
			border-radius: 15rpx;
			text-align: center;
		}

		.close-btn {
			width: 26rpx;
			height: 27rpx;
			right: 30rpx;
			top: 20rpx;
			position: absolute;
		}

		.icon {
			width: 42rpx;
			height: 42rpx;
		}

		.input-area {
			margin-left: 20rpx;
			letter-spacing: 2rpx;
			background-color: #DEDEDE;
			padding: 20rpx;
			color: rgba(91, 120, 151, 1)
		}

		.icon-text {
			// line-height: 42rpx;
			margin-left: 20rpx;
			letter-spacing: 5rpx;
		}
	}


	.bottom-part {
		background-color: white;
		height: 300rpx;
		width: 100%;
		position: fixed;
		bottom: 0rpx;
		border-radius: 50rpx 50rpx 0rpx 0rpx;

		.text-tips {
			text-align: center;
			color: rgb(28, 68, 133);
			font-size: 24rpx;
			padding: 10rpx;
		}

		.save {
			width: 670rpx;
			height: 102rpx;
			background-color: rgb(28, 68, 133);
			margin: 0 auto;
			line-height: 102rpx;
			text-align: center;
			color: white;
			margin-top: 80rpx;
			border-radius: 50rpx;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;

		}
	}
</style>