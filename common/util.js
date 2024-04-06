function formatTime(time) {
	if (typeof time !== 'number' || time < 0) {
		return time
	}

	var hour = parseInt(time / 3600)
	time = time % 3600
	var minute = parseInt(time / 60)
	time = time % 60
	var second = time

	return ([hour, minute, second]).map(function(n) {
		n = n.toString()
		return n[1] ? n : '0' + n
	}).join(':')
}

function formatLocation(longitude, latitude) {
	if (typeof longitude === 'string' && typeof latitude === 'string') {
		longitude = parseFloat(longitude)
		latitude = parseFloat(latitude)
	}

	longitude = longitude.toFixed(2)
	latitude = latitude.toFixed(2)

	return {
		longitude: longitude.toString().split('.'),
		latitude: latitude.toString().split('.')
	}
}
var dateUtils = {
	UNITS: {
		'年': 31557600000,
		'月': 2629800000,
		'天': 86400000,
		'小时': 3600000,
		'分钟': 60000,
		'秒': 1000
	},
	humanize: function(milliseconds) {
		var humanize = '';
		for (var key in this.UNITS) {
			if (milliseconds >= this.UNITS[key]) {
				humanize = Math.floor(milliseconds / this.UNITS[key]) + key + '前';
				break;
			}
		}
		return humanize || '刚刚';
	},
	format: function(dateStr) {
		var date = this.parse(dateStr)
		var diff = Date.now() - date.getTime();
		if (diff < this.UNITS['天']) {
			return this.humanize(diff);
		}
		var _format = function(number) {
			return (number < 10 ? ('0' + number) : number);
		};
		return date.getFullYear() + '/' + _format(date.getMonth() + 1) + '/' + _format(date.getDate()) + '-' +
			_format(date.getHours()) + ':' + _format(date.getMinutes());
	},
	parse: function(str) { //将"yyyy-mm-dd HH:MM:ss"格式的字符串，转化为一个Date对象
		var a = str.split(/[^0-9]/);
		return new Date(a[0], a[1] - 1, a[2], a[3], a[4], a[5]);
	}
};

// 数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0
var handPillowState = function(type = 1, arrayUnit8Buffer_) {
	// 向蓝牙设备发送一个0x00的2进制数据
	let littleEdition = true
	const buffer = new ArrayBuffer(8)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4
	dataView.setUint8(0, type)
	dataView.setUint8(1, 0)
	// （1——正卧设置，数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0）
	dataView.setUint8(2, 10)
	dataView.setUint8(3, 0)
	dataView.setUint8(4, 10)
	dataView.setUint8(5, 0)
	dataView.setUint8(6, 0)
	dataView.setUint8(7, 0)
	return buffer
};
// 数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0
// 正卧数据
var handPillowFrontState = function(head, neck) {
	// 向蓝牙设备发送一个0x00的2进制数据
	let littleEdition = true
	const buffer = new ArrayBuffer(8)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4
	dataView.setUint8(0, 1)
	dataView.setUint8(1, 0)
	// （1——正卧设置，数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0）
	dataView.setUint8(2, head)
	dataView.setUint8(3, 0)
	dataView.setUint8(4, neck)
	dataView.setUint8(5, 0)
	dataView.setUint8(6, 0)
	dataView.setUint8(7, 0)
	return buffer
};
// 侧卧数据
var handPillowSideState = function(head, neck) {
	// 向蓝牙设备发送一个0x00的2进制数据
	let littleEdition = true
	const buffer = new ArrayBuffer(8)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4
	dataView.setUint8(0, 1)
	dataView.setUint8(1, 0)
	// （1——正卧设置，数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0）
	dataView.setUint8(2, head)
	dataView.setUint8(3, 0)
	dataView.setUint8(4, neck)
	dataView.setUint8(5, 0)
	dataView.setUint8(6, 0)
	dataView.setUint8(7, 0)
	return buffer
};
// （4——延时设置，数据1-小时，数据2-分钟，数据3-秒钟）。
var handlePillowDelayState = function(head, neck) {
	// 向蓝牙设备发送一个0x00的2进制数据
	let littleEdition = true
	const buffer = new ArrayBuffer(8)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4
	dataView.setUint8(0, 4)
	dataView.setUint8(1, 0)
	// 数据1-小时
	dataView.setUint8(2, head)
	dataView.setUint8(3, 0)
	dataView.setUint8(4, neck)
	dataView.setUint8(5, 0)
	dataView.setUint8(6, 0)
	dataView.setUint8(7, 0)
	return buffer
}

// 生成第一步握手数据
var hand1Shake = function(checkNum, arrayUnit8Buffer_) {
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
}

var write2tooth = function(deviceId, serviceId, characteristicId, buffer) {
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
}
// 将字符串转为arraybuffer
var hexStringToArrayBuffer = function(str) {
	if (!str) {
		return new ArrayBuffer(0);
	}
	var buffer = new ArrayBuffer(str.length / 2.0);
	let dataView = new DataView(buffer)
	let ind = 0;
	for (let i = 0; i < str.length; i += 2) {
		let code = parseInt(str.substr(i, 2), 16)
		dataView.setUint8(ind, code)
		ind++
	}
	return buffer;
}
// 将字节流转为字符串
var hexCharCodeToStr = function(hexCharCodeStr) {
	let str = hexCharCodeStr.toString(16);
	if (str.length === 1) {
		str = '0' + str;
	}
	return str;
}
// 解析枕头状态
var parsePillowState = function(arraybuffer) {
	// （0~1：卧姿标志0x2318正卧－0x2319侧卧；2：头部气囊值；3：颈部气囊值；4~5：延时值；6~7：电压值）
	// const buffer = new ArrayBuffer(8)
	const dataView = new DataView(arraybuffer)
	// dataView.setUint8(0, 0)
	// dataView.setUint8(1, checkNum)
	// dataView.setUint8(2, arrayUnit8Buffer_[0])
	// dataView.setUint8(3, arrayUnit8Buffer_[1])
	// dataView.setUint8(4, arrayUnit8Buffer_[2])
	// dataView.setUint8(5, arrayUnit8Buffer_[3])
	// dataView.setUint8(6, 0)
	// dataView.setUint8(7, 0)
	let one = dataView.getUint16(0)
	let head = dataView.getUint8(2)
	let neck = dataView.getUint8(3)
	let time = dataView.getUint16(4)
	return {
		'one': one,
		'head': head,
		'neck': neck,
		'time': time
	}
}


// ArrayBuffer转16进度字符串示例
var ab2hex = function(buffer) {
	const hexArr = Array.prototype.map.call(
		new Uint8Array(buffer),
		function(bit) {
			return ('00' + bit.toString(16)).slice(-2)
		}
	)
	return hexArr.join('')
}


export {
	parsePillowState,
	hexCharCodeToStr,
	handlePillowDelayState,
	hexStringToArrayBuffer,
	hand1Shake,
	write2tooth,
	ab2hex,
	formatTime,
	formatLocation,
	handPillowState,
	handPillowFrontState,
	dateUtils
}