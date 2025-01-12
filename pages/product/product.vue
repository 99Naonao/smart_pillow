<template>
	<z-nav-bar backState=2000 home='false'></z-nav-bar>
	<view class='container'>
		<image mode="widthFix" class="image1" src="../../static/product/SY_12_bgJY.png" @click='productMallHandler'>
		</image>
		<image mode="widthFix" class="image2" src="../../static/product/SY_12_bgQZY.png" @click='productSleepHandler'>
		</image>
		<image mode="widthFix" class="image2" src="../../static/product/SY_12_bgJKJC.png" @click='productHandler'>
		</image>
		<image mode="widthFix" class="image3" src="../../static/product/SY_12_bgFJZS.png" @click='go2Use'>
		</image>
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
					selected: 1
				});
			}
		},
		onLoad() {

		},
		methods: {
			productMallHandler(e) {
				wx.navigateToMiniProgram({
					appId: 'wxadc17399e1b28d8b',
				})
			},
			productHandler(e) {
				wx.navigateToMiniProgram({
					appId: 'wxadc17399e1b28d8b',
					path: 'pages/shop/shopDetail?id=10030',
					extraData: {
						id: 10030
					}
				})
			},
			productSleepHandler(e) {
				wx.navigateToMiniProgram({
					appId: 'wxadc17399e1b28d8b',
					path: 'pages/shop/shopDetail?id=10031',
					extraData: {
						id: 10031
					}
				})
			},
			go2Use() {
				const url5 = 'https://sleep.zsyl.cc/sleeph5/miniIndex.html'
				const navtitle = '健康检测'
				console.log('go2use:', url5)
				wx.navigateTo({
					// 跳转到webview页面
					url: `/pages/mine/webview?url=${url5}&nav=${navtitle}`,
				});
			},
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