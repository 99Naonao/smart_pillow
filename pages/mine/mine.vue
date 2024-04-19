<template>
	<view>min123e</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello12123'
			}
		},
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 3
				});
			}
		}
	}
</script>

<style>
</style>