<template>
	<view class="container">
		<z-nav-bar :bgColor="bgColorList" backState=1000 home='false'>检测</z-nav-bar>
		<!-- 		<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
			title='检测'></z-nav-bar> -->
		<view class="back">
			<image class="back-img" mode="widthFix" :src="'../../static/SY_09A_Mas.jpg'"></image>
		</view>
		<view class="main" v-if="showFront">
			<view class="frontPic" :style="frontImageStyle">
				<image v-if="bodyImgUrl!=''" :src="bodyImgUrl" mode="widthFix"></image>
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
				<text style="line-height: 140rpx;" v-else>
					上传待检测的图片
				</text>
			</view>
			<view class="uni-common-mt">
				<view class="datainfo flex" v-if="showFront">
					<view class="back1" @click="handleSideClick">
						<image class="side1Img" src="../static/adjust/Side01.png" mode="widthFix"></image>
						<view>侧面数据</view>
					</view>
					<view class="back2 flex1 flex">
						<view class="left-part">
							<image class="front1Img" src="../static/adjust/face02.png" mode="widthFix"></image>
							<view>正面数据</view>
						</view>
						<view class="right-info-part">
							<view class="impress"><label class="title">右耳朵到右肩:</label><label
									class="sizeImpress">{{frontRightPart}}{{unitDesc}}</label></view>
							<view><label class="title">肩宽:</label>{{shoulderSpace}}{{unitDesc}}</view>
							<view><label class="title">左耳朵到左肩:</label>{{frontLeftPart}}{{unitDesc}}</view>
						</view>
					</view>
				</view>

				<view class="uni-form-item uni-column" v-if="false">
					<view class="title" style="text-align: left;padding: 20rpx;font-weight: 600;">
						<p>正面信息（照片以0.8米宽度为参照物计算结果）:</p>
					</view>
					<block></block>
					<view>
						<view class="impress"><label class="title">●右耳朵到右肩:</label><label
								class="sizeImpress">{{frontRightPart}}{{unitDesc}}</label></view>
						<view><label class="title">●肩宽:</label>{{shoulderSpace}}{{unitDesc}}</view>
						<view><label class="title">●左耳朵到左肩:</label>{{frontLeftPart}}{{unitDesc}}</view>
						<!-- 					<view><label class="title">脖子中心到左肩:</label>{{frontLeftNeckPart}}{{unitDesc}}</view>
					<view><label class="title">脖子中心到右肩:</label>{{frontRightNeckPart}}{{unitDesc}}</view> -->
					</view>
				</view>
			</view>

			<view class="btn-cnt flex" style="padding-top: 20rpx;">
				<button class="normal-btn" @click="startCamera">{{bodyImgUrl==''?'开始测量':'重新测量'}}</button>
				<button class="normal-btn" @click="handleClick">手动微调</button>
				<button class="save" @click="saveHandler">存储</button>
			</view>
		</view>
		<view class="main" v-else>
			<!-- <view style="text-align: center;padding: 20rpx;font-weight: 600;"><label class="title">侧面图片</label></view> -->
			<view class="frontPic" :style="sideImageStyle">
				<image v-if="sideBodyImgUrl!=''" :src="sideBodyImgUrl" mode="widthFix"></image>
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
				<text style="line-height: 140rpx;" v-else>
					上传待检测的图片
				</text>
			</view>
			<view class="uni-common-mt">
				<view class="datainfo flex">
					<view class="back1" @click="handleFrontClick()">
						<image class="front2Img" src="../static/adjust/face01.png" mode="widthFix"></image>
						<view>正面数据</view>
					</view>
					<view class="back2 flex1 flex align-center">
						<view class="left-part">
							<image class="side2Img" src="../static/adjust/Side02.png" mode="widthFix"></image>
							<view>侧面数据</view>
						</view>
						<view class="right-info-part">
							<view class="impress"><label class="title">●后背与颈部:</label><label
									class="sizeImpress">{{sideLittleNeckBack}}{{unitDesc}}</label>
							</view>
							<view class="impress"><label class="title">●后背与后脑:</label><label
									class="sizeImpress">{{sideLittleBlockBack}}{{unitDesc}}</label>
							</view>
							<view><label class="title">●后背与脖子:</label>{{sideNeckBack}}{{unitDesc}}</view>
							<view><label class="title">●后背与耳朵:</label>{{sideEarBack}}{{unitDesc}}</view>
						</view>
					</view>
				</view>
				<view class="uni-form-item uni-column" v-if="false">
					<view class="title" style="text-align: left;padding: 20rpx;font-weight: 600;">
						侧面信息（照片以0.8米宽度为参照物计算结果）:
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

			<view class="btn-cnt flex" style="padding-top: 20rpx;">
				<button class="normal-btn" @click="startSideCamera">{{bodyImgUrl==''?'开始测量':'重新测量'}}</button>
				<button class="normal-btn" @click="handleClick">手动微调</button>
				<button class="save" @click="saveHandler">存储</button>
			</view>
			<!-- operate part -->
			<!-- 		<view class="btn-cnt" style="padding-bottom: 200rpx;">
			<button type="primary" @click="startSideCamera">{{sideBodyImgUrl==''?'开始测量':'重新测量'}}</button>
			<button class="save" @click="saveHandler">存储</button>
		</view> -->
		</view>
		<!-- 存储设置界面弹窗 -->
		<uni-popup ref="popup" type="bottom" background-color="#fff" border-radius="10px 10px 0 0" :mask-click="false">
			<view class="popup-container">
				<view class="flex align-center" style="padding: 30rpx;padding-top: 90rpx;">
					<image class='icon' src="../../static/adjust/sicon.png" mode="widthFix"></image>
					<text class="icon-text">储存设定</text>
				</view>
				<view class="flex align-center" style="padding: 30rpx;">
					<text class="">名称</text>
					<input v-model="inputName" class="flex1 input-area" placeholder="输入我的模式" />
				</view>
				<view class="send-btn" @click="closeAndSave">发送至枕头</view>
				<image class="titleimg" src="../../static/adjust/SY_05_B001.png"></image>
				<image class="close-btn" src="../../static/adjust/SY_05_buttonCOLa.png" mode="widthFix"
					@click="closeSave">
				</image>
			</view>

		</uni-popup>
		<!-- 结果提示界面 -->
		<uni-popup ref="popupTips" type="bottom" style="z-index: 10000; position: absolute;"
			border-radius="40rpx 40rpx 40rpx 40rpx" background-color='white' :mask-click="true">
			<view class="popup-tips">
				<view class="send-btn" @click="closeAndSave">AI测量完成，请分别仰卧和侧卧进行体验，
					如有不适请点击手动微调进行调整
				</view>
				<image class="titleimg" src="../../static/adjust/SY_05_B001.png"></image>
				<image class="close-btn" src="../../static/adjust/SY_05_buttonCOLa.png" mode="widthFix"
					@click="closeTipsSave">
				</image>
			</view>
		</uni-popup>
		<input-view v-if="false" ref="inputView"></input-view>
	</view>
