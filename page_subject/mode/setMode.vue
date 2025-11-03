<template>
	<view class="container">
		<!-- 		<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
			title='自定义模式'></z-nav-bar> -->
		<public-module></public-module>
		<!-- <view class="title maintitle">自定义模式</view> -->
		<view class="removetips">提示:往左滑动可以删除已有模式</view>
		<view class="main">
			<uni-swipe-action ref="swaction">
				<view v-for="(item,index) in modeList" :key="index">
					<uni-swipe-action-item autoClose=true @change='onChange($event,index)'>
						<view class="item" @click="onButton($event,index)">
							<view class="last-send" v-if="lastSend && lastSend.name==item.name">上次使用</view>
							<view class="title">
								{{item.name}}
							</view>
							<view v-if="selectItem == item" class="send-btn" @click.stop="sendHandler(item)">
								发送
							</view>
						</view>
						<template v-slot:right>
							<view class="slot-button"
								@click="bindClick({index:index,position:'right',content:{text:'删除'}})"><text
									class="slot-button-text">删除</text></view>
						</template>
					</uni-swipe-action-item>
				</view>
				<view v-if="modeList.length == 0" style="text-align: center;padding-top: 20rpx;">
					暂无数据
				</view>
			</uni-swipe-action>
		</view>
		<view class="bottom-part">

			<view class="item-plus" @click="addModeHandler">
				+
			</view>
			<view class="kv" @click="navJustHandle">
				<image class="kv-img" mode="widthFix" :src="'../static/mode/SY_04A_bg01.png'"></image>
				<label class="tips">手动微调</label>
			</view>
			<view class="info-part">
				<view class="info-item">
					<view class="info-left">
						<image class="icon1" mode="widthFix" :src="'../static/mode/SY_04A_IconYW.png'"></image>
						<label>仰卧</label>
					</view>
					<view class="info-right">
						<view>
							头枕高度{{selectItem.headHeight}}mm
						</view>
						<view>
							颈枕高度{{selectItem.neckHeight}}mm
						</view>
					</view>
				</view>
				<view class="info-item">
					<view class="info-left">
						<image class="icon2" mode="widthFix" :src="'../static/mode/SY_04A_IconCW.png'"></image>
						<label>侧卧</label>
					</view>
					<view class="info-right">
						<view>
							头枕高度{{selectItem.sideHeadHeight}}mm
						</view>
						<view>
							颈枕高度{{selectItem.sideNeckHeight}}mm
						</view>
					</view>
				</view>
				<view class="info-item-recommond" v-if="false">
					<view class="info-left">
						<image class="icon3" mode="widthFix" :src="'../static/mode/SY_04A_IconAIh.png'"></image>
						<label>推荐高度</label>
					</view>
					<view class="info-right">
						<view class="info-recommond-right">
							<view class="info-r1">
								<image class="sicon1" mode="widthFix" :src="'../static/mode/SY_04A_IconYWs.png'">
								</image>
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
								<image class="sicon2" mode="widthFix" :src="'../static/mode/SY_04A_IconCWs.png'">
								</image>
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
			<recommand-info :showTips="false" :standard="standard"></recommand-info>
		</view>
	</view>
</template>

