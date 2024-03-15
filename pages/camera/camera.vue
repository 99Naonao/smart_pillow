<template>
	<canvas id="canvas1" class="canvas1" type="webgl" disable-scroll="true" @touchend="bindtouchend_callback">
		<cover-view class="cover">
			<cover-image @click="backBtn_callback" aria-role="button" src="/static/camera/back.png" class="back-btn"
				:style="backBtnStyle">
			</cover-image>
			<cover-image :style="frameStyle" class="leftFrame" src="/static/camera/frame.jpg"></cover-image>
			<cover-image :style="frameStyle" class="rightFrame" src="/static/camera/frame.jpg"></cover-image>
			<cover-view class="cover-view">
				<cover-view>测量结果21：{{measureResult}}厘米</cover-view>
			</cover-view>
			<cover-view class="shootBtn" @click="shootBtnHandler" aria-role="button">点我拍照</cover-view>
		</cover-view>
	</canvas>
	<!-- <cover-view class="cover-view">
		<cover-image @click="backBtn_callback" src="/static/camera/back.png" class="back-btn" :style="backBtnStyle">
			<cover-image class="leftFrame" src="/static/camera/frame.jpg"></cover-image>
			<cover-image class="rightFrame" src="/static/camera/frame.jpg"></cover-image>
		</cover-image>
		<cover-view>测量结果1：{{measureResult}}厘米</cover-view>
	</cover-view> -->
</template>

<script>
	import cameraBusiness from '../../utils/cameraBusiness.js';
	// 画布id
	const canvasId = 'canvas1';
	const reticleUrl = '/static/models/reticle.glb';
	export default {
		data() {
			return {
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
					console.log('fuck:', canvas.width, canvas.height)
					// 启动AR会话
					cameraBusiness.initEnvironment(canvas)
					// 加载3D模型
					cameraBusiness.loadModel(reticleUrl, function(model) {
						// 创建AR的坐标系
						cameraBusiness.initWorldTrack(model)
					})
				})
		},
		methods: {
			backBtn_callback() {
				console.log('backBtn_callback')
				uni.navigateBack()
			},
			bindtouchend_callback() {

			},
			shootBtnHandler() {
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
								console.log('1234', res.tempFilePath)
								wx.previewImage({
									urls: [res.tempFilePath],
									current: res.tempFilePath
								})
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
		background: #000000;
		opacity: 0.5;
		padding: 15px;
		position: absolute;
		text-align: center;
		width: 50%;
		margin-left: -25%;
		left: 50%;
		bottom: 50px;
	}
</style>