<template>
	<view class="about-page">
		<z-nav-bar
			bg-color="#ffffff"
			title="关于我们"
			font-color="#1e293b"
			:shadow="true"
			backState="1000"
			bgColorAngle="90"
		/>

		<view class="about-body">
			<view class="logo-wrap">
				<!-- aspectFit + 固定高度区：避免 widthFix 高度取整导致底边被裁切 -->
				<view class="logo-box">
					<image class="logo" src="../../static/icon/logo.png" mode="aspectFit" />
				</view>
			</view>

			<view class="info-card">
				<view class="info-row" @click="callPhone">
					<text class="info-label">联系电话</text>
					<text class="info-value link">{{ contactPhone }}</text>
					<text class="info-arrow">›</text>
				</view>
				<view class="info-divider" />
				<view class="info-row">
					<text class="info-label">固件版本号</text>
					<text class="info-value">{{ firmwareVersion }}</text>
				</view>
			</view>

		</view>
	</view>
</template>

<script>
	import { readFirmwareVersionCache, formatFirmwareVersionFromRaw } from '@/utils/BlueUtils';

	/** 与协议文案中的客服电话保持一致 */
	const CONTACT_PHONE = '400-808-5180';

	export default {
		data() {
			return {
				contactPhone: CONTACT_PHONE,
				firmwareVersion: '—'
			};
		},
		onShow() {
			this.syncFirmwareVersionUi();
			uni.$on('pillow_firmware_version', this.onFirmwareVersionEvent);
		},
		onHide() {
			uni.$off('pillow_firmware_version', this.onFirmwareVersionEvent);
		},
		onUnload() {
			uni.$off('pillow_firmware_version', this.onFirmwareVersionEvent);
		},
		methods: {
			syncFirmwareVersionUi() {
				const cached = readFirmwareVersionCache();
				if (cached && cached.versionRaw !== undefined && cached.versionRaw !== null) {
					const next = formatFirmwareVersionFromRaw(cached.versionRaw);
					this.firmwareVersion = next || '—';
					return;
				}
				this.firmwareVersion = cached && cached.versionDisplay ? cached.versionDisplay : '—';
			},
			onFirmwareVersionEvent(payload) {
				if (payload && payload.versionRaw !== undefined && payload.versionRaw !== null) {
					const next = formatFirmwareVersionFromRaw(payload.versionRaw);
					this.firmwareVersion = next || '—';
					return;
				}
				if (payload && payload.versionDisplay) {
					this.firmwareVersion = payload.versionDisplay;
					return;
				}
				this.syncFirmwareVersionUi();
			},
			callPhone() {
				const num = CONTACT_PHONE.replace(/-/g, '');
				uni.makePhoneCall({
					phoneNumber: num,
					fail() {
						uni.setClipboardData({
							data: CONTACT_PHONE,
							success() {
								uni.showToast({ title: '已复制号码', icon: 'none' });
							}
						});
					}
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.about-page {
		min-height: 100vh;
		background-color: #e8eef2;
		box-sizing: border-box;
	}

	.about-body {
		padding: 32rpx 28rpx calc(48rpx + env(safe-area-inset-bottom));
	}

	.logo-wrap {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 48rpx 0 48rpx;
		overflow: visible;
	}

	.logo-box {
		width: 320rpx;
		max-width: 70%;
		/* 略高于常见竖版 logo 比例，保证中英文底行不被裁切 */
		height: 380rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logo {
		width: 100%;
		height: 100%;
		display: block;
	}

	.info-card {
		background-color: #fff;
		border-radius: 20rpx;
		border: 1rpx solid #e2e8f0;
		box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
		overflow: hidden;
	}

	.info-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 32rpx 28rpx;
		min-height: 96rpx;
		box-sizing: border-box;
	}

	.info-label {
		font-size: 30rpx;
		color: #64748b;
		flex-shrink: 0;
		width: 200rpx;
	}

	.info-value {
		flex: 1;
		text-align: right;
		font-size: 30rpx;
		color: #0f172a;
		font-weight: 500;
	}

	.info-value.link {
		color: #2563eb;
	}

	.info-arrow {
		margin-left: 12rpx;
		font-size: 32rpx;
		color: #94a3b8;
		flex-shrink: 0;
	}

	.info-divider {
		height: 1rpx;
		background: #e2e8f0;
		margin-left: 28rpx;
	}
</style>
