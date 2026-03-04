<template>
	<view> <web-view :src="url"></web-view></view>
</template>

<script>
	export default {
		data() {
			return {
				url: ''
			}
		},
		onLoad: function(options) {
			this.url = options.url;
			wx.setNavigationBarTitle({
				title: options.nav
			})
		}
	}
</script>

<style>
</style>