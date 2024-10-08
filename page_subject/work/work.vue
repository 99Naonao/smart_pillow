<template>
	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='连接设备'></z-nav-bar>
	<public-module></public-module>
	<!-- <page-meta :page-style="'overflow:'+(show?'hidden':'visible')"></page-meta> -->
	<view class="">
		<image class="topKV" mode="widthFix" src="@/static/SY_01_000.png"></image>
		<view class="tips" for="">监测到以下设备</view>
		<view class="tips" v-if="deviceIdList.length == 0">暂无设备</view>
		<view v-for="(item,index) in deviceIdList" :key="index">
			<view class="device-item">
				<view class="item-name">
					{{item.name}}
				</view>
				<view class="blue-tooth">
					<image mode="widthFix" :src="checkConnectList(item)" @click="connectBlueToothSleepHandler(item)">
					</image>
				</view>
				<view class="wifi" v-if="false">
					<image mode="widthFix" :src="(checkWifiConnectList(item))" @click="connectWifiSleepHandler(item)">
					</image>
				</view>
				<image :src="'../static/SY_01WIEI_buttonTJa.png'" class="connect-btn">
				</image>
			</view>
		</view>
		<view class="spetips">
			<div class="item" style="margin-left: 42rpx;">特别说明:</div>
			<div class="item flex align-center">
				<image class="iconblue" mode="widthFix" src="../static/SY_01_IconLY.png"></image>
				<div>睡眠枕基本使用功能，需要蓝牙连接</div>
			</div>
		</view>
		<!-- 		<view class="device-item">
			<image mode="widthFix" :src="'../static/SY_01WIEI_buttonTJa.png'" class="connect-btn"
				@click="adjustLowSleepHandler(item)">
			</image>
			<image mode="widthFix" :src="'../static/SY_01WIEI_buttonTJa.png'" class="connect-btn"
				@click="adjustHighSleepHandler(item)">
			</image>
		</view> -->


		<uni-popup ref="ppp" style="z-index: 10000; position: absolute;" border-radius="40rpx 40rpx 0rpx 0rpx"
			background-color='white' safe-area="false" class="popup" :mask-click="false" @change="change">
			<view class="container">
				<image class="close-btn" @click="closePopUpHandle"
					src="@/page_subject/static/adjust/SY_05_buttonCOLa.png" mode="widthFix">
				</image>
				<image class="tip" src="@/static/adjust/SY_05_B001.png" mode="widthFix"></image>
				<view class="touch">
					<view class="item" @click="autoHandler">
						<!-- <image class="item-btn" src="@/page_subject/static/adjust/SY_02_button01a.png"></image> -->
						<image class="icon1" src="@/page_subject/static/adjust/SY_02_Icon01.png" mode=""></image>
						<label>AI识别全自动设置</label>
					</view>
					<view class="item" @click="showAdjustHandler">
						<!-- <image class="item-btn" src="@/page_subject/static/adjust/SY_02_button01a.png"></image> -->
						<image class="icon2" src="@/page_subject/static/adjust/SY_02_Icon02.png" mode=""></image>
						<label>手动调整</label>
					</view>
					<view class="item" @click="showModeHandler">
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
	import {
		object2Query,
		handPillowFrontState,
		handlePillowDelayState,
		hexStringToArrayBuffer,
		ab2hex,
		hand1Shake,
		write2tooth,
		changeAdjustMode,
		handPillowSideState,
		parsePillowState
	} from '@/common/util.js'
	import blue_class from '../../utils/BlueManager';
	import {
		appAnswer,
		parseTime
	} from '../../common/util';
	import {
		nextTick
	} from 'vue';
	export default {
		components: {

		},
		onShow() {
			this.onShowing = true;
			// let app = getApp();
			// this.deviceId = app.globalData.deviceId;
			// this.characteristicId = app.globalData.characteristicId;
			// this.serviceId = app.globalData.serviceId;

			// 如果正在搜索中
			if (this.searching) {
				uni.closeBluetoothAdapter({
					complete: () => {
						this.searching = false
					}
				})
			} else {
				if (blue_class.getInstance().deviceName != '') {
					this.deviceIdList = [{
						name: blue_class.getInstance().deviceName
					}];
				}
			}
			uni.$on('xx', this.handleMessage)
			// 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
			// uni.onBLECharacteristicValueChange(this.handleMessage)
		},
		onHide() {
			// uni.offBLECharacteristicValueChange(this.handleMessage)
			this.onShowing = false;
			uni.$off('xx', this.handleMessage)
			// if (this.searching) {
			// uni.stopBluetoothDevicesDiscovery({
			// 	success: function(res) {
			// 		that.searching = false
			// 	}
			// })
			// uni.closeBluetoothAdapter({
			// 	complete: () => {
			// 		that.searching = false
			// 	}
			// })
			// }
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
						result.devices[0].advertisData = ab2hex(result.devices[0].advertisData)
					} else {
						result.devices[0].advertisData = ''
					}

					for (var i = 0; i < that.deviceIdList.length; i++) {
						if (result.devices[0].deviceId == that.deviceIdList[i].deviceId) {
							isnotexist = false
						}
					}
					if (isnotexist && result.devices[0].name != '') {
						if (result.devices[0].name.indexOf('Minga') > -1) {
							that.deviceIdList.push(result.devices[0])
						}
						console.log('result.devices[0].name:', result.devices[0].name)
						// }
					}
					// if (isnotexist && result.devices[0].name != '' && result.devices[0].name.indexOf('Minga') > -
					// 	1) {
					// 	that.deviceIdList.push(result.devices[0])
					// }
				} else if (result[0]) {
					if (result[0].advertisData) {
						result[0].advertisData = ab2hex(result[0].advertisData)
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

			uni.openBluetoothAdapter({
				success: (res) => {
					console.log('startBluetoothDevicesDiscovery')
					// 开始搜索蓝牙设备
					uni.startBluetoothDevicesDiscovery({
						services: [],
						success(res) {
							console.log('startBluetoothDevicesDiscovery success:', res)
							this.searching = true
						}
					})

					uni.getBluetoothAdapterState({
						success: (res) => {
							console.log('getBluetoothAdapterState success!', res)
						}
					})
					// //  50s扫描结束
					// setTimeout(function() {
					// 	that.stopBlueTooth()
					// }, 500000);
				},
				fail(res) {
					// if (res.errCode == 10001) {
					// 	uni.showToast({
					// 		duration: 3000,
					// 		title: '请打开蓝牙'
					// 	})
					// }
					uni.showModal({
						title: '提示',
						content: '请检查手机蓝牙是否打开',
						showCancel: false,
						success: (res) => {
							this.searching = false
						}
					})
				}
			})
		},
		data() {
			return {
				currentItem: {},
				onShowing: false, //页面是否显示
				show: false,
				success: false, //第一次握手成功
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				characteristicStringId: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', //write，string，rx；
				searching: false, // 搜索中
				deviceId: '', // 连接的蓝牙id
				serviceId: '', // 连接的服务id
				deviceIdList: [], // 检测列表
				// deviceIdList: [],
				connectList: [], // 连接列表
			}
		},
		methods: {
			handleMessage(res) {
				if (this.onShowing) {

				} else {
					console.log('[no showing]')
					return;
				}
				console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
				let arrayBuffer = new Uint8Array(res.value);
				console.log('接收到数据', ab2hex(res.value), arrayBuffer.length)
				// 如果收到数据是4个字节,虽然发的是8个字节，但是只有后4个字节有数据
				if (arrayBuffer.length == 4) {
					let receive16 = ab2hex(res.value);
					let last = '0x' + receive16
					let total = 0;
					Array.prototype.map.call(
						arrayBuffer,
						function(bit) {
							total += Number(bit.toString(10))
							return ('00' + bit.toString(16)).slice(-2)
						}
					)
					let shake1 = hand1Shake(Number(
						total), arrayBuffer)
					console.log("total:", total, shake1)
					if (this.success) {
						console.log('已经握手成功了!')


						// this.showAdjustHandler()
						return;
					}
					blue_class.getInstance().write2tooth(shake1)
					console.log('第一次握手', ab2hex(shake1))
				} else if (arrayBuffer.length == 2) {
					let receive16 = ab2hex(res.value);
					let mark = receive16.slice(2, 4)
					let len = receive16.slice(0, 2)
					console.log('接收到回复数据:', mark, len)
					if (mark == '55') {
						console.log('接收到回复数据', ab2hex(res.value))
						console.log('校验长度', parseInt('0x' + len))
						console.log('握手成功可以发送ssid了')
						this.success = true

						// 连接成功，跳转调整界面
						nextTick(() => {
							this.showAdjustHandler()
						})
						// blue_class.getInstance().write2tooth(this.characteristicStringId,
						// 	hexStringToArrayBuffer('jimlee'))
					} else if (mark == '66') {
						console.log('握手成功可以发送ssid密码了')
						// 发送wifi密码
						// blue_class.getInstance().write2tooth(this.characteristicStringId,
						// 	hexStringToArrayBuffer('lijiming'))
					} else if (mark == 'aa') {
						console.log('发送成功了ssid了')
					} else if (mark == '33') {
						console.log('收到成功调整枕头')
						console.log('8个字节指令的校验和', parseInt('0x' + len))
						console.log('后四位', receive16, receive16.slice(4, 1), receive16.slice(5, 1))
					}
				} else {
					let mark = arrayBuffer[0];
					let length = arrayBuffer[1];
					let arrayBuffer_order = new ArrayBuffer(length);
					let receive_dataView = new DataView(arrayBuffer_order);
					for (var index = 0; index < arrayBuffer_order.byteLength; index++) {
						receive_dataView.setUint8(index, arrayBuffer[index + 2])
					}
					console.log('handleMessage 接收到数据 mark:', parseInt(mark))
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
							this.parsePillowSleepData(arrayBuffer_order)
							break;
						case 6:
							this.parsePillowStatus(arrayBuffer_order)
							// this.parsePillowSleepData(null)
							break;
						case 88:
							break;
					}
					return;
					//默认是枕头状态 5s收到一次
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
					//保存版本号
					blue_class.getInstance().version = vesrion10;
					// let status1 = '0x' + status;

					console.log('枕头状态=>', status, headHeight, neckHeight, vesrion, isright, press)
					console.log('枕头状态=>', status10, headHeight10, neckHeight10, vesrion10, isright10, press10)
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
				let detail_status_16 = receive16.slice(2, 4);
				let detail_status = '0x' + detail_status_16;
				let n1 = (detail_status & 0x03);
				// 0--空闲，1--充电中，2--充电完成
				switch (n1) {
					case 0:
						console.log('枕头在空闲状态');
						break;
					case 1:
						console.log('枕头在充电中状态');
						break;
					case 2:
						console.log('枕头在充电完成状态');
						break;
				}
				let n2 = (detail_status >> 2) & 0x01;
				console.log('泵1电流:', n2);
				let n3 = (detail_status >> 3) & 0x01;
				console.log('泵2电流:', n3);
				let n4 = (detail_status >> 4) & 0x01;
				console.log('气囊1升高超时:', n4);
				let n5 = (detail_status >> 5) & 0x01;
				console.log('气囊2升高超时:', n5);
				let n6 = (detail_status >> 6) & 0x01;
				console.log('气囊1气压超高:', n6);
				let n7 = (detail_status >> 7) & 0x01;
				console.log('气囊2气压超高:', n7);
				let headHeight = receive16.slice(4, 6);
				let headHeight10 = parseInt('0x' + headHeight);
				let neckHeight = receive16.slice(6, 8);
				let neckHeight10 = parseInt('0x' + neckHeight);
				let vesrion = receive16.slice(8, 10);
				let vesrion10 = parseInt('0x' + vesrion);
				let isright = receive16.slice(10, 12);
				let isright10 = parseInt('0x' + isright);
				let press = receive16.slice(12, 16);
				let press10 = parseInt('0x' + press);


				// 0100970d030101f3
				// dataView.setUint32(0, second | (minutes << 6) | (hours << 12) | (days << 17) | (months << 22) | ((year -
				// 		2020) <<
				// 	26))

				// work 枕头状态 mm=> 1 height:151mm neckheight:13mm version:3 校准:1 电池:1
				// console.log('work 枕头状态 =>', 'height:' + headHeight, 'neckheight:' + neckHeight, vesrion, isright, press)
				console.log('work 枕头状态 mm=>', status10, 'height:' + headHeight10 + 'mm', 'neckheight:' + neckHeight10 +
					'mm', 'version:' +
					vesrion10,
					'校准:' + isright10,
					'电池:' + press10)
			},
			parsePillowSleepData(array_buffer) {

				blue_class.getInstance().write2tooth(appAnswer(5))
				//02123c2356123c2363
				// let temp = new ArrayBuffer(9)
				// let dataView2 = new DataView(temp);
				// dataView2.setUint8(8, 0x63)
				// dataView2.setUint8(7, 0x23)
				// dataView2.setUint8(6, 0x3c)
				// dataView2.setUint8(5, 0x12)
				// dataView2.setUint8(4, 0x56)
				// dataView2.setUint8(3, 0x23)
				// dataView2.setUint8(2, 0x3c)
				// dataView2.setUint8(1, 0x12)
				// dataView2.setUint8(0, 0x02)
				// console.log('姿态:', dataView2.getUint8(0));
				// let uint32_s = dataView2.getUint32(1);
				// let unit32_e = dataView2.getUint32(5);
				// // parseTime(uint32_s)
				// // 秒：0-5bit，分：6-11bit，时：12-16bit，日：17-21bit，月：22-25bit，年：26-31bit），年基于2020，月取值1-12
				// console.log('开始时间:', uint32_s, parseTime(uint32_s))
				// console.log('结束时间:', unit32_e, parseTime(unit32_e))
				// return;
				//解析枕头睡眠阶段状态	
				// 数据1-姿态（U8）(1--平躺，2--侧卧) + 数据2开始时间（T4）+数据3结束时间（T4）+ 数据4-姿态（U8）(1--平躺，2--侧卧) + 数据5开始时间（T4）+数据6结束时间（T4）+ ... ,关于该指令的说明，是多个姿态+开始时间和结束时间的条目的组合，根据数据长度计算一条指令中包含多少组数据
				let receive8 = new ArrayBuffer(array_buffer);
				let dataView = new DataView(receive8)
				console.log('姿态:', dataView.getUint8(0));
				let uint32_s = dataView.getUint32(1);
				let unit32_e = dataView.getUint32(5);
				// parseTime(uint32_s)
				// 秒：0-5bit，分：6-11bit，时：12-16bit，日：17-21bit，月：22-25bit，年：26-31bit），年基于2020，月取值1-12
				console.log('开始时间:', uint32_s, parseTime(uint32_s))
				console.log('结束时间:', unit32_e, parseTime(unit32_e))
				// let uint32_s = dataView.getUint32(1);
				// let unit32_e = dataView.getUint32(5);
				// // parseTime(uint32_s)
				// // 秒：0-5bit，分：6-11bit，时：12-16bit，日：17-21bit，月：22-25bit，年：26-31bit），年基于2020，月取值1-12
				// console.log('开始时间:', uint32_s, parseTime(uint32_s))
				// console.log('结束时间:', unit32_e, parseTime(unit32_e))
			},
			// ai识别
			autoHandler() {
				// let action = 0
				// // 如果选择的侧卧
				// let arraybuffer = handPillowFrontState(action, 0)
				// console.log('停止调高侧卧:', ab2hex(arraybuffer))

				// // console.log('调高:', ab2hex(arraybuffer))
				// blue_class.getInstance().write2tooth(arraybuffer)
				// return;
				this.closePopUpHandle()
				var url_ = '/page_subject/measure/measure' + object2Query({
					pillowName: '',
					deviceId: this.deviceId,
					serviceId: this.serviceId
				})
				console.log('url:', url_)
				uni.navigateTo({
					url: url_
				})
			},
			// 我的模式
			showModeHandler() {
				// let action = 2
				// // 如果选择的侧卧
				// let arraybuffer = handPillowFrontState(action, 0)
				// console.log('调高侧卧:', ab2hex(arraybuffer))

				// // console.log('调高:', ab2hex(arraybuffer))
				// blue_class.getInstance().write2tooth(arraybuffer)
				// return;
				this.closePopUpHandle()
				var url_ = '/page_subject/mode/mode' + object2Query({
					pillowName: '自定义模式',
					deviceId: this.deviceId,
					serviceId: this.serviceId
				})
				console.log('url:', url_)
				uni.navigateTo({
					url: url_
				})
			},
			// 跳转手动调整
			showAdjustHandler() {
				// let arraybuffer = changeAdjustMode()
				// blue_class.getInstance().write2tooth(arraybuffer)
				// return;
				this.closePopUpHandle()
				var url_ = '/page_subject/adjust/adjust' + object2Query({
					pillowName: this.currentItem.name,
					deviceId: this.deviceId,
					serviceId: this.serviceId
				})
				console.log('url:', url_)
				uni.navigateTo({
					url: url_
				})
			},
			// 调低枕头
			adjustLowSleepHandler() {
				this.head -= 1
				if (this.head <= 0) {
					this.head = 0
				}
				console.log('调低:', this.head, this.neck)
				let arraybuffer = handPillowFrontState(this.head, this
					.neck)
				console.log('调低:', ab2hex(arraybuffer))
				write2tooth(this.deviceId, this.serviceId, this.characteristicId, arraybuffer)
			},
			// 调高枕头
			adjustHighSleepHandler() {
				this.head += 1
				if (this.head >= 100) {
					this.head = 100
				}
				console.log('调高:', this.head, this.neck)
				let arraybuffer = handPillowFrontState(this.head, this
					.neck)
				console.log('调高:', ab2hex(arraybuffer))
				write2tooth(this.deviceId, this.serviceId, this.characteristicId, arraybuffer)
			},
			closePopUpHandle() {
				this.$refs.ppp.close()
			},
			// 停止蓝牙
			stopBlueTooth() {
				uni.stopBluetoothDevicesDiscovery({
					success: (res) => {
						console.log("stopBlueTooth success!")
						this.searching = false
					},
					fail: (res) => {
						console.log("stopBlueTooth fail!")
					}
				})
				// uni.closeBluetoothAdapter({
				// 	success() {
				// 		console.log('closeBluetoothAdapter success!')
				// 	}
				// })
			},

			reconnect() {
				uni.openBluetoothAdapter({
					success: (res) => {
						console.log('startBluetoothDevicesDiscovery')
						// 开始搜索蓝牙设备
						uni.startBluetoothDevicesDiscovery({
							services: [],
							success(res) {
								console.log('startBluetoothDevicesDiscovery success:', res)
								this.searching = true
							}
						})

						uni.getBluetoothAdapterState({
							success: (res) => {
								console.log('getBluetoothAdapterState success!', res)
							}
						})
						// //  50s扫描结束
						// setTimeout(function() {
						// 	that.stopBlueTooth()
						// }, 500000);
					},
					fail(res) {
						// if (res.errCode == 10001) {
						// 	uni.showToast({
						// 		duration: 3000,
						// 		title: '请打开蓝牙'
						// 	})
						// }
						uni.showModal({
							title: '提示',
							content: '请检查手机蓝牙是否打开',
							showCancel: false,
							success: (res) => {
								this.searching = false
							}
						})
					}
				})
			},
			// 连接蓝牙
			connectBlueToothSleepHandler(item) {
				uni.showLoading({
					title: '连接蓝牙设备中...',
				})


				let app = getApp();
				let deviceId = item.deviceId;
				uni.createBLEConnection({
					// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
					deviceId: deviceId,
					success: (res) => {
						wx.showToast({
							title: '连接成功',
							icon: 'success',
							duration: 1000
						})
						this.stopBlueTooth();
						app.globalData.deviceId = deviceId;

						blue_class.getInstance().deviceId = deviceId;


						console.log('connectBluetooth success!:', deviceId, res)


						uni.getBLEDeviceServices({
							deviceId,
							success: (res) => {
								console.log('getBLEDeviceServices success:', res)
								console.log('getBLEDeviceServices res.services:', res
									.services)
								for (let i = 0; i < res.services.length; i++) {
									if (res.services[i].isPrimary) {
										// this.addNotify(deviceId, res.services[i]
										// 	.uuid, '6E400003-B5A3-F393-E0A9-E50E24DCCA9E')
										this.getBLEDeviceCharacteristics(deviceId, res
											.services[i]
											.uuid)
										//这里只取第一个哈！！！！！！！！
										break;
										// 可根据具体业务需要，选择一个主服务进行通信
									}
								}

							},
							fail: (res) => {
								console.log('getBLEDeviceServices fail:', res)
							}
						})
					},
					fail: (res) => {
						console.log("connectBluetooth fail: ", res)
					},
					complete: () => {
						uni.hideLoading()
					}
				})
			},
			// 获取蓝牙设备某个服务中所有特征值(characteristic)。
			getBLEDeviceCharacteristics(deviceId, serviceId) {
				let that = this
				// serviceId = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
				console.log('getBLEDeviceCharacteristics123:', deviceId, serviceId)
				uni.getBLEDeviceCharacteristics({
					deviceId: deviceId,
					serviceId: serviceId,
					success: (res) => {
						console.log("%c getBLEDeviceCharacteristics success", "color:red;", res
							.characteristics);
						let notify_character = ''
						if (res.characteristics[1]) {
							// 启用notify
							notify_character = res.characteristics[1].uuid
							blue_class.getInstance().startNotice({
								deviceUUID: deviceId,
								serviceUUID: serviceId,
								notifyUUID: notify_character
							})
							// uni.notifyBLECharacteristicValueChange({
							// 	state: true,
							// 	deviceId: deviceId,
							// 	serviceId: serviceId,
							// 	characteristicId: notify_character,
							// 	success: (res) => {
							// 		that.deviceId = deviceId
							// 		that.serviceId = serviceId;
							// 		let app = getApp();
							// 		app.globalData.serviceId = serviceId;
							// 		console.log('启用notify成功：', deviceId, serviceId,
							// 			notify_character)
							// 	}
							// })
						}
					},
					fail: (res) => {
						console.log("%c getBLEDeviceCharacteristics fail", "color:red;", res);
					}
				})
			},
			// wifi界面
			connectWifiSleepHandler(item) {
				let url = '/pages/initWifi/initWifi' + '?pillowName=' + item.name
				uni.navigateTo({
					url: url
				})
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
			// 连接枕头
			connectSleepHandler(item) {
				console.log('this', this.$refs)
				this.$refs.ppp.open('bottom')
				this.show = true
				this.currentItem = item;
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
		padding-top: 100rpx;
	}

	.header {
		height: 80rpx;
	}

	.tips {
		text-align: center;
		color: #5B7897;
		font-size: 32rpx;
		padding: 20rpx;
	}

	.spetips {
		text-align: left;
		font-size: 32rpx;
		padding: 30rpx;
		position: absolute;
		left: 0;
		right: 0;
		background-color: #ffffff;
		box-shadow: 0rpx 0rpx 20rpx #5B7897;
		border-top-left-radius: 15rpx;
		border-top-right-radius: 15rpx;
		bottom: 0;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);

		.item {
			line-height: 32rpx;
			padding: 5rpx;
			letter-spacing: 1rpx;
			padding-bottom: 20rpx;
		}

		.iconblue {
			width: 30rpx;
			padding: 5rpx;
			margin-right: 10rpx;
		}

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
			line-height: 38rpx;
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
			// margin-right: 30rpx;

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

	.uni-popup__wrapper-box {

		display: block;

		position: relative;
		/* iphonex 等安全区设置，底部安全区适配 */

		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);

	}


	.container {
		background-color: white;
		border-radius: 50rpx 50rpx 0rpx 0rpx;
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