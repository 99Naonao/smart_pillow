const app = getApp()
Component({
	lifetimes: {
		attached() {
			this.setData({
				selected: app.globalData.tabIndex
			})
		}
	},
	data: {
		selected: 0,
		color: "#7A7E83",
		selectedColor: "#3cc51f",
		list: [{
				"pagePath": "/pages/login/login",
				"iconPath": "/static/index/SY_00_buttonSYa.png",
				"selectedIconPath": "/static/index/SY_00_buttonSYb.png",
				"text": ""
			},
			{
				"pagePath": "/pages/help/help",
				"iconPath": "/static/index/SY_00_buttonBZa.png",
				"selectedIconPath": "/static/index/SY_00_buttonBZb.png",
				"text": ""
			},
			{
				"pagePath": "/pages/product/product",
				"iconPath": "/static/index/SY_00_buttonCPa.png",
				"selectedIconPath": "/static/index/SY_00_buttonCPb.png",
				"text": ""
			},
			{
				"pagePath": "/pages/mine/mine",
				"iconPath": "/static/index/SY_00_buttonWDa.png",
				"selectedIconPath": "/static/index/SY_00_buttonWDb.png",
				"text": ""
			}
		]
	},
	attached() {},
	methods: {
		switchTab(e) {
			const data = e.currentTarget.dataset
			const url = data.path
			// this.setData({
			// 	selected: data.index
			// })
			app.globalData.tabIndex = data.index
			wx.switchTab({
				url
			})
		}
	}
})