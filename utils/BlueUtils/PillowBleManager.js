import BluePillowProtocol, {
	crc16Modbus
} from './bluepillow-protocol.js';
import {
	logPillowStatus0x04Debug
} from '@/common/ble04Debug.js';
import {
	stopSpineAdjustSession
} from '@/common/spineSession.js';
import {
	canBypassBleConnectInCurrentEnv
} from '@/common/envBypass.js';

/**0x02/0x03高度窗口配置，统一放到当前类，外部BlueUtils引入使用，避免分包重复引入报错 */
export const PILLOW_PROFILE_HEIGHT_WINDOW = 10

export function pillowProfileHeightWindows() {
	const w = Math.max(0, Math.min(65535, PILLOW_PROFILE_HEIGHT_WINDOW))
	return {
		headWindow: w,
		neckWindow: w
	}
}

/**上传帧包头标识 */
const UPLOAD_MAGIC = 0xaa;

/**0x01设备固件版本本地缓存key，按自然日缓存，避免频繁重读设备 */
const FIRMWARE_CACHE_STORAGE_KEY = 'pillow_firmware_cache';

function localCalendarYmd() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function persistFirmwareCacheFromDeviceInfo(p) {
	if (!p || !p.ok) {
		return;
	}
	try {
		uni.setStorageSync(FIRMWARE_CACHE_STORAGE_KEY, {
			day: localCalendarYmd(),
			versionDisplay: p.versionDisplay,
			versionRaw: p.versionRaw
		});
	} catch (e) {
		console.warn('[PillowBleManager] persistFirmwareCache', e);
	}
}

/**读取本地缓存的固件版本（收到0x01设备信息后写入）
 * @returns {{ day: string, versionDisplay: string, versionRaw: number } | null}
 */
export function readFirmwareVersionCache() {
	try {
		const c = uni.getStorageSync(FIRMWARE_CACHE_STORAGE_KEY);
		if (!c || typeof c !== 'object') {
			return null;
		}
		if (!c.versionDisplay && (c.versionRaw === undefined || c.versionRaw === null)) {
			return null;
		}
		return c;
	} catch (e) {
		return null;
	}
}

/**固件原始值换算：除以10展示，例：0x0A=1.0 */
export function formatFirmwareVersionFromRaw(versionRaw) {
	if (versionRaw === undefined || versionRaw === null || versionRaw === 0) {
		return '';
	}
	return (Number(versionRaw) / 10).toFixed(1);
}

/**解析设备主动上传整包数据
 * @param {ArrayBuffer} buffer
 * @returns {{ ok: true, func: number, data: Uint8Array, crcOk: true } | { ok: false, error: string, func?: number }}
 */
export function parsePillowUploadFrame(buffer) {
	const u8 = new Uint8Array(buffer);
	if (u8.length < 6) {
		return {
			ok: false,
			error: 'frame_too_short'
		};
	}
	if (u8[0] !== UPLOAD_MAGIC) {
		return {
			ok: false,
			error: 'bad_magic',
			detail: u8[0]
		};
	}
	const view = new DataView(buffer);
	const bodyLen = view.getUint16(1, true);
	if (bodyLen < 1) {
		return {
			ok: false,
			error: 'bad_body_len'
		};
	}
	const totalNeed = 1 + 2 + bodyLen + 2;
	if (u8.length < totalNeed) {
		return {
			ok: false,
			error: 'frame_truncated',
			need: totalNeed,
			got: u8.length
		};
	}
	const crcTarget = u8.subarray(3, 3 + bodyLen);
	const crcStored = view.getUint16(3 + bodyLen, true);
	const crcCalc = crc16Modbus(crcTarget);
	if (crcStored !== crcCalc) {
		return {
			ok: false,
			error: 'crc_mismatch',
			crcStored,
			crcCalc,
			func: u8[3]
		};
	}
	const func = u8[3];
	const data = u8.subarray(4, 3 + bodyLen);
	return {
		ok: true,
		func,
		data,
		crcOk: true
	};
}

export function parseWriteAckPayload(data) {
	if (!data || data.length < 1) {
		return {
			ok: false,
			error: 'empty'
		};
	}
	if (data.length === 1) {
		return {
			success: data[0] === 0,
			code: data[0]
		};
	}
	return {
		success: data[1] === 0,
		code: data[1],
		funcEcho: data[0]
	};
}

/**0x09脊柱调节下发/应答固定长度11字节 */
export const SPINE_ADJUST_DATA_LEN = 11;

/**解析0x09脊柱调节数据包
 * @param {Uint8Array|ArrayBuffer} data
 */
export function parseSpineAdjustPayload(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (u.length < SPINE_ADJUST_DATA_LEN) {
		return {
			ok: false,
			error: 'bad_len_0x09',
			need: SPINE_ADJUST_DATA_LEN,
			got: u.length,
		};
	}
	const view = new DataView(u.buffer, u.byteOffset, u.byteLength);
	let o = 0;
	const headHeightPct = view.getUint16(o, true);
	o += 2;
	const neckHeightPct = view.getUint16(o, true);
	o += 2;
	const neckRelaxPct = view.getUint16(o, true);
	o += 2;
	const times = u[o] & 0xff;
	o += 1;
	const holdTime1 = view.getUint16(o, true);
	o += 2;
	const holdTime2 = view.getUint16(o, true);
	return {
		ok: true,
		headHeightPct,
		neckHeightPct,
		neckRelaxPct,
		times,
		holdTime1,
		holdTime2,
	};
}

