<template>
	<view class="main" v-if="hasLogin">
		<view class="bg" :style="menuInfo">
			<image mode="widthFix" class="backimg" src="../../static/index/SY_00A_001.jpg"></image>
			<view class="logoleft">
				<image mode="widthFix" src="../../static/index/SY_00A_LOGO01.png"></image>
			</view>
			<view class="rightBatteryInfo" :style="menuInfo">
				<view class="fillprogress" :style="menuInfo"></view>
				<image class="icon" mode="widthFix" src="../../static/index/SY_00A_IconDLa.png"></image>
				<image class="icon" v-if="pillowPowerCharging==1" mode="widthFix"
					src="../../static/index/SY_00A_IconDLaing.png"></image>
				<image class="icon" v-if="pillowPowerCharging==2" mode="widthFix"
					src="../../static/index/SY_00A_IconDLaing.png"></image>
				<label class="batedesc" for="">{{getPillowPower}}%</label>
			</view>
			<view class="rightInfo" :style="menuInfo">
				<image class="icon" mode="widthFix" src="../../static/index/SY_00A_IconCW.png"></image>
				<label class="desc" for="">{{pillowStatusDesc}}</label>
			</view>
			<view class="headInfo" :style="menuInfo">
				<view>颈枕高度</view>
				<view>{{pillowSideHeight}}mm</view>
			</view>
			<view class="neckInfo" :style="menuInfo">
				<view>头枕高度</view>
				<view>{{pillowHeight}}mm</view>
			</view>
			<view class="">
				<view v-for="(item,index) in deviceIdList" :key="index">
					{{item.name}}
					<button @click="connectSleepHandler(item)">{{item.deviceId == connectDeviceId ?'已连接':'连接'}}</button>
				</view>
			</view>
		</view>
		<view class="">
			<view class="status-part flex">
				<view class="item" @click="adjustHandler()">
					<image class="item-back" src="../../static/index/SY_00A_buttonA.png" mode="widthFix"></image>
					<label class="title" for="">连接状况</label>
					<image class="icon1" src="../../static/index/SY_00A_IconLJ.png" mode="widthFix"></image>
					<label class="desc" for="">{{login?'已连接':'未连接'}}</label>
				</view>
				<view class="item" @click="aiHandler()">
					<image class="item-back" src="../../static/index/SY_00A_buttonA.png" mode="widthFix"></image>
					<label class="title" for="">AI检测</label>
					<image class="icon2" src="../../static/index/SY_00A_IconAI.png" mode="widthFix"></image>
					<!-- <label class="desc" for="">未连接</label> -->
				</view>
				<view class="item" @click="hotHandler()">
					<image class="item-back" src="../../static/index/SY_00A_buttonA.png" mode="widthFix"></image>
					<label class="title" for="">模式选择</label>
					<image class="icon3" src="../../static/index/SY_00A_IconRFa.png" mode="widthFix"></image>
					<!-- <label class="desc" for="">未开启</label> -->
				</view>
				<view class="item" @click="statusCheck()">
					<image class="item-back" src="../../static/index/SY_00A_buttonA.png" mode="widthFix"></image>
					<label class="title" for="">睡姿学习</label>
					<image class="icon4" src="../../static/index/SY_00A_IconJZWT1.png" mode="widthFix"></image>
					<!-- <label class="desc" for="">仰卧中</label> -->
				</view>
				<view class="item" @click="spineCheck()">
					<image class="item-back" src="../../static/index/SY_00A_buttonA.png" mode="widthFix"></image>
					<label class="title" for="">脊柱微调</label>
					<image class="icon4" src="../../static/index/SY_00A_IconJZWT.png" mode="widthFix"></image>
					<!-- <label class="desc" for="">仰卧中</label> -->
				</view>
			</view>
		</view>
		<uni-popup ref="ppp" style="z-index: 10000; position: absolute;" border-radius="40rpx 40rpx 0rpx 0rpx"
			background-color='white' safe-area="false" class="popup" :mask-click="false" @change="change">
			<view class="popupcontainer">
				<image class="close-btn" @click="closePopUpHandle" :src="'../../static/adjust/SY_05_buttonCOLa.png'"
					mode="widthFix">
				</image>
				<image class="tip" src="@/static/adjust/SY_05_B001.png" mode="widthFix"></image>
				<view class="touch">
					<view class="item" @click="showMineHandler">
						<label>我的数据</label>
					</view>
					<view class="item" @click="showDefaultHandler">
						<label>默认数据</label>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	// import getBehavior from '../../utils/behavior'
	// import yuvBehavior from '../../utils/yuvBehavior'

	// 引入文件夹
	import {
		createScopedThreejs
	} from 'threejs-miniprogram'
	import {
		nextTick
	} from 'vue';
	import blue_class from '../../utils/BlueManager';
	import {
		getappVersion
	} from '../../utils/miniapp';
	import base from '@/utils/baseUrl';
	export default {
		computed: {
			pillowStatusDesc() {
				if (this.loginStatus) {

					if (this.pillowStatus == 0) {
						return '空闲'
					} else if (this.pillowStatus == 1) {
						return '平躺中'
					} else if (this.pillowStatus == 2) {
						return '侧卧中'
					}
				} else {
					return '未连接'
				}
			},
			login() {
				return this.loginStatus;
			},
			pillowHeight() {
				return pillowHeight;
			},
			pillowSideHeight() {
				return this.pillowSideHeight;
			},
			getPillowPower() {
				return Math.floor((this.pillowPower * 100) / 100) / 10
			}
		},
		watch: {

		},
		data() {
			return {
				menuInfo: {
					'--menuButtonTop': '30px'
				},
				hasLogin: true,
				hotLast: 0, // 热敷持续时间
				show: false,
				imgData: '',
				session: '',
				bodyImgUrl: '',
				bodyImgWidth: 0,
				bodyImgHeight: 0,
				bodyImgOriginWidth: 0,
				bodyImgOriginHeight: 0,
				deviceId: '', // 设备蓝牙id
				connectDeviceId: 'deviceId', // 链接上的蓝牙设备id
				serviceId: '', // 通知uuid
				writeServicweId: '', //写uuid
				readServicweId: '', //通知uuid
				msg: '',
				receiveInfo: '',
				deviceIdList: [], //
				searching: false, // 搜索中
				characteristicId: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E', //特征值
				loginStatus: false,
				pillowHeight: 80,
				pillowSideHeight: 1,
				pillowPower: 1,
				pillowStatus: 0,
				pillowPowerCharging: 0, // 充电状态
			}
		},
		// behaviors: [getBehavior(), yuvBehavior],
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 0,
					onshow: true
				});
			}

			uni.$on('update_pillow_info', this.updateInfo);
			this.updateInfo()

			let app = getApp();
			this.$set(this.menuInfo, '--menuButtonTop', (app.globalData.top + 120) + 'px');
			this.$set(this.menuInfo, '--menuButtonTop1', (app.globalData.top + 12) + 'px');
			this.$set(this.menuInfo, '--menuHead', (app.globalData.top + 332) + 'px');
			this.$set(this.menuInfo, '--menuNeck', (app.globalData.top + 362) + 'px');

			console.log('menui:', (app.globalData.top + 120) + 'px', this.menuInfo)

			// this.$set(this, 'pillowHeight', blue_class.getInstance().pillowHeight);
			// this.$set(this, 'pillowSideHeight', blue_class.getInstance().pillowSideHeight);
			// this.$set(this, 'pillowPower', blue_class.getInstance().pillowPower);
			// console.log('menui11111:', this.pillowHeight)
			// console.log('menui1111122:', this.pillowSideHeight)
			// console.log('menui1111122333:', this.pillowPower)

			this.loginStatus = blue_class.getInstance().loginSuccess;
			// this.pillowHeight = blue_class.getInstance().pillowHeight
			// this.pillowSideHeight = blue_class.getInstance().pillowSideHeight
			// this.pillowPower = blue_class.getInstance().getPillowPower()
			// console.log('createScopedThreejs:', createScopedThreejs)

			// // 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
			// uni.onBLECharacteristicValueChange((res) => {
			// 	console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
			// 	let arrayBuffer = new Uint8Array(res.value);
			// 	console.log('接收到数据', this.ab2hex(res.value), arrayBuffer.length)
			// 	// 如果收到数据是4个字节,虽然发的是8个字节，但是只有后4个字节有数据
			// 	if (arrayBuffer.length == 4) {
			// 		let receive16 = this.ab2hex(res.value);
			// 		let last = '0x' + receive16
			// 		let total = 0
			// 		Array.prototype.map.call(
			// 			arrayBuffer,
			// 			function(bit) {
			// 				total += Number(bit.toString(10))
			// 				return ('00' + bit.toString(16)).slice(-2)
			// 			}
			// 		)
			// 		let shake1 = this.hand1Shake(Number(
			// 			total), arrayBuffer)


			// 		// let dataView = new DataView(shake1)
			// 		// let u1 = dataView.getUint8(0)
			// 		// let u2 = dataView.getUint8(1)
			// 		// let u3 = dataView.getUint8(2)
			// 		// let u4 = dataView.getUint8(3)
			// 		// let u5 = dataView.getUint8(4)
			// 		// let u6 = dataView.getUint8(5)
			// 		// let u7 = dataView.getUint8(6)
			// 		// let u8 = dataView.getUint8(7)
			// 		// let flow = u1.toString(2) + u2.toString(2) + u3.toString(2) + u4.toString(2) + u5.toString(2) +
			// 		// 	u6.toString(2) + u7.toString(2) + u8.toString(2)

			// 		// console.log('flowflowflow1:', u1.toString(2))
			// 		// console.log('flowflowflow2:', u2.toString(2))
			// 		// console.log('flowflowflow3:', u3.toString(2))
			// 		// console.log('flowflowflow4:', u4.toString(2))
			// 		// console.log('flowflowflow5:', u5.toString(2))
			// 		// console.log('flowflowflow6:', u6.toString(2))
			// 		// console.log('flowflowflow7:', u7.toString(2))
			// 		// console.log('flowflowflow8:', u8.toString(2))
			// 		console.log("total:", total)
			// 		this.write2tooth(this.deviceId, this.serviceId, this.characteristicId, shake1)
			// 		console.log('第一次握手', this.ab2hex(shake1))
			// 	} else if (arrayBuffer.length == 2) {
			// 		let receive16 = this.ab2hex(res.value);
			// 		let mark = receive16.slice(2, 4)
			// 		let len = receive16.slice(0, 2)
			// 		console.log('接收到回复数据123', mark, len)
			// 		if (mark == '55') {
			// 			console.log('接收到回复数据', this.ab2hex(res.value))
			// 			console.log('校验长度', parseInt('0x' + len))
			// 		}
			// 	}
			// })

			getappVersion({
				appId: base.publicAppId
			}).then(res => {
				console.log('aba', res)
				app.globalData.versionCode = res.versionCode;
			})
		},
		onHide() {
			let that = this
			that.deviceIdList = [];
			if (this.searching) {
				uni.stopBluetoothDevicesDiscovery({
					success: function(res) {
						that.searching = false
					}
				})
			}

			uni.$off('update_pillow_info', this.updateInfo);
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
					console.log('devices.devices:', result.devices[0])
					for (var i = 0; i < that.deviceIdList.length; i++) {
						if (result.devices[0].deviceId == that.deviceIdList[i].deviceId) {
							isnotexist = false
						}
					}
					if (isnotexist && result.devices[0].name != '') {
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
					if (isnotexist && result[0].name != '') {
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
				// console.log(this.ab2hex(devices[0].advertisData))
				// this.stopBlueTooth()
				// if (devices.length > 0 && first_device.connectable) {
				// 	console.log("connectable :", first_device, first_device.connectable)
				// 	that.deviceId = first_device.deviceId
				// 	if (this.deviceId.indexOf('F61EAC') > -1) {
				// 		that.connectBluetooth(that.deviceId)
				// 	}
				// } else {
				// 	console.log("disconnectable :", first_device.deviceId)
				// }
			})
		},
		onShareAppMessage() {


		},

		methods: {
			updateInfo() {
				this.$set(this, 'pillowHeight', blue_class.getInstance().pillowHeight);
				this.$set(this, 'pillowSideHeight', blue_class.getInstance().pillowSideHeight);
				this.$set(this, 'pillowPower', blue_class.getInstance().pillowPower);
				this.$set(this, 'pillowPowerCharging', blue_class.getInstance().chargingStatus);
				this.$set(this, 'pillowStatus', blue_class.getInstance().pillowStatus);

				this.$set(this.menuInfo, '--bateryWidth', (blue_class.getInstance().pillowPower * 50 / 1000) + 'rpx');

				console.log('menui11111:', this.pillowHeight)
				console.log('menui1111122:', this.pillowSideHeight)
				console.log('menui1111122333:', this.pillowPower)
				console.log('--bateryWidth:', (blue_class.getInstance().pillowPower * 50 / 1000) + 'rpx')
			},
			aiHandler() {
				uni.navigateTo({
					url: "/page_subject/measure/measure"
				})
			},

			closePopUpHandle() {
				this.$refs.ppp.close()
			},
			// 默认数据
			showDefaultHandler() {
				this.closePopUpHandle()
				uni.navigateTo({
					url: "/page_subject/mode/mode"
				})
			},
			// my数据
			showMineHandler() {
				this.closePopUpHandle()
				uni.navigateTo({
					url: "/page_subject/mode/setMode"
				})
			},
			adjustHandler(item) {
				this.connectHandler()
			},
			spineCheck() {
				// uni.showToast({
				// 	title: "暂未开放!"
				// })

				// return;
				uni.navigateTo({
					url: "/page_subject/ano/ano"
				})
			},

			statusCheck() {
				uni.navigateTo({
					url: "/page_subject/study/study"
				})
				return;
				uni.navigateTo({
					url: "/page_subject/ano/ano"
				})
			},
			hotHandler() {
				this.$refs.ppp.open('bottom')
			},
			change(e) {

			},
			// 开始拍照
			startCamera() {
				uni.navigateTo({
					url: '/pages/camera/camera'
				})
			},
			base64({
				url
			}) {
				return new Promise((resolve, reject) => {
					console.log('url:', url)
					wx.getFileSystemManager().readFile({
						filePath: url, //选择图片返回的相对路径
						encoding: 'base64', //编码格式
						success: res => {
							resolve(res.data)
							// resolve('data:image/' + type.toLocaleLowerCase() + ';base64,' + res.data)
						},
						fail: res => reject(res.errMsg)
					})
				})
			},
			urlTobase64(url) {
				console.log('urlTobase641')
				return new Promise(function(resolve, reject) {
					console.log('urlTobase6421111')
					uni.request({
						url: url,
						responseType: 'arraybuffer', //最关键的参数，设置返回的数据格式为arraybuffer
						// responseType: 'text', //最关键的参数，设置返回的数据格式为arraybuffer
						success: (res) => {
							console.log('urlTobase642')
							//把arraybuffer转成base64
							let base64 = wx.arrayBufferToBase64(res.data);
							// let base65 = String.fromCharCode.apply(null, new Uint16Array(res.data));
							// ArrayBuffer转为字符串，参数为ArrayBuffer对象
							//不加上这串字符，在页面无法显示的哦
							let base64_new = 'data:image/jpeg;base64,' + base64;
							//打印出base64字符串，可复制到网页校验一下是否是你选择的原图片呢
							console.log(base64);
							resolve(base64)
						},
						fail: (error) => {
							console.log('err:', error)
						}
					})
				})
			},
			// ArrayBuffer转16进度字符串示例
			ab2hex(buffer) {
				const hexArr = Array.prototype.map.call(
					new Uint8Array(buffer),
					function(bit) {
						return ('00' + bit.toString(16)).slice(-2)
					}
				)
				return hexArr.join('')
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
			// 主动点击连接枕头
			connectSleepHandler(item) {
				uni.showLoading({
					title: '连接蓝牙设备中...',
				})
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
						this.stopBlueTooth()

						console.log('connectBluetooth success!:', deviceId, res)
						uni.getBLEDeviceServices({
							deviceId,
							success: (res) => {
								console.log('getBLEDeviceServices success:', res)
								for (let i = 0; i < res.services.length; i++) {
									if (res.services[i].isPrimary) {
										this.getBLEDeviceCharacteristics(deviceId, res.services[i]
											.uuid)
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
				console.log('getBLEDeviceCharacteristics:', deviceId, serviceId)
				uni.getBLEDeviceCharacteristics({
					deviceId: deviceId,
					serviceId: serviceId,
					success: (res) => {
						console.log("%c getBLEDeviceCharacteristics success", "color:red;", res
							.characteristics);
						// for (var i = 0; i < res.characteristics.length; i++) {
						// 	// console.log('特征值：' + res.characteristics[i].uuid)
						// 	if (res.characteristics[i].properties.notify) {
						// 		console.log("notifyServicweId：", serviceId);
						// 		console.log("notifyCharacteristicsId：", res.characteristics[i].uuid);
						// 		this.notifyServicweId = serviceId
						// 	}
						// 	if (res.characteristics[i].properties.write) {
						// 		console.log("writeServicweId：", serviceId);
						// 		console.log("writeCharacteristicsId：", res.characteristics[i].uuid);
						// 		this.writeBLECharacteristicValue = serviceId;
						// 	}
						// }

						uni.notifyBLECharacteristicValueChange({
							state: true,
							deviceId: deviceId,
							serviceId: serviceId,
							characteristicId: res.characteristics[0].uuid,
							success: (res) => {

								that.deviceId = deviceId
								that.serviceId = serviceId
								// this.characteristicId = res.characteristics[0].uuid
								console.log('启用notify成功')
							}
						})
						// console.log('device getBLEDeviceCharacteristics:', res.characteristics);
						// this.msg = JSON.stringify(res.characteristics)
						// var notifyServicweId = this.notifyServicweId; //具有写、通知属性的服务uuid
						// var notifyCharacteristicsId = this.characteristicId;
						// this.notifyBluetooth(this.deviceId, notifyServicweId, notifyCharacteristicsId)
					},
					fail: (res) => {
						console.log("%c getBLEDeviceCharacteristics fail", "color:red;", res);
					}
				})
			},
			// 开始监听
			notifyBluetooth(deviceId, serviceId, characteristicId) {
				// 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。注意：必须设备的特征值支持 notify 或者 indicate 才可以成功调用。 另外，必须先启用 notifyBLECharacteristicValueChange 才能监听到设备 characteristicValueChange 事件
				console.log("%c notifyBluetooth start", "color:red;", deviceId, serviceId);
				uni.notifyBLECharacteristicValueChange({
					deviceId: deviceId,
					state: true,
					serviceId: serviceId,
					characteristicId: characteristicId,
					success: (res) => {
						var msg = '启动notify:' + res.errMsg
						this.receiveInfo = msg;
						console.log('notifyBLECharacteristicValueChange success', res)
					},
					fail: (res) => {
						console.log('notifyBLECharacteristicValueChange fail', res)
					}
				})


			},
			write2tooth(deviceId, serviceId, characteristicId, buffer) {
				// 向蓝牙设备发送一个0x00的16进制数据
				uni.writeBLECharacteristicValue({
					// 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
					deviceId,
					// 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
					serviceId,
					// 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
					characteristicId,
					// 这里的value是ArrayBuffer类型
					value: buffer,
					writeType: 'write',
					success(res) {
						console.log('writeBLECharacteristicValue success', res)
					}
				})
			},
			// 生成第一步握手数据
			hand1Shake(checkNum, arrayUnit8Buffer_) {
				// 向蓝牙设备发送一个0x00的2进制数据

				let littleEdition = true
				const buffer = new ArrayBuffer(8)
				const dataView = new DataView(buffer)
				dataView.setUint8(0, 0)
				dataView.setUint8(1, checkNum)
				dataView.setUint8(2, arrayUnit8Buffer_[0])
				dataView.setUint8(3, arrayUnit8Buffer_[1])
				dataView.setUint8(4, arrayUnit8Buffer_[2])
				dataView.setUint8(5, arrayUnit8Buffer_[3])
				dataView.setUint8(6, 0)
				dataView.setUint8(7, 0)

				// dataView.setUint8(7, 0)
				// dataView.setUint8(6, checkNum)
				// dataView.setUint8(5, arrayUnit8Buffer_[3])
				// dataView.setUint8(4, arrayUnit8Buffer_[2])
				// dataView.setUint8(3, arrayUnit8Buffer_[1])
				// dataView.setUint8(2, arrayUnit8Buffer_[0])
				// dataView.setUint8(1, 0)
				// dataView.setUint8(0, 0)
				return buffer
			},
			connectHandler() {
				uni.navigateTo({
					url: '/page_subject/work/work'
				})
				return
				let that = this;
				// 监听设备变化
				uni.onBLEConnectionStateChange((res) => {
					// 该方法回调中可以用于处理连接意外断开等异常情况
					uni.showToast({
						title: ` ${res.deviceId} state has changed`
					})
					console.log(
						`onBLEConnectionStateChange device ${res.deviceId} state has changed, connected: ${res.connected}`
					)
				})
				// 如果正在搜索中
				if (this.searching) {
					uni.closeBluetoothAdapter({
						complete: () => {

						}
					})
				}

				// uni.closeBLEConnection({
				// 	deviceId: this.deviceId
				// })
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

				uni.onBluetoothAdapterStateChange(function(res) {
					console.log('adapterState changed, now is', res)
				})
				return;
				uni.navigateTo({
					url: '/page_subject/work/work'
				})
			},
			onBluetoothDeviceFound() {

			},
			async detecting(tempFilePaths) {
				let base64 = await this.base64({
					url: tempFilePaths[0]
				});
				const uploadTask = uni.uploadFile({
					url: 'https://dev.ic1101.top/new_battle/zhBaiduAip',
					filePath: tempFilePaths[0],
					name: 'file',
					formData: {
						'fileName': base64,
						'user': 'test',
					},
					success: (uploadFileRes) => {
						let obj = JSON.parse(uploadFileRes.data)
						console.log('success', obj)
						let person = obj.person_info[0]
						let body_parts = person.body_parts
						let left_shoulder = body_parts.left_shoulder
						let right_shoulder = body_parts.right_shoulder
						let leftShoulder = left_shoulder.x;
						let rightShoulder = right_shoulder.x;

						let space = Math.abs(rightShoulder - leftShoulder);
						space = space / this.bodyImgOriginWidth
						space = space.toFixed(2)
						uni.showToast({
							title: '肩宽约:' + space + 'm',
							icon: 'none', //如果要纯文本，不要icon，将值设为'none'
							duration: 5000 //持续时间为 2秒
						})

					},
					fail: () => {
						console.log('fail')
					}
				})
			},
			chooseMedia() {
				if (!this.session) {
					this.session = wx.createVKSession({
						track: {
							body: {
								mode: 1
							} // mode: 1 - 使用摄像头；2 - 手动传入图像
						},
						version: 'v2',
					})


					// 静态图片检测模式下，每调一次 detectBody 接口就会触发一次 updateAnchors 事件
					this.session.on('updateAnchors', anchors => {
						// console.log('anchors:', anchors)
						anchors.forEach(anchor => {

							console.log('anchor.points', anchor.points)

							console.log('anchor.origin', anchor.origin)

							console.log('anchor.size', anchor.size)

							console.log('anchor.angle', anchor.angle)

						})
						// this.anchor2DList = anchors.map(anchor => {
						// 	points: anchor.points, // 关键点坐标
						// 	origin: anchor.origin, // 识别框起始点坐标
						// 	size: anchor.size // 识别框的大小
						// })
					})
				}

				// this.session.start(errno => {
				// 	if (errno) {
				// 		console.log('errno', errno)
				// 		// 如果失败，将返回 errno
				// 	} else {
				// 		// this.session.detectBody({
				// 		// 	frameBuffer: this.imgData.data.buffer,
				// 		// 	width: this.bodyImgOriginWidth,
				// 		// 	height: this.bodyImgOriginHeight,
				// 		// 	scoreThreshold: 0.1, // 评分阈值
				// 		// 	sourceType: 1
				// 		// })
				// 	}
				// })
				// return
				wx.chooseMedia({
					count: 1,
					mediaType: ['image'],
					success: res => {
						console.log('chooseMedia res', res)
						const imgUrl = res.tempFiles[0].tempFilePath
						wx.getImageInfo({
							src: imgUrl,
							success: res => {
								const fixWidth = 300
								const {
									width,
									height
								} = res
								console.log('getImageInfo res', res)
								this.bodyImgUrl = imgUrl;
								console.log('bodyImgUrl', this.bodyImgUrl)
								this.bodyImgWidth = fixWidth;
								this.bodyImgHeight = (fixWidth / width) * height;
								this.bodyImgOriginWidth = width;
								this.bodyImgOriginHeight = height;
							},
							fail: res => {
								console.error(res)
							}
						})

					},
					fail: res => {
						console.error(res)
					}
				})
			},
			async detectbody() {
				if (this.bodyImgUrl) {
					const canvas = wx.createOffscreenCanvas({
						type: '2d',
						width: this.bodyImgOriginWidth,
						height: this.bodyImgOriginHeight,
					})
					const context = canvas.getContext('2d')
					const img = canvas.createImage()
					await new Promise(resolve => {
						img.onload = resolve
						img.src = this.bodyImgUrl
					})

					context.clearRect(0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight)
					context.drawImage(img, 0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight)

					this.imgData = context.getImageData(0, 0, this.bodyImgOriginWidth, this
						.bodyImgOriginHeight)

					console.log('[frameBuffer] --> ', this.imgData.data.buffer)
					console.log('this.session.detectBody', this.session.detectBody)
					console.log('width', this.bodyImgOriginWidth)
					console.log('height', this.bodyImgOriginHeight)


					this.session.start(errno => {
						if (errno) {
							console.log('errno', errno)
							// 如果失败，将返回 errno
						} else {
							this.session.detectBody({
								frameBuffer: this.imgData.data.buffer,
								width: this.bodyImgOriginWidth,
								height: this.bodyImgOriginHeight,
								scoreThreshold: 0.1, // 评分阈值
								sourceType: 1
							})
						}
					})
				}
			},
		}
	}
</script>

<style lang="scss">
	.main {
		width: 100%;
		height: 100%;
		background-color: #0b2853;

		.logoleft {
			position: absolute;
			left: 88rpx;
			top: 130rpx;
			width: 161rpx;
			height: 131rpx;

			image {
				width: 100%;
			}
		}
	}

	.bg {
		position: relative;
		background-color: #0b2853;
		left: 0;
		top: var(--menuButtonTop1);
		right: 0;
		bottom: 0;

		.backimg {
			width: 100%;
			height: 100%;
			object-fit: cover;
			// display: block;
		}
	}



	.logo {
		width: 256rpx;
		height: 101rpx;
		margin: 0 auto;
		margin-top: -450rpx;
	}

	.logo image {
		width: 100%;
		height: 100%;
	}

	.logoTip {
		width: 450rpx;
		height: 45rpx;
		margin: 0 auto;
		margin-top: -200rpx;
	}

	.logoTip image {
		width: 100%;
		height: 100%;
	}

	.headInfo {
		position: absolute;
		top: 680rpx;
		left: 45rpx;
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #a79f8a;
		border-radius: 20rpx;
		width: 300rpx;
		height: 68rpx;
	}

	.neckInfo {
		position: absolute;
		top: 745rpx;
		right: 45rpx;
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #a79f8a;
		border-radius: 20rpx;
		width: 300rpx;
		height: 68rpx;
	}

	.rightInfo {
		position: absolute;
		top: 270rpx;
		left: 508rpx;
		color: white;
		display: flex;
		justify-content: center;

		.icon {
			width: 61rpx;
			margin-right: 20rpx;
		}
	}

	.rightBatteryInfo {
		position: absolute;
		top: 166rpx;
		left: 508rpx;
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;

		.icon {
			position: absolute;
			width: 61rpx;
			left: 10rpx;
			margin-left: 2rpx;
			top: 5rpx;
			// margin-right: 20rpx;
		}


		.batedesc {
			position: absolute;
			left: 90rpx;
			top: 0rpx;
		}


		.fillprogress {
			position: absolute;
			width: 50rpx;
			height: 30rpx;
			top: 5rpx;
			left: 13rpx;
			width: var(--bateryWidth);
			background-color: green;
		}
	}

	.connectBtn {
		width: 727rpx;
		height: 188rpx;
		margin: 0 auto;
		margin-top: -0rpx;
	}

	.connectBtn image {
		width: 100%;
		height: 100%;
	}

	.rotateimgblock {
		margin-top: -50rpx;
		width: 750rpx;
		height: 494rpx;
	}

	.rotateimg {
		width: 100%;
		height: 100%;
	}




	.status-part {
		margin-bottom: env(safe-area-inset-bottom);
		// padding-top: 200rpx;
		justify-content: space-around;
		position: absolute;
		bottom: 200rpx;
		left: 0rpx;
		right: 0rpx;

		.item {
			position: relative;
			display: flex;
			justify-content: center;
			align-items: center;

			.item-back {
				width: 127rpx;
				height: 161rpx;
			}

			.title {
				position: absolute;
				left: 0;
				top: 0;
				width: 100%;
				color: white;
				font-size: 26rpx;
				text-align: center;
				line-height: 60rpx;
			}

			.desc {
				position: absolute;
				left: 0;
				bottom: 0rpx;
				width: 100%;
				color: white;
				text-align: center;
				line-height: 40rpx;
				font-size: 29rpx;
				color: #5B7897;
			}

			.icon1 {
				position: absolute;
				left: 50%;
				top: 45%;
				margin-left: -25rpx;
				// margin-top: -50%;
				width: 41rpx;
				height: 42rpx;
				z-index: 100;
			}

			.icon2 {
				position: absolute;
				left: 50%;
				top: 47%;
				margin-left: -22rpx;
				width: 44rpx;
				height: 35rpx;
			}

			.icon3 {
				position: absolute;
				left: 50%;
				top: 47%;
				margin-left: -21rpx;
				width: 48rpx;
				height: 42rpx;
			}

			.icon4 {
				position: absolute;
				left: 50%;
				top: 47%;
				margin-left: -25rpx;
				width: 49rpx;
				height: 51rpx;
			}
		}
	}


	.popupcontainer {
		background-color: #eff2f6;
		border-radius: 50rpx 50rpx 0rpx 0rpx;
		position: relative;
		padding-bottom: env(safe-area-inset-bottom);
		padding-bottom: constant(safe-area-inset-bottom);

		::after {
			content: '';
			display: block;
			clear: both;
		}

		.tip {
			width: 106rpx;
			height: 95rpx;
			position: absolute;
			left: 50%;
			top: -40rpx;
			margin-left: -53rpx;
		}

		.close-btn {
			width: 26rpx;
			height: 27rpx;
			right: 30rpx;
			top: 20rpx;
			padding: 20rpx;
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

	.uni-popup__wrapper-box {

		display: block;

		position: relative;
		/* iphonex 等安全区设置，底部安全区适配 */

		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);

	}
</style>