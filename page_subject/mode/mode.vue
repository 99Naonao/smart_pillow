<template>
	<view class="container">
		<!-- 		<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
			title='自定义模式'></z-nav-bar> -->
		<public-module></public-module>
		<!-- <view class="title maintitle">自定义模式</view> -->
		<view class="setting flex">
			<view class="item flex justify-content-center" :class="selectItem == modeList[0]?['selected']:[]"
				@click="sendHandler(0)">
				<view class="text-align-center">
					<image class="nan" src="../../static/mode/SY_04_IconMANa.png"></image>
					<view>成年男性</view>
				</view>
			</view>
			<view class="item flex justify-content-center" :class="selectItem == modeList[1]?['selected']:[]"
				@click="sendHandler(1)">
				<view class="text-align-center">
					<image class="nv" src="../../static/mode/SY_04_IconWOMANa.png"></image>
					<view>成年女性</view>
				</view>
			</view>
			<view class="item flex justify-content-center" :class="selectItem == modeList[2]?['selected']:[]"
				@click="sendHandler(2)">
				<view class="text-align-center">
					<image class='child' src="../../static/mode/SY_04_IconYOUNa.png"></image>
					<view>10-15岁儿童</view>
				</view>
			</view>
		</view>
		<view v-if="selectItem.headHeight" class="send-btn" @click="sendItemHandler()">
			发送
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
						头枕高度{{selectItem.headHeight}}cm
					</view>
					<view>
						颈枕高度{{selectItem.neckHeight}}cm
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
						头枕高度{{selectItem.sideHeadHeight}}cm
					</view>
					<view>
						颈枕高度{{selectItem.sideNeckHeight}}cm
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
		},
		onShow() {
			let standard = uni.getStorageSync('standard');
			if (standard) {
				this.standard = JSON.parse(standard)
			} else {
				this.standard = {
					headHeight: 60,
					neckHeight: 60,
					sideHeadHeight: 60,
					sideNeckHeight: 60,
				}
			}
		},
		data() {
			return {
				standard: {},
				selectItem: {},
				pillowName: '',
				options1: [{
					text: '删除',
					style: {
						backgroundColor: '#f4220d',
						borderRadius: '15rpx'
					},
				}],

				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				deviceId: '',
				serviceId: '',
				modeList: [{
					name: '成年男性',
					headHeight: 80,
					neckHeight: 80,
					sideHeadHeight: 80,
					sideNeckHeight: 80,
				}, {
					name: '成年女性',
					headHeight: 60,
					neckHeight: 60,
					sideHeadHeight: 60,
					sideNeckHeight: 60,
				}, {
					name: '10-15岁儿童',
					headHeight: 36,
					neckHeight: 36,
					sideHeadHeight: 36,
					sideNeckHeight: 36,
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
			sendItemHandler() {
				// 如果有数据，默认调整枕头 限制最高高度不能超过100mm！！！！！！！！！！！
				let init_arraybuffer = initPillow(this.selectItem.headHeight > 100 ? 100 : this.selectItem.headHeight, this
					.selectItem
					.neckHeight > 100 ? 100 : this.selectItem.neckHeight, 200, this
					.selectItem.sideHeadHeight > 100 ? 100 : this.selectItem.sideHeadHeight, this.selectItem
					.sideNeckHeight >
					100 ?
					100 :
					this.selectItem.sideNeckHeight, 200);
				// 如果有数据，默认调整枕头
				// let init_arraybuffer = initPillow(this.selectItem.headHeight, this.selectItem.neckHeight, 200, this
				// 	.selectItem
				// 	.sideHeadHeight, this.selectItem.sideNeckHeight, 200);
				// let app = getApp()
				blue_class.getInstance().write2tooth(init_arraybuffer);

				uni.switchTab({
					url: "/pages/status/status"
				})
			},
			// 发送模式设置
			sendHandler(item) {
				// uni.switchTab({
				// 	url: '/pages/status/status'
				// })
				let params = this.modeList[item];
				this.selectItem = params;

				// 如果有数据，默认调整枕头 限制最高高度不能超过100mm！！！！！！！！！！！
				let init_arraybuffer = initPillow(this.selectItem.headHeight > 100 ? 100 : this.selectItem.headHeight, this
					.selectItem
					.neckHeight > 100 ? 100 : this.selectItem.neckHeight, 200, this
					.selectItem.sideHeadHeight > 100 ? 100 : this.selectItem.sideHeadHeight, this.selectItem
					.sideNeckHeight >
					100 ?
					100 :
					this.selectItem.sideNeckHeight, 200);
				// 如果有数据，默认调整枕头
				// let init_arraybuffer = initPillow(this.selectItem.headHeight, this.selectItem.neckHeight, 200, this
				// 	.selectItem
				// 	.sideHeadHeight, this.selectItem.sideNeckHeight, 200);
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
			},
			navHandle() {
				if (!this.selectItem.headHeight && !this.selectItem.neckHeight) {
					uni.showToast({
						title: '未选择模式数据！'
					})
					return;
				}

				uni.navigateTo({
					url: "/page_subject/adjust/adjust" + object2Query(this.selectItem)
				})
			},
		},
	}
</script>

<style lang="scss">
	.container {
		background-color: rgb(197, 208, 230);
		height: 100%;

		.title {
			margin: 10rpx;
			text-align: center;
		}

		.maintitle {
			margin-top: 50rpx;
			margin-bottom: 30rpx;
		}

		.send-btn {
			background-color: #4d7fc9;
			margin: 40rpx;
			color: white;
			text-align: center;
			line-height: 88rpx;
			padding-left: 50rpx;
			padding-right: 50rpx;
			border-radius: 25rpx;
		}

		.kv {
			margin: 0 auto;
			margin-top: 52rpx;
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


		.setting {
			justify-content: space-between;
			align-items: center;
			padding-top: 31rpx;
			margin-left: 40rpx;
			margin-right: 40rpx;


			.item {
				align-items: center;
				width: 212rpx;
				height: 270rpx;
				background-color: white;
				// border: 1px solid #5B7897;
				border-radius: 10rpx;
			}

			.selected {
				background-color: #d8d8d8;
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
	}
</style>