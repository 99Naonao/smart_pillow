<template>
	<!-- 	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='枕头调整'></z-nav-bar> -->
	<view class="main">
		<view class="select-part">
			<view :class="this.selectIndex==1?'select-btn':'select-btn unselect-btn'" @click="selectHandler(1)">
				<image mode="widthFix" class="icon1" :src="'../static/adjust/SY_11_IconYWb.png'"></image>
				<label>仰卧调节</label>
			</view>
			<view :class="this.selectIndex==2?'select-btn':'select-btn unselect-btn'" @click="selectHandler(2)">
				<image mode="widthFix" class="icon2" :src="'../static/adjust/SY_11_IconCWb.png'"></image>
				<label>侧卧调节</label>
			</view>
		</view>
		<view class="info-part">
			<view class="info-second-part">
				<label class='desc1'>脖颈部</label>
				<label class='desc1size'>{{this.selectIndex==1?this.neck:this.sideNeck}}mm</label>
				<label class='desc2'>头枕部</label>
				<label class='desc2size'>{{this.selectIndex==1?this.head:this.sideHead}}mm</label>
				<image class="main-icon" :src="'../static/adjust/SY_11_DITU.png'"></image>
				<image class="down-icon" :src="'../static/adjust/SY_11_DOW.png'"></image>
				<image class="up-icon" :src="'../static/adjust/SY_11_UP.png'"></image>
				<image class="bzb-icon" :src="'../static/adjust/SY_11_buttonBZb.png'"></image>
				<image class="tzb-icon" :src="'../static/adjust/SY_11_buttonTZb.png'"></image>
				<view :class="this.selectHead?'bo bo-left':'bo bo-left select'" @click="selectHeadHandler(false)">
					脖枕
				</view>
				<view :class="this.selectHead?'bo bo-right select':'bo bo-right'" @click="selectHeadHandler(true)">
					头枕
				</view>
			</view>
			<view class="opt-part">
				<!-- 				<button class="opt-btn" hover-class="is-hover">
					<image mode="widthFix" class="icon" style="transform: rotate(-180deg);"
						:src="'../static/adjust/SY_11_butUP.png'"></image>升高
				</button> -->
				<view class="opt-btn" @touchstart="adjustHighSleepHandler" @touchend="stopAdjustHighHandler">
					<image mode="widthFix" class="icon" style="transform: rotate(-180deg);"
						:src="'../static/adjust/SY_11_butUP.png'"></image>
					<label>升高</label>
				</view>
				<view class="opt-btn" @touchstart="adjustLowSleepHandler" @touchend="stopAdjustHighHandler">
					<image mode="widthFix" class="icon" :src="'../static/adjust/SY_11_butUP.png'">
					</image>
					<label>降低</label>
				</view>
			</view>
			<view class="opt-part">
				<view class="opt-btn" @click="uploadDataHandle">
					<label>上报数据</label>
				</view>

				<view class="opt-btn" @click="resetHandle">
					<label>设备校准</label>
				</view>
			</view>
			<view class="bottom-part">
				<view class="save" @click="saveHandler">保存</view>
			</view>
		</view>
	</view>

</template>