/**0x89脊柱剩余次数上报解析，字段和0x09下发完全一致
 * @returns {{ spineRemainTimes: number, spineAdjust: ReturnType<typeof parseSpineAdjustPayload> | null }}
 */
export function resolveSpineReadRemainTimes(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (!u.length) {
		return {
			spineRemainTimes: 0,
			spineAdjust: null
		};
	}
	let buf = u;
	if (u.length === 10) {
		buf = new Uint8Array(SPINE_ADJUST_DATA_LEN);
		buf.set(u);
	}
	if (buf.length < SPINE_ADJUST_DATA_LEN) {
		const spineRemainTimes = u.length >= 7 ? u[6] & 0xff : u[0] & 0xff;
		return {
			spineRemainTimes,
			spineAdjust: null
		};
	}
	const p = parseSpineAdjustPayload(buf);
	if (!p.ok) {
		return {
			spineRemainTimes: 0,
			spineAdjust: null
		};
	}
	let n = p.times & 0xff;
	if (n === 0 && p.holdTime1 > 0 && p.holdTime1 <= 255) {
		n = p.holdTime1;
	}
	if (n === 0 && p.holdTime1 > 255) {
		const lo = p.holdTime1 & 0xff;
		const hi = (p.holdTime1 >> 8) & 0xff;
		if (hi !== 0) {
			n = hi;
		} else if (lo !== 0) {
			n = lo;
		}
	}
	if (n === 0 && buf.length > 8) {
		const b8 = buf[8] & 0xff;
		if (b8 !== 0) {
			n = b8;
		}
	}
	return {
		spineRemainTimes: n,
		spineAdjust: p
	};
}

export function parseDeviceInfoPayload(data) {
	if (!data || data.length < 1) {
		return {
			ok: false,
			error: 'too_short'
		};
	}
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	const versionRaw = u[0] & 0xff;
	const serial = Array.from(u.subarray(1, 7));
	return {
		ok: true,
		versionRaw,
		versionDisplay: (Number(versionRaw) / 10).toFixed(1),
		serial
	};
}

/**0x04设备状态上报固定21字节 */
const PILLOW_0x04_DATA_LEN = 21;

/**解析0x04枕头状态上报数据 */
export function parsePillowStatusPayload(data) {
	if (!data || data.length < PILLOW_0x04_DATA_LEN) {
		return {
			ok: false,
			error: 'bad_len_0x04',
			need: PILLOW_0x04_DATA_LEN,
			got: data ? data.length : 0
		};
	}
	const u = data instanceof Uint8Array ? data : new Uint8Array(data);
	const view = new DataView(u.buffer, u.byteOffset, u.byteLength);
	let o = 0;
	const workState = u[o++];
	const fault1 = u[o++];
	const fault2 = u[o++];
	const pump1 = u[o++];
	const pump2 = u[o++];
	const heatTemp = u[o++];
	const deviceStatus = u[o++];
	const heatingOn = ((deviceStatus >> 3) & 1) === 1;
	const rtc = [];
	for (let i = 0; i < 6; i++) {
		rtc.push(u[o++]);
	}
	const pressure1 = view.getUint16(o, true);
	o += 2;
	const pressure2 = view.getUint16(o, true);
	o += 2;
	const headHeightPct = Math.max(0, Math.min(100, view.getUint16(o, true)));
	o += 2;
	const neckHeightPct = Math.max(0, Math.min(100, view.getUint16(o, true)));
	o += 2;
	return {
		ok: true,
		workState,
		fault1,
		fault2,
		pump1,
		pump2,
		heatTemp,
		/**设备状态位 bit0~2气泵 bit3加热标记 */
		deviceStatus,
		/**兼容旧字段 */
		valveBits: deviceStatus,
		heatingOn,
		posture: [],
		rtc,
		pressure1Kpa: pressure1 / 100,
		pressure2Kpa: pressure2 / 100,
		pressure1Raw: pressure1,
		pressure2Raw: pressure2,
		headHeightPct,
		neckHeightPct
	};
}

/**0x0C参数读取应答6字节 */
const PILLOW_0x0C_DATA_LEN = 6;

/**解析0x0C配置参数 */
export function parsePillowParams0x0CPayload(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (!u.length || u.length < PILLOW_0x0C_DATA_LEN) {
		return {
			ok: false,
			error: 'bad_len_0x0c',
			need: PILLOW_0x0C_DATA_LEN,
			got: u.length
		};
	}
	const view = new DataView(u.buffer, u.byteOffset, u.byteLength);
	let o = 0;
	const stabilitySeconds = view.getUint16(o, true);
	o += 2;
	const headPressureHoldMs = view.getUint16(o, true);
	o += 2;
	const neckPressureHoldMs = view.getUint16(o, true);
	return {
		ok: true,
		stabilitySeconds,
		headPressureHoldMs,
		neckPressureHoldMs
	};
}

/**0x0B体态传感器数据最小长度 */
const POSTURE_0x0B_MIN_LEN = 16 * 2 + 16 + 16 * 2;

