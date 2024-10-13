<template>
	<canvas id="canvas1" class="canvas1" type="webgl" disable-scroll="true" @touchend="bindtouchend_callback">
		<cover-view class="cover">
			<cover-image @click="backBtn_callback" aria-role="button" src="/static/camera/back.png" class="back-btn"
				:style="backBtnStyle">
			</cover-image>
			<cover-view class="shooting-tips">{{shootingTips}}</cover-view>
			<cover-image class="shootBtn" @click="shootBtnHandler" aria-role="button"
				src="/static/adjust/SY_08A_ButCam01.png"></cover-image>
			<cover-image class="chooseBtn" @click="chooseBtnHandler" aria-role="button"
				src="/static/adjust/SY_07_button01a.png"></cover-image>
			<cover-image class="ruler" :style="backBtnStyle" aria-role="button"
				src="/static/adjust/SY_07_Cam00.png"></cover-image>
			<cover-view class="tips" :style="backBtnStyle">80cm</cover-view>
			<cover-view class="tips2" :style="backBtnStyle">1.请将摄像机画面的左右边缘对准80cm的拍摄顶点</cover-view>
			<cover-view class="tips2 tips3" :style="backBtnStyle">
				2.如果您个人不方便自拍，可请他人使用后置摄像</cover-view>
			<cover-view class="tips2 tips4" :style="backBtnStyle">
				头协助拍摄，以获得准确数据</cover-view>
		</cover-view>
		<!-- 		<cover-view class="cover" v-else>
			<cover-image @click="backBtn_callback" aria-role="button" src="/static/camera/back.png" class="back-btn"
				:style="backBtnStyle">
			</cover-image>
			<cover-image class="shootBtn" @click="shootSideBtnHandler" aria-role="button"
				src="/static/adjust/SY_08A_ButCam01.png"></cover-image>
		</cover-view> -->
	</canvas>
</template>

<script>
	import {
		object2Query
	} from '../../common/util.js';
	import cameraBusiness from '../../utils/cameraBusiness.js';
	// 画布id
	const canvasId = 'canvas1';
	const reticleUrl = '/static/models/reticle.glb';
	export default {
		data() {
			return {
				shootingTips: '请拍摄正面照片',
				frontImage: '',
				sideImage: "",
				canvasInstance: '',
				canvasWidth: 1,
				canvasHeight: 1,
				backBtnStyle: {
					'--menuButtonTop': '30px',
					'--menuButtonHeight': '30px',
					'--menuButtonTop2': '30px',
					'--menuButtonTop3': '30px',
				},
				frameStyle: {
					'--frameTop': '10px',
				},
				menuButtonHeight: 0,
				measureResult: 0,
			}
		},
		onShow() {
			// uni.showToast({
			// 	title: '请拍摄正面照片',
			// 	duration: 3000
			// })

			this.shootingTips = "请拍摄正面照片"
		},
		onReady() {
			// 获取小程序右上角胶囊按钮的坐标，用作自定义导航栏。
			const menuButton = wx.getMenuButtonBoundingClientRect()
			this.$set(this.backBtnStyle, '--menuButtonTop', menuButton.top + 'px')
			this.$set(this.backBtnStyle, '--menuButtonTop2', (menuButton.top + 50) + 'px')
			this.$set(this.backBtnStyle, '--menuButtonTop3', (menuButton.top + 20) + 'px')
			this.$set(this.backBtnStyle, '--menuButtonHeight', menuButton.height + 'px')
			this.$set(this.frameStyle, '--frameTop', (menuButton.top + menuButton.height + 100) + 'px')
			// 胶囊按钮与手机屏幕顶端的间距
			// this.menuButtonTop = menuButton.top
			// 胶囊按钮的高度
			// this.menuButtonHeight = menuButton.height
			console.log('onready:', menuButton)
			// 获取画布组件
			wx.createSelectorQuery()
				.select('#' + canvasId)
				.node()
				.exec(res => {
					const canvas = res[0].node
					this.canvasInstance = canvas
					this.canvasWidth = canvas.width
					this.canvasHeight = canvas.height
					// 启动AR会话
					cameraBusiness.initEnvironment(canvas)
					// 加载3D模型
					// cameraBusiness.loadModel(reticleUrl, function(model) {
					// 创建AR的坐标系
					// 	cameraBusiness.initWorldTrack(model)
					// })
				})
		},
		methods: {
			backBtn_callback() {
				console.log('backBtn_callback')
				uni.navigateBack()
			},
			bindtouchend_callback() {
				console.log('bindtouchend_callback')
			},
			chooseBtnHandler() {

			},
			// shootSideBtnHandler() {
			// 	console.log('this.canvasInstance1:', this.canvasInstance, this.canvasInstance.id)
			// 	wx.getSystemInfo({
			// 		success: (res) => {
			// 			let pixel = res.pixelRatio
			// 			wx.canvasToTempFilePath({
			// 				x: 0,
			// 				y: 0,
			// 				width: this.canvasWidth,
			// 				height: this.canvasHeight,
			// 				destWidth: pixel * this.canvasWidth,
			// 				destHeight: pixel * this.canvasHeight,
			// 				canvasId: this.canvasInstance.id,
			// 				success(res) {
			// 					console.log('12345678', res.tempFilePath)
			// 					this.sideImage = res.tempFilePath;
			// 				}
			// 			})
			// 		}
			// 	})
			// },
			shootBtnHandler() {
				// console.log('this.canvasInstance1:', this.canvasInstance, this.canvasInstance.id)
				wx.getSystemInfo({
					success: (res) => {
						let pixel = res.pixelRatio
						wx.canvasToTempFilePath({
							x: 0,
							y: 0,
							width: this.canvasWidth,
							height: this.canvasHeight,
							destWidth: pixel * this.canvasWidth,
							destHeight: pixel * this.canvasHeight,
							canvasId: this.canvasInstance.id,
							success: (res) => {
								console.log('this.frontImage:', this.frontImage)
								if (this.frontImage) {
									this.sideImage = res.tempFilePath;
									var url_ = '/pages/shootView/shootView' + object2Query({
										sideImage: this.sideImage,
										frontImage: this.frontImage
									})

									uni.redirectTo({
										url: url_
									})
								} else {
									this.frontImage = res.tempFilePath;
									console.log('1234', res.tempFilePath, this.frontImage)
									this.shootingTips = "请拍摄侧面照片"
									// uni.showToast({
									// 	title: '请拍摄侧面照片',
									// 	duration: 3000
									// })

									// wx.previewImage({
									// 	urls: [this.frontImage],
									// 	current: this.frontImage
									// })
								}
							}
						})
					}
				})
			}
		},
	}
