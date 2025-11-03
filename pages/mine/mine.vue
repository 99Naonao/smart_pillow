<template>
	<view class="container">
		<z-nav-bar :bgColor="bgColorList" backState=2000 home='false' bgColorAngle="90"></z-nav-bar>
		<view class="info">
			<view class="user_info">
				<view class="top_info">
					<view class="avatar_bg">
						<image v-if="hasLogin" class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'"
							@click="navTo('/pages/my/set/userInfo')"></image>
						<image v-else class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'"
							@click="clickWxLogin"></image>
					</view>
					<view class="usernameInfo">
						<view class="userNickNameInfo" v-if="nickNameInputFlag">
							<text class="username">{{ userInfo.nickName || '点击头像自动登录' }}</text>
							<!-- <image src="../../static/icon/edit.png"></image> -->
						</view>
						<view class="username" v-else>
							<input class="username" type="text" placeholder="请输入新的昵称" @blur="inputClose()"
								v-model="newNickName" />
						</view>
					</view>
				</view>
			</view>
			<view class="score_part">
				<view class="score_info">
					<view class="sub_score_info">
						<image class="icon" src="../../static/score/SY_13_IconJF.png"></image>
						<view>我的积分</view>
					</view>
					<view class="score_txt">{{score}}</view>
				</view>
				<view class="btn" @click="go2Use">去使用</view>
			</view>
			<view class="desc">
				<!-- <view class="title">积分说明</view> -->
				<view class="rule-title">积分活动规则</view>
				<view class="popup__body">
					会员积分是眠加小程序商城针对会员购物、参加会员活动等情况而给予的奖励，积分可在“眠加小程序商城”和“眠加活力健康检测”中使用。您可在眠加会员中心（ 我的> 会员中心>
					积分）查看所获得的积分。具体的积分获取、使用规则详见如文规定。<br>
					<text>\n</text>
					一、积分获取规则：<br><br>
					<text>\n</text>
					1. 注册积分：在眠加小程序商城完成注册，送200初始积分；<br>
					2. 消费积分：会员在眠加小程序商城消费时，每消费1元可获得1积分，积分可累计；<br>
					3. 签到积分：会员每天签到可获得1积分，每月签到次数不超过31次；<br>
					4. 积分回馈的数量以订单完成时的商品实付金额和比例为准，且仅计取整数。例如购买1000.9元的商品，发放1000个积分。<br>
					<text>\n</text>
					二、积分兑换规则：<br><br>
					<text>\n</text>
					1. 适用范围：积分仅可在“眠加小程序商城”和“眠加活力健康检测”中使用，可用于商品购买、健康检测、礼品兑换、活动抽奖等；<br>
					2. 购物积分抵扣：会员可使用积分抵扣购物金额，每20积分可抵扣1元，最高可抵扣订单总金额的40%；<br>
					3. 健康检测积分抵扣：60积分可进行健康检测一次，健康检测无次数限制；<br>
					4. 积分兑换礼品：会员可使用积分兑换眠加小程序商城指定的礼品，兑换所需积分以具体兑换礼品为准；<br>
					5. 订单内全部商品确认收货后，且7天内未发生退货的情况下，所发放积分才可使用；<br>
					6. 若使用现金+积分购买商品，所使用积分不享受积分回馈权益，只有使用的现金享受积分回馈权益，且单个商品不能连续15次用积分购买；<br>
					7. 若使用优惠券购买商品，则优惠券折扣部分不享受积分回馈；<br>
					8. 支付订单一经提交则该笔订单中所使用的积分将会预扣处理，如您最终取消付款，所使用的积分将在一定时间内返还到您的眠加帐号；<br>
					9. 积分使用后无法退还，兑换所需要的积分数量可能发生变动，具体以实际兑换所需积分数量为准；<br>
					10. 积分不可兑现、转让、售卖或跨帐号使用，使用积分抵扣商品金额的部分作为销售折扣在发票上单独列示，使用积分抵扣全部金额的则不开发票；<br>
					11. 可使用积分抵扣的金额可能会根据情况相应调整，具体请以实际页面提示为准。<br><br>
					<text>\n</text>
					三、特别声明：<br><br>
					<text>\n</text>
					1. 眠加小程序商城对本规则拥有最终解释权，保留对细则进行变更，解释，及终止权利；<br>
					2. 如用户注销眠加小程序商城帐号，所获的积分将被清空并作废；<br>
					3. 当订单已完成，发生增值税发票更换普通发票情况时，不补发对应积分；发生普通发票更换增值税发票情况时，则需要扣减该笔订单发放的积分；<br>
					4.凡以违反积分规则的方式或采用不正当手段（包括但不限于作弊、恶意刷分、扰乱/破坏系统、恶意利用系统或者规则漏洞）获取、使用积分，我们有权根据其行为恶劣程度决定扣除您帐号内所有或部分积分，对于已使用积分，有权要求您返还已抵扣的订单金额或所兑换的礼品或权益；<br>
					5. 以上积分规则自2024年8月13日生效。<br>
				</view>
				<view class="info-part">
					<view class="opt-part">
						<view class="opt-btn" @click="uploadDataHandle" v-if="false">
							<label>上报数据</label>
						</view>
