<template>
	<!-- 	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='枕头调整'></z-nav-bar> -->
	<view class="main">
		<view class="select-part">
			<view :class="this.selectIndex==1?'select-btn':'select-btn unselect-btn'">
				<image mode="widthFix" class="icon1" :src="'../static/adjust/SY_11_IconYWb.png'"></image>
				<label>仰卧调节</label>
			</view>
			<view :class="this.selectIndex==2?'select-btn':'select-btn unselect-btn'">
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
				<image class="human-icon" :src="'../static/adjust/SY_11_bg01YW.png'"></image>
				<image class="main-icon" :src="'../static/adjust/SY_11_bg02TZ.png'"></image>
				<image class="down-icon" :class="touchingDown?['down-icon-effect']:[]"
					:src="'../static/adjust/SY_11_DOW.png'"></image>
				<image class="up-icon" :class="touchingUp?['up-icon-effect']:[]" :src="'../static/adjust/SY_11_UP.png'">
				</image>
				<!-- 				<image class="bzb-icon" :src="'../static/adjust/SY_11_buttonBZb.png'"></image>
				<image class="tzb-icon" :src="'../static/adjust/SY_11_buttonTZb.png'"></image> -->
				<view :class="this.selectHead?'bo bo-left':'bo bo-left select'" @click="selectHeadHandler(false)">
					脖枕
				</view>
				<view :class="this.selectHead?'bo bo-right select':'bo bo-right'" @click="selectHeadHandler(true)">
					头枕
				</view>
			</view>
			<view class="version">
				{{pillowVersion+':'+pillowStatus}}
			</view>
			<view class="opt-part">
				<view class="opt-btn opt-btn-top" @touchstart="adjustHighSleepHandler"
					@touchend="stopAdjustHighHandler">
					<image mode="widthFix" class="icon" :src="'../static/adjust/SY_11_butUP.png'"></image>
					<label>升高</label>
				</view>
				<view class="opt-tip1">按住升高,放开停止</view>
				<view class="opt-btn opt-btn-top" @touchstart="adjustLowSleepHandler" @touchend="stopAdjustHighHandler">
					<image mode="widthFix" class="icon" style="transform: rotate(-180deg);"
						:src="'../static/adjust/SY_11_butUP.png'">
					</image>
					<label>降低</label>
				</view>
				<view class="opt-tip2">按住降低,放开停止</view>
			</view>
			<view class=" opt-part" v-if="true">
				<view class="opt-btn" @click="uploadDataHandle" v-if="false">
					<label>上报数据</label>
				</view>

				<view class="opt-btn" @click="resetHandle">
					<label>设备校准</label>
				</view>
				<view class="opt-btn" @click="restartHandle">
					<label>设备重启</label>
				</view>
			</view>
			<view class="bottom-part">
				<view class="save" @click="saveHandler">保存</view>
			</view>
		</view>
		<input-view ref="inputView" class="input-part" v-if="showMeasure&&false"></input-view>
	</view>

</template>

