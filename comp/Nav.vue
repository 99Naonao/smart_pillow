<template>
	<view class="nav wrapStyle" :style="wrapStyle">
		<view class="arrow-left" @click="backHandler">
		</view>
		<view class="nav-title">{{propPillowName}}</view>
	</view>
</template>


<script>
	export default {
		mounted() {
			this.$data.navBarHeight = getApp().globalData.navHeight
			this.navBarHeight = getApp().globalData.navHeight
			this.$data.menuBottom = getApp().globalData.menuBottom
			this.$data.menuHeight = getApp().globalData.menuHeight
			// this.$set(wrapStyle, '--navBarHeight', getApp().globalData.navHeight)
			console.log('fuck2fuck442', this.$data, this.$data.navHeight, getApp().globalData.menuBottom, this.$data
				.menuBottom, this.$data.menuHeight)
		},
		data() {
			return {
				navBarHeight: 1,
				menuBottom: 1,
				menuHeight: 1,
				wifiList: [],
				wrapStyle: {
					'--navTop': '100rpx',
					'--navBarHeight': '100rpx',
				}
			}
		},
		props: {
			propPillowName: {
				type: String,
				default: '333'
			},
		},
		methods: {
			backHandler() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss">
	// style
	// 导航栏
	.nav {
		display: flex;
		align-items: center;
		width: 100%;
		height: 80rpx;
		padding: 1rpx 3rpx 0 3rpx;
		position: fixed;
		background-color: rgba(255, 255, 255, 0);

	}

	// 胶囊栏
	.capsule-box {
		position: absolute;
		display: flex;
		align-items: center;
	}

	// 标题文字
	.nav-title {
		line-height: 80rpx;
		width: 50%;
		margin: 0 auto;
		overflow: hidden;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.arrow-left {
		flex: none;
		width: 30rpx;
		height: 30rpx;
		margin-left: 30rpx;
		border-top: 2px solid #333333;
		border-right: 2px solid #333333;
		transform: rotate(-135deg);
	}

	.wrapStyle {
		height: var(--navBarHeight);
	}

	.navStyle {
		position: fixed;
		left: 0;
		right: 0;
		z-index: 9;
		top: var(--navTop);
	}
</style>