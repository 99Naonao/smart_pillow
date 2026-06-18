<template>
	<view class="mine-page">
		<z-nav-bar
			bg-color="#F0F6F7"
			title="我的"
			font-color="#051C2C"
			:shadow="true"
			:backState="2000"
			:homeState="2000"
			bgColorAngle="90"
		/>

		<scroll-view scroll-y class="mine-scroll" :show-scrollbar="false">
			<!-- 顶部用户区 -->
			<view class="profile-hero">
				<view class="profile-card">
					<button
						v-if="!hasLogin"
						class="profile-login-btn"
						open-type="getPhoneNumber"
						@getphonenumber="onGetPhoneNumber"
					>
						<view class="profile-row">
							<view class="avatar-wrap">
								<image
									class="avatar"
									:src="userInfo.avatar || '/static/icon/default_avatar.png'"
									mode="aspectFill"
								/>
							</view>
							<view class="profile-text">
								<text class="profile-name">点击此处登录</text>
								<text class="profile-sub">登录后可同步积分与睡眠数据</text>
							</view>
						</view>
					</button>
					<view v-else class="profile-row">
						<view class="avatar-wrap">
							<image
								class="avatar"
								:src="userInfo.avatar || '/static/icon/default_avatar.png'"
								mode="aspectFill"
							/>
						</view>
						<view class="profile-text">
							<text class="profile-name">{{ userInfo.nickName || '会员用户' }}</text>
							<text v-if="displayMobile" class="profile-sub">{{ displayMobile }}</text>
						</view>
						<view class="profile-badge">
							<text class="profile-badge-txt">已登录</text>
						</view>
					</view>
				</view>

				<!-- 积分条 -->
				<view class="stat-card" @click="go2Use">
					<view class="stat-left">
						<image class="stat-ico" src="../../static/score/SY_13_IconJF.png" mode="aspectFit" />
						<view class="stat-info">
							<text class="stat-label">我的积分</text>
							<text class="stat-value">{{ score }}</text>
						</view>
					</view>
					<view class="stat-action">
						<text class="stat-action-txt">去使用</text>
						<text class="stat-arrow">›</text>
					</view>
				</view>
			</view>

			<!-- 常用功能 -->
			<view class="menu-section">
				<text class="menu-section-title">常用功能</text>
				<view class="menu-card">
