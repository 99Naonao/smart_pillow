/**
 * 枕头蓝牙统一入口（原 BlueManager + 协议封装）
 * 协议说明见项目根目录《枕头蓝牙通讯协议.md》
 *
 * - 微信小程序 BLE：连接、notify、write2tooth、状态字段
 * - BluePillowProtocol 组包与 send / 解析 0xAA 上传帧
 *
 * 全局请使用：PillowBleManager.getInstance()
 */

import BluePillowProtocol, { crc16Modbus } from './bluepillow-protocol.js';
import { logPillowStatus0x04Debug } from '@/common/ble04Debug.js';
import { stopSpineAdjustSession } from '@/common/spineSession.js';

/** 上传帧魔数 */
const UPLOAD_MAGIC = 0xaa;

/** 0x01 应答解析后的固件版本本地缓存（按自然日去重下发） */
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

/**
 * 读取已缓存的固件版本（任意页面收到 0x01 应答后写入）
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

/** 协议：版本字节按十进制 /10 显示，如 0x08(8)→0.8，0x0A(10)→1.0，0x15(21)→2.1 */
export function formatFirmwareVersionFromRaw(versionRaw) {
	if (versionRaw === undefined || versionRaw === null || versionRaw === 0) {
		return '';
	}
	return (Number(versionRaw) / 10).toFixed(1);
}

/**
 * 解析一帧设备上传数据（起始 0xAA）
 * @param {ArrayBuffer} buffer
 * @returns {{ ok: true, func: number, data: Uint8Array, crcOk: true } | { ok: false, error: string, func?: number }}
 */