export function parsePostureSensor0x0BPayload(data) {
	if (!data || data.length < POSTURE_0x0B_MIN_LEN) {
		return {
			ok: false,
			error: 'too_short',
			need: POSTURE_0x0B_MIN_LEN,
			got: data ? data.length : 0
		};
	}
	const u = data instanceof Uint8Array ? data : new Uint8Array(data);
	const view = new DataView(u.buffer, u.byteOffset, u.byteLength);
	let o = 0;
	const limit16 = [];
	for (let i = 0; i < 16; i++) {
		limit16.push(view.getUint16(o, true));
		o += 2;
	}
	const validFlags = [];
	for (let i = 0; i < 16; i++) {
		validFlags.push(u[o++]);
	}
	const postureSamples = [];
	for (let i = 0; i < 16; i++) {
		postureSamples.push(view.getUint16(o, true));
		o += 2;
	}
	/**有效点位数量统计 */
	const validPointCount = Math.min(
		255,
		validFlags.reduce((n, x) => n + (x ? 1 : 0), 0)
	);
	return {
		ok: true,
		limit16,
		validFlags,
		postureSamples,
		validPointCount
	};
}

/**0x07学习模式应答解析 */
export function parseLearnPosture0x07Payload(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (!u.length) {
		return {
			ok: false,
			error: 'empty'
		};
	}
	if (u.length < 3) {
		return {
			ok: false,
			error: 'too_short',
			need: 3,
			got: u.length
		};
	}
	const base = {
		ok: true,
		mode: u[0] & 0xff,
		state: u[1] & 0xff,
		postureValidLimit: u[2] & 0xff,
	};
	if (u.length < 11) {
		return base;
	}
	const view = new DataView(u.buffer, u.byteOffset, u.byteLength);
	return {
		...base,
		supinePeak1: view.getUint16(3, true),
		supinePeak2: view.getUint16(5, true),
		supineWidth: u[7] & 0xff,
		sidePeak: view.getUint16(8, true),
		sideWidth: u[10] & 0xff,
	};
}

/**0x10头部调试参数 */
export function parseHeadParams0x10Payload(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (u.length < 2) {
		return {
			ok: false,
			error: 'too_short',
			need: 2,
			got: u.length
		};
	}
	return {
		ok: true,
		debugMode: u[0] & 0xff,
		sleepState: u[1] & 0xff,
	};
}

/**0x11单点校准数据长度 */
const CALIBRATION_0x11_DATA_LEN = 7;

export function parseCalibrationCorrect0x11Payload(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (u.length < CALIBRATION_0x11_DATA_LEN) {
		return {
			ok: false,
			error: 'bad_len_0x11',
			need: CALIBRATION_0x11_DATA_LEN,
			got: u.length,
		};
	}
	const view = new DataView(u.buffer, u.byteOffset, u.byteLength);
	let o = 0;
	const nodeIndex = u[o++] & 0xff;
	const levelData = view.getUint16(o, true);
	o += 2;
	const inflateCorrect = view.getInt16(o, true);
	o += 2;
	const deflateCorrect = view.getInt16(o, true);
	return {
		ok: true,
		nodeIndex,
		levelData,
		inflateCorrect,
		deflateCorrect,
	};
}

class PillowBleManager {
	static instance = null;
	static _connectionStateListenerBound = false;

	static getInstance() {
		if (!PillowBleManager.instance) {
			PillowBleManager.instance = new PillowBleManager();
			PillowBleManager.instance.registerNotifyDataPipelineOnce();
		}
		return PillowBleManager.instance;
	}

	// 设备状态字段
	pillowHeight = 80;
	pillowSideHeight = 80;
	pillowPower = 0;
	pillowPlasticHead = 0;
	pillowPlasticNeck = 0;
	pillowStatus = 0;
	chargingStatus = 0;
	manualDisconnecting = false;
	isSpineAdjusting = false;
	/**脊柱倒计时轮询定时器 */
	_spineRemainTimesPollTimer = null;
	/**脊柱剩余次数查询间隔ms */
	SPINE_REMAIN_TIMES_POLL_MS = 15000;
	deviceIdList = [];
	/**最近一次0x04枕头状态缓存 */
	lastPillowStatus0x04 = null;

	constructor() {
		this.bluetoothStatus = null;
		this.isNotify = false;
		this.notifyCount = 0;
		this.serviceId = '';
		this.deviceName = '';
		this.version = 0;
		this.characteristicId = '6E400004-B5A3-F393-E0A9-E50E24DCCA9E';
		this.deviceId = '';
		this.loginSuccess = false;
		this.pillowStatus = 0;

		if (!PillowBleManager._connectionStateListenerBound) {
			PillowBleManager._connectionStateListenerBound = true;
			uni.onBLEConnectionStateChange(function(res) {
					const that = PillowBleManager.getInstance();
					console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
					if (res.connected) {
						//只监听当前连接设备，过滤其他蓝牙设备连接干扰
						if (that.deviceId && res.deviceId == that.deviceId) {
							console.log('蓝牙物理连接成功');
							that.manualDisconnecting = false;
							uni.$emit('bluetooth_status_change');
						} else {
							console.log('忽略非目标设备连接:', res.deviceId, 'target=', that.deviceId);
						}
						return;
					}
					if (res.deviceId == that.deviceId) {
						if (res.connected) {
							console.log('蓝牙连接成功');
							that.manualDisconnecting = false;
							uni.$emit('bluetooth_status_change');
						} else {
							console.log('蓝牙断开');
							that._stopSpineRemainTimesPoll();
							that.loginSuccess = false;
							that.deviceId = '';
							that.deviceName = '';
							uni.$emit('bluetooth_status_change');

							if (!that.manualDisconnecting) {
								const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
								const cur = pages && pages.length ? pages[pages.length - 1] : null;
								const route = cur && cur.route ? String(cur.route) : '';
								const isOnHome = route === 'pages/status/status';
								uni.showModal({
										title: '蓝牙断开提示',
										content: isOnHome ? '设备蓝牙意外断开，请重新连接蓝牙' : '设备蓝牙意外断开，是否返回首页重新连接？',
										showCancel: !isOnHome,
										cancelText: '稍后',
										confirmText: isOnHome ? '确定' : '回到首页',
										success: (r) => {
											if (r.confirm && !isOnHome) {
												uni.switchTab({
													url: '/pages/status/status'
												});
											} else if (r.cancel) {
												console.log('用户选择稍后处理');
											}
										}});
								}
								else {
									console.log('手动断开，不弹异常提示');
								}
								that.manualDisconnecting = false;
							}
						}
					});
			}
		}


