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
class blue_class {
	static instance = null; // 静态属性，用于存储单例  
	// 私有构造函数，防止外部通过 new 关键字创建实例  
	pillowHeight = 80;
	pillowSideHeight = 80;
	pillowPower = 0;
	pillowPlasticHead = 0;
	pillowPlasticNeck = 0;
	pillowStatus = 0; // 0--空闲，1--平躺，2--侧卧；
	chargingStatus = 0; // 0--空闲，1--充电中，2--充电完成
	manualDisconnecting = false; // 是否为手动断开流程中
	isSpineAdjusting = false; // 是否正在进行脊柱调整
	deviceIdList = [];
	constructor() {
		// 初始化蓝牙相关的状态或变量  
		this.bluetoothStatus = null; // 蓝牙状态  
		this.isNotify = false; //用于防止重复启动notify功能
		this.notifyCount = 0; //用于判断启动了几次notify功能
		this.serviceId = '';
		this.deviceName = ''; // 设备名称
		this.version = 0; // 版本号
		this.characteristicId = '6E400004-B5A3-F393-E0A9-E50E24DCCA9E';
		this.deviceId = ''; // 连接的蓝牙id
		this.loginSuccess = false; // 连接成功
		this.pillowStatus = 0;
	}
	// 静态方法，用于获取蓝牙管理器的实例  
	static getInstance() {
		if (!blue_class.instance) {
			// 如果没有实例，则创建一个新的实例  
			blue_class.instance = new blue_class(); // 注意这里使用了 private constructor  
		}
		return blue_class.instance;
	}


	setPillowStatus(value) {
		this.pillowStatus = value;
	}
	getPillowStatus() {
		return this.pillowStatus;
	}

	setManualDisconnecting(value){
		this.manualDisconnecting = !!value;
	}
	getManualDisconnecting(){
		return this.manualDisconnecting;
	}

	setSpineAdjusting(value) {
		this.isSpineAdjusting = value;
	}
	getSpineAdjusting() {
		return this.isSpineAdjusting;
	}

	setPillowCharging(value) {
		this.chargingStatus = value;
		console.log('PillowCharging:', this.chargingStatus)
	}

	setPillowPlasticStatus(head_status, neck_status) {
		this.pillowPlasticNeck = neck_status;
		this.pillowPlasticHead = head_status;
		console.log('setPillowPlasticStatus:', this.pillowPlasticNeck)
	}


	getPillowCharging() {
		return this.chargingStatus
	}

	setPillowHeight(value) {
		this.pillowHeight = value;
		console.log('setPillowHeight:', this.pillowHeight)
	}

	getPillowHeight() {
		console.log('getPillowHeight:', this.pillowHeight)
		return this.pillowHeight;
	}

	setPillowSideHeight(value) {
		this.pillowSideHeight = value;
	}

	getPillowSideHeight() {
		return this.pillowSideHeight;
	}
	setPillowPower(value) {
		this.pillowPower = value;
		uni.$emit('update_pillow_info')
	}
	// 获取脊椎剩余时间
	getPillowSpineTime() {
		return this.pillowSpineTime;
	}
	setPillowSpineTime(value) {
		this.pillowSpineTime = value;
		uni.$emit('update_pillow_spine_time')
	}

	getPillowPower() {
		return this.pillowPower;
	}

	// 初始化蓝牙适配器  
	// 注意：这个方法应该是公开的，但不应该在构造函数中调用  
	initBluetoothAdapter() {
		// 这里使用uni.openBluetoothAdapter等API来初始化蓝牙适配器  
		uni.openBluetoothAdapter({
			success: (res) => {
				console.log('蓝牙适配器初始化成功', res);
				this.bluetoothStatus = 'open'; // 更新蓝牙状态  
			},
			fail: (err) => {
				console.error('蓝牙适配器初始化失败', err);
				this.bluetoothStatus = 'error'; // 更新蓝牙状态  
			}
		});
	}

	// ArrayBuffer转16进度字符串示例
	ab2hex(buffer) {
		const hexArr = Array.prototype.map.call(
			new Uint8Array(buffer),
			function(bit) {
				return ('00' + bit.toString(16)).slice(-2)
			}
		)
		return hexArr.join('')
	}

	//监听设备发送数据
	onBLECharacteristicValueChange() {
		uni.onBLECharacteristicValueChange((res) => {
			let arrayBuffer = new Uint8Array(res.value);
			console.log('[接收到数据root]', this.ab2hex(res.value), arrayBuffer.length)
			// var resData = this.ab2hex(sjRes.value);
			uni.$emit('xx', res);
		})
		var that = this;
		uni.onBLEConnectionStateChange(function(res) {
			// 该方法回调中可以用于处理连接意外断开等异常情况
			console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
			// 兼容：若还未记录deviceId，但收到已连接事件，则补记并广播
			if (res.connected) {
				if (!that.deviceId) {
					that.deviceId = res.deviceId;
				}
				// 连接成功
				console.log('蓝牙设备连接成功');
				that.loginSuccess = true;
				// 连接成功时重置手动断开标记
				that.manualDisconnecting = false;
				// 触发连接状态变化事件，通知页面更新
				uni.$emit('bluetooth_status_change');
				return;
			}
			// 断开仅在为当前记录设备时生效，避免误判其他设备
			if (res.deviceId == that.deviceId) {
				if (res.connected) {
					// 连接成功
					console.log('蓝牙设备连接成功');
					that.loginSuccess = true;
					// 连接成功时重置手动断开标记
					that.manualDisconnecting = false;
					// 触发连接状态变化事件，通知页面更新
					uni.$emit('bluetooth_status_change');
				} else {
					// 连接断开
					console.log('蓝牙设备连接断开');
					that.loginSuccess = false;
					that.deviceId = '';
					that.deviceName = '';
					//清空缓存
					uni.$emit('bluetooth_status_change')
					
					if(!that.manualDisconnecting){
						uni.showModal({
							title:'蓝牙断开提示',
							content:'设备蓝牙意外断开，是否回到首页重新连接蓝牙？',
							showCancel:'稍后',
							confirmText:'回到首页',
							success:(res)=>{
								if(res.confirm){
									uni.switchTab({
										url:'/pages/status/status'
									})
								}else if(res.cancel){
									console.log('用户选择了稍后处理');
								}
							}
						})
					}else{
						console.log('检测到手动断开，跳过意外断开提示');
					}
					// 断开后重置手动断开标记
					that.manualDisconnecting = false;
				}
			}
		})
	}