export function parsePillowUploadFrame(buffer) {
	const u8 = new Uint8Array(buffer);
	if (u8.length < 6) {
		return { ok: false, error: 'frame_too_short' };
	}
	if (u8[0] !== UPLOAD_MAGIC) {
		return { ok: false, error: 'bad_magic', detail: u8[0] };
	}
	const view = new DataView(buffer);
	const bodyLen = view.getUint16(1, true);
	if (bodyLen < 1) {
		return { ok: false, error: 'bad_body_len' };
	}
	const totalNeed = 1 + 2 + bodyLen + 2;
	if (u8.length < totalNeed) {
		return { ok: false, error: 'frame_truncated', need: totalNeed, got: u8.length };
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
	return { ok: true, func, data, crcOk: true };
}

export function parseWriteAckPayload(data) {
	if (!data || data.length < 1) {
		return { ok: false, error: 'empty' };
	}
	if (data.length === 1) {
		return { success: data[0] === 0, code: data[0] };
	}
	return {
		success: data[1] === 0,
		code: data[1],
		funcEcho: data[0]
	};
}

/** 0x09 脊柱微调数据区：与写命令相同 11 字节（头/颈/颈放松 uint16 小端 + 次数 uint8 + 保持时间 uint16×2） */
export const SPINE_ADJUST_DATA_LEN = 11;

/**
 * 解析 0x09 数据区（写命令或 0x89 读应答；读应答时除脊柱调整次数外其余字段多为 0）
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

/**
 * 0x89 notify 数据区与《枕头蓝牙通讯协议》「脊柱微调 0x09」写命令数据区 **同一字段顺序**（见 parseSpineAdjustPayload）。
 * 总帧 body 常为 func(1)+载荷(10)=11；载荷不足 11 字段时在末位补 0 再解析。
 * 剩余次数：优先 times（脊柱调整次数）；若为 0，再取 holdTime1（脊柱支撑高度保持时间，uint16 LE）等兼容固件写法。
 * 示例：aa0b008900000000000300000000c5ba → 载荷 00..00 03 00 00.. → times=0，holdTime1=3 → 剩余 3 次。
 * @returns {{ spineRemainTimes: number, spineAdjust: ReturnType<typeof parseSpineAdjustPayload> | null }}
 */
export function resolveSpineReadRemainTimes(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (!u.length) {
		return { spineRemainTimes: 0, spineAdjust: null };
	}
	let buf = u;
	if (u.length === 10) {
		buf = new Uint8Array(SPINE_ADJUST_DATA_LEN);
		buf.set(u);
	}
	if (buf.length < SPINE_ADJUST_DATA_LEN) {
		const spineRemainTimes = u.length >= 7 ? u[6] & 0xff : u[0] & 0xff;
		return { spineRemainTimes, spineAdjust: null };
	}
	const p = parseSpineAdjustPayload(buf);
	if (!p.ok) {
		return { spineRemainTimes: 0, spineAdjust: null };
	}
	let n = p.times & 0xff;
	if (n === 0 && p.holdTime1 > 0 && p.holdTime1 <= 255) {
		n = p.holdTime1;
	}
	/** 固件可能把剩余次数放在 holdTime1 的高字节（如 LE 为 00 30 → 0x3000）或仅 buf[8] 为 0x30 表示 48 次 */
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
	return { spineRemainTimes: n, spineAdjust: p };
}

export function parseDeviceInfoPayload(data) {
	if (!data || data.length < 1) {
		return { ok: false, error: 'too_short' };
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

/** 0x04 读应答数据区固定长度：至头/颈枕高度（与 0x05/0x06 同为 uint16 小端，0~100%） */
const PILLOW_0x04_DATA_LEN = 21;

/**
 * 解析 0x04 读应答的数据区（须先由客户端 readPillowStatus 下发）
 * 工作状态…气压 uint16×2 后 **头枕高度、颈枕高度** 各 **uint16 小端**，取值 **0~100**（与协议 0x05/0x06 一致）。
 * 数据区 **固定 21 字节**。posture 保留空数组以兼容调用方。
 */
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
	const valveBits = u[o++];
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
		valveBits,
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

/** 0x0B 读应答：限位 uint16×16 + 有效位 uint8×16 + 睡姿 uint16×16（与协议表顺序一致） */
const POSTURE_0x0B_MIN_LEN = 16 * 2 + 16 + 16 * 2;

export function parsePostureSensor0x0BPayload(data) {
	if (!data || data.length < POSTURE_0x0B_MIN_LEN) {
		return { ok: false, error: 'too_short', need: POSTURE_0x0B_MIN_LEN, got: data ? data.length : 0 };
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
	/** 0x07 第三字节：睡姿有效位中非 0 的个数（协议：统计有效位个数） */
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

/** 0x07 读应答数据区：学习模式/状态/有效点位 + 仰卧峰值1/2/宽度 + 侧卧峰值/宽度 */
export function parseLearnPosture0x07Payload(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (!u.length) {
		return { ok: false, error: 'empty' };
	}
	if (u.length < 3) {
		return { ok: false, error: 'too_short', need: 3, got: u.length };
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

/** 0x10 读应答：调试模式开关 + 睡姿状态（各 uint8） */
export function parseHeadParams0x10Payload(data) {
	const u = data instanceof Uint8Array ? data : new Uint8Array(data || []);
	if (u.length < 2) {
		return { ok: false, error: 'too_short', need: 2, got: u.length };
	}
	return {
		ok: true,
		debugMode: u[0] & 0xff,
		sleepState: u[1] & 0xff,
	};
}

class PillowBleManager {
	static instance = null;
	static _connectionStateListenerBound = false;

	static getInstance() {
		if (!PillowBleManager.instance) {
			PillowBleManager.instance = new PillowBleManager();
		}
		return PillowBleManager.instance;
	}

	// ---------- 以下为原 BlueManager 状态与方法 ----------
	pillowHeight = 80;
	pillowSideHeight = 80;
	pillowPower = 0;
	pillowPlasticHead = 0;
	pillowPlasticNeck = 0;
	pillowStatus = 0;
	chargingStatus = 0;
	manualDisconnecting = false;
	isSpineAdjusting = false;
	/** 脊柱剩余次数轮询（读 0x89） */
	_spineRemainTimesPollTimer = null;
	/** 与硬件约定：读脊柱调整次数间隔（毫秒） */
	SPINE_REMAIN_TIMES_POLL_MS = 15000;
	deviceIdList = [];
	/** 最近一次 notify 里解析到的 0x04 读应答（须先 send readPillowStatus，硬件不主动推 0x04） */
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
			uni.onBLEConnectionStateChange(function (res) {
				const that = PillowBleManager.getInstance();
				console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
				if (res.connected) {
					// 仅在“已知目标设备”连接成功时广播状态，避免把 BluFi(GoodSleep) 连接误当成枕头连接，
					// 触发其它页面的蓝牙逻辑干扰配网流程。
					if (that.deviceId && res.deviceId == that.deviceId) {
						console.log('蓝牙设备连接成功（物理层）；业务就绪以 notify 开启且 loginSuccess 为准');
						that.manualDisconnecting = false;
						uni.$emit('bluetooth_status_change');
					} else {
						console.log('忽略非当前目标设备的连接事件:', res.deviceId, 'target=', that.deviceId);
					}
					return;
				}
				if (res.deviceId == that.deviceId) {
					if (res.connected) {
						console.log('蓝牙设备连接成功（物理层）');
						that.manualDisconnecting = false;
						uni.$emit('bluetooth_status_change');
					} else {
						console.log('蓝牙设备连接断开');
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
								content: isOnHome ? '设备蓝牙意外断开，请重新连接蓝牙。' : '设备蓝牙意外断开，是否回到首页重新连接蓝牙？',
								showCancel: !isOnHome,
								cancelText: '稍后',
								confirmText: isOnHome ? '确定' : '回到首页',
								success: (r) => {
									if (r.confirm && !isOnHome) {
										uni.switchTab({
											url: '/pages/status/status'
										});
									} else if (r.cancel) {
										console.log('用户选择了稍后处理');
									}
								}
							});
						} else {
							console.log('检测到手动断开，跳过意外断开提示');
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

	/**
	 * 下发读 0x09（线路上 0x89），由设备 notify 回剩余次数（与 0x09 写同结构 11 字节数据区）。
	 */
	readSpineAdjustCount(opt) {
		const buf = BluePillowProtocol.readSpineAdjust();
		const hex = this.ab2hex(buf);
		console.log('[脊柱 0x89] 发送读剩余次数 hex=' + hex);
		return this.send(buf, Object.assign({ silent: true }, opt || {}));
	}

	_startSpineRemainTimesPoll() {
		this._stopSpineRemainTimesPoll();
		const tick = () => {
			if (!this.isSpineAdjusting || !this.loginSuccess || !this.deviceId) {
				return;
			}
			this.readSpineAdjustCount({ silent: true });
		};
		// 不在启动时立刻发 0x89，仅按间隔轮询（首包在首个间隔后）
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
		const hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
			return ('00' + bit.toString(16)).slice(-2);
		});
		return hexArr.join('');
	}

	/** 全局只注册一次 notify 监听，避免重复 startNotice 叠加回调 */
	registerNotifyDataPipelineOnce() {
		if (this._notifyPipelineBound) {
			return;
		}
		this._notifyPipelineBound = true;
		this._notifyValueHandler = (res) => {
			const arrayBuffer = new Uint8Array(res.value);
			const rxHex = this.ab2hex(res.value);
			console.log(
				'[BLE 接收 设备→APP] len=' + arrayBuffer.length + ' hex=' + rxHex
			);
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
						console.log(
							'[脊柱 0x89] 收到应答 rawHex=' +
								spineRxHex +
								' 剩余次数=' +
								(p && typeof p.spineRemainTimes === 'number' ? p.spineRemainTimes : '?')
						);
						if (p && p.spineAdjust && p.spineAdjust.ok) {
							console.log('[脊柱 0x89] 数据区(与0x09写一致)', p.spineAdjust);
						}
						if (
							p &&
							typeof p.spineRemainTimes === 'number' &&
							p.spineRemainTimes === 0 &&
							this.isSpineAdjusting
						) {
							stopSpineAdjustSession({ reason: 'device_times_zero', emit: true });
						}
					}
				}
			} catch (e) {
				console.warn('[PillowBleManager] notify 0x04 解析', e);
			}
			uni.$emit('xx', res);
		};
		uni.onBLECharacteristicValueChange(this._notifyValueHandler);
	}

	/**
	 * BluFi 流程会重绑 onBLECharacteristicValueChange，导致枕头回连后“只发不收”。
	 * 回连前强制抢回 Pillow 的 notify 数据管线。
	 */
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

	/** @returns {null | { ts: number, rawHex: string, parsed: object, rawFrame: object }} */
	getLastPillowStatus0x04() {
		return this.lastPillowStatus0x04;
	}

	updateDeviceName(dname) {
		this.deviceName = dname;
	}
	updateVersion(v) {
		this.version = v;
	}

	/**
	 * 冷启动时未连上 BLE 已写 spine_pending_end；notify 就绪后补发 0x09 结束，避免设备仍处微调态
	 */
	_flushPendingSpineEndAfterLaunch() {
		try {
			const pending = uni.getStorageSync('spine_pending_end');
			if (!pending) {
				return;
			}
			this.write2tooth(
				BluePillowProtocol.spineAdjust({
					headHeight: 0,
					neckHeight: 0,
					neckRelaxHeight: 0,
					times: 0,
					holdTime1: 0,
					holdTime2: 0
				})
			);
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
		const status1 = '0x' + status;

		const status10 = parseInt(status1);
		switch (status10) {
			case 0:
				console.log('枕头空闲状态');
				break;
			case 1:
				console.log('枕头平躺状态');
				break;
			case 2:
				console.log('枕头侧卧状态');
				break;
		}
		const detail_status_16 = receive16.slice(2, 4);
		const detail_status = '0x' + detail_status_16;
		const n1 = detail_status & 0x01;
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
		const n2 = (detail_status >> 2) & 0x01;
		console.log('泵1电流:', n2);
		const n3 = (detail_status >> 3) & 0x01;
		console.log('泵2电流:', n3);
		const n4 = (detail_status >> 4) & 0x01;
		console.log('气囊1升高超时:', n4);
		const n5 = (detail_status >> 5) & 0x01;
		console.log('气囊2升高超时:', n5);
		const n6 = (detail_status >> 6) & 0x01;
		console.log('气囊1气压超高:', n6);
		const n7 = (detail_status >> 7) & 0x01;
		console.log('气囊2气压超高:', n7);

		const headHeight = receive16.slice(4, 6);
		const headHeight10 = parseInt('0x' + headHeight);
		const neckHeight = receive16.slice(6, 8);
		/* 旧拉绳固件曾用「上报值 +30」表示颈枕；电机方案按上报值直接使用 */
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
		console.log('头部气囊充气状态:', plastic_n1);
		console.log('颈部气囊状态:', plastic_n2);

		const spine_status = receive16.slice(18, 20);
		const spine_status16 = '0x' + spine_status;
		const spine_status10 = parseInt(spine_status16);
		console.log('脊柱调整16进制剩余时间:', spine_status16);
		console.log('脊柱调整剩余时间:', spine_status10, '秒');

		this.setPillowPlasticStatus(plastic_n1, plastic_n2);
		this.setPillowCharging(n1);
		this.setPillowHeight(headHeight10);
		this.setPillowStatus(status10);
		this.setPillowSideHeight(neckHeight10);
		this.setPillowPower(press10);
		this.setPillowSpineTime(spine_status10);
		console.log(
			'work 枕头状态 mm=>',
			status10,
			'height:' + headHeight10 + 'mm',
			'neckheight:' + neckHeight10 + 'mm',
			'version:' + vesrion10,
			'校准:' + isright10,
			'电池:' + press10
		);
	}

	/**
	 * 启用 notify；成功后标记「可下发新协议」（loginSuccess），并注册数据上报管线。
	 * @param {Object} uuid deviceUUID, serviceUUID, notifyUUID, writeUUID（可选，默认沿用当前写特征）
	 * @param {Object} [options]
	 * @param {Function} [options.onReady] notify 成功后的回调（如连接页跳转首页）
	 */
	startNotice(uuid, options = {}) {
		const writeUUID = uuid.writeUUID || this.characteristicId;
		uni.notifyBLECharacteristicValueChange({
			state: true,
			deviceId: uuid.deviceUUID,
			serviceId: uuid.serviceUUID,
			characteristicId: uuid.notifyUUID,
			success: (res) => {
				console.log('成功启用 notify 功能', uuid);
				this.isNotify = true;
				this.notifyCount = this.notifyCount + 1;
				this.serviceId = uuid.serviceUUID;
				this.deviceId = uuid.deviceUUID;
				this.characteristicId = writeUUID;
				this.registerNotifyDataPipelineOnce();
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
				console.log('启用 notify 功能失败', res);
			}
		});
	}

	write2tooth(buffer) {
		const deviceId = this.deviceId;
		const serviceId = this.serviceId;
		const characteristicId = this.characteristicId;
		const hex = this.ab2hex(buffer);
		console.log(
			'[BLE 发送 APP→设备] len=' + buffer.byteLength + ' hex=' + hex + ' deviceId=' + deviceId
		);
		uni.writeBLECharacteristicValue({
			deviceId,
			serviceId,
			characteristicId,
			value: buffer,
			writeType: 'writeNoResponse',
			success: (res) => {
				console.log('[BLE 发送] 写入特征值成功', res);
				uni.$emit('ble_write_result', { ok: true, res });
			},
			fail: (err) => {
				const errMsg = (err && (err.errMsg || err.message)) || '';
				console.error('[BLE 发送] 写入特征值失败', err);
				console.error('[BLE 发送] errMsg:', errMsg, 'code:', err && err.errCode, 'hex=', hex);
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

	// ---------- 协议层 ----------
	isConnected() {
		return !!this.loginSuccess;
	}

	/** 协议头/颈高度百分数 0~100 */
	_applyHeightPct(v) {
		return Math.max(0, Math.min(100, Math.floor(Number(v) || 0)));
	}

	/** 与 adjust/mode 一致：头、颈有效窗口按“上下浮动 3 个百分点”（固定值 3） */
	_heightWindowsForProfile(headH, neckH) {
		const h = this._applyHeightPct(headH);
		const n = this._applyHeightPct(neckH);
		return {
			headWindow: Math.max(0, Math.min(65535, 3)),
			neckWindow: Math.max(0, Math.min(65535, 3))
		};
	}

	/**
	 * 头/颈枕均为电机方案：四路高度均从 0 起调，仅做协议 0~100 截断。
	 */
	_normalizeModeHeightsItem(item) {
		const rawH = item.headHeight;
		const rawN = item.neckHeight;
		const rawSh = item.sideHeadHeight;
		const rawSn = item.sideNeckHeight;
		const head = this._applyHeightPct(rawH);
		const sideHead = this._applyHeightPct(rawSh);
		const neck = this._applyHeightPct(rawN);
		const sideNeck = this._applyHeightPct(rawSn);
		return { head, neck, sideHead, sideNeck };
	}

	/**
	 * 将一条用户模式写入枕头（新协议）：0x02 仰卧档案 + 0x03 侧卧档案 + 0x05/0x06 当前仰卧高度。
	 * 供 mode 页、AI 保存、`sendModeByName` 等复用。
	 * @param {Object} item headHeight, neckHeight, sideHeadHeight, sideNeckHeight, profileIndex（0~4，缺省 0）
	 * @returns {boolean} 已连接且已下发返回 true
	 */
	applyModeProfileFromItem(item) {
		if (!item || !this.isConnected()) {
			return false;
		}
		let pi = Number(item.profileIndex);
		if (!Number.isFinite(pi)) pi = 0;
		const profileIndex = Math.min(4, Math.max(0, Math.floor(pi)));
		const { head, neck, sideHead, sideNeck } = this._normalizeModeHeightsItem(item);
		const ws = this._heightWindowsForProfile(head, neck);
		const wside = this._heightWindowsForProfile(sideHead, sideNeck);
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
		// this.send(BluePillowProtocol.headHeight(head), { silent: true });
		// this.send(BluePillowProtocol.neckHeight(neck), { silent: true });
		return true;
	}

	send(buf, opt = {}) {
		if (!this.isConnected()) {
			if (!opt.silent) {
				uni.showToast({ title: '请先连接枕头设备', icon: 'none' });
			}
			return false;
		}
		this.write2tooth(buf);
		return true;
	}

	readDeviceInfo(opt) {
		return this.send(BluePillowProtocol.readDeviceInfo(), opt);
	}

	/**
	 * 主动下发读枕头信息（0x81 读）。
	 * 说明：为支持“同日升级固件后版本号立即刷新”，这里不再按自然日缓存去重。
	 * 缓存仅作为展示兜底，连接后允许再次读取并覆盖旧缓存。
	 */
	requestFirmwareReadIfNeededToday() {
		if (!this.isConnected()) {
			return false;
		}
		return this.readDeviceInfo({ silent: true });
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

	/** @see BluePillowProtocol.calibrate 0x0A 标定模式字节 */
	calibrate(mode) {
		return this.send(BluePillowProtocol.calibrate(mode));
	}

	writePostureConfig(payload) {
		return this.send(BluePillowProtocol.writePostureConfig(payload));
	}

	readPostureData(opt) {
		return this.send(BluePillowProtocol.readPostureData(), opt || {});
	}

	/**
	 * 读 0x0B，返回完整睡姿传感器快照（限位/有效位/睡姿数据）
	 * @param {Object} [opt]
	 * @param {number} [opt.timeoutMs=8000]
	 * @returns {Promise<Object>} parsePostureSensor0x0BPayload 结果
	 */
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
					if (parsed && parsed.type === 'posture_sensor' && parsed.parsed && parsed.parsed.ok) {
						finish(null, parsed.parsed);
					}
				} catch (e) {}
			};
			uni.$on('xx', onNotify);
			if (!this.send(BluePillowProtocol.readPostureData(), { silent: true })) {
				finish(new Error('not_connected'));
			}
		});
	}

	/**
	 * 读 0x0B，从 notify 解析「睡姿有效位」个数，供 0x07 第三字节使用
	 * @param {Object} [opt]
	 * @param {number} [opt.timeoutMs=8000]
	 * @returns {Promise<number>} 0~255
	 */
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
					if (parsed && parsed.type === 'posture_sensor' && parsed.parsed && parsed.parsed.ok) {
						finish(null, parsed.parsed.validPointCount);
					}
				} catch (e) {}
			};
			uni.$on('xx', onNotify);
			if (!this.send(BluePillowProtocol.readPostureData(), { silent: true })) {
				finish(new Error('not_connected'));
			}
		});
	}

	/**
	 * 读 0x07（0x87 应答）：获取学习参数（峰值/宽度）
	 * @param {Object} [opt]
	 * @param {number} [opt.timeoutMs=8000]
	 * @returns {Promise<Object>}
	 */
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
			const timer = setTimeout(() => finish(new Error('read_learn_posture_timeout')), timeoutMs);
			const onNotify = (res) => {
				try {
					const buf = res && res.value;
					if (!buf) return;
					const parsed = this.handleNotifyBuffer(buf);
					if (parsed && parsed.type === 'learn_posture' && parsed.parsed && parsed.parsed.ok) {
						finish(null, parsed.parsed);
					}
				} catch (e) {}
			};
			uni.$on('xx', onNotify);
			if (!this.readLearnPosture({ silent: true })) {
				finish(new Error('not_connected'));
			}
		});
	}

	pillowParams(stabilitySeconds) {
		return this.send(BluePillowProtocol.pillowParams(stabilitySeconds));
	}

	rtcConfig(rtc) {
		return this.send(BluePillowProtocol.rtcConfig(rtc));
	}

	airbagManual(payload) {
		return this.send(BluePillowProtocol.airbagManual(payload));
	}

	/** 0x0F 心率模块：{ read: boolean, data?: number[] } */
	heartRateModule(payload) {
		return this.send(BluePillowProtocol.heartRateModule(payload));
	}

	/** 0x10 读取/配置枕头参数：{ read?: boolean, debugMode?: number, sleepState?: number } */
	headParams0x10(payload) {
		return this.send(BluePillowProtocol.headParams0x10(payload));
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
				if (!this.send(b, { silent: true })) ok = false;
			}
			return ok;
		}
		return this.send(buf);
	}

	handleNotifyBuffer(buffer) {
		const frame = parsePillowUploadFrame(buffer);
		if (!frame.ok) {
			return { type: 'parse_error', parsed: frame, raw: frame };
		}
		const { func, data } = frame;
		const base = { func, funcLogical: func & 0x7f, isReadResponse: (func & 0x80) !== 0 };

		const logical = func & 0x7f;

		switch (logical) {
			case 0x01: {
				const p = parseDeviceInfoPayload(data);
				return { type: 'device_info', parsed: { ...base, ...p }, raw: frame };
			}
			case 0x04: {
				const p = parsePillowStatusPayload(data);
				return { type: 'pillow_status', parsed: { ...base, ...p }, raw: frame };
			}
			case 0x07: {
				if (base.isReadResponse) {
					const p = parseLearnPosture0x07Payload(data);
					return { type: 'learn_posture', parsed: { ...base, ...p }, raw: frame };
				}
				const ack = parseWriteAckPayload(data);
				if (data && data.length <= 2) {
					return { type: 'write_ack', parsed: { ...base, ...ack }, raw: frame };
				}
				return { type: 'unknown', parsed: { ...base, dataHex: bytesToHex(data) }, raw: frame };
			}
			case 0x09: {
				if (base.isReadResponse && data && data.length >= 1) {
					const { spineRemainTimes, spineAdjust } = resolveSpineReadRemainTimes(data);
					return {
						type: 'spine_adjust_read',
						parsed: {
							...base,
							spineRemainTimes,
							...(spineAdjust ? { spineAdjust } : {}),
						},
						raw: frame,
					};
				}
				const ack = parseWriteAckPayload(data);
				if (data && data.length <= 2) {
					return { type: 'write_ack', parsed: { ...base, ...ack }, raw: frame };
				}
				return { type: 'unknown', parsed: { ...base, dataHex: bytesToHex(data) }, raw: frame };
			}
			case 0x0b: {
				const p = parsePostureSensor0x0BPayload(data);
				if (p.ok) {
					return { type: 'posture_sensor', parsed: { ...base, ...p }, raw: frame };
				}
				break;
			}
			case 0x0f: {
				const u8 = data instanceof Uint8Array ? data : new Uint8Array(data || []);
				/** 0x0F 写命令应答：数据区仅 1～2 字节（与协议「写命令应答」一致） */
				if (u8.length >= 1 && u8.length <= 2) {
					const ack = parseWriteAckPayload(data);
					return { type: 'write_ack', parsed: { ...base, ...ack }, raw: frame };
				}
				return {
					type: 'heart_rate_module',
					parsed: { ...base, rawBytes: Array.from(u8), dataHex: bytesToHex(u8) },
					raw: frame,
				};
			}
			case 0x10: {
				if (base.isReadResponse) {
					const p = parseHeadParams0x10Payload(data);
					return { type: 'head_params_0x10', parsed: { ...base, ...p }, raw: frame };
				}
				const ack = parseWriteAckPayload(data);
				if (data && data.length <= 2) {
					return { type: 'write_ack', parsed: { ...base, ...ack }, raw: frame };
				}
				return { type: 'unknown', parsed: { ...base, dataHex: bytesToHex(data) }, raw: frame };
			}
			default: {
				const ack = parseWriteAckPayload(data);
				if (data && data.length <= 2) {
					return { type: 'write_ack', parsed: { ...base, ...ack }, raw: frame };
				}
				return { type: 'unknown', parsed: { ...base, dataHex: bytesToHex(data) }, raw: frame };
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
export { PillowBleManager };
