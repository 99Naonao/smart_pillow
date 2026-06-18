<template>
	<z-nav-bar backState="1000" fontColor='#000' transparentFixedFontColor='#000'></z-nav-bar>
	<view class="main">
		<view class="info">
			<view class="icon">
				<image class="s-icon0" mode="widthFix" v-if="status==0"
					src="@/page_subject/static/SY_Xuexi04_IconZhentou.png">
				</image>
				<image class="s-icon1" mode="widthFix" v-if="status==1"
					src="@/page_subject/static/SY_Xuexi01_IconTingtang.png">
				</image>
				<image class="s-icon2" mode="widthFix" v-if="status==2 || status==3"
					src="@/page_subject/static/SY_Xuexi03_IconCetang.png">
				</image>
				<image class="s-icon3" mode="widthFix" v-if="status==4"
					src="@/page_subject/static/SY_Xuexi05_IconOK.png">
				</image>

			</view>
			<view class="title">
				<view class="" v-if="status==0">
					请保持枕头空闲
				</view>
				<view class="" v-if="status==1">
					请保持仰卧躺在枕头上
				</view>
				<view class="" v-if="status==2 || status==3">
					请保持侧卧躺在枕头上
				</view>
				<view class="" v-if="status==4">
					学习完成!
				</view>
			</view>
			<view class="tips">
				<view class="" v-if="status==0 && !pendingIdleConfirm">
					注意: 请您暂时不要触碰枕头,让枕头保持空闲状态,准备好后请点击「开始学习」.
				</view>
				<view class="" v-if="status==0 && pendingIdleConfirm">
					注意: 请继续保持枕头空闲,点击下方「确认学习」完成空闲校准.
				</view>
				<view class="" v-if="status==1">
					注意:请您保持放松的仰卧姿势,躺在睡眠枕上,当您准备好了,请点击下方的确认按钮. (如果您不方便操作,也可以让家人帮您按下确认)
				</view>
				<view class="" v-if="status==2">
					注意:请您保持放松的侧卧姿势,左右方向都可以,躺在睡眠枕上,准备好后请点击开始学习.
				</view>
				<view class="" v-if="status==3">
					注意:请保持侧卧,点击下方「确认学习」完成侧卧睡姿确认.
				</view>
				<view class="" v-if="status==4">
					记录了您的睡姿后，眠加睡姿检测更准确了。
				</view>
			</view>
		</view>
		<view class="info">
			<view class="info-btn" v-if="status==4" @click="successHandler">
				学习完毕，返回首页
			</view>
			<view class="info-btn" v-else @click="measureHandler">
				{{ measureButtonText }}
			</view>
		</view>
	</view>
</template>