	updateDeviceName(dname) {
		this.deviceName = dname;
	}
	updateVersion(v) {
		this.version = v;
	}
	// 解析枕头状态  06 0b 01 01 21 49 10 01 03 e8 04 00 00 
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
		let n1 = (detail_status & 0x01);
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
		let neckHeight10 = parseInt('0x' + neckHeight) +30;
		let vesrion = receive16.slice(8, 10);
		let vesrion10 = parseInt('0x' + vesrion);
		let isright = receive16.slice(10, 12);
		let isright10 = parseInt('0x' + isright);
		let press = receive16.slice(12, 16);
		let press10 = parseInt('0x' + press);
		let plastic_status = receive16.slice(16, 18);
		let plastic_status16 = '0x' + plastic_status;
		let plastic_status10 = parseInt(plastic_status16);
		// 8：气囊状态（bit0-1（头部气囊充气状态，0--空闲，1--充气，2--放气），bit3-4(颈部气囊状态 0--空闲，1--充气，2--放气））

		let plastic_n1 = (plastic_status16) & 0x01;
		let plastic_n2 = (plastic_status16 >> 2) & 0x01;
		console.log('头部气囊充气状态:', plastic_n1);
		console.log('颈部气囊状态:', plastic_n2);

		// 9：脊柱调整剩余时间（U16

		let spine_status = receive16.slice(18, 20);
		let spine_status16 = '0x' + spine_status;
		let spine_status10 = parseInt(spine_status16);
		console.log('脊柱调整16进制剩余时间:', spine_status16);
		console.log('脊柱调整剩余时间:', spine_status10, "秒");


		blue_class.getInstance().setPillowPlasticStatus(plastic_n1, plastic_n2)
		blue_class.getInstance().setPillowCharging(n1)
		blue_class.getInstance().setPillowHeight(headHeight10)
		blue_class.getInstance().setPillowStatus(status10)
		blue_class.getInstance().setPillowSideHeight(neckHeight10)
		blue_class.getInstance().setPillowPower(press10)
		blue_class.getInstance().setPillowSpineTime(spine_status10)
		// work 枕头状态 mm=> 1 height:151mm neckheight:13mm version:3 校准:1 电池:1
		// console.log('work 枕头状态 =>', 'height:' + headHeight, 'neckheight:' + neckHeight, vesrion, isright, press)
		console.log('work 枕头状态 mm=>', status10, 'height:' + headHeight10 + 'mm', 'neckheight:' + (neckHeight10 -30) +
			'mm', 'version:' + vesrion10,
			'校准:' + isright10,
			'电池:' + press10)
	}
	// 启用 notify 功能
	startNotice(uuid) {
		// 预防重复启动
		// if (this.isNotify) {
		// 	console.log('已经启用过 notify 功能');
		// } else {
		// 	uni.notifyBLECharacteristicValueChange({
		// 		state: true, // 启用 notify 功能
		// 		deviceId: uuid.deviceUUID,
		// 		serviceId: uuid.serviceUUID,
		// 		characteristicId: uuid.notifyUUID,
		// 		success: (res) => {
		// 			// store.state.notyfiyFlagList.push(uuid);
		// 			console.log('成功启用 notify 功能', uuid);
		// 			this.isNotify = true;
		// 			// 启动一次notify，就加1
		// 			this.notifyCount = this.notifyCount + 1;
		// 			this.serviceId = uuid.serviceUUID;
		// 			this.deviceId = uuid.deviceUUID;
		// 			this.onBLECharacteristicValueChange();
		// 		},
		// 		fail: (res) => {
		// 			console.log('启用 notify 功能失败', res)
		// 		}
		// 	});
		// }
		uni.notifyBLECharacteristicValueChange({
			state: true, // 启用 notify 功能
			deviceId: uuid.deviceUUID,
			serviceId: uuid.serviceUUID,
			characteristicId: uuid.notifyUUID,
			success: (res) => {
				// store.state.notyfiyFlagList.push(uuid);
				console.log('成功启用 notify 功能', uuid);
				this.isNotify = true;
				// 启动一次notify，就加1
				this.notifyCount = this.notifyCount + 1;
				this.serviceId = uuid.serviceUUID;
				this.deviceId = uuid.deviceUUID;
				this.onBLECharacteristicValueChange();
			},
			fail: (res) => {
				console.log('启用 notify 功能失败', res)
			}
		});
	}
	write2tooth(buffer) {
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;
		let characteristicId = this.characteristicId;
		console.log('write2tooth,deviceId:,', deviceId, ',serviceId:,' + serviceId,
			',characteristicId:,' + characteristicId, 'arraybuffer:', this.ab2hex(buffer))
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
				// resolve(res)
				console.log('writeBLECharacteristicValue success', res)
			},
			fail() {
				console.log('writeBLECharacteristicValue fail')
				// reject()
			}
		})
	}
}
export default blue_class;