<script>
	import InputView from '../../pages/shootView/InputView.vue'
	import RecommandInfo from '../adjust/RecommandInfo.vue'
	import {
		object2Query,
		handPillowSideState,
		handPillowFrontState,
		handlePillowDelayState,
		hexStringToArrayBuffer,
		getAIModeByName,
		ab2hex,
		hand1Shake,
		write2tooth,
		initPillow,
		parsePillowState
	} from '@/common/util.js'
	
	import blue_class from '../../utils/BlueManager'
	import {
		addUseLog
	} from '../../utils/miniapp'
	export default {
		components: {
			InputView,
			RecommandInfo
		},
		onLoad(options) {
			this.pillowName = decodeURIComponent(options.pillowName || '')
			this.deviceId = options.deviceId || ''
			this.serviceId = options.serviceId || ''
			console.log('options:', options, this.pillowName)
			uni.setNavigationBarTitle({
				title: this.pillowName
			})
			this.findStore()
		},
		onShow() {
			let mode = uni.getStorageSync('myMode');
			if (mode) {
				this.modeList = JSON.parse(mode)
			} else {
				this.modeList = []
			}


			this.lastSend = uni.getStorageSync('lastMode');
		},
		data() {
			return {
				standard: {
					headHeight: 1,
					neckHeight: 1,
					sideHeadHeight: 1,
					sideNeckHeight: 1,
				},
				lastSend: {

				},
				pillowName: '',
				options1: [{
					text: '删除',
					style: {
						backgroundColor: '#f4220d',
						borderRadius: '20rpx'
					},
				}],

				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				deviceId: '',
				serviceId: '',
				selectItem: {},
				modeList1: [],
				modeList: [{
					name: '我的模式1',
					headHeight: 10,
					neckHeight: 10,
					sideHeadHeight: 10,
					sideNeckHeight: 10,
				}, {
					name: '我的模式2',
					headHeight: 12,
					neckHeight: 12,
					sideHeadHeight: 12,
					sideNeckHeight: 12,
				}, {
					name: '我的模式1',
					headHeight: 10,
					neckHeight: 10,
					sideHeadHeight: 10,
					sideNeckHeight: 10,
				}, {
					name: '我的模式2',
					headHeight: 12,
					neckHeight: 12,
					sideHeadHeight: 12,
					sideNeckHeight: 12,
				}, {
					name: '我的模式1',
					headHeight: 10,
					neckHeight: 10,
					sideHeadHeight: 10,
					sideNeckHeight: 10,
				}, {
					name: '我的模式2',
					headHeight: 12,
					neckHeight: 12,
					sideHeadHeight: 12,
					sideNeckHeight: 12,
				}, {
					name: '我的模式1',
					headHeight: 10,
					neckHeight: 10,
					sideHeadHeight: 10,
					sideNeckHeight: 10,
				}, {
					name: '我的模式2',
					headHeight: 12,
					neckHeight: 12,
					sideHeadHeight: 12,
					sideNeckHeight: 12,
				}]
			}
		},
		methods: {
			navJustHandle() {
				// 先检查蓝牙连接状态
				if (!blue_class.getInstance().loginSuccess) {
					uni.showModal({
						title: '未连接枕头',
						content: '请先连接枕头后再进行手动微调',
						showCancel: false,
						confirmText: '我知道了'
					});
					return;
				}
				
				// 先检查是否选择了模式
				if (!this.selectItem || !this.selectItem.name) {
					// 检查是否有上次使用的模式
					const lastMode = uni.getStorageSync('lastMode');
					
					if (lastMode && lastMode.name) {
						// 显示确认弹窗
						uni.showModal({
							title: '使用上次模式',
							content: '检测到您上次使用的模式是"' + lastMode.name + '"，是否使用该模式进行手动微调？',
							showCancel: true,
							success: (res) => {
								if (res.confirm) {
									// 使用上次模式
									this.selectItem = lastMode;
									this.navigateToAdjust();
								}
							}
						});
					} else if (this.modeList && this.modeList.length > 0) {
						// 没有上次模式，但列表中有模式，询问是否使用第一个模式
						const firstMode = this.modeList[0];
						uni.showModal({
							title: '使用列表模式',
							content: '检测到您有保存的模式"' + firstMode.name + '"，是否使用该模式进行手动微调？',
							showCancel: true,
							success: (res) => {
								if (res.confirm) {
									// 使用第一个模式
									this.selectItem = firstMode;
									this.navigateToAdjust();
								}
							}
						});
					} else {
						uni.showToast({
							title: '请您先选择已有模式后再点击手动微调！'
						});
					}
					return;
				}
				
				// 已选择模式，直接跳转
				this.navigateToAdjust();
			},
			// 跳转到手动微调页面的方法
			navigateToAdjust() {
				if (!this.selectItem.headHeight && !this.selectItem.neckHeight) {
					uni.showToast({
						title: '模式数据不合理！'
					})
					return;
				}
				uni.navigateTo({
					url: "/page_subject/adjust/adjust" + object2Query(this.selectItem)
				})
			},
			navHandle() {
				if (!this.selectItem.headHeight && !this.selectItem.neckHeight) {
					uni.showToast({
						title: '未选择模式数据！'
					})
					return;
				}

				console.log("set mode已连接至枕头，发送原始数据",JSON.stringify(this.selectItem))
				var headSafeHeight;
				var sideHeadSafeHeight;
				// if(this.selectItem.headHeight >= 60){
				// 	headSafeHeight = this.selectItem.headHeight - 15
				// }else{
				// 	headSafeHeight = this.selectItem.headHeight < 30 ? 30 : this.selectItem.headHeight 
				// }
				// if(this.selectItem.sideHeadHeight >= 60){
				// 	sideHeadSafeHeight = this.selectItem.sideHeadHeight - 15
				// }else{
				// 	sideHeadSafeHeight = this.selectItem.sideHeadHeight  < 30 ? 30 : this.selectItem.sideHeadHeight 
				// }
				headSafeHeight = this.selectItem.headHeight < 30 ? 30 : this.selectItem.headHeight 
				sideHeadSafeHeight = this.selectItem.sideHeadHeight  < 30 ? 30 : this.selectItem.sideHeadHeight 
				let neckSafeHeight = this.selectItem.neckHeight - 30 < 30 ? 30 : this.selectItem.neckHeight - 30
				let sideNeckSafeHeight = this.selectItem.sideNeckHeight - 30 < 30 ? 30 : this.selectItem.sideNeckHeight - 30
				// 如果有数据，默认调整枕头 限制最高高度不能超过100mm！！！！！！！！！！！
				// let init_arraybuffer = initPillow(this.selectItem.headHeight > 100 ? 100 : this.selectItem.headHeight, 
				// this.selectItem.neckHeight > 100 ? 100 : this.selectItem.neckHeight, 200, 
				// this.selectItem.sideHeadHeight > 100 ? 100 : this.selectItem.sideHeadHeight,
				// this.selectItem.sideNeckHeight >100 ?100 :this.selectItem.sideNeckHeight, 200);
				console.log("实际发送的仰卧头枕数据：",this.selectItem.headHeight > 100 ? 100 : headSafeHeight)
				console.log("实际发送的仰卧颈枕数据：",this.selectItem.neckHeight > 100 ? 100 : neckSafeHeight)
				console.log("实际发送的侧卧头枕数据：",this.selectItem.sideHeadHeight > 100 ? 100 : sideHeadSafeHeight)
				console.log("实际发送的侧卧颈枕数据：",this.selectItem.sideNeckHeight > 100 ? 100 : sideNeckSafeHeight)
				
				let init_arraybuffer = initPillow(this.selectItem.headHeight > 100 ? 100 : headSafeHeight,
				this.selectItem.neckHeight > 100 ? 100 : neckSafeHeight, 200, 
				this.selectItem.sideHeadHeight > 100 ? 100 : sideHeadSafeHeight, 
				this.selectItem.sideNeckHeight >100 ?100 :sideNeckSafeHeight, 200);
				blue_class.getInstance().write2tooth(init_arraybuffer);

				// uni.setStorageSync('mode_switch_flag', true); // 旧标记逻辑，已改为切换时即停，保留为屏蔽

				addUseLog(this.selectItem)

				uni.switchTab({
					url: "/pages/status/status"
				})
			},
			bindClick(params) {
				uni.showModal({
					title: '提示',
					content: '确定删除当前模式么?',
					success: (res) => {
						if (res.confirm) {
							this.modeList.splice(params.index, 1)
							uni.showToast({
								title: '删除成功'
							})

							this.saveMode()
						}
					}
				})
			},
			onChange(e, indexxx) {
				console.log(">>>>onChange>>>", indexxx)
			},
			/**
			 * 列表 左滑按钮点击
			 * 
			 * @param {Object} e
			 * content: "点击按钮的options参数",
			 * index: "循环的时候的索引值",
			 * buttonIndex: "点击按钮的索引值"
			 */
			async onButton(e, indexxx) {
				this.selectItem = this.modeList[indexxx]
				console.log('选中!!!', this.selectItem, indexxx)

				this.standard = getAIModeByName(this.selectItem.name)
				if (!this.standard) {
					this.standard = {
						headHeight: 60,
						neckHeight: 60,
						sideHeadHeight: 60,
						sideNeckHeight: 60,
					}
				}
			},
			saveMode() {
				uni.setStorageSync('myMode', JSON.stringify(this.modeList));
			},
			findStore() {
				let modeList = uni.getStorageInfoSync({
					key: 'mode'
				})
			},
			// 发送模式设置
			sendHandler(item) {
				if(!blue_class.getInstance().loginSuccess){
					uni.showModal({
						title:"未连接枕头提示",
						content:"请检查是否已连接到枕头",
						showCancel:false
					});
					return;
				}
				
				let params = this.selectItem
				console.log('params:', params)

				uni.setStorageSync('lastMode', params);
				this.navHandle()
				return;
				uni.showLoading({
					title: '调整中'
				})
				let arraybuffer
				// 如果选择的仰卧
				arraybuffer = handPillowFrontState(item.head, item
					.neck)
				console.log('调低仰卧:', item.head, item.neck, ab2hex(arraybuffer))
				// 如果选择的仰卧
				arraybuffer = handPillowSideState(item.sideHead, item
					.sideNeck)

				write2tooth(this.deviceId, this.serviceId, this.characteristicId, arraybuffer).then((res) => {
					uni.hideLoading()
					this.back()
				}).catch(res => {
					uni.hideLoading()
				})
			},
			back() {
				uni.navigateBack()
			},
			// 跳转增加
			addModeHandler() {
				uni.navigateTo({
					url: "/page_subject/measure/measure"
				})
			}
		},
	}
