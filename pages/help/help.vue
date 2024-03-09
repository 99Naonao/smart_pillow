<template>
	<view>help</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello123'
			}
		},
		onShow() {
			console.log('123')
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 1
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