<!-- 					<view class="menu-item" @click="go2Use">
						<image class="menu-ico" src="../../static/icon/study.png" mode="aspectFit" />
						<text class="menu-label">健康检测</text>
						<text class="menu-arrow">›</text>
					</view> -->
					<view class="menu-divider" />
					<view class="menu-item" @click="goSleepReportList">
						<image class="menu-ico" src="../../static/icon/histogram.png" mode="aspectFit" />
						<text class="menu-label">睡眠报告</text>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-divider" />
					<view class="menu-item" @click="openPolicySheet('points')">
						<image class="menu-ico" src="../../static/icon/score_rule.png" mode="aspectFit" />
						<text class="menu-label">积分规则</text>
						<text class="menu-arrow">›</text>
					</view>
				</view>
			</view>

			<!-- 协议与政策（对应 protocol 目录下 txt） -->
			<view class="menu-section">
				<text class="menu-section-title">协议与政策</text>
				<view class="menu-card">
					<view class="menu-item" @click="openPolicySheet('user')">
						<image class="menu-ico" src="../../static/icon/remind.png" mode="aspectFit" />
						<text class="menu-label">用户协议</text>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-divider" />
					<view class="menu-item" @click="openPolicySheet('privacy')">
						<image class="menu-ico" src="../../static/icon/question.png" mode="aspectFit" />
						<text class="menu-label">隐私政策</text>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-divider" />
					<view class="menu-item" @click="openPolicySheet('service')">
						<image class="menu-ico" src="../../static/icon/service.png" mode="aspectFit" />
						<text class="menu-label">服务协议</text>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-divider" />
					<view class="menu-item" @click="goAbout">
						<image class="menu-ico" src="../../static/icon/about_us.png" mode="aspectFit" />
						<text class="menu-label">关于我们</text>
						<text class="menu-arrow">›</text>
					</view>
				</view>
			</view>

			<!-- 设备环境：仅开发版 / 体验版显示，正式版（release）隐藏 -->
			<view v-if="showDeviceEnvSection" class="menu-section">
				<text class="menu-section-title">设备环境</text>
				<view class="menu-card">
					<view class="menu-item" @click="goBleTest">
						<image class="menu-ico" src="../../static/icon/bluetooth.png" mode="aspectFit" />
						<text class="menu-label">蓝牙协议测试</text>
						<text class="menu-arrow">›</text>
					</view>
				</view>
			</view>

			<view v-if="hasLogin" class="logout-block">
				<button class="logout-btn" @click="logout">退出登录</button>
			</view>

			<view class="mine-footer-space" />
		</scroll-view>

		<!-- 积分规则 / 协议政策（可滚动） -->
		<view v-if="showPolicySheet" class="rules-mask" @click.self="closePolicySheet">
			<view class="rules-panel" @click.stop>
				<view class="rules-head">
					<text class="rules-title">{{ policySheetTitle }}</text>
					<text class="rules-close" @click="closePolicySheet">关闭</text>
				</view>
				<scroll-view
					scroll-y
					:show-scrollbar="true"
					:enable-back-to-top="true"
					class="rules-scroll"
				>
					<view class="rules-inner">
						<view class="rules-text">{{ policySheetBody }}</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getPhoneByCode, onGetCode } from '@/utils/miniapp.js';
	import { getMiniProgramEnv } from '@/common/util.js';
	import {
		RULES_POINTS,
		PROTOCOL_USER,
		PROTOCOL_PRIVACY,
		PROTOCOL_SERVICE
	} from '@/common/protocolTexts.js';
	import { PAGE_BLE_TEST } from '@/common/navigation.js';

	export default {
		computed: {
			/** 非正式环境（develop / trial）才展示设备环境入口；正式版 release 不展示 */
			showDeviceEnvSection() {
				const env = this.miniProgramEnv;
				return !!(env && env.isRelease === false);
			},
			shoulderWidth() {
				return this.shoulderWidthNum;
			},
			displayMobile() {
				const m = this.userInfo && this.userInfo.mobile;
				if (!m || String(m).length < 7) return '';
				const s = String(m);
				if (s.length === 11) {
					return s.slice(0, 3) + '****' + s.slice(7);
				}
				return s;
			}
		},
		data() {
			return {
				hasLogin: false,
				score: 0,
				userInfo: {
					avatar: ''
				},
				shoulderWidthNum: '',
				miniProgramEnv: getMiniProgramEnv(),
				wxLoginCode: '',
				wxLoginCodeAt: 0,
				showPolicySheet: false,
				policySheetTitle: '',
				policySheetBody: ''
			};
		},
		onShow() {
			this.miniProgramEnv = getMiniProgramEnv();
			const curPages = getCurrentPages()[0];
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({ selected: 2 });
			}
			let shoulderWidth = uni.getStorageSync('shoulderWidth');
			if (Number(shoulderWidth) <= 0) {
				shoulderWidth = 200;
			}
			this.shoulderWidthNum = shoulderWidth;
			this.refreshUserInfo();
			if (!this.hasLogin) {
				// 避免沿用页面实例里过期的 wx_code（例如长时间登录期间从未预取、退出后未切换 Tab 未触发 onShow）
				this.wxLoginCode = '';
				this.wxLoginCodeAt = 0;
				this.prefetchWxLoginCodeForPhone();
			}
		},
		methods: {
			toUserInfo() {
				uni.showToast({ title: '个人资料', icon: 'none' });
			},
			openPolicySheet(type) {
				const map = {
					points: { title: '积分规则', content: RULES_POINTS },
					user: { title: '用户协议', content: PROTOCOL_USER },
					privacy: { title: '隐私政策', content: PROTOCOL_PRIVACY },
					service: { title: '服务协议', content: PROTOCOL_SERVICE }
				};
				const item = map[type];
				if (!item) {
					return;
				}
				this.policySheetTitle = item.title;
				this.policySheetBody = item.content;
				this.showPolicySheet = true;
			},
			closePolicySheet() {
				this.showPolicySheet = false;
			},
			refreshUserInfo() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.token) {
					this.score = userInfo.score || 0;
					this.userInfo = userInfo;
					this.hasLogin = true;
				} else {
					this.score = 0;
					this.userInfo = { avatar: '' };
					this.hasLogin = false;
				}
			},
			go2Use() {
				const url5 = 'https://sleep.xinglu.shop/sleeph5';
				const navtitle = '健康检测';
				const q = `url=${encodeURIComponent(url5)}&nav=${encodeURIComponent(navtitle)}`;
				uni.navigateTo({
					url: `/pages/mine/webview?${q}`,
					fail: (err) => {
						console.error('navigateTo webview 失败', err);
						uni.showToast({ title: '页面打开失败，请稍后重试', icon: 'none' });
					}
				});
			},
			goSleepReportList() {
				uni.navigateTo({
					url: '/pages/sleepReportList/sleepReportList'
				});
			},
			goBleTest() {
				uni.navigateTo({ url: PAGE_BLE_TEST });
			},
			goAbout() {
				uni.navigateTo({ url: '/pages/about/about' });
			},
			async prefetchWxLoginCodeForPhone() {
				try {
					const code = await onGetCode();
					this.wxLoginCode = code;
					this.wxLoginCodeAt = Date.now();
				} catch (err) {
					this.wxLoginCode = '';
					this.wxLoginCodeAt = 0;
				}
			},
			async onGetPhoneNumber(e) {
				if (!e.detail || e.detail.errMsg !== 'getPhoneNumber:ok') {
					uni.showToast({ title: '已取消授权手机号', icon: 'none' });
					return;
				}
				const { encryptedData, iv } = e.detail;
				if (!encryptedData || !iv) {
					uni.showToast({ title: '获取手机号数据失败', icon: 'none' });
					return;
				}
				/** 微信 login code 有效期约 5 分钟，略缩短避免临界时刻与 session_key 不一致导致解密失败 */
		const CODE_MAX_AGE_MS = 3 * 60 * 1000;
				const wx_code = this.wxLoginCode;
				if (!wx_code || Date.now() - this.wxLoginCodeAt > CODE_MAX_AGE_MS) {
					uni.showToast({
						title: '登录态未就绪或已过期，请稍后再点一次头像',
						icon: 'none'
					});
					this.prefetchWxLoginCodeForPhone();
					return;
				}
				try {
					const params = {
						encryptedData,
						iv,
						phone_code: '',
						terminal: 7,
						wx_code,
						version: '1.0.10'
					};
					const res = await getPhoneByCode(params);
					this.wxLoginCode = '';
					this.wxLoginCodeAt = 0;
					if (res && res.code === 1 && res.data) {
						const data = res.data;
						const userInfo = {
							token: data.token,
							nickName: data.nickname,
							avatar: data.avatar,
							mobile: data.mobile,
							user_sn: data.sn,
							user_id: data.user_id,
							score: data.user_integral || 0
						};
						uni.setStorageSync('userInfo', userInfo);
						this.score = userInfo.score;
						this.userInfo = userInfo;
						this.hasLogin = true;
						uni.showToast({ title: '登录成功', icon: 'success' });
					} else {
						const msg = (res && res.msg) || '登录失败，请重试';
						if (msg.indexOf('微信手机号解密失败') > -1) {
							uni.showModal({
								title: '授权失败',
								content: '授权信息校验未完成，请在此点击头像重新完成授权',
								showCancel: false,
								confirmText: '我知道了'
							});
						} else {
							uni.showToast({ title: msg, icon: 'none' });
						}
						this.prefetchWxLoginCodeForPhone();
					}
				} catch (error) {
					console.error('微信手机号快捷登录异常:', error);
					this.wxLoginCode = '';
					this.wxLoginCodeAt = 0;
					this.prefetchWxLoginCodeForPhone();
					uni.showModal({
						title: '授权失败',
						content: '授权信息校验异常，请再次点击头像重新完成授权',
						showCancel: false,
						confirmText: '我知道了'
					});
				}
			},
			logout() {
				uni.showModal({
					title: '退出登录',
					content: '退出后将无法使用枕头相关能力，是否确认？',
					confirmText: '退出登录',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('userInfo');
							this.hasLogin = false;
							this.userInfo = { avatar: '' };
							this.score = 0;
							// 退出后立即换新 code，避免下次点头像仍用旧 session 对应关系导致「微信手机号解密失败」
							this.wxLoginCode = '';
							this.wxLoginCodeAt = 0;
							this.prefetchWxLoginCodeForPhone();
							uni.showToast({ title: '已退出登录', icon: 'success' });
						}
					}
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.mine-page {
		min-height: 100vh;
		height: 100vh;
		background-color: #F0F6F7;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.mine-scroll {
		flex: 1;
		height: 0;
		padding: 0 28rpx;
		padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.profile-hero {
		padding-top: 20rpx;
		margin-bottom: 24rpx;
	}

	.profile-card {
		background: linear-gradient(135deg, #ffffff 0%, #F0F6F7 100%);
		border-radius: 24rpx;
		padding: 36rpx 28rpx 32rpx;
		box-shadow: 0 8rpx 32rpx rgba(5, 28, 44, 0.1);
		border: 1rpx solid rgba(175, 160, 201, 0.35);
		margin-bottom: 20rpx;
	}

	.profile-row {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.profile-login-btn {
		width: 100%;
		padding: 0;
		margin: 0;
		border: none;
		background: transparent;
		text-align: left;
		line-height: normal;
		border-radius: 0;
	}

	.profile-login-btn::after {
		border: none;
	}

	.avatar-wrap {
		flex-shrink: 0;
		margin-right: 24rpx;
	}

	.avatar {
		width: 128rpx;
		height: 128rpx;
		border-radius: 50%;
		background-color: #F0F6F7;
		border: 4rpx solid #fff;
		box-shadow: 0 4rpx 16rpx rgba(5, 28, 44, 0.12);
	}

	.profile-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 10rpx;
	}

	.profile-name {
		font-size: 36rpx;
		font-weight: 600;
		color: #051C2C;
		line-height: 1.3;
	}

	.profile-sub {
		font-size: 24rpx;
		color: rgba(5, 28, 44, 0.7);
		line-height: 1.4;
	}

	.profile-badge {
		flex-shrink: 0;
		padding: 8rpx 18rpx;
		background: rgba(76, 140, 182, 0.16);
		border-radius: 999rpx;
	}

	.profile-badge-txt {
		font-size: 22rpx;
		color: #083969;
	}

	.stat-card {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background-color: #fff;
		border-radius: 20rpx;
		padding: 28rpx 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(5, 28, 44, 0.08);
		border: 1rpx solid rgba(175, 160, 201, 0.35);
	}

	.stat-left {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.stat-ico {
		width: 72rpx;
		height: 72rpx;
		margin-right: 20rpx;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: rgba(5, 28, 44, 0.7);
	}

	.stat-value {
		font-size: 40rpx;
		font-weight: 700;
		color: #051C2C;
		letter-spacing: 1rpx;
	}

	.stat-action {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.stat-action-txt {
		font-size: 28rpx;
		color: #083969;
		font-weight: 500;
	}

	.stat-arrow {
		font-size: 36rpx;
		color: rgba(5, 28, 44, 0.45);
		margin-left: 4rpx;
		line-height: 1;
	}

	.menu-section {
		margin-bottom: 28rpx;
	}

	.menu-section-title {
		display: block;
		font-size: 26rpx;
		color: rgba(5, 28, 44, 0.7);
		margin-bottom: 16rpx;
		padding-left: 8rpx;
	}

	.menu-card {
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(5, 28, 44, 0.08);
		border: 1rpx solid rgba(175, 160, 201, 0.35);
	}

	.menu-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 28rpx 24rpx;
		min-height: 96rpx;
		box-sizing: border-box;
	}

	.menu-item:active {
		background-color: #F0F6F7;
	}

	.menu-ico {
		width: 40rpx;
		height: 40rpx;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.menu-label {
		flex: 1;
		font-size: 30rpx;
		color: #051C2C;
	}

	.menu-arrow {
		font-size: 32rpx;
		color: rgba(5, 28, 44, 0.35);
		line-height: 1;
	}

	.menu-divider {
		height: 1rpx;
		background-color: #F0F6F7;
		margin-left: 84rpx;
	}

	.logout-block {
		padding: 16rpx 0 32rpx;
	}

	.logout-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background-color: #fff;
		color: rgba(5, 28, 44, 0.7);
		font-size: 30rpx;
		border-radius: 20rpx;
		border: 1rpx solid rgba(175, 160, 201, 0.35);
		box-shadow: 0 2rpx 8rpx rgba(5, 28, 44, 0.08);
	}

	.logout-btn::after {
		border: none;
	}

	.mine-footer-space {
		height: 24rpx;
	}

	.rules-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(5, 28, 44, 0.5);
		z-index: 300;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.rules-panel {
		width: 100%;
		height: 82vh;
		max-height: 82vh;
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding-bottom: env(safe-area-inset-bottom);
		box-sizing: border-box;
	}

	.rules-head {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 32rpx;
		border-bottom: 1rpx solid rgba(175, 160, 201, 0.3);
	}

	.rules-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #051C2C;
	}

	.rules-close {
		font-size: 28rpx;
		color: #083969;
	}

	/* 小程序 scroll-view 必须占满剩余高度，父级需固定高度 + overflow:hidden */
	.rules-scroll {
		flex: 1;
		height: 0;
		min-height: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.rules-inner {
		padding: 24rpx 32rpx calc(120rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.rules-text {
		display: block;
		font-size: 26rpx;
		color: rgba(5, 28, 44, 0.8);
		line-height: 1.65;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