		setPillowStatus(value) {
			this.pillowStatus = value;
		}
		getPillowStatus() {
			return this.pillowStatus;
		}

		setManualDisconnecting(value) {
			this.manualDisconnecting = !!value;
		}
		getManualDisconnecting() {
			return this.manualDisconnecting;
		}

		setSpineAdjusting(value) {
			this.isSpineAdjusting = !!value;
			if (this.isSpineAdjusting) {
				this._startSpineRemainTimesPoll();
			} else {
				this._stopSpineRemainTimesPoll();
			}
		}
		getSpineAdjusting() {
			return this.isSpineAdjusting;
		}

		/**下发0x89查询脊柱剩余次数 */
		readSpineAdjustCount(opt) {
			const buf = BluePillowProtocol.readSpineAdjust();
			const hex = this.ab2hex(buf);
			console.log('[脊柱查询0x89] hex=' + hex);
			return this.send(buf, Object.assign({
				silent: true
			}, opt || {}));
		}

		_startSpineRemainTimesPoll() {
			this._stopSpineRemainTimesPoll();
			const tick = () => {
				if (!this.isSpineAdjusting || !this.loginSuccess || !this.deviceId) {
					return;
				}
				this.readSpineAdjustCount({
					silent: true
				});
			};
			this._spineRemainTimesPollTimer = setInterval(tick, this.SPINE_REMAIN_TIMES_POLL_MS);
		}

		_stopSpineRemainTimesPoll() {
			if (this._spineRemainTimesPollTimer) {
				clearInterval(this._spineRemainTimesPollTimer);
				this._spineRemainTimesPollTimer = null;
			}
		}

		setPillowCharging(value) {
			this.chargingStatus = value;
			console.log('PillowCharging:', this.chargingStatus);
		}

		setPillowPlasticStatus(head_status, neck_status) {
			this.pillowPlasticNeck = neck_status;
			this.pillowPlasticHead = head_status;
			console.log('setPillowPlasticStatus:', this.pillowPlasticNeck);
		}

		getPillowCharging() {
			return this.chargingStatus;
		}

		setPillowHeight(value) {
			this.pillowHeight = value;
			console.log('setPillowHeight:', this.pillowHeight);
		}

		getPillowHeight() {
			console.log('getPillowHeight:', this.pillowHeight);
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
			uni.$emit('update_pillow_info');
		}
		getPillowSpineTime() {
			return this.pillowSpineTime;
		}
		setPillowSpineTime(value) {
			this.pillowSpineTime = value;
			uni.$emit('update_pillow_spine_time');
		}

		getPillowPower() {
			return this.pillowPower;
		}

		initBluetoothAdapter() {
			uni.openBluetoothAdapter({
				success: (res) => {
					console.log('蓝牙适配器初始化成功', res);
					this.bluetoothStatus = 'open';
				},
				fail: (err) => {
					console.error('蓝牙适配器初始化失败', err);
					this.bluetoothStatus = 'error';
				}
			});
		}

		ab2hex(buffer) {
			const hexArr = Array.prototype.map.call(new Uint8Array(buffer), function(bit) {
				return ('00' + bit.toString(16)).slice(-2);
			});
			return hexArr.join('');
		}

		/**只注册一次notify监听，防止重复绑定 */
		registerNotifyDataPipelineOnce() {
			if (this._notifyPipelineBound) {
				return;
			}
			this._notifyPipelineBound = true;
			this._notifyValueHandler = (res) => {
				const arrayBuffer = new Uint8Array(res.value);
				const rxHex = this.ab2hex(res.value);
				console.log('[BLE接收设备数据] len=' + arrayBuffer.length + ' hex=' + rxHex);
				try {
					const buf = res && res.value;
					if (buf) {
						const parsed = this.handleNotifyBuffer(buf);
						if (parsed && parsed.type === 'pillow_status') {
							const p = parsed.parsed;
							if (p && p.ok) {
								if (typeof p.workState === 'number') {
									this.setPillowStatus(p.workState);
								}
								this.setPillowHeight(p.headHeightPct);
								this.setPillowSideHeight(p.neckHeightPct);
								uni.$emit('update_pillow_info');
							}
							const rawHex = this.ab2hex(buf);
							this.lastPillowStatus0x04 = {
								ts: Date.now(),
								rawHex,
								parsed: parsed.parsed,
								rawFrame: parsed.raw
							};
							uni.$emit('pillow_status_0x04', this.lastPillowStatus0x04);
							logPillowStatus0x04Debug(this.lastPillowStatus0x04);
						} else if (parsed && parsed.type === 'device_info') {
							const p = parsed.parsed;
							if (p && p.ok) {
								this.updateVersion(p.versionRaw);
								persistFirmwareCacheFromDeviceInfo(p);
								uni.$emit('pillow_firmware_version', {
									versionDisplay: p.versionDisplay,
									versionRaw: p.versionRaw
								});
							}
						} else if (parsed && parsed.type === 'spine_adjust_read') {
							const p = parsed.parsed;
							const spineRxHex = this.ab2hex(buf);
							console.log('[脊柱0x89上报] rawHex=' + spineRxHex + ' 剩余次数=' + (p && typeof p
								.spineRemainTimes === 'number' ? p.spineRemainTimes : '?'));
							if (p && p.spineAdjust && p.spineAdjust.ok) {
								console.log('[脊柱数据]', p.spineAdjust);
							}
							if (
								p &&
								typeof p.spineRemainTimes === 'number' &&
								p.spineRemainTimes === 0 &&
								this.isSpineAdjusting
							) {
								stopSpineAdjustSession({
									reason: 'device_times_zero',
									emit: true
								});
							}
						}
					}
				} catch (e) {
					console.warn('[PillowBleManager] notify解析异常', e);
				}
				uni.$emit('xx', res);
			};
			uni.onBLECharacteristicValueChange(this._notifyValueHandler);
		}

