<template>
	<!-- <Nav :wrap-style="navWrapStyle" :propPillowName="pillowName"></Nav> -->
	<!-- 	<nav-bar title-text="自定义导航栏" back-icon="/images/back.png" home-icon="/images/home_icon.png" background="#f2f2f2"
		bindback="back" /> -->
	<!-- 	<NavBar title-text="自定义导航栏" back-icon="/static/index/SY_04_buttonRETa.png" home-icon="/images/home_icon.png"
		background="#f2f2f2" bindback="back"></NavBar> -->
	<view class="main">
		<view class="select-part">
			<view :class="this.selectIndex==1?'select-btn':'select-btn unselect-btn'" @click="selectHandler(1)">
				<image mode="widthFix" class="icon1" :src="'../static/adjust/SY_11_IconYWb.png'"></image>
				<label>仰卧调节</label>
			</view>
			<view :class="this.selectIndex==2?'select-btn':'select-btn unselect-btn'" @click="selectHandler(2)">
				<image mode="widthFix" class="icon2" :src="'../static/adjust/SY_11_IconCWb.png'"></image>
				<label>侧卧调节</label>
			</view>
		</view>
		<view class="info-part">
			<view class="info-second-part">
				<label class='desc1'>脖颈部</label>
				<label class='desc1size'>{{this.selectIndex==1?this.neck:this.sideNeck}}%</label>
				<label class='desc2'>头枕部</label>
				<label class='desc2size'>{{this.selectIndex==1?this.head:this.sideHead}}%</label>
				<image class="main-icon" :src="'../static/adjust/SY_11_DITU.png'"></image>
				<image class="down-icon" :src="'../static/adjust/SY_11_DOW.png'"></image>
				<image class="up-icon" :src="'../static/adjust/SY_11_UP.png'"></image>
				<image class="bzb-icon" :src="'../static/adjust/SY_11_buttonBZb.png'"></image>
				<image class="tzb-icon" :src="'../static/adjust/SY_11_buttonTZb.png'"></image>
				<view :class="this.selectHead?'bo bo-left':'bo bo-left select'" @click="selectHeadHandler(false)">
					脖枕
				</view>
				<view :class="this.selectHead?'bo bo-right select':'bo bo-right'" @click="selectHeadHandler(true)">
					头枕
				</view>
			</view>
			<view class="opt-part">
				<!-- 				<button class="opt-btn" hover-class="is-hover">
					<image mode="widthFix" class="icon" style="transform: rotate(-180deg);"
						:src="'../static/adjust/SY_11_butUP.png'"></image>升高
				</button> -->
				<view class="opt-btn" @click="adjustHighSleepHandler">
					<image mode="widthFix" class="icon" style="transform: rotate(-180deg);"
						:src="'../static/adjust/SY_11_butUP.png'"></image>
					<label>升高</label>
				</view>
				<view class="opt-btn" @click="adjustLowSleepHandler">
					<image mode="widthFix" class="icon" :src="'../static/adjust/SY_11_butUP.png'">
					</image>
					<label>降低</label>
				</view>
			</view>
			<view class="bottom-part">
				<view class="save">保存</view>
			</view>
		</view>
	</view>

</template>

