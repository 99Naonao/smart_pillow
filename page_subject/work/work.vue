<template>

	<page-meta :page-style="'overflow:'+(show?'hidden':'visible')"></page-meta>
	<view class="">
		<image class="topKV" mode="widthFix" :src="'../static/SY_01_000.png'"></image>
		<view class="tips" for="">监测到以下设备</view>
		<view class="tips" v-if="deviceIdList.length == 0">暂无设备</view>
		<view v-for="(item,index) in deviceIdList" :key="index">
			<view class="device-item">
				<view class="item-name">
					{{item.name}}
				</view>
				<view class="blue-tooth">
					<image mode="widthFix" :src="checkConnectList(item)"></image>
				</view>
				<view class="wifi">
					<image mode="widthFix" :src="(checkWifiConnectList(item))"></image>
				</view>
				<image :src="'../static/SY_01WIEI_buttonTJa.png'" class="connect-btn"
					@click="connectSleepHandler(item)">
				</image>
			</view>
		</view>


		<uni-popup ref="ppp" style="z-index: 10000; position: absolute;" class="popup" :mask-click="false"
			@change="change">
			<view class="container">
				<image class="close-btn" @click="closePopUpHandle"
					src="@/page_subject/static/adjust/SY_05_buttonCOLa.png" mode="widthFix">
				</image>
				<image class="tip" src="@/page_subject/static/adjust/SY_05_B001.png" mode="widthFix"></image>
				<view class="touch">
					<view class="item">
						<!-- <image class="item-btn" src="@/page_subject/static/adjust/SY_02_button01a.png"></image> -->
						<image class="icon1" src="@/page_subject/static/adjust/SY_02_Icon01.png" mode=""></image>
						<label>AI识别全自动设置</label>
					</view>
					<view class="item">
						<!-- <image class="item-btn" src="@/page_subject/static/adjust/SY_02_button01a.png"></image> -->
						<image class="icon2" src="@/page_subject/static/adjust/SY_02_Icon02.png" mode=""></image>
						<label>手动调整</label>
					</view>
					<view class="item">
						<!-- <image class="item-btn" src="@/page_subject/static/adjust/SY_02_button01a.png"></image> -->
						<image class="icon3" src="@/page_subject/static/adjust/SY_02_Icon03.png" mode=""></image>
						<label>选择已有数据</label>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		components: {

		},
		onShow() {
			// let curPages = getCurrentPages()[0]
			// if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
			// 	curPages.getTabBar().setData({
			// 		selected: 0,
			// 		onshow: true
			// 	});
			// }

			// 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
			uni.onBLECharacteristicValueChange((res) => {
				console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
				let arrayBuffer = new Uint8Array(res.value);
				console.log('接收到数据', this.ab2hex(res.value), arrayBuffer.length)
				// 如果收到数据是4个字节,虽然发的是8个字节，但是只有后4个字节有数据
				if (arrayBuffer.length == 4) {
					let receive16 = this.ab2hex(res.value);
					let last = '0x' + receive16
					let total = 0
					Array.prototype.map.call(
						arrayBuffer,
						function(bit) {
							total += Number(bit.toString(10))
							return ('00' + bit.toString(16)).slice(-2)
						}
					)
					let shake1 = this.hand1Shake(Number(
						total), arrayBuffer)
					console.log("total:", total)
					this.write2tooth(this.deviceId, this.serviceId, this.characteristicId, shake1)
					console.log('第一次握手', this.ab2hex(shake1))
				} else if (arrayBuffer.length == 2) {
					let receive16 = this.ab2hex(res.value);
					let mark = receive16.slice(2, 4)
					let len = receive16.slice(0, 2)
					console.log('接收到回复数据123', mark, len)
					if (mark == '55') {
						console.log('接收到回复数据', this.ab2hex(res.value))
						console.log('校验长度', parseInt('0x' + len))
					}
				}
			})
		},
		onHide: () => {
			let that = this
			that.deviceIdList = [];
			if (this.searching) {
				uni.stopBluetoothDevicesDiscovery({
					success: function(res) {
						that.searching = false
					}
				})
			}
		},
		onLoad() {
			// 监听设备发现
			let that = this
			uni.onBluetoothDeviceFound((result) => {
				//剔除重复设备，兼容不同设备API的不同返回值
				var isnotexist = true
				let devices = result.devices
				// 1
				if (result.deviceId) {

				} else if (result.devices) {
					if (result.devices[0].advertisData) {
						result.devices[0].advertisData = that.ab2hex(result.devices[0].advertisData)
					} else {
						result.devices[0].advertisData = ''
					}

					for (var i = 0; i < that.deviceIdList.length; i++) {
						if (result.devices[0].deviceId == that.deviceIdList[i].deviceId) {
							isnotexist = false
						}
					}
					if (isnotexist && result.devices[0].name != '' && result.devices[0].name.indexOf('Minga') > -
						1) {
						that.deviceIdList.push(result.devices[0])
					}
				} else if (result[0]) {
					if (result[0].advertisData) {
						result[0].advertisData = that.ab2hex(result[0].advertisData)
					} else {
						result[0].advertisData = ''
					}

					for (var i = 0; i < that.deviceIdList.length; i++) {
						if (result[0].deviceId == that.deviceIdList[i].deviceId) {
							isnotexist = false
						}
					}
					if (isnotexist && result[0].name != '' && result[0].name.indexOf('Minga') > -1) {
						that.deviceIdList.push(result[0])
					}
				}

				let first_device = devices[0]
				for (var i = 0; i < that.deviceIdList.length; i++) {
					if (devices.deviceId == that.deviceIdList[i].deviceId) {
						isnotexist = false
					}
				}
				console.log('new device list has founded', devices.length, devices)
			})
		},
		data() {
			return {
				show: false,
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				searching: false, // 搜索中
				deviceIdList: [{
					name: 'test',
					deviceId: '123'
				}], // 检测列表
				connectList: [], // 连接列表

			}
		},
		methods: {
			closePopUpHandle() {
				this.$refs.ppp.close()
			},
			// 检测是否
			checkConnectList(item) {
				if (this.connectList.indexOf(item.deviceId) > -1) {
					return '../static/SY_01WIEI_IconLY.png'
				}
				return '../static/SY_01WIEI_IconLY.png'
			},
			checkWifiConnectList(item) {
				return ('../static/SY_01WIEI_IconWF.png');
			},
			connectSleepHandler(item) {
				console.log('this', this.$refs)
				this.$refs.ppp.open('bottom')
				this.show = true
				return
				uni.navigateTo({
					url: '/pages/initWifi/initWifi'
				})
			},
			change(e) {
				this.show = e.show
			}
		}
	}
