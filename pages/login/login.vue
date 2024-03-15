<template>
	<view class="main">
		<view class="">
			<image class="backimg" src="../../static/index/SY_00_000.jpg" mode="widthFix"></image>
		</view>
		<view class="logoTip">
			<image class="logoTipImg" src="../../static/index/SY_00_F01.png" mode="widthFix"></image>
		</view>
		<view class="rotateimgblock">
			<image class="rotateimg" src="../../static/index/SY_00_001.png" mode="widthFix"></image>
		</view>
		<view class="logo">
			<image src="../../static/index/SY_00_logo.png" mode="aspectFit"></image>
		</view>
		<view class="connectBtn" @click="connectHandler">
			<image src="../../static/index/SY_00_button01a.png" mode="aspectFit"></image>
		</view>

		<view style="display: flex; justify-content: center;margin: 12px;">
			<view>原图：</view>
			<image :src="bodyImgUrl" style="width: 100px; height: 100px;" mode="aspectFit" />
		</view>
		<canvas type="webgl" id="webgl" style="width: {{width}}px; height: {{height}}px">
		</canvas>
		<view class="btn-cnt" style="padding-bottom: 200rpx;">
			<button type="primary" @click="startCamera">开始拍照1</button>
			<button type="primary" @click="chooseMedia">选择图片</button>
			<button type="primary" :disabled="bodyImgUrl==''" style="margin-top: 20px;"
				@click="detectbody">开始检测</button>
		</view>


		<!-- 		<view wx:if="{{anchor2DList}}">
		    <view wx:for="{{anchor2DList}}" style="margin: 30px auto; position: relative; width: {{bodyImgWidth}}px; height: {{bodyImgHeight}}px;">
		        <image src="{{bodyImgUrl}}" style="width: {{bodyImgWidth}}px; height: {{bodyImgHeight}}px;" />
		        <view style="position: absolute; left: {{item.origin.x * bodyImgWidth}}px; top: {{item.origin.y * bodyImgHeight}}px; width: {{item.size.width * bodyImgWidth}}px; height: {{item.size.height * bodyImgHeight}}px; border: solid red 2px"></view>
		        <view wx:for="{{item.points}}" wx:key="id" style="position: absolute; left: {{item.x * bodyImgWidth}}px; top: {{item.y * bodyImgHeight}}px; width: 4px; height: 4px; background-color: #00ff00; border-radius: 50%;"></view>
		    </view>
		</view> -->
		<!-- </view> -->
	</view>
</template>

