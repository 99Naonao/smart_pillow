<template>
	<view class="info-part" :class="showTips?['info-top']:[]">
		<view class="text-tips" v-if="showTips">小提示:建议您的调整不要超过推荐数值</view>
		<view class="info-item-recommond">
			<view class="info-left">
				<image class="icon3" mode="widthFix" :src="'../static/mode/SY_04A_IconAIh.png'"></image>
				<label>推荐高度</label>
			</view>
			<view class="info-right">
				<view class="info-recommond-right">
					<view class="info-r1">
						<image class="sicon1" mode="widthFix" :src="'../static/mode/SY_04A_IconYWs.png'"></image>
					</view>
					<view class="info-r2">
						<view>
							头枕高度{{standard.headHeight}}mm
						</view>
						<view>
							颈枕高度{{standard.neckHeight}}mm
						</view>
					</view>
				</view>
				<view class="info-recommond-right">
					<view class="info-r1">
						<image class="sicon2" mode="widthFix" :src="'../static/mode/SY_04A_IconCWs.png'"></image>
					</view>
					<view class="info-r2">
						<view>
							头枕高度{{standard.sideHeadHeight}}mm
						</view>
						<view>
							颈枕高度{{standard.sideNeckHeight}}mm
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			showTips: {
				type: Boolean,
				default: true,
			},
			standard: {
				type: Object,
				default: () => {}
			}
		},
		data() {
			return {

			}
		},
		mounted() {
			// let standard = uni.getStorageSync('standard');
			// if (standard) {
			// 	this.standard = JSON.parse(standard)
			// } else {
			// 	this.standard = {
			// 		headHeight: 60,
			// 		neckHeight: 60,
			// 		sideHeadHeight: 60,
			// 		sideNeckHeight: 60,
			// 	}
			// }
		},
		onShow() {}
	}
</script>

<style lang="scss" scoped>
	.info-part {

		margin-left: 40rpx;
		margin-right: 40rpx;
		font-size: 24rpx;
		color: #354D5B;

		.info-top {
			margin-top: 50rpx;
		}

		.text-tips {
			text-align: center;
			color: rgb(28, 68, 133);
			font-size: 24rpx;
			padding: 10rpx;
		}

		.info-item-recommond {
			display: flex;
			align-items: center;
			height: 142rpx;
			margin-top: 13rpx;

			.sicon1 {
				width: 41rpx;
				display: block;
				margin-left: 20rpx;
				margin-right: 20rpx;
			}

			.sicon2 {
				width: 41rpx;
				display: block;
				margin-left: 20rpx;
				margin-right: 20rpx;
			}



			.info-left {
				background-color: rgb(213, 224, 247);
				border-top-left-radius: 15rpx;
				border-bottom-left-radius: 15rpx;
				border-right: rgb(197, 208, 230) 5rpx solid;
				width: 133rpx;
				height: 142rpx;
				text-align: center;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
			}

			.info-r1 {}

			.info-r2 {
				flex: 1;
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				padding-left: 0rpx;
				padding-right: 20rpx;
			}

			.info-recommond-right {
				display: flex;
				align-items: center;
				justify-content: space-around;
				width: 100%;
				padding-left: 20rpx;
				padding-right: 20rpx;
			}

			.info-right {
				display: flex;
				align-items: center;
				justify-content: space-around;
				flex-direction: column;
				flex: 1;
				height: 142rpx;
				background-color: white;
				border-top-right-radius: 15rpx;
				border-bottom-right-radius: 15rpx;
				background-color: rgb(213, 224, 247);
			}

			.icon1 {
				width: 60rpx;
				display: block;
				margin: 0 auto;
			}

			.icon2 {
				width: 61rpx;
				display: block;
				margin: 0 auto;
			}

			.icon3 {
				width: 53rpx;
				display: block;
				margin: 0 auto;
			}
		}

		.info-item {
			display: flex;
			align-items: center;
			height: 101rpx;
			margin-top: 13rpx;

			// justify-content: space-around;

			.info-left {
				background-color: white;
				border-top-left-radius: 15rpx;
				border-bottom-left-radius: 15rpx;
				border-right: rgb(197, 208, 230) 5rpx solid;
				width: 133rpx;
				height: 101rpx;
				text-align: center;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
			}

			.info-right {
				display: flex;
				align-items: center;
				justify-content: space-between;
				flex: 1;
				height: 101rpx;
				padding-left: 20rpx;
				padding-right: 20rpx;
				background-color: white;
				border-top-right-radius: 15rpx;
				border-bottom-right-radius: 15rpx;
			}

			.icon1 {
				width: 60rpx;
				display: block;
				margin: 0 auto;
			}

			.icon2 {
				width: 61rpx;
				display: block;
				margin: 0 auto;
			}

			.icon3 {
				width: 53rpx;
				display: block;
				margin: 0 auto;
			}
		}
	}
</style>