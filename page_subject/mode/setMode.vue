<template>
	<view class="container">
		<!-- 		<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
			title='自定义模式'></z-nav-bar> -->
		<public-module></public-module>
		<!-- <view class="title maintitle">自定义模式</view> -->
		<view class="main">
			<uni-swipe-action ref="swaction">
				<view v-for="(item,index) in modeList" :key="index">
					<uni-swipe-action-item :right-options="options1" @click="onButton($event,index)" autoClose=true
						@change='onChange($event,index)'>
						<view class="item">
							<view class="title">
								{{item.name}}
							</view>
							<view class="send-btn" @click="sendHandler(item)">
								发送
							</view>
						</view>
					</uni-swipe-action-item>
				</view>
			</uni-swipe-action>
			<view class="item-plus" @click="addModeHandler">
				+
			</view>
		</view>
		<view class="kv" @click="navHandle">
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
						头枕高度{{60}}cm
					</view>
					<view>
						颈枕高度{{60}}cm
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
						头枕高度{{60}}cm
					</view>
					<view>
						颈枕高度{{60}}cm
					</view>
				</view>
			</view>
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
								头枕高度{{60}}cm
							</view>
							<view>
								颈枕高度{{60}}cm
							</view>
						</view>
					</view>
					<view class="info-recommond-right">
						<view class="info-r1">
							<image class="sicon2" mode="widthFix" :src="'../static/mode/SY_04A_IconCWs.png'"></image>
						</view>
						<view class="info-r2">
							<view>
								头枕高度{{60}}cm
							</view>
							<view>
								颈枕高度{{60}}cm
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		<!-- <input-view ref="inputView"></input-view> -->
	</view>
</template>

<script>
	import InputView from '../../pages/shootView/InputView.vue'
	import {
		object2Query,
		handPillowSideState,
		handPillowFrontState,
		handlePillowDelayState,
		hexStringToArrayBuffer,
		ab2hex,
		hand1Shake,
		write2tooth,
		initPillow,
		parsePillowState
	} from '@/common/util.js'

	import blue_class from '../../utils/BlueManager'
	// import {
	// 	object2Query,
	// 	parsePillowRealState,
	// 	handPillowStatus,
	// 	handPillowSideState,
	// 	handPillowFrontState,
	// 	handlePillowDelayState,
	// 	hexStringToArrayBuffer,
	// 	ab2hex,
	// 	resetPillow,
	// 	uploadDataRequest,
	// 	initPillow,
	// 	changeAdjustMode,
	// 	changeSaveAdjustMode,
	// 	hand1Shake,
	// 	write2tooth,
	// 	parsePillowState
	// } from '@/common/util.js'
	export default {
		components: {
			InputView
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
		},
		data() {
			return {
				pillowName: '',
				options1: [{
					text: '删除',
					style: {
						backgroundColor: '#f4220d'
					},
				}],

				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				deviceId: '',
				serviceId: '',
				modeList: [{
					name: '我的模式1',
					head: 1,
					neck: 1,
					sideHead: 1,
					sideNeck: 1,
				}, {
					name: '我的模式2',
					head: 1,
					neck: 1,
					sideHead: 1,
					sideNeck: 1,
				}]
			}
		},
		methods: {
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
				// uni.showToast({
				// 	title: '您点击了滑动列表' + (e.index + 1) + '的第' + (e.buttonIndex + 1) + '个按钮，按钮为‘' + e.content.text + '’',
				// 	icon: 'none'
				// });

				// let indexx;
				// this.modeList.map((item, index) => {
				// 	if (index == indexxx) {
				// 		indexx = index
				// 	}
				// })
				console.log(">>>>删除>>>", indexxx)

				uni.showModal({
					title: '提示',
					content: '确定删除当前模式么?',
					success: (res) => {
						if (res.confirm) {
							this.modeList.splice(indexxx, 1)
							uni.showToast({
								title: '删除成功'
							})

							this.saveMode()
						}
					}
				})
				// if (this.$refs.swaction)
				// 	this.$refs.swaction.closeAll()
				// console.log(">>>>删除>>>",shopData) 
				// let params = {
				// 	id: shopData.id
				// }
				// const res = await ShopApi.cartDel(params)
				// if (res.success) {
				// 	this.$u.toast("移出购物车成功")
				// 	this.dataList.splice(e.index, 1) //删除值
				// }
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
				// uni.switchTab({
				// 	url: '/pages/status/status'
				// })
				let params = this.$refs.inputView.getParams();
				console.log('params:', params)


				let init_arraybuffer = initPillow(params.headHeight, params.neckHeight, params.shoulderHeight, params
					.sideHeadHeight, params.sideNeckHeight, params.sideShoulderHeight);
				// let app = getApp()
				blue_class.getInstance().write2tooth(init_arraybuffer);

				return;
				uni.showLoading({
					title: '调整中'
				})
				let arraybuffer
				// 如果选择的仰卧
				arraybuffer = handPillowFrontState(item.head, item
					.neck)

				// write2tooth(this.deviceId, this.serviceId, this.characteristicId, arraybuffer).then((res) => {
				// 	uni.hideLoading()
				// }).catch(res => {
				// 	uni.hideLoading()
				// })
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
			addModeHandler() {
				uni.showToast({
					title: '暂未开放'
				})
			}
		},
	}
</script>

<style lang="scss">
	.container {
		.title {
			margin: 10rpx;
			text-align: center;
		}

		.maintitle {
			margin-top: 50rpx;
			margin-bottom: 30rpx;
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

		.main {
			// background-color: rgb(216, 226, 246);
			margin-left: 40rpx;
			margin-right: 40rpx;
			margin-top: 6upx;

			.item-plus {
				margin-top: 20rpx;
				border: #999 1px solid;
				height: 100rpx;
				border-radius: 30rpx;
				font-size: 50rpx;
				text-align: center;
				line-height: 100rpx;
			}

			.item {
				display: flex;
				background-color: #5B7897;
				border-radius: 30rpx;
				text-align: center;
				color: white;
				margin-top: 20rpx;

				.title {
					line-height: 100rpx;
					flex: 1;
				}

				.send-btn {
					background-color: #ff8000;
					margin: 20rpx;
					color: white;
					line-height: 80rpx;
					padding-left: 50rpx;
					padding-right: 50rpx;
					border-radius: 15rpx;
				}
			}
		}
	}
</style>