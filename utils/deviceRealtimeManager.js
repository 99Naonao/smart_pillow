/**
 * 首页实时生命体征：仅 WebSocket 推送实时数据 + GetDeviceInfo 心跳（在线/离线）
 * 离床展示：实时帧 is_bed，1=在床；连续不在床超过 10s 后展示 --
 */
import soapDeviceApi from '@/utils/soapDeviceApi.js';
import { getDeviceRealtimeSocket, normalizeMac } from '@/utils/deviceRealtimeSocket.js';
import {
	DEVICE_STATUS_OFFLINE,
	DEVICE_HEARTBEAT_INTERVAL_MS,
	DEVICE_REALTIME_STALE_MS,
	ENABLE_SOAP_REALTIME_POLL,
	DEVICE_SOAP_FALLBACK_POLL_MS,
	OFF_BED_HOLD_MS
} from '@/utils/deviceRealtimeConfig.js';

const LOG_TAG = '[deviceRealtimeManager]';

function extractTimestampMs(record) {
	if (!record || typeof record !== 'object') return NaN;
	let ts =
		record.date ??
		record.id ??
		record.timestamp ??
		record.time ??
		record.ts ??
		record.time_stamp ??
		record.datetime ??
		record.timeStr ??
		record.time_string ??
		(record.left && record.left.timestamp) ??
		(record.right && record.right.timestamp) ??
		(record.left && record.left.time) ??
		(record.right && record.right.time);
	if (ts == null) return NaN;
	if (typeof ts === 'string') {
		const ms = Date.parse(ts);
		return Number.isNaN(ms) ? NaN : ms;
	}
	if (typeof ts === 'number') {
		return ts < 1e12 ? ts * 1000 : ts;
	}
	return NaN;
}

function getSideBreathRate(side) {
	if (!side) return undefined;
	return side.respiratory_rate ?? side.respiration_rate ?? side.breath_rate;
}

function parseVitalsFromFrame(frame) {
	const left = (frame && frame.left) || {};
	const right = (frame && frame.right) || {};
	const isSideValid = (side) => {
		const hr = Number(side.heart_rate);
		const rr = Number(getSideBreathRate(side));
		return Number.isFinite(hr) && hr > 0 && Number.isFinite(rr) && rr > 0;
	};
	const side = isSideValid(left) ? left : isSideValid(right) ? right : null;
	if (!side) {
		return { heartRate: null, breathRate: null };
	}
	const breathRaw = getSideBreathRate(side);
	return {
		heartRate: Math.floor(Number(side.heart_rate)),
		breathRate: Number(breathRaw)
	};
}

function pickLatestRealtimeFrame(rows) {
	if (!Array.isArray(rows) || !rows.length) return null;
	return rows[rows.length - 1];
}

function normalizeRealtimeMessage(raw) {
	if (raw == null) return null;
	let obj = raw;
	if (typeof raw === 'string') {
		try {
			obj = JSON.parse(raw);
		} catch (e) {
			return null;
		}
	}
	if (!obj || typeof obj !== 'object') return null;
	if (obj.ret === 0 && Array.isArray(obj.data)) {
		return pickLatestRealtimeFrame(obj.data);
	}
	if (Array.isArray(obj.data)) {
		return pickLatestRealtimeFrame(obj.data);
	}
	if (Array.isArray(obj)) {
		return pickLatestRealtimeFrame(obj);
	}
	if (obj.left || obj.right) {
		return obj;
	}
	return null;
}

/** WebSocket/SOAP 实时帧：is_bed===1 或在床；优先 is_bed，兼容 SOAP 字段 inbed */
export function parseIsInBedFromFrame(frame) {
	if (!frame || typeof frame !== 'object') return null;
	if (frame.is_bed !== undefined && frame.is_bed !== null) {
		return Number(frame.is_bed) === 1;
	}
	if (frame.inbed !== undefined && frame.inbed !== null) {
		if (typeof frame.inbed === 'boolean') return frame.inbed;
		return Number(frame.inbed) === 1;
	}
	return null;
}