</template>

<script>
	import InputView from './InputView.vue'
	import {
		object2Query,
		sideParseByShooting,
		frontParseByShooting
	} from '@/common/util.js'
	export default {
		components: {
			InputView
		},
		onLoad(options) {
			this.sideBodyImgUrl = decodeURIComponent(options.sideImage)
			this.bodyImgUrl = decodeURIComponent(options.frontImage)
			console.log('options:', this.sideBodyImgUrl, this.bodyImgUrl)

		},
		onShow() {
			this.createMaker()
			this.checkBodyUrl()
			this.$refs.popupTips.open('center')
		},
		onShareAppMessage() {


		},
		data() {
			return {
				inputName: '模式',
				showFront: true, //是否显示正面信息
				frontImageStyle: {
					'--imgWidth': '750rpx',
					'--imgHeight': '140rpx',
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
					'--imgWidth': '750rpx',
					'--imgHeight': '140rpx',
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
		methods: {
			checkBodyUrl() {
				uni.showLoading({
					title: '检测中'
				})
				wx.getImageInfo({
					src: this.bodyImgUrl,
					success: res => {
						const fixWidth = 300
						const {
							width,
							height
						} = res
						console.log('getImageInfo res', res)
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
						this.detecting(this.bodyImgUrl, false)
					},
					fail: res => {
						console.error(res)
					}
				})
			},
			checkSideUrl() {
				uni.showLoading({
					title: '侧面检测中'
				})
				wx.getImageInfo({
					src: this.sideBodyImgUrl,
					success: res => {
						const fixWidth = 300
						let {
							width,
							height,
							orientation
						} = res
						console.log('getImageInfo res', res)
						console.log('sideBodyImgUrl', this.sideBodyImgUrl);
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
						this.detecting(this.sideBodyImgUrl, true)
					},
					fail: res => {
						console.error(res)
					}
				})
			},
			// 显示侧面数据
			handleSideClick() {
				this.showFront = false
			},
			// 显示正面数据
			handleFrontClick() {
				this.showFront = true
			},
			closeAndSave() {
				this.$refs.popup.close()
				// let params = this.$refs.inputView.getParams();
				let storageObj = uni.getStorageSync('myMode');
				console.log('mode:', this.inputName, storageObj)
				let params = frontParseByShooting({
					headHeight: this.sideLittleBlockBack,
					neckHeight: this.sideLittleNeckBack,
					sideHeadHeight: this.frontLeftPart + this.frontRightPart,
					sideNeckHeight: (this.shoulderSpace - 10) * 0.5
				})

				console.log('params:', params)
				//

				if (!storageObj) {
					storageObj = []
				} else {
					storageObj = JSON.parse(storageObj)
				}
				// 存储数据
				storageObj.push({
					name: this.inputName,
					data: params
				})
				uni.setStorageSync('myMode', JSON.stringify(storageObj));
				uni.showToast({
					title: '发送中',
					success() {
						uni.navigateTo({
							url: "/page_subject/mode/setMode" + object2Query(params)
						})
						// uni.switchTab({
						// 	url: '/pages/status/status' + object2Query(params)
						// })
					}
				})
			},
			closeSave() {
				this.$refs.popup.close()
			},
			closeTipsSave() {
				this.$refs.popupTips.close()
			},
			// 手动测量
			handleClick() {
				let params = frontParseByShooting({
					headHeight: this.sideLittleBlockBack,
					neckHeight: this.sideLittleNeckBack,
					sideHeadHeight: this.frontLeftPart + this.frontRightPart,
					sideNeckHeight: (this.shoulderSpace - 10) * 0.5
				})


				// let params = this.$refs.inputView.getParams();
				console.log('params:', params)
				uni.redirectTo({
					url: '/page_subject/adjust/adjust' + object2Query(params)
				})
			},
			saveHandler() {
				this.$refs.popup.open('bottom')
				return

			},
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
								this.detecting(tempFilePaths[0], false)
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
								this.detecting(tempFilePaths[0], true)
							},
							fail: res => {
								console.error(res)
							}
						})
					}
				})
			},
			async detecting(tempUrl, isSide) {
				let base64 = await this.base64({
					url: tempUrl
				});

				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhBaiduAip',
					filePath: tempUrl,
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
							this.handleSideData(obj, base64)
						} else {
							this.handleFrontData(obj)
						}
					},
					fail: () => {
						uni.hideLoading()
						console.log('fail')
					}
				})
			},
			// 处理侧面信息
			handleSideData(obj, base64) {
				uni.showLoading({
					title: '处理侧面中'
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
				// 上传图片
				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhPyImgUpload',
					filePath: this.sideBodyImgUrl,
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

				this.checkSideUrl()
			},
		}
	}
</script>

<style scoped lang="scss">
	@import './shootView.scss';
</style>