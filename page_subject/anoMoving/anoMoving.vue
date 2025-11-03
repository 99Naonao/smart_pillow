<template>
	<z-nav-bar backState="1000" fontColor='#000' transparentFixedFontColor='#000' type="transparentFixed"></z-nav-bar>
	<view class="container">
		<view class="top-part">
			<view class="linetips">请保持仰卧姿势</view>
			<image class="topKV" :style="menuStyle" mode="widthFix" src="@/static/SY_03_001.png"></image>

			<view class="headInfo" :style="menuStyle">
				<view>颈枕高度</view>
				<view>{{pillowSideComputeHeight}}mm</view>
			</view>
			<view class="neckInfo" :style="menuStyle">
				<view>头枕高度</view>
				<view>{{pillowComputeHeight}}mm</view>
			</view>
		</view>
		<view class="bottom-part">
<!-- 			<view class="desc flex">
				<image mode="widthFix" class="imgicon" src="@/static/index/SY_00A_IconJZWT.png"></image>
				<view class="desc-info">介绍</view>
			</view>
			<view class="mode-part">
				<view class="uni-form-item uni-column">
					<view class="flex mode-title">
						<view>请选择您喜欢的强度</view>
						<view>剩余次数：3</view>
					</view>
					<view class="slide-part">
						<slider value="50" @change="sliderChange" activeColor="#ed6546" backgroundColor="#f9cec6"
							block-color="#ed6546" block-size="20" />
						<view class="flex"
							style="justify-content:space-between;padding-left: 30rpx;padding-right: 30rpx;">
							<view>低</view>
							<view>中</view>
							<view>高</view>
						</view>
					</view>
				</view>

			</view> -->
			<!-- 脊柱调整信息显示 -->
			<view class="spine-info">
				<view class="info-item">
					<text class="info-label">脊柱调整次数：</text>
					<text class="info-value">{{round}} 次</text>
				</view>
				<view class="info-item">
					<text class="info-label">脊柱支撑高度保持时间：</text>
					<text class="info-value">{{Time1}} 秒</text>
				</view>
				<view class="info-item">
					<text class="info-label">脊柱放松高度保持时间：</text>
					<text class="info-value">{{Time2}} 秒</text>
				</view>
			</view>
			
			<!-- <canvas class="canvas-content" canvas-id="runCanvas" id="runCanvas">
				<view class="time-part">
					{{timeString}}
				</view>
			</canvas> -->
			<view class="opt flex">
				<view :class="['normal-btn', selectedButton === 'start' ? 'selected' : '']" @click="startHandler">启动</view>
				<view :class="['normal-btn', selectedButton === 'stop' ? 'selected' : '']" @click="stopHandler">停止</view>
				<view :class="['normal-btn', selectedButton === 'back' ? 'selected' : '']" @click="backHandle">返回</view>
			</view>
		</view>
		<!-- <debug-info class="debug-info" ref="debugInfo"></debug-info> -->
	</view>
</template>

