<template>
	<z-nav-bar backState="1000" fontColor='#000' transparentFixedFontColor='#000' type="transparentFixed"></z-nav-bar>
	<view class="container">
		<view class="top-part">
			<view class="linetips">请保持仰卧姿势</view>
			<view v-if="isSpineAdjusting" class="spine-active-tip">微调进行中 · 可直接点「停止」结束；启动已禁用直至会话结束</view>
			<image class="topKV" :style="menuStyle" mode="widthFix" src="@/static/SY_03_001.png"></image>

			<view class="headInfo" :style="menuStyle">
				<view>头枕高度</view>
				<view>{{ headHeightPctDisplay }}</view>
			</view>
			<view class="neckInfo" :style="menuStyle">
				<view>颈枕高度</view>
				<view>{{ neckHeightPctDisplay }}</view>
			</view>
		</view>
		<view class="bottom-part">
<!-- 			<view class="desc flex">
				<image mode="widthFix" class="imgicon" src="@/static/index/SY_00A_IconJZWT.png"></image>
				<view class="desc-info">介绍</view>
			</view>
			<view class="mode-part">
				<view class="uni-form-item uni-column">
					<view class="flex mode-title">
						<view>请选择您喜欢的强度</view>
						<view>剩余次数：3</view>
					</view>
					<view class="slide-part">
						<slider value="50" @change="sliderChange" activeColor="#4C8CB6" backgroundColor="rgba(175, 160, 201, 0.35)"
							block-color="#4C8CB6" block-size="20" />
						<view class="flex"
							style="justify-content:space-between;padding-left: 30rpx;padding-right: 30rpx;">
							<view>低</view>
							<view>中</view>
							<view>高</view>
						</view>
					</view>
				</view>

			</view> -->
			<!-- 0x09 脊柱微调：协议称头/颈「支撑高度」+ 颈枕放松高度（0~100%） -->
			<view class="spine-info">
				<view class="form-field">
					<text class="field-label">头枕支撑高度 %</text>
					<input class="field-input" type="number" v-model.number="headTargetPct" @blur="saveSpineFormToStorage" />
				</view>
				<view class="form-field">
					<text class="field-label">颈枕支撑高度 %</text>
					<input class="field-input" type="number" v-model.number="neckTargetPct" @blur="saveSpineFormToStorage" />
				</view>
				<view class="form-field">
					<text class="field-label">颈枕放松高度 %</text>
					<input class="field-input" type="number" v-model.number="neckRelaxPct" @blur="saveSpineFormToStorage" />
				</view>
				<view class="form-field">
					<text class="field-label">支撑保持（秒）</text>
					<input class="field-input" type="number" v-model.number="supportHoldSec" @blur="saveSpineFormToStorage" />
				</view>
				<view class="form-field">
					<text class="field-label">放松/暂停（秒）</text>
					<input class="field-input" type="number" v-model.number="pauseSec" @blur="saveSpineFormToStorage" />
				</view>
				<view class="form-field">
					<text class="field-label">循环次数</text>
					<input class="field-input" type="number" v-model.number="loopCount" @blur="saveSpineFormToStorage" />
				</view>
			</view>
			
			<!-- <canvas class="canvas-content" canvas-id="runCanvas" id="runCanvas"></canvas> -->
			<view class="opt flex">
				<view
					:class="['normal-btn', selectedButton === 'start' ? 'selected' : '', isSpineAdjusting ? 'normal-btn--disabled' : '']"
					@click="startHandler"
				>启动</view>
				<view :class="['normal-btn', selectedButton === 'stop' ? 'selected' : '']" @click="stopHandler">停止</view>
				<view :class="['normal-btn', selectedButton === 'back' ? 'selected' : '']" @click="backHandle">返回</view>
			</view>
		</view>
		<!-- <debug-info class="debug-info" ref="debugInfo"></debug-info> -->
	</view>
</template>

