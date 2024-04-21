<template>
	<!-- 	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='测量'></z-nav-bar> -->
	<view class="main">
		<view class="back-img-container">
			<image class="backimg" mode="widthFix" :src="'../static/SY_05_000.jpg'"></image>
		</view>
		<view class="tips-container">
			<image class="tips" mode="widthFix" :src="'../static/SY_06_Font01.png'"></image>
		</view>
		<view class="info">
			<view class="info-btn" @click="measureHandler">
				开始测量
			</view>
		</view>
	</view>
	<uni-popup ref="ppp" style="z-index: 10000; position: absolute;" border-radius="40rpx 40rpx 0rpx 0rpx"
		background-color='white' safe-area="false" class="popup" :mask-click="false" @change="change">
		<view class="container">
			<image class="close-btn" @click="closePopUpHandle" src="@/page_subject/static/adjust/SY_05_buttonCOLa.png"
				mode="widthFix">
			</image>
			<image class="tip" src="@/static/adjust/SY_05_B001.png" mode="widthFix"></image>
			<view class="touch">
				<view>
					<form @submit="formSubmit" @reset="formReset">
						<view class="uni-form-item flex">
							<view class="title">年龄</view>
							<input class="uni-input" name="age" placeholder="请输入" />
						</view>
						<view class="uni-form-item">
							<view class="title">体重</view>
							<view class="input-part">
								<input class="uni-input" name="weight" placeholder="请输入" />
								<view class="unit-tips">kg</view>
							</view>
						</view>
						<view class="uni-form-item">
							<view class="title">身高</view>
							<view class="input-part">
								<input class="uni-input" name="tall" placeholder="请输入" />
								<view class="unit-tips">cm</view>
							</view>
						</view>
						<view class="uni-form-item">
							<view class="title">性别</view>
							<view class="select-part flex flex1">
								<view :class="this.sexIndex==1?'select-btn':'select-btn unselect-btn'"
									@click="selectHandler(1)">
									<image mode="widthFix" class="icon1" :src="'../static/SY_05_butIconManB.png'">
									</image>
									<label>男</label>
								</view>
								<view :class="this.sexIndex==2?'select-btn':'select-btn unselect-btn'"
									@click="selectHandler(2)">
									<image mode="widthFix" class="icon2" :src="'../static/SY_05_butIconManB.png'">
									</image>
									<label>女</label>
								</view>
							</view>
						</view>
						<view class="uni-form-item uni-column">
							<view class="title" style="text-align: left;">请选择你喜欢的枕头高度</view>
							<view class="slide-part">
								<slider value="50" @change="sliderChange" activeColor="#ed6546"
									backgroundColor="#f9cec6" block-color="#ed6546" block-size="20" />
								<view class="flex"
									style="justify-content:space-between;padding-left: 30rpx;padding-right: 30rpx;">
									<view>低</view>
									<view>中</view>
									<view>高</view>
								</view>
							</view>
						</view>
						<view class="uni-form-item uni-column">
							<button class="save" form-type="submit" @click="saveHandler">完成</button>
						</view>
					</form>
				</view>
			</view>
		</view>
	</uni-popup>
</template>

<script>
	export default {
		components: {},
		data() {
			return {
				sexIndex: 1
			}
		},
		methods: {
			sliderChange(e) {
				console.log('value 发生变化：' + e.detail.value)
			},
			selectHandler(index) {
				this.sexIndex = index
			},
			formSubmit: function(e) {
				console.log('form发生了submit事件，携带数据为：' + JSON.stringify(e.detail.value))
				var formdata = e.detail.value
				// uni.showModal({
				// 	content: '表单数据内容：' + JSON.stringify(formdata),
				// 	showCancel: false
				// });

				uni.navigateTo({
					url: '/pages/shootView/shootView'
				})
			},
			formReset: function(e) {
				console.log('清空数据')
			},
			measureHandler() {
				this.$refs.ppp.open('bottom')
			},
			saveHandler() {

			}
		}
	}
</script>

<style lang="scss">
	.back-img-container {
		width: 750rpx;
		height: 1000rpx;
		overflow: hidden;
	}

	.tips-container {
		background-color: rgba(0, 0, 0, 0.3);
		width: 100%;
		position: absolute;
		top: 750rpx;
		left: 0rpx;

		.tips {
			width: 446rpx;
			padding: 50rpx;
		}
	}


	.info-btn {
		background-color: #ff8000;
		margin: 0 auto;
		color: white;
		width: 400rpx;
		text-align: center;
		font-size: 40rpx;
		padding: 30rpx;
		line-height: 60rpx;
		padding-left: 50rpx;
		padding-right: 50rpx;
		border-radius: 15rpx;
		margin-top: 50rpx;
	}

	.backimg {
		width: 750rpx;
	}

	.container {
		background-color: white;
		border-radius: 50rpx 50rpx 0rpx 0rpx;
		position: relative;

		.tip {
			width: 322rpx;
			height: 161rpx;
			position: absolute;
			left: 50%;
			top: -60rpx;
			margin-left: -161rpx;
		}

		.close-btn {
			width: 26rpx;
			height: 27rpx;
			right: 30rpx;
			top: 20rpx;
			position: absolute;
		}

		.touch {
			text-align: center;
			padding: 30rpx;
			padding-top: 100rpx;

			.title {
				color: #5B7897;
				line-height: 60rpx;
			}

			.uni-input {
				text-align: left;
				border-radius: 10rpx;
				background-color: #eee;
			}

			.input-part {
				border-radius: 10rpx;
				background-color: #eee;
				display: flex;
				flex: 1;
			}

			.unit-tips {
				line-height: 80rpx;
				padding-right: 10rpx;
			}

			.select-part {
				padding-top: 10rpx;

				justify-content: space-between;


				.icon1 {
					width: 30rpx;
					height: 30rpx;
				}

				.icon2 {
					width: 23rpx;
					height: 37rpx;
				}

				.select-btn {
					background-color: rgb(238, 126, 39);
					width: 275rpx;
					height: 71rpx;
					border-radius: 20rpx;
					color: white;
					display: flex;
					justify-content: space-around;
					align-items: center;
				}

				.selected {
					background-color: #5B7897;
				}

				.unselect-btn {
					background-color: #5B7897 !important;
				}
			}

			.slide-part {
				background-color: #eee;
				border-radius: 10rpx;
				padding-bottom: 10rpx;
			}


			.save {
				width: 500rpx;
				height: 102rpx;
				background-color: #5B7897;
				margin: 0 auto;
				line-height: 102rpx;
				text-align: center;
				color: white;
				margin-top: 30rpx;
				border-radius: 30rpx;
			}
		}
	}

	.info {}
</style>