class DeviceRealtimeManager {
	constructor() {
		this._listeners = new Set();
		this._mac = '';
		this._deviceStatusId = null;
		this._socket = getDeviceRealtimeSocket();
		this._heartbeatTimer = null;
		this._soapPollTimer = null;
		this._useSoapFallback = false;
		this._destroyed = true;
		/** ws | soap | idle */
		this._transportMode = 'idle';
		this._soapPollLoggedOnce = false;
		this._offBedSinceMs = null;
		this._offBedCheckTimer = null;
		this._showLeaveBedDisplay = false;
		this._lastIsInBed = null;
	}

	onUpdate(handler) {
		if (typeof handler === 'function') {
			this._listeners.add(handler);
		}
		return handler;
	}

	offUpdate(handler) {
		if (handler) {
			this._listeners.delete(handler);
		}
	}

	_emit(payload) {
		this._listeners.forEach((fn) => {
			try {
				fn(payload);
			} catch (e) {
				console.warn('[deviceRealtimeManager] listener error', e);
			}
		});
	}

	/** 与 pillow deviceHeartbeat 一致 */
	async deviceHeartbeat(mac) {
		const m = mac || this._mac;
		if (!m) {
			return { success: false, isOnline: false };
		}
		try {
			const result = await soapDeviceApi.getDeviceInfo({ mac: m });
			if (result && result.ret === 0 && result.data && result.data.status) {
				const deviceStatus = result.data.status;
				const statusId = Number(deviceStatus.id);
				const isOnline = statusId !== DEVICE_STATUS_OFFLINE;
				this._deviceStatusId = statusId;
				console.log(LOG_TAG, '心跳 GetDeviceInfo', {
					mac: m,
					statusId,
					statusName: deviceStatus.name
				});
				return {
					success: true,
					isOnline,
					status: deviceStatus,
					deviceInfo: result.data
				};
			}
			console.warn(LOG_TAG, '心跳响应异常', { mac: m, ret: result && result.ret, msg: result && result.msg });
			return {
				success: false,
				isOnline: false,
				error: (result && result.msg) || '设备响应异常'
			};
		} catch (err) {
			console.warn('[deviceRealtimeManager] deviceHeartbeat failed', err);
			return {
				success: false,
				isOnline: false,
				error: (err && err.message) || '网络请求失败'
			};
		}
	}

	_applyHeartbeatResult(hb) {
		if (!hb || !hb.success) {
			this._emit({
				isLeaveBed: false,
				isOnline: false,
				heartRate: null,
				breathRate: null,
				deviceStatusId: this._deviceStatusId
			});
			return;
		}
		if (!hb.isOnline) {
			this._emit({
				isLeaveBed: false,
				isOnline: false,
				heartRate: null,
				breathRate: null,
				deviceStatusId: this._deviceStatusId
			});
			return;
		}
		// 离床展示由实时帧 is_bed 判定，心跳仅负责在线/离线
	}

	async _tickHeartbeat() {
		if (this._destroyed || !this._mac) return;
		const hb = await this.deviceHeartbeat(this._mac);
		this._applyHeartbeatResult(hb);
	}

	_startHeartbeat() {
		this._stopHeartbeat();
		this._tickHeartbeat();
		this._heartbeatTimer = setInterval(() => {
			this._tickHeartbeat();
		}, DEVICE_HEARTBEAT_INTERVAL_MS);
	}

	_stopHeartbeat() {
		if (this._heartbeatTimer) {
			clearInterval(this._heartbeatTimer);
			this._heartbeatTimer = null;
		}
	}

	_clearOffBedCheckTimer() {
		if (this._offBedCheckTimer) {
			clearTimeout(this._offBedCheckTimer);
			this._offBedCheckTimer = null;
		}
	}

	_resetOffBedState() {
		this._offBedSinceMs = null;
		this._showLeaveBedDisplay = false;
		this._lastIsInBed = null;
		this._clearOffBedCheckTimer();
	}

	_emitLeaveBedVitals() {
		this._emit({
			isLeaveBed: true,
			isOnline: this._deviceStatusId !== DEVICE_STATUS_OFFLINE,
			heartRate: null,
			breathRate: null,
			deviceStatusId: this._deviceStatusId,
			isInBed: false
		});
	}

