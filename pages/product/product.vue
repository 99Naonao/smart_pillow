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
					appId: 'wx041bde7c633d4ec0',
				})
			},
			productHandler(e) {
				wx.navigateToMiniProgram({
					appId: 'wx041bde7c633d4ec0',
					path: 'pages/order_detail/order_detail?id=10073',
					extraData: {
						id: 10073
					}
				})
			},
			productSleepHandler(e) {
				wx.navigateToMiniProgram({
					appId: 'wx041bde7c633d4ec0',
					path: 'pages/order_detail/order_detail?id=10071',
					extraData: {
						id: 10071
					}
				})
			},
			go2Use() {
				const url5 = 'https://sleep.xinglu.shop/sleeph5'
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