</script>

<style>
	.canvas1 {
		position: absolute;
		height: 100%;
		width: 100%;
	}

	.cover {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.cover-view {
		color: #00B0CF;
		background: #000000;
		opacity: 0.5;
		padding: 15px;
		position: absolute;
		text-align: center;
		width: 50%;
		margin-left: -25%;
		left: 50%;
		bottom: 100px;
	}
</style>

<style lang="scss" scoped>
	.back-btn {
		position: absolute;
		margin-left: 10rpx;
		width: var(--menuButtonHeight);
		height: var(--menuButtonHeight);
		width: 64rpx;
		height: 64rpx;
		margin-top: var(--menuButtonTop);
	}

	.leftFrame {
		width: 10rpx;
		height: 297rpx;
		position: absolute;
		left: 20rpx;
		top: var(--frameTop);
	}

	.rightFrame {
		width: 10rpx;
		height: 297rpx;
		position: absolute;
		right: 20rpx;
		top: var(--frameTop);
	}

	.chooseBtn {
		color: #ffffff;
		opacity: 1;
		// padding: 15px;
		position: absolute;
		text-align: center;
		left: 20rpx;
		bottom: 60px;
		// margin-left: -52rpx;
		width: 104rpx;
		height: 103rpx;
	}

	.tips2 {
		color: #fff;
		position: absolute;
		text-align: left;
		width: 100%;
		bottom: 180px;
		font-size: 30rpx;
		line-height: 40rpx;
		margin-left: 20rpx;

		white-space: pre-wrap;
	}

	.tips3 {
		bottom: 160px;
	}

	.tips4 {
		bottom: 140px;
	}

	.shootBtn {
		color: #ffffff;
		opacity: 1;
		// padding: 15px;
		position: absolute;
		text-align: center;
		left: 50%;
		bottom: 50px;
		margin-left: -71rpx;
		width: 142rpx;
		height: 143rpx;
	}

	.ruler {
		position: absolute;
		left: 0;
		right: 0;
		width: 750rpx;
		height: 76rpx;
		top: var(--menuButtonTop2);
	}

	.shooting-tips {
		position: absolute;
		left: 0;
		right: 0;
		width: 100%;
		text-align: center;
		color: white;
		top: var(--menuButtonTop2);
	}

	.tips {
		position: absolute;
		left: 0;
		right: 0;
		font-size: 40rpx;
		text-align: center;
		top: var(--menuButtonTop3);
	}
</style>