		/**重绑notify（重连蓝牙用，避免多次onBLECharacteristicValueChange） */
		forceRebindNotifyDataPipeline() {
			try {
				if (typeof uni.offBLECharacteristicValueChange === 'function' && this._notifyValueHandler) {
					uni.offBLECharacteristicValueChange(this._notifyValueHandler);
				}
			} catch (e) {
				console.warn('[PillowBleManager] offBLECharacteristicValueChange', e);
			}
			this._notifyPipelineBound = false;
			this.registerNotifyDataPipelineOnce();
		}

		/**获取上次0x04状态缓存 */
		getLastPillowStatus0x04() {
			return this.lastPillowStatus0x04;
		}

		updateDeviceName(dname) {
			this.deviceName = dname;
		}
		updateVersion(v) {
			this.version = v;
		}

		/**上次断开脊柱指令补发 */
		_flushPendingSpineEndAfterLaunch() {
			try {
				const pending = uni.getStorageSync('spine_pending_end');
				if (!pending) {
					return;
				}
				this.write2tooth(BluePillowProtocol.spineAdjust({
					headHeight: 0,
					neckHeight: 0,
					neckRelaxHeight: 0,
					times: 0,
					holdTime1: 0,
					holdTime2: 0
				}));
				uni.removeStorageSync('spine_pending_end');
				this.setSpineAdjusting(false);
				try {
					uni.removeStorageSync('spine_micro_session');
				} catch (e) {}
			} catch (e) {
				console.warn('[PillowBleManager] _flushPendingSpineEndAfterLaunch', e);
			}
		}

		parsePillowStatus(arraybuffer) {
			const receive16 = this.ab2hex(arraybuffer);
			const status = receive16.slice(0, 2);
			const status10 = parseInt('0x' + status);
			switch (status10) {
				case 0:
					console.log('枕头空闲');
					break;
				case 1:
					console.log('枕头充气');
					break;
				case 2:
					console.log('枕头放气');
					break;
			}
			const detail_status_16 = receive16.slice(2, 4);
			const detail_status = '0x' + detail_status_16;
			const n1 = detail_status & 0x01;
			switch (n1) {
				case 0:
					console.log('气泵关闭');
					break;
				case 1:
					console.log('气泵开启');
					break;
			}
			const n2 = (detail_status >> 2) & 0x01;
			const n3 = (detail_status >> 3) & 0x01;
			const n4 = (detail_status >> 4) & 0x01;
			const n5 = (detail_status >> 5) & 0x01;
			const n6 = (detail_status >> 6) & 0x01;
			const n7 = (detail_status >> 7) & 0x01;

			const headHeight = receive16.slice(4, 6);
			const headHeight10 = parseInt('0x' + headHeight);
			const neckHeight = receive16.slice(6, 8);
			const neckHeight10 = parseInt('0x' + neckHeight);
			const vesrion = receive16.slice(8, 10);
			const vesrion10 = parseInt('0x' + vesrion);
			const isright = receive16.slice(10, 12);
			const isright10 = parseInt('0x' + isright);
			const press = receive16.slice(12, 16);
			const press10 = parseInt('0x' + press);
			const plastic_status = receive16.slice(16, 18);
			const plastic_status16 = '0x' + plastic_status;
			const plastic_status10 = parseInt(plastic_status16);

			const plastic_n1 = plastic_status10 & 0x01;
			const plastic_n2 = (plastic_status10 >> 2) & 0x01;
			console.log('头部气阀:', plastic_n1);
			console.log('颈部气阀:', plastic_n2);

			const spine_status = receive16.slice(18, 20);
			const spine_status16 = '0x' + spine_status;
			const spine_status10 = parseInt(spine_status16);
			console.log('脊柱剩余秒数:', spine_status10);

			this.setPillowPlasticStatus(plastic_n1, plastic_n2);
			this.setPillowCharging(n1);
			this.setPillowHeight(headHeight10);
			this.setPillowSideHeight(neckHeight10);
			this.setPillowPower(press10);
			this.setPillowSpineTime(spine_status10);
			console.log(
				'work状态:', status10,
				'head:' + headHeight10 + 'mm',
				'neck:' + neckHeight10 + 'mm',
				'version:' + vesrion10,
				'校准:' + isright10,
				'压力:' + press10
			);
		}

