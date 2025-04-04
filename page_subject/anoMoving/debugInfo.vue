<template>
	<div class="input-part">
		<div class="info">
			<div class="flex align-center">
				<div class="label">头枕高度(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="headHeight" placeholder="输入正卧头部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">颈部起始高度(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="headUpHeight" placeholder="输入正卧头部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">颈部下调高度(mm):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="headDownHeight" placeholder="输入正卧颈部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">起始高度保持时间(秒):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="Time1" placeholder="输入正卧肩宽值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">下调高度保持时间(秒):</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="Time2" placeholder="输入侧卧头部高度值" />
				</div>
			</div>
			<div class="flex align-center">
				<div class="label">调整圈数:</div>
				<div class="flex1">
					<input class="input-item" type="number" v-model="round" placeholder="输入侧卧颈部高度值" />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: "debugInfo",
		data() {
			// 参数3--颈部起始高度（U8）,参数4--颈部下调高度（U8），
			// 参数5高度1保持时间秒(U16)，参数6高度2保持时间秒（U16），参数7调整圈数（U8）
			return {
				headHeight: "60",
				headUpHeight: '60',
				headDownHeight: '200',
				Time1: '200',
				Time2: '200',
				round: '3',
			}
		},
		mounted() {
			// 因为是组件所以要走这里
			// let params = uni.getStorageSync('hparams')
			// params = params ? params : {}
			// this.headHeight = params.headHeight ? params.headHeight : '60'
			// this.shoulderHeight = params.shoulderHeight ? params.shoulderHeight : '200'
			// this.neckHeight = params.neckHeight ? params.neckHeight : '60'
			// this.sideHeadHeight = params.sideHeadHeight ? params.sideHeadHeight : '60'
			// this.sideShoulderHeight = params.sideShoulderHeight ? params.sideShoulderHeight : '200'
			// this.sideNeckHeight = params.sideNeckHeight ? params.sideNeckHeight : '60'
		},
		methods: {
			getParams() {
				let params = {
					headHeight: this.headHeight,
					headUpHeight: this.headUpHeight,
					headDownHeight: this.headDownHeight,
					Time1: this.Time1,
					Time2: this.Time2,
					round: this.round,
				}
				return params
			},
			showParams(params) {
				// this.headHeight = params.headHeight;
				// this.shoulderHeight = params.shoulderHeight;
				// this.neckHeight = params.neckHeight;
				// this.sideHeadHeight = params.sideHeadHeight;
				// this.sideShoulderHeight = params.sideShoulderHeight;
				// this.sideNeckHeight = params.sideNeckHeight;
			}
		}
	}
</script>


<style scoped>
	.input-part {
		position: absolute;
		top: 188rpx;
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