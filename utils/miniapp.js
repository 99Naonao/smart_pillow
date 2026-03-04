// #ifdef MP-WEIXIN
import base from '@/utils/baseUrl';
// import store from '@/store';
const api = {
	login: '/ybLoginWx',
	cardList: '/card/serList',
	wxLogin: '/ybLoginWx',
	drawList: '/ybUserWithdrawList',
	withDraw2WX: '/ybUserWithdraw',
	cityList: 'https://sleep.zsyl.cc/sleep/city.json',
	wxPay: '/ybGbUserOrder/pay',
	qrCode: '/getWxQrCode',
	fenxiaoRule: '/ybDictFenxiao/detail',
	addAIMeasureLog: '/ybUserPillow/add',
	addHistoryLog: '/ybUserPillowHis/add',
	addStudyLog: '/ybUserPillowStudy/add',
	addStoreAILog: '/ybUserPillowAi/add',
	addUseLog: '/ybUserPillowNow/update',
	appVersion: '/appVersion',
	withDrawListApi: '/user/fenxiao/yongjin/detail/page',
	pushSmartPillowData: '/shopapi/UserEquipment/pushSmartPillowData',
	wechatPhoneLogin: '/shopapi/UserEquipment/decrypttWechatPhoneLogin'
}

/**
 * @param {Object} headPillowData 仰卧头枕数据
 * @param {Object} neckPillowData 仰卧颈枕数据
 * @param {Object} sideHeadPillowData 侧卧头枕数据
 * @param {Object} sideNeckPillowData 侧卧颈枕数据,
 */
export function callPushSmartPillowData(headPillowData, neckPillowData, sideHeadPillowData, sideNeckPillowData) {
	const userInfo = uni.getStorageSync('userInfo');
	const requestParams = {
		supine_headrest: headPillowData,
		supine_neck_pillow: neckPillowData,
		side_lying_headrest: sideHeadPillowData,
		side_lying_neck_pillow: sideNeckPillowData,
		nickname: userInfo.nickName,
		mobile: userInfo.mobile,
		user_id: userInfo.user_id,
		user_sn: userInfo.user_sn,
		version: '1'
	}
	console.log('枕头上送的数据：', requestParams)
	return pushPillowData(requestParams).then(res => {
		console.log('智能枕头数据提交成功:', res);
		return res;
	}).catch(error => {
		console.error('智能枕头数据提交失败:', error);
		throw error
	})
}

/**
 * 推送智能枕头数据
 * @param {Object} params - 请求参数
 * @param {string} [params.nickname] - 用户昵称（三选一）
 * @param {string} [params.user_sn] - 用户编号（三选一）
 * @param {string} [params.user_id] - 用户ID（三选一）
 * @param {string} [params.supine_headrest] - 仰卧头枕数据
 * @param {string} [params.supine_neck_pillow] - 仰卧颈枕数据
 * @param {string} [params.side_lying_headrest] - 侧卧头枕数据
 * @param {string} [params.side_lying_neck_pillow] - 侧卧颈枕数据
 * @param {string} [params.version] - 版本号（放入Header）
 * @returns {Promise} 请求Promise
 */
export function pushPillowData(params = {}) {
	let requestUrl = 'https://zhongshu.xinglu.shop';
	// 分离Header参数（version）和Body参数
	const {
		version,
		...bodyParams
	} = params;

	// 构建Header（仅放version）
	const header = {};
	if (version) {
		header.version = version;
	}

	// 调用专用的pushRequest_方法，传入JSON格式的body和version头
	return pushRequest_(requestUrl + '/shopapi/UserEquipment/pushSmartPillowData', bodyParams, header);
}



/**
 * AI 检测
 * @param {Object} data
 */
export function addAILog(data) {
	return publicMethod(api.addAIMeasureLog, data);
}
/**
 * 枕头使用历史数据
 * @param {Object} data
 */
export function addHistoryLog(data) {
	return publicMethod(api.addHistoryLog, data);
}
/**
 * 学习结束
 * @param {Object} data
 */
export function addStudyLog(data) {
	return publicMethod(api.addStudyLog, data);
}
/**
 * 保存模式
 * @param {Object} data
 */
export function addStoreAILog(data) {
	return publicMethod(api.addStoreAILog, data);
}

/**
 * 当前使用的模式
 * @param {Object} data
 */
export function addUseLog(data) {
	return publicMethod(api.addUseLog, data);

}

function publicMethod(apipath, data) {
	let userId = '';
	let userInfo = uni.getStorageSync('userInfo');
	if (userInfo && userInfo.token) {
		userId = userInfo.userId;
	}
	return request_(base.baseUrl + apipath, {
		userId: userId,
		content: JSON.stringify(data)
	});
}

export function getWxUserInfo() {
	var that = this;
	var lang = 'cn'
	uni.getUserProfile({
		lang: lang,
		desc: '登录',
		success: (res) => {
			console.log(res.userInfo);
			var city = res.userInfo.city
			var country = res.userInfo.country
			var nickName = res.userInfo.nickName
			var province = res.userInfo.province
			var avatarUrl = res.userInfo.avatarUrl
			// that.city = city;
			// that.country = country;
			// that.nickName = nickName;
			// that.province = province;
		},
		fail: (res) => {
			console.log(res, "userinfo fail");
		}
	})
}

