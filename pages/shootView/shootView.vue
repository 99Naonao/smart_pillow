<template>
	<view class="container">
		<z-nav-bar :bgColor="bgColorList" backState=1000 home='false'>检测</z-nav-bar>
		<view class="main" v-if="showFront">
			<view class="frontPic" :style="frontImageStyle">
				<image v-if="bodyImgUrl!=''" :src="bodyImgUrl" mode="widthFix"></image>

				<view class="info-part" :style="frontImageStyle" v-if="bodyImgUrl!=''">
					<view class="wrap shoulderLeftWrap" :style="shoulderLeftWrapStyle">
						<view class="circle"></view>
						<view class="tips"></view>
						
					</view>
					<view class="wrap shoulderRightWrap" :style="shoulderRightWrapStyle">
						<view class="circle"></view>
						<view class="tips"></view>
						
					</view>
					<view class="wrap shoulderLeftEarWrap" :style="shoulderLeftEarWrapStyle">
						<view class="circle"></view>
						<view class="tips"></view>
						
					</view>
					<view class="wrap shoulderRightEarWrap" :style="shoulderRightEarWrapStyle">
						<view class="circle"></view>
						<view class="tips tips-left"></view>
						
					</view>
					
				</view>
				<text style="line-height: 140rpx;" v-else>
					上传待检测的图片
				</text>
			</view>
			<view class="back">
				<image class="back-img" mode="widthFix" :src="'../../static/SY_09A_Mas.png'"></image>
			</view>
			<view class="uni-common-mt123" :style="frontImageStyle">
				<view class="datainfo flex" v-if="showFront">
					<view class="back1" @click="handleSideClick">
						<image class="side1Img" src="../../static/camera/SY_09_ButCM01.png" mode="widthFix"></image>
						<view v-if="false">侧面数据</view>
					</view>
					<view class="back2 flex1 flex align-center">
						<image mode="widthFix" class="img2back" src="../../static/camera/SY_09_ButZMSJ02.png">
						</image>
						<view class="left-part">
							<image class="front1Img" v-if="false" src="../../static/camera/SY_09_ButZMSJ02.png"
								mode="widthFix">
							</image>
							<view v-if="false">正面数据</view>
						</view>
						<view class="right-info-part">
							<view class=""><label class="title">头枕高度:</label><label
									class="">{{frontRightPart}}{{unitDesc}}</label></view>
							<view><label class="title">颈枕高度:</label>{{shoulderSpace}}{{unitDesc}}</view>
							<!-- <view><label class="title">●左耳到左肩:</label>{{frontLeftPart}}{{unitDesc}}</view> -->
						</view>
					</view>
				</view>

				<view class="uni-form-item uni-column" v-if="false">
					<view class="title" style="text-align: left;padding: 20rpx;font-weight: 600;">
						<p>正面信息（照片以0.8米宽度为参照物计算结果）:</p>
					</view>
					<block></block>
					<view class="right-info-part">
						<view class=""><label class="title">头枕高度:</label><label
								class="">{{frontRightPart}}{{unitDesc}}</label></view>
						<view><label class="title">颈枕高度:</label>{{shoulderSpace}}{{unitDesc}}</view>

					</view>
				</view>
			</view>
			<view class="btn-advise" @click="gotoStudy">
				建议您进行睡姿学习
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

				<view class="info-part" :style="sideImageStyle" v-if="sideBodyImgUrl!=''">
					<view class="wrap headPointWrap" :style="headPointWrapStyle" v-if="true">
						<view class="circle"></view>
						<view class="tips" :class="sideForward=='left'? 'tips-head-right':'tips-head-left'"></view>
						
					</view>
					<view class="wrap neckPointWrap" :style="neckPointWrapStyle" v-if="sideBodyImgUrl!=''">
						<view class="circle"></view>
						<view class="tips" :class="sideForward=='left'? 'tips-neck-right':'tips-neck-left'"></view>
						
					</view>
					<view class="wrap backPointWrap" :style="backPointWrapStyle" v-if="true">
						<view class="circle"></view>
						<view class="tips" :class="sideForward=='left'? 'tips-neck-right':'tips-neck-left'"></view>
					</view>

				</view>

				<text style="line-height: 140rpx;" v-else>
					上传待检测的图片
				</text>
			</view>
			<view class="back">
				<image class="back-img" mode="widthFix" :src="'../../static/SY_09A_Mas.png'"></image>
			</view>
			<view class="uni-common-mt123" :style="sideImageStyle">
				<view class="datainfo flex">
					<view class="back1 flex1 flex align-center">
						<view class="left-side-part">
							<image mode="widthFix" class="img2back" src="../../static/camera/SY_09_ButCM02.png">
							</image>
							<view class="side-info-part">

								<view class="">
									<label class="title">头枕高度:</label><label
										class="">
										<!--{{sideLittleNeckBack}}{{unitDesc}}-->
										{{sideNeckToHead}}{{unitDesc}}
									</label>
								</view>
								<view class="">
									<label class="title">颈枕高度:</label><label
										class="">
										<!--{{sideLittleBlockBack}}{{unitDesc}}-->
										{{sideNeckToBack}}{{unitDesc}}
									</label>
								</view>
							</view>
						</view>
						<view class="right-side-part">
						
							<image class="front2Img" @click="handleFrontClick()"
								src="../../static/camera/SY_09_ButZM01.png" mode="widthFix"></image>
						</view>
					</view>
				</view>
				<view class="uni-form-item uni-column" v-if="false">
					<view class="title" style="text-align: left;padding: 20rpx;font-weight: 600;">
						侧面信息（照片以0.8米宽度为参照物计算结果）:
					</view>
					<view>
						<view class="impress"><label class="title">后背凸点与颈部凹点之间:</label><label
								class="">{{sideNeckToHead}}{{unitDesc}}</label>
						</view>
						<view class="impress"><label class="title">后背凸点与后脑勺之间:</label><label
								class="">{{sideNeckToBack}}{{unitDesc}}</label>
						</view>
						<view><label class="title">后背凸点与脖子中点之间:</label>{{sideNeckBack}}{{unitDesc}}</view>
						<view><label class="title">后背凸点与耳朵之间:</label>{{sideEarBack}}{{unitDesc}}</view>
					</view>
				</view>
			</view>
			<view class="btn-advise" @click="gotoStudy">
				建议您进行睡姿学习
			</view>

			<view class="btn-cnt flex" style="padding-top: 20rpx;">
				<button class="normal-btn" @click="startSideCamera">{{bodyImgUrl==''?'开始测量':'重新测量'}}</button>
				<button class="normal-btn" @click="handleClick">手动微调</button>
				<button class="save" @click="saveHandler">存储</button>
			</view>
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
				<view class="send-btn" @click="closeAndSave">{{jumpStudy?'保存后去学习':'发送至枕头'}}</view>
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
				<view class="send-btn">AI测量完成，请分别仰卧和侧卧进行体验，
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
	import {
		saveAIMode
	} from '../../common/util'
	import {
		addAILog,
		addStoreAILog
	} from '../../utils/miniapp'
	import InputView from './InputView.vue'
	import {
		object2Query,
	} from '@/common/util.js'
	export default {
		components: {
			InputView
		},
		onLoad(options) {
			this.sideBodyImgUrl = decodeURIComponent(options.sideImage)
			this.bodyImgUrl = decodeURIComponent(options.frontImage)
			// this.bodyImgUrl = 'https://pc-cdn.pupupal.com/pupu-pc/50_20240322124756.jpg'
			// this.sideBodyImgUrl = 'https://pc-cdn.pupupal.com/pupu-pc/50_20240322124808.jpg'
			console.log('options:', this.sideBodyImgUrl, this.bodyImgUrl)
		},
		onShow() {
			this.createMaker()
			this.checkBodyUrl();
			const app = getApp();
			let width = app.globalData.screenWidth;
			console.log('show:width:', width)
			this.$set(this.frontImageStyle, '--imgBottom', width / 375 * 460 +
				'px')
			this.$set(this.sideImageStyle, '--imgBottom', width / 375 * 460 +
				'px')
		},
		onShareAppMessage() {


		},
		data() {
			return {
				jumpStudy: false,
				inputName: '模式',
				showFront: true, //是否显示正面信息
				frontImageStyle: {
					'--imgWidth': '750rpx',
					'--imgHeight': '140rpx',
					'--imgBottom': '100rpx',
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
				backUpPointWrapStyle: {
					'--left': '10rpx',
					'--bottom': '10rpx',
				},
				backDownPointWrapStyle: {
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
				fixedImgWidth: 250,
				manFactor: 130, // 单位是mm 
				womenFactor: 100, // 单位是mm
				unit: 1000, // 100是cm 1000是mm
				unitDesc: 'mm', // cm
				toFixed: 0, // 精度
				bodyImgUrl: '',
				sideBodyImgUrl: '',
				bodyImgWidth: 0,
				bodyImgHeight: 0,
				bodyImgOriginWidth: 0.1,
				bodyImgOriginHeight: 0.1,
				shoulderSpace: 0, // 肩宽
				headSpace: 0, // 头宽
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
				sideNeckToBack: 0,
				sideNeckToHead: 0
			}
		},
		computed: {
			frontLeftPart() {
				let space = Math.abs(this.frontLeftEarX - this.frontLeftShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			frontRightPart() {
				let space = Math.abs(this.frontRightEarX - this.frontRightShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				// 测算出的高度都*0.9
				space = Math.floor(space * 0.5)
				// 测算高度不能低于30mm 不能低于棉花高度
				space = Math.max(space, 30)
				// 不高于110mm
				space = Math.min(space, 110)
				return space
			},
			frontLeftNeckPart() {
				let space = Math.abs(this.frontNeck - this.frontRightShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			frontRightNeckPart() {
				let space = Math.abs(this.frontNeck - this.frontRightShoulder);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			sideEarEye() {
				let space = Math.abs(this.sideEar - this.sideEye);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			sideEarNose() {
				let space = Math.abs(this.sideEar - this.sideNose);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			sideEarMouth() {
				let space = Math.abs(this.sideEar - this.sideMouth);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			sideEarBack() {
				let space = Math.abs(this.sideEar - this.sideBack);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			sideNeckBack() {
				let space = Math.abs(this.sideNeck - this.sideBack);
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				return space
			},
			sideLittleNeckBack() {
				console.log('this.sideC', this.sideC, this.sideB)
				let space = Math.abs(this.sideC - this.sideB);
				console.log('space', space, this.unit, this.factor)
				space = Math.max(space, 1)
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				space = Math.max(30, space);
				space = Math.min(110, space);
				return space
			},
			sideLittleBlockBack() {
				let space = Math.abs(this.sideA - this.sideC);
				space = Math.max(space, 1)
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				space = Math.max(30, space);
				// 最高不超过110cm
				space = Math.min(space, 110)
				return space
			},
			sideNeckToBack() {
				let space = Math.abs(this.sideA - this.sideC);
				space = Math.max(space, 1)
				space = space * this.unit / this.factor
				space = space.toFixed(this.toFixed)
				space = Math.floor(space)
				space = Math.max(30, space);
				// 最高不超过110cm
				space = Math.min(space, 110)
				return space
			},
			shoulderPart() {
				return 3
			}
		},
		methods: {
			uploadBodyImage() {
				wx.getImageInfo({
					src: this.bodyImgUrl,
					success: res => {
						const fixWidth = this.fixedImgWidth
						let {
							width,
							height,
							orientation
						} = res
						console.log('getImageInfo front res', res)
						console.log('bodyImgUrl', this.bodyImgUrl);
						if (orientation == 'right' || orientation == 'left') {
							height = res.width
							width = res.height
						}
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
					fail: (error) => {
						console.error('獲取圖片信息失敗:', error)
						uni.showToast({
							title: '獲取圖片信息失敗',
							icon: 'error',
							duration: 2000
						})
					}
				})
			},
			checkBodyUrl() {
				let that = this;
				uni.showLoading({
					title: '正面检测中'
				})
				if (this.bodyImgUrl.indexOf('wxfile:') > -1) {
					that.uploadBodyImage()
				} else {
					wx.downloadFile({
						url: this.bodyImgUrl, //仅为示例，并非真实的资源
						success(res) {
							// 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
							if (res.statusCode === 200) {
								that.bodyImgUrl = res.tempFilePath;
								console.log('bodytemp url:', that.bodyImgUrl)
								that.uploadBodyImage()
							}
						}
					})
				}

			},
			uploadSideImg() {
				wx.getImageInfo({
					src: this.sideBodyImgUrl,
					success: res => {
						const fixWidth = this.fixedImgWidth
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
					fail: (error) => {
						console.error('獲取圖片信息失敗:', error)
						uni.showToast({
							title: '獲取圖片信息失敗',
							icon: 'error',
							duration: 2000
						})
					}
				})
			},
			checkSideUrl() {
				let that = this;
				uni.showLoading({
					title: '侧面检测中'
				})
				if (this.sideBodyImgUrl.indexOf('wxfile:') > -1) {
					that.uploadSideImg()
				} else {
					wx.downloadFile({
						url: this.sideBodyImgUrl, //仅为示例，并非真实的资源
						success(res) {
							// 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
							if (res.statusCode === 200) {
								that.sideBodyImgUrl = res.tempFilePath;
								console.log('sidetemp url:', that.sideBodyImgUrl)
								that.uploadSideImg()
							}
						}
					})
				}
			},
			// 显示侧面数据
			handleSideClick() {
				this.showFront = false
			},
			// 显示正面数据
			handleFrontClick() {
				this.showFront = true
			},
			// 去学习
			gotoStudy() {
				this.jumpStudy = true;
				console.log('===>this.jumpStudy', this.jumpStudy)
				this.saveHandler();
			},
			closeAndSave() {
				this.$refs.popup.close()
				// let params = this.$refs.inputView.getParams();
				let storageObj = uni.getStorageSync('myMode');
				console.log('mode:', this.inputName, storageObj)
				let params = {
					name: this.inputName,
					neckHeight: Math.floor(this.sideNeckToBack),
					headHeight: Math.floor(this.sideNeckToHead),
					sideNeckHeight: Math.floor((this.shoulderSpace)),
					sideHeadHeight: Math.floor((this.frontRightPart))
				}

				let form = {
					age: 20,
					weight: 50,
					tall: 168,
					sexIndex: 2
				}
				let obj = uni.getStorageSync('user_measure');
				if (obj) {
					form = JSON.parse(obj);
				} else {
					form = {
						age: 20,
						weight: 50,
						tall: 168,
						sexIndex: 2,
					}
				}

				let send_params = {}
				Object.assign(send_params, form);
				Object.assign(send_params, params);

				addStoreAILog(send_params)

				console.log('params:', this.jumpStudy, params)

				if (!storageObj) {
					storageObj = []
				} else {
					storageObj = JSON.parse(storageObj)
				}

				// 保存一份ai数据
				params.standard = {
					headHeight: params.headHeight,
					neckHeight: params.neckHeight,
					sideHeadHeight: params.sideHeadHeight,
					sideNeckHeight: params.sideNeckHeight
				}
				// 存储数据
				storageObj.push(params)
				saveAIMode(params);
				uni.setStorageSync('myMode', JSON.stringify(storageObj));

				uni.setStorageSync('standard', JSON.stringify(params));
				let that = this;
				uni.showToast({
					title: '发送中',
					success() {
						if (that.jumpStudy) {
							uni.navigateTo({
								url: "/page_subject/study/study"
							})
						} else {
							// 设置模式发送成功标记，以便status页面调用checkModeSentCompleted()
							uni.setStorageSync('mode_sent_success', true);
							uni.switchTab({
								url: "/pages/status/status"
							})
						}
						that.jumpStudy = false;
						console.log('===>that.jumpStudy')

					}
				})
			},
			finishDecting() {
				// ai 监测结束
				let params = {
					neckHeight: Math.floor(this.sideNeckToBack),
					headHeight: Math.floor(this.sideNeckToHead),
					sideNeckHeight: Math.floor((this.shoulderSpace)),
					sideHeadHeight: Math.floor((this.frontRightPart))
				}

				let form = {
					age: 20,
					weight: 50,
					tall: 168,
					sexIndex: 2
				}
				let obj = uni.getStorageSync('user_measure');
				if (obj) {
					form = JSON.parse(obj);
				} else {
					form = {
						age: 20,
						weight: 50,
						tall: 168,
						sexIndex: 2,
					}
				}

				let send_params = {}
				Object.assign(send_params, form);
				Object.assign(send_params, params);

				addAILog(send_params)
			},
			closeSave() {
				this.$refs.popup.close()
				this.jumpStudy = false;
				console.log('===>closeSave')
			},
			closeTipsSave() {
				this.$refs.popupTips.close()
			},
			checkMoreStr(num) {
				if (num < 10) {
					return '0' + num
				}
				return num;
			},
			// 手动测量
			handleClick() {
				let form = {
					age: 20,
					weight: 50,
					tall: 168,
					sexIndex: 2
				}
				let obj = uni.getStorageSync('user_measure');
				if (obj) {
					form = JSON.parse(obj);
				} else {
					form = {
						age: 20,
						weight: 50,
						tall: 168,
						sexIndex: 2,
					}
				}
				let data = new Date();
				let name = data.getFullYear() + this.checkMoreStr((data.getMonth() + 1)) + this.checkMoreStr(data
						.getDate()) + this.checkMoreStr(data
						.getHours()) + this.checkMoreStr(data.getMinutes()) +
					this.checkMoreStr(data.getSeconds())
				let orginfo = {
					name: name,
					neckHeight: Math.floor(this.sideNeckToBack),
					headHeight: Math.floor(this.sideNeckToHead),
					sideNeckHeight: Math.floor((this.shoulderSpace)),
					sideHeadHeight: Math.floor((this.frontRightPart))
				}

				let params = (orginfo)
				uni.setStorageSync('standard', JSON.stringify(params));

				saveAIMode(params)
				console.log('params:', params)
				uni.redirectTo({
					url: '/page_subject/adjust/adjust' + object2Query(params)
				})
			},
			saveHandler() {
				this.$refs.popup.open('bottom')
			},
			createMaker() {
				//
				var x = 100
				var y = 200
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
				// 重新测量
				uni.navigateTo({
					url: "/pages/shoot/shootingNew"
				})
				return;
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
								const fixWidth = this.fixedImgWidth
								const {
									width,
									height
								} = res
								console.log('getImageInfo res', res)
								this.bodyImgUrl = tempFilePaths[0];
								console.log('bodyImgUrl', this.bodyImgUrl)
								this.bodyImgWidth = fixWidth;
								this.bodyImgHeight = (fixWidth / width) * height;

								this.$set(this.frontImageStyle, '--imgWidth', (this
										.bodyImgWidth) +
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
				// 重新测量
				uni.navigateTo({
					url: "/pages/shoot/shootingNew"
				})
				return;
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
								const fixWidth = this.fixedImgWidth
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
								this.$set(this.sideImageStyle, '--imgHeight',
									bodyImgHeight +
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

				console.log('detecting:', tempUrl, isSide)

				const uploadTask = uni.uploadFile({
					// url: 'https://dev.ic1101.top/new_battle/zhBaiduAip',
					url: 'https://sleep.zsyl.cc/gpu/api/body-analysis',
					filePath: tempUrl,
					name: 'file',
					formData: {
						'fileName': base64,
						'user': 'test',
					},
					success: (uploadFileRes) => {
						console.log('uploadFileRes', uploadFileRes)
						uni.hideLoading()
						let obj = JSON.parse(uploadFileRes.data)
						console.log('success---', obj.data)
						// 如果是侧面图
						if (isSide) {
							this.handleSideData(obj.data, base64)

							// this.$refs.popupTips.open('center')
						} else {
							this.handleFrontData(obj.data)
						}
					},
					fail: (error) => {
						uni.hideLoading()
						console.error('图片上传失败', error)
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
				this.sideMouth = body_parts.left_mouth_corner.x > 0.5 ? body_parts.left_mouth_corner.x :
					body_parts
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
				console.log('sideBodyImgUrl', this.sideBodyImgUrl);
				const par1 = {
					'rect': [left, top, right, bottom],
					'face': forward
				}
				console.log('par1', par1);
				const uploadTask = uni.uploadFile({
					// url: 'https://dev.ic1101.top/new_battle/zhPyImgUpload',
					url: 'https://sleep.zsyl.cc/gpu/api/upload-image',
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
						console.log('success[upload_image]', obj)
						this.findSideGrayImage(obj.data.fileName, left, top, right, bottom, forward)
					},
					fail: (error) => {
						uni.hideLoading()
						console.error('侧面图片上传失败:', error)
					}
				})
			},
			// 查找2值图
			findSideGrayImage(imageurl, left, top, right, bottom, forward) {
				console.log('imageUrl', imageurl);
				uni.showLoading({
					title: '计算中'
				})
				uni.request({
					// url: 'https://dev.ic1101.top/new_battle/zhBaiduBodySeg',
					url: 'https://sleep.zsyl.cc/gpu/api/body-segmentation',
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
						let gray_url = res.data.data.binary_mask_path
						this.findSideInfo(gray_url, left, top, right, bottom, forward)
						// this.uploadGray2Python(grayBase64, left, top, right, bottom, forward)
					},
					fail: (error) => {
						uni.hideLoading()
						console.error('身体分割API失败:', error)
					}
				})
			},
			// 上传2值base64到python服务器
			uploadGray2Python(grayBase64, left, top, right, bottom, forward) {
				const uploadTask = uni.uploadFile({
					// url: 'https://dev.ic1101.top/new_battle/zhPyImgUpload',
					url: 'https://sleep.zsyl.cc/gpu/api/upload-image',
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
					},
					fail: (error) => {
						console.error('上传失败:', error)
					}
				})
			},
			// 去python查找侧面图片的轮廓信息
			findSideInfo(imageurl, left, top, right, bottom, forward) {
				uni.showLoading({
					title: '加载中'
				})
	
				uni.request({
					// url: 'https://dev.ic1101.top/new_battle/zhPyExec',
					url: 'https://sleep.zsyl.cc/gpu/api/neck-detection',
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
						console.log('success[neck-detection]:', res)
						let result = res.data.data
						console.log('result', result);
						// let point = result.data;
						// let points = point.split(',')
						// 后脑勺为止
						// let lower = [points[0], point[1]]
						// this.sideBlock = result.back_point
						// 最低点为止
						// this.sideLower = result.neck_point
						
						const headPoint = result.head_point
						const neckPoint = result.neck_point
						const backPoint = result.back_point
						// const otherPoint = result.input_rect
						
						this.sideNeckToBack = result.distances_mm.neck_to_back_x_distance_mm
						this.sideNeckToHead = result.distances_mm.neck_to_head_x_distance_mm
						
						this.sideB = headPoint[0];
						this.sideA = neckPoint[0];
						this.sideC = backPoint[0];

						console.log('后脑勺', this.bodyImgOriginWidth, this.fixedImgWidth, headPoint[0], (this.fixedImgWidth * headPoint[0] / this
								.bodyImgOriginWidth))
						// 后脑勺
						this.$set(this.headPointWrapStyle, '--left', (this.fixedImgWidth * headPoint[0] / this
								.bodyImgOriginWidth) + 'px')
						this.$set(this.headPointWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(headPoint[1] -
								this.bodyImgOriginHeight) / this.bodyImgOriginWidth) + 'px')
						// 脖颈最低
						this.$set(this.neckPointWrapStyle, '--left', (this.fixedImgWidth * neckPoint[0] / this
								.bodyImgOriginWidth) + 'px')
						this.$set(this.neckPointWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(neckPoint[1] -
								this.bodyImgOriginHeight) / this.bodyImgOriginWidth) + 'px')

						// 后背坐标
						this.$set(this.backPointWrapStyle, '--left', (this.fixedImgWidth * backPoint[0] / this
								.bodyImgOriginWidth) +
							'px')
						this.$set(this.backPointWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(backPoint[
									1] -
								this
								.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
							'px')

						// // 颈部上坐标
						// this.$set(this.backUpPointWrapStyle, '--left', (this.fixedImgWidth * otherPoint[0] / this
						// 		.bodyImgOriginWidth) +
						// 	'px')
						// this.$set(this.backUpPointWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(otherPoint[
						// 			1] -
						// 		this
						// 		.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
						// 	'px')

						// // 颈部下坐标
						// this.$set(this.backDownPointWrapStyle, '--left', (this.fixedImgWidth * otherPoint[2] / this
						// 		.bodyImgOriginWidth) +
						// 	'px')
						// this.$set(this.backDownPointWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(
						// 		otherPoint[3] -
						// 		this
						// 		.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
						// 	'px')
						// console.log('points:', points)

						this.$refs.popupTips.open('center')

						this.finishDecting();
					},
					fail: (error) => {
						uni.hideLoading()
						console.error('颈部检测API失败:', error)
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
				space = space + 1;

				let form = {
					age: 20,
					weight: 50,
					tall: 168,
					sexIndex: 2
				}
				let measureobj = uni.getStorageSync('user_measure');
				if (measureobj) {
					form = JSON.parse(measureobj);
				} else {
					form = {
						age: 20,
						weight: 50,
						tall: 168,
						sexIndex: 2,
					}
				}


				let speSpace = 120
				// 判断是否女的
				// if (form && form.sexIndex) {
				// 	if (form.sexIndex == 2) {
				// 		speSpace = 100;
				// 	}
				// }

				this.shoulderSpace = Math.floor(space)
				this.shoulderSpace = (this.shoulderSpace * 0.5 - speSpace) * 1;
				this.shoulderSpace = this.shoulderSpace.toFixed(0)
				// 不低于30mm
				this.shoulderSpace = Math.max(this.shoulderSpace, 30)
				// 不高于110mm
				this.shoulderSpace = Math.min(this.shoulderSpace, 110)

				space = Math.abs(this.frontLeftEarX - this.frontRightEarX);
				space = space * this.unit / this.factor
				space = space + 1
				space = space.toFixed(3)

				this.headSpace = space;
				
				// 左肩
				this.$set(this.shoulderLeftWrapStyle, '--left', (this.fixedImgWidth * rightShoulder / this
						.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderLeftWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(right_shoulder.y - this
						.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
					'px')
				// 右肩
				this.$set(this.shoulderRightWrapStyle, '--left', (this.fixedImgWidth * leftShoulder / this
						.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderRightWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(left_shoulder.y - this
						.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
					'px')
				// 左耳
				this.$set(this.shoulderLeftEarWrapStyle, '--left', (this.fixedImgWidth * this.frontLeftEarX / this
						.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderLeftEarWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(body_parts.left_ear.y -
						this
						.bodyImgOriginHeight) / this.bodyImgOriginWidth) +
					'px')
				// 右耳
				this.$set(this.shoulderRightEarWrapStyle, '--left', (this.fixedImgWidth * this.frontRightEarX / this
						.bodyImgOriginWidth) +
					'px')
				this.$set(this.shoulderRightEarWrapStyle, '--bottom', (this.fixedImgWidth * Math.abs(body_parts.right_ear
						.y -
						this
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