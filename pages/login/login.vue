<template>
	<view class="main">
		<view class="">
			<image class="backimg" src="../../static/index/SY_00_000.jpg" mode="widthFix"></image>
		</view>
		<view class="logoTip">
			<image class="logoTipImg" src="../../static/index/SY_00_F01.png" mode="widthFix"></image>
		</view>
		<view class="rotateimgblock">
			<image class="rotateimg" src="../../static/index/SY_00_001.png" mode="widthFix"></image>
		</view>
		<view class="logo">
			<image src="../../static/index/SY_00_logo.png" mode="aspectFit"></image>
		</view>
		<view class="connectBtn" @click="connectHandler">
			<image src="../../static/index/SY_00_button01a.png" mode="aspectFit"></image>
		</view>


		<!-- 		<view wx:if="{{anchor2DList}}">
		    <view wx:for="{{anchor2DList}}" style="margin: 30px auto; position: relative; width: {{bodyImgWidth}}px; height: {{bodyImgHeight}}px;">
		        <image src="{{bodyImgUrl}}" style="width: {{bodyImgWidth}}px; height: {{bodyImgHeight}}px;" />
		        <view style="position: absolute; left: {{item.origin.x * bodyImgWidth}}px; top: {{item.origin.y * bodyImgHeight}}px; width: {{item.size.width * bodyImgWidth}}px; height: {{item.size.height * bodyImgHeight}}px; border: solid red 2px"></view>
		        <view wx:for="{{item.points}}" wx:key="id" style="position: absolute; left: {{item.x * bodyImgWidth}}px; top: {{item.y * bodyImgHeight}}px; width: 4px; height: 4px; background-color: #00ff00; border-radius: 50%;"></view>
		    </view>
		</view> -->
		<!-- </view> -->
	</view>
</template>

<script>
	// import getBehavior from '../../utils/behavior'
	// import yuvBehavior from '../../utils/yuvBehavior'

	// 引入文件夹
	import {
		createScopedThreejs
	} from 'threejs-miniprogram'

	export default {
		// behaviors: [getBehavior(), yuvBehavior],
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 0,
					onshow: true
				});
			}

			console.log('createScopedThreejs:', createScopedThreejs)
		},
		onShareAppMessage() {


		},
		data() {
			return {
				imgData: '',
				session: '',
				bodyImgUrl: '',
				bodyImgWidth: 0,
				bodyImgHeight: 0,
				bodyImgOriginWidth: 0,
				bodyImgOriginHeight: 0,
				deviceId: '', // 设备蓝牙id
			}
		},
		methods: {
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
			stopBlueTooth() {
				uni.stopBluetoothDevicesDiscovery({
					success: (res) => {
						console.log("stopBlueTooth success!")
					},
					fail: (res) => {
						console.log("stopBlueTooth fail!")
					}
				})
			},
			connectBluetooth(deviceId) {
				console.log('start connectBluetooth:', deviceId)
				uni.createBLEConnection({
					// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
					deviceId: deviceId,
					success: (res) => {
						console.log('connectBluetooth:', deviceId, res)
						uni.getBLEDeviceServices({
							deviceId,
							success: (res) => {
								console.log('getBLEDeviceServices:', res)
								for (let i = 0; i < res.services.length; i++) {
									if (res.services[i].isPrimary) {
										this.notifyBluetooth(deviceId, res.services[i].uuid, 1)
										// 可根据具体业务需要，选择一个主服务进行通信
									}
								}
							}
						})
					},
					fail: (res) => {
						console.log("connectBluetooth fail: ", res)
					}
				})
			},
			write2tooth(deviceId, serviceId, characteristicId, ) {
				// 向蓝牙设备发送一个0x00的16进制数据
				const buffer = new ArrayBuffer(8)
				const dataView = new DataView(buffer)
				dataView.setUint8(0, 0)
				dataView.setUint8(1, 255)
				dataView.setUint8(2, 255)
				dataView.setUint8(5, 0)
				dataView.setUint8(6, 0)
				uni.writeBLECharacteristicValue({
					// 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
					deviceId,
					// 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
					serviceId,
					// 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
					characteristicId,
					// 这里的value是ArrayBuffer类型
					value: buffer,
					success(res) {
						console.log('writeBLECharacteristicValue success', res.errMsg)
					}
				})
			},

			notifyBluetooth(deviceId, serviceId, characteristicId) {
				// 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。注意：必须设备的特征值支持 notify 或者 indicate 才可以成功调用。 另外，必须先启用 notifyBLECharacteristicValueChange 才能监听到设备 characteristicValueChange 事件
				uni.notifyBLECharacteristicValueChange({
					deviceId: deviceId,
					state: true,
					serviceId: serviceId,
					characteristicId: characteristicId,
					success(res) {
						console.log('notifyBLECharacteristicValueChange success')
					}
				})

				// 监听低功耗蓝牙设备的特征值变化事件.必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
				uni.onBLECharacteristicValueChange(function(res) {
					console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
					console.log(this.ab2hex(res.value))
				})
			},
			connectHandler() {
				let that = this;
				uni.openBluetoothAdapter({
					success: (res) => {
						console.log('startBluetoothDevicesDiscovery')
						uni.startBluetoothDevicesDiscovery({
							services: [],
							success(res) {
								console.log(res)
							}
						})
						//  50s扫描结束
						setTimeout(function() {
							that.stopBlueTooth()
						}, 500000);
						uni.onBluetoothDeviceFound((result) => {
							let devices = result.devices
							let first_device = devices[0]
							console.log('new device list has founded', devices.length)
							console.log('devices:', devices)
							// console.log(this.ab2hex(devices[0].advertisData))
							// this.stopBlueTooth()
							if (devices.length > 0 && first_device.advertisData) {
								console.log("connectable :", first_device, first_device.connectable)
								that.deviceId = first_device.deviceId
								that.connectBluetooth(that.deviceId)
								that.stopBlueTooth()
							}
						})
					},
					fail(res) {
						if (res.errCode == 10001) {
							uni.showToast({
								duration: 3000,
								title: '请打开蓝牙'
							})
						}
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

<style>
	.main {
		width: 100%;
		height: 100%;
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
		width: 649rpx;
		height: 200rpx;
		margin: 0 auto;
		margin-top: -200rpx;
	}

	.logoTip image {
		width: 100%;
		height: 100%;
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

	.backimg {
		width: 100%;
		display: block;
	}
</style>