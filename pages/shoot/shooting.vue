<template>
	<view>
		<canvas type="webgl2" canvas-id="canvas1" id="canvas1" class="canvas1" disable-scroll="true">
			<cover-view class="cover">
				<cover-image @touchend="backBtn_callback" aria-role="button" src="/static/camera/back.png"
					class="back-btn" :style="backBtnStyle">
				</cover-image>
				<cover-view class="shooting-tips" :style="backBtnStyle">{{shootingTips}}</cover-view>
				<cover-image class="shootBtn" @touchend="shootBtnHandler" aria-role="button"
					src="/static/adjust/SY_08A_ButCam01.png"></cover-image>
				<cover-image class="chooseBtn" @touchend="chooseBtnHandler" aria-role="button"
					src="/static/adjust/SY_07_button01a.png"></cover-image>
				<cover-image class="ruler" :style="backBtnStyle" aria-role="button"
					src="/static/adjust/SY_07_Cam00.png"></cover-image>
				<cover-image class="leftcircle" :style="leftBtnStyle" aria-role="button"
					src="/static/SY_07_CamSPY.png"></cover-image>
				<cover-image class="topcircle" :style="topBtnStyle" aria-role="button"
					src="/static/SY_07_CamSPY.png"></cover-image>
				<cover-view class="tips" :style="backBtnStyle">80cm</cover-view>
				<cover-view class="tips2" :style="backBtnStyle">1.请将摄像机画面的左右边缘对准80cm的拍摄顶点</cover-view>
				<cover-view class="tips2 tips3" :style="backBtnStyle">
					2.如果您个人不方便自拍，可请他人使用后置摄像</cover-view>
				<cover-view class="tips2 tips4" :style="backBtnStyle">
					头协助拍摄，以获得准确数据</cover-view>
				<cover-view class="popuptips" v-if="showTips">
					<cover-view class="popup-tips">
						<cover-view class="modal-tips">
							<cover-view class="send-btn">正面已拍摄, 请拍摄侧面照片
							</cover-view>
							<cover-view class="sure-btn" @touchend="closeTipsSave">确定</cover-view>
						</cover-view>
						<cover-image class="titleimg" src="../../static/adjust/SY_05_B001.png"></cover-image>
					</cover-view>
				</cover-view>
			</cover-view>
			<!-- 		<cover-view class="cover" v-else>
				<cover-image @click="backBtn_callback" aria-role="button" src="/static/camera/back.png" class="back-btn"
					:style="backBtnStyle">
				</cover-image>
				<cover-image class="shootBtn" @click="shootSideBtnHandler" aria-role="button"
					src="/static/adjust/SY_08A_ButCam01.png"></cover-image>
			</cover-view> -->
		</canvas>

	</view>
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
				showTips: false, // 显示提示
				shootingTips: '请拍摄正面照片',
				frontImage: '',
				sideImage: "",
				canvasInstance: '',
				canvasID: 0,
				canvasWidth: 1,
				canvasHeight: 1,
				screenWidth: 100,
				screenHeight: 100,
				xx: 0,
				yy: 0,
				backBtnStyle: {
					'--menuButtonTop': '30px',
					'--menuButtonHeight': '30px',
					'--menuButtonTop2': '30px',
					'--menuButtonTop3': '30px',
					'--menuButtonTop4': '30px',
				},
				leftBtnStyle: {
					'--left': '0px',
					'--top': '0px'
				},
				topBtnStyle: {
					'--left': '0px',
					'--top': '0px'
				},
				frameStyle: {
					'--frameTop': '10px',
				},
				menuButtonHeight: 0,
				measureResult: 0,
			}
		},
		onLoad() {
			this.shootingTips = "请拍摄正面照片"
			this.frontImage = ''
			this.sideImage = ''
		},
		onHide() {
			wx.stopAccelerometer()
			wx.offAccelerometerChange(this.refreshAcc);
		},
		onShow() {
			const app = getApp();
			this.screenWidth = app.globalData.screenWidth;
			this.screenHeight = app.globalData.screenHeight;
			wx.startAccelerometer({
				interval: 'ui'
			})

			wx.onAccelerometerChange(this.refreshAcc)
			let scope = 'scope.camera';
			wx.getSetting({
				success: res => {
					if (scope) {
						// 判断是否授权
						if (res.authSetting[scope]) {

						} else {
							wx.authorize({
								scope: 'scope.camera',
								success() {
									uni.showToast({
										title: '同意授权'
									})
								},
								fail() {
									uni.showToast({
										title: '拒绝授权'
									})
								}
							})
						}
						// resolve(res.authSetting[scope])
					} else {
						// resolve(res.authSetting)
					}
				},
				fail: err => {
					reject(err)
				}
			})
		},
		onReady() {
			// 获取小程序右上角胶囊按钮的坐标，用作自定义导航栏。
			const menuButton = wx.getMenuButtonBoundingClientRect()
			this.$set(this.backBtnStyle, '--menuButtonTop', menuButton.top + 'px')
			this.$set(this.backBtnStyle, '--menuButtonTop2', (menuButton.top + 50) + 'px')
			this.$set(this.backBtnStyle, '--menuButtonTop3', (menuButton.top + 20) + 'px')
			this.$set(this.backBtnStyle, '--menuButtonTop4', (menuButton.top + 100) + 'px')
			this.$set(this.backBtnStyle, '--menuButtonHeight', menuButton.height + 'px')
			this.$set(this.frameStyle, '--frameTop', (menuButton.top + menuButton.height + 100) + 'px')
			// 胶囊按钮与手机屏幕顶端的间距
			// this.menuButtonTop = menuButton.top
			// 胶囊按钮的高度
			// this.menuButtonHeight = menuButton.height
			// console.log('onready2:', canvasId, menuButton)
			// 获取画布组件
			const query = wx.createSelectorQuery()
			const selectCanvas = query.select('#' + canvasId)
			const that = this
			selectCanvas.node()
				.exec(res => {
					const canvas = res[0].node
					that.canvasInstance = canvas
					that.canvasID = canvas.id;
					console.log("this.canvasInstance3:", that.canvasInstance, that.canvasID)
					that.canvasWidth = canvas.width
					that.canvasHeight = canvas.height

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
			refreshAcc(obj) {

				// let x = 0;
				// let z = 0;

				const {
					x,
					y,
					z
				} = obj;
				//根据公式计算出角度
				// const rotateXY = Math.atan2(x, y) * 180 / Math.PI;
				// 这里角度就可以赋值到data上，视图层就可以调这个角度了
				this.$set(this.leftBtnStyle, '--left', this.screenWidth / 2 + this.screenWidth / 2 * x + 'px')
				this.$set(this.topBtnStyle, '--top', this.screenHeight / 2 + this.screenHeight / 2 * z + 'px')
				// console.log('refreshAcc', this.screenWidth, this.screenHeight, this.screenWidth / 2 + this.screenWidth /
				// 	2 * x, this.screenHeight / 2 + this
				// 	.screenHeight / 2 * z);
			},
			playAudioEffect() {
				const innerAudioContext = uni.createInnerAudioContext();
				innerAudioContext.autoplay = true;
				innerAudioContext.src = 'static/ding.mp3';
				innerAudioContext.onPlay(() => {
					console.log('开始播放');
				});
				innerAudioContext.onError((res) => {
					console.log(res.errMsg);
					console.log(res.errCode);
				});
			},
			backBtn_callback() {
				console.log('backBtn_callback')
				uni.navigateBack()
			},
			bindtouchend_callback() {
				console.log('bindtouchend_callback')
			},
			closeTipsSave() {
				this.showTips = false;
				// this.$refs.popupTips.close()
			},
			// 相册选择图片
			chooseBtnHandler() {
				uni.chooseImage({
					count: 1,
					sourceType: ['album'],
					success: (res) => {
						console.log('path:', res.tempFilePaths[0])
						let img_url = res.tempFilePaths[0]
						console.log('this.frontImage123:', img_url, this.frontImage)
						if (this.frontImage) {
							this.playAudioEffect()
							this.sideImage = img_url;
							var url_ = '/pages/shootView/shootView' + object2Query({
								sideImage: this.sideImage,
								frontImage: this.frontImage
							})

							uni.redirectTo({
								url: url_
							})
						} else {
							this.playAudioEffect()
							this.frontImage = img_url;
							this.shootingTips = "请拍摄侧面照片"
							this.showTips = true;
							// uni.showToast({
							// 	title: '请拍摄侧面照片',
							// 	duration: 3000
							// })

							// wx.previewImage({
							// 	urls: [this.frontImage],
							// 	current: this.frontImage
							// })
						}

					},
					fail: () => {
						uni.showToast({
							title: '上传失败'
						})
					}
				})
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
			shootBtnIOS(pixel) {
				let that = this;
				uni.canvasToTempFilePath({
					x: 0,
					y: 0,
					width: that.canvasWidth,
					height: that.canvasHeight,
					destWidth: pixel * that.canvasWidth,
					destHeight: pixel * that.canvasHeight,
					canvasId: that.canvasID,
					fileType: 'jpg',
					success: (res) => {
						console.log('this.frontImage:', that.frontImage)
						if (this.frontImage) {
							this.playAudioEffect()
							this.sideImage = res.tempFilePath;
							var url_ = '/pages/shootView/shootView' +
								object2Query({
									sideImage: this.sideImage,
									frontImage: this.frontImage
								})

							uni.redirectTo({
								url: url_
							})
						} else {
							this.playAudioEffect()
							this.frontImage = res.tempFilePath;
							console.log('1234', res.tempFilePath, this
								.frontImage)
							this.shootingTips = "请拍摄侧面照片"
							this.showTips = true;
							// uni.showToast({
							// 	title: '请拍摄侧面照片',
							// 	duration: 3000
							// })

							// wx.previewImage({
							// 	urls: [this.frontImage],
							// 	current: this.frontImage
							// })
						}
					},
					fail(err) {
						console.error(err)
					}
				}, that);
			},
			shootAndriod(pixel, canvas) {
				let that = this;
				uni.canvasToTempFilePath({
					x: 0,
					y: 0,
					width: that.canvasWidth,
					height: that.canvasHeight,
					destWidth: pixel * that.canvasWidth,
					destHeight: pixel * that.canvasHeight,
					canvasId: that.canvasID,
					fileType: 'jpg',
					success: (res) => {
						console.log('this.frontImage:', that.frontImage)
						if (this.frontImage) {
							this.playAudioEffect()
							this.sideImage = res.tempFilePath;
							var url_ = '/pages/shootView/shootView' +
								object2Query({
									sideImage: this.sideImage,
									frontImage: this.frontImage
								})

							uni.redirectTo({
								url: url_
							})
						} else {
							this.playAudioEffect()
							this.frontImage = res.tempFilePath;
							console.log('1234', res.tempFilePath, this
								.frontImage)
							this.shootingTips = "请拍摄侧面照片"
							this.showTips = true;
							// uni.showToast({
							// 	title: '请拍摄侧面照片',
							// 	duration: 3000
							// })

							// wx.previewImage({
							// 	urls: [this.frontImage],
							// 	current: this.frontImage
							// })
						}
					},
					fail(err) {
						console.error(err)
					}
				}, that);
			},
			shootBtnAndroid(pixel) {
				let that = this;
				const query = wx.createSelectorQuery()
				const selectCanvas = query.select('#canvas1')
				// console.log('selectCanvas:', selectCanvas)
				let start = Date.now();
				selectCanvas.node().exec((res) => {
					const canvas = res[0].node
					const gl = canvas.getContext('webgl2')
					gl.canvas.id = res[0].node.id
					console.log('time lap 0:', Date.now() - start);
					const imageData = cameraBusiness.renderFrame();
					console.log('time lap 01111:', Date.now() - start);
					// console.log('gltodataurl:', gl.canvas.toDataURL())
					// const imageData = gl.canvas.toDataURL();
					// that.shootAndriod(pixel, canvas);
					// return;
					console.log('time lap 1:', Date.now() - start);
					const imageData2 = imageData.replace(/^data:image\/\w+;base64,/, "");
					console.log('time lap 2:', Date.now() - start);
					const time = new Date().getTime();
					let imgPath = wx.env.USER_DATA_PATH + "/poster_" + time + "_shoot" + ".png";
					const fs = wx.getFileSystemManager();
					fs.writeFileSync(imgPath, imageData2, "base64");
					console.log('time lap 3:', Date.now() - start);
					// console.log('writeFileSync123:', imgPath)
					fs.close()

					wx.getImageInfo({
						src: imgPath,
						success: res => {
							console.error('success', res)
						},
						fail(res) {
							console.error("getImageInfo:", res)
						}
					})


					if (this.frontImage) {
						this.playAudioEffect()
						this.sideImage = imgPath;
						var url_ = '/pages/shootView/shootView' +
							object2Query({
								sideImage: this.sideImage,
								frontImage: this.frontImage
							})

						uni.redirectTo({
							url: url_
						})
					} else {
						this.playAudioEffect()
						this.frontImage = imgPath;
						console.log('1234', imgPath, this
							.frontImage)
						this.shootingTips = "请拍摄侧面照片"
						this.showTips = true;
						// uni.showToast({
						// 	title: '请拍摄侧面照片',
						// 	duration: 3000
						// })

						// wx.previewImage({
						// 	urls: [this.frontImage],
						// 	current: this.frontImage
						// })
					}
				})
				that.canvasInstance.width = that
					.canvasWidth
				that.canvasInstance.height = that
					.canvasHeight
			},
			shootBtnHandler() {
				// console.log('this.canvasInstance1:', this.canvasInstance, this.canvasInstance.id)
				let that = this;
				wx.getSystemInfo({
					success: (res) => {
						let pixel = res.pixelRatio
						let platform = res.platform;
						if (platform == 'ios') {
							this.shootBtnIOS(pixel)
						} else {
							this.shootBtnAndroid(pixel)
						}
						// console.log("shootBtnHandler11:", platform, that.canvasInstance, that.canvasID, pixel,
						// 	that
						// 	.canvasWidth, that
						// 	.canvasHeight)
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

	.circle {
		width: 181rpx;
		height: 181rpx;
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

	.leftcircle {
		position: absolute;
		top: 50%;
		width: 181rpx;
		height: 181rpx;
		transform: translateX(-90rpx) translateY(-90rpx);
		left: var(--left);
	}

	.topcircle {
		position: absolute;
		left: 50%;
		width: 181rpx;
		height: 181rpx;
		transform: translateX(-90rpx) translateY(-90rpx);
		top: var(--top);
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
		top: var(--menuButtonTop4);
	}

	.tips {
		position: absolute;
		left: 0;
		right: 0;
		font-size: 40rpx;
		text-align: center;
		top: var(--menuButtonTop3);
	}

	.popuptips {
		position: relative;
		left: 0;
		top: 0;
		bottom: 0;
		right: 0;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.8);
	}

	.popup-tips {
		position: relative;
		padding: 20rpx;
		top: 35%;
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
			top: 0rpx;
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
</style>