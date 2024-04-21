<template>
	<view class="container">
		<!-- 		<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
			title='自定义模式'></z-nav-bar> -->
		<public-module></public-module>
		<view class="title maintitle">自定义模式</view>
		<view class="main">
			<view class="item" v-for="(item,index) in modeList" :key="index">
				<view class="title">
					{{item.name}}
				</view>
				<view class="send-btn" @click="sendHandler(item)">
					发送
				</view>
			</view>
			<view class="item-plus" @click="addModeHandler">
				+
			</view>
		</view>
		<view class="title maintitle">预设模式</view>
		<view class="setting flex">
			<view class="item flex justify-content-center" @click="sendHandler(1)">
				<view class="text-align-center">
					<image class="nan" src="../../static/mode/SY_04_IconMANa.png"></image>
					<view>成年男性</view>
				</view>
			</view>
			<view class="item flex justify-content-center" @click="sendHandler(1)">
				<view class="text-align-center">
					<image class="nv" src="../../static/mode/SY_04_IconWOMANa.png"></image>
					<view>成年女性</view>
				</view>
			</view>
			<view class="item flex justify-content-center" @click="sendHandler(1)">
				<view class="text-align-center">
					<image class='child' src="../../static/mode/SY_04_IconYOUNa.png"></image>
					<view>10-15岁儿童</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		object2Query,
		handPillowSideState,
		handPillowFrontState,
		handlePillowDelayState,
		hexStringToArrayBuffer,
		ab2hex,
		hand1Shake,
		write2tooth,
		parsePillowState
	} from '@/common/util.js'
	export default {
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
		data() {
			return {
				pillowName: '',
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
			findStore() {
				let modeList = uni.getStorageInfoSync({
					key: 'mode'
				})
			},
			// 发送模式设置
			sendHandler(item) {
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