	_scheduleOffBedHoldCheck() {
		this._clearOffBedCheckTimer();
		if (this._offBedSinceMs == null) return;
		const elapsed = Date.now() - this._offBedSinceMs;
		const remain = OFF_BED_HOLD_MS - elapsed;
		if (remain <= 0) {
			if (!this._showLeaveBedDisplay) {
				this._showLeaveBedDisplay = true;
				console.log(LOG_TAG, 'is_bed 不在床已满 10s，展示 --');
				this._emitLeaveBedVitals();
			}
			return;
		}
		this._offBedCheckTimer = setTimeout(() => {
			this._offBedCheckTimer = null;
			if (this._destroyed || this._offBedSinceMs == null) return;
			this._showLeaveBedDisplay = true;
			console.log(LOG_TAG, 'is_bed 不在床已满 10s（定时），展示 --');
			this._emitLeaveBedVitals();
		}, remain);
	}

	/**
	 * 根据 is_bed 更新离床展示状态；未满 10s 离床仍返回 false（继续显示数值）
	 * @returns {boolean} 是否应按离床展示 --
	 */
	_updateLeaveBedByIsBed(isInBed) {
		if (isInBed === null) {
			return this._showLeaveBedDisplay;
		}
		if (isInBed !== this._lastIsInBed) {
			console.log(LOG_TAG, 'is_bed 变化', {
				prev: this._lastIsInBed,
				next: isInBed,
				is_bed: isInBed ? 1 : 0
			});
			this._lastIsInBed = isInBed;
		}
		if (isInBed) {
			this._offBedSinceMs = null;
			this._showLeaveBedDisplay = false;
			this._clearOffBedCheckTimer();
			return false;
		}
		const now = Date.now();
		if (this._offBedSinceMs == null) {
			this._offBedSinceMs = now;
			console.log(LOG_TAG, 'is_bed 不在床，开始计时 10s');
			this._scheduleOffBedHoldCheck();
		}
		if (now - this._offBedSinceMs >= OFF_BED_HOLD_MS) {
			this._showLeaveBedDisplay = true;
			return true;
		}
		return false;
	}

	_applyRealtimeFrame(frame) {
		if (this._destroyed) return;
		const dataTsMs = extractTimestampMs(frame);
		const nowMs = Date.now();
		if (!Number.isNaN(dataTsMs) && nowMs - dataTsMs > DEVICE_REALTIME_STALE_MS) {
			console.log(LOG_TAG, '实时数据过期，清空展示');
			this._emit({
				isLeaveBed: this._showLeaveBedDisplay,
				isOnline: this._deviceStatusId !== DEVICE_STATUS_OFFLINE,
				heartRate: null,
				breathRate: null,
				deviceStatusId: this._deviceStatusId,
				isInBed: this._lastIsInBed
			});
			return;
		}
		const isInBed = parseIsInBedFromFrame(frame);
		const showLeaveBed = this._updateLeaveBedByIsBed(isInBed);
		if (showLeaveBed) {
			this._emitLeaveBedVitals();
			return;
		}
		const vitals = parseVitalsFromFrame(frame);
		console.log(LOG_TAG, 'WebSocket 实时数据:', {
			heartRate: vitals.heartRate,
			respiratory_rate: vitals.breathRate,
			isInBed: isInBed !== null ? isInBed : this._lastIsInBed
		});
		this._emit({
			isLeaveBed: false,
			isOnline: true,
			heartRate: vitals.heartRate,
			breathRate: vitals.breathRate,
			deviceStatusId: this._deviceStatusId,
			isInBed: isInBed !== null ? isInBed : this._lastIsInBed
		});
	}

	/**
	 * 原 SOAP GetDeviceRealtimeData 轮询（暂停用，实时仅 WebSocket）
	 * @deprecated 恢复时设 ENABLE_SOAP_REALTIME_POLL = true
	 */
	async _fetchRealtimeSoapOnce() {
		if (!ENABLE_SOAP_REALTIME_POLL) return;
		// --- 原接口实时数据（GetDeviceRealtimeData）---
		// if (this._destroyed || !this._mac) return;
		// if (!this._soapPollLoggedOnce) {
		// 	this._soapPollLoggedOnce = true;
		// 	console.log(LOG_TAG, 'SOAP 轮询获取实时数据', { mac: this._mac });
		// }
		// try {
		// 	const res = await soapDeviceApi.getDeviceData({
		// 		mac: this._mac,
		// 		timestamp: 0,
		// 		waveform: false
		// 	});
		// 	const frame = normalizeRealtimeMessage(res);
		// 	if (frame) {
		// 		this._applyRealtimeFrame(frame);
		// 	}
		// } catch (err) {
		// 	console.warn(LOG_TAG, 'SOAP 实时数据失败', err);
		// }
	}

