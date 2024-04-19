<template>
	<z-nav-bar backState=2000 home='false'></z-nav-bar>
	<view class='container'>
		<image mode="widthFix" class="image1" src="../../static/product/SY_12_bgJY.jpg"></image>
		<image mode="widthFix" class="image2" src="../../static/product/SY_12_bgQZY.jpg"></image>
		<image mode="widthFix" class="image2" src="../../static/product/SY_12_bgJKJC.jpg"></image>
		<image mode="widthFix" class="image3" src="../../static/product/SY_12_bgFJZS.jpg"></image>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello123'
			}
		},
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 2
				});
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style lang="scss">
	.container {
		display: flex;
		flex-wrap: wrap;
		margin: 0 auto;
		margin-bottom: 200rpx;
		justify-content: center;

		image {
			padding: 10rpx;
		}

		.image1 {
			width: 668rpx;
			height: 360rpx;
		}

		.image2 {
			width: 326rpx;
			height: 402rpx;
		}

		.image3 {
			width: 668rpx;
			height: 166rpx;
		}
	}
</style>