<script>
	import {
		formatTimeByString,
		handleStartSpine,
		handleStopSpine,
	} from '../../common/util';
	import blue_class from '../../utils/BlueManager';
	import debugInfo from './debugInfo.vue';
	export default {
		components: {
			debugInfo
		},
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
				tips: "测试数据",
				selectedButton: '', // 追蹤選中的按鈕：'start', 'stop', 'back'
				// 脊柱調整參數
				headHeight: 30,           // 頭枕高度(mm)
				headUpHeight: 60,         // 頸部起始高度(mm) 
				headDownHeight: 30,      // 頸部下調高度(mm)
				Time1: 60,               // 起始高度保持時間(秒)
				Time2: 15,               // 下調高度保持時間(秒)
				round: 15,                 // 調整圈數
				// 睡姿监控相关
				isSpineAdjusting: false,    // 是否正在进行脊柱调整
				postureTimer: null,        // 睡姿监控定时器
				lastPostureStatus: 1,      // 上次的睡姿状态（1=仰卧）
				postureChangeTime: null,   // 睡姿改变的时间
				postureWarningShown: false, // 是否已显示警告对话框
			}
		},
		computed: {
			timeString() {
				return formatTimeByString(this.timeLimit);
			},
			pillowComputeHeight() {
				return this.pillowHeight;
			},
			pillowSideComputeHeight() {
				return this.pillowSideHeight;
			},
		},
		onShow() {
			let app = getApp();
			this.$set(this.menuStyle, '--menuButtonTop', (app.globalData.top + 20) + 'px');
			uni.$on('update_pillow_spine_time', this.updateInfo);
			uni.$on('update_pillow_info', this.updateHeightInfo);
			// this.checkModeSwitch(); // 已用切换时停止策略，保留旧逻辑为屏蔽代码

			// //开始动画
			// var timer = setInterval(() => {
			// 	this.num += 0.005
			// 	// this.cartoon(this.num)
			// 	if (this.num > 1.99) {
			// 		clearInterval(timer)
			// 		this.num = 1.999;
			// 	}
			// 	this.cartoon(this.num)
			// }, 10)
			// this.drawCircleByProgress();
		},
		onHide() {
			uni.$off('update_pillow_info', this.updateHeightInfo);
			uni.$off('update_pillow_spine_time', this.updateInfo);
			
			// 检查是否切换到模式相关页面，如果是则停止脊柱微调
			this.checkIfSwitchingToModePages();
			
			// 睡姿状态监控
			// this.isSpineAdjusting = false;
			// this.postureChangeTime = null;
			// this.postureWarningShown = false;
		},
		methods: {
			updateHeightInfo() {
				this.$set(this, 'pillowHeight', blue_class.getInstance().pillowHeight);
				this.$set(this, 'pillowSideHeight', blue_class.getInstance().pillowSideHeight);
			},
			// 辅助函数，用于转换小程序中的rpx
			convert_length(length) {
				return Math.round(wx.getSystemInfoSync().windowWidth * length / 750);
			},
			cartoon(num) {
				//新建一个画布
				const ctx = uni.createCanvasContext('runCanvas')
				const dpr = wx.getSystemInfoSync().pixelRatio
				const query = wx.createSelectorQuery().in(this)

				var center_x = this.rpxToPx(240) / 2;
				var center_y = this.rpxToPx(240) / 2;
				var lineWdith = 8;
				var r = (center_x - lineWdith) //半径

				ctx.beginPath()
				ctx.arc(center_x, center_y, r, -Math.PI * 0.5 + num * Math.PI, -Math.PI * 0.5)
				//ctx.arc(yuanxin1, yuanxin2, r, -Math.PI * 0.5, -Math.PI * 0.5 + num * Math.PI)
				ctx.setStrokeStyle('#5382dd')
				ctx.setLineWidth(lineWdith)
				ctx.stroke()
				console.log(this.rpxToPx(240), center_x, center_y, num, dpr, num * Math.PI)
				ctx.draw()
			},
			rpxToPx(rpx) {
				const screenWidth = uni.getSystemInfoSync().screenWidth
				return (screenWidth * Number.parseInt(rpx)) / 750
			},

			updateInfo() {
				this.timeLimit = blue_class.getInstance().getPillowSpineTime();
				
				// 如果正在进行脊柱调整，监控睡姿变化
				if (this.isSpineAdjusting) {
					this.monitorPosture();
				}
			},
			
			// 监控睡姿变化
			monitorPosture() {
				const currentStatus = blue_class.getInstance().getPillowStatus();
				
				// 如果睡姿发生变化
				if (currentStatus !== this.lastPostureStatus) {
					console.log('睡姿发生变化:', this.lastPostureStatus, '->', currentStatus);
					
					// 如果从仰卧变为侧卧或空闲
					if (this.lastPostureStatus === 1 && (currentStatus === 0 || currentStatus === 2)) {
						this.postureChangeTime = Date.now();
						console.log('开始计时，睡姿变为:', currentStatus === 0 ? '空闲' : '侧卧');
					}
					// 如果从侧卧或空闲变回仰卧
					else if ((this.lastPostureStatus === 0 || this.lastPostureStatus === 2) && currentStatus === 1) {
						this.postureChangeTime = null;
						console.log('恢复仰卧，取消计时');
					}
					
					this.lastPostureStatus = currentStatus;
				}
				
				// 检查是否需要弹出提示框
				if (this.postureChangeTime && (currentStatus === 0 || currentStatus === 2)) {
					const elapsedTime = Date.now() - this.postureChangeTime;
					if (elapsedTime >= 30000) { // 30秒
						this.showPostureWarningDialog();
					}
				}
			},
			
			// 显示睡姿警告对话框
			showPostureWarningDialog() {
				// 防止重复弹出
				if (this.postureWarningShown) return;
				this.postureWarningShown = true;
				
				const currentStatus = blue_class.getInstance().getPillowStatus();
				const postureText = currentStatus === 0 ? '空闲' : '侧卧';
				
				uni.showModal({
					title: '睡姿提醒',
					content: `检测到您当前处于${postureText}状态已超过30秒，是否停止脊柱微调？`,
					showCancel: true,
					cancelText: '继续微调',
					confirmText: '停止微调',
					success: (res) => {
						this.postureWarningShown = false;
						
						if (res.confirm) {
							// 用户选择停止微调
							console.log('用户选择停止脊柱微调');
							this.stopHandler();
						} else {
							// 用户选择继续微调，重置计时
							console.log('用户选择继续脊柱微调');
							this.postureChangeTime = Date.now();
						}
					}
				});
			},
			// 保存脊柱调整状态（息屏/切换应用继续执行）
			saveSpineAdjustmentStatus(){
				try{
					const status = {
						isSpineAdjusting: this.isSpineAdjusting,
						lastPostureStatus: this.lastPostureStatus,
						postureChangeTime: this.postureChangeTime,
						timeLimit: this.timeLimit,
						timestamp: Date.now()
					}
					uni.setStorageSync('spine_adjustment_status', status)
				}catch(e){}
			},
			// 检查是否切换到模式相关页面
			checkIfSwitchingToModePages(){
				try{
					if(!this.isSpineAdjusting) return;
					
					// 获取当前页面栈
					const pages = getCurrentPages();
					if(pages && pages.length > 0){
						const currentPage = pages[pages.length - 1];
						const currentRoute = currentPage && currentPage.route ? currentPage.route : '';
						
						// 如果切换到模式相关页面，立即停止脊柱微调
						if(currentRoute.indexOf('page_subject/mode/mode') >= 0 || 
						   currentRoute.indexOf('page_subject/mode/setMode') >= 0 || 
						   currentRoute.indexOf('page_subject/adjust/adjust') >= 0){
							console.log('检测到切换到模式页面，停止脊柱微调');
							this.stopSpineAdjustment();
							uni.showModal({
								title: '温馨提示',
								content: '已退出脊柱微调模式',
								showCancel: false
							});
						}
					}
				}catch(e){
					console.error('检查页面切换失败:', e);
				}
			},
			// 内部停止方法
			stopSpineAdjustment(){
				let params = {
					headHeight: this.headHeight,
					headUpHeight: this.headUpHeight,
					headDownHeight: this.headDownHeight,
					Time1: this.Time1,
					Time2: this.Time2,
					round: this.round,
				};
				let shake1 = handleStopSpine(params.headHeight, params.headUpHeight, params.headDownHeight, params.Time1, params.Time2, params.round)
				blue_class.getInstance().write2tooth(shake1)
				this.isSpineAdjusting = false;
				blue_class.getInstance().setSpineAdjusting(false);
				this.postureChangeTime = null;
				this.postureWarningShown = false;
			},
			backHandle() {
				this.selectedButton = 'back';
				uni.navigateBack({
					delta: 1
				})
			},
			startHandler() {
				this.selectedButton = 'start';
				
				// 检测当前睡姿状态
				const currentStatus = blue_class.getInstance().getPillowStatus();
				console.log("当前睡姿状态:", currentStatus);
				
				// 检查是否处于仰卧状态（状态值为1表示平躺/仰卧）
				if (currentStatus !== 1) {
					// 不是仰卧状态，弹出提示框
					uni.showModal({
						title: '睡姿提醒',
						content: '请保持仰卧姿势后再启动脊柱微调功能',
						showCancel: false,
						confirmText: '我知道了',
						success: (res) => {
							if (res.confirm) {
								console.log('用户确认了睡姿提醒');
							}
							// 重置按钮状态
							this.selectedButton = '';
						}
					});
					return; // 不执行启动逻辑
				}
				
				// 处于仰卧状态，正常启动
				let params = {
					headHeight: this.headHeight,
					headUpHeight: this.headUpHeight,
					headDownHeight: this.headDownHeight,
					Time1: this.Time1,
					Time2: this.Time2,
					round: this.round,
				}
				console.log("start:", params)
				let shake1 = handleStartSpine(params.headHeight, params.headUpHeight, params.headDownHeight, params
					.Time1, params.Time2, params.round)
				blue_class.getInstance().write2tooth(shake1)
				
				// 设置脊柱调整状态
				this.isSpineAdjusting = true;
				blue_class.getInstance().setSpineAdjusting(true);
				this.lastPostureStatus = currentStatus;
				this.postureChangeTime = null;
				this.postureWarningShown = false;
			},
			stopHandler() {
				this.selectedButton = 'stop';
				// let params = this.$refs.debugInfo.getParams();
				let params = {
					headHeight: this.headHeight,
					headUpHeight: this.headUpHeight,
					headDownHeight: this.headDownHeight,
					Time1: this.Time1,
					Time2: this.Time2,
					round: this.round,
				};
				console.log("stop:", params)
				let shake1 = handleStopSpine(params.headHeight, params.headUpHeight, params.headDownHeight, params
					.Time1, params.Time2, params.round)
				blue_class.getInstance().write2tooth(shake1)
				
				// 重置脊柱调整状态
				this.isSpineAdjusting = false;
				blue_class.getInstance().setSpineAdjusting(false);
				this.postureChangeTime = null;
				this.postureWarningShown = false;
			},
			nav1() {

			},
			nav2() {

			}
		}
	}
