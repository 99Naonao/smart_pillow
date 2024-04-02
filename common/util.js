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
var handlePillowDelayState = function() {
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


export {
	formatTime,
	formatLocation,
	handPillowState,
	handPillowFrontState,
	dateUtils
}