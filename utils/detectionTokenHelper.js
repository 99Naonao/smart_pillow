/**
 * bed.qssmart.cn WebSocket 访问令牌（与 pillow/utils/tokenHelper.js 对齐）
 */
import base from '@/utils/baseUrl.js';

const DETECTION_TOKEN_KEY = 'detectionToken';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;

function getMiniProgramAppId() {
	try {
		if (typeof __wxConfig !== 'undefined' && __wxConfig.accountInfo && __wxConfig.accountInfo.appId) {
			return __wxConfig.accountInfo.appId;
		}
	} catch (error) {
		console.warn('[tokenHelper] 读取 __wxConfig.appId 失败:', error);
	}

	try {
		const accountInfo = uni.getAccountInfoSync();
		if (accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.appId) {
			return accountInfo.miniProgram.appId;
		}
	} catch (error) {
		console.warn('[tokenHelper] getAccountInfoSync 失败，使用 baseUrl 兜底:', error);
	}

	return base.publicAppId || '';
}

function getAccessTokenStorageKey() {
	const appId = getMiniProgramAppId();
	return appId ? `${DETECTION_TOKEN_KEY}_${appId}` : DETECTION_TOKEN_KEY;
}

function parseExpiresAt(expiresAt) {
	if (expiresAt == null || expiresAt === '') return null;
	if (typeof expiresAt === 'number') {
		return expiresAt < 1e12 ? expiresAt * 1000 : expiresAt;
	}
	const normalized = String(expiresAt).trim().replace(/-/g, '/');
	const ms = Date.parse(normalized);
	return Number.isNaN(ms) ? null : ms;
}

function saveAccessTokenCache(token, expiresAtMs) {
	try {
		uni.setStorageSync(getAccessTokenStorageKey(), {
			token,
			expiresAt: expiresAtMs
		});
	} catch (error) {
		console.warn('[tokenHelper] 缓存设备token失败:', error);
	}
}

function getStoredAccessTokenCache() {
	try {
		const cache = uni.getStorageSync(getAccessTokenStorageKey());
		if (!cache || typeof cache !== 'object' || typeof cache.token !== 'string' || !cache.token) {
			return null;
		}
		return cache;
	} catch (error) {
		console.warn('[tokenHelper] 读取设备 token 失败:', error);
		return null;
	}
}

function isAccessTokenValid(cache) {
	if (!cache || !cache.token) return false;
	const expiresAt = Number(cache.expiresAt);
	if (!expiresAt || Number.isNaN(expiresAt)) return false;
	return Date.now() < expiresAt - TOKEN_REFRESH_BUFFER_MS;
}

function extractTokenFromResponse(data) {
	if (!data) return '';
	const nested = data.data;
	if (nested && typeof nested === 'object') {
		if (typeof nested.access_token === 'string') return nested.access_token;
		if (typeof nested.token === 'string') return nested.token;
	}
	if (typeof nested === 'string') return nested;
	if (typeof data.access_token === 'string') return data.access_token;
	if (typeof data.token === 'string') return data.token;
	return '';
}

function isShopApiSuccess(data) {
	if (!data || typeof data !== 'object') return false;
	return data.code === 1 || data.code === '1';
}

function getDetectionTokenApiBase() {
	return String(base.detectionTokenApiBase || 'https://music.zsyl.cc/api').replace(/\/$/, '');
}

/**
 * 从后端 GET /api/detection/token 获取访问令牌
 */
export function fetchDetectionToken(options = {}) {
	const { version = '1', forceRefresh = false } = options;
	const appId = getMiniProgramAppId();

	if (appId) {
		console.log('[tokenHelper] 当前小程序 AppId:', appId);
	}

	const query = forceRefresh ? '?forceRefresh=1' : '';

	return new Promise((resolve, reject) => {
		uni.request({
			url: `${getDetectionTokenApiBase()}/detection/token${query}`,
			method: 'GET',
			header: {
				'content-type': 'application/json',
				version,
				'X-WX-App-Id': appId
			},
			success: (res) => {
				console.log('[tokenHelper] 获取设备token响应:', res);

				if (res.statusCode !== 200) {
					reject(new Error(`获取设备token失败，状态码: ${res.statusCode}`));
					return;
				}

				const body = res.data;
				if (!isShopApiSuccess(body)) {
					reject(new Error((body && body.msg) || '获取设备token失败'));
					return;
				}

				const token = extractTokenFromResponse(body);
				if (!token) {
					console.error('[tokenHelper] code=1 但未解析到 access_token，响应:', body);
					reject(new Error('未获取到设备token'));
					return;
				}

				const nested = body.data || {};
				const expiresAt =
					parseExpiresAt(nested.expires_at) ||
					(nested.expires_in
						? Date.now() + Number(nested.expires_in) * 1000
						: Date.now() + TOKEN_FALLBACK_TTL_MS);
				saveAccessTokenCache(token, expiresAt);

				console.log('[tokenHelper] 获取设备token成功:', {
					appId: appId || 'unknown',
					tokenLength: token.length,
					expiresAt: new Date(expiresAt).toLocaleString()
				});

				resolve({ token, raw: body, expiresAt });
			},
			fail: (error) => {
				console.error('[tokenHelper] 获取设备token请求失败:', error);
				reject(new Error((error && error.errMsg) || '获取设备token失败'));
			}
		});
	});
}

export function clearDetectionToken() {
	try {
		uni.removeStorageSync(getAccessTokenStorageKey());
	} catch (error) {
		console.warn('[tokenHelper] 清除设备 token 失败:', error);
	}
}

export async function getDetectionToken(options = {}) {
	const { version = '1', forceRefresh = false } = options;

	if (!forceRefresh) {
		const cache = getStoredAccessTokenCache();
		if (isAccessTokenValid(cache)) {
			console.log(
				'[tokenHelper] 使用缓存设备token, 过期时间:',
				new Date(cache.expiresAt).toLocaleString()
			);
			return cache.token;
		}
	}

	const result = await fetchDetectionToken({ version, forceRefresh });
	return result.token;
}
