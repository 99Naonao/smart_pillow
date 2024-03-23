<script>
	export default {
		data() {
			return {
				globalData: {
					tabIndex: 0
				},
			}
		},
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	@import './common/uni.css';


	/*每个页面公共css */
	.uni-tabbar .uni-tabbar__icon {
		width: 40px !important;
		height: 40px !important;
	}
</style>