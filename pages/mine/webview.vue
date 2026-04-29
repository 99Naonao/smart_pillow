<template>
	<view class="webview-wrap">
		<web-view v-if="url" :src="url" />
		<view v-else class="webview-placeholder">页面加载中…</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				url: ''
			};
		},
		onLoad(options) {
			let u = options.url || '';
			if (u) {
				try {
					u = decodeURIComponent(u);
				} catch (e) {
					// 未编码的旧链接仍可用
				}
			}
			this.url = u;
			const nav = options.nav || '';
			let title = nav;
			if (nav) {
				try {
					title = decodeURIComponent(nav);
				} catch (e) {}
			}
			if (title) {
				uni.setNavigationBarTitle({ title });
			}
			if (!this.url) {
				uni.showToast({ title: '链接无效', icon: 'none' });
			}
		}
	};
</script>

<style scoped>
	.webview-wrap {
		width: 100%;
		height: 100vh;
	}
	.webview-placeholder {
		padding: 40rpx;
		text-align: center;
		color: #64748b;
		font-size: 28rpx;
	}
</style>