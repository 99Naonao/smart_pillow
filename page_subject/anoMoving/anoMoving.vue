<template>
	<z-nav-bar backState="1000" fontColor='#000' transparentFixedFontColor='#000' type="transparentFixed"></z-nav-bar>
	<view class="container">
		<view class="top-part">
			<view class="linetips">请保持仰卧姿势</view>
			<image class="topKV" :style="menuStyle" mode="widthFix" src="@/static/SY_03_001.png"></image>

			<view class="headInfo" :style="menuStyle">
				<view>头枕高度</view>
				<view>{{ pillowComputeHeight }}mm</view>
			</view>
			<view class="neckInfo" :style="menuStyle">
				<view>颈枕高度</view>
				<view>{{ pillowSideComputeHeight }}mm</view>
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
						<slider value="50" @change="sliderChange" activeColor="#ed6546" backgroundColor="#f9cec6"
							block-color="#ed6546" block-size="20" />
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
					<input class="field-input" type="number" v-model.number="headTargetPct" />
				</view>
				<view class="form-field">
					<text class="field-label">颈枕支撑高度 %</text>
					<input class="field-input" type="number" v-model.number="neckTargetPct" />
				</view>
				<view class="form-field">
					<text class="field-label">颈枕放松高度 %</text>
					<input class="field-input" type="number" v-model.number="neckRelaxPct" />
				</view>
				<view class="form-field">
					<text class="field-label">支撑保持（秒）</text>
					<input class="field-input" type="number" v-model.number="supportHoldSec" />
				</view>
				<view class="form-field">
					<text class="field-label">放松/暂停（秒）</text>
					<input class="field-input" type="number" v-model.number="pauseSec" />
				</view>
				<view class="form-field">
					<text class="field-label">循环次数</text>
					<input class="field-input" type="number" v-model.number="loopCount" />
				</view>
			</view>
			
			<!-- <canvas class="canvas-content" canvas-id="runCanvas" id="runCanvas"></canvas> -->
			<view class="opt flex">
				<view :class="['normal-btn', selectedButton === 'start' ? 'selected' : '']" @click="startHandler">启动</view>
				<view :class="['normal-btn', selectedButton === 'stop' ? 'selected' : '']" @click="stopHandler">停止</view>
				<view :class="['normal-btn', selectedButton === 'back' ? 'selected' : '']" @click="backHandle">返回</view>
			</view>
		</view>
		<!-- <debug-info class="debug-info" ref="debugInfo"></debug-info> -->
	</view>
</template>

<script>
	import { PillowBleManager } from '@/utils/BlueUtils';
	import { stopSpineAdjustSession } from '@/common/spineSession.js';
	import { getMiniProgramEnv } from '@/common/util.js';

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
			}
		},
		computed: {
			pillowComputeHeight() {
				return this.pillowHeight;
			},
			pillowSideComputeHeight() {
				return this.pillowSideHeight;
			},
		},
		onShow() {
			const app = getApp();
			this.$set(this.menuStyle, '--menuButtonTop', (app.globalData.top + 20) + 'px');
			uni.$on('update_pillow_info', this.updateHeightInfo);
			uni.$on('spine_session_stopped', this.onSpineStoppedExternally);
			const ble = PillowBleManager.getInstance();
			if (ble.isConnected()) {
				ble.readPillowStatus({ silent: true });
			}
		},
		onHide() {
			this.abortSpineStartStatusWait({ clearSelectedButton: true });
			this.checkIfSwitchingToModePages();
			uni.$off('update_pillow_info', this.updateHeightInfo);
			uni.$off('spine_session_stopped', this.onSpineStoppedExternally);
		},
		methods: {
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
				this.isSpineAdjusting = false;
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
					if(!this.isSpineAdjusting) return;
					
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
				uni.navigateBack({
					delta: 1
				})
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
				if (this.isSpineAdjusting) {
					uni.showToast({ title: '微调进行中', icon: 'none' });
					return;
				}
				if (this.spineStartAwaitingStatus) {
					return;
				}
				this.selectedButton = 'start';
				const ble = PillowBleManager.getInstance();
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
			background-color: #a79f8a;
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
			background-color: #a79f8a;
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
				color: #354D5B;
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
				background-color: #5B7897;
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
				background-color: #ed6546;
				transform: scale(1.05);
				box-shadow: 0 4rpx 12rpx rgba(237, 101, 70, 0.3);
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
				background-color: rgb(77, 127, 201);
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
				background-color: rgb(77, 127, 201);
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