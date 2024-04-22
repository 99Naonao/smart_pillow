<template>
	<canvas id="canvas1" class="canvas1" type="webgl" disable-scroll="true" @touchend="bindtouchend_callback">
		<cover-view class="cover">
			<cover-image @click="backBtn_callback" aria-role="button" src="/static/camera/back.png" class="back-btn"
				:style="backBtnStyle">
			</cover-image>
			<cover-image class="shootBtn" @click="shootBtnHandler" aria-role="button"
				src="/static/adjust/SY_08A_ButCam01.png"></cover-image>
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
				frontImage: '',
				sideImage: "",
				canvasInstance: '',
				canvasWidth: 1,
				canvasHeight: 1,
				backBtnStyle: {
					'--menuButtonTop': '30px',
					'--menuButtonHeight': '30px',
				},
				frameStyle: {
					'--frameTop': '10px',
				},
				menuButtonHeight: 0,
				measureResult: 0,
			}
		},
		onShow() {
			uni.showToast({
				title: '请拍摄正面照片',
				duration: 3000
			})
		},
		onReady() {
			// 获取小程序右上角胶囊按钮的坐标，用作自定义导航栏。
			const menuButton = wx.getMenuButtonBoundingClientRect()
			this.$set(this.backBtnStyle, '--menuButtonTop', menuButton.top + 'px')
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
			shootSideBtnHandler() {
				console.log('this.canvasInstance1:', this.canvasInstance, this.canvasInstance.id)
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
							success(res) {
								console.log('12345678', res.tempFilePath)

							}
						})
					}
				})
			},
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
									uni.showToast({
										title: '请拍摄侧面照片',
										duration: 3000
									})

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
</style>