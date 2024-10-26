import blue_class from '../utils/BlueManager'

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
// 更改枕头状态
var changeAdjustMode = function(mode = 1, save = 0) {
	// 向蓝牙设备发送一个0x00的2进制数据
	//先构造数据
	// 模式，0--自动，1--手动配置模式，配置其他参数前须切换到该模式
	const data_buffer = new ArrayBuffer(2);
	const dataBufferView = new DataView(data_buffer);
	// 0--自动，1--手动配置模式）
	dataBufferView.setUint8(0, mode);
	// (0--不保存，1--保存)
	dataBufferView.setUint8(1, save);
	let withLengthBuffer = handleSendFormart(data_buffer)
	console.log("[changeMode] withLengthBuffer", withLengthBuffer)
	const orign_buffer = new DataView(withLengthBuffer)
	console.log("[changeMode]", withLengthBuffer.byteLength)
	const buffer = new ArrayBuffer(withLengthBuffer.byteLength + 1)
	const dataView = new DataView(buffer)
	// 指令码；1：模式设置2,3,4--手动调整 
	dataView.setUint8(0, 1)
	for (var index = 0; index < withLengthBuffer.byteLength; index++) {
		dataView.setUint8(index + 1, orign_buffer.getUint8(index))
	}
	return buffer
}

// 更改枕头状态
var changeSaveAdjustMode = function() {
	// 向蓝牙设备发送一个0x00的2进制数据
	//先构造数据
	// 模式，0--自动，1--手动配置模式，配置其他参数前须切换到该模式
	const data_buffer = new ArrayBuffer(2);
	const dataBufferView = new DataView(data_buffer);
	// 0--头部气囊，1--颈部气囊）
	dataBufferView.setUint8(0, 0);
	// (0--不保存，1--保存)
	dataBufferView.setUint8(1, 1);
	let withLengthBuffer = handleSendFormart(data_buffer)
	console.log("[changeSaveAdjustMode] withLengthBuffer", withLengthBuffer)
	const orign_buffer = new DataView(withLengthBuffer)
	console.log("[changeSaveAdjustMode]", withLengthBuffer.byteLength)
	const buffer = new ArrayBuffer(withLengthBuffer.byteLength + 1)
	const dataView = new DataView(buffer)
	// 指令码；1：模式设置2,3,4--手动调整 
	dataView.setUint8(0, 1)
	for (var index = 0; index < withLengthBuffer.byteLength; index++) {
		dataView.setUint8(index + 1, orign_buffer.getUint8(index))
	}
	return buffer
}

