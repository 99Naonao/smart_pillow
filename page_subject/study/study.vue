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
				<view class="" v-if="status==0">
					注意: 请您暂时不要触碰枕头,让枕头保持空闲状态,当您准备好了,请点击下方的确认按钮.
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
	import {
		addStudyLog
	} from '../../utils/miniapp'

	const LEARN_MODE_SIDE = 0x02
	const LEARN_MODE_SUPINE = 0x01
	const LEARN_ST_START = 0x02
	const LEARN_ST_CONFIRM = 0x04
	const LEARN_ST_IDLE = 0x00

	export default {
		data() {
			return {
				status: 0,
				/** 当前阶段从 0x0B 读取的有效点位数，用于该阶段内连续两次 0x07（开始+确认） */
				lastLearnValidCount: 0,
				/** 仰卧阶段：true 表示已发过「开始学习」，下一次点击发「确认学习」 */
				pendingSupineConfirm: false,
				/** 学习参数：峰值来自 0x0B 有效点位平均值，宽度按本地默认/现值下发 */
				learnProfile: {
					supinePeak1: 0,
					supinePeak2: 0,
					supineWidth: 0,
					sidePeak: 0,
					sideWidth: 0
				}
			}
		},
		computed: {
			measureButtonText() {
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
			if (!PillowBleManager.getInstance().isConnected()) {
				uni.showToast({ title: '请先连接枕头设备', icon: 'none' })
			}
		},
		destroyed() {
			console.log('destroyed')
		},
		onUnload() {
			this.exitLearnSession()
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
			/**
			 * 从 0x0B 睡姿数据中，取有效点位对应值，升序后取中间值（中位数）作为该姿态峰值
			 * @param {'supine'|'side'} postureType
			 */
			async applyPeakMedianFrom0x0B(ble, postureType) {
				const snap = await ble.readPostureSnapshot0x0B({ silent: true, timeoutMs: 8000 })
				const flags = Array.isArray(snap.validFlags) ? snap.validFlags : []
				const samples = Array.isArray(snap.postureSamples) ? snap.postureSamples : []
				const validValues = []
				for (let i = 0; i < Math.min(flags.length, samples.length); i++) {
					if (Number(flags[i])) {
						validValues.push(Number(samples[i]) || 0)
					}
				}
				validValues.sort((a, b) => a - b)
				const n = validValues.length
				const median = n > 0 ? validValues[Math.floor(n / 2)] : 0
				this.lastLearnValidCount = Number(snap.validPointCount) || n
				// 学习宽度按产品要求固定：仰卧=2，侧卧=1
				this.learnProfile.supineWidth = 5
				this.learnProfile.sideWidth = 2
				if (postureType === 'supine') {
					this.learnProfile.supinePeak1 = median
					this.learnProfile.supinePeak2 = median
				} else {
					this.learnProfile.sidePeak = median
				}
				this.normalizeLearnProfileByProtocolRules()
			},
			exitLearnSession() {
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					return
				}
				ble.send(BluePillowProtocol.learnPosture({ mode: LEARN_MODE_SUPINE, state: LEARN_ST_IDLE, postureValidLimit: 0 }), { silent: true })
				ble.send(BluePillowProtocol.learnPosture({ mode: LEARN_MODE_SIDE, state: LEARN_ST_IDLE, postureValidLimit: 0 }), { silent: true })
			},
			successHandler() {
				addStudyLog({
					status: this.status
				})
				uni.setStorageSync('study_completed', true)
				uni.switchTab({
					url: "/pages/status/status"
				})
			},
			/**
			 * 0x07：每个睡姿先发「开始学习」再发「确认学习」；第三字节为 0x0B 睡姿有效位统计值。
			 * 空闲步：不读 0x0B，仅进入仰卧说明页。
			 * 仰卧：第一次点击读 0x0B → 仰卧开始；第二次点击仰卧确认。
			 * 侧卧：再读 0x0B → 侧卧开始 → 侧卧确认。
			 */
			async measureHandler() {
				const ble = PillowBleManager.getInstance()
				if (!ble.isConnected()) {
					uni.showToast({ title: '请先连接设备', icon: 'none' })
					return
				}
				try {
					if (this.status === 0) {
						this.pendingSupineConfirm = false
						this.status = 1
					} else if (this.status === 1) {
						if (!this.pendingSupineConfirm) {
							uni.showLoading({ title: '读取睡姿数据…', mask: true })
							await this.applyPeakMedianFrom0x0B(ble, 'supine')
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
						await this.applyPeakMedianFrom0x0B(ble, 'side')
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
						ble.learnPosture({
							mode: LEARN_MODE_SIDE,
							state: LEARN_ST_CONFIRM,
							postureValidLimit: this.lastLearnValidCount,
							supinePeak1: this.learnProfile.supinePeak1,
							supinePeak2: this.learnProfile.supinePeak2,
							supineWidth: this.learnProfile.supineWidth,
							sidePeak: this.learnProfile.sidePeak,
							sideWidth: this.learnProfile.sideWidth
						})
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
			color: #354D5B;
			font-size: 36rpx;
			text-align: center;
			padding: 20rpx;
		}

		.tips {
			color: #5B7897;
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