</script>

<style lang="scss">
	.topKV {
		width: 100%;
	}

	.tips {
		text-align: center;
		color: #5B7897;
		font-size: 32rpx;
	}

	.device-item {
		border: 1px solid #5B7897;
		border-radius: 20rpx;
		margin-left: 41rpx;
		margin-right: 41rpx;
		height: 118rpx;
		line-height: 118rpx;
		display: flex;
		align-items: center;

		.connect-btn {
			width: 285rpx;
			height: 174rpx;
			margin-top: 20rpx;
		}

		.item-name {
			line-height: 118rpx;
			color: #5B7897;
			font-size: 32rpx;
			padding-left: 30rpx;
			padding-right: 30rpx;
			flex: 1;
			text-overflow: ellipsis;
			overflow: hidden;
			margin-right: auto;
		}

		.blue-tooth {
			width: 80rpx;
			height: 80rpx;
			background-color: white;
			border-radius: 30rpx;
			box-shadow: 0rpx 0rpx 20rpx #5B7897;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 30rpx;

			image {
				display: inline-block;
				width: 28rpx;
				height: 43rpx;
			}
		}

		.wifi {
			background-color: white;
			border-radius: 30rpx;
			box-shadow: 0rpx 0rpx 20rpx #5B7897;
			display: flex;
			align-items: center;
			justify-content: center;

			width: 80rpx;
			height: 80rpx;

			image {
				display: inline-block;
				width: 42rpx;
				height: 29rpx;
			}
		}
	}



	.container {
		background-color: white;
		border-radius: 50rpx 50rpx 0 0;
		position: relative;

		::after {
			content: '';
			display: block;
			clear: both;
		}

		.tip {
			width: 322rpx;
			height: 161rpx;
			position: absolute;
			left: 50%;
			top: -60rpx;
			margin-left: -161rpx;
		}

		.close-btn {
			width: 26rpx;
			height: 27rpx;
			right: 30rpx;
			top: 20rpx;
			position: absolute;
		}

		.touch {
			text-align: center;
			padding-top: 100rpx;


			.item {
				text-align: center;
				color: white;
				background-color: #5B7897;
				border-radius: 30rpx;
				margin-top: 10rpx;
				margin-bottom: 10rpx;
				margin-left: 35rpx;
				margin-right: 35rpx;
				line-height: 100rpx;
				position: relative;

				.item-btn {
					width: 713rpx;
					height: 100rpx;
					margin: 0 auto;
				}

				.icon1 {
					width: 81rpx;
					height: 81rpx;
					left: 20rpx;
					top: 10rpx;
					position: absolute;

				}

				.icon2 {
					left: 20rpx;
					top: 10rpx;
					width: 81rpx;
					height: 81rpx;
					position: absolute;
				}

				.icon3 {
					left: 20rpx;
					top: 10rpx;
					width: 81rpx;
					height: 81rpx;
					position: absolute;
				}

			}


		}
	}
</style>