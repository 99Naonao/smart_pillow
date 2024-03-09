<template>
	<view>product</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello123'
			}
		},
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 2
				});
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style>
</style>