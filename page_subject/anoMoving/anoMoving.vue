<template>
	<z-nav-bar backState="1000" fontColor='#000' transparentFixedFontColor='#000' type="transparentFixed"></z-nav-bar>
	<view class="container">
		<view class="top-part">
			<view class="linetips">请保持仰卧姿势</view>
			<image class="topKV" :style="menuStyle" mode="widthFix" src="@/static/SY_01_000.png"></image>

			<view class="headInfo" :style="menuStyle">
				<view>颈枕高度</view>
				<view>{{pillowSideHeight}}mm</view>
			</view>
			<view class="neckInfo" :style="menuStyle">
				<view>头枕高度</view>
				<view>{{pillowHeight}}mm</view>
			</view>
		</view>
		<view class="bottom-part">
			<image mode="widthFix" class="imgicon" :src="'../static/ano/SY_03_TimeLOGO.png'"></image>
			<view class="opt flex">
				<view class="normal-btn">启动</view>
				<view class="save">停止</view>
				<view class="normal-btn" @click="backHandle">返回</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				pillowSideHeight: 60,
				pillowHeight: 60,
				menuStyle: {
					'--menuButtonTop': '0'
				},
				tips: "测试数据"
			}
		},
		onShow() {
			let app = getApp();
			this.$set(this.menuStyle, '--menuButtonTop', (app.globalData.top + 20) + 'px');
		},
		methods: {
			backHandle() {
				uni.navigateTo({
					url: "/page_subject/ano/ano"
				})
			},
			nav1() {

			},
			nav2() {

			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		// margin-left: 41rpx;
		// margin-right: 41rpx;
		height: 100%;
		display: flex;
		flex-direction: column;

		.linetips {
			width: 100%;
			text-align: center;
			padding-top: 80rpx;
			color: #acacac;
		}

		.top-part {
			position: relative;
			background-color: #dddddd;
			padding-bottom: 100rpx;

			.topKV {
				width: 100%;
				padding-top: var(--menuButtonTop);
			}


			.tips {
				position: absolute;
				letter-spacing: 1px;
				top: 95rpx;
				left: 49rpx;
				color: white;
			}
		}

		.headInfo {
			position: absolute;
			top: 480rpx;
			left: 45rpx;
			color: white;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #a79f8a;
			border-radius: 20rpx;
			width: 300rpx;
			height: 68rpx;
		}

		.neckInfo {
			position: absolute;
			top: 545rpx;
			right: 45rpx;
			color: white;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #a79f8a;
			border-radius: 20rpx;
			width: 300rpx;
			height: 68rpx;
		}

		.bottom-part {
			position: relative;
			background-color: #efefef;
			flex: 1;

			.imgicon {
				width: 111rpx;
				height: 76rpx;
				position: absolute;
				top: 20rpx;
				left: 20rpx;
			}
		}

		.opt {
			display: flex;
			width: 100%;
			justify-content: space-around;
			align-items: center;
			// margin-top: 37rpx;
			position: absolute;
			bottom: 100rpx;

			.icon1 {
				width: 63rpx;
				display: block;
				margin-left: 25rpx;
			}

			.icon2 {
				display: block;
				width: 45rpx;
			}

			.normal-btn {
				width: 200rpx;
				height: 80rpx;
				background-color: #5B7897;
				margin: 0 auto;
				line-height: 80rpx;
				text-align: center;
				color: white;
				border-radius: 20rpx;
				letter-spacing: 5rpx;
				font-size: 32rpx;
			}

			.save {
				width: 200rpx;
				height: 80rpx;
				font-size: 32rpx;
				letter-spacing: 5rpx;
				background-color: rgb(153, 134, 191);
				margin: 0 auto;
				line-height: 80rpx;
				text-align: center;
				color: white;
				border-radius: 20rpx;
			}

			.opt-item1 {
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