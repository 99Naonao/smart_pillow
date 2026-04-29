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
		<view v-if="hasSelectedMode" class="send-btn" :class="{'sending': isSending}" @click.stop="sendItemHandler()">
			发送数据到枕头
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
	</view>
</template>

<script>
	import { object2Query } from '@/common/util.js'
	import { PillowBleManager } from '@/utils/BlueUtils'
	import { addUseLog } from '@/utils/miniapp.js'
	import { stopSpineAdjustSession } from '@/common/spineSession.js'

	export default {
		onLoad(options) {
			this.pillowName = decodeURIComponent(options.pillowName || '')
			this.deviceId = options.deviceId || ''
			this.serviceId = options.serviceId || ''
			console.log('options:', options, this.pillowName)
			uni.setNavigationBarTitle({
				title: this.pillowName || '我的模式'
			})
		},
		onShow() {
			if (PillowBleManager.getInstance().getSpineAdjusting()) {
				stopSpineAdjustSession({
					showModal: true,
					modalContent: '进入默认数据/模式页后已结束脊柱微调'
				});
			}
			let standard = uni.getStorageSync('standard')
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
				isSending: false,
				deviceId: '',
				serviceId: '',
				/** 与协议 0x02/0x03 索引一致：0 成年男性、1 成年女性、2 儿童 */
				modeList: [{
					name: '成年男性',
					profileIndex: 0,
					headHeight: 80,
					neckHeight: 80,
					sideHeadHeight: 80,
					sideNeckHeight: 80,
				}, {
					name: '成年女性',
					profileIndex: 1,
					headHeight: 60,
					neckHeight: 60,
					sideHeadHeight: 60,
					sideNeckHeight: 60,
				}, {
					name: '10-15岁儿童',
					profileIndex: 2,
					headHeight: 36,
					neckHeight: 36,
					sideHeadHeight: 36,
					sideNeckHeight: 36,
				}]
			}
		},
		computed: {
			hasSelectedMode() {
				const s = this.selectItem || {}
				if (s.name) return true
				return ['headHeight', 'neckHeight', 'sideHeadHeight', 'sideNeckHeight'].some((k) => {
					const v = s[k]
					if (v === '' || v === undefined || v === null) return false
					return Number.isFinite(Number(v))
				})
			}
		},
		methods: {
			pushModeProfileToBle(item) {
				return PillowBleManager.getInstance().applyModeProfileFromItem(item)
			},
			sendItemHandler() {
				if (this.isSending) {
					return
				}
				if (!PillowBleManager.getInstance().isConnected()) {
					uni.showModal({
						title: '未连接枕头提示',
						content: '请检查是否已连接到枕头',
						showCancel: false
					})
					return
				}
				this.isSending = true
				addUseLog(this.selectItem)
				console.log('mode已连接至枕头，发送数据', JSON.stringify(this.selectItem))
				if (!this.pushModeProfileToBle(this.selectItem)) {
					this.isSending = false
					uni.showToast({ title: '下发失败，请重试', icon: 'none' })
					return
				}
				this.isSending = false
				uni.showToast({ title: '已下发', icon: 'success' })
				uni.setStorageSync('mode_sent_success', true)
				this.addToMyMode(this.selectItem)
				setTimeout(() => {
					uni.switchTab({ url: '/pages/status/status' })
				}, 400)
			},
			addToMyMode(modeItem) {
				try {
					let myModeList = uni.getStorageSync('myMode')
					let modes = myModeList ? JSON.parse(myModeList) : []
					const existingIndex = modes.findIndex(item => item.name === modeItem.name)
					if (existingIndex >= 0) {
						modes[existingIndex] = { ...modeItem }
						console.log('更新已存在的模式:', modeItem.name)
					} else {
						modes.push({ ...modeItem })
						console.log('添加新模式到我的数据:', modeItem.name)
					}
					uni.setStorageSync('myMode', JSON.stringify(modes))
					console.log('我的数据已更新，当前模式数量:', modes.length)
				} catch (error) {
					console.error('添加模式到我的数据失败:', error)
				}
			},
			sendHandler(item) {
				const params = this.modeList[item]
				this.selectItem = params
				console.log('选择默认模式（仅选中，下发请点「发送数据到枕头」）', params.name)
				// 不在此下发：避免与「发送数据到枕头」重复调用 applyModeProfileFromItem 导致同一套 BLE 打两遍
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
				const s = this.selectItem || {}
				const hasDims = ['headHeight', 'neckHeight', 'sideHeadHeight', 'sideNeckHeight'].some((k) => {
					const v = s[k]
					if (v === '' || v === undefined || v === null) return false
					return Number.isFinite(Number(v))
				})
				if (!s.name && !hasDims) {
					console.log('未选择默认数据')
					uni.showModal({
						title: '默认数据未选择提示',
						content: '请选择成年男性、成年女性、10-15岁儿童其中一个默认数据进行手动微调',
						showCancel: false
					})
					return
				}
				uni.navigateTo({
					url: '/page_subject/adjust/adjust' + object2Query(this.selectItem)
				})
			},
		}
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
			transition: all 0.3s ease;
			
			&.sending {
				background-color: #8a9bb5;
				opacity: 0.8;
			}
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