<script>
	import Nav from '@/comp/Nav';
	import NavBar from '@/comp/NavBar'
	import {
		handPillowSideState,
		handPillowFrontState,
		handlePillowDelayState,
		hexStringToArrayBuffer,
		ab2hex,
		hand1Shake,
		write2tooth,
		parsePillowState
	} from '@/common/util.js'
	export default {
		components: {
			Nav,
			NavBar
		},
		data() {
			return {
				pillowName: '',
				selectIndex: 1,
				selectHead: true, // 是否选中调整头枕，否则是脖枕
				head: 0,
				sideHead: 0,
				neck: 0,
				sideNeck: 0
			}
		},
		onLoad(options) {
			this.pillowName = options.pillowName || ''
			uni.setNavigationBarTitle({
				title: this.pillowName
			})
		},
		methods: {
			selectHeadHandler(bool) {
				this.selectHead = bool
			},
			selectHandler(index) {
				this.selectIndex = index
			},
			// 调低枕头
			adjustLowSleepHandler() {
				console.log('调低:', this.head, this.neck)
				let arraybuffer
				// 如果选择的仰卧
				if (this.selectIndex == 1) {
					// 如果选择的是调整头枕
					if (this.selectHead) {
						this.head -= 1
						if (this.head <= 0) {
							this.head = 0
						}
					} else {
						this.neck -= 1
						if (this.neck <= 0) {
							this.neck = 0
						}
					}
					arraybuffer = handPillowFrontState(this.head, this
						.neck)
				} else {
					// 如果选择的侧卧
					if (this.selectHead) {
						this.sideHead -= 1
						if (this.sideHead <= 0) {
							this.sideHead = 0
						}
					} else {
						this.sideNeck -= 1
						if (this.sideNeck <= 0) {
							this.sideNeck = 0
						}
					}

					arraybuffer = handPillowSideState(this.sideHead, this
						.sideNeck)
				}
				console.log('调低:', ab2hex(arraybuffer))
				write2tooth(this.deviceId, this.serviceId, this.characteristicId, arraybuffer)
			},
			// 调高枕头
			adjustHighSleepHandler() {
				console.log('调高:', this.head, this.neck)
				let arraybuffer

				// 如果选择的仰卧
				if (this.selectIndex == 1) {
					if (this.selectHead) {
						this.head += 1
						if (this.head >= 100) {
							this.head = 100
						}
					} else {
						this.neck += 1
						if (this.neck >= 100) {
							this.neck = 100
						}
					}
					arraybuffer = handPillowFrontState(this.head, this
						.neck)
				} else {
					if (this.selectHead) {
						this.sideHead += 1
						if (this.sideHead >= 100) {
							this.sideHead = 100
						}
					} else {
						this.sideNeck += 1
						if (this.sideNeck >= 100) {
							this.sideNeck = 100
						}
					}
					// 如果选择的侧卧
					arraybuffer = handPillowSideState(this.sideHead, this
						.sideNeck)
				}
				console.log('调高:', ab2hex(arraybuffer))
				write2tooth(this.deviceId, this.serviceId, this.characteristicId, arraybuffer)
			},
		}
	}
</script>

<style lang="scss">
	.selected {
		background-color: #5B7897;
	}

	.unselect-btn {
		background-color: #5B7897 !important;
	}

	.select-btn {
		background-color: rgb(238, 126, 39);
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

	.main {
		background-color: rgb(216, 226, 246);
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
			height: 197rpx;
			margin-top: 100rpx;
			color: #5B7897;

			.bo {
				width: 128rpx;
				height: 76rpx;
				background-color: #5B7897;
				color: white;
				text-align: center;
				line-height: 76rpx;
				border-radius: 30rpx 30rpx;
			}

			.bo-left {
				position: absolute;
				left: 115rpx;
				top: 108rpx;
			}

			.bo-right {
				position: absolute;
				right: 100rpx;
				top: 108rpx;
			}

			.select {
				background-color: white;
				color: #5B7897;
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

			.desc1 {
				font-size: 30rpx;
				left: 22rpx;
				top: -35rpx;
				position: absolute;
			}

			.desc1size {
				font-size: 36rpx;
				position: absolute;
				right: 388rpx;
				top: -38rpx;
			}

			.desc2 {
				position: absolute;
				color: #5B7897;
				left: 375rpx;
				top: -35rpx;
				font-size: 30rpx;
			}

			.desc2size {
				font-size: 36rpx;
				position: absolute;
				right: 43rpx;
				top: -38rpx;
			}

			.main-icon {
				width: 634rpx;
				height: 197rpx;
			}

			.up-icon {
				width: 24rpx;
				height: 76rpx;
				position: absolute;
				left: 30rpx;
				top: 100rpx;
			}

			.down-icon {
				width: 24rpx;
				height: 77rpx;
				position: absolute;
				right: 27rpx;
				top: 100rpx;
			}
		}

		.opt-part {
			display: flex;
			justify-content: space-around;
			margin-top: 100rpx;

			.opt-btn {
				width: 284rpx;
				height: 90rpx;
				display: flex;
				justify-content: space-around;
				align-items: center;
				background-color: #5B7897;
				border-radius: 30rpx;
				line-height: 56rpx;
				color: white;

				label {
					margin-left: -55rpx;
				}
			}

			.icon {
				width: 56rpx;
				height: 56rpx;
			}
		}
	}


	.bottom-part {
		background-color: white;
		height: 300rpx;
		width: 100%;
		position: fixed;
		bottom: 0rpx;
		border-radius: 50rpx 50rpx 0rpx 0rpx;

		.save {
			width: 670rpx;
			height: 102rpx;
			background-color: #5B7897;
			margin: 0 auto;
			line-height: 102rpx;
			text-align: center;
			color: white;
			margin-top: 80rpx;
			border-radius: 50rpx;

		}
	}
</style>