<template>
	<Nav></Nav>
	<view class="main" v-if="showFront">
		<view class="frontPic" :style="frontImageStyle">
			<image :src="bodyImgUrl" mode="widthFix"></image>
			<view class="info-part" :style="frontImageStyle" v-if="bodyImgUrl!=''">
				<view class="wrap shoulderLeftWrap" :style="shoulderLeftWrapStyle">
					<view class="circle"></view>
					<view class="tips">右肩</view>
					<!-- <view>{{shoulderSpace}}{{unitDesc}}</view> -->
				</view>
				<view class="wrap shoulderRightWrap" :style="shoulderRightWrapStyle">
					<view class="circle"></view>
					<view class="tips">左肩</view>
					<!-- <view>{{shoulderSpace}}{{unitDesc}}</view> -->
				</view>
				<view class="wrap shoulderLeftEarWrap" :style="shoulderLeftEarWrapStyle">
					<view class="circle"></view>
					<view class="tips">左耳</view>
					<!-- <view>{{frontRightPart}}{{unitDesc}}</view> -->
				</view>
				<view class="wrap shoulderRightEarWrap" :style="shoulderRightEarWrapStyle">
					<view class="circle"></view>
					<view class="tips tips-left">右耳</view>
					<!-- <view>{{frontRightPart}}{{unitDesc}}</view> -->
				</view>
				<!-- <view wx:for="{{markList}}" class="marker">123</view> -->
			</view>
		</view>
		<view class="uni-common-mt">
			<view class="uni-form-item uni-column">
				<view class="title" style="text-align: left;padding: 20rpx;font-weight: 600;">
					<p>正面信息（照片以0.8米宽度为参照物计算结果）:</p>
				</view>
				<block></block>
				<view>
					<view class="impress"><label class="title">右耳朵到右肩:</label><label
							class="sizeImpress">{{frontRightPart}}{{unitDesc}}</label></view>
					<view><label class="title">肩宽:</label>{{shoulderSpace}}{{unitDesc}}</view>
					<view><label class="title">左耳朵到左肩:</label>{{frontLeftPart}}{{unitDesc}}</view>
					<!-- 					<view><label class="title">脖子中心到左肩:</label>{{frontLeftNeckPart}}{{unitDesc}}</view>
					<view><label class="title">脖子中心到右肩:</label>{{frontRightNeckPart}}{{unitDesc}}</view> -->
				</view>
			</view>
		</view>

		<view class="btn-cnt flex" style="padding-bottom: 200rpx;">
			<button class="normal-btn" @click="startCamera">{{bodyImgUrl==''?'开始测量':'重新测量'}}</button>
			<button class="normal-btn" @click="handleClick">手动微调</button>
			<button class="save" @click="saveHandler">存储</button>
		</view>
	</view>
	<view class="main" v-else>
		<view style="text-align: center;padding: 20rpx;font-weight: 600;"><label class="title">侧面图片</label></view>
		<view class="frontPic" :style="sideImageStyle">
			<image :src="sideBodyImgUrl" mode="widthFix"></image>
			<view class="wrap headPointWrap" :style="headPointWrapStyle" v-if="sideBodyImgUrl!=''">
				<view class="circle"></view>
				<view class="tips" :class="sideForward=='left'? 'tips-head-right':'tips-head-left'">后脑勺</view>
				<!-- <view>{{frontRightPart}}{{unitDesc}}</view> -->
			</view>
			<view class="wrap neckPointWrap" :style="neckPointWrapStyle" v-if="sideBodyImgUrl!=''">
				<view class="circle"></view>
				<view class="tips" :class="sideForward=='left'? 'tips-neck-right':'tips-neck-left'">颈部凹点</view>
				<!-- <view>{{frontRightPart}}{{unitDesc}}</view> -->
			</view>
			<view class="wrap backPointWrap" :style="backPointWrapStyle" v-if="sideBodyImgUrl!=''">
				<view class="circle"></view>
				<view class="tips" :class="sideForward=='left'? 'tips-neck-right':'tips-neck-left'">后背凸点</view>
			</view>
		</view>
		<view class="uni-common-mt">
			<view class="uni-form-item uni-column">
				<view class="title" style="text-align: left;padding: 20rpx;font-weight: 600;">侧面信息（照片以0.8米宽度为参照物计算结果）:
				</view>
				<view>
					<view class="impress"><label class="title">后背凸点与颈部凹点之间:</label><label
							class="sizeImpress">{{sideLittleNeckBack}}{{unitDesc}}</label>
					</view>
					<view class="impress"><label class="title">后背凸点与后脑勺之间:</label><label
							class="sizeImpress">{{sideLittleBlockBack}}{{unitDesc}}</label>
					</view>
					<view><label class="title">后背凸点与脖子中点之间:</label>{{sideNeckBack}}{{unitDesc}}</view>
					<view><label class="title">后背凸点与耳朵之间:</label>{{sideEarBack}}{{unitDesc}}</view>
				</view>
			</view>
		</view>
		<view class="btn-cnt" style="padding-bottom: 200rpx;">
			<button type="primary" @click="startSideCamera">{{sideBodyImgUrl==''?'开始测量':'重新测量'}}</button>
			<button class="save" @click="saveHandler">存储</button>
		</view>
		<!-- 		<view class="desc">
			<image mode="widthFix" src="../../static/index/20240322180953.jpg"></image>
		</view> -->
	</view>
