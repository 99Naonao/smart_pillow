<template>
	<view class="">
		<image class="topKV" :style="menuStyle" mode="widthFix" src="/static/SY_01_000.png"></image>
		<uni-popup ref="ppp" style="z-index: 10; position: absolute;" border-radius="40rpx 40rpx 0rpx 0rpx"
			background-color='white' safe-area="true" class="popup" :mask-click="false" @change="change">
			<view class="container">
				<image class="tip" :src="'/static/adjust/SY_05_B001.png'" mode="widthFix"></image>
				<uni-collapse ref="collapse" v-model="value" @change="change">
					<uni-collapse-item title="1.如何连接设备">
						<view class="content">
							<text class="text">{{content}}</text>
						</view>
					</uni-collapse-item>
					<uni-collapse-item title="2.如何测量我的头型">
						<view class="content">
							<text class="text">测量头型具体内容</text>
						</view>
					</uni-collapse-item>
					<uni-collapse-item title="3.其他疑问">
						<view class="content">
							<text class="text">其他疑问内容</text>
						</view>
					</uni-collapse-item>
				</uni-collapse>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				menuStyle: {
					'--menuButtonTop': '0'
				},
				title: 'Hello112123',
				value: [],
				accordionVal: '1',
				content: '连接设备具体内容',
				extraIcon: {
					color: '#4cd964',
					size: '26',
					type: 'image'
				},
			}
		},
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 1
				});
			}
			this.$refs.ppp.open('bottom')

			let app = getApp();
			this.$set(this.menuStyle, '--menuButtonTop', (app.globalData.top + 80) + 'px');
		},
		onLoad() {

		},
		methods: {
			change(e) {

			}
		}
	}
</script>

<style lang="scss">
	.topKV {
		width: 100%;
		padding-top: var(--menuButtonTop);
	}

	.uni-collapse-item__title-text {
		flex: none !important;
	}

	.uni-collapse-item__title-box {
		background: none !important;
		color: #5B7897 !important;
		font-size: 32rpx !important;
	}

	.uni-collapse-item__wrap-content.uni-collapse-item--border {
		border-bottom-width: 0px !important;
	}

	.uni-collapse-item__wrap {
		background: none !important;
	}

	.uni-collapse-item__wrap-content {
		color: #5B7897 !important;
		font-size: 32rpx !important;
	}

	.uni-collapse-item__title.uni-collapse-item-border {
		border-bottom: none !important;
	}

	.uni-collapse-item {
		border: 1rpx solid #ebeef5;
		border-radius: 30rpx;
		margin-bottom: 50rpx;
		margin-left: 50rpx;
		margin-right: 50rpx;

	}

	.container {
		margin-bottom: 200rpx;
		background-color: white;
		border-radius: 50rpx 50rpx 0rpx 0rpx;
		text-align: center;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);

		.tip {
			width: 106rpx;
			height: 95rpx;

			margin: 0 auto;
			margin-top: -50rpx;
		}


	}

	.popup {}
</style>