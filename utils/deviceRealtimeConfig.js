/**
 * 设备实时数据（WebSocket + SOAP 心跳）配置
 * 离床展示：实时帧 is_bed（1=在床）；连续不在床超过 OFF_BED_HOLD_MS 后心率/呼吸显示 --
 */
import base from '@/utils/baseUrl.js';

/** SOAP / 实时接口密钥（与 soapDeviceApi 一致） */
export const SOAP_API_KEY = '1f3e1d08bac85daf08eca14e72cde665';

/** GetDeviceInfo.status.id：离床 */
export const DEVICE_STATUS_LEAVE_BED = 3;
/** GetDeviceInfo.status.id：离线 */
export const DEVICE_STATUS_OFFLINE = 4;

/** 设备心跳（GetDeviceInfo）间隔 */
export const DEVICE_HEARTBEAT_INTERVAL_MS = 30000;
/** WebSocket 断线重连间隔 */
export const DEVICE_WS_RECONNECT_MS = 5000;
/** 实时数据超过该时长视为过期（与 pillow 一致 60s） */
export const DEVICE_REALTIME_STALE_MS = 60000;
/** 是否启用 SOAP GetDeviceRealtimeData 轮询兜底（暂关闭，仅用 WebSocket） */
export const ENABLE_SOAP_REALTIME_POLL = false;
/** WebSocket 不可用时 SOAP 轮询间隔（ENABLE_SOAP_REALTIME_POLL 为 true 时生效） */
export const DEVICE_SOAP_FALLBACK_POLL_MS = 1000;
/** is_bed !== 1 持续超过该时长后，首页心率/呼吸显示为 -- */
export const OFF_BED_HOLD_MS = 10000;

/** WebSocket 基址（bed GetAccessToken → ?token=）；可在 baseUrl.deviceRealtimeWsUrl 覆盖 */
export const DEVICE_REALTIME_WS_BASE = (() => {
	const tpl = base.deviceRealtimeWsUrl;
	if (tpl && typeof tpl === 'string') {
		return tpl.replace(/\?.*$/, '').replace(/\/$/, '');
	}
	return 'wss://bed.qssmart.cn/ws/v1/device-data';
})();

/** 设备 MAC 规范化为订阅 topic 格式（大写、冒号分隔） */
export function normalizeDeviceMac(mac) {
	return String(mac || '')
		.trim()
		.toUpperCase()
		.replace(/-/g, ':');
}

/**
 * 构建实时 WebSocket URL（需 bed GetAccessToken 返回的 token，24h 有效）
 * @param {string} token
 */
export function buildRealtimeWsUrl(token) {
	const t = String(token || '').trim();
	if (!t) return '';
	const wsBase = DEVICE_REALTIME_WS_BASE.endsWith('/')
		? DEVICE_REALTIME_WS_BASE
		: `${DEVICE_REALTIME_WS_BASE}/`;
	return `${wsBase}?token=${encodeURIComponent(t)}`;
}