	/** WebSocket 不可用时的日志（重连由 DeviceRealtimeSocket 内部 3s 自动处理） */
	_onWsUnavailable(reason) {
		console.warn(LOG_TAG, 'WebSocket 异常:', reason || 'unknown');
	}

	_startSoapFallback(reason) {
		if (ENABLE_SOAP_REALTIME_POLL) {
			if (this._useSoapFallback) return;
			this._useSoapFallback = true;
			this._transportMode = 'soap';
			this._stopSoapFallback();
			this._fetchRealtimeSoapOnce();
			this._soapPollTimer = setInterval(() => {
				this._fetchRealtimeSoapOnce();
			}, DEVICE_SOAP_FALLBACK_POLL_MS);
			return;
		}
		this._onWsUnavailable(reason);
	}

	_stopSoapFallback() {
		if (this._soapPollTimer) {
			clearInterval(this._soapPollTimer);
			this._soapPollTimer = null;
		}
		this._useSoapFallback = false;
		this._soapPollLoggedOnce = false;
	}

	_startWebSocket() {
		if (this._destroyed || !this._mac) return;
		console.log(LOG_TAG, '获取实时数据(WebSocket), mac:', this._mac);
		this._socket.setMessageHandler((payload) => {
			if (this._destroyed) return;
			const frame = normalizeRealtimeMessage(payload) || payload;
			if (frame && typeof frame === 'object') {
				this._applyRealtimeFrame(frame);
			}
		});
		this._socket
			.connect(this._mac)
			.then(() => {
				if (this._destroyed) return;
				this._transportMode = 'ws';
				console.log(LOG_TAG, 'WebSocket 连接并订阅就绪', { mac: this._mac });
				const cached = this._socket.getLastPayload();
				if (cached) {
					const frame = normalizeRealtimeMessage(cached) || cached;
					if (frame) this._applyRealtimeFrame(frame);
				}
			})
			.catch((err) => {
				console.error(LOG_TAG, 'WebSocket 实时连接失败:', err);
				this._onWsUnavailable('connect_fail');
			});
	}

	_stopWebSocket(manual = true) {
		this._socket.disconnect(manual);
		if (manual) {
			this._transportMode = 'idle';
		}
	}

	_resetSession() {
		this._destroyed = true;
		this._mac = '';
		this._deviceStatusId = null;
		this._transportMode = 'idle';
		this._resetOffBedState();
		this._stopHeartbeat();
		this._stopWebSocket(true);
		this._stopSoapFallback();
	}

	/** 开始：需已配网并写入 wifi_device_mac */
	connect(mac) {
		const m = normalizeMac(mac);
		if (!m) {
			console.warn(LOG_TAG, 'connect 跳过：MAC 为空');
			return;
		}
		console.log(LOG_TAG, 'connect 开始', { mac: m });
		this._resetSession();
		this._destroyed = false;
		this._mac = m;
		this._startHeartbeat();
		this._startWebSocket();
	}

	disconnect() {
		console.log(LOG_TAG, 'disconnect', { mode: this._transportMode });
		this._resetSession();
	}

	getDebugState() {
		const sock = this._socket;
		return {
			mac: this._mac,
			transportMode: this._transportMode,
			wsConnected: sock && sock.connected,
			wsSubscribed: sock && sock.subscribed,
			useSoapFallback: this._useSoapFallback,
			deviceStatusId: this._deviceStatusId
		};
	}
}

const deviceRealtimeManager = new DeviceRealtimeManager();

export { DeviceRealtimeManager, parseVitalsFromFrame, normalizeRealtimeMessage };
export default deviceRealtimeManager;
