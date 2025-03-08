<template>
	<z-nav-bar backState="1000" fontColor='#000' transparentFixedFontColor='#000' type="transparentFixed"></z-nav-bar>
	<view class="container">
		<view class="top-part">
			<view class="linetips">请保持仰卧姿势</view>
			<image class="topKV" :style="menuStyle" mode="widthFix" src="@/static/SY_03_001.png"></image>

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
			<canvas class="canvas-content" canvas-id="runCanvas" id="runCanvas">
			</canvas>
			<view class="time-part">
				{{timeString}}
			</view>
			<view class="opt flex">
				<view class="normal-btn" @click="startHandler">启动</view>
				<view class="save" @click="stopHandler">停止</view>
				<view class="normal-btn" @click="backHandle">返回</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		formatTime,
		handleStartSpine,
		handleStopSpine,
	} from '../../common/util';
	import blue_class from '../../utils/BlueManager';
	export default {
		data() {
			return {
				num: 0,
				timeLimit: 1200,
				pillowSideHeight: 60,
				pillowHeight: 60,

				startAngle: -Math.PI / 2, //canvas画圆的起始角度，默认为3点钟方向即90度 方向，定位位到12位置 0度
				context: null,
				menuStyle: {
					'--menuButtonTop': '0'
				},
				tips: "测试数据"
			}
		},
		computed: {
			timeString() {
				return formatTime(this.timeLimit);
			}
		},
		onShow() {
			let app = getApp();
			this.$set(this.menuStyle, '--menuButtonTop', (app.globalData.top + 20) + 'px');
			uni.$on('update_pillow_spine_time', this.updateInfo);

			//开始动画
			var timer = setInterval(() => {
				this.num += 0.005
				// this.cartoon(this.num)
				if (this.num > 1.99) {
					clearInterval(timer)
					this.num = 1.999;
				}
				this.cartoon(this.num)
			}, 10)
			// this.drawCircleByProgress();
		},
		onHide() {
			uni.$off('update_pillow_spine_time', this.updateInfo);
		},
		methods: {
			// 辅助函数，用于转换小程序中的rpx
			convert_length(length) {
				return Math.round(wx.getSystemInfoSync().windowWidth * length / 750);
			},
			cartoon(num) {
				//新建一个画布
				const ctx = uni.createCanvasContext('runCanvas')

				var yuanxin1 = 120 //圆心
				var yuanxin2 = 120
				var r = 70 //半径

				ctx.beginPath()
				ctx.arc(yuanxin1, yuanxin2, r, -Math.PI * 0.5 + num * Math.PI, -Math.PI * 0.5)
				//ctx.arc(yuanxin1, yuanxin2, r, -Math.PI * 0.5, -Math.PI * 0.5 + num * Math.PI)
				ctx.setStrokeStyle('#5382dd')
				ctx.setLineWidth(8)
				ctx.stroke()
				console.log(num, num * Math.PI)
				ctx.draw()
			},

			updateInfo() {
				this.timeLimit = blue_class.getInstance().getPillowSpineTime();
			},
			backHandle() {
				uni.navigateTo({
					url: "/page_subject/ano/ano"
				})
			},
			startHandler() {
				let shake1 = handleStartSpine(30, 100, 50)
				blue_class.getInstance().write2tooth(shake1)
			},
			stopHandler() {
				let shake1 = handleStopSpine(30, 100, 50)
				blue_class.getInstance().write2tooth(shake1)

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

		.canvas {
			position: absolute;
			top: 0;
			left: 0;
			width: 400rpx;
			height: 400rpx;
		}

		.canvas-content {
			position: absolute;
			top: 100rpx;
			left: 50%;
			margin-left: -120px;
			width: 240px;
			height: 500rpx;
			// background-color: #059cdd;
		}


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
			top: 615rpx;
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
			top: 615rpx;
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
			display: flex;
			align-items: center;
			justify-content: center;

			.imgicon {
				width: 111rpx;
				height: 76rpx;
				position: absolute;
				top: 20rpx;
				left: 20rpx;
			}

			.time-part {
				font-size: 60rpx;
				color: #354D5B;
				margin-top: -50rpx;
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