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
	withDrawListApi: '/user/fenxiao/yongjin/detail/page'
}
/**
 * AI 检测
 * @param {Object} data
 */
export function addAILog(data) {
	return request_(base.baseUrl + api.addAIMeasureLog, data);
}
/**
 * 枕头使用历史数据
 * @param {Object} data
 */
export function addHistoryLog(data) {
	return request_(base.baseUrl + api.addHistoryLog, data);
}
/**
 * 学习结束
 * @param {Object} data
 */
export function addStudyLog(data) {
	return request_(base.baseUrl + api.addStudyLog, data);
}
/**
 * 保存模式
 * @param {Object} data
 */
export function addStoreAILog(data) {
	return request_(base.baseUrl + api.addStoreAILog, data);
}

/**
 * 当前使用的模式
 * @param {Object} data
 */
export function addUseLog(data) {
	let userId = '';
	let userInfo = uni.getStorageSync('userInfo');
	if (userInfo && userInfo.token) {
		userId = userInfo.userId;
	}
	return request_(base.baseUrl + api.addUseLog, {
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

			//更新用户信息
			// updateUserInfo().then((res) => {
			// 	uni.showToast({
			// 		title: '登录成功',
			// 		duration: 2000,
			// 		success() {
			// 			if (callback)
			// 				callback()
			// 		}
			// 	});
			// })

			// socket.init();
			// userInfo.token = userInfo.token;
		})
	})
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
				let code = loginRes.code
				resolve(code);
			},
			fail: (res) => {
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

function get_(url) {
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
		// uni.request({
		// 	url,
		// 	method,
		// 	{
		// 		'Content-Type': 'application/json;charset=UTF-8',
		// 		// 'project_token': base.projectToken, //项目token（可删除）
		// 	},
		// 	data: sortData,
		// 	success: res => {
		// 		console.log('====== params ======')
		// 		console.log(sortData)
		// 		console.log('====== result ======')
		// 		console.log(res.data)

		// 		const {
		// 			code,
		// 			data,
		// 			message
		// 		} = res.data

		// 		/**
		// 		 * 200 - 成功
		// 		 * 401 - 未登录
		// 		 * 400012 - 仅限公众号新粉丝参与
		// 		 * 40013 - 未注册
		// 		 * 40092 - 新人抽奖未中奖
		// 		 * 40098 - 新人抽奖无抽奖次数
		// 		 * 601 - 抽奖团前置校验未关注公众号
		// 		 */
		// 		if ([200, 40013, 40092].includes(code)) {
		// 			return resolve(wholeData ? res.data : data)
		// 		}
		// 		if ([601, 40098].includes(code)) {
		// 			return resolve(code)
		// 		}
		// 		// 仅限公众号新粉丝参与错误弹窗提示
		// 		if (code === 400012) {
		// 			return reject(res.data)
		// 		}

		// 		if (code === 401) { // 未登录清除用户信息
		// 			store.commit('LOGOUT')
		// 		}

		// 		!noToast && uni.showToast({
		// 			icon: 'none',
		// 			title: msg || '服务繁忙'
		// 		})
		// 		reject(res.data)
		// 	},
		// 	fail: err => {
		// 		reject(err)
		// 	}
		// })
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
			header['Authorization'] = storeUserInfo.token;
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
		// uni.request({
		// 	url,
		// 	method,
		// 	{
		// 		'Content-Type': 'application/json;charset=UTF-8',
		// 		// 'project_token': base.projectToken, //项目token（可删除）
		// 	},
		// 	data: sortData,
		// 	success: res => {
		// 		console.log('====== params ======')
		// 		console.log(sortData)
		// 		console.log('====== result ======')
		// 		console.log(res.data)

		// 		const {
		// 			code,
		// 			data,
		// 			message
		// 		} = res.data

		// 		/**
		// 		 * 200 - 成功
		// 		 * 401 - 未登录
		// 		 * 400012 - 仅限公众号新粉丝参与
		// 		 * 40013 - 未注册
		// 		 * 40092 - 新人抽奖未中奖
		// 		 * 40098 - 新人抽奖无抽奖次数
		// 		 * 601 - 抽奖团前置校验未关注公众号
		// 		 */
		// 		if ([200, 40013, 40092].includes(code)) {
		// 			return resolve(wholeData ? res.data : data)
		// 		}
		// 		if ([601, 40098].includes(code)) {
		// 			return resolve(code)
		// 		}
		// 		// 仅限公众号新粉丝参与错误弹窗提示
		// 		if (code === 400012) {
		// 			return reject(res.data)
		// 		}

		// 		if (code === 401) { // 未登录清除用户信息
		// 			store.commit('LOGOUT')
		// 		}

		// 		!noToast && uni.showToast({
		// 			icon: 'none',
		// 			title: msg || '服务繁忙'
		// 		})
		// 		reject(res.data)
		// 	},
		// 	fail: err => {
		// 		reject(err)
		// 	}
		// })
	})
}

// 获取用户信息
function requestGetUserInfo() {
	return request_(base.baseUrl + api.login, {}, true)
}

// export function async getUserInfo() {
// 	try {
// 		const infoRes = await this.requestGetUserInfo()
// 		// 更新有数用户信息
// 		const ysInfo = {
// 			user_id: infoRes.userId + '',
// 			tag: [{
// 				tag_id: infoRes.userId + '',
// 				tag_name: infoRes.nickname
// 			}]
// 		}
// 		this.$toast('登录成功')
// 		// this.sr.setUser(ysInfo)
// 		// // 上报登录
// 		// this.sr.track('login_wxapp')
// 		// this.$toast('登录成功')
// 		// this.UPDATE_USER_INFO(infoRes)
// 		// // 更新南迅积分
// 		// console.log('登录获取积分')
// 		// await getNxPointInfo(0)
// 		// this.$emit('success')
// 	} catch (err) {
// 		console.log(err)
// 	}
// }
// #endif