<script>
	// import getBehavior from '../../utils/behavior'
	// import yuvBehavior from '../../utils/yuvBehavior'

	// 引入文件夹
	import {
		createScopedThreejs
	} from 'threejs-miniprogram'

	export default {
		// behaviors: [getBehavior(), yuvBehavior],
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 0,
					onshow: true
				});
			}

			console.log('createScopedThreejs:', createScopedThreejs)
		},
		onShareAppMessage() {


		},
		data() {
			return {
				imgData: '',
				session: '',
				bodyImgUrl: '',
				bodyImgWidth: 0,
				bodyImgHeight: 0,
				bodyImgOriginWidth: 0,
				bodyImgOriginHeight: 0,
			}
		},
		methods: {
			// 开始拍照
			startCamera() {
				uni.navigateTo({
					url: '/pages/camera/camera'
				})
			},
			base64({
				url
			}) {
				return new Promise((resolve, reject) => {
					console.log('url:', url)
					wx.getFileSystemManager().readFile({
						filePath: url, //选择图片返回的相对路径
						encoding: 'base64', //编码格式
						success: res => {
							resolve(res.data)
							// resolve('data:image/' + type.toLocaleLowerCase() + ';base64,' + res.data)
						},
						fail: res => reject(res.errMsg)
					})
				})
			},
			urlTobase64(url) {
				console.log('urlTobase641')
				return new Promise(function(resolve, reject) {
					console.log('urlTobase6421111')
					uni.request({
						url: url,
						responseType: 'arraybuffer', //最关键的参数，设置返回的数据格式为arraybuffer
						// responseType: 'text', //最关键的参数，设置返回的数据格式为arraybuffer
						success: (res) => {
							console.log('urlTobase642')
							//把arraybuffer转成base64
							let base64 = wx.arrayBufferToBase64(res.data);
							// let base65 = String.fromCharCode.apply(null, new Uint16Array(res.data));
							// ArrayBuffer转为字符串，参数为ArrayBuffer对象
							//不加上这串字符，在页面无法显示的哦
							let base64_new = 'data:image/jpeg;base64,' + base64;
							//打印出base64字符串，可复制到网页校验一下是否是你选择的原图片呢
							console.log(base64);
							resolve(base64)
						},
						fail: (error) => {
							console.log('err:', error)
						}
					})
				})
			},
			connectHandler() {
				// this.session = wx.createVKSession({
				// 	track: {
				// 		body: {
				// 			mode: 2
				// 		} // mode: 1 - 使用摄像头；2 - 手动传入图像
				// 	},
				// })


				// // 静态图片检测模式下，每调一次 detectBody 接口就会触发一次 updateAnchors 事件
				// this.session.on('updateAnchors', anchors => {
				// 	console.log('anchors:', anchors)
				// 	// this.anchor2DList = anchors.map(anchor => {
				// 	// 	points: anchor.points, // 关键点坐标
				// 	// 	origin: anchor.origin, // 识别框起始点坐标
				// 	// 	size: anchor.size // 识别框的大小
				// 	// })
				// })
				// return
				uni.chooseImage({
					success: async (chooseImageRes) => {
						const tempFilePaths = chooseImageRes.tempFilePaths;
						console.log('tempFiles:', chooseImageRes.tempFiles);

						wx.getImageInfo({
							src: tempFilePaths[0],
							success: res => {
								const fixWidth = 300
								const {
									width,
									height
								} = res
								console.log('getImageInfo res', res)
								this.bodyImgUrl = tempFilePaths[0];
								console.log('bodyImgUrl', this.bodyImgUrl)
								this.bodyImgWidth = fixWidth;
								this.bodyImgHeight = (fixWidth / width) * height;
								this.bodyImgOriginWidth = width;
								this.bodyImgOriginHeight = height;
								this.detecting(tempFilePaths)
							},
							fail: res => {
								console.error(res)
							}
						})
					}
				})

				// var formData = this.pinData(fileName, file);
				// uni.request({
				// 	url: 'https://192.168.7.221:7379/new_battle/zhBaiduAip',
				// 	method: 'POST',
				// 	data: formData
				// })
				// console.log('1243', zhBaiduAip)

			},
			async detecting(tempFilePaths) {
				let base64 = await this.base64({
					url: tempFilePaths[0]
				});
				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhBaiduAip',
					filePath: tempFilePaths[0],
					name: 'file',
					formData: {
						'fileName': base64,
						'user': 'test',
					},
					success: (uploadFileRes) => {
						let obj = JSON.parse(uploadFileRes.data)
						console.log('success', obj)
						let person = obj.person_info[0]
						let body_parts = person.body_parts
						let left_shoulder = body_parts.left_shoulder
						let right_shoulder = body_parts.right_shoulder
						let leftShoulder = left_shoulder.x;
						let rightShoulder = right_shoulder.x;

						let space = Math.abs(rightShoulder - leftShoulder);
						space = space / this.bodyImgOriginWidth
						space = space.toFixed(2)
						uni.showToast({
							title: '肩宽约:' + space + 'm',
							icon: 'none', //如果要纯文本，不要icon，将值设为'none'
							duration: 5000 //持续时间为 2秒
						})

					},
					fail: () => {
						console.log('fail')
					}
				})
			},
			chooseMedia() {
				if (!this.session) {
					this.session = wx.createVKSession({
						track: {
							body: {
								mode: 1
							} // mode: 1 - 使用摄像头；2 - 手动传入图像
						},
						version: 'v2',
					})


					// 静态图片检测模式下，每调一次 detectBody 接口就会触发一次 updateAnchors 事件
					this.session.on('updateAnchors', anchors => {
						// console.log('anchors:', anchors)
						anchors.forEach(anchor => {

							console.log('anchor.points', anchor.points)

							console.log('anchor.origin', anchor.origin)

							console.log('anchor.size', anchor.size)

							console.log('anchor.angle', anchor.angle)

						})
						// this.anchor2DList = anchors.map(anchor => {
						// 	points: anchor.points, // 关键点坐标
						// 	origin: anchor.origin, // 识别框起始点坐标
						// 	size: anchor.size // 识别框的大小
						// })
					})
				}

				// this.session.start(errno => {
				// 	if (errno) {
				// 		console.log('errno', errno)
				// 		// 如果失败，将返回 errno
				// 	} else {
				// 		// this.session.detectBody({
				// 		// 	frameBuffer: this.imgData.data.buffer,
				// 		// 	width: this.bodyImgOriginWidth,
				// 		// 	height: this.bodyImgOriginHeight,
				// 		// 	scoreThreshold: 0.1, // 评分阈值
				// 		// 	sourceType: 1
				// 		// })
				// 	}
				// })
				// return
				wx.chooseMedia({
					count: 1,
					mediaType: ['image'],
					success: res => {
						console.log('chooseMedia res', res)
						const imgUrl = res.tempFiles[0].tempFilePath
						wx.getImageInfo({
							src: imgUrl,
							success: res => {
								const fixWidth = 300
								const {
									width,
									height
								} = res
								console.log('getImageInfo res', res)
								this.bodyImgUrl = imgUrl;
								console.log('bodyImgUrl', this.bodyImgUrl)
								this.bodyImgWidth = fixWidth;
								this.bodyImgHeight = (fixWidth / width) * height;
								this.bodyImgOriginWidth = width;
								this.bodyImgOriginHeight = height;
							},
							fail: res => {
								console.error(res)
							}
						})

					},
					fail: res => {
						console.error(res)
					}
				})
			},
			async detectbody() {
				if (this.bodyImgUrl) {
					const canvas = wx.createOffscreenCanvas({
						type: '2d',
						width: this.bodyImgOriginWidth,
						height: this.bodyImgOriginHeight,
					})
					const context = canvas.getContext('2d')
					const img = canvas.createImage()
					await new Promise(resolve => {
						img.onload = resolve
						img.src = this.bodyImgUrl
					})

					context.clearRect(0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight)
					context.drawImage(img, 0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight)

					this.imgData = context.getImageData(0, 0, this.bodyImgOriginWidth, this
						.bodyImgOriginHeight)

					console.log('[frameBuffer] --> ', this.imgData.data.buffer)
					console.log('this.session.detectBody', this.session.detectBody)
					console.log('width', this.bodyImgOriginWidth)
					console.log('height', this.bodyImgOriginHeight)


					this.session.start(errno => {
						if (errno) {
							console.log('errno', errno)
							// 如果失败，将返回 errno
						} else {
							this.session.detectBody({
								frameBuffer: this.imgData.data.buffer,
								width: this.bodyImgOriginWidth,
								height: this.bodyImgOriginHeight,
								scoreThreshold: 0.1, // 评分阈值
								sourceType: 1
							})
						}
					})
				}
			},
		}
	}
</script>

<style>
	.main {
		width: 100%;
		height: 100%;
	}

	.logo {
		width: 256rpx;
		height: 101rpx;
		margin: 0 auto;
		margin-top: -450rpx;
	}

	.logo image {
		width: 100%;
		height: 100%;
	}

	.logoTip {
		width: 649rpx;
		height: 200rpx;
		margin: 0 auto;
		margin-top: -200rpx;
	}

	.logoTip image {
		width: 100%;
		height: 100%;
	}

	.connectBtn {
		width: 727rpx;
		height: 188rpx;
		margin: 0 auto;
		margin-top: -0rpx;
	}

	.connectBtn image {
		width: 100%;
		height: 100%;
	}

	.rotateimgblock {
		margin-top: -50rpx;
		width: 750rpx;
		height: 494rpx;
	}

	.rotateimg {
		width: 100%;
		height: 100%;
	}

	.backimg {
		width: 100%;
		display: block;
	}
</style>