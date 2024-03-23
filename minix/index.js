export function setTabBarIndex(that, index) {
	console.log(that, that.$mp.page)
	if (typeof that.$mp.page.getTabBar === 'function' &&
		that.$mp.page.getTabBar()) {
		that.$mp.page.getTabBar().setData({
			selected: index
		})
	}
}