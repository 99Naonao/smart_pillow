/**
 * 设备 SOAP 接口工具类
 *
 * 当前先封装 4 个接口：
 * 1) 获取设备信息 GetDeviceInfo
 * 2) 获取设备实时数据 GetDeviceRealtimeData
 * 2) 获取睡眠报告列表 GetSleepReportsByDateRange
 * 3) 获取睡眠报告详情 GetSleepReportDetailByReportId
 *
 * 说明：
 * - SOAP Body 中 dataJson 为 JSON 字符串
 * - 返回为 XML，需提取 <MethodResult>...</MethodResult> 再 JSON.parse
 */

const SOAP_URL = 'https://bed.qssmart.cn/CustomerAPIService.asmx';
const SOAP_NAMESPACE = 'http://bed.cn/';
const DEFAULT_SOAP_HEADER = {
	username: 'customerapi',
	password: 'pA2@G8zQ'
};
const DEFAULT_KEY = '1f3e1d08bac85daf08eca14e72cde665';

function escapeXml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function buildSoapEnvelope(method, dataObj, headerAuth = DEFAULT_SOAP_HEADER) {
	const dataJson = escapeXml(JSON.stringify(dataObj || {}));
	return (
		"<?xml version='1.0' encoding='utf-8'?>" +
		"<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'>" +
		'<soap:Header>' +
		`<MXSoapHeader xmlns='${SOAP_NAMESPACE}'>` +
		`<Username>${escapeXml(headerAuth.username || '')}</Username>` +
		`<Password>${escapeXml(headerAuth.password || '')}</Password>` +
		'</MXSoapHeader>' +
		'</soap:Header>' +
		'<soap:Body>' +
		`<${method} xmlns='${SOAP_NAMESPACE}'>` +
		`<dataJson>${dataJson}</dataJson>` +
		`</${method}>` +
		'</soap:Body>' +
		'</soap:Envelope>'
	);
}

function parseSoapJsonResult(method, xmlText) {
	if (typeof xmlText !== 'string') {
		throw new Error(`SOAP响应格式异常: 期望字符串, 实际=${typeof xmlText}`);
	}
	console.log('原始返回数据：===', xmlText);
	const pattern = new RegExp(`<${method}Result>([\\s\\S]*?)<\\/${method}Result>`);
	const match = xmlText.match(pattern);
	if (!match || !match[1]) {
		throw new Error(`SOAP响应缺少 ${method}Result 节点`);
	}
	try {
		const parsed = JSON.parse(match[1]);
		console.log('解析XML中的JSON数据：', parsed);
		return parsed;
	} catch (err) {
		throw new Error(`SOAP结果JSON解析失败: ${err.message}`);
	}
}

class SoapDeviceApi {
	constructor(options = {}) {
		this.soapUrl = options.soapUrl || SOAP_URL;
		this.key = options.key || DEFAULT_KEY;
		this.headerAuth = {
			username: (options.headerAuth && options.headerAuth.username) || DEFAULT_SOAP_HEADER.username,
			password: (options.headerAuth && options.headerAuth.password) || DEFAULT_SOAP_HEADER.password
		};
	}

	/**
	 * 通用 SOAP 调用
	 * @param {string} method SOAP 方法名
	 * @param {Object} payload 业务参数对象
	 * @returns {Promise<Object>}
	 */
	request(method, payload = {}) {
		const postXml = buildSoapEnvelope(method, payload, this.headerAuth);
		console.log(`[soapRequest] 调用方法: ${method}`);
		console.log('[soapRequest] 请求参数:', payload);
		return new Promise((resolve, reject) => {
			uni.request({
				url: this.soapUrl,
				method: 'POST',
				data: postXml,
				header: {
					'content-type': 'text/xml; charset=utf-8',
					SOAPAction: SOAP_NAMESPACE + method
				},
				success: (res) => {
					console.log('接口返回数据：===', res);
					if (!res || res.statusCode !== 200) {
						reject(new Error(`SOAP请求失败, statusCode=${res && res.statusCode}`));
						return;
					}
					try {
						const parsed = parseSoapJsonResult(method, res.data);
						resolve(parsed);
					} catch (err) {
						reject(err);
					}
				},
				fail: (err) => {
					reject(new Error(`SOAP网络异常: ${(err && err.errMsg) || 'unknown'}`));
				}
			});
		});
	}

	/**
	 * 获取设备数据
	 * @param {Object} params
	 * @param {string} params.mac 设备 MAC
	 * @returns {Promise<Object>}
	 */
	getDeviceInfo(params = {}) {
		const mac = params.mac || '';
		return this.request('GetDeviceInfo', {
			key: this.key,
			mac
		});
	}

	/**
	 * 获取设备实时数据（心率/呼吸/波形等）
	 * @param {Object} params
	 * @param {string} params.mac 设备 MAC
	 * @param {number} [params.timestamp=1] 时间戳开关
	 * @param {boolean} [params.waveform=true] 是否包含波形
	 * @returns {Promise<Object>}
	 */
	getDeviceRealtimeData(params = {}) {
		return this.request('GetDeviceRealtimeData', {
			key: this.key,
			mac: params.mac || '',
			timestamp: typeof params.timestamp === 'number' ? params.timestamp : 1,
			waveform: typeof params.waveform === 'boolean' ? params.waveform : true
		});
	}

	/**
	 * 兼容命名：获取设备数据（等同实时数据接口）
	 * @param {Object} params
	 * @returns {Promise<Object>}
	 */
	getDeviceData(params = {}) {
		return this.getDeviceRealtimeData(params);
	}

	/**
	 * 获取睡眠报告列表（日期范围）
	 * @param {Object} params
	 * @param {string} params.mac 设备 MAC
	 * @param {string} params.start_date 开始日期 yyyy-MM-dd
	 * @param {string} params.end_date 结束日期 yyyy-MM-dd
	 * @returns {Promise<Object>}
	 */
	getSleepReportList(params = {}) {
		return this.request('GetSleepReportsByDateRange', {
			key: this.key,
			mac: params.mac || '',
			start_date: params.start_date || '',
			end_date: params.end_date || ''
		});
	}

	/**
	 * 获取睡眠报告详情
	 * @param {Object} params
	 * @param {string|number} params.report_id 报告ID
	 * @returns {Promise<Object>}
	 */
	getSleepReportDetail(params = {}) {
		return this.request('GetSleepReportDetailByReportId', {
			key: this.key,
			report_id: params.report_id
		});
	}
}

const soapDeviceApi = new SoapDeviceApi();

export { SoapDeviceApi, soapDeviceApi };
export default soapDeviceApi;