<script>
	import blue_class from '../../utils/BlueManager'
	import InputView from '../../pages/shootView/InputView.vue'
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
		initPillow,
		changeAdjustMode,
		changeSaveAdjustMode,
		hand1Shake,
		write2tooth,
		parsePillowState
	} from '@/common/util.js'
	import {
		version
	} from 'vue'
	import {
		appAnswer,
		restartPillow
	} from '../../common/util'
	export default {
		components: {
			InputView
		},
		data() {
			return {
				pillowVersion: '固件版本:0.1',
				pillowStatus: '',
				pillowStatusNum: 0, // 枕头状态
				saveOptions: {},
				showMeasure: false, // 是否显示信息
				touchingDown: false,
				touchingUp: false,
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
				sideNeck: 0,
				initHeadHeight: 0,
				initNeckHeight: 0,
				initWidthHeight: 0,
				initSideNeckHeight: 0,
				initSideWdithHeight: 0,
			}
		},
		onLoad(options) {
			console.log('options:', options)
			this.pillowName = decodeURIComponent(options.pillowName || '')
			this.deviceId = options.deviceId || ''
			this.serviceId = options.serviceId || ''
			this.initHeadHeight = options.headHeight || 0
			this.initNeckHeight = options.neckHeight || 0
			this.initWidthHeight = options.shoulderHeight || 0
			this.initSideNeckHeight = options.sideNeckHeight || 0
			this.initSideHeadHeight = options.sideHeadHeight || 0
			this.initSideWdithHeight = options.sideShoulderHeight || 0
			this.saveOptions = options;
			blue_class.getInstance().updateDeviceName(this.pillowName);
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

			if (this.initHeadHeight > 0 && this.initNeckHeight > 0) {
				// let init_arraybuffer = initPillow(this.initHeadHeight, this.initNeckHeight, this.initWidthHeight, this
				// 	.initSideHeadHeight, this.initSideNeckHeight, this.initSideWdithHeight);
				// // let app = getApp()
				// blue_class.getInstance().write2tooth(init_arraybuffer);
				this.showMeasure = true;
				// 如果有数据，默认调整枕头
				let init_arraybuffer = initPillow(this.initHeadHeight, this.initNeckHeight, 200, this
					.initSideHeadHeight, this.initSideNeckHeight, 200);
				// let app = getApp()
				blue_class.getInstance().write2tooth(init_arraybuffer);
				// this.$refs.inputView.showParams(this.saveOptions);
			} else {
				this.showMeasure = false;
			}
		},
		onUnload() {
			console.log('adjust on onUnload!')
			// 把模式还原成自动
			let arraybuffer = changeAdjustMode(0);
			blue_class.getInstance().write2tooth(arraybuffer)

			uni.$off('xx', this.handleMessage);
		},
		onHide() {
			console.log('adjust on hide!')
			// 把模式还原成自动
			let arraybuffer = changeAdjustMode(0);
			blue_class.getInstance().write2tooth(arraybuffer)

			uni.$off('xx', this.handleMessage);
		},
		methods: {
			uploadDataHandle() {
				let upload_data = uploadDataRequest(5)
				blue_class.getInstance().write2tooth(upload_data)
			},
			restartHandle() {
				let arraybuffer = restartPillow(77);
				blue_class.getInstance().write2tooth(arraybuffer)
			},
			resetHandle() {
				let reset_data = resetPillow(88);
				blue_class.getInstance().write2tooth(reset_data)
			},
			// 请求枕头状态
			requestStatus() {
				let shake1 = handPillowStatus()
				blue_class.getInstance().write2tooth(shake1)
			},
			saveHandler() {
				let changeAdjust = changeSaveAdjustMode();
				blue_class.getInstance().write2tooth(changeAdjust);
				uni.switchTab({
					url: '/pages/status/status'
				})
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
						this.parsePillowSleepData(arrayBuffer)
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
				}
			},
			parsePillowStatus(arraybuffer) {
				// //默认是枕头状态 5s收到一次
				let receive16 = ab2hex(arraybuffer);
				// （0：0--空闲，1--平躺，2--侧卧；1：（备用）2：头部气囊高度值；3：颈部气囊高度值；4:固件版本； 5是否校准；6~7：电池电压值）
				let status = receive16.slice(0, 2);
				let status1 = '0x' + status;

				let status10 = parseInt(status1);
				this.pillowStatusNum = status10;
				switch (status10) {
					case 0:
						console.log('枕头空闲状态');
						this.pillowStatus = '枕头空闲状态';
						this.selectIndex = 1;
						break;
					case 1:
						console.log('枕头平躺状态')
						this.pillowStatus = '枕头平躺状态';
						this.selectIndex = 1;
						break;
					case 2:
						console.log('枕头侧卧状态')
						this.pillowStatus = '枕头侧卧状态';
						this.selectIndex = 2;
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

				this.head = headHeight10;
				this.neck = neckHeight10;

				this.sideHead = headHeight10;
				this.sideNeck = neckHeight10;
				// let status1 = '0x' + status;
				this.pillowVersion = '固件版本:' + vesrion10;



				console.log('adjust12 =>', status, headHeight, neckHeight, vesrion, isright, press)
				console.log('adjust12 mm=>', status10, headHeight10 + 'mm', neckHeight10 + 'mm', 'v:' + vesrion10,
					isright10,
					press10)
			},
			parsePillowSleepData(array_buffer) {
				//解析枕头睡眠阶段状态	
				// 数据1-姿态（U8）(1--平躺，2--侧卧) + 数据2开始时间（T4）+数据3结束时间（T4）+ 数据4-姿态（U8）(1--平躺，2--侧卧) + 数据5开始时间（T4）+数据6结束时间（T4）+ ... ,关于该指令的说明，是多个姿态+开始时间和结束时间的条目的组合，根据数据长度计算一条指令中包含多少组数据
				// let receive8 = new Uint8Array(array_buffer);
				// console.log('姿态:', receive8.getUint8(0))
				blue_class.getInstance().write2tooth(appAnswer(5))
			},
			selectHeadHandler(bool) {
				this.selectHead = bool
			},
			selectHandler(index) {
				this.selectIndex = index
			},
			// 调低枕头
			adjustLowSleepHandler() {
				this.touchingDown = true
				let action = 2
				let arraybuffer
				// 如果选择的仰卧
				if (this.selectIndex == 1) {
					// 如果选择的是调整头枕
					if (this.selectHead) {
						// this.head -= 1
						if (this.head <= 0) {
							this.head = 0
						}
					} else {
						// this.neck -= 1
						if (this.neck <= 0) {
							this.neck = 0
						}
					}
					arraybuffer = handPillowFrontState(action, this.selectHead)
					console.log('调低仰卧:', this.selectHead ? '调整头部' : '调整颈部', action, ab2hex(arraybuffer))
				} else {
					// 如果选择的侧卧
					if (this.selectHead) {
						// this.sideHead -= 1
						if (this.sideHead <= 0) {
							this.sideHead = 0
						}
					} else {
						// this.sideNeck -= 1
						if (this.sideNeck <= 0) {
							this.sideNeck = 0
						}
					}
					arraybuffer = handPillowFrontState(action, this
						.selectHead)
					console.log('调低侧卧:', action, ab2hex(arraybuffer))
				}
				// console.log('调低:', ab2hex(arraybuffer))
				blue_class.getInstance().write2tooth(arraybuffer)
			},
			stopAdjustHighHandler() {
				this.touchingDown = false;
				this.touchingUp = false;
				// 停止调节枕头
				// 如果选择的仰卧
				let action = 0
				let arraybuffer = null;
				if (this.selectIndex == 1) {
					if (this.selectHead) {
						// this.head += 1
						if (this.head >= 100) {
							this.head = 100
						}
					} else {
						// this.neck += 1
						if (this.neck >= 100) {
							this.neck = 100
						}
					}
					arraybuffer = handPillowFrontState(action, this.selectHead)
					console.log('停止调节仰卧:', action, ab2hex(arraybuffer))
				} else {
					if (this.selectHead) {
						// this.sideHead += 1
						if (this.sideHead >= 100) {
							this.sideHead = 100
						}
					} else {
						// this.sideNeck += 1
						if (this.sideNeck >= 100) {
							this.sideNeck = 100
						}
					}
					// 如果选择的侧卧
					arraybuffer = handPillowFrontState(action, this
						.selectHead)
					console.log('停止调节侧卧:', action, ab2hex(arraybuffer))
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
				let action = 1;
				this.touchingUp = true

				// 如果选择的仰卧
				if (this.selectIndex == 1) {
					if (this.selectHead) {
						// this.head += 1
						if (this.head >= 100) {
							this.head = 100
						}
					} else {
						// this.neck += 1
						if (this.neck >= 100) {
							this.neck = 100
						}
					}
					arraybuffer = handPillowFrontState(action, this.selectHead)
					console.log('调高仰卧:', this.selectHead ? '调整头部' : '调整颈部', ab2hex(arraybuffer))
				} else {
					if (this.selectHead) {
						// this.sideHead += 1
						if (this.sideHead >= 100) {
							this.sideHead = 100
						}
					} else {
						// this.sideNeck += 1
						if (this.sideNeck >= 100) {
							this.sideNeck = 100
						}
					}
					// 如果选择的侧卧
					arraybuffer = handPillowFrontState(action, this.selectHead)
					console.log('调高侧卧:', action, ab2hex(arraybuffer))
				}
				// console.log('调高:', ab2hex(arraybuffer))
				blue_class.getInstance().write2tooth(arraybuffer)
			},
		}
	}
</script>

<style lang="scss">
	::v-deep(.input-part) {
		bottom: 0 !important;
	}

	.selected {
		background-color: #1c4485;
	}

	.unselect-btn {
		background-color: #d5e0f7 !important;
		color: #354D5B !important;
	}

	.version {
		width: 100%;
		text-align: center;
		font-size: 18rpx;
	}

	.select-btn {
		background-color: rgb(28, 68, 133);
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

	.resetbtn {
		padding: 5rpx;
		color: white;
		background-color: rgb(109, 0, 1);
	}

	.main {
		background-color: rgb(197, 208, 230);
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
			height: 297rpx;
			margin-top: 100rpx;
			color: #5B7897;

			.bo {
				width: 128rpx;
				height: 76rpx;
				background-color: rgb(77, 127, 201);
				color: white;
				text-align: center;
				line-height: 76rpx;
				border-radius: 30rpx 30rpx;
			}

			.bo-left {
				position: absolute;
				left: 55rpx;
				top: 193rpx;
				z-index: 10;
			}

			.bo-right {
				z-index: 10;
				position: absolute;
				right: 130rpx;
				top: 193rpx;
			}

			.select {
				background-color: white;
				color: rgb(28, 68, 133);
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

			.human-icon {
				position: absolute;
				right: -30rpx;
				top: -60rpx;
				width: 476rpx;
				height: 271rpx;
			}

			.desc1 {
				font-size: 30rpx;
				left: 22rpx;
				top: 20rpx;
				position: absolute;
				color: #354D5B;
				z-index: 11;
			}

			.desc1size {
				font-size: 36rpx;
				position: absolute;
				color: #003C71;
				right: 388rpx;
				top: 18rpx;
				z-index: 11;
			}

			.desc2 {
				position: absolute;
				color: #354D5B;
				left: 390rpx;
				top: 47rpx;
				font-size: 30rpx;
				z-index: 11;
			}

			.desc2size {
				font-size: 36rpx;
				color: #003C71;
				position: absolute;
				right: 37rpx;
				top: 43rpx;
				z-index: 11;
			}

			.main-icon {
				width: 644rpx;
				height: 292rpx;
				position: relative;
				z-index: 10;
			}

			.up-icon {
				width: 24rpx;
				height: 76rpx;
				position: absolute;
				left: 0rpx;
				top: 190rpx;
				z-index: 12;
			}

			.down-icon {
				width: 24rpx;
				height: 77rpx;
				position: absolute;
				right: 27rpx;
				top: 190rpx;
				display: block;
				z-index: 12;
			}

			@-webkit-keyframes downEffect {
				0% {
					transform: translateY(0);
					opacity: 0.3;
				}

				30% {
					transform: translateY(120);
					opacity: 1;

				}

				100% {
					transform: translateY(0);
					top: 70px;
					opacity: 1;
				}
			}

			@keyframes downEffect {
				0% {
					transform: translateY(0);
					opacity: 0.3;
				}

				30% {
					transform: translateY(120);
					opacity: 1;

				}

				100% {
					transform: translateY(0);
					top: 70px;
					opacity: 1;
				}
			}


			.down-icon-effect {
				animation: 1s linear 0s infinite downEffect;
				-webkit-animation: 1s linear 0s infinite downEffect;
			}

			@-webkit-keyframes upEffect {
				0% {
					opacity: 0.3;
					top: 50px;
				}

				30% {
					opacity: 1;
				}

				100% {
					top: 20px;
					opacity: 1;
				}
			}

			@keyframes upEffect {
				0% {
					opacity: 0.3;
					top: 50px;
				}

				30% {
					opacity: 1;
				}

				100% {
					top: 20px;
					opacity: 1;
				}
			}

			.up-icon-effect {
				animation: 1s linear 0s infinite upEffect;
				-webkit-animation: 1s linear 0s infinite upEffect;
			}
		}

		.opt-part {
			display: flex;
			justify-content: space-around;
			margin-top: 62rpx;
			position: relative;

			.opt-tips-con {
				display: flex;
				justify-content: space-around;
				position: relative;
			}

			.opt-tip1 {
				position: absolute;
				top: 95rpx;
				left: 50rpx;
				text-align: center;
				color: #676767;
			}

			.opt-tip2 {
				position: absolute;
				top: 95rpx;
				right: 50rpx;
				text-align: center;
				color: #676767;
			}

			.opt-btn {
				width: 284rpx;
				height: 90rpx;
				display: flex;
				justify-content: space-around;
				align-items: center;
				background-color: rgb(28, 68, 133);
				border-radius: 30rpx;
				line-height: 56rpx;
				color: white;

				label {
					margin-left: -55rpx;
				}
			}

			.opt-btn-top {
				background-color: rgb(79, 128, 191);
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
			background-color: rgb(28, 68, 133);
			margin: 0 auto;
			line-height: 102rpx;
			text-align: center;
			color: white;
			margin-top: 80rpx;
			border-radius: 50rpx;

		}
	}
</style>