</script>

<style lang="scss">
	.container {
		background-color: rgb(197, 208, 230);
		height: 100%;
		display: flex;
		flex-direction: column;

		.title {
			margin: 10rpx;
			text-align: center;
		}

		.maintitle {
			margin-top: 50rpx;
			margin-bottom: 30rpx;
			overflow: scroll;
			height: 300rpx;
		}

		.last-send {
			font-size: 20rpx;
			line-height: 100rpx;
			margin: 10rpx;
		}

		.setting {
			justify-content: space-between;
			align-items: center;
			margin-left: 40rpx;
			margin-right: 40rpx;


			.item {
				align-items: center;
				width: 212rpx;
				height: 270rpx;
				border: 1px solid #5B7897;
				border-radius: 10rpx;
			}

			.nan {
				width: 64rpx;
				height: 144rpx;
			}

			.nv {
				width: 75rpx;
				height: 144rpx;
			}

			.child {
				width: 54rpx;
				height: 119rpx;
			}
		}


		.kv {
			margin: 0 auto;
			margin-top: 22rpx;
			width: 668rpx;
			height: 181rpx;
			border-radius: 28rpx;
			border: none;
			position: relative;
			background-color: rgb(21, 59, 122);
			overflow: hidden;

			.tips {
				position: absolute;
				right: 50rpx;
				top: 50rpx;
				background-color: rgb(77, 128, 195);
				color: white;
				font-size: 38rpx;
				letter-spacing: 10rpx;
				line-height: 88rpx;
				border-radius: 28rpx;
				padding-left: 42rpx;
				padding-right: 42rpx;
			}

			.kv-img {
				width: 417rpx;
			}
		}



		.info-part {
			margin-left: 40rpx;
			margin-right: 40rpx;
			font-size: 24rpx;
			color: #354D5B;

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

		.item-plus {
			margin-top: 20rpx;
			border: #1c4485 1px solid;
			height: 100rpx;
			border-radius: 30rpx;
			width: 668rpx;
			margin: 0 auto;
			font-size: 50rpx;
			text-align: center;
			line-height: 100rpx;
			color: #1c4485;
		}

		.removetips {
			margin-top: 20rpx;
			text-align: center;
			font-size: 26rpx;
			font-weight: bold;
			color: rgb(153, 134, 191);
			margin-bottom: 1rpx;
		}

		.bottom-part {
			height: 800rpx;

		}

		.main {
			// background-color: rgb(216, 226, 246);
			margin-left: 40rpx;
			margin-right: 40rpx;
			margin-top: 6upx;
			min-height: 320rpx;
			overflow: scroll;
			flex: 1;

			.slot-button {
				margin-top: 20rpx;
				margin-left: 20rpx;
				background-color: rgb(195, 90, 90);
				border-radius: 20rpx;
				color: white;
				font-size: 38rpx;
				padding-left: 20rpx;
				padding-right: 20rpx;
				line-height: 120rpx;
			}



			.item {
				display: flex;
				background-color: #1c4485;
				border-radius: 30rpx;
				text-align: center;
				color: white;
				margin-top: 20rpx;

				.title {
					line-height: 100rpx;
					flex: 1;
				}

				.send-btn {
					background-color: #4d7fc9;
					margin: 30rpx;
					color: white;
					line-height: 68rpx;
					padding-left: 50rpx;
					padding-right: 50rpx;
					border-radius: 25rpx;
				}
			}
		}
	}
</style>