		/**开启notify成功后才可下发指令 */
		startNotice(uuid, options = {}) {
			this.registerNotifyDataPipelineOnce();
			const writeUUID = uuid.writeUUID || this.characteristicId;
			uni.notifyBLECharacteristicValueChange({
				state: true,
				deviceId: uuid.deviceUUID,
				serviceId: uuid.serviceUUID,
				characteristicId: uuid.notifyUUID,
				success: (res) => {
					console.log('开启notify成功', uuid);
					this.isNotify = true;
					this.notifyCount = this.notifyCount + 1;
					this.serviceId = uuid.serviceUUID;
					this.deviceId = uuid.deviceUUID;
					this.characteristicId = writeUUID;
					this.loginSuccess = true;
					this.manualDisconnecting = false;
					this._flushPendingSpineEndAfterLaunch();
					uni.$emit('bluetooth_status_change');
					const cb = options && options.onReady;
					if (typeof cb === 'function') {
						try {
							cb(res);
						} catch (e) {
							console.warn('[PillowBleManager] startNotice onReady', e);
						}
					}
				},
				fail: (res) => {
					console.log('开启notify失败', res);
					const cb = options && options.onFail;
					if (typeof cb === 'function') {
						try {
							cb(res);
						} catch (e) {
							console.warn('[PillowBleManager] startNotice onFail', e);
						}
					}
				}
			});
		}

		write2tooth(buffer) {
			const deviceId = this.deviceId;
			const serviceId = this.serviceId;
			const characteristicId = this.characteristicId;
			const hex = this.ab2hex(buffer);
			console.log('[BLE下发APP->设备] len=' + buffer.byteLength + ' hex=' + hex);
			uni.writeBLECharacteristicValue({
				deviceId,
				serviceId,
				characteristicId,
				value: buffer,
				writeType: 'writeNoResponse',
				success: (res) => {
					console.log('写入特征成功', res);
					uni.$emit('ble_write_result', {
						ok: true,
						res
					});
				},
				fail: (err) => {
					const errMsg = (err && (err.errMsg || err.message)) || '';
					console.error('写入特征失败', err);
					console.error('errMsg:', errMsg, 'code:', err && err.errCode, 'hex=', hex);
					uni.$emit('ble_write_result', {
						ok: false,
						errMsg,
						err,
						deviceId,
						serviceId,
						characteristicId,
						hex
					});
				}
			});
		}

		isConnected() {
			return !!this.loginSuccess;
		}

		_applyHeightPct(v) {
			return Math.max(0, Math.min(100, Math.floor(Number(v) || 0)));
		}

		_normalizeModeHeightsItem(item) {
			const rawH = item.headHeight;
			const rawN = item.neckHeight;
			const rawSh = item.sideHeadHeight;
			const rawSn = item.sideNeckHeight;
			const head = this._applyHeightPct(rawH);
			const sideHead = this._applyHeightPct(rawSh);
			const neck = this._applyHeightPct(rawN);
			const sideNeck = this._applyHeightPct(rawSn);
			return {
				head,
				neck,
				sideHead,
				sideNeck
			};
		}

		/**存档方案下发 */
		applyModeProfileFromItem(item) {
			if (!item || !this.isConnected()) {
				return false;
			}
			let pi = Number(item.profileIndex);
			if (!Number.isFinite(pi)) pi = 0;
			const profileIndex = Math.min(4, Math.max(0, Math.floor(pi)));
			const {
				head,
				neck,
				sideHead,
				sideNeck
			} = this._normalizeModeHeightsItem(item);
			const ws = pillowProfileHeightWindows();
			const wside = pillowProfileHeightWindows();
			this.writeSupineConfig({
				index: profileIndex,
				headHeight: head,
				headWindow: ws.headWindow,
				neckHeight: neck,
				neckWindow: ws.neckWindow
			});
			this.writeSideConfig({
				index: profileIndex,
				headHeight: sideHead,
				headWindow: wside.headWindow,
				neckHeight: sideNeck,
				neckWindow: wside.neckWindow
			});
			return true;
		}

		send(buf, opt = {}) {
			if (!this.isConnected()) {
				if (!opt.silent && !canBypassBleConnectInCurrentEnv()) {
					uni.showToast({
						title: '请先连接设备',
						icon: 'none'
					});
				}
				return false;
			}
			this.write2tooth(buf);
			return true;
		}

		readDeviceInfo(opt) {
			return this.send(BluePillowProtocol.readDeviceInfo(), opt);
		}

		requestFirmwareReadIfNeededToday() {
			if (!this.isConnected()) {
				return false;
			}
			return this.readDeviceInfo({
				silent: true
			});
		}

		writeSupineConfig(payload) {
			return this.send(BluePillowProtocol.writeSupineConfig(payload));
		}

		readSupineConfig(index) {
			return this.send(BluePillowProtocol.readSupineConfig(index));
		}

		writeSideConfig(payload) {
			return this.send(BluePillowProtocol.writeSideConfig(payload));
		}

		readSideConfig(index) {
			return this.send(BluePillowProtocol.readSideConfig(index));
		}

		readPillowStatus(opt) {
			return this.send(BluePillowProtocol.readPillowStatus(), opt);
		}

		headHeight(height) {
			return this.send(BluePillowProtocol.headHeight(height));
		}