<script>
	import blue_class from '../../utils/BlueManager'
	import {
		object2Query,
		parsePillowRealState,
		handPillowStatus,
		handPillowSideState,
		handPillowFrontState,
		handlePillowDelayState,
		hexStringToArrayBuffer,
		ab2hex,
		resetPillow,
		uploadDataRequest,
		changeAdjustMode,
		changeSaveAdjustMode,
		hand1Shake,
		write2tooth,
		parsePillowState
	} from '@/common/util.js'
	export default {
		components: {

		},
		data() {
			return {
				deviceId: '', // 连接的蓝牙id
				serviceId: '', // 连接的服务id
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				characteristicStringId: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', //write，string，rx；
				pillowName: '',
				selectIndex: 1,
				selectHead: true, // 是否选中调整头枕，否则是脖枕
				head: 0,
				sideHead: 0,
				neck: 0,
				sideNeck: 0
			}
		},
		onLoad(options) {
			console.log('options:', options)
			this.pillowName = decodeURIComponent(options.pillowName || '')
			this.deviceId = options.deviceId || ''
			this.serviceId = options.serviceId || ''
			uni.setNavigationBarTitle({
				title: this.pillowName
			})
		},
		onShow() {
			// 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
			// uni.onBLECharacteristicValueChange(this.handleMessage)
			uni.$on('xx', this.handleMessage);
			// this.requestStatus()
			let arraybuffer = changeAdjustMode();
			// let app = getApp()
			blue_class.getInstance().write2tooth(arraybuffer)
		},
		onHide() {
			uni.$off('xx', this.handleMessage);
			// uni.offBLECharacteristicValueChange(this.handleMessage)
		},
		methods: {
			uploadDataHandle() {
				let upload_data = uploadDataRequest(5)
				blue_class.getInstance().write2tooth(upload_data)
			},
			resetHandle() {
				let reset_data = resetPillow(88)
				blue_class.getInstance().write2tooth(reset_data)
			},
			// 请求枕头状态
			requestStatus() {
				let shake1 = handPillowStatus()
				blue_class.getInstance().write2tooth(shake1)
			},
			saveHandler() {
				let changeAdjust = changeSaveAdjustMode();
				blue_class.getInstance().write2tooth(changeAdjust)
				// uni.switchTab({
				// 	url: '/pages/status/status'
				// })
				// uni.navigateBack()
			},
			handleMessage(res) {
				// console.log(`value:`, res.value)
				let arrayBuffer_res = new Uint8Array(res.value);
				// let arrayBuffer_DateView = new DataView(arrayBuffer_res);
				let mark = arrayBuffer_res[0];
				console.log('handleMessage 接收到数据 mark:', parseInt(mark))
				let length = arrayBuffer_res[1];
				console.log('handleMessage 接收到数据 length:', parseInt(length))
				let arrayBuffer = new ArrayBuffer(length);
				let receive_dataView = new DataView(arrayBuffer);
				for (var index = 0; index < arrayBuffer.byteLength; index++) {
					receive_dataView.setUint8(index, arrayBuffer_res[index + 2])
				}
				console.log('handleMessage adjust 接收到数据', ab2hex(res.value), mark, arrayBuffer.length);
				switch (parseInt(mark)) {
					case 1:
						let result = receive_dataView.getUint8(0)
						switch (parseInt(result)) {
							case 0:
								console.log("[调整模式成功]")
								break;
							case 1:
								console.log("[调整模式参数非法]")
								break;
							case 2:
								console.log("[不支持的指令]")
								break;
						}
						break;
					case 2:
						break;
					case 4:
						let result4 = receive_dataView.getUint8(0)
						switch (parseInt(result4)) {
							case 0:
								console.log("[调整枕头成功]")
								break;
							case 1:
								console.log("[调整模式参数非法]")
								break;
							case 2:
								console.log("[不支持的指令]")
								break;
						}
						break;
					case 5:
						break;
					case 6:
						this.parsePillowStatus(arrayBuffer)
						break;
					case 88:
						break;
				}
				return;
				// 如果收到数据是4个字节,虽然发的是8个字节，但是只有后4个字节有数据
				if (arrayBuffer.length == 4) {
					let receive16 = ab2hex(res.value);
					let ask = receive16.slice(0, 2);
					let len = receive16.slice(2, 4);
					let result = receive16.slice(4, 6);
					let mark = receive16.slice(6, 8);

					console.log('数据长度:', len, result, ('0x' + result).toString(10), mark)
					//指令应答
					if (mark == '33') {
						switch (parseInt(ask)) {
							case 1:
								console.log('33 => 1:', result);
								break;
							case 4:
								console.log('33 => 4:', result);
								break;
						}
					}
				} else if (arrayBuffer.length == 2) {
					let receive16 = ab2hex(res.value);
					let mark = receive16.slice(2, 4)
					let len = receive16.slice(0, 2)
					console.log('接收到回复数据:', mark, len)
					if (mark == '55') {
						console.log('接收到回复数据', ab2hex(res.value))
						console.log('校验长度', parseInt('0x' + len))
						console.log('握手成功可以发送ssid了')
						write2tooth(this.deviceId, this.serviceId, this.characteristicStringId,
							hexStringToArrayBuffer('jimlee'))
					} else if (mark == '66') {
						console.log('握手成功可以发送ssid密码了')
						// 发送wifi密码
						write2tooth(this.deviceId, this.serviceId, this.characteristicStringId,
							hexStringToArrayBuffer('lijiming'))
					} else if (mark == 'aa') {
						console.log('发送成功了ssid了')
					} else if (mark == '33') {
						console.log('收到成功调整枕头')
						console.log('8个字节指令的校验和', parseInt('0x' + len))
					}
				} else if (arrayBuffer.length == 8) {
					// //默认是枕头状态 5s收到一次
					let receive16 = ab2hex(res.value);
					// （0：0--空闲，1--平躺，2--侧卧；1：（备用）2：头部气囊高度值；3：颈部气囊高度值；4:固件版本； 5是否校准；6~7：电池电压值）
					let status = receive16.slice(0, 2);
					let status1 = '0x' + status;

					let status10 = parseInt(status1);
					switch (status10) {
						case 0:
							console.log('枕头空闲状态')
							break;
						case 1:
							console.log('枕头平躺状态')
							break;
						case 2:
							console.log('枕头侧卧状态')
							break;
					}
					let headHeight = receive16.slice(4, 6);
					let headHeight10 = parseInt('0x' + headHeight);
					let neckHeight = receive16.slice(6, 8);
					let neckHeight10 = parseInt('0x' + neckHeight);
					let vesrion = receive16.slice(8, 10);
					let vesrion10 = parseInt('0x' + vesrion);
					let isright = receive16.slice(10, 12);
					let isright10 = parseInt('0x' + isright);
					let press = receive16.slice(12, 14);
					let press10 = parseInt('0x' + press);

					this.head = headHeight10;
					this.neck = neckHeight10;
					// let status1 = '0x' + status;

					console.log('adjust =>', status, headHeight, neckHeight, vesrion, isright, press)
					console.log('adjust mm=>', status10, headHeight10 + 'mm', neckHeight10 + 'mm', vesrion10, isright10,
						press10)
				}
			},
			parsePillowStatus(arraybuffer) {
				// //默认是枕头状态 5s收到一次
				let receive16 = ab2hex(arraybuffer);
				// （0：0--空闲，1--平躺，2--侧卧；1：（备用）2：头部气囊高度值；3：颈部气囊高度值；4:固件版本； 5是否校准；6~7：电池电压值）
				let status = receive16.slice(0, 2);
				let status1 = '0x' + status;

				let status10 = parseInt(status1);
				switch (status10) {
					case 0:
						console.log('枕头空闲状态')
						break;
					case 1:
						console.log('枕头平躺状态')
						break;
					case 2:
						console.log('枕头侧卧状态')
						break;
				}
				let headHeight = receive16.slice(4, 6);
				let headHeight10 = parseInt('0x' + headHeight);
				let neckHeight = receive16.slice(6, 8);
				let neckHeight10 = parseInt('0x' + neckHeight);
				let vesrion = receive16.slice(8, 10);
				let vesrion10 = parseInt('0x' + vesrion);
				let isright = receive16.slice(10, 12);
				let isright10 = parseInt('0x' + isright);
				let press = receive16.slice(12, 14);
				let press10 = parseInt('0x' + press);

				this.head = headHeight10;
				this.neck = neckHeight10;
				// let status1 = '0x' + status;

				console.log('adjust =>', status, headHeight, neckHeight, vesrion, isright, press)
				console.log('adjust mm=>', status10, headHeight10 + 'mm', neckHeight10 + 'mm', vesrion10, isright10,
					press10)
			},
			selectHeadHandler(bool) {
				this.selectHead = bool
			},
			selectHandler(index) {
				this.selectIndex = index
			},
			// 调低枕头
			adjustLowSleepHandler() {
				let action = 2
				let arraybuffer
				// 如果选择的仰卧
				if (this.selectIndex == 1) {
					// 如果选择的是调整头枕
					if (this.selectHead) {
						this.head -= 1
						if (this.head <= 0) {
							this.head = 0
						}
					} else {
						this.neck -= 1
						if (this.neck <= 0) {
							this.neck = 0
						}
					}
					arraybuffer = handPillowFrontState(action, this.selectHead)
					console.log('调低仰卧:', this.selectHead ? '调整头部' : '调整颈部', action, ab2hex(arraybuffer))
				} else {
					// 如果选择的侧卧
					if (this.selectHead) {
						this.sideHead -= 1
						if (this.sideHead <= 0) {
							this.sideHead = 0
						}
					} else {
						this.sideNeck -= 1
						if (this.sideNeck <= 0) {
							this.sideNeck = 0
						}
					}
					arraybuffer = handPillowSideState(this.sideHead, this
						.sideNeck)
					console.log('调低侧卧:', this.sideHead, this.sideNeck, ab2hex(arraybuffer))
				}
				// console.log('调低:', ab2hex(arraybuffer))
				blue_class.getInstance().write2tooth(arraybuffer)
			},
			stopAdjustHighHandler() {
				// 停止调节枕头
				// 如果选择的仰卧
				let action = 0
				let arraybuffer = null;
				if (this.selectIndex == 1) {
					if (this.selectHead) {
						this.head += 1
						if (this.head >= 100) {
							this.head = 100
						}
					} else {
						this.neck += 1
						if (this.neck >= 100) {
							this.neck = 100
						}
					}
					arraybuffer = handPillowFrontState(action, this
						.neck)
					console.log('停止调节仰卧:', action, ab2hex(arraybuffer))
				} else {
					if (this.selectHead) {
						this.sideHead += 1
						if (this.sideHead >= 100) {
							this.sideHead = 100
						}
					} else {
						this.sideNeck += 1
						if (this.sideNeck >= 100) {
							this.sideNeck = 100
						}
					}
					// 如果选择的侧卧
					arraybuffer = handPillowSideState(action, this
						.sideNeck)
					console.log('停止调节侧卧:', this.head, this.neck, ab2hex(arraybuffer))
				}
				// console.log('调高:', ab2hex(arraybuffer))
				blue_class.getInstance().write2tooth(arraybuffer)
			},
			// 调高枕头
			adjustHighSleepHandler() {
				// uni.showLoading({
				// 	title: '调高中'
				// })
				let arraybuffer
				let action = 1

				// 如果选择的仰卧
				if (this.selectIndex == 1) {
					if (this.selectHead) {
						this.head += 1
						if (this.head >= 100) {
							this.head = 100
						}
					} else {
						this.neck += 1
						if (this.neck >= 100) {
							this.neck = 100
						}
					}
					arraybuffer = handPillowFrontState(action, this.selectHead)
					console.log('调高仰卧:', this.selectHead ? '调整头部' : '调整颈部', ab2hex(arraybuffer))
				} else {
					if (this.selectHead) {
						this.sideHead += 1
						if (this.sideHead >= 100) {
							this.sideHead = 100
						}
					} else {
						this.sideNeck += 1
						if (this.sideNeck >= 100) {
							this.sideNeck = 100
						}
					}
					// 如果选择的侧卧
					arraybuffer = handPillowSideState(this.sideHead, this
						.sideNeck)
					console.log('调高侧卧:', this.head, this.neck, ab2hex(arraybuffer))
				}
				// console.log('调高:', ab2hex(arraybuffer))
				blue_class.getInstance().write2tooth(arraybuffer)
			},
		}
	}