<!-- 						<view class="opt-btn" @click="sleepQuestions">
							<label>问卷调查</label>
						</view> -->
						<view class="opt-btn" @click="resetHandle">
							<label>设备校准</label>
						</view>
						<view class="opt-btn" @click="restartHandle">
							<label>设备重启</label>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="flex justify-content-space-around align-center" style="background-color: white;" v-if="false">
			<label class="tips">输入肩宽(mm)</label>
			<input ref="inputView" class="input-area" v-model="shoulderWidthNum" placeholder=""
				@blur="saveWdithHandle" />
		</view>
	</view>
</template>

<script>
	import blue_class from '../../utils/BlueManager'
	import {
		autoLogin
	} from '@/utils/miniapp.js'
	import {
		object2Query,
		parsePillowRealState,
		handPillowStatus,
		handPillowSideState,
		handPillowFrontState,
		handlePillowDelayState,
		hexStringToArrayBuffer,
		ab2hex,
		resetPillow,
		uploadDataRequest,
		initPillow,
		changeAdjustMode,
		changeSaveAdjustMode,
		hand1Shake,
		write2tooth,
		parsePillowState,
		sendModeByName,
		saveRandomMode,
		restartPillow,
		getAIModeByName
	} from '@/common/util.js'
	export default {
		computed: {
			shoulderWidth() {
				return this.shoulderWidthNum
			}
		},
		data() {
			return {
				bgColorList: [{
						color: "#5794d2",
						scale: "0%"
					},
					{
						color: "#607796",
						scale: "100%"
					}
				],
				title: 'Hello12123',
				hasLogin: false,
				nickNameInputFlag: true,
				score: 0,
				userInfo: {
					avatar: ''
				},
				shoulderWidthNum: ''
			}
		},
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 2
				});
			}

			let shoulderWidth = uni.getStorageSync('shoulderWidth');
			if (Number(shoulderWidth) > 0) {

			} else {
				shoulderWidth = 200;
			}

			this.shoulderWidthNum = shoulderWidth;

			this.refreshUserInfo();
		},
		methods: {
			restartHandle() {
				// 检查枕头是否连接
				if (!blue_class.getInstance().loginSuccess) {
					uni.showModal({
						title: '提示',
						content: '请先连接枕头设备',
						showCancel: false,
						confirmText: '我知道了'
					});
					return;
				}
				
				uni.showModal({
					title: '警告',
					content: '设备重启为专业操作，非专业人士請勿进行此操作。確定要重启设备吗？',
					confirmText: '确定重启',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							let arraybuffer = restartPillow(77);
							blue_class.getInstance().write2tooth(arraybuffer);
							uni.showToast({
								title: '设备重启指令已发送',
								icon: 'success'
							});
						}
					}
				});
			},
			resetHandle() {
				// 检查枕头是否连接
				if (!blue_class.getInstance().loginSuccess) {
					uni.showModal({
						title: '提示',
						content: '请先连接枕头设备',
						showCancel: false,
						confirmText: '我知道了'
					});
					return;
				}
				
				uni.showModal({
					title: '警告',
					content: '设备校准为专业操作，非专业人士请勿进行此操作。確定要校准设备吗？',
					confirmText: '确定校准',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							let reset_data = resetPillow(88);
							blue_class.getInstance().write2tooth(reset_data);
							uni.showToast({
								title: '设备校准指令已发送',
								icon: 'success'
							});
						}
					}
				});
			},
			sleepQuestions(){
				uni.navigateTo({
					url:"/pages/PSQI/NewPSQI"
				})
			},
			refreshUserInfo() {
				let userInfo = uni.getStorageSync('userInfo')
				if (userInfo && userInfo.token) {
					this.score = userInfo.score;
					this.userInfo = userInfo;
				}
			},
			go2Use() {
				// const url =
				// 	'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx1ac2da77b1e55f42&redirect_uri=https://sleep.zsyl.cc/sleeph5&response_type=code&scope=snsapi_userinfo&state=STATE';
				// const url2 = 'https://mp.weixin.qq.com/s/tsSJqende7UKJf2xZExZ7Q?token=1386691342&lang=zh_CN'

				// const url3 =
				// 	'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzkyMDQ5NTk0OQ&scene=124#wechat_redirect';
				const url5 = 'https://sleep.zsyl.cc/sleeph5/miniIndex.html'
				const navtitle = '健康检测'
				console.log('go2use:', url5)
				wx.navigateTo({
					// 跳转到webview页面
					url: `/pages/mine/webview?url=${url5}&nav=${navtitle}`,
				});
			},
			clickWxLogin() {
				autoLogin((res) => {
					console.log('success')
					console.log(uni.getStorageSync('userInfo'))
					this.refreshUserInfo();
				})
			},
			saveWdithHandle() {
				uni.setStorageSync('shoulderWidth', this.shoulderWidthNum);
				uni.showToast({
					title: '保存成功'
				})
			}
		}
	}