		neckHeight(height) {
			return this.send(BluePillowProtocol.neckHeight(height));
		}

		writeCurrentHeights(payload) {
			const [h, n] = BluePillowProtocol.writeCurrentHeights(payload);
			return this.send(h) && this.send(n);
		}

		learnPosture(payload) {
			return this.send(BluePillowProtocol.learnPosture(payload));
		}

		readLearnPosture(opt) {
			return this.send(BluePillowProtocol.readLearnPosture(), opt || {});
		}

		heating(payload) {
			return this.send(BluePillowProtocol.heating(payload));
		}

		spineAdjust(payload) {
			return this.send(BluePillowProtocol.spineAdjust(payload));
		}

		calibrate(mode) {
			return this.send(BluePillowProtocol.calibrate(mode));
		}

		writePostureConfig(payload) {
			return this.send(BluePillowProtocol.writePostureConfig(payload));
		}

		readPostureData(opt) {
			return this.send(BluePillowProtocol.readPostureData(), opt || {});
		}

		readPostureSnapshot0x0B(opt = {}) {
			const timeoutMs = opt.timeoutMs != null ? opt.timeoutMs : 8000;
			return new Promise((resolve, reject) => {
				let finished = false;
				const finish = (err, val) => {
					if (finished) return;
					finished = true;
					clearTimeout(timer);
					try {
						uni.$off('xx', onNotify);
					} catch (e) {}
					if (err) reject(err);
					else resolve(val);
				};
				const timer = setTimeout(() => finish(new Error('read_posture_timeout')), timeoutMs);
				const onNotify = (res) => {
					try {
						const buf = res && res.value;
						if (!buf) return;
						const parsed = this.handleNotifyBuffer(buf);
						if (parsed && parsed.type === 'posture_sensor' && parsed.parsed && parsed
							.ok) {
							finish(null, parsed.parsed);
						}
					} catch (e) {}
				};
				uni.$on('xx', onNotify);
				if (!this.send(BluePillowProtocol.readPostureData(), {
						silent: true
					})) {
					finish(new Error('not_connected'));
				}
			});
		}

		readPostureValidPointCount(opt = {}) {
			const timeoutMs = opt.timeoutMs != null ? opt.timeoutMs : 8000;
			return new Promise((resolve, reject) => {
				let finished = false;
				const finish = (err, val) => {
					if (finished) return;
					finished = true;
					clearTimeout(timer);
					try {
						uni.$off('xx', onNotify);
					} catch (e) {}
					if (err) reject(err);
					else resolve(val);
				};
				const timer = setTimeout(() => finish(new Error('read_posture_timeout')), timeoutMs);
				const onNotify = (res) => {
					try {
						const buf = res && res.value;
						if (!buf) return;
						const parsed = this.handleNotifyBuffer(buf);
						if (parsed && parsed.type === 'posture_sensor' && parsed.parsed.ok) {
							finish(null, parsed.parsed.validPointCount);
						}
					} catch (e) {}
				};
				uni.$on('xx', onNotify);
				if (!this.send(BluePillowProtocol.readPostureData(), {
						silent: true
					})) {
					finish(new Error('not_connected'));
				}
			});
		}

		readLearnPostureProfile(opt = {}) {
			const timeoutMs = opt.timeoutMs != null ? opt.timeoutMs : 8000;
			return new Promise((resolve, reject) => {
				let finished = false;
				const finish = (err, val) => {
					if (finished) return;
					finished = true;
					clearTimeout(timer);
					try {
						uni.$off('xx', onNotify);
					} catch (e) {}
					if (err) reject(err);
					else resolve(val);
				};
				const timer = setTimeout(() => finish(new Error('read_learn_posture_timeout')),
				timeout);
				const onNotify = (res) => {
					try {
						const buf = res && res.value;
						if (!buf) return;
						const parsed = this.handleNotifyBuffer(buf);
						if (parsed && parsed.type === 'learn_posture' && parsed.parsed.ok) {
							finish(null, parsed.parsed);
						}
					} catch (e) {}
				};
				uni.$on('xx', onNotify);
				if (!this.readLearnPosture({
						silent: true
					})) {
					finish(new Error('not_connected'));
				}
			});
		}

		pillowParams(payload) {
			return this.send(BluePillowProtocol.pillowParams(payload));
		}

		rtcConfig(rtc) {
			return this.send(BluePillowProtocol.rtcConfig(rtc));
		}

		airbagManual(payload) {
			return this.send(BluePillowProtocol.airbagManual(payload));
		}

		heartRateModule(payload) {
			return this.send(BluePillowProtocol.heartRateModule(payload));
		}

		headParams0x10(payload) {
			return this.send(BluePillowProtocol.headParams0x10(payload));
		}

		calibrationCorrect0x11(payload) {
			return this.send(BluePillowProtocol.calibrationCorrect0x11(payload), {
				silent: true
			});
		}

		sendProtocol(method, ...args) {
			const fn = BluePillowProtocol[method];
			if (typeof fn !== 'function') {
				console.error('[PillowBleManager] unknown protocol method:', method);
				return false;
			}
			const buf = fn.apply(BluePillowProtocol, args);
			if (Array.isArray(buf)) {
				let ok = true;
				for (const b of buf) {
					if (!this.send(b, {
							silent: true
						})) ok = false;
				}
				return ok;
			}
			return this.send(buf);
		}

