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
		color: "#F0F6F7",
		selectedColor: "#FFFFFF",
		list: [{
				"pagePath": "/pages/status/status",
				"iconPath": "/static/icon/home.png",
				"selectedIconPath": "/static/icon/home_selected.png",
				"text": "首页"
			},
			{
				"pagePath": "/pages/report/report",
				"iconPath": "/static/icon/report.png",
				"selectedIconPath": "/static/icon/report_selected.png",
				"text": "报告"
			},
			{
				"pagePath": "/pages/newMine/newMine",
				"iconPath": "/static/icon/mine.png",
				"selectedIconPath": "/static/icon/mine_selected.png",
				"text": "个人中心"
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