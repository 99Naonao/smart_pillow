<template>
	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'></z-nav-bar>
	<view class="main">
		<swiper class="swiper-box" indicator-dots="true" indicator-active-color="#000"
		 @change="change" :current="swiperDotIndex" interval="3000" autoplay="true">
			<swiper-item class="swiper-item" v-for="(item,index) in info" :key="index">
				<image :src="item.image" mode="aspectFill" class="backImage"/>
			</swiper-item>
		</swiper>
		<view class="info">
			<view class="info-btn" @click="measureHandler">
				开始测量
			</view>
			<view class="skip-btn" @click="skipMeasureHandler">
				跳过测量，前往使用默认高度
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
							<input class="uni-input" type="number" v-model="form.age" name="age" placeholder="请输入" />
						</view>
						<view class="uni-form-item">
							<view class="title">体重</view>
							<view class="input-part">
								<input class="uni-input" type="number" name="weight" v-model="form.weight"
									placeholder="请输入" />
								<view class="unit-tips">kg</view>
							</view>
						</view>
						<view class="uni-form-item">
							<view class="title">身高</view>
							<view class="input-part">
								<input class="uni-input" type="number" name="tall" v-model="form.tall"
									placeholder="请输入" />
								<view class="unit-tips">cm</view>
							</view>
						</view>
						<view class="uni-form-item">
							<view class="title">性别</view>
							<view class="select-part flex flex1">
								<view :class="form.sexIndex==1?'select-btn':'select-btn unselect-btn'"
									@click="selectHandler(1)">
									<image mode="widthFix" class="icon1" :src="'../static/SY_05_butIconManB.png'">
									</image>
									<label>男</label>
								</view>
								<view :class="form.sexIndex==2?'select-btn':'select-btn unselect-btn'"
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
				form: {
					age: 20,
					weight: 50,
					tall: 168,
					sexIndex: 2,
				},
				swiperDotIndex:0,
				current:0,
				info:[{
					image:'../../page_subject/static/bg_text.png'
				},{
					image:'../../page_subject/static/bg_front.jpg'
				},{
					image:'../../page_subject/static/bg_side.jpg'
				}]
			}
		},
		onShow() {
			let obj = uni.getStorageSync('user_measure');
			if (obj) {
				console.log('obj:', obj)
				this.form = JSON.parse(obj);
			} else {
				this.form = {
					age: 20,
					weight: 50,
					tall: 168,
					sexIndex: 2,
				}
			}
			console.log("this.form", this.form)
		},
		methods: {
			change(e){
				this.current = e.detail.current
			},

			sliderChange(e) {
				console.log('value 发生变化：' + e.detail.value)
			},
			selectHandler(index) {
				this.form.sexIndex = index
			},
			formSubmit: function(e) {
				console.log('form发生了submit事件，携带数据为：' + JSON.stringify(e.detail.value))
				var formdata = e.detail.value
				// uni.showModal({
				// 	content: '表单数据内容：' + JSON.stringify(formdata),
				// 	showCancel: false
				// });

				uni.setStorageSync('user_measure', JSON.stringify(this.form))

				uni.navigateTo({
					url: '/pages/shoot/shootingNew'
				})
			},
			formReset: function(e) {
				console.log('清空数据')
			},
			measureHandler() {
				this.$refs.ppp.open('bottom')
			},
			closePopUpHandle() {
				this.$refs.ppp.close()
			},
			saveHandler() {
				this.$refs.ppp.close()
			},
			// 跳过测量，跳转到默认数据页面
			skipMeasureHandler() {
				uni.navigateTo({
					url: '/page_subject/mode/mode'
				})
			}
		}
	}
</script>

<style lang="scss">
	.main {
		height: 100%;
			
		.swiper-box{
			height: 1200rpx;
			width: 750rpx;
		}
		
		.swiper-item{
			display: flex;
			height: 100%;
			
			.backImage{
				width: 100%;
				height: 100%;
			}
		}

		.info {
			position: absolute;
			bottom: 100rpx;
			left: 50%;
			transform: translateX(-50%);
		}

	}


	.tips-container {
		background-color: rgba(0, 0, 0, 0.3);
		width: 100%;
		position: absolute;
		top: 750rpx;
		bottom: 0rpx;
		right: 0rpx;
		left: 0rpx;

		.tips {
			width: 446rpx;
			padding: 50rpx;
		}
	}


	.info-btn {
		background: linear-gradient(135deg, #4281c1, #5a9bd4);
		margin: 0 auto;
		color: white;
		width: 450rpx;
		text-align: center;
		font-size: 36rpx;
		font-weight: 500;
		padding: 32rpx 50rpx;
		line-height: 1.2;
		border-radius: 25rpx;
		margin-top: 50rpx;
		box-shadow: 0 8rpx 20rpx rgba(66, 129, 193, 0.3);
		transition: all 0.3s ease;
	}

	.info-btn:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 12rpx rgba(66, 129, 193, 0.4);
	}

	.skip-btn {
		background-color: rgba(255, 255, 255, 0.9);
		margin: 0 auto;
		color: #666;
		width: 450rpx;
		text-align: center;
		font-size: 32rpx;
		font-weight: 400;
		padding: 28rpx 50rpx;
		line-height: 1.2;
		border-radius: 25rpx;
		margin-top: 30rpx;
		border: 2rpx solid #e0e0e0;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.skip-btn:active {
		transform: translateY(2rpx);
		background-color: rgba(248, 248, 248, 0.9);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	}



	.container {
		background-color: #eff2f6;
		border-radius: 50rpx 50rpx 0rpx 0rpx;
		position: relative;

		.tip {
			width: 106rpx;
			height: 95rpx;
			position: absolute;
			left: 50%;
			top: -45rpx;
			margin-left: -53rpx;
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
					background-color: #9986bf;
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
				background-color: #003c71;
				margin: 0 auto;
				line-height: 102rpx;
				text-align: center;
				color: white;
				margin-top: 30rpx;
				border-radius: 30rpx;
			}
		}
	}
</style>