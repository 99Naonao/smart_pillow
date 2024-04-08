<template>
	<Nav></Nav>
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
</template>

<script>
	import Nav from '@/comp/Nav'
	export default {
		components: {
			Nav
		},
		data() {

		},
		methods: {
			measureHandler() {

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

	.info {}
</style>