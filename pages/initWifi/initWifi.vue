<template>
	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='初始设备'></z-nav-bar>
	<view class="main">
		<view class="pillow-top border-item">
			<view class="pillow-name">
				{{pillowName}}
			</view>
		</view>
		<view class="uni-title uni-common-pl">请选择网络</view>
		<view class="uni-list border-item">
			<view class="uni-list-cell">
				<view class="uni-list-cell-left">
					当前选择
				</view>
				<view class="uni-list-cell-db">
					<picker @change="bindPickerChange" :value="index" :range="wifiList">
						<view class="uni-input">{{wifiList[index]}}</view>
					</picker>
				</view>
				<view class="image-right">
					<image class="drop-arrow" src="@/static/index/SY_10_button01a.png"></image>
				</view>
			</view>
		</view>
		<view class="uni-list border-item">
			<view class="uni-list-cell">
				<view class="uni-list-cell-left">
					密码
				</view>
				<view class="uni-list-cell-db">
					<input class="uni-input" :password="showPassword" placeholder="请输入密码" v-model="psd" />
				</view>
			</view>
		</view>
		<view class="opt-part">
			<view class="save-btn" @click="saveHandler">
				保存
			</view>
		</view>
	</view>
</template>

<script>
	import {
		ab2hex,
		write2tooth,
		hand1Shake,
	} from '@/common/util.js'
	export default {
		onLoad(options) {
			// 		// this.initCompRect()
			console.log('options', options, JSON.stringify(options), options.pillowName);
			this.pillowName = options.pillowName || '';
			console.log('this.pillowName', this.pillowName);
			uni.startWifi({
				success: res => {
					// console.log("初始化wifi模块成功123" + res.errMsg)
					// 需要自行进入“设置 - 无线局域网”，然后等待无线网刷新完成
					uni.getWifiList({
						success: (res) => {
							console.log("getWifiList123模块成功", res)
						},
						fail: (res) => {
							uni.showToast({
								title: res.errMsg
							})
						}
					})
				}
			});
		},
		onHide() {
			// uni.offGetWifiList(this.onWifiList)
		},
		onShow() {
			// 把wx.onGetWifiList()放在onShow()中，在第3步骤“无线网刷新完成后，自行回到“微信””后，便可以正常执行wx.onGetWifiList()的回调函数，可以在控制台打印，手机打开调试。
			uni.onGetWifiList((res) => {
				console.log('onGetWIfiList!!!!:::', res)
				this.wifiList = res.wifiList;
			})

			// 监听蓝牙接收的数据
			// 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
			uni.onBLECharacteristicValueChange((res) => {
				console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
				let arrayBuffer = new Uint8Array(res.value);
				console.log('接收到数据', ab2hex(res.value), arrayBuffer.length)
				// 如果收到数据是4个字节,虽然发的是8个字节，但是只有后4个字节有数据
				if (arrayBuffer.length == 4) {
					let receive16 = ab2hex(res.value);
					let last = '0x' + receive16
					let total = 0
					Array.prototype.map.call(
						arrayBuffer,
						function(bit) {
							total += Number(bit.toString(10))
							return ('00' + bit.toString(16)).slice(-2)
						}
					)
					let shake1 = hand1Shake(Number(
						total), arrayBuffer)
					console.log("total:", total)
					write2tooth(this.deviceId, this.serviceId, this.characteristicId, shake1)
					console.log('第一次握手', this.ab2hex(shake1))
				} else if (arrayBuffer.length == 2) {
					let receive16 = ab2hex(res.value);
					let mark = receive16.slice(2, 4)
					let len = receive16.slice(0, 2)
					console.log('接收到回复数据123', mark, len)
					if (mark == '55') {
						console.log('接收到回复数据', ab2hex(res.value))
						console.log('校验长度', parseInt('0x' + len))
						console.log('可以发送ssid了')

					} else if (mark == '66') {
						// 发送wifi密码
						write2tooth(this.deviceId, this.serviceId, this.characteristicStringId, this.psd)
					} else if (mark == 'aa') {
						console.log('发送成功了ssid了')
					}
				}
			})
		},
		components: {

		},
		data() {
			return {
				showPassword: false,
				wifiList: [
					'123'
				],
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值write，byte，rxi；
				characteristicStringId: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', //string，rx；
				psd: '',
				index: 0,
				pillowName: '123',
				statusBarHeight: 0,
				navBarWidth: 0,
				navBarHeight: 0,
				menuButtonInfo: {
					width: 0,
					height: 0,
					top: 0,
					left: 0,
				},
			}
		},
		computed: {
			navWrapStyle() {
				return ''
			},
		},
		methods: {
			saveHandler() {
				console.log(this.psd, this.index, this.wifiList[this.index], this.deviceId, this.serviceId, this
					.characteristicStringId)
				write2tooth(this.deviceId, this.serviceId, this.characteristicStringId, this.wifiList[this.index])
			},
			bindPickerChange(item) {
				console.log('bindPickerChange:', item)
				this.index = item.detail.value
			},
			onWifiList(res) {
				console.log("onWifiList1111", res, res.wifiList)
				// this.wifiList = []
				// for (var item in res.wifiList) {
				// 	this.wifiList.push(res.wifiList[item].SSID)
				// }
				// this.wifiList = res.wifiList
			},
			// 返回
			backHandler() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss">
	.main {
		padding-left: 40rpx;
		padding-right: 40rpx;

		.border-item {
			// padding-left: 66rpx;
			// padding-right: 10rpx;
			height: 103rpx;
			line-height: 103rpx;
			border-radius: 30rpx;
			border: 1px solid #333333;
			margin-top: 40rpx;
		}

		.drop-arrow {
			width: 31rpx;
			height: 17rpx;
		}

		.pillow-top {
			display: flex;

		}

		.image-right {
			pointer-events: none;
			padding-right: 30rpx;
		}

		.uni-title {
			padding-top: 40rpx;
			padding-bottom: 0rpx;
		}


		.opt-part {
			text-align: center;
			padding-top: 40rpx;

			.save-btn {
				width: 150rpx;
				margin: 0 auto;
				padding: 30rpx;
				line-height: 50rpx;
				background-color: #5B7897;
				border-radius: 30rpx;
				color: white;
			}
		}
	}

	.arrow-left {
		flex: none;
		width: 30rpx;
		height: 30rpx;
		border-top: 2px solid #333333;
		border-right: 2px solid #333333;
		transform: rotate(-135deg);
	}

	.arrow-right {
		flex: none;
		width: 16rpx;
		height: 16rpx;
		border-top: 1px solid #333333;
		border-right: 1px solid #333333;
		transform: rotate(45deg);
	}

	.pillow-name {
		color: #5B7897;
	}
</style>