</script>

<style lang="scss">
	.selected {
		background-color: #5B7897;
	}

	.unselect-btn {
		background-color: #5B7897 !important;
	}

	.select-btn {
		background-color: rgb(238, 126, 39);
		width: 284rpx;
		height: 90rpx;
		border-radius: 20rpx;
		color: white;
		display: flex;
		justify-content: space-around;
		align-items: center;

		.icon1 {
			width: 61rpx;
			height: 36rpx;
		}

		.icon2 {
			width: 61rpx;
			height: 41rpx;
		}
	}

	.normal-btn {
		background-color: rgb(255, 255, 255);
		width: 284rpx;
		height: 90rpx;
		border-radius: 20rpx;
		display: flex;
		justify-content: space-around;
		align-items: center;

		.icon1 {
			width: 61rpx;
			height: 36rpx;
		}

		.icon2 {
			width: 61rpx;
			height: 41rpx;
		}

	}

	.main {
		background-color: rgb(216, 226, 246);
		width: 100%;
		height: 100%;

		.select-part {
			padding-top: 60rpx;
			display: flex;
			justify-content: space-around;
		}


		.info-second-part {
			position: relative;
			margin: 0 auto;
			width: 634rpx;
			height: 197rpx;
			margin-top: 100rpx;
			color: #5B7897;

			.bo {
				width: 128rpx;
				height: 76rpx;
				background-color: #5B7897;
				color: white;
				text-align: center;
				line-height: 76rpx;
				border-radius: 30rpx 30rpx;
			}

			.bo-left {
				position: absolute;
				left: 115rpx;
				top: 108rpx;
			}

			.bo-right {
				position: absolute;
				right: 100rpx;
				top: 108rpx;
			}

			.select {
				background-color: white;
				color: #5B7897;
			}

			.bzb-icon {
				position: absolute;
				left: 66rpx;
				top: 60rpx;
				width: 358rpx;
				height: 139rpx;
			}

			.tzb-icon {
				position: absolute;
				right: 66rpx;
				top: 60rpx;
				width: 327rpx;
				height: 125rpx;
			}

			.desc1 {
				font-size: 30rpx;
				left: 22rpx;
				top: -35rpx;
				position: absolute;
			}

			.desc1size {
				font-size: 36rpx;
				position: absolute;
				right: 388rpx;
				top: -38rpx;
			}

			.desc2 {
				position: absolute;
				color: #5B7897;
				left: 375rpx;
				top: -35rpx;
				font-size: 30rpx;
			}

			.desc2size {
				font-size: 36rpx;
				position: absolute;
				right: 43rpx;
				top: -38rpx;
			}

			.main-icon {
				width: 634rpx;
				height: 197rpx;
			}

			.up-icon {
				width: 24rpx;
				height: 76rpx;
				position: absolute;
				left: 30rpx;
				top: 100rpx;
			}

			.down-icon {
				width: 24rpx;
				height: 77rpx;
				position: absolute;
				right: 27rpx;
				top: 100rpx;
			}
		}

		.opt-part {
			display: flex;
			justify-content: space-around;
			margin-top: 100rpx;

			.opt-btn {
				width: 284rpx;
				height: 90rpx;
				display: flex;
				justify-content: space-around;
				align-items: center;
				background-color: #5B7897;
				border-radius: 30rpx;
				line-height: 56rpx;
				color: white;

				label {
					margin-left: -55rpx;
				}
			}

			.icon {
				width: 56rpx;
				height: 56rpx;
			}
		}
	}


	.bottom-part {
		background-color: white;
		height: 300rpx;
		width: 100%;
		position: fixed;
		bottom: 0rpx;
		border-radius: 50rpx 50rpx 0rpx 0rpx;

		.save {
			width: 670rpx;
			height: 102rpx;
			background-color: #5B7897;
			margin: 0 auto;
			line-height: 102rpx;
			text-align: center;
			color: white;
			margin-top: 80rpx;
			border-radius: 50rpx;

		}
	}
</style>