</script>

<style lang="scss">
	.container {
		// background-color: line-gradient(90deg, #5794d2, #607796);
		background: linear-gradient(90deg, rgb(87, 148, 210), rgb(96, 119, 150));

		.input-area {
			margin: 20rpx;
			letter-spacing: 2rpx;
			text-align: center;
			background-color: #406dafb2;
			border-radius: 10rpx;
			padding: 20rpx;
			color: white;
		}

		.tips {
			color: black;
			font-size: 28rpx;

		}

		.info {
			margin: 0 auto;
			background-color: white;
			border-top-left-radius: 30rpx;
			border-top-right-radius: 30rpx;
			margin-top: 200rpx;

			.user_info {
				position: relative;
				// overflow: hidden;
			}

			.top_info {
				top: -50rpx;
				margin: 0 auto;
				// left: 50%;
				// margin-left: 50%;
				text-align: center;
				position: relative;
			}



			.avatar_bg {
				width: 114upx;
				height: 114upx;
				border-radius: 100%;
				margin: 0 auto;
				border: 5px solid #fff;
				background-color: #FFF4EA;

				.avatar {
					flex-shrink: 0;
					width: 114upx;
					height: 114upx;
					transform: scale(1);
					border-radius: 100%;
					background-color: #FFF4EA;
				}
			}

			.username {
				color: #32455B;
				font-size: 35rpx;
			}

			.score_part {
				width: 700rpx;
				height: 130rpx;
				border-radius: 20rpx;
				margin: 0 auto;
				display: flex;
				line-height: 130rpx;
				font-size: 38rpx;
				color: #5B7897;
				justify-content: center;
				align-items: center;
				box-shadow: 0px 0px 22px #BBB;

				.sub_score_info {
					display: flex;
					justify-content: center;
					align-items: center;
					padding: 10rpx;
				}

				.score_txt {
					flex: 1;
					text-align: center;
					line-height: 60rpx;
					border-radius: 10rpx;
					margin-left: 10rpx;
					margin-right: 10rpx;
					font-size: 36rpx;
					background-color: #dadada;
				}

				.icon {
					width: 54rpx;
					height: 49rpx;
					padding: 10rpx;
				}

				.score_info {
					flex: 1;
					display: flex;
					justify-content: space-around;
					align-items: center;
				}

				.btn {
					width: 202rpx;
					height: 68rpx;
					line-height: 68rpx;
					text-align: center;
					font-size: 36rpx;
					background-color: rgb(238, 126, 39);
					border-radius: 10rpx;
					color: white;
					margin-right: 20rpx;
				}
			}

			.desc {
				font-size: 32rpx;
				color: #5B7897;
				line-height: 40rpx;
				padding-left: 66rpx;
				padding-right: 66rpx;
				padding-top: 60rpx;
				overflow: scroll;
				height: calc(100vh - 980rpx);

				.subtitle {
					padding-top: 20rpx;
					padding-bottom: 20rpx;
				}

				.title {
					font-size: 40rpx;
					padding-top: 20rpx;
					padding-bottom: 20rpx;
				}
			}
		}

		.opt-part {
			display: flex;
			justify-content: space-around;
			background-color: white;
			padding-top: 62rpx;
			position: relative;

			.opt-tips-con {
				display: flex;
				justify-content: space-around;
				position: relative;
			}

			.opt-tip1 {
				position: absolute;
				top: 95rpx;
				left: 50rpx;
				text-align: center;
				color: #676767;
			}

			.opt-tip2 {
				position: absolute;
				top: 95rpx;
				right: 50rpx;
				text-align: center;
				color: #676767;
			}

			.opt-btn {
				width: 284rpx;
				height: 90rpx;
				margin-right: 10rpx;
				display: flex;
				justify-content: space-around;
				align-items: center;
				background-color: rgb(28, 68, 133);
				border-radius: 30rpx;
				line-height: 56rpx;
				color: white;
			}

			.opt-btn-top {
				background-color: rgb(79, 128, 191);
			}


			.icon {
				width: 56rpx;
				height: 56rpx;
			}
		}
	}
</style>