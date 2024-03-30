<template>
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
	</view>
</template>

<script>
	export default {
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 0,
					onshow: true
				});
			}

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
			// 检测是否
			checkConnectList(item) {
				if (this.connectList.indexOf(item.deviceId) > -1) {
					return '../static/SY_01WIEI_IconLY.png'
				}
				return '../static/SY_01WIEI_IconLY.png'
			},
			checkWifiConnectList(item) {
				return ('../static/SY_01WIEI_IconWF.png');
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
</style>