// 数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0
// 正卧数据（手动调整
// isHead 是否是头枕
var handPillowFrontState = function(action, isHead = true) {
	// 向蓝牙设备发送一个0x00的2进制数据
	//先构造数据
	const data_buffer = new ArrayBuffer(2);
	const dataBufferView = new DataView(data_buffer);
	// 0--头部气囊，1--颈部气囊）
	dataBufferView.setUint8(0, isHead ? 0 : 1)
	// 动作(U8)(0--停止，1--升高，2--降低)
	dataBufferView.setUint8(1, action)
	let withLengthBuffer = handleSendFormart(data_buffer)
	console.log("[handPillowFrontState] withLengthBuffer", withLengthBuffer)
	const orign_buffer = new DataView(withLengthBuffer)
	console.log("[handPillowFrontState]", withLengthBuffer.byteLength)
	const buffer = new ArrayBuffer(withLengthBuffer.byteLength + 1)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4--手动调整 
	dataView.setUint8(0, 4)
	for (var index = 0; index < withLengthBuffer.byteLength; index++) {
		dataView.setUint8(index + 1, orign_buffer.getUint8(index))
	}
	return buffer
};
// 侧卧数据
var handPillowSideState = function(head, neck) {
	// 向蓝牙设备发送一个0x00的2进制数据
	//先构造数据
	const data_buffer = new ArrayBuffer(2);
	const dataBufferView = new DataView(data_buffer);
	// 0--头部气囊，1--颈部气囊）
	dataBufferView.setUint8(0, isHead ? 0 : 1)
	// 动作(U8)(0--停止，1--升高，2--降低)
	dataBufferView.setUint8(1, action)
	let withLengthBuffer = handleSendFormart(data_buffer)
	console.log("[handPillowSideState] withLengthBuffer", withLengthBuffer)
	const orign_buffer = new DataView(withLengthBuffer)
	console.log("[handPillowSideState]", withLengthBuffer.byteLength)
	const buffer = new ArrayBuffer(withLengthBuffer.byteLength + 1)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4--手动调整 
	dataView.setUint8(0, 4)
	for (var index = 0; index < withLengthBuffer.byteLength; index++) {
		dataView.setUint8(index + 1, orign_buffer.getUint8(index))
	}
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

function handleTime(timstamp = 0) {
	var now = new Date(timstamp);
	var second = now.getSeconds();
	var minutes = now.getMinutes();
	var hours = now.getHours();
	var days = now.getDate();
	var months = now.getMonth() + 1;
	var year = now.getFullYear();
	const buffer = new ArrayBuffer(4);
	const dataView = new DataView(buffer);
	dataView.setUint32(0, second | (minutes << 6) | (hours << 12) | (days << 17) | (months << 22) | ((year - 2020) <<
		26))
	return buffer;
}

function parseTime(uint32_t) {
	// 秒：0-5bit，分：6-11bit，时：12-16bit，日：17-21bit，月：22-25bit，年：26-31bit），年基于2020，月取值1-12
	let seconds = (uint32_t >> 0) & 63
	let minutes = (uint32_t >> 6) & 63
	let hour = (uint32_t >> 12) & 31
	let day = (uint32_t >> 17) & 31
	let month = (uint32_t >> 22) & 15
	let year = (uint32_t >> 26) & 63

	return year + '年-' + month + '月-' + day + '日-' + hour + '小时-' + minutes + '分-' + seconds + '秒'
	// console.log(a>>0 & 31,5,'秒');

	// console.log(a>>5 & 31,5,'分');

	// console.log(a>>10 & 15,4,'小时');

	// console.log(a>>14 & 15,4,'日');

	// console.log(a>>18 & 7,3,'月');

	// console.log(a>>21,a>>26 & 31,5,'年');


}
var appAnswer = function(mark) {
	const buffer = new ArrayBuffer(4);
	const dataView = new DataView(buffer);
	dataView.setUint8(0, mark);
	dataView.setUint8(1, 2);
	dataView.setUint8(2, 0);
	dataView.setUint8(3, 0x33);
	return buffer;
}


// 生成第一步握手数据
var hand1Shake = function(checkNum, arrayUnit8Buffer_) {
	// 向蓝牙设备发送一个0x00的2进制数据
	// 11. APP收到设备ID后，发送10个字节的应答（0：0；1：设备ID的校验和；2~5：APP-ID；6~9：当前时间（T4））
	let littleEdition = true
	const buffer = new ArrayBuffer(10)
	const dataView = new DataView(buffer)
	dataView.setUint8(0, 0)
	dataView.setUint8(1, checkNum)
	dataView.setUint8(2, arrayUnit8Buffer_[0])
	dataView.setUint8(3, arrayUnit8Buffer_[1])
	dataView.setUint8(4, arrayUnit8Buffer_[2])
	dataView.setUint8(5, arrayUnit8Buffer_[3])
	let time = handleTime(Date.now())
	const dataView_time = new DataView(time);
	console.log('time1:', time)
	dataView.setUint8(6, dataView_time.getUint8(0))
	dataView.setUint8(7, dataView_time.getUint8(1))
	dataView.setUint8(8, dataView_time.getUint8(2))
	dataView.setUint8(9, dataView_time.getUint8(3))
	// dataView.setUint8(6, 0)
	// dataView.setUint8(7, 0)
	// dataView.setUint8(8, 0)
	// dataView.setUint8(9, 0)

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

// 请求枕头状态
var handPillowStatus = function() {
	// 向蓝牙设备发送一个0x00的2进制数据

	// 向蓝牙设备发送一个0x00的2进制数据
	let littleEdition = true
	const buffer = new ArrayBuffer(8)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4,5
	dataView.setUint8(0, 5)
	dataView.setUint8(1, 0x0079)
	// （1——正卧设置，数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0）
	dataView.setUint8(2, 0)
	dataView.setUint8(3, 0)
	dataView.setUint8(4, 0)
	dataView.setUint8(5, 0)
	dataView.setUint8(6, 0)
	dataView.setUint8(7, 0)
	return buffer
}
// 设置用户初始值
var handleUserInitData = function(headHeight, neckHeight, shoulderWidth, sideHead, sideNeckHeight,
	sideNeckWidth) {
	// 数据1－正卧头部气囊高度值（U8），数据2－正卧颈部气囊高度值（U8），数据3－正卧肩宽值（U16）数据4－侧卧头部气囊高度值（U8），数据5－侧卧颈部气囊高度值（U8），数据6－侧卧肩宽值（U16）
	const buffer = new ArrayBuffer(6)
	const dataView = new DataView(buffer)
	// 指令码；1：2,3,4,5
	dataView.setUint8(0, headHeight)
	dataView.setUint8(1, neckHeight)
	// （1——正卧设置，数据1－头部气囊值，数据2－颈部气囊值，数据3－暂为0）
	dataView.setUint8(2, shoulderWidth)
	dataView.setUint8(3, sideHead)
	dataView.setUint8(4, sideNeckHeight)
	dataView.setUint8(5, sideNeckWidth)
	return buffer
}
// 增加数据长度
var handleSendFormart = function(buffer) {
	let length = buffer.byteLength;
	console.log('[handleSendFormart] buffer', length);
	const n_buffer = new ArrayBuffer(length + 1)
	const dataView = new DataView(n_buffer)
	// 写入长度
	dataView.setUint8(0, length)
	const origan_buffer = new DataView(buffer);
	for (var index = 0; index < length; index++) {
		console.log('[handleSendFormart] setUint8', index, origan_buffer.getUint8(index));
		dataView.setUint8(index + 1, origan_buffer.getUint8(index))
	}
	console.log('[handleSendFormart] n_buffer', n_buffer);
	return n_buffer
}

var write2tooth = async function(deviceId, serviceId, characteristicId, buffer) {
	return new Promise((resolve, reject) => {
		console.log('write2tooth,deviceId:,', deviceId, ',serviceId:,' + serviceId,
			',characteristicId:,' + characteristicId)
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
				resolve(res)
				console.log('writeBLECharacteristicValue success', res)
			},
			fail() {
				reject()
			}
		})
	});
}

