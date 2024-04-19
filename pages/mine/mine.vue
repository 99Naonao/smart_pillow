<template>
	<view class="container">
		<z-nav-bar :bgColor="bgColorList" backState=2000 home='false' bgColorAngle="90"></z-nav-bar>
		<view class="info">
			<view class="user_info">
				<view class="top_info">
					<view class="avatar_bg">
						<image v-if="hasLogin" class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'"
							@click="navTo('/pages/my/set/userInfo')"></image>
						<image v-else class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'"
							@click="clickWxLogin"></image>
					</view>
					<view class="usernameInfo">
						<view class="userNickNameInfo" v-if="nickNameInputFlag">
							<text class="username">{{ userInfo.nickName || '未知用户' }}</text>
							<image src="../../static/icon/edit.png"></image>
						</view>
						<view class="username" v-else>
							<input class="username" type="text" placeholder="请输入新的昵称" @blur="inputClose()"
								v-model="newNickName" />
						</view>
					</view>
				</view>
			</view>
			<view class="score_part">
				<view class="score_info">
					<view class="sub_score_info">
						<image class="icon" src="../../static/score/SY_13_IconJF.png"></image>
						<view>我的积分</view>
					</view>
					<view class="score_txt">{{score}}</view>
				</view>
				<view class="btn" @click="go2Use">去使用</view>
			</view>
			<view class="desc">
				<view class="title">积分说明</view>
				<view class="subtitle">如何活动</view>
				<view>眠加积分是眠加健康睡眠中心</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				bgColorList: [{
						color: "#5794d2",
						scale: "0%"
					},
					{
						color: "#607796",
						scale: "100%"
					}
				],
				title: 'Hello12123',
				hasLogin: false,
				nickNameInputFlag: false,
				score: 100,
				userInfo: {
					avatar: ''
				}
			}
		},
		onShow() {
			let curPages = getCurrentPages()[0]
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({
					selected: 3
				});
			}
		},
		methods: {
			go2Use() {
				uni.showToast({
					title: '暂未开放'
				})
			},
			clickWxLogin() {}
		}
	}
</script>

<style lang="scss">
	.container {
		// background-color: line-gradient(90deg, #5794d2, #607796);
		background: linear-gradient(90deg, rgb(87, 148, 210), rgb(96, 119, 150));

		.info {
			margin: 0 auto;
			background-color: white;
			border-top-left-radius: 30rpx;
			border-top-right-radius: 30rpx;
			margin-top: 200rpx;

			.user_info {
				position: relative;
				// overflow: hidden;
			}

			.top_info {
				top: -50rpx;
				margin: 0 auto;
				// left: 50%;
				// margin-left: 50%;
				text-align: center;
				position: relative;
			}

			.avatar_bg {
				width: 114upx;
				height: 114upx;
				border-radius: 100%;
				margin: 0 auto;
				border: 5px solid #fff;
				background-color: #FFF4EA;

				.avatar {
					flex-shrink: 0;
					width: 114upx;
					height: 114upx;
					transform: scale(0.9);
					border-radius: 100%;
					border: 4rpx solid #fff;
					background-color: #FFF4EA;
				}
			}

			.username {
				color: #32455B;
				font-size: 35rpx;
			}

			.score_part {
				width: 700rpx;
				height: 130rpx;
				border-radius: 20rpx;
				margin: 0 auto;
				display: flex;
				line-height: 130rpx;
				font-size: 38rpx;
				color: #5B7897;
				justify-content: center;
				align-items: center;
				box-shadow: 0px 0px 22px #BBB;

				.sub_score_info {
					display: flex;
					justify-content: center;
					align-items: center;
					padding: 10rpx;
				}

				.score_txt {
					flex: 1;
					text-align: center;
					line-height: 60rpx;
					border-radius: 10rpx;
					margin-left: 10rpx;
					margin-right: 10rpx;
					font-size: 36rpx;
					background-color: #dadada;
				}

				.icon {
					width: 54rpx;
					height: 49rpx;
					padding: 10rpx;
				}

				.score_info {
					flex: 1;
					display: flex;
					justify-content: space-around;
					align-items: center;
				}

				.btn {
					width: 202rpx;
					height: 68rpx;
					line-height: 68rpx;
					text-align: center;
					font-size: 36rpx;
					background-color: rgb(238, 126, 39);
					border-radius: 10rpx;
					color: white;
					margin-right: 20rpx;
				}
			}

			.desc {
				font-size: 32rpx;
				color: #5B7897;
				line-height: 40rpx;
				padding-left: 66rpx;
				padding-right: 66rpx;
				padding-top: 60rpx;

				.subtitle {
					padding-top: 20rpx;
					padding-bottom: 20rpx;
				}

				.title {
					font-size: 40rpx;
					padding-top: 20rpx;
					padding-bottom: 20rpx;
				}
			}
		}
	}
</style>