function setUserInfo(userInfo) {
	//请求前加入token
	uni.setStorageSync("userInfo", userInfo);
}
/**
 * 自动登录
 **/
export function autoLogin(callback) {
	onGetCode().then((code) => {
		console.log('onGetcode:', code)
		let data = {
			'code': code,
			'appId': base.publicAppId, // 眠加家居
			'userName': code
		}
		wxLogin(data).then((res) => {
			uni.showToast({
				title: "登录成功"
			});
			let userInfo = res
			console.log('wxlogin:', userInfo)
			setUserInfo(userInfo);
			uni.showToast({
				title: '登录成功',
				duration: 2000,
				success() {

					if (callback)
						callback()
				}
			});
		})
	})
}

/**
 * 微信手机号快捷登录
 * 对应接口：/shopapi/UserEquipment/equipmentWechatPhoneLogin
 *
 * @param {Object} params
 * @param {String} params.encryptedData 微信返回的加密数据
 * @param {String} params.iv           微信返回的偏移量
 * @param {String} [params.phone_code] 手机号验证码（可选，当前留空）
 * @param {Number} params.terminal     终端标识（例如 7 = 智能枕小程序）
 * @param {String} params.wx_code      微信 login 获得的 code
 * @param {String} [params.version]    版本号（放入 Header，例如 '3.1.1'）
 * @returns {Promise<Object>} 返回后端的 data 对象（包含 token、mobile、nickname 等）
 */
export function getPhoneByCode(params = {}) {
	return new Promise((resolve, reject) => {
		if (!params.encryptedData || !params.iv || !params.wx_code) {
			console.warn('getPhoneByCode 参数缺失:', params);
			reject(new Error('缺少必要参数'));
			return;
		}

		const {
			version,
			...bodyParams
		} = params;
		const header = {
			'content-type': 'application/json; charset=utf-8'
		};
		if (version) {
			header.version = version;
		}
		let requestUrl = 'https://zhongshu.xinglu.shop'
		uni.request({
			url: requestUrl + api.wechatPhoneLogin,
			method: 'POST',
			header,
			data: bodyParams,
			success(res) {
				console.log('通过code获取手机号成功：', res);
				resolve(res.data);
			},
			fail(error) {
				console.log('通过code获取手机号失败：', error);
				reject(error);
			}
		});
	});
}

/**
 * 
 * @param {
 * pageSize分销明细
 * pageNo} data 
 * @returns 
 */
export function fenxiaoInfo(data) {
	// api/user/fenxiao/yongjin/detail/page?mtrlNo=&mtrlName=&mtrlStatus=&pageNo=1&pageSize=15&userId=26
	return get_(base.baseUrl + api.withDrawListApi, data);
}
/** 获取登录code**/
export async function onGetCode() {
	return new Promise((resolve, reject) => {
		const platform = uni.getSystemInfoSync().platform;
		uni.login({
			platform,
			success: function(loginRes) {
				console.log('获取登录code结果成功：', loginRes.code)
				let code = loginRes.code
				resolve(code);
			},
			fail: (res) => {
				console.log('获取登录code结果失败：', res)
				uni.showToast({
					title: res.errMsg
				})
				reject()
			}
		})
	})
}

/**
 * 微信小程序用户授权登录
 * @param {Object} data
 * @param {String} data.code - 小程序code
 * @param {String} data.encryptedData - 微信加密的用户数据
 * @param {String} data.iv - 偏移量
 */
export function wxLogin(data) {
	// const fromId = store.getters.fromUid
	// data.fromId = fromId
	return request_(base.baseUrl + api.wxLogin, data)
}
/** 列表**/
export function cardList() {
	return get_(base.baseUrl + api.cardList)
}
/**二维码生成接口**/
export function getSeperateQRCode(data) {
	return request_(base.baseUrl + api.qrCode, data);
}
/**获取app版本**/
export function getappVersion(data) {
	return get_(base.baseUrl + api.appVersion, data);
}

/** 列表**/
export function getCityList() {
	return getJson_(api.cityList)
}
/**微信支付**/
export async function wxPay(data) {
	let result = await request_(base.baseUrl + api.wxPay, data);
	const {
		wechat,
		orderInfo,
		payType,
		paymoney
	} = result
	// 余额支付
	if (payType === 1) return result
	// 用户积分兑换支付 类型大于15
	if (payType >= 15) return result
	// 如果需要支付，则往下走支付弹窗，否则直接成功
	if (paymoney > 0) {

	} else {
		return result
	}

	let paymentParams = {}

	// 获取支付提供商
	console.log('获取支付提供商')
	const providerRes = await uni.getProvider({
		service: 'payment'
	})
	console.log(providerRes)
	if (providerRes[0]) throw Error(providerRes[0].errMsg)
	paymentParams.provider = providerRes[1].provider[0]

	// 微信支付指定支付入参
	if (data.payType === 9) {
		paymentParams = Object.assign({}, paymentParams, wechat)
	}
	// 支付
	const paymentRes = await uni.requestPayment(paymentParams)
	console.log('paymentRes:', paymentRes)
	if (paymentRes[0]) {
		const msg = paymentRes[0].errMsg.includes('requestPayment:fail cancel') ? '取消支付' : paymentRes[0].errMsg
		throw Error(msg)
	}

	// 处理微信支付回调
}


