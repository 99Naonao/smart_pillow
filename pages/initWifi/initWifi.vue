<template>
	<Nav :wrap-style="navWrapStyle" :propPillowName="'23232332'"></Nav>
	<view class="main">
		<view class="pillow-top border-item">
			<view class="pillow-name">
				{{propPillowName}}
			</view>
		</view>
		<view>请选择网络</view>
		<view v-for="(item,index) in wifiList">
			<view class="">
				{{item.SSID}}
			</view>
		</view>
	</view>
</template>

<script>
	import Nav from '@/comp/Nav'
	export default {
		onLoad() {
			// this.initCompRect()
			uni.startWifi({
				success: res => {
					console.log("初始化wifi模块成功123" + res.errMsg)
					// 需要自行进入“设置 - 无线局域网”，然后等待无线网刷新完成
					uni.getWifiList({
						success: (res) => {
							console.log("getWifiList123模块成功", res)
						},
						fail: (res) => {
							uni.showToast({
								title: res.errMsg
							})
						}
					})
				}
			});
		},
		onHide() {
			uni.offGetWifiList(this.onWifiList)
		},
		onShow() {
			// 把wx.onGetWifiList()放在onShow()中，在第3步骤“无线网刷新完成后，自行回到“微信””后，便可以正常执行wx.onGetWifiList()的回调函数，可以在控制台打印，手机打开调试。
			uni.onGetWifiList((res) => {
				this.wifiList = res.wifiList;
				console.log('onGetWIfiList!!!!:::', res)
			})
			// uni.getConnectedWifi({
			// 	success: (res) => {
			// 		console.log('success:', res)
			// 	}
			// })
			// console.log('fuck2fuck31112', getApp(), this.$options, this.$options.globalData)
		},
		components: {
			Nav
		},
		data() {
			return {
				wifiList: [],
				pillowName: '123',
				statusBarHeight: 0,
				navBarWidth: 0,
				navBarHeight: 0,
				menuButtonInfo: {
					width: 0,
					height: 0,
					top: 0,
					left: 0,
				},
			}
		},
		computed: {
			navWrapStyle() {
				return ''
			},
		},
		props: {
			propPillowName: {
				type: String,
				default: '333'
			},
		},
		methods: {
			onWifiList(res) {
				console.log("onWifiList1111", res)
				this.wifiList = res.wifiList
			},
			// 返回
			backHandler() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss">
	.main {
		margin-left: 40rpx;
		margin-right: 40rpx;
		position: relative;
		display: inline-block;

		.border-item {
			padding-left: 66rpx;
			padding-right: 10rpx;
			border: 1px solid #333333;
		}

		.pillow-top {
			display: flex;

		}
	}

	.arrow-left {
		flex: none;
		width: 30rpx;
		height: 30rpx;
		border-top: 2px solid #333333;
		border-right: 2px solid #333333;
		transform: rotate(-135deg);
	}

	.arrow-right {
		flex: none;
		width: 16rpx;
		height: 16rpx;
		border-top: 1px solid #333333;
		border-right: 1px solid #333333;
		transform: rotate(45deg);
	}

	.pillow-name {
		color: #5B7897;
	}
</style>