<script>
	import BluePillowProtocol, { PillowBleManager } from '@/utils/BlueUtils'
	import { maxPostureSampleFromSnap } from '@/common/util.js'
	import {
		addStudyLog
	} from '../../utils/miniapp'

	const LEARN_MODE_SIDE = 0x02
	const LEARN_MODE_SUPINE = 0x01
	/** 0x07 学习模式：空闲（枕头无人）学习 */
	const LEARN_MODE_IDLE_LEARN = 0x03
	const LEARN_ST_START = 0x02
	const LEARN_ST_END = 0x03
	const LEARN_ST_CONFIRM = 0x04
	const LEARN_ST_IDLE = 0x00
	/** 学习页读 0x0B：高优先级 + 自动重试，降低「读取睡姿数据超时」 */
	const STUDY_POSTURE_0B_READ_OPT = {
		silent: true,
		priority: true,
		timeoutMs: 12000,
		retries: 3,
		retryDelayMs: 500
	}

	export default {
		data() {
			return {
				status: 0,
				/** 当前阶段从 0x0B 读取的有效点位数，用于该阶段内连续两次 0x07（开始+确认） */
				lastLearnValidCount: 0,
				/** 空闲阶段：true 表示已发过「开始学习」，下一次点击发「确认学习」 */
				pendingIdleConfirm: false,
				/** 仰卧阶段：true 表示已发过「开始学习」，下一次点击发「确认学习」 */
				pendingSupineConfirm: false,
				/** 空闲校准得到的仰卧峰值1，仰卧学习阶段沿用 */
				idleLearnSupinePeak1: 0,
				/** 学习参数：峰值来自 0x0B，宽度按本地默认/现值下发 */
				learnProfile: {
					supinePeak1: 0,
					supinePeak2: 0,
					supineWidth: 0,
					sidePeak: 0,
					sideWidth: 0
				},
				/** 全流程完成后已下发 0x07 结束学习，避免 onUnload 重复发空闲 */
				learnEndSent: false
			}
		},
		computed: {
			measureButtonText() {
				if (this.status === 0 && this.pendingIdleConfirm) {
					return '确认学习'
				}
				if (this.status === 3) {
					return '确认学习'
				}
				if (this.status === 1 && this.pendingSupineConfirm) {
					return '确认学习'
				}
				return '开始学习'
			}
		},
		onShow() {
			PillowBleManager.getInstance().setPosture0bExternalPollBlocked(true)
			if (!PillowBleManager.getInstance().isConnected()) {
				uni.showToast({ title: '请先连接枕头设备', icon: 'none' })
			}
		},
		onHide() {
			PillowBleManager.getInstance().setPosture0bExternalPollBlocked(false)
		},
		destroyed() {
			console.log('destroyed')
		},
		onUnload() {
			PillowBleManager.getInstance().setPosture0bExternalPollBlocked(false)
			if (!this.learnEndSent) {
				this.exitLearnSession()
			}
		},
		methods: {
			/**
			 * 0x07 备注规则修正：
			 * 1) 仰卧峰值2需 > 仰卧峰值1；若相等则峰值2=峰值1+2（这里对 <= 统一修正）
			 * 2) 侧卧峰值需 > 仰卧峰值2，且两者差值 >= 100
			 */
			normalizeLearnProfileByProtocolRules() {
				const clampU16 = (v) => {
					let n = Number(v)
					if (Number.isNaN(n)) n = 0
					return Math.max(0, Math.min(65535, Math.floor(n)))
				}
				const clampU8 = (v) => {
					let n = Number(v)
					if (Number.isNaN(n)) n = 0
					return Math.max(0, Math.min(255, Math.floor(n)))
				}
				let supinePeak1 = clampU16(this.learnProfile.supinePeak1)
				let supinePeak2 = clampU16(this.learnProfile.supinePeak2)
				let sidePeak = clampU16(this.learnProfile.sidePeak)
				const supineWidth = clampU8(this.learnProfile.supineWidth)
				const sideWidth = clampU8(this.learnProfile.sideWidth)

				if (supinePeak2 <= supinePeak1) {
					supinePeak2 = Math.min(65535, supinePeak1 + 2)
				}
				const minSidePeak = Math.min(65535, supinePeak2 + 100)
				if (sidePeak < minSidePeak) {
					sidePeak = minSidePeak
				}
				this.learnProfile = {
					supinePeak1,
					supinePeak2,
					supineWidth,
					sidePeak,
					sideWidth
				}
			},
			clampLearnProfileRangesOnly() {
				const clampU16 = (v) => {
					let n = Number(v)
					if (Number.isNaN(n)) n = 0
					return Math.max(0, Math.min(65535, Math.floor(n))) 
				}
				const clampU8 = (v) => {
					let n = Number(v)
					if (Number.isNaN(n)) n = 0
					return Math.max(0, Math.min(255, Math.floor(n)))
				}
				this.learnProfile = {
					supinePeak1: clampU16(this.learnProfile.supinePeak1),
					supinePeak2: clampU16(this.learnProfile.supinePeak2),
					supineWidth: clampU8(this.learnProfile.supineWidth),
					sidePeak: clampU16(this.learnProfile.sidePeak),
					sideWidth: clampU8(this.learnProfile.sideWidth)
				}
			},
			/** 睡姿数据最高值：优先统计 validFlags 为真的点位；若无有效位则退回全部 16 点最大值 */
			validPointCountFromSnap(snap) {
				const flags = Array.isArray(snap.validFlags) ? snap.validFlags : []
				let n = 0
				for (let i = 0; i < flags.length; i++) {
					if (Number(flags[i])) n++
				}
				return n
			},
			/**
			 * 空闲：仰卧峰值1 = 最高值+5，仰卧峰值2与侧卧峰值 = 最高值（不做峰值2>峰值1的协议修正，按产品公式原样下发）
			 */
			async applyIdlePeaksFrom0x0B(ble) {
				const snap = await ble.readPostureSnapshot0x0B(STUDY_POSTURE_0B_READ_OPT)
				const validCount = this.validPointCountFromSnap(snap)
				this.lastLearnValidCount = Number(snap.validPointCount) || validCount
				const maxVal = maxPostureSampleFromSnap(snap)
				const m = Math.min(65535, Math.max(0, Math.floor(maxVal)))
				this.learnProfile.supineWidth = 2
				this.learnProfile.sideWidth = 2
				this.learnProfile.supinePeak1 = Math.min(65535, m + 5)
				this.learnProfile.supinePeak2 = m
				this.learnProfile.sidePeak = m
				this.clampLearnProfileRangesOnly()
			},
			/**
			 * 仰卧学习：峰值1 = 空闲校准的仰卧峰值1；峰值2 = 当前 0x0B 睡姿数据最高值
			 */
			async applySupineLearnFrom0x0B(ble) {
				const snap = await ble.readPostureSnapshot0x0B(STUDY_POSTURE_0B_READ_OPT)
				const validCount = this.validPointCountFromSnap(snap)
				this.lastLearnValidCount = Number(snap.validPointCount) || validCount
				const maxVal = maxPostureSampleFromSnap(snap)
				this.learnProfile.supineWidth = 2
				this.learnProfile.sideWidth = 2
				this.learnProfile.supinePeak1 = this.idleLearnSupinePeak1
				this.learnProfile.supinePeak2 = Math.min(65535, Math.max(0, Math.floor(maxVal)))
				this.normalizeLearnProfileByProtocolRules()
			},
			/** 侧卧学习：侧卧峰值 = (睡姿数据最大值 + 仰卧峰值2) / 2 */
			async applySideLearnFrom0x0B(ble) {
				const snap = await ble.readPostureSnapshot0x0B(STUDY_POSTURE_0B_READ_OPT)
				const validCount = this.validPointCountFromSnap(snap)
				this.lastLearnValidCount = Number(snap.validPointCount) || validCount
				const maxVal = maxPostureSampleFromSnap(snap)
				const supinePeak2 = Math.min(
					65535,
					Math.max(0, Math.floor(Number(this.learnProfile.supinePeak2) || 0))
				)
				const sidePeakRaw = Math.floor((maxVal + supinePeak2) / 2)
				this.learnProfile.supineWidth = 2
				this.learnProfile.sideWidth = 2
				this.learnProfile.sidePeak = Math.min(65535, Math.max(0, sidePeakRaw))
				this.normalizeLearnProfileByProtocolRules()
			},
			buildLearnPosturePayload(mode, state) {
				return {
					mode,
					state,
					postureValidLimit: this.lastLearnValidCount,
					supinePeak1: this.learnProfile.supinePeak1,
					supinePeak2: this.learnProfile.supinePeak2,
					supineWidth: this.learnProfile.supineWidth,
					sidePeak: this.learnProfile.sidePeak,
					sideWidth: this.learnProfile.sideWidth
				}
			},
			/** 侧卧全流程确认后：0x07 结束学习（state=0x03） */
			sendLearnEndIfNeeded() {
				if (this.learnEndSent) {
					return
				}
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					return
				}
				ble.learnPosture(this.buildLearnPosturePayload(LEARN_MODE_SIDE, LEARN_ST_END))
				this.learnEndSent = true
			},
			exitLearnSession() {
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					return
				}
				ble.send(BluePillowProtocol.learnPosture({ mode: LEARN_MODE_IDLE_LEARN, state: LEARN_ST_IDLE, postureValidLimit: 0 }), { silent: true })
				ble.send(BluePillowProtocol.learnPosture({ mode: LEARN_MODE_SUPINE, state: LEARN_ST_IDLE, postureValidLimit: 0 }), { silent: true })
				ble.send(BluePillowProtocol.learnPosture({ mode: LEARN_MODE_SIDE, state: LEARN_ST_IDLE, postureValidLimit: 0 }), { silent: true })
			},
			successHandler() {
				this.sendLearnEndIfNeeded()
				addStudyLog({
					status: this.status
				})
				uni.setStorageSync('study_completed', true)
				uni.switchTab({
					url: "/pages/status/status"
				})
			},
			/**
			 * 0x07：空闲 / 仰卧 / 侧卧均先发「开始学习」再「确认学习」；第三字节为 0x0B 有效点位统计。
			 * 空闲：读 0x0B → 峰值1=最高+5，峰值2与侧卧峰值=最高 → 学习模式 0x03 的 0x07 开始/确认。
			 * 仰卧：读 0x0B → 峰值1=空闲峰值1，峰值2=当前最高 → 开始/确认。
			 * 侧卧：读 0x0B → 侧卧峰值=(睡姿最大+仰卧峰值2)/2 → 侧卧模式开始/确认。
			 */
			async measureHandler() {
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					uni.showToast({ title: '请先连接设备', icon: 'none' })
					return
				}
				try {
					if (this.status === 0) {
						if (!this.pendingIdleConfirm) {
							this.pendingSupineConfirm = false
							uni.showLoading({ title: '读取睡姿数据…', mask: true })
							await this.applyIdlePeaksFrom0x0B(ble)
							uni.hideLoading()
							this.idleLearnSupinePeak1 = this.learnProfile.supinePeak1
							ble.learnPosture({
								mode: LEARN_MODE_IDLE_LEARN,
								state: LEARN_ST_START,
								postureValidLimit: this.lastLearnValidCount,
								supinePeak1: this.learnProfile.supinePeak1,
								supinePeak2: this.learnProfile.supinePeak2,
								supineWidth: this.learnProfile.supineWidth,
								sidePeak: this.learnProfile.sidePeak,
								sideWidth: this.learnProfile.sideWidth
							})
							this.pendingIdleConfirm = true
						} else {
							ble.learnPosture({
								mode: LEARN_MODE_IDLE_LEARN,
								state: LEARN_ST_CONFIRM,
								postureValidLimit: this.lastLearnValidCount,
								supinePeak1: this.learnProfile.supinePeak1,
								supinePeak2: this.learnProfile.supinePeak2,
								supineWidth: this.learnProfile.supineWidth,
								sidePeak: this.learnProfile.sidePeak,
								sideWidth: this.learnProfile.sideWidth
							})
							this.pendingIdleConfirm = false
							this.status = 1
							this.pendingSupineConfirm = false
						}
					} else if (this.status === 1) {
						if (!this.pendingSupineConfirm) {
							uni.showLoading({ title: '读取睡姿数据…', mask: true })
							await this.applySupineLearnFrom0x0B(ble)
							uni.hideLoading()
							ble.learnPosture({
								mode: LEARN_MODE_SUPINE,
								state: LEARN_ST_START,
								postureValidLimit: this.lastLearnValidCount,
								supinePeak1: this.learnProfile.supinePeak1,
								supinePeak2: this.learnProfile.supinePeak2,
								supineWidth: this.learnProfile.supineWidth,
								sidePeak: this.learnProfile.sidePeak,
								sideWidth: this.learnProfile.sideWidth
							})
							this.pendingSupineConfirm = true
						} else {
							ble.learnPosture({
								mode: LEARN_MODE_SUPINE,
								state: LEARN_ST_CONFIRM,
								postureValidLimit: this.lastLearnValidCount,
								supinePeak1: this.learnProfile.supinePeak1,
								supinePeak2: this.learnProfile.supinePeak2,
								supineWidth: this.learnProfile.supineWidth,
								sidePeak: this.learnProfile.sidePeak,
								sideWidth: this.learnProfile.sideWidth
							})
							this.pendingSupineConfirm = false
							this.status = 2
						}
					} else if (this.status === 2) {
						uni.showLoading({ title: '读取睡姿数据…', mask: true })
						await this.applySideLearnFrom0x0B(ble)
						uni.hideLoading()
						ble.learnPosture({
							mode: LEARN_MODE_SIDE,
							state: LEARN_ST_START,
							postureValidLimit: this.lastLearnValidCount,
							supinePeak1: this.learnProfile.supinePeak1,
							supinePeak2: this.learnProfile.supinePeak2,
							supineWidth: this.learnProfile.supineWidth,
							sidePeak: this.learnProfile.sidePeak,
							sideWidth: this.learnProfile.sideWidth
						})
						this.status = 3
					} else if (this.status === 3) {
						ble.learnPosture(this.buildLearnPosturePayload(LEARN_MODE_SIDE, LEARN_ST_CONFIRM))
						this.sendLearnEndIfNeeded()
						this.status = 4
					}
				} catch (e) {
					uni.hideLoading()
					console.warn('[study] measureHandler', e)
					const msg = (e && (e.message === 'read_posture_timeout' || e.message === 'read_learn_posture_timeout'))
						? '读取睡姿数据超时'
						: '读取睡姿数据失败'
					uni.showToast({ title: msg, icon: 'none' })
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.main {
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.1);

		.logoleft {
			position: absolute;
			left: 88rpx;
			top: 130rpx;
			width: 161rpx;
			height: 131rpx;

			image {
				width: 100%;
			}
		}

		.icon {
			margin: 20rpx auto;
			width: 121rpx;
			height: 121rpx;
			border-radius: 25rpx;
			background-color: white;
			display: flex;
			justify-content: center;
			align-items: center;

			.s-icon0 {
				width: 66rpx;
				height: 48rpx;
			}

			.s-icon1 {
				width: 66rpx;
				height: 75rpx;
			}

			.s-icon2 {
				width: 66rpx;
				height: 76rpx;
			}

			.s-icon3 {
				width: 55rpx;
				height: 73rpx;
			}
		}

		.info {
			width: 80%;
			margin: 0 auto;
			padding-top: 100rpx;
		}

		.title {
			color: #051C2C;
			font-size: 36rpx;
			text-align: center;
			padding: 20rpx;
		}

		.tips {
			color: rgba(5, 28, 44, 0.7);
			font-size: 28rpx;
			text-align: center;
			padding: 20rpx;
		}

		.info-btn {
			background-color: #4281c1;
			margin: 0 auto;
			color: white;
			width: 400rpx;
			text-align: center;
			font-size: 40rpx;
			padding: 30rpx;
			line-height: 60rpx;
			padding-left: 50rpx;
			padding-right: 50rpx;
			border-radius: 15rpx;
			margin-top: 50rpx;
		}
	}
</style>