function getJson_(url) {
	return new Promise((resolve, reject) => {
		console.log('====== url ======')
		console.log(url)
		uni.request({
			url: url,
			method: 'GET',
			header: {
				'Content-Type': 'application/json;charset=UTF-8'
			},
			success: res => {
				console.log('====== result ======')
				console.log(res.data)
				const {
					data,
				} = res

				// if ([200].includes(code)) {
				return resolve(data)
				// }
			},
			fail: err => {
				reject(err)
			}
		})
	})
}

function get_(url, _data = {}) {
	return new Promise((resolve, reject) => {
		console.log('====== url ======')
		console.log(url)
		uni.request({
			url: url,
			method: 'GET',
			data: _data,
			header: {
				'Content-Type': 'application/json;charset=UTF-8'
			},
			success: res => {
				console.log('====== result ======')
				console.log(res.data)
				const {
					code,
					data,
					message
				} = res.data

				if ([601, 40098].includes(code)) {
					return resolve(code)
				}
				// if ([200].includes(code)) {
				return resolve(data)
				// }
			},
			fail: err => {
				reject(err)
			}
		})

	})
}

function request_(url, sortData) {
	return new Promise((resolve, reject) => {
		console.log('====== url ======')
		console.log(url)

		//请求前加入token
		let storeUserInfo = uni.getStorageSync("userInfo");
		console.log('storeUserInfo', storeUserInfo)
		let header = {
			'Content-Type': 'application/json;charset=UTF-8'
		}

		// console.log("token", storeUserInfo.token)
		if (storeUserInfo.token) {
			// header['Authorization'] = storeUserInfo.token;
			// options.header['Cookie'] = '';  
		};
		console.log('header', header)
		uni.showLoading({
			title: '加载中'
		})
		uni.request({
			url: url,
			method: 'POST',
			header: header,
			data: sortData,
			success: res => {
				// store.commit("setLoadingShow", false);
				uni.hideLoading()
				console.log('====== params ======')
				console.log(sortData)
				console.log('====== result ======')
				console.log(res.data)
				const {
					code,
					data,
					message
				} = res.data

				if ([601, 40098].includes(code)) {
					return resolve(code)
				}
				// if ([200].includes(code)) {
				return resolve(data)
				// }
			},
			fail: err => {
				uni.hideLoading()
				reject(err),
					store.commit("setLoadingShow", false);
			}
		})
	})
}

// 获取用户信息
function requestGetUserInfo() {
	return request_(base.baseUrl + api.login, {}, true)
}

/**
 * 智能枕头数据接口专用请求方法（JSON格式 + version放Header）
 * @param {string} url - 请求地址
 * @param {Object} data - JSON格式的请求数据
 * @param {Object} [header={}] - 额外请求头（如version）
 * @returns {Promise} 请求Promise
 */
function pushRequest_(url, data, header = {}) {
	return new Promise((resolve, reject) => {
		console.log('====== 智能枕头接口 - 请求地址 ======');
		console.log(url);

		// 1. 获取用户信息，拼接token（如有需要）
		const storeUserInfo = uni.getStorageSync("userInfo");
		console.log('用户信息:', storeUserInfo);

		// 2. 固定设置JSON格式请求头 + 合并传入的header（如version）
		const finalHeader = {
			'Content-Type': 'application/json; charset=utf-8',
			...header // 合并version等自定义Header
		};
		// 如有token需要携带，取消下面注释即可
		// if (storeUserInfo?.token) {
		//   finalHeader['Authorization'] = storeUserInfo.token;
		// }
		console.log('最终请求头:', finalHeader);

		// 3. 显示加载中
		uni.showLoading({
			title: '数据提交中'
		});

		// 4. 发起POST请求（JSON格式传参）
		uni.request({
			url: url,
			method: 'POST',
			header: finalHeader,
			data: data, // 直接传JSON对象，uni.request会自动序列化
			success: (res) => {
				uni.hideLoading();
				console.log('====== 请求参数 ======');
				console.log(data);
				console.log('====== 接口响应 ======');
				console.log(res.data);

				// 解析响应结构
				const {
					code,
					show,
					msg,
					data: responseData
				} = res.data;

				// 特殊错误码处理
				if ([601, 40098].includes(code)) {
					return resolve(code);
				}

				// 成功返回完整响应数据
				resolve(res.data);
			},
			fail: (err) => {
				uni.hideLoading();
				console.error('接口请求失败:', err);
				reject(err);
			}
		});
	});
}


// #endif