var ab2str = function(buf) {
	return String.fromCharCode.apply(null, new Uint16Array(buf));
}

var str2ab = function(str) {
	var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
	var bufView = new Uint16Array(buf);
	for (var i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

var write2toothstr = async function(deviceId, serviceId, characteristicId, buffer) {
	return new Promise((resolve, reject) => {
		console.log('write2tooth,deviceId:,', deviceId, ',serviceId:,' + serviceId,
			',characteristicId:,' + characteristicId)
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
				resolve(res)
				console.log('writeBLECharacteristicValue success', res)
			},
			fail() {
				reject()
			}
		})
	});
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

// 解析枕头状态
var parsePillowRealState = function(arraybuffer) {
	// （0~1：0x6037；2:正卧头部气囊值；3：正卧颈部气囊值；4~5：延时值；6：侧卧头部气囊值；7：侧卧颈部气囊值；））。
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
	// 正卧头部气囊值
	let head = dataView.getUint8(2)
	// 正卧颈部气囊值；
	let neck = dataView.getUint8(3)
	let time = dataView.getUint16(4)
	// 侧卧头部气囊值
	let sideHead = dataView.getUint8(6)
	// 侧卧颈部气囊值；
	let sideNeck = dataView.getUint8(7)
	return {
		'one': one,
		'head': head,
		'neck': neck,
		'sideHead': sideHead,
		'sideNeck': sideNeck,
		'time': time,
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

// 生成第一步握手数据
var uploadDataRequest = function(mark) {
	// 向蓝牙设备发送一个0x00的2进制数据
	// 11. APP收到设备ID后，发送10个字节的应答（0：0；1：设备ID的校验和；2~5：APP-ID；6~9：当前时间（T4））
	let littleEdition = true
	const buffer = new ArrayBuffer(9)
	const dataView = new DataView(buffer)
	dataView.setUint8(0, 1)
	let time = handleTime(Date.now() - 3600 * 24)
	const dataView_time = new DataView(time);
	dataView.setUint8(1, dataView_time.getUint8(0))
	dataView.setUint8(2, dataView_time.getUint8(1))
	dataView.setUint8(3, dataView_time.getUint8(2))
	dataView.setUint8(4, dataView_time.getUint8(3))
	let time_end = handleTime(Date.now())
	const dataView_time_end = new DataView(time_end);
	dataView.setUint8(5, dataView_time_end.getUint8(0))
	dataView.setUint8(6, dataView_time_end.getUint8(1))
	dataView.setUint8(7, dataView_time_end.getUint8(2))
	dataView.setUint8(8, dataView_time_end.getUint8(3))

	let uploadLengthBuffer = handleSendFormart(buffer);
	console.log("[uploadDataRequest] withLengthBuffer", ab2hex(uploadLengthBuffer), uploadLengthBuffer.byteLength)
	let write_buffer = handleMarkSend(mark, uploadLengthBuffer)
	console.log("[uploadDataRequest222] uploadLengthBuffer", ab2hex(write_buffer))
	return write_buffer
}
//增加指令头
var handleMarkSend = function(mark, buffer) {
	const orign_buffer_view = new DataView(buffer)
	const write_buffer = new ArrayBuffer(buffer.byteLength + 1)
	const write_dataView = new DataView(write_buffer)
	// 指令码；1：2,3,4 5--上报数据
	write_dataView.setUint8(0, mark)
	for (var index = 0; index < buffer.byteLength; index++) {
		write_dataView.setUint8(index + 1, orign_buffer_view.getUint8(index))
	}
	return write_buffer;
}

// 重置校准
var resetPillow = function(mark) {
	console.log('[handleresetPillow] buffer');
	const n_buffer = new ArrayBuffer(4)
	const dataView = new DataView(n_buffer)
	// 写入长度
	dataView.setUint16(0, 0xAA55)
	dataView.setUint16(2, 0x07E8)
	let withLengthBuffer = handleSendFormart(n_buffer);
	return handleMarkSend(mark, withLengthBuffer)
}

// 重启
var restartPillow = function(mark) {
	console.log('[handlerestartPillowrestartPillow] buffer');
	const n_buffer = new ArrayBuffer(0)
	const dataView = new DataView(n_buffer)
	let withLengthBuffer = handleSendFormart(n_buffer);
	return handleMarkSend(mark, withLengthBuffer)
}
// 初始数据校准
var initPillow = function(head, neck, width, sideHead, sideNexck, sideWidth) {
	// 2——用户卧姿参数设置，数据1－正卧头部气囊高度值（U8），数据2－正卧颈部气囊高度值（U8），数据3－正卧肩宽值（U16）数据4－侧卧头部气囊高度值（U8），数据5－侧卧颈部气囊高度值（U8），数据6－侧卧肩宽值（U16）
	console.log('[initPillow] buffer', head, neck, width, sideHead, sideNexck, sideWidth);

	const data_buffer = new ArrayBuffer(8);
	const dataBufferView = new DataView(data_buffer);
	// 0--头部气囊，1--颈部气囊）
	dataBufferView.setUint8(0, head);
	dataBufferView.setUint8(1, neck);
	dataBufferView.setUint16(2, width);
	dataBufferView.setUint8(4, sideHead);
	dataBufferView.setUint8(5, sideNexck);
	dataBufferView.setUint16(6, sideWidth);
	let withLengthBuffer = handleSendFormart(data_buffer)
	console.log("[initPillow] withLengthBuffer", ab2hex(withLengthBuffer))
	let return_buffer = handleMarkSend(2, withLengthBuffer)
	console.log("[initPillow] return_buffer", ab2hex(return_buffer))
	// 指令码；1：模式设置2,用户卧姿参数设置
	return return_buffer
}

/**
 * uni跳转参数转化
 * @param {Object} obj
 */
var object2Query = function(obj) {
	let result = '?';
	Object.keys(obj).forEach(key => {
		let value = obj[key] || obj[key] === 0 || obj[key] === '0' ? obj[key] : ''
		result = result + key + '=' + encodeURIComponent(value) + '&';
	});
	console.log('object2Query:', obj, result)
	return result;
}
// 根据正面拍出来的数据，计算侧卧数据
var sideParseByShooting = function(obj) {
	// 头枕:  (肩宽-头宽) / 2
	// 脖枕: ( 肩宽- 男性 10,女性 8.5) / 2
	let params = {
		head: 0,
		neck: 0,
	}

	params.head = (obj.shoulderWidth - obj.headWidth) * 0.5
	params.neck = (obj.shoulderWidth - 10) * 0.5
	return params;
}
// 根据侧面拍出图片来计算仰卧数据
var frontParseByShooting = function(obj) {
	// 仰卧高度计算: (侧面图来计算):  
	//  头枕:(后背点与后脑勺的点距离来计算)  如果低于枕头最低数值就取最低数值
	//  脖枕: 颈部凹点与后脑勺点的距离来计算

	let params = {
		head: 0,
		neck: 0,
	}
	params.head = obj.head
	params.neck = obj.neck
	return params;
}

var saveRandomMode = function(obj) {
	let params = {
		name: obj.name ? obj.name : 'mode',
		headHeight: obj.headHeight,
		neckHeight: obj.neckHeight,
		sideHeadHeight: obj.sideHeadHeight,
		sideNeckHeight: obj.sideNeckHeight,
	}
	let storageObj = uni.getStorageSync('myMode');
	if (!storageObj) {
		storageObj = []
	} else {
		storageObj = JSON.parse(storageObj)
	}
	// 监测名称重复
	let item = null
	for (var index in storageObj) {
		if (storageObj[index] && storageObj[index].name == params.name) {
			item = storageObj[index]
			storageObj[index] = params;
			console.log("check:", storageObj[index], params, item)
			break;
		}
	}
	// params.name = 'mode_' + Math.floor(Math.random() * 1000) / 1000
	// 存储数据
	// storageObj.push(params)
	if (!item) {
		storageObj.push(params)
	}
	uni.setStorageSync('myMode', JSON.stringify(storageObj));
	if (item) {
		return false;
	}
	return true;
}

var getAIModeByName = function(name) {
	let storageObj = uni.getStorageSync('myAIMode');
	if (!storageObj) {
		storageObj = []
	} else {
		storageObj = JSON.parse(storageObj)
	}

	let item;
	for (var index in storageObj) {
		if (storageObj[index] && storageObj[index].name == name) {
			item = storageObj[index]
			break;
		}
	}

	return item;
}
// 保存ai模式
var saveAIMode = function(params) {
	let name = params.name;
	let storageObj = uni.getStorageSync('myAIMode');
	if (!storageObj) {
		storageObj = []
	} else {
		storageObj = JSON.parse(storageObj)
	}

	let item
	for (var index in storageObj) {
		if (storageObj[index] && storageObj[index].name == name) {
			item = storageObj[index]
			storageObj[index] = params;
			break;
		}
	}
	if (!item) {
		storageObj.push(params)
	}

	uni.setStorageSync('myAIMode', JSON.stringify(storageObj));
}

var sendModeByName = function(name) {
	let storageObj = uni.getStorageSync('myMode');
	if (!storageObj) {
		storageObj = []
	} else {
		storageObj = JSON.parse(storageObj)
	}
	let item
	for (var index in storageObj) {
		if (storageObj[index] && storageObj[index].name == name) {
			item = storageObj[index]
			break;
		}
	}
	// 如果有数据，默认调整枕头 限制最高高度不能超过100mm！！！！！！！！！！！
	let init_arraybuffer = initPillow(item.headHeight > 100 ? 100 : item.headHeight, item
		.neckHeight > 100 ? 100 : item.neckHeight, 100, item.sideHeadHeight > 100 ? 100 : item.sideHeadHeight,
		item
		.sideNeckHeight >
		100 ?
		100 :
		item.sideNeckHeight, 100);
	blue_class.getInstance().write2tooth(init_arraybuffer);
	return true;
}
export {
	object2Query,
	saveRandomMode,
	sideParseByShooting,
	parsePillowRealState,
	handPillowStatus,
	handPillowSideState,
	parsePillowState,
	hexCharCodeToStr,
	handlePillowDelayState,
	hexStringToArrayBuffer,
	hand1Shake,
	write2tooth,
	ab2hex,
	resetPillow,
	formatTime,
	formatLocation,
	handPillowState,
	handPillowFrontState,
	handleUserInitData,
	changeAdjustMode,
	changeSaveAdjustMode,
	handleSendFormart,
	uploadDataRequest,
	write2toothstr,
	restartPillow,
	initPillow,
	appAnswer,
	parseTime,
	ab2str,
	str2ab,
	saveAIMode,
	sendModeByName,
	getAIModeByName,
	dateUtils
}