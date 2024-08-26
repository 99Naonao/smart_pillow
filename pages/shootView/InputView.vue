<template>
	<div class="input-part">
		<div class="info">
			<div class="flex align-center">
				<div class="label">正卧头部高度值(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="headHeight" placeholder="输入正卧头部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">正卧颈部高度值(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="neckHeight" placeholder="输入正卧颈部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">正卧肩宽值(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="shoulderHeight" placeholder="输入正卧肩宽值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">侧卧头部高度值(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="sideHeadHeight" placeholder="输入侧卧头部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">侧卧颈部高度值(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="sideNeckHeight" placeholder="输入侧卧颈部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">侧卧肩宽值(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="sideShoulderHeight" placeholder="输入侧卧肩宽值" />
				</div>
			</div>
		</div>
	</div>
</template>
<!-- 数据1－正卧头部气囊高度值（U8），数据2－正卧颈部气囊高度值（U8），数据3－正卧肩宽值（U16）数据4－侧卧头部气囊高度值（U8），数据5－侧卧颈部气囊高度值（U8），数据6－侧卧肩宽值（U16） -->
<script>
	export default {
		components: {

		},
		onLoad(options) {


		},
		onShow() {

		},
		onShareAppMessage() {


		},
		data() {
			return {
				headHeight: '80',
				shoulderHeight: '200',
				neckHeight: '80',
				sideHeadHeight: '80',
				sideShoulderHeight: '200',
				sideNeckHeight: '80',
			}
		},
		methods: {
			getParams() {
				return {
					headHeight: this.headHeight,
					shoulderHeight: this.shoulderHeight,
					neckHeight: this.neckHeight,
					sideHeadHeight: this.sideHeadHeight,
					sideShoulderHeight: this.sideShoulderHeight,
					sideNeckHeight: this.sideNeckHeight,
				}
			},
			showParams(params) {
				this.headHeight = params.headHeight;
				this.shoulderHeight = params.shoulderHeight;
				this.neckHeight = params.neckHeight;
				this.sideHeadHeight = params.sideHeadHeight;
				this.sideShoulderHeight = params.sideShoulderHeight;
				this.sideNeckHeight = params.sideNeckHeight;
			}
		}
	}
</script>

<style scoped>
	.input-part {
		position: absolute;
		bottom: 158rpx;
		left: 10rpx;
		right: 0rpx;
		height: fit-content;
		background-color: aliceblue;
	}

	.label {
		font-size: 24rpx;
		width: 40%;
		overflow: hidden;
		white-space: nowrap;
	}

	.info {
		line-height: 60rpx;
		padding: 20rpx;
		padding-bottom: 40px;
	}

	.input-item {
		padding-left: 20rpx;
		border: 1px solid #999;
		line-height: 60rpx;
	}
</style>