</template>

<script>
	import Nav from '@/comp/Nav'
	export default {
		components: {
			Nav
		},
		onShareAppMessage() {


		},
		data() {
			return {
				showFront: true, //是否显示正面信息
				frontImageStyle: {
					'--imgWidth': '100rpx',
					'--imgHeight': '100rpx',
				},
				shoulderLeftWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				shoulderRightWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				shoulderLeftEarWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				shoulderRightEarWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				headPointWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				neckPointWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				backPointWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				shoulderTipsStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
					'--imgWidth': '100rpx',
					'--marginleft': '-50rpx'
				},
				shoulderEarTipsStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
					'--imgWidth': '100rpx',
					'--marginleft': '-50rpx'
				},
				sideImageStyle: {
					'--imgWidth': '100rpx',
					'--imgHeight': '100rpx',
				},
				factor: 1,
				unit: 100, // 100是cm
				unitDesc: 'cm', // cm
				toFixed: 2, // 精度
				bodyImgUrl: '',
				sideBodyImgUrl: '',
				bodyImgWidth: 0,
				bodyImgHeight: 0,
				bodyImgOriginWidth: 0.1,
				bodyImgOriginHeight: 0.1,
				shoulderSpace: 0,
				frontLeftEarX: 0.1,
				frontRightEarX: 0.1,
				frontLeftShoulder: 0.1,
				frontRightShoulder: 0.1,
				frontNeck: 0.1,
				frontLeftNeckShoulder: 0.1,
				frontRightNeckShoulder: 0.1,
				sideEye: 0.1,
				sideNeck: 0.1,
				sideEar: 0.1,
				sideNose: 0.1,
				sideMouth: 0.1,
				sideBack: 0.1,
				sideLower: 0.1, //最凹点
				sideBlock: 0.1, // 后脑勺点位
				sideForward: 'left', // 上传的侧面图朝向
				markList: [], // 标注点
			}
		},
		computed: {
			frontLeftPart() {
				let space = Math.abs(this.frontLeftEarX - this.frontLeftShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			frontRightPart() {
				let space = Math.abs(this.frontRightEarX - this.frontRightShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			frontLeftNeckPart() {
				let space = Math.abs(this.frontNeck - this.frontRightShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			frontRightNeckPart() {
				let space = Math.abs(this.frontNeck - this.frontRightShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			sideEarEye() {
				let space = Math.abs(this.sideEar - this.sideEye);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			sideEarNose() {
				let space = Math.abs(this.sideEar - this.sideNose);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			sideEarMouth() {
				let space = Math.abs(this.sideEar - this.sideMouth);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			sideEarBack() {
				let space = Math.abs(this.sideEar - this.sideBack);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			sideNeckBack() {
				let space = Math.abs(this.sideNeck - this.sideBack);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			sideLittleNeckBack() {
				let space = Math.abs(this.sideLower - this.sideBack);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			sideLittleBlockBack() {
				let space = Math.abs(this.sideBack - this.sideBlock);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				return space
			},
			shoulderPart() {
				return 3
			}
		},
		onShow() {
			this.createMaker()
		},
		methods: {
			createMaker() {
				//
				var x = 100
				var y = 200
				// this.markList.push({
				// 	x: 100,
				// 	y: 200,
				// 	tips: '12cm'
				// })
				// this.markList.push({
				// 	x: 200,
				// 	y: 200,
				// 	tips: '12cm'
				// })
				console.log(this.markList)
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
			startCamera() {
				uni.chooseImage({
					success: async (chooseImageRes) => {
						const tempFilePaths = chooseImageRes.tempFilePaths;
						console.log('tempFiles:', chooseImageRes.tempFiles);

						uni.showLoading({
							title: '检测中'
						})
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

								this.$set(this.frontImageStyle, '--imgWidth', (this.bodyImgWidth) +
									'px')
								this.$set(this.frontImageStyle, '--imgHeight', (this
										.bodyImgHeight) +
									'px')


								this.factor = width * (1 / 0.8) // 1米参参照物
								this.bodyImgOriginWidth = width;
								this.bodyImgOriginHeight = height;
								this.detecting(tempFilePaths, false)
							},
							fail: res => {
								console.error(res)
							}
						})
					}
				})
			},
			startSideCamera() {
				uni.chooseImage({
					success: async (chooseImageRes) => {
						const tempFilePaths = chooseImageRes.tempFilePaths;
						console.log('tempFiles:', chooseImageRes.tempFiles);

						uni.showLoading({
							title: '检测中'
						})
						wx.getImageInfo({
							src: tempFilePaths[0],
							success: res => {
								const fixWidth = 300
								let {
									width,
									height,
									orientation
								} = res
								console.log('getImageInfo res', res)
								this.sideBodyImgUrl = tempFilePaths[0];
								console.log('bodyImgUrl', this.bodyImgUrl);
								if (orientation == 'right' || orientation == 'left') {
									height = res.width
									width = res.height
								}
								var bodyImgWidth = fixWidth;
								var bodyImgHeight = (fixWidth / width) * height;
								this.$set(this.sideImageStyle, '--imgWidth', bodyImgWidth +
									'px');
								this.$set(this.sideImageStyle, '--imgHeight', bodyImgHeight +
									'px');

								this.factor = width * (1 / 0.8) // 参参照物宽度
								this.bodyImgOriginWidth = width;
								this.bodyImgOriginHeight = height;
								this.detecting(tempFilePaths, true)
							},
							fail: res => {
								console.error(res)
							}
						})
					}
				})
			},
			async detecting(tempFilePaths, isSide) {
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
						uni.hideLoading()
						let obj = JSON.parse(uploadFileRes.data)
						console.log('success', obj)
						// 如果是侧面图
						if (isSide) {
							this.handleSideData(obj, base64, tempFilePaths)
						} else {
							this.handleFrontData(obj)
						}

						// uni.showToast({
						// 	title: '肩宽约:' + space + 'm',
						// 	icon: 'none', //如果要纯文本，不要icon，将值设为'none'
						// 	duration: 5000 //持续时间为 2秒
						// })

					},
					fail: () => {
						uni.hideLoading()
						console.log('fail')
					}
				})
			},
			// 处理侧面信息
			handleSideData(obj, base64, tempFilePaths) {
				uni.showLoading({
					title: '处理中'
				})
				let person = obj.person_info[0]
				let body_parts = person.body_parts

				this.sideEar = body_parts.left_ear.score > 0.5 ? body_parts.left_ear.x : body_parts.right_ear.x
				this.sideNeck = body_parts.neck.x
				this.sideEye = body_parts.left_eye.score > 0.5 ? body_parts.left_eye.x : body_parts.right_eye.x
				this.sideNose = body_parts.nose.x;
				this.sideMouth = body_parts.left_mouth_corner.x > 0.5 ? body_parts.left_mouth_corner.x : body_parts
					.left_mouth_corner.x
				// 识别人物朝向，根据两个眼睛位置

				let forward = 'left'
				if (this.sideEar - this.sideEye > 0) {
					forward = 'left'
				} else {
					forward = 'right'
				}
				// //如果检测到左眼
				// if (body_parts.left_eye.score > 0.5) {
				// 	// 如果检测到右眼
				// 	if (body_parts.right_eye.score > 0.5) {
				// 		if ((body_parts.left_eye.x - body_parts.right_eye.x) > 0) {
				// 			forward = 'left'
				// 		} else {
				// 			forward = 'right'
				// 		}
				// 	} else {
				// 		forward = 'left'
				// 	}
				// } else {
				// 	if (body_parts.right_eye.score > 0.5) {
				// 		forward = 'right'
				// 	} else {
				// 		forward = 'error 两只眼睛都没有检测到'
				// 	}
				// }
				let top = body_parts.top_head.y;
				let bottom = body_parts.neck.y;
				let left = 0
				let right = 0
				if (forward == 'left') {
					this.sideEar = body_parts.left_ear.x
					this.sideEye = body_parts.left_eye.x
					this.sideBack = person.location.left + person.location.width;
					left = this.sideNeck
					right = this.sideBack
				} else if (forward == 'right') {
					this.sideEar = body_parts.right_ear.x
					this.sideEye = body_parts.right_eye.x
					this.sideBack = person.location.left;
					right = this.sideNeck
					left = this.sideBack
				}

				this.sideForward = forward

				// this.findSideInfo('d:/pyt/65fefb65-c5c0-49dd-88e0-522fd0bb6bb8.jpg', left, top, right, bottom, forward)
				// return
				// 上传图片
				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhPyImgUpload',
					filePath: tempFilePaths[0],
					name: 'file',
					formData: {
						'fileName': base64,
						'rect': [left, top, right, bottom],
						'face': forward
					},
					success: (uploadFileRes) => {
						uni.hideLoading()
						let obj = JSON.parse(uploadFileRes.data)
						console.log('success', obj)
						this.findSideGrayImage(obj.data, left, top, right, bottom, forward)
						// this.findSideInfo(obj.data, left, top, right, bottom, forward)
						// if (isSide) {
						// 	this.handleSideData(obj, base64)
						// } else {
						// 	this.handleFrontData(obj)
						// }

						// uni.showToast({
						// 	title: '肩宽约:' + space + 'm',
						// 	icon: 'none', //如果要纯文本，不要icon，将值设为'none'
						// 	duration: 5000 //持续时间为 2秒
						// })

					},
					fail: () => {
						uni.hideLoading()
						console.log('fail')
					}
				})
			},
			// 查找2值图
			findSideGrayImage(imageurl, left, top, right, bottom, forward) {
				uni.showLoading({
					title: '计算中'
				})
				uni.request({
					url: 'https://dev.ic1101.top/new_battle/zhBaiduBodySeg',
					header: {
						'content-type': 'application/x-www-form-urlencoded'
					},
					data: {
						'url': imageurl,
					},
					method: 'POST',
					dataType: 'json',
					success: (res) => {
						uni.hideLoading()
						console.log('zhBaiduBodySeg success:', res)
						let gray_url = res.data.data
						this.findSideInfo(gray_url, left, top, right, bottom, forward)
						// this.uploadGray2Python(grayBase64, left, top, right, bottom, forward)
					},
					fail: (res) => {
						uni.hideLoading()
						console.log('fail:', res)
					}
				})
			},
			// 上传2值base64到python服务器
			uploadGray2Python(grayBase64, left, top, right, bottom, forward) {
				// uni.request({
				// 	url: 'https://dev.ic1101.top/new_battle/zhPyImgUpload',
				// 	header: {
				// 		'content-type': 'multipart/form-data'
				// 	},
				// 	data: {
				// 		'fileName': grayBase64,
				// 		'rect': [left, top, right, bottom],
				// 		'face': forward
				// 	},
				// 	method: 'POST',
				// 	success: (res) => {
				// 		console.log('uploadGray2Python success:', res)
				// 		let obj = JSON.parse(res.data)
				// 		// this.findSideGrayImage(obj.data)
				// 		this.findSideInfo(obj.data, left, top, right, bottom, forward)
				// 		// let grayBase64 = res.data.data
				// 		// this.uploadGray2Python(grayBase64, left, top, right, bottom, forward)
				// 	},
				// 	fail: (res) => {
				// 		console.log('fail:', res)
				// 	}
				// })
				// return
				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhPyImgUpload',
					files: [{
						file: grayBase64,
						name: 'test',
						uri: '123.jpg'
					}],
					name: 'file',
					formData: {
						'rect': [left, top, right, bottom],
						'face': forward
					},
					success: (uploadFileRes) => {
						uni.hideLoading()
						let obj = JSON.parse(uploadFileRes.data)
						console.log('uploadGray2Python success', obj)
						// this.findSideGrayImage(obj.data)
						this.findSideInfo(obj.data, left, top, right, bottom, forward)
						// if (isSide) {
						// 	this.handleSideData(obj, base64)
						// } else {
						// 	this.handleFrontData(obj)
						// }

						// uni.showToast({
						// 	title: '肩宽约:' + space + 'm',
						// 	icon: 'none', //如果要纯文本，不要icon，将值设为'none'
						// 	duration: 5000 //持续时间为 2秒
						// })

					},
					fail: () => {
						console.log('fail')
					}
				})
			},
			// 去python查找侧面图片的轮廓信息
			findSideInfo(imageurl, left, top, right, bottom, forward) {
				uni.showLoading({
					title: '加载中'
				})
				uni.request({
					url: 'https://dev.ic1101.top/new_battle/zhPyExec',
					header: {
						'content-type': 'application/x-www-form-urlencoded'
					},
					data: {
						'url': imageurl,
						'rect': [left, top, right, bottom].join(','),
						'face': forward
					},
					method: 'POST',
					dataType: 'json',
					success: (res) => {
						uni.hideLoading()
						console.log('success:', res)
						let result = res.data
						let point = result.data;
						let points = point.split(',')
						// 后脑勺为止
						// let lower = [points[0], point[1]]
						this.sideBlock = points[0]
						// 最低点为止
						this.sideLower = points[2]


						// 后脑勺
						this.$set(this.headPointWrapStyle, '--left', (300 * points[0] / this
								.bodyImgOriginWidth) +
							'px')
						this.$set(this.headPointWrapStyle, '--bottom', (300 * Math.abs(points[1] -
								this
								.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
							'px')
						// 脖颈最低
						this.$set(this.neckPointWrapStyle, '--left', (300 * points[2] / this
								.bodyImgOriginWidth) +
							'px')
						this.$set(this.neckPointWrapStyle, '--bottom', (300 * Math.abs(points[3] -
								this
								.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
							'px')

						// 后背坐标
						this.$set(this.backPointWrapStyle, '--left', (300 * points[4] / this
								.bodyImgOriginWidth) +
							'px')
						this.$set(this.backPointWrapStyle, '--bottom', (300 * Math.abs(points[5] -
								this
								.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
							'px')

						// let block = [points[2], point[3]]
						console.log('points:', points)
					},
					fail: (res) => {
						uni.hideLoading()
						console.log('fail:', res)
					}
				})
				return
				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhPyExec',
					filePath: '',
					name: 'file',
					formData: {
						'rect': [left, top, right, bottom],
						'face': forward
					},
					success: (uploadFileRes) => {
						uni.hideLoading()
						let obj = JSON.parse(uploadFileRes.data)
						console.log('success', obj)
						// if (isSide) {
						// 	this.handleSideData(obj, base64)
						// } else {
						// 	this.handleFrontData(obj)
						// }

						// uni.showToast({
						// 	title: '肩宽约:' + space + 'm',
						// 	icon: 'none', //如果要纯文本，不要icon，将值设为'none'
						// 	duration: 5000 //持续时间为 2秒
						// })

					},
					fail: () => {
						console.log('fail')
					}
				})
			},
			// 处理正面数据信息
			handleFrontData(obj) {
				let person = obj.person_info[0]
				let body_parts = person.body_parts
				let left_shoulder = body_parts.left_shoulder
				let right_shoulder = body_parts.right_shoulder
				let leftShoulder = left_shoulder.x;
				let rightShoulder = right_shoulder.x;
				this.frontLeftShoulder = left_shoulder.x;
				this.frontRightShoulder = right_shoulder.x;
				this.frontLeftEarX = body_parts.left_ear.x
				this.frontRightEarX = body_parts.right_ear.x
				this.frontNeck = body_parts.neck.x


				let space = Math.abs(rightShoulder - leftShoulder);
				space = space * this.unit / this.factor
				space = space + 1
				space = space.toFixed(3)
				this.shoulderSpace = space + 1
				// console.log('this.shoulderSpace:', this.shoulderSpace, space, 1, space + 1)
				// 左肩
				this.$set(this.shoulderLeftWrapStyle, '--left', (300 * rightShoulder / this.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderLeftWrapStyle, '--bottom', (300 * Math.abs(right_shoulder.y - this
						.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
					'px')
				// 右肩
				this.$set(this.shoulderRightWrapStyle, '--left', (300 * leftShoulder / this.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderRightWrapStyle, '--bottom', (300 * Math.abs(left_shoulder.y - this
						.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
					'px')
				// 左耳
				this.$set(this.shoulderLeftEarWrapStyle, '--left', (300 * this.frontLeftEarX / this.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderLeftEarWrapStyle, '--bottom', (300 * Math.abs(body_parts.left_ear.y - this
						.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
					'px')
				// 右耳
				this.$set(this.shoulderRightEarWrapStyle, '--left', (300 * this.frontRightEarX / this.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderRightEarWrapStyle, '--bottom', (300 * Math.abs(body_parts.right_ear.y - this
						.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
					'px')

				// this.$set(this.shoulderTipsStyle, '--left', (300 * rightShoulder / this.bodyImgOriginWidth) +
				// 	'px')
				// this.$set(this.shoulderTipsStyle, '--imgWidth', (300 * Math.abs(rightShoulder - leftShoulder) / this
				// 		.bodyImgOriginWidth) +
				// 	'px')
				// this.$set(this.shoulderTipsStyle, '--bottom', (300 * Math.abs(right_shoulder.y - this
				// 		.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
				// 	'px')
			},
		}
	}
</script>

<style scoped lang="scss">
	.main {
		margin-left: 30rpx;
		margin-right: 30rpx;
	}

	.backimg {
		width: 100%;
		display: block;
	}

	.title {
		line-height: 45rpx;
	}

	.impress {
		color: #ff0000;
	}

	.sizeImpress {
		font-weight: bold;
	}

	.frontPic {
		width: var(--imgWidth);
		height: var(--imgHeight);
		margin: 0 auto;
		position: relative;
	}

	.shoulderWrap {
		left: var(--left);
		width: var(--imgWidth);
		bottom: var(--bottom);
		position: absolute;
	}

	.shoulderLeftWrap {
		left: var(--left);
		bottom: var(--bottom);
		position: absolute;
	}

	.shoulderRightWrap {
		left: var(--left);
		bottom: var(--bottom);
		position: absolute;
	}

	.shoulderLeftEarWrap {
		left: var(--left);
		bottom: var(--bottom);
		position: absolute;
	}

	.shoulderRightEarWrap {
		left: var(--left);
		bottom: var(--bottom);
		position: absolute;
	}

	.shoulderEarWrap {
		left: var(--left);
		width: var(--imgWidth);
		bottom: var(--bottom);
		position: absolute;
	}

	.headPointWrap {
		left: var(--left);
		bottom: var(--bottom);
		position: absolute;
	}

	.neckPointWrap {
		left: var(--left);
		bottom: var(--bottom);
		position: absolute;
	}

	.backPointWrap {
		left: var(--left);
		bottom: var(--bottom);
		position: absolute;
	}

	.frontPic image {
		width: 100%;
		height: 100%;
	}

	.desc {
		width: 100%;

	}

	.desc image {
		width: 100%;
		height: 100%;
	}

	.info-part {
		position: relative;
		width: 100%;
	}

	.info-part .marker {
		position: absolute;
		width: 20px;
		height: 20px;
		background: #f00;
	}


	/* 垂线样式 */
	.wrap-h {
		display: flex;
		position: absolute;
		justify-content: center;
		align-items: center;
		top: 12px;
		left: 23px;
		height: 154px;
		border-top: 1px solid #fff;
		border-bottom: 1px solid #fff;
		text-align: center;
		color: #fff;
	}

	.wrap-h view {
		margin: 0 auto;
		width: 14px;
		font-size: 14px;
		line-height: 14px;
		word-break: break-word;
	}

	.wrap-h view::before,
	.wrap-h view::after {
		position: absolute;
		left: 6px;
		width: 1px;
		height: 18%;
		content: "";
		background: #ddd;
	}

	/*调整背景垂线的上下距离*/
	.wrap-h view::before {
		top: 0px;
	}

	.wrap-h view::after {
		bottom: 0px;
	}

	/* 横线样式 */
	.wrap {
		position: absolute;
		// bottom: 6px;
		text-align: center;
	}


	.circle {
		width: 16rpx;
		height: 16rpx;
		color: red;
		margin-left: -8rpx;
		margin-top: -8rpx;
		background-color: red;
		border-radius: 50%;
	}

	.tips {
		text-align: left;
		width: 80px;
		margin-left: 10px;
		margin-top: -15px;
		position: absolute;
	}

	.tips-left {
		margin-left: -50px;
		margin-top: -15px;
	}

	.tips-neck-left {
		margin-left: -70px;
	}

	.tips-neck-right {
		margin-left: 15px;
	}

	.tips-head-left {
		margin-left: -55px;
	}

	.tips-head-right {
		margin-left: 15px;
	}

	.normal-btn {
		width: 200rpx;
		height: 100rpx;
		background-color: #5B7897;
		margin: 0 auto;
		line-height: 100rpx;
		text-align: center;
		color: white;
		border-radius: 30rpx;
	}

	.save {
		width: 200rpx;
		height: 100rpx;
		background-color: rgb(238, 126, 39);
		margin: 0 auto;
		line-height: 100rpx;
		text-align: center;
		color: white;
		border-radius: 30rpx;
	}
</style>