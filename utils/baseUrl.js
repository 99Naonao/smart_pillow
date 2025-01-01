let baseUrl = "";
let socketUrl = "";
let appId = 'wx43c54dcd8642d95b'; // 眠加家居枕头
let monkUrl = ""; //模拟数据地址
if (process.env.NODE_ENV === 'development') {
	// 开发环境
	// baseUrl = "http://192.168.7.221:8001/api"; // 此配置无需改动
	// baseUrl = "http://192.168.7.221:8001/api"; // 此配置无需改动
	baseUrl = "https://sleep.zsyl.cc/api"
	monkUrl = "http://localhost:8001";
	// monkUrl = "/";
	// #ifdef H5
	// 开发环境运行到H5,请在manifest.json中配置代理
	// #endif

	// #ifdef APP-PLUS
	console.log("APP-PLUS 真机调试", baseUrl)
	// baseUrl ="http://localhost:8080"
	//baseUrl = "https://dev-admin.yibianshoucang.com/api";
	// baseUrl = "https://admin.yibianshoucang.com/api"; //OneCard-万卡球星卡外网服务器接口
	baseUrl = "https://47.122.0.171:8081"; //测试服务器
	// #endif
	// socketUrl = "ws://localhost:6001/";
} else if (process.env.NODE_ENV === 'production') {
	// 测试环境
	// baseUrl = "https://dev-admin.yibianshoucang.com/api";

	// 生产环境
	//baseUrl = "https://admin.yibianshoucang.com/api";
	baseUrl = "https://sleep.zsyl.cc/api"
	// socketUrl = "ws://twin-ui.com:6001/";
}
const courtConfig = {
	//微信公众号APPID
	publicAppId: appId,
	//请求接口
	baseUrl: baseUrl,
	//模拟数据地址
	monkUrl: monkUrl,
	//webSocket地址
	socketUrl: socketUrl,
	//平台名称
	platformName: "OneCard-万卡球星卡",
	kefuWechat: "123456",
	//项目logo
	logoUrl: "https://qn.kemean.cn/upload/201906/19/3f3b4751f3ed4a97be804450c3ec4c79",
	//页面分享配置
	share: {
		title: '眠加商城',
		// #ifdef MP-WEIXIN
		path: '/pages/shop/shop', //小程序分享路径
		// #endif
		// #ifdef H5 || APP-PLUS
		//公众号||APP分享
		desc: "眠加商城", // 分享描述
		link: "https://www.kemean.com/sameCity/18031201/index.html", // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
		imgUrl: "http://qn.kemean.cn/upload/201901/28/23bedfc34597482292ecd6dc107f6342", // 分享图标
		// #endif
	}
};
//账号名验证正则表达式
const userNameRegular = /^\w{6,10}$/;

const phoneRegular = /^1\d{10}$/;

//邮箱验证正则表达式
const mailRegular = /^\w+@\w+(\.[a-zA-Z]{2,3}){1,2}$/;

//密码验证正则表达式
const passwordRegular = /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)])+$).{6,20}$/;

//6位数字支付密码
const payPasswordRegular = /^\d{6,}$/;

//昵称正则：中文、英文、数字但不包括下划线等符号
const nickNameRegular = /^[\u4E00-\u9FA5A-Za-z0-9\-\_]{1,20}$/;

//邀请码必须是4位
const recommendCodeRegular = /^[A-Z0-9]{6}$/;

const addressRegular = /^0x[a-zA-Z0-9]{18,}$/;

//腾讯地图小程序sdk key，这个key必须换成自己的，具体申请看README
const qqmapWxKey = "X4MBZ-NHR6K-N2ZJH-AOJMD-TZ2HT-PBFBB";
export default Object.assign({
	userNameRegular,
	phoneRegular,
	mailRegular,
	passwordRegular,
	payPasswordRegular,
	nickNameRegular,
	qqmapWxKey,
	recommendCodeRegular,
	addressRegular,
}, courtConfig);