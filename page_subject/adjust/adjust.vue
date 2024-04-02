<template>
	<Nav :wrap-style="navWrapStyle" :propPillowName="'23232332'"></Nav>
	<view class="main">
		<view class="select-part">
			<view class="select-btn">
				<image mode="widthFix" class="icon1" :src="'../static/adjust/SY_11_IconYWb.png'"></image>
				<label>仰卧调节</label>
			</view>
			<view class="select-btn">
				<image mode="widthFix" class="icon2" :src="'../static/adjust/SY_11_IconCWb.png'"></image>
				<label>侧卧调节</label>
			</view>
		</view>
		<view class="info-part">
			<view class="info-second-part">
				<label class='desc1'>脖颈部</label>
				<label class='desc1size'>12cm</label>
				<label class='desc2'>头枕部</label>
				<label class='desc2size'>12cm</label>
				<image class="main-icon" :src="'../static/adjust/SY_11_DITU.png'"></image>
				<image class="down-icon" :src="'../static/adjust/SY_11_DOW.png'"></image>
				<image class="up-icon" :src="'../static/adjust/SY_11_UP.png'"></image>
				<image class="bzb-icon" :src="'../static/adjust/SY_11_buttonBZb.png'"></image>
				<image class="tzb-icon" :src="'../static/adjust/SY_11_buttonTZb.png'"></image>
				<view class="bo bo-left">
					脖枕
				</view>
				<view class="bo bo-right select">
					头枕
				</view>
			</view>
			<view class="opt-part">
				<view class="opt-btn">
					<image mode="widthFix" class="icon" :src="'../static/adjust/SY_11_butUP.png'"></image>
					<label>升高</label>
				</view>
				<view class="opt-btn">
					<image mode="widthFix" class="icon" style="transform: rotate(-180deg);"
						:src="'../static/adjust/SY_11_butUP.png'">
					</image>
					<label>降低</label>
				</view>
			</view>
			<view class="bottom-part">
				<view class="save">保存</view>
			</view>
		</view>
	</view>
</template>

<script>
	import Nav from '@/comp/Nav';
	export default {
		components: {
			Nav
		},
		onLoad() {

		}
	}
</script>

<style lang="scss">
	.select-btn {
		background-color: rgb(238, 126, 39);
		width: 284rpx;
		height: 90rpx;
		border-radius: 20rpx;
		color: white;
		display: flex;
		justify-content: space-around;
		align-items: center;

		.icon1 {
			width: 61rpx;
			height: 36rpx;
		}

		.icon2 {
			width: 61rpx;
			height: 41rpx;
		}
	}

	.normal-btn {
		background-color: rgb(255, 255, 255);
		width: 284rpx;
		height: 90rpx;
		border-radius: 20rpx;
		display: flex;
		justify-content: space-around;
		align-items: center;

		.icon1 {
			width: 61rpx;
			height: 36rpx;
		}

		.icon2 {
			width: 61rpx;
			height: 41rpx;
		}

	}

	.main {
		background-color: rgb(216, 226, 246);
		width: 100%;
		height: 100%;
		padding-top: 120rpx;

		.select-part {
			display: flex;
			justify-content: space-around;
		}


		.info-second-part {
			position: relative;
			margin: 0 auto;
			width: 634rpx;
			height: 197rpx;
			margin-top: 100rpx;
			color: #5B7897;

			.bo {
				width: 128rpx;
				height: 76rpx;
				background-color: #5B7897;
				color: white;
				text-align: center;
				line-height: 76rpx;
				border-radius: 30rpx 30rpx;
			}

			.bo-left {
				position: absolute;
				left: 115rpx;
				top: 108rpx;
			}

			.bo-right {
				position: absolute;
				right: 100rpx;
				top: 108rpx;
			}

			.select {
				background-color: white;
				color: #5B7897;
			}

			.bzb-icon {
				position: absolute;
				left: 66rpx;
				top: 60rpx;
				width: 358rpx;
				height: 139rpx;
			}

			.tzb-icon {
				position: absolute;
				right: 66rpx;
				top: 60rpx;
				width: 327rpx;
				height: 125rpx;
			}

			.desc1 {
				font-size: 30rpx;
				left: 22rpx;
				top: -35rpx;
				position: absolute;
			}

			.desc1size {
				font-size: 30rpx;
				position: absolute;
				right: 388rpx;
				top: -35rpx;
			}

			.desc2 {
				position: absolute;
				color: #5B7897;
				left: 375rpx;
				top: -35rpx;
				font-size: 30rpx;
			}

			.desc2size {
				font-size: 30rpx;
				position: absolute;
				right: 43rpx;
				top: -35rpx;
			}

			.main-icon {
				width: 634rpx;
				height: 197rpx;
			}

			.up-icon {
				width: 24rpx;
				height: 76rpx;
				position: absolute;
				left: 30rpx;
				top: 100rpx;
			}

			.down-icon {
				width: 24rpx;
				height: 77rpx;
				position: absolute;
				right: 27rpx;
				top: 100rpx;
			}
		}

		.opt-part {
			display: flex;
			justify-content: space-around;
			margin-top: 100rpx;

			.opt-btn {
				width: 284rpx;
				height: 90rpx;
				display: flex;
				justify-content: space-around;
				align-items: center;
				background-color: #5B7897;
				border-radius: 30rpx;
				line-height: 56rpx;
				color: white;

				label {
					margin-left: -55rpx;
				}
			}

			.icon {
				width: 56rpx;
				height: 56rpx;
			}
		}
	}


	.bottom-part {
		background-color: white;
		height: 300rpx;
		width: 100%;
		position: fixed;
		bottom: 0rpx;
		border-radius: 50rpx 50rpx 0rpx 0rpx;

		.save {
			width: 670rpx;
			height: 102rpx;
			background-color: #5B7897;
			margin: 0 auto;
			line-height: 102rpx;
			text-align: center;
			color: white;
			margin-top: 80rpx;
			border-radius: 50rpx;

		}
	}
</style>