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
				<image class="s-icon2" mode="widthFix" v-if="status==2"
					src="@/page_subject/static/SY_Xuexi03_IconCetang.png">
				</image>
				<image class="s-icon3" mode="widthFix" v-if="status==3"
					src="@/page_subject/static/SY_Xuexi05_IconOK.png">
				</image>

			</view>
			<view class="title">
				<view class="" v-if="status==0">
					枕头空闲学习
				</view>
				<view class="" v-if="status==1">
					枕头仰卧学习
				</view>
				<view class="" v-if="status==2">
					枕头侧卧学习
				</view>
				<view class="" v-if="status==3">
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
					注意:请您保持放松的侧卧姿势左右方向都可以,躺在睡眠枕上,当您准备好了,请点击下方的确认按钮. (如果您不方便操作,也可以让家人帮您按下确认)
				</view>
				<view class="" v-if="status==3">
					记录了您的睡姿后，眠加睡姿检测更准确了。
				</view>
			</view>
		</view>
		<view class="info">
			<view class="info-btn" v-if="status==3" @click="successHandler">
				学习完毕
			</view>
			<view class="info-btn" v-else @click="measureHandler">
				开始学习
			</view>
		</view>
	</view>
</template>

<script>
	import {
		changeAdjustMode,
		handPillowStudyState
	} from '../../common/util'
	import blue_class from '../../utils/BlueManager'
	import {
		addStudyLog
	} from '../../utils/miniapp'
	export default {
		data() {
			return {
				status: 0,
			}
		},
		onShow() {
			console.log('onShow!')
			// 模式，0--自动，1--手动配置模式，配置其他参数前须切换到该模式
			let arraybuffer = changeAdjustMode(1);
			blue_class.getInstance().write2tooth(arraybuffer)

		},
		destroyed() {
			console.log('destroyed')
		},
		onUnload() {
			console.log('onUnload')
			let arraybuffer = changeAdjustMode(0);
			blue_class.getInstance().write2tooth(arraybuffer)
		},
		onHide() {
			console.log('onHide')
			// let arraybuffer = changeAdjustMode(0);
			// console.log('onhide2!')
			// blue_class.getInstance().write2tooth(arraybuffer)
		},
		methods: {
			successHandler() {
				addStudyLog({
					status: this.status
				})
				uni.switchTab({
					url: "/pages/status/status"
				})
			},
			measureHandler() {
				let arraybuffer1 = handPillowStudyState(this.status);
				blue_class.getInstance().write2tooth(arraybuffer1)
				if (this.status == 0) {
					this.status = 1
				} else if (this.status == 1) {
					this.status = 2;
				} else if (this.status == 2) {
					this.status = 3;
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