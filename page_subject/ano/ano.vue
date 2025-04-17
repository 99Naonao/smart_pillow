<template>
	<z-nav-bar backState="1000" fontColor='#000' transparentFixedFontColor='#000'></z-nav-bar>
	<view class="container">
		<view class="top-part">
			<image class="top-img" mode="widthFix" :src="'../static/ano/SY_02A_001.png'"></image>
			<label class="tips">{{tips}}</label>
		</view>
		<view class="opt flex">
			<view class="opt-item">
				<image mode="widthFix" class="icon1" :src="'../static/ano/SY_02A_IconZYKF.png'"></image><button
					class="opt-item1" open-type="contact" bindcontact="handleContact">专业客服</button>
			</view>
			<view class="opt-item" @click="nav2">
				<image mode="widthFix" class="icon2" :src="'../static/ano/SY_02A_IconJZWT1.png'"></image>
				<view>脊柱微调</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				tips: "测试数据"
			}
		},
		methods: {
			nav1() {

			},
			nav2() {
				uni.navigateTo({
					url: "/page_subject/anoMoving/anoMoving"
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.wx-button:after {
		border: none;
	}

	.container {
		margin-left: 41rpx;
		margin-right: 41rpx;

		.top-part {
			position: relative;

			.top-img {
				width: 668rpx;
				height: 391rpx;
			}

			.tips {
				position: absolute;
				letter-spacing: 1px;
				top: 95rpx;
				left: 49rpx;
				color: white;
			}
		}

		.opt {
			display: flex;
			justify-content: space-around;
			align-items: center;
			margin-top: 37rpx;

			.icon1 {
				width: 63rpx;
				display: block;
				margin-left: 25rpx;
			}

			.icon2 {
				display: block;
				width: 45rpx;
			}

			.opt-item1 {
				border: none;
				background-color: rgb(77, 127, 201);
				border-radius: 15rpx;
				color: white;
				width: 259rpx;
				line-height: 173rpx;
				display: flex;
				font-size: 38rpx;
				letter-spacing: 5rpx;
				justify-content: space-around;
				align-items: center;

				::after {
					border: none !important;
				}
			}

			.opt-item {
				background-color: rgb(77, 127, 201);
				border-radius: 15rpx;
				color: white;
				width: 329rpx;
				line-height: 173rpx;
				display: flex;
				font-size: 38rpx;
				letter-spacing: 5rpx;
				justify-content: space-around;
				align-items: center;
			}
		}
	}
</style>