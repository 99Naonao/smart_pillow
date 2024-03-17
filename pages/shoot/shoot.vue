<template>
	<view class="">
		<image class="backimg" src="../../static/index/SY_00_000.jpg" mode="widthFix"></image>
	</view>
	<view>
		<view>正面图片</view>
		<view class="frontPic" :style="frontImageStyle">
			<image :src="bodyImgUrl" mode="widthFix"></image>
		</view>
		<view class="uni-common-mt">
			<view class="uni-form-item uni-column">
				<view class="title">正面信息:</view>
				<view>
					<view><label class="title">肩宽:</label>{{shoulderSpace}}m</view>
					<view><label class="title">左耳朵到左肩:</label>{{frontLeftPart}}m</view>
					<view><label class="title">右耳朵到右肩:</label>{{frontRightPart}}m</view>
					<view><label class="title">脖子到左肩:</label>{{frontLeftNeckPart}}m</view>
					<view><label class="title">脖子到右肩:</label>{{frontRightNeckPart}}m</view>
				</view>
			</view>
		</view>

		<view class="btn-cnt" style="padding-bottom: 200rpx;">
			<button type="primary" @click="startCamera">开始拍摄正面照</button>
		</view>
	</view>
	<view>
		<view>侧面图片</view>
		<image class="frontPic"></image>
		<view class="uni-common-mt">
			<view class="uni-form-item uni-column">
				<view class="title">侧面信息:</view>
				<view>
					<view><label class="title">肩宽:</label>{{shoulderPart}}m</view>
					<view><label class="title">耳朵与眼睛之间:</label>{{leftPart}}m</view>
					<view><label class="title">耳朵与鼻子之间:</label>{{rightPart}}m</view>
					<view><label class="title">嘴巴与耳朵之间:</label>{{rightPart}}m</view>
					<view><label class="title">脖子到右肩:</label>{{rightPart}}m</view>
					<view><label class="title">脖子到左肩:</label>{{rightPart}}m</view>
				</view>
			</view>
		</view>
		<view class="btn-cnt" style="padding-bottom: 200rpx;">
			<button type="primary" @click="startSideCamera">开始拍摄侧面照</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				frontImageStyle: {
					'--imgWidth': '100rpx',
					'--imgHeight': '100rpx',
				},
				bodyImgUrl: '',
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
			}
		},
		computed: {
			frontLeftPart() {
				let space = Math.abs(this.frontLeftEarX - this.frontLeftShoulder);
				space = space / this.bodyImgOriginWidth
				space = space.toFixed(2)
				return space
			},
			frontRightPart() {
				let space = Math.abs(this.frontRightEarX - this.frontRightShoulder);
				space = space / this.bodyImgOriginWidth
				space = space.toFixed(2)
				return space
			},
			frontLeftNeckPart() {
				let space = Math.abs(this.frontNeck - this.frontRightShoulder);
				space = space / this.bodyImgOriginWidth
				space = space.toFixed(2)
				return space
			},
			frontRightNeckPart() {
				let space = Math.abs(this.frontNeck - this.frontRightShoulder);
				space = space / this.bodyImgOriginWidth
				space = space.toFixed(2)
				return space
			},
			shoulderPart() {
				return 3
			}
		},
		methods: {
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
			},
			startSideCamera() {

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
						this.handleFrontData(obj)

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
				space = space / this.bodyImgOriginWidth
				space = space.toFixed(2)
				this.shoulderSpace = space
			}
		}
	}
</script>

<style scoped lang="scss">
	.backimg {
		width: 100%;
		display: block;
	}

	.frontPic {
		width: var(--imgWidth);
		height: var(--imgHeight);
		margin: 0 auto;
	}

	.frontPic image {
		width: 100%;
		height: 100%;
	}
</style>