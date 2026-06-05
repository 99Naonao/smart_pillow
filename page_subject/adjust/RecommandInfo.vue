<template>
	<view class="info-part" :class="showTips?['info-top']:[]">
		<view class="text-tips" v-if="showTips">小提示:请按需调节高度，避免一次幅度过大</view>
		<view class="info-item-recommond">
			<view class="info-card">
				<view class="info-recommond-right">
					<view class="info-r1">
						<image class="sicon1" mode="widthFix" :src="'../static/mode/SY_04A_IconYWs.png'"></image>
					</view>
					<view class="info-r2">
						<view>
							头枕高度 {{ pctLabel(standard.headHeight) }}
						</view>
						<view>
							颈枕高度 {{ pctLabel(standard.neckHeight) }}
						</view>
					</view>
				</view>
				<view class="info-recommond-right">
					<view class="info-r1">
						<image class="sicon2" mode="widthFix" :src="'../static/mode/SY_04A_IconCWs.png'"></image>
					</view>
					<view class="info-r2">
						<view>
							头枕高度 {{ pctLabel(standard.sideHeadHeight) }}
						</view>
						<view>
							颈枕高度 {{ pctLabel(standard.sideNeckHeight) }}
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
		methods: {
			pctLabel(pct) {
				const p = Math.max(0, Math.min(100, Number(pct) || 0))
				return `${Math.round(p)}%`
			}
		},
		mounted() {
		},
		onShow() {}
	}
</script>

<style lang="scss" scoped>
	.info-top {
		margin-top: 50rpx;
	}

	.info-part {
		margin-left: 40rpx;
		margin-right: 40rpx;
		font-size: 24rpx;
		color: #051C2C;


		.text-tips {
			text-align: center;
			color: #083969;
			font-size: 24rpx;
			padding: 10rpx;
		}

		.info-item-recommond {
			margin-top: 13rpx;
		}

		.info-card {
			display: flex;
			align-items: center;
			justify-content: space-around;
			flex-direction: column;
			min-height: 142rpx;
			width: 100%;
			box-sizing: border-box;
			padding: 16rpx 20rpx;
			background-color: #ffffff;
			border-radius: 15rpx;
			border: 1rpx solid rgba(175, 160, 201, 0.45);
			box-shadow: 0 4rpx 16rpx rgba(28, 68, 133, 0.06);
			position: relative;
			z-index: 1;
		}

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

	}
</style>
