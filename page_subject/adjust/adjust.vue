<template>
	<!-- 	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='枕头调整'></z-nav-bar> -->
	<view class="main" :class="mainPageClass">
		<view v-if="!bleUiReady" class="ble-off-tip">
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
				<view class="desc1-wrap">
					<image
						v-if="bleUiReady && pillowHeadAirIconSrc"
						class="desc-air-icon"
						:src="pillowHeadAirIconSrc"
						mode="aspectFit"
					/>
					<label class="desc1">头枕部</label>
				</view>
				<label class='desc1size'>{{ displayHeadPct }}%</label>
				<view class="desc2-wrap">
					<image
						v-if="bleUiReady && pillowNeckAirIconSrc"
						class="desc-air-icon"
						:src="pillowNeckAirIconSrc"
						mode="aspectFit"
					/>
					<label class="desc2">颈枕部</label>
				</view>
				<label class='desc2size'>{{ displayNeckPct }}%</label>
				<image class="human-icon" :src="'../static/adjust/SY_11_bg01YW.png'"></image>
				<image class="main-icon" :src="'../static/adjust/SY_11_bg.png'"></image>
				<image class="down-icon" :src="'../static/adjust/SY_11_DOW.png'"></image>
				<image class="up-icon" :src="'../static/adjust/SY_11_UP.png'"></image>
				<!-- 				<image class="bzb-icon" :src="'../static/adjust/SY_11_buttonBZb.png'"></image>
				<image class="tzb-icon" :src="'../static/adjust/SY_11_buttonTZb.png'"></image> -->
				<view :class="selectHead === true ? 'bo bo-left' : 'bo bo-left select'" @click="onSelectHeadClick(true)">
					头枕
				</view>
				<view :class="selectHead === false ? 'bo bo-right' : 'bo bo-right select'" @click="onSelectHeadClick(false)">
					颈枕
				</view>
			</view>
			<view class="opt-part">
				<view class="slider-row" :class="{ 'opt-disabled': !bleUiReady || !hasAdjustChannelSelected }">
					<view class="step-btn step-btn-minus" hover-class="step-btn-active"
						@touchstart.stop="onManualAdjustStepTouchStart(-1)"
						@touchend.stop="onManualAdjustStepTouchEnd" @touchcancel.stop="onManualAdjustStepTouchEnd">
						<text class="step-btn-txt">−</text>
					</view>
					<!-- 轨道 0~100，与协议 0x05/0x06 一致 -->
					<slider class="height-slider" :disabled="!bleUiReady || !hasAdjustChannelSelected" :value="currentSliderPercent" min="0" max="100" step="1"
						activeColor="#5d8ff8" backgroundColor="#e6e7eb" block-color="#7bc8e9" block-size="26"
						@changing="onSliderChanging" @change="onSliderChange" />
					<view class="step-btn step-btn-plus" hover-class="step-btn-active"
						@touchstart.stop="onManualAdjustStepTouchStart(1)"
						@touchend.stop="onManualAdjustStepTouchEnd" @touchcancel.stop="onManualAdjustStepTouchEnd">
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
		</view>
		<input-view ref="inputView" class="input-part" v-if="showMeasure&&false"></input-view>
		<recommand-info :showTips="true" :standard="standard"></recommand-info>
		<!-- 0x11 修正值：仅 develop / trial，折叠放底部避免挡主流程 -->
		<view v-if="showDevCalib0x11Panel" class="dev-calib-wrap">
			<view class="dev-calib-fold" @click="toggleDevCalib0x11Panel">
				<text class="dev-calib-fold-title">开发工具 · 充放气修正</text>
				<text class="dev-calib-fold-action">{{ devCalib0x11Expanded ? '收起 ∧' : '展开 ∨' }}</text>
			</view>
			<view v-show="devCalib0x11Expanded" class="dev-calib-panel" :class="{ 'opt-disabled': !bleUiReady }">
				<view class="dev-calib-hint">节点 0~19 与阈值一一对应（节点 0 最低）；充气/放气修正 ±50，可点 −/+ 或输入负数</view>
				<view class="dev-calib-grid">
					<view class="dev-calib-field">
						<text class="dev-calib-label">节点</text>
						<input class="dev-calib-input" type="number" :disabled="!bleUiReady"
							v-model.number="calib0x11Node" placeholder="0~19" />
					</view>
					<view class="dev-calib-field">
						<text class="dev-calib-label">阈值</text>
						<input class="dev-calib-input" type="number" :disabled="!bleUiReady"
							v-model.number="calib0x11LevelData" placeholder="0~100" />
					</view>
					<view class="dev-calib-field dev-calib-field-wide">
						<text class="dev-calib-label">充气</text>
						<view class="dev-calib-stepper">
							<view class="dev-calib-step" hover-class="dev-calib-step-active"
								@touchstart.stop="onCalib0x11StepTouchStart('inflate', -1)"
								@touchend.stop="onCalib0x11StepTouchEnd" @touchcancel.stop="onCalib0x11StepTouchEnd">−</view>
							<input class="dev-calib-input dev-calib-input-signed" type="text" :disabled="!bleUiReady"
								v-model="calib0x11InflateCorrectStr" placeholder="-50~50"
								@blur="syncCalib0x11CorrectFromStr('inflate')" />
							<view class="dev-calib-step" hover-class="dev-calib-step-active"
								@touchstart.stop="onCalib0x11StepTouchStart('inflate', 1)"
								@touchend.stop="onCalib0x11StepTouchEnd" @touchcancel.stop="onCalib0x11StepTouchEnd">+</view>
						</view>
					</view>
					<view class="dev-calib-field dev-calib-field-wide">
						<text class="dev-calib-label">放气</text>
						<view class="dev-calib-stepper">
							<view class="dev-calib-step" hover-class="dev-calib-step-active"
								@touchstart.stop="onCalib0x11StepTouchStart('deflate', -1)"
								@touchend.stop="onCalib0x11StepTouchEnd" @touchcancel.stop="onCalib0x11StepTouchEnd">−</view>
							<input class="dev-calib-input dev-calib-input-signed" type="text" :disabled="!bleUiReady"
								v-model="calib0x11DeflateCorrectStr" placeholder="-50~50"
								@blur="syncCalib0x11CorrectFromStr('deflate')" />
							<view class="dev-calib-step" hover-class="dev-calib-step-active"
								@touchstart.stop="onCalib0x11StepTouchStart('deflate', 1)"
								@touchend.stop="onCalib0x11StepTouchEnd" @touchcancel.stop="onCalib0x11StepTouchEnd">+</view>
						</view>
					</view>
				</view>
				<view class="dev-calib-actions">
					<view class="dev-calib-btn" @click="readCalib0x11">读取</view>
					<view class="dev-calib-btn dev-calib-btn-primary" @click="writeCalib0x11">写入</view>
				</view>
			</view>
		</view>
		<view class="bottom-part">
			<view class="save" :class="{ 'btn-disabled': !bleUiReady }" @click="saveModeHandler">保存{{selectIndex==1?'/侧卧调整':'/返回主页'}}</view>
			<view class="text-tips text-button bottom-btn" @click="cancelSaveHandle">
				不保存{{this.selectIndex==1?'/继续调整侧卧高度':'/返回主页'}}
			</view>
		</view>


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
	import BluePillowProtocol, { PillowBleManager, pillowProfileHeightWindows } from '@/utils/BlueUtils'
	import InputView from '../../pages/shootView/InputView.vue'
	import RecommandInfo from './RecommandInfo.vue'
	import { callPushSmartPillowData } from '../../utils/miniapp'
	import {
		sendModeByName,
		saveRandomMode,
		getAIModeByName,
		getMiniProgramEnv,
		canBypassBleConnectInCurrentEnv
	} from '@/common/util.js'
	import { stopSpineAdjustSession } from '@/common/spineSession.js'

	/**
	 * 手动微调：协议档位 0~100 线性对应目标压力 0 Pa~4000 Pa（0~4 kPa）。
	 * 内部用 mm(0~120) 仅作档位换算载体（与 MANUAL_MAX_MM 比例），界面展示压力。
	 */
	const MANUAL_MAX_MM = 120
	const MANUAL_MIN_PERCENT = 0
	const MANUAL_MAX_PERCENT = 100
	const MANUAL_MIN_MM = 0
	/** 加减按钮：协议档位每次 ±MANUAL_PERCENT_STEP，长按连续调节 */
	const MANUAL_PERCENT_STEP = 1

	export default {
		components: {
			InputView,
			RecommandInfo
		},
		computed: {
			/** 头枕：当前姿态下协议 0~100%，与 0x05/0x06 一致 */
			displayHeadPct() {
				const mm = this.selectIndex === 1 ? this.head : this.sideHead
				return this.mmToPct(mm)
			},
			/** 颈枕：同上 */
			displayNeckPct() {
				const mm = this.selectIndex === 1 ? this.neck : this.sideNeck
				return this.mmToPct(mm)
			},
			/** 当前选中通道对应的 0~100%，与滑块同步 */
			currentSliderPercent() {
				return this.mmToPct(this.getCurrentChannelMm())
			},
			/** 是否已选择头枕或颈枕（进页默认均未选） */
			hasAdjustChannelSelected() {
				return this.selectHead === true || this.selectHead === false
			},
			/** 正式版须连蓝牙；develop/trial 可跳过连接拦截 */
			bleUiReady() {
				return this.bleConnected || canBypassBleConnectInCurrentEnv()
			},
			/** 0x04：阀1(bit0) 开 + 泵充气 → up2；阀开 + 泵停 → down2 */
			pillowHeadAirIconSrc() {
				if (!this.bleUiReady || !this.pillowHeadAirFlow) {
					return ''
				}
				return this.pillowHeadAirFlow === 'inflate'
					? '../../static/icon/up2.png'
					: '../../static/icon/down2.png'
			},
			/** 0x04：阀3(bit2) 同上 */
			pillowNeckAirIconSrc() {
				if (!this.bleUiReady || !this.pillowNeckAirFlow) {
					return ''
				}
				return this.pillowNeckAirFlow === 'inflate'
					? '../../static/icon/up2.png'
					: '../../static/icon/down2.png'
			},
			/** 与 0x10 调试一致：仅 develop / trial 显示 0x11 面板 */
			showDevCalib0x11Panel() {
				return this.shouldInjectSleepStateBy0x10()
			},
			mainPageClass() {
				if (!this.showDevCalib0x11Panel) return ''
				return this.devCalib0x11Expanded ? 'main-dev-tools main-dev-tools-open' : 'main-dev-tools'
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
				selectHead: null, // null=未选，true=头枕，false=颈枕
				head: 0, // 仰卧头枕档位载体 mm（0~120 ↔ 协议 0~100 ↔ 0~4kPa）
				sideHead: 0,
				neck: 0,
				sideNeck: 0,
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
				/** 0x04 气路充放气：null | inflate | deflate */
				pillowHeadAirFlow: null,
				pillowNeckAirFlow: null,
				/** 0x11 修正值表单（仅非正式环境面板） */
				calib0x11Node: 0,
				calib0x11LevelData: 0,
				calib0x11InflateCorrect: 0,
				calib0x11DeflateCorrect: 0,
				calib0x11InflateCorrectStr: '0',
				calib0x11DeflateCorrectStr: '0',
				devCalib0x11Expanded: false
			}
		},
		onLoad(options) {
			console.log('options:', options)
			this.pillowName = decodeURIComponent(options.pillowName || '')
			this.deviceId = options.deviceId || ''
			this.serviceId = options.serviceId || ''
			// 路由为协议压力档位 0~100（0~4kPa），换算为内部 mm 再参与微调
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

			const bleMgr = PillowBleManager.getInstance()
			const snap = typeof bleMgr.getLastPillowStatus0x04 === 'function' ? bleMgr.getLastPillowStatus0x04() : null
			if (snap && snap.parsed && snap.parsed.ok) {
				this.syncPillowAirFlowIconsFrom04(snap.parsed)
			}

			if (this.initHeadHeight >= 0 && this.initNeckHeight >= 0) {
				this.showMeasure = true;
				this.setupManualAdjustOnShow();

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
			this.stopManualAdjustStepRepeat()
			this.stopCalib0x11StepRepeat()
			this.stopPillowStatus0x04Polling()
			this.exitManualDebugMode0x10()
			this.exitManualCalibrateMode();
			uni.$off('xx', this.handleMessage);
			uni.$off('pillow_status_0x04', this.handlePillowStatus0x04);
		},
		onHide() {
			console.log('work on hide!')
			this.stopManualAdjustStepRepeat()
			this.stopCalib0x11StepRepeat()
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
				if (canBypassBleConnectInCurrentEnv()) {
					return true
				}
				this.syncBleConnectedState()
				if (this.bleConnected) return true
				uni.showToast({ title: '请先连接枕头蓝牙', icon: 'none' })
				return false
			},
			ensureAdjustChannelSelected() {
				if (this.hasAdjustChannelSelected) return true
				uni.showToast({ title: '请先选择头枕或颈枕', icon: 'none' })
				return false
			},
			stopManualAdjustStepRepeat() {
				if (this._manualAdjustStepDelayTimer != null) {
					clearTimeout(this._manualAdjustStepDelayTimer)
					this._manualAdjustStepDelayTimer = null
				}
				if (this._manualAdjustStepInterval != null) {
					clearInterval(this._manualAdjustStepInterval)
					this._manualAdjustStepInterval = null
				}
				this._manualAdjustStepDirection = null
			},
			onManualAdjustStepTouchStart(direction) {
				if (!this.ensureBleConnected()) return
				if (!this.ensureAdjustChannelSelected()) return
				this.stopManualAdjustStepRepeat()
				this._manualAdjustStepDirection = direction
				this._manualAdjustStepDelayTimer = setTimeout(() => {
					this._manualAdjustStepDelayTimer = null
					const d = this._manualAdjustStepDirection
					if (d == null) return
					if (!this.adjustPercentStep(d)) {
						this.stopManualAdjustStepRepeat()
						return
					}
					this._manualAdjustStepInterval = setInterval(() => {
						const cur = this._manualAdjustStepDirection
						if (cur == null || !this.adjustPercentStep(cur)) {
							this.stopManualAdjustStepRepeat()
						}
					}, 80)
				}, 350)
			},
			onManualAdjustStepTouchEnd() {
				if (this._manualAdjustStepDelayTimer != null) {
					const d = this._manualAdjustStepDirection
					clearTimeout(this._manualAdjustStepDelayTimer)
					this._manualAdjustStepDelayTimer = null
					if (d != null) this.adjustPercentStep(d)
				}
				this.stopManualAdjustStepRepeat()
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
					}, 1000)
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
				this.syncPillowAirFlowIconsFrom04(parsed)
			},
			/**
			 * 协议 0x04：设备状态 bit0=阀1(头枕)、bit2=阀3(颈枕)；泵1/2 为 1 表示充气。
			 * 阀开且任一气泵充气→充气图标；阀开且泵均非充气→放气图标。
			 */
			syncPillowAirFlowIconsFrom04(p) {
				if (!p || !p.ok) {
					this.$set(this, 'pillowHeadAirFlow', null)
					this.$set(this, 'pillowNeckAirFlow', null)
					return
				}
				const ds = (p.deviceStatus != null ? p.deviceStatus : p.valveBits) ?? 0
				const valveHead = (ds >> 0) & 1
				const valveNeck = (ds >> 2) & 1
				const pump1 = typeof p.pump1 === 'number' ? p.pump1 : 0
				const pump2 = typeof p.pump2 === 'number' ? p.pump2 : 0
				const pumpInflating = pump1 === 1 || pump2 === 1
				const head = valveHead ? (pumpInflating ? 'inflate' : 'deflate') : null
				const neck = valveNeck ? (pumpInflating ? 'inflate' : 'deflate') : null
				this.$set(this, 'pillowHeadAirFlow', head)
				this.$set(this, 'pillowNeckAirFlow', neck)
			},
			/** 非正式环境（develop / trial）启用 0x10 睡姿注入；release 保持原流程 */
			shouldInjectSleepStateBy0x10() {
				const env = getMiniProgramEnv()
				return !!(env && !env.isRelease)
			},
			/** 非正式环境：0x10 睡姿状态 0=无/进页，1=头枕，2=颈枕 */
			sendManualAdjustSleepState0x10(sleepState) {
				if (!this.shouldInjectSleepStateBy0x10()) {
					return
				}
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					return
				}
				const n = Math.floor(Number(sleepState))
				const state = n >= 0 && n <= 2 ? n : 0
				ble.headParams0x10({
					read: false,
					debugMode: 1,
					sleepState: state
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
			clampCalib0x11Form() {
				let node = Math.floor(Number(this.calib0x11Node))
				if (Number.isNaN(node)) node = 0
				node = Math.max(0, Math.min(19, node))
				this.calib0x11Node = node
				let level = Math.floor(Number(this.calib0x11LevelData))
				if (Number.isNaN(level)) level = 0
				this.calib0x11LevelData = Math.max(0, Math.min(100, level))
				this.syncCalib0x11CorrectFromStr('inflate')
				this.syncCalib0x11CorrectFromStr('deflate')
			},
			syncCalib0x11CorrectFromStr(field) {
				const strKey = field === 'inflate' ? 'calib0x11InflateCorrectStr' : 'calib0x11DeflateCorrectStr'
				const numKey = field === 'inflate' ? 'calib0x11InflateCorrect' : 'calib0x11DeflateCorrect'
				let s = String(this[strKey] != null ? this[strKey] : '').trim()
				if (s === '' || s === '-') {
					this[numKey] = 0
					this[strKey] = '0'
					return
				}
				let n = parseInt(s, 10)
				if (Number.isNaN(n)) n = 0
				n = Math.max(-50, Math.min(50, n))
				this[numKey] = n
				this[strKey] = String(n)
			},
			stepCalib0x11Correct(field, delta) {
				if (!this.bleUiReady) return false
				const numKey = field === 'inflate' ? 'calib0x11InflateCorrect' : 'calib0x11DeflateCorrect'
				const strKey = field === 'inflate' ? 'calib0x11InflateCorrectStr' : 'calib0x11DeflateCorrectStr'
				let n = Math.floor(Number(this[numKey]))
				if (Number.isNaN(n)) n = 0
				const next = Math.max(-50, Math.min(50, n + delta))
				if (next === n) return false
				this[numKey] = next
				this[strKey] = String(next)
				return true
			},
			stopCalib0x11StepRepeat() {
				if (this._calib0x11StepDelayTimer != null) {
					clearTimeout(this._calib0x11StepDelayTimer)
					this._calib0x11StepDelayTimer = null
				}
				if (this._calib0x11StepInterval != null) {
					clearInterval(this._calib0x11StepInterval)
					this._calib0x11StepInterval = null
				}
				this._calib0x11StepRepeat = null
			},
			onCalib0x11StepTouchStart(field, delta) {
				if (!this.bleUiReady) return
				this.stopCalib0x11StepRepeat()
				this._calib0x11StepRepeat = { field, delta }
				this._calib0x11StepDelayTimer = setTimeout(() => {
					this._calib0x11StepDelayTimer = null
					const r = this._calib0x11StepRepeat
					if (!r) return
					if (!this.stepCalib0x11Correct(r.field, r.delta)) {
						this.stopCalib0x11StepRepeat()
						return
					}
					this._calib0x11StepInterval = setInterval(() => {
						const cur = this._calib0x11StepRepeat
						if (!cur || !this.stepCalib0x11Correct(cur.field, cur.delta)) {
							this.stopCalib0x11StepRepeat()
						}
					}, 80)
				}, 350)
			},
			onCalib0x11StepTouchEnd() {
				if (this._calib0x11StepDelayTimer != null) {
					const r = this._calib0x11StepRepeat
					clearTimeout(this._calib0x11StepDelayTimer)
					this._calib0x11StepDelayTimer = null
					if (r) this.stepCalib0x11Correct(r.field, r.delta)
				}
				this.stopCalib0x11StepRepeat()
			},
			applyCalib0x11ReadResult(p) {
				if (!p || !p.ok) return
				this.calib0x11Node = p.nodeIndex
				this.calib0x11LevelData = p.levelData
				this.calib0x11InflateCorrect = p.inflateCorrect
				this.calib0x11DeflateCorrect = p.deflateCorrect
				this.calib0x11InflateCorrectStr = String(p.inflateCorrect)
				this.calib0x11DeflateCorrectStr = String(p.deflateCorrect)
			},
			toggleDevCalib0x11Panel() {
				this.devCalib0x11Expanded = !this.devCalib0x11Expanded
			},
			readCalib0x11() {
				if (!this.ensureBleConnected()) return
				this.clampCalib0x11Form()
				PillowBleManager.getInstance().calibrationCorrect0x11({
					read: true,
					nodeIndex: this.calib0x11Node
				})
			},
			writeCalib0x11() {
				if (!this.ensureBleConnected()) return
				this.clampCalib0x11Form()
				PillowBleManager.getInstance().calibrationCorrect0x11({
					read: false,
					nodeIndex: this.calib0x11Node,
					levelData: this.calib0x11LevelData,
					inflateCorrect: this.calib0x11InflateCorrect,
					deflateCorrect: this.calib0x11DeflateCorrect
				})
			},
			/**
			 * 进入手动微调页 onShow：0x04 轮询；进页自动下发一次 0x10（debugMode=1, sleepState=0）。
			 * 此后用户点击头枕（1）或颈枕（2）时再发 0x10；仰卧/侧卧切换不发 0x10。
			 * 头/颈目标高度仅在用户操作（滑条松手、±、保存/不保存流程）时通过 sendCurrentChannelBle / send2Pillow 下发。
			 */
			setupManualAdjustOnShow() {
				if (this._enterCalibrateApplyTimer != null) {
					clearTimeout(this._enterCalibrateApplyTimer);
					this._enterCalibrateApplyTimer = null;
				}
				const ble = PillowBleManager.getInstance();
				if (!ble.isConnected()) {
					return;
				}
				// —— 历史：进页即 0x0A 标定 + 0x05/0x06 写路由高度 ——
				// ble.send(BluePillowProtocol.calibrate(0x01), { silent: true });
				// this.send2Pillow(this.initHeadHeight, ...);
				this.sendManualAdjustSleepState0x10(0)
				this.step = 0
				this.startPillowStatus0x04Polling(0)
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
					this.syncPillowAirFlowIconsFrom04(null)

					if (this._enterCalibrateApplyTimer != null) {
						clearTimeout(this._enterCalibrateApplyTimer);
						this._enterCalibrateApplyTimer = null;
					}
					this.manualCalibrateEntered = false;
				} else if (this.showMeasure) {
					this.startPillowStatus0x04Polling()
				}
			},
			/** 协议高度百分数夹紧到 [MANUAL_MIN_PERCENT, MANUAL_MAX_PERCENT] */
			clampManualPercent(p) {
				const n = Math.floor(Number(p))
				const base = Number.isNaN(n) ? 0 : n
				return Math.max(MANUAL_MIN_PERCENT, Math.min(MANUAL_MAX_PERCENT, base))
			},
			/** 路由入参多为协议 0~100%，映射到 mm（0~100%） */
			routePctToMm(v) {
				const p = this.clampManualPercent(v)
				return Math.round((p / 100) * MANUAL_MAX_MM)
			},
			/** 内部高度 mm 夹紧到 [0, MANUAL_MAX_MM] */
			clampManualHeightMm(v) {
				return Math.max(MANUAL_MIN_MM, Math.min(MANUAL_MAX_MM, Math.round(Number(v) || 0)))
			},
			/** mm → 协议 0x05/0x06/0x02/0x03 用的百分数 0~100 */
			mmToPct(mm) {
				const m = this.clampManualHeightMm(mm)
				return Math.round((m / MANUAL_MAX_MM) * 100)
			},
			/** 设备上报 0~100 为百分数时 → mm；若 >100 视为历史 mm 直夹紧 */
			deviceHeightToMm(v) {
				const n = Number(v) || 0
				if (n <= 100) {
					const p = this.clampManualPercent(n)
					return Math.round((p / 100) * MANUAL_MAX_MM)
				}
				return this.clampManualHeightMm(n)
			},
			/** 有效窗口：与 PillowBleManager 导出的 pillowProfileHeightWindows、applyModeProfileFromItem 一致 */
			heightWindows(headMm, neckMm) {
				return pillowProfileHeightWindows()
			},
			getCurrentChannelMm() {
				if (this.selectHead !== true && this.selectHead !== false) {
					return 0
				}
				if (this.selectIndex === 1) {
					return this.selectHead === true ? this.head : this.neck
				}
				return this.selectHead === true ? this.sideHead : this.sideNeck
			},
			setCurrentChannelMm(mm) {
				if (this.selectHead !== true && this.selectHead !== false) {
					return
				}
				const m = this.clampManualHeightMm(mm)
				if (this.selectIndex === 1) {
					if (this.selectHead === true) this.head = m
					else this.neck = m
				} else {
					if (this.selectHead === true) this.sideHead = m
					else this.sideNeck = m
				}
			},
			/** 协议 0~100% → mm */
			pctToMm(pct) {
				return this.routePctToMm(pct)
			},
			sendCurrentChannelBle() {
				if (this.selectHead !== true && this.selectHead !== false) {
					return
				}
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) return
				const mm = this.getCurrentChannelMm()
				const pct = this.mmToPct(mm)
				if (this.selectIndex === 1) {
					if (this.selectHead === true) {
						ble.send(BluePillowProtocol.headHeight(pct), { silent: true })
					} else {
						ble.send(BluePillowProtocol.neckHeight(pct), { silent: true })
					}
				} else {
					if (this.selectHead === true) {
						ble.send(BluePillowProtocol.headHeight(pct), { silent: true })
					} else {
						ble.send(BluePillowProtocol.neckHeight(pct), { silent: true })
					}
				}
			},
			/** 拖动中只更新本地高度与界面，不下发 BLE */
			onSliderChanging(e) {
				if (!this.bleUiReady || !this.hasAdjustChannelSelected) return
				const v = e.detail.value
				this.setCurrentChannelMm(this.pctToMm(v))
			},
			/** 松手时下发 0x05/0x06 */
			onSliderChange(e) {
				if (!this.ensureBleConnected()) return
				if (!this.ensureAdjustChannelSelected()) return
				const v = e.detail.value
				this.setCurrentChannelMm(this.pctToMm(v))
				this.sendCurrentChannelBle()
			},
			/**
			 * 加减：每次 ±MANUAL_PERCENT_STEP，下发 0x05/0x06
			 * @param {number} direction +1 或 -1
			 * @returns {boolean} 是否实际变化
			 */
			adjustPercentStep(direction) {
				const step = MANUAL_PERCENT_STEP * (direction > 0 ? 1 : -1)
				const prev = this.currentSliderPercent
				const p = this.clampManualPercent(prev + step)
				if (p === prev) return false
				this.setCurrentChannelMm(this.pctToMm(p))
				this.sendCurrentChannelBle()
				return true
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
					} else if (p.funcLogical === 0x11) {
						uni.showToast({ title: '0x11 写入成功', icon: 'none' })
					}
					return;
				}
				if (parsed.type === 'calibration_correct_0x11' && parsed.parsed && parsed.parsed.ok) {
					this.applyCalib0x11ReadResult(parsed.parsed)
					uni.showToast({ title: '0x11 读取成功', icon: 'none' })
					return
				}
				if (parsed.type === 'pillow_status' && parsed.parsed && parsed.parsed.ok) {
					const ws = parsed.parsed.workState;
					this.pillowPressStatus = ws;
					this.syncPillowAirFlowIconsFrom04(parsed.parsed);
				}
			},
			selectHeadHandler(bool) {
				this.selectHead = bool
				this.sendManualAdjustSleepState0x10(bool ? 1 : 2)
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

	.dev-calib-wrap {
		margin: 8rpx 40rpx 0;
	}

	.dev-calib-fold {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18rpx 20rpx;
		background: rgba(255, 255, 255, 0.55);
		border: 1rpx dashed rgba(28, 68, 133, 0.35);
		border-radius: 12rpx;
	}

	.dev-calib-fold-title {
		font-size: 24rpx;
		color: #1c4485;
	}

	.dev-calib-fold-action {
		font-size: 22rpx;
		color: #666;
	}

	.dev-calib-panel {
		margin-top: 12rpx;
		padding: 16rpx 20rpx 20rpx;
		background: rgba(255, 255, 255, 0.72);
		border: 1rpx solid rgba(28, 68, 133, 0.12);
		border-radius: 12rpx;
	}

	.dev-calib-hint {
		font-size: 22rpx;
		color: #888;
		margin-bottom: 12rpx;
		line-height: 1.4;
	}

	.dev-calib-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx 12rpx;
	}

	.dev-calib-field {
		flex: 0 0 calc(50% - 6rpx);
		display: flex;
		align-items: center;
		box-sizing: border-box;
		min-width: 0;
	}

	.dev-calib-label {
		flex: 0 0 72rpx;
		font-size: 24rpx;
		color: #354d5b;
	}

	.dev-calib-field-wide {
		flex: 0 0 100%;
	}

	.dev-calib-stepper {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8rpx;
		min-width: 0;
	}

	.dev-calib-step {
		flex-shrink: 0;
		width: 52rpx;
		height: 52rpx;
		line-height: 52rpx;
		text-align: center;
		font-size: 32rpx;
		color: #3c64d1;
		background: rgba(255, 255, 255, 0.9);
		border: 1rpx solid rgba(93, 143, 248, 0.35);
		border-radius: 8rpx;
	}

	.dev-calib-step-active {
		background: rgba(93, 143, 248, 0.18);
	}

	.dev-calib-input-signed {
		text-align: center;
		min-width: 0;
	}

	.dev-calib-input {
		flex: 1;
		height: 56rpx;
		padding: 0 12rpx;
		font-size: 24rpx;
		background: #fff;
		border: 1rpx solid #d5e0f7;
		border-radius: 8rpx;
	}

	.dev-calib-actions {
		display: flex;
		gap: 16rpx;
		margin-top: 20rpx;
	}

	.dev-calib-btn {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		font-size: 26rpx;
		color: #1c4485;
		background: #e8eef9;
		border-radius: 10rpx;
	}

	.dev-calib-btn-primary {
		color: #fff;
		background: #1c4485;
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
		margin-top: 0;
		padding: 0rpx !important;
		position: relative;
		z-index: 2;
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
		min-height: 100%;
		box-sizing: border-box;
		padding-bottom: 240rpx;

		&.main-dev-tools {
			padding-bottom: 300rpx;
		}

		&.main-dev-tools-open {
			padding-bottom: 560rpx;
		}

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

			.desc1-wrap {
				position: absolute;
				left: 22rpx;
				top: 20rpx;
				z-index: 11;
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: 8rpx;
			}

			.desc-air-icon {
				width: 34rpx;
				height: 34rpx;
				flex-shrink: 0;
			}

			.desc1 {
				font-size: 30rpx;
				color: #354D5B;
			}

			.desc1size {
				font-size: 36rpx;
				position: absolute;
				color: #003C71;
				right: 388rpx;
				top: 18rpx;
				z-index: 11;
			}

			.desc2-wrap {
				position: absolute;
				left: 390rpx;
				top: 47rpx;
				z-index: 11;
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: 8rpx;
			}

			.desc2 {
				font-size: 30rpx;
				color: #354D5B;
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

			.step-btn:active,
			.step-btn-active {
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
		width: 100%;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
		box-sizing: border-box;
		padding: 24rpx 40rpx;
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
		background: transparent;
		pointer-events: none;

		.save,
		.bottom-btn {
			pointer-events: auto;
		}

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
			text-align: center;
			color: white;
			font-size: 28rpx;
			line-height: 1.35;
			margin-top: 0;
			border-radius: 30rpx;
			position: relative;
			z-index: 1;
			box-sizing: border-box;
			/* 文案靠上排布，重叠区内主要为蓝底，避免字叠在白钮之下 */
			display: flex;
			align-items: flex-start;
			justify-content: center;
			padding-top: 22rpx;
		}

		/* 白钮叠在蓝钮下半截之上 */
		.bottom-btn {
			margin-top: -36rpx;
			position: relative;
			z-index: 2;
			font-size: 28rpx;
		}
	}
</style>