</script>

<style lang="scss" scoped>
	/* .debug-info {} */

	.container {
		// margin-left: 41rpx;
		// margin-right: 41rpx;
		background-color: #dddddd;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;

		.canvas-content {
			position: relative;
			// top: 50%;
			// left: 50%;
			width: 240rpx;
			height: 240rpx;
			// transform: translate(-25%, -25%);
			// width: 320rpx;
			// height: 500rpx;
			// background-color: #ffaaff;
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
			border-top-left-radius: 30rpx;
			border-top-right-radius: 30rpx;
			flex: 1;

			.spine-info {
				background-color: #ffffff;
				margin: 30rpx;
				padding: 30rpx;
				border-radius: 20rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

				.info-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 15rpx 0;
					border-bottom: 1rpx solid #f0f0f0;

					&:last-child {
						border-bottom: none;
					}

					.info-label {
						font-size: 28rpx;
						color: #666;
					}

					.info-value {
						font-size: 32rpx;
						color: #333;
						font-weight: bold;
					}
				}
			}


			.desc {
				display: flex;
				padding: 25rpx;
				margin: 30rpx;
			}

			.desc-info {
				flex: 1;
				padding: 10rpx;
			}

			.slide-part {
				background-color: #ffffff;
				border-radius: 10rpx;
				padding-bottom: 10rpx;
			}


			.mode-part {
				background-color: #ffffff;
				border-radius: 30rpx;
				padding: 30rpx;
				margin: 30rpx;


				.mode-title {
					justify-content: space-between;
					padding: 20rpx;
				}
			}


			.imgicon {
				width: 70rpx;
				// height: 76rpx;
				display: block;
				top: 20rpx;
				left: 20rpx;
			}

			.time-part {
				font-size: 60rpx;
				color: #354D5B;
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				// margin-top: -50rpx;
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
				transition: all 0.3s ease;
			}

			.normal-btn.selected {
				background-color: #ed6546;
				transform: scale(1.05);
				box-shadow: 0 4rpx 12rpx rgba(237, 101, 70, 0.3);
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