<script>
	import { PillowBleManager } from '@/utils/BlueUtils';
	import { stopSpineAdjustSession, SPINE_FORM_KEY } from '@/common/spineSession.js';
	import { getMiniProgramEnv } from '@/common/util.js';
	import { safeNavigateBack } from '@/common/navigation.js';

	/** 本页停留时周期性读 0x04，保证头/颈高度与设备一致（与首页轮询独立） */
	const SPINE_PAGE_PILLOW_04_POLL_MS = 2000;

	export default {
		data() {
			return {
				pillowSideHeight: 60,
				pillowHeight: 60,
				menuStyle: {
					'--menuButtonTop': '0'
				},
				selectedButton: '',
				/** 0x09 头枕支撑高度 0~100% */
				headTargetPct: 55,
				/** 0x09 颈枕支撑高度 % */
				neckTargetPct: 60,
				/** 0x09 颈枕放松高度 %（uint16，与协议字段一致） */
				neckRelaxPct: 45,
				/** 支撑阶段保持（秒），默认 60 = 1 分钟 */
				supportHoldSec: 60,
				/** 放松/暂停阶段保持（秒） */
				pauseSec: 15,
				/** 循环次数 */
				loopCount: 8,
				isSpineAdjusting: false,
				/** 启动前正在等待 0x04 读应答，避免重复点击 */
				spineStartAwaitingStatus: false,
				spine04PollTimer: null,
			}
		},
		computed: {
			/** 0x04 读应答中的头枕高度（headHeightPct，0~100），未连接时 -- */
			headHeightPctDisplay() {
				const mgr = PillowBleManager.getInstance();
				if (!mgr.isConnected() || !mgr.loginSuccess) {
					return '--';
				}
				const v = Math.round(Number(this.pillowHeight));
				return `${Number.isFinite(v) ? v : 0}%`;
			},
			/** 0x04 读应答中的颈枕高度（neckHeightPct，0~100），未连接时 -- */
			neckHeightPctDisplay() {
				const mgr = PillowBleManager.getInstance();
				if (!mgr.isConnected() || !mgr.loginSuccess) {
					return '--';
				}
				const v = Math.round(Number(this.pillowSideHeight));
				return `${Number.isFinite(v) ? v : 0}%`;
			},
		},
		onShow() {
			const app = getApp();
			this.$set(this.menuStyle, '--menuButtonTop', (app.globalData.top + 20) + 'px');
			this.loadSpineFormFromStorage();
			this.syncSpineAdjustingFromBle();
			this.updateHeightInfo();
			uni.$on('update_pillow_info', this.updateHeightInfo);
			uni.$on('spine_session_stopped', this.onSpineStoppedExternally);
			const ble = PillowBleManager.getInstance();
			if (ble.isConnected()) {
				ble.readPillowStatus({ silent: true });
			}
			this.startSpinePage04Poll();
		},
		onHide() {
			this.stopSpinePage04Poll();
			this.saveSpineFormToStorage();
			this.abortSpineStartStatusWait({ clearSelectedButton: true });
			this.checkIfSwitchingToModePages();
			uni.$off('update_pillow_info', this.updateHeightInfo);
			uni.$off('spine_session_stopped', this.onSpineStoppedExternally);
		},
		methods: {
			startSpinePage04Poll() {
				this.stopSpinePage04Poll();
				const tick = () => {
					const m = PillowBleManager.getInstance();
					if (!m.isConnected() || !m.loginSuccess) {
						return;
					}
					m.readPillowStatus({ silent: true });
				};
				this.spine04PollTimer = setInterval(tick, SPINE_PAGE_PILLOW_04_POLL_MS);
			},
			stopSpinePage04Poll() {
				if (this.spine04PollTimer) {
					clearInterval(this.spine04PollTimer);
					this.spine04PollTimer = null;
				}
			},
			/** 与 PillowBleManager 对齐微调会话状态（离页再进时页面 data 会重置） */
			syncSpineAdjustingFromBle() {
				const adj = PillowBleManager.getInstance().getSpineAdjusting();
				this.isSpineAdjusting = !!adj;
			},
			loadSpineFormFromStorage() {
				try {
					const raw = uni.getStorageSync(SPINE_FORM_KEY);
					if (!raw || typeof raw !== 'object') {
						return;
					}
					const n = (k, def) => {
						const v = Number(raw[k]);
						return Number.isFinite(v) ? v : def;
					};
					this.headTargetPct = n('headTargetPct', this.headTargetPct);
					this.neckTargetPct = n('neckTargetPct', this.neckTargetPct);
					this.neckRelaxPct = n('neckRelaxPct', this.neckRelaxPct);
					this.supportHoldSec = n('supportHoldSec', this.supportHoldSec);
					this.pauseSec = n('pauseSec', this.pauseSec);
					this.loopCount = n('loopCount', this.loopCount);
					this.clampSpineInputs();
				} catch (e) {}
			},
			saveSpineFormToStorage() {
				try {
					uni.setStorageSync(SPINE_FORM_KEY, {
						headTargetPct: this.headTargetPct,
						neckTargetPct: this.neckTargetPct,
						neckRelaxPct: this.neckRelaxPct,
						supportHoldSec: this.supportHoldSec,
						pauseSec: this.pauseSec,
						loopCount: this.loopCount
					});
				} catch (e) {}
			},
			/** B 计划：非正式环境（develop / trial）允许跳过“仰卧位”硬校验。 */
			shouldBypassSupineCheckInSpineAdjust() {
				const env = getMiniProgramEnv();
				return !!(env && !env.isRelease);
			},
			updateHeightInfo() {
				this.$set(this, 'pillowHeight', PillowBleManager.getInstance().pillowHeight);
				this.$set(this, 'pillowSideHeight', PillowBleManager.getInstance().pillowSideHeight);
			},
			/**
			 * 取消「启动」时等待 readPillowStatus/0x04 的状态；会话结束或点停止时若未清掉，会导致 spineStartAwaitingStatus 一直为 true 而无法再次启动。
			 */
			abortSpineStartStatusWait(opt) {
				if (this._spineStartWaitTimer) {
					clearTimeout(this._spineStartWaitTimer);
					this._spineStartWaitTimer = null;
				}
				if (this._spineStatus04Handler) {
					uni.$off('pillow_status_0x04', this._spineStatus04Handler);
					this._spineStatus04Handler = null;
				}
				this.spineStartAwaitingStatus = false;
				if (opt && opt.clearSelectedButton) {
					this.selectedButton = '';
				}
			},
			/** 结束以设备 0x89 读应答剩余次数为 0 为准（见 PillowBleManager），此处仅同步 UI */
			onSpineStoppedExternally(payload) {
				this.abortSpineStartStatusWait();
				this.syncSpineAdjustingFromBle();
				this.selectedButton = '';
				if (payload && payload.reason === 'device_times_zero') {
					uni.showModal({
						title: '温馨提示',
						content: '脊柱微调已结束',
						showCancel: false
					});
				}
			},

			// 检查是否切换到模式相关页面
			checkIfSwitchingToModePages(){
				try{
					if (!PillowBleManager.getInstance().getSpineAdjusting()) return;
					
					// 获取当前页面栈
					const pages = getCurrentPages();
					if(pages && pages.length > 0){
						const currentPage = pages[pages.length - 1];
						const currentRoute = currentPage && currentPage.route ? currentPage.route : '';
						
						// 如果切换到模式相关页面，立即停止脊柱微调
						if (currentRoute.indexOf('page_subject/mode/mode') >= 0 ||
							currentRoute.indexOf('page_subject/mode/setMode') >= 0 ||
							currentRoute.indexOf('page_subject/adjust/adjust') >= 0) {
							console.log('检测到切换到模式/手动微调页面，停止脊柱微调');
							stopSpineAdjustSession({
								emit: true,
								showModal: true,
								modalContent: '已退出脊柱微调模式'
							});
						}
					}
				}catch(e){
					console.error('检查页面切换失败:', e);
				}
			},
			stopSpineAdjustment(showModal) {
				stopSpineAdjustSession({
					emit: true,
					showModal: showModal !== false,
					modalContent: '已退出脊柱微调模式'
				});
			},
			backHandle() {
				this.selectedButton = 'back';
				safeNavigateBack();
			},
			clampSpineInputs() {
				const c = (v) => Math.max(0, Math.min(100, Math.floor(Number(v) || 0)));
				this.headTargetPct = c(this.headTargetPct);
				this.neckTargetPct = c(this.neckTargetPct);
				this.neckRelaxPct = c(this.neckRelaxPct);
				let t1 = Math.max(1, Math.min(65535, Math.floor(Number(this.supportHoldSec) || 60)));
				this.supportHoldSec = t1;
				let t2 = Math.max(0, Math.min(65535, Math.floor(Number(this.pauseSec) || 0)));
				this.pauseSec = t2;
				let lc = Math.max(1, Math.min(255, Math.floor(Number(this.loopCount) || 1)));
				this.loopCount = lc;
			},
			/**
			 * 睡姿 workState 仅在收到 0x04 读应答后更新；停留在本页时若未读 0x04，缓存可能一直是侧卧等旧值。
			 * 启动前先发 readPillowStatus，以本次 notify 为准再判断是否仰卧。
			 */
			startHandler() {
				const ble = PillowBleManager.getInstance();
				this.syncSpineAdjustingFromBle();
				if (ble.getSpineAdjusting()) {
					uni.showToast({ title: '微调进行中', icon: 'none' });
					return;
				}
				if (this.spineStartAwaitingStatus) {
					return;
				}
				this.selectedButton = 'start';
				if (!ble.isConnected()) {
					uni.showToast({ title: '请先连接设备', icon: 'none' });
					this.selectedButton = '';
					return;
				}

				const runAfterFreshStatus = () => {
					this.abortSpineStartStatusWait();
					const bypassSupineCheck = this.shouldBypassSupineCheckInSpineAdjust();
					if (!bypassSupineCheck && ble.getPillowStatus() !== 1) {
						uni.showModal({
							title: '睡姿提醒',
							content: '请保持仰卧（平躺）后再启动脊柱微调',
							showCancel: false,
							confirmText: '我知道了',
							success: () => {
								this.selectedButton = '';
							}
						});
						return;
					}
					if (bypassSupineCheck && ble.getPillowStatus() !== 1) {
						console.log('[spine] 非正式环境：已跳过仰卧位校验，当前姿态=', ble.getPillowStatus());
					}
					this.clampSpineInputs();
					const ok = ble.spineAdjust({
						headHeight: this.headTargetPct,
						neckHeight: this.neckTargetPct,
						neckRelaxHeight: this.neckRelaxPct,
						times: this.loopCount,
						holdTime1: this.supportHoldSec,
						holdTime2: this.pauseSec
					});
					if (!ok) {
						uni.showToast({ title: '发送失败', icon: 'none' });
						this.selectedButton = '';
						return;
					}
					this.isSpineAdjusting = true;
					ble.setSpineAdjusting(true);
					this.saveSpineFormToStorage();
					try {
						uni.setStorageSync('spine_micro_session', { active: true, t: Date.now() });
					} catch (e) {}
					uni.$emit('spine_adjust_started');
				};

				let settled = false;
				const onPillowStatus04 = () => {
					if (settled) {
						return;
					}
					settled = true;
					this.abortSpineStartStatusWait();
					runAfterFreshStatus();
				};
				this._spineStartWaitTimer = setTimeout(() => {
					if (settled) {
						return;
					}
					settled = true;
					this.abortSpineStartStatusWait({ clearSelectedButton: true });
					uni.showToast({ title: '获取睡姿状态超时，请重试', icon: 'none' });
				}, 4000);

				this.spineStartAwaitingStatus = true;
				this._spineStatus04Handler = onPillowStatus04;
				uni.$on('pillow_status_0x04', onPillowStatus04);
				if (!ble.readPillowStatus({ silent: true })) {
					settled = true;
					this.abortSpineStartStatusWait({ clearSelectedButton: true });
					uni.showToast({ title: '发送失败', icon: 'none' });
				}
			},
			stopHandler() {
				this.selectedButton = 'stop';
				this.abortSpineStartStatusWait();
				stopSpineAdjustSession({ emit: true, showToast: '已停止微调' });
				this.syncSpineAdjustingFromBle();
			},
		}
	}