		handleNotifyBuffer(buffer) {
			const frame = parsePillowUploadFrame(buffer);
			if (!frame.ok) {
				return {
					type: 'parse_error',
					parsed: frame,
					raw: frame
				};
			}
			const {
				func,
				data
			} = frame;
			const base = {
				func,
				funcLogical: func & 0x7f,
				isReadResponse: (func & 0x80) !== 0
			};
			const logical = func & 0x7f;

			switch (logical) {
				case 0x01: {
					const p = parseDeviceInfoPayload(data);
					return {
						type: 'device_info',
						parsed: {
							...base,
							...p
						},
						raw: frame
					};
				}
				case 0x04: {
					const p = parsePillowStatusPayload(data);
					return {
						type: 'pillow_status',
						parsed: {
							...base,
							...p
						},
						raw: frame
					};
				}
				case 0x07: {
					if (base.isReadResponse) {
						const p = parseLearnPosture0x07Payload(data);
						return {
							type: 'learn_posture',
							parsed: {
								...base,
								...p
							},
							raw: frame
						};
					}
					const ack = parseWriteAckPayload(data);
					if (data.length <= 2) {
						return {
							type: 'write_ack',
							parsed: {
								...base,
								...ack
							},
							raw: frame
						};
					}
					return {
						type: 'unknown',
						parsed: {
							...base,
							dataHex: bytesToHex(data)
						},
						raw: frame
					};
				}
				case 0x09: {
					if (base.isReadResponse && data.length >= 1) {
						const {
							spineRemainTimes,
							spineAdjust
						} = resolveSpineReadRemainTimes(data);
						return {
							type: 'spine_adjust_read',
							parsed: {
								...base,
								spineRemainTimes,
								...(spineAdjust ? {
									spineAdjust
								} : {}),
							},
							raw: frame,
						};
					}
					const ack = parseWriteAckPayload(data);
					if (data.length <= 2) {
						return {
							type: 'write_ack',
							parsed: {
								...base,
								...ack
							},
							raw: frame
						};
					}
					return {
						type: 'unknown',
						parsed: {
							...base,
							dataHex: bytesToHex(data)
						},
						raw: frame
					};
				}
				case 0x0b: {
					const p = parsePostureSensor0x0BPayload(data);
					if (p.ok) {
						return {
							type: 'posture_sensor',
							parsed: {
								...base,
								...p
							},
							raw: frame
						};
					}
					break;
				}
				case 0x0c: {
					const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
					if (u.length >= PILLOW_0x0C_DATA_LEN) {
						const p = parsePillowParams0x0CPayload(data);
						if (p.ok) {
							return {
								type: 'pillow_params_0x0c',
								parsed: {
									...base,
									...p
								},
								raw: frame
							};
						}
					}
					const ack = parseWriteAckPayload(data);
					if (u.length >= 1 && u.length <= 2) {
						return {
							type: 'write_ack',
							parsed: {
								...base,
								...ack
							},
							raw: frame
						};
					}
					return {
						type: 'unknown',
						parsed: {
							...base,
							dataHex: bytesToHex(data)
						},
						raw: frame
					};
				}
				case 0x0f: {
					const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
					if (u.length >= 1 && u.length <= 2) {
						const ack = parseWriteAckPayload(data);
						return {
							type: 'write_ack',
							parsed: {
								...base,
								...ack
							},
							raw: frame
						};
					}
					return {
						type: 'heart_rate_module',
						parsed: {
							...base,
							rawBytes: Array.from(u),
							dataHex: bytesToHex(u)
						},
						raw: frame,
					};
				}
				case 0x10: {
					if (base.isReadResponse) {
						const p = parseHeadParams0x10Payload(data);
						return {
							type: 'head_params_0x10',
							parsed: {
								...base,
								...p
							},
							raw: frame
						};
					}
					const ack = parseWriteAckPayload(data);
					if (data.length <= 2) {
						return {
							type: 'write_ack',
							parsed: {
								...base,
								...ack
							},
							raw: frame
						};
					}
					return {
						type: 'unknown',
						parsed: {
							...base,
							dataHex: bytesToHex(data)
						},
						raw: frame
					};
				}
				case 0x11: {
					const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
					if (u.length >= CALIBRATION_0x11_DATA_LEN) {
						const p = parseCalibrationCorrect0x11Payload(data);
						if (p.ok) {
							return {
								type: 'calibration_correct_0x11',
								parsed: {
									...base,
									...p
								},
								raw: frame
							};
						}
					}
					const ack = parseWriteAckPayload(data);
					if (u.length >= 1 && u.length <= 2) {
						return {
							type: 'write_ack',
							parsed: {
								...base,
								...ack,
								funcLogical: 0x11
							},
							raw: frame
						};
					}
					return {
						type: 'unknown',
						parsed: {
							...base,
							dataHex: bytesToHex(data)
						},
						raw: frame
					};
				}
				default: {
					const ack = parseWriteAckPayload(data);
					if (data && data.length <= 2) {
						return {
							type: 'write_ack',
							parsed: {
								...base,
								...ack
							},
							raw: frame
						};
					}
					return {
						type: 'unknown',
						parsed: {
							...base,
							dataHex: bytesToHex(data)
						},
						raw: frame
					};
				}
			}
		}
	}

	function bytesToHex(u8) {
		if (!u8 || !u8.length) return '';
		return Array.from(u8)
			.map((b) => ('00' + (b & 0xff).toString(16)).slice(-2))
			.join('');
	}

	export default PillowBleManager;
	export {
		PillowBleManager
	};