</script>

<style lang="scss" scoped>
	/* .debug-info {} */

	.container {
		// margin-left: 41rpx;
		// margin-right: 41rpx;
		background-color: #dddddd;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;

		.canvas-content {
			position: relative;
			// top: 50%;
			// left: 50%;
			width: 240rpx;
			height: 240rpx;
			// transform: translate(-25%, -25%);
			// width: 320rpx;
			// height: 500rpx;
			// background-color: #ffaaff;
		}


		.linetips {
			width: 100%;
			text-align: center;
			padding-top: 80rpx;
			color: #acacac;
		}

		.spine-active-tip {
			margin: 12rpx 40rpx 0;
			padding: 16rpx 24rpx;
			font-size: 24rpx;
			line-height: 1.45;
			color: #1C6A51;
			background: rgba(28, 106, 81, 0.12);
			border-radius: 12rpx;
			text-align: center;
		}


		.top-part {
			position: relative;
			background-color: #dddddd;
			padding-bottom: 100rpx;

			.topKV {
				width: 100%;
				padding-top: var(--menuButtonTop);
			}


			.tips {
				position: absolute;
				letter-spacing: 1px;
				top: 95rpx;
				left: 49rpx;
				color: white;
			}
		}

		.headInfo {
			position: absolute;
			top: 615rpx;
			left: 45rpx;
			color: white;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #AFA0C9;
			border-radius: 20rpx;
			width: 300rpx;
			height: 68rpx;
		}

		.neckInfo {
			position: absolute;
			top: 615rpx;
			right: 45rpx;
			color: white;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #AFA0C9;
			border-radius: 20rpx;
			width: 300rpx;
			height: 68rpx;
		}

		.bottom-part {
			position: relative;
			background-color: #efefef;
			border-top-left-radius: 30rpx;
			border-top-right-radius: 30rpx;
			flex: 1;

			.spine-info {
				background-color: #ffffff;
				margin: 30rpx;
				padding: 30rpx;
				border-radius: 20rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

				.info-tip {
					font-size: 24rpx;
					color: #666;
					line-height: 1.5;
					margin-bottom: 20rpx;
				}

				.form-field {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 16rpx 0;
					border-bottom: 1rpx solid #f0f0f0;
				}

				.field-label {
					font-size: 28rpx;
					color: #666;
					flex-shrink: 0;
					width: 45%;
				}

				.field-input {
					flex: 1;
					text-align: right;
					font-size: 30rpx;
					min-height: 60rpx;
				}
			}


			.desc {
				display: flex;
				padding: 25rpx;
				margin: 30rpx;
			}

			.desc-info {
				flex: 1;
				padding: 10rpx;
			}

			.slide-part {
				background-color: #ffffff;
				border-radius: 10rpx;
				padding-bottom: 10rpx;
			}


			.mode-part {
				background-color: #ffffff;
				border-radius: 30rpx;
				padding: 30rpx;
				margin: 30rpx;


				.mode-title {
					justify-content: space-between;
					padding: 20rpx;
				}
			}


			.imgicon {
				width: 70rpx;
				// height: 76rpx;
				display: block;
				top: 20rpx;
				left: 20rpx;
			}

			.time-part {
				font-size: 60rpx;
				color: #051C2C;
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				// margin-top: -50rpx;
			}
		}

		.opt {
			display: flex;
			width: 100%;
			justify-content: space-around;
			align-items: center;
			// margin-top: 37rpx;
			position: absolute;
			bottom: 100rpx;

			.icon1 {
				width: 63rpx;
				display: block;
				margin-left: 25rpx;
			}

			.icon2 {
				display: block;
				width: 45rpx;
			}

			.normal-btn {
				width: 200rpx;
				height: 80rpx;
				background-color: rgba(5, 28, 44, 0.7);
				margin: 0 auto;
				line-height: 80rpx;
				text-align: center;
				color: white;
				border-radius: 20rpx;
				letter-spacing: 5rpx;
				font-size: 32rpx;
				transition: all 0.3s ease;
			}

			.normal-btn.selected {
				background-color: #4C8CB6;
				transform: scale(1.05);
				box-shadow: 0 4rpx 12rpx rgba(237, 101, 70, 0.3);
			}

			.normal-btn--disabled {
				opacity: 0.45;
				pointer-events: none;
			}

			.save {
				width: 200rpx;
				height: 80rpx;
				font-size: 32rpx;
				letter-spacing: 5rpx;
				background-color: rgb(153, 134, 191);
				margin: 0 auto;
				line-height: 80rpx;
				text-align: center;
				color: white;
				border-radius: 20rpx;
			}

			.opt-item1 {
				background-color: #4C8CB6;
				border-radius: 15rpx;
				color: white;
				width: 259rpx;
				line-height: 173rpx;
				display: flex;
				font-size: 38rpx;
				letter-spacing: 5rpx;
				justify-content: space-around;
				align-items: center;
			}

			.opt-item {
				background-color: #4C8CB6;
				border-radius: 15rpx;
				color: white;
				width: 329rpx;
				line-height: 173rpx;
				display: flex;
				font-size: 38rpx;
				letter-spacing: 5rpx;
				justify-content: space-around;
				align-items: center;
			}
		}
	}
</style>