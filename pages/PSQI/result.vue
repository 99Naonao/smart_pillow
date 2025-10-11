<template>
	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='匹兹堡睡眠质量得分'></z-nav-bar>
	<view class="result-container">
		<view class="all-results-container">
			<!-- <text class="result-title">质量结果</text> -->
			<view class="result-grid">
				<view v-for="(item, key) in results.scores" :key="key" class="result-item">
					<text class="result-label">{{ item.label }}</text>
					<text class="result-value">{{ item.value }}</text>
				</view>
			</view>
			<view class="final-result">
				PSQI 总分: {{ results.total }} ({{ results.level }})
			</view>
			<!-- 直接式表达 -->
			<view class="product-recommendation direct" v-if="showDirectRecommendation">
				<view v-if="results.total <= 5">
					<text>恭喜您！您的睡眠质量为1度，就像小天使一样完美，请继续保持！可以使用我们眠加AI活力健康检测，对身心健康进行更全面的检测哦！</text>
					<!--              <navigator :url="productLinks.mianjiaAI" class="product-link">
<image :src="productImages.mianjiaAI" mode="aspectFit" class="product-image"></image>
</navigator> -->
				</view>
				<view v-else-if="results.total <= 10">
					<text>还不错！您的睡眠质量为2度，但可以更甜哦～建议使用我们的翼合枕和蚕丝被，帮你提升睡眠舒适度哦！</text>
					<!--              <navigator :url="productLinks.yihePillow" class="product-link">
<image :src="productImages.yihePillow" mode="aspectFit" class="product-image"></image>
</navigator>
<navigator :url="productLinks.silkQuilt" class="product-link">
<image :src="productImages.silkQuilt" mode="aspectFit" class="product-image"></image>
</navigator> -->
				</view>
				<view v-else-if="results.total <= 15">
					<text>很一般，您的睡眠质量为3度，需要一点点关爱啦！建议使用我们的甜睡保健贴和天然助眠精油，帮您睡得更甜哦！</text>
					<!--              <navigator :url="productLinks.sleepPatch" class="product-link">
<image :src="productImages.sleepPatch" mode="aspectFit" class="product-image"></image>
</navigator>
<navigator :url="productLinks.sleepEssentialOil" class="product-link">
<image :src="productImages.sleepEssentialOil" mode="aspectFit" class="product-image"></image>
</navigator> -->
				</view>
				<view v-else>
					<text>有点糟糕，您的睡眠质量为4度，快给睡眠充充电吧！建议使用我们的古法舒睡仪，来专业改善睡眠质量。如果您有想咨询专业医师的需要，可以添加下方的专属睡眠管家，我们可以免费帮您精准找到适合您睡眠状况的医疗资源哦！</text>
					<!--            <navigator :url="productLinks.ancientSleepDevice" class="product-link">
<image :src="productImages.ancientSleepDevice" mode="aspectFit" class="product-image"></image>
</navigator> -->
				</view>
			</view>
			<!-- 感性表达 -->
			<view class="product-recommendation emotional" v-if="showEmotionalRecommendation">
				<view v-if="results.total <= 5">
					<text>哇，您的睡眠就像夜空中最璀璨的星星一样闪耀！简直是睡眠小达人呢！不妨试试我们的眠加AI活力健康检测，让它为您的健康保驾护航，探索更多的健康奥秘哟！</text>
					<navigator :url="productLinks.mianjiaAI" class="product-link">
						<image :src="productImages.mianjiaAI" mode="aspectFit" class="product-image"></image>
					</navigator>
				</view>
				<view v-else-if="results.total <= 10">
					<text>亲爱的，您的睡眠已经很棒啦，但还可以更上一层楼哦！就像给甜蜜的梦境再添上一层柔软的云朵。试试我们的翼合枕和蚕丝被，它们会像温柔的双手，轻轻托着您进入更深更甜的梦乡～</text>
					<!--              <navigator :url="productLinks.yihePillow" class="product-link">
<image :src="productImages.yihePillow" mode="aspectFit" class="product-image"></image>
</navigator>
<navigator :url="productLinks.silkQuilt" class="product-link">
<image :src="productImages.silkQuilt" mode="aspectFit" class="product-image"></image>
</navigator> -->
				</view>
				<view v-else-if="results.total <= 15">
					<text>亲爱的，最近是不是没休息好呀？看到您的睡眠评分暂时只有3分，真的有些心疼呢~别担心，让我为您点亮「眠加小法宝」吧！</text>
					<view>
						<text>A、睡前贴一片我们的【甜睡保健贴】，就像给助眠穴位上盖上月光毯；再滴两滴【天然助眠精油】，让花草香的晚风轻轻托起你的梦境~</text>
						<!--                <navigator :url="productLinks.sleepPatch" class="product-link">
<image :src="productImages.sleepPatch" mode="aspectFit" class="product-image"></image>
</navigator>
<navigator :url="productLinks.sleepEssentialOil" class="product-link">
<image :src="productImages.sleepEssentialOil" mode="aspectFit" class="product-image"></image>
</navigator> -->
					</view>
					<view>
						<text>B、让【翼合枕】像小云朵般托住您的脖颈，每一个弧度都悄悄吻合肩颈曲线，翻身时仿佛被月光轻轻拢住；再点上三滴【助眠精油】，让薰衣草的星光和雪松木的呼吸，在枕边织出一张暖融融的网，把烦心事儿都滤成细碎的星尘。</text>
						<!--                <navigator :url="productLinks.yihePillow" class="product-link">
<image :src="productImages.yihePillow" mode="aspectFit" class="product-image"></image>
</navigator> -->
						<!--                <navigator :url="productLinks.sleepEssentialOil" class="product-link">
<image :src="productImages.sleepEssentialOil" mode="aspectFit" class="product-image"></image>
</navigator> -->
					</view>
				</view>
				<view v-else>
					<text>心疼您呀，最近的睡眠好像被乌云遮住了光芒。不过别着急，我们的古法舒睡仪就像一道温暖的阳光，能帮您驱散睡眠的阴霾，重新找回甜美的梦乡。如果您还有更多的疑问，我们的专属睡眠管家会像贴心的小天使一样，为您提供专业的帮助哦！</text>
					<!--              <navigator :url="productLinks.ancientSleepDevice" class="product-link">
<image :src="productImages.ancientSleepDevice" mode="aspectFit" class="product-image"></image>
</navigator> -->
				</view>
			</view>
			<view class="button-container">
				<button @click="handleRestart" class="restart-button">重新测试</button>
				<button @click="backToHome" class="restart-button">回到主页</button>
			</view>
		</view>


	</view>
</template>

<script>
	export default {
		data() {
			return {
				results: {
					scores: [],
					total: 0,
					level: ''
				},
				// productImages: {
				//   mianjiaAI: 'https://picsum.photos/200/200?random=1',
				//   yihePillow: 'https://picsum.photos/200/200?random=2',
				//   silkQuilt: 'https://picsum.photos/200/200?random=3',
				//   sleepPatch: 'https://picsum.photos/200/200?random=4',
				//   sleepEssentialOil: 'https://picsum.photos/200/200?random=5',
				//   ancientSleepDevice: 'https://picsum.photos/200/200?random=6'
				// },
				// productLinks: {
				//   mianjiaAI: 'pages/product/mianjiaAI',
				//   yihePillow: 'pages/product/yihePillow',
				//   silkQuilt: 'pages/product/silkQuilt',
				//   sleepPatch: 'pages/product/sleepPatch',
				//   sleepEssentialOil: 'pages/product/sleepEssentialOil',
				//   ancientSleepDevice: 'pages/product/ancientSleepDevice'
				// },
				showDirectRecommendation: true,
				showEmotionalRecommendation: false
			}
		},
		onLoad(options) {
			this.results = JSON.parse(options.results)
		},
		methods: {
			handleRestart() {
				this.$emit('restart')
				uni.redirectTo({
					url:'/pages/PSQI/NewPSQI'
				})
			},
			backToHome() {
				uni.switchTab({
					url: "/pages/status/status"
				})
			},
			toggleRecommendationMode() {
				this.showDirectRecommendation = !this.showDirectRecommendation
				this.showEmotionalRecommendation = !this.showEmotionalRecommendation
			}
		}
	}
</script>

<style lang="scss" scoped>
	.result-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		vertical-align: middle;
		justify-content: center;
		text-align: center;
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 40rpx;
	}

	.all-results-container {
		background-color: #fff;
		border-radius: 10rpx;
		box-shadow: 0 5rpx 10rpx rgba(0, 0, 0, 0.1);
		padding: 40rpx;
		width: 80%;
		max-width: 800px;
	}

	.result-title {
		font-size: 48rpx;
		font-weight: bold;

		color: #333;
		text-align: center;
	}

	.result-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 30rpx;
		width: 100%;
		margin-top: 40rpx;
		margin-bottom: 40rpx;
	}

	.result-item {
		background-color: #f8f9fa;
		padding: 20rpx;
		border-radius: 10rpx;
		box-shadow: 0 5rpx 10rpx rgba(0, 0, 0, 0.05);
		transition: transform 0.2s ease-in-out;

		&:hover {
			transform: scale(1.05);
		}
	}

	.result-label {
		font-weight: bold;
		color: #555;
	}

	.result-value {
		color: #333;
	}

	.final-result {
		font-size: 25rpx;
		font-weight: bold;
		margin-bottom: 40rpx;
		color: #333;
		text-align: center;
	}

	.product-recommendation {
		text-align: center;
		margin-bottom: 40rpx;

		.product-link {
			display: inline-block;
			margin: 20rpx;
		}

		.product-image {
			width: 400rpx;
			height: 400rpx;
			border-radius: 10rpx;
			box-shadow: 0 5rpx 10rpx rgba(0, 0, 0, 0.1);
			transition: transform 0.2s ease-in-out;

			&:hover {
				transform: scale(1.05);
			}
		}
	}


	.button-container {
		display: flex;
		/* 使用弹性布局 */
		justify-content: space-between;
		/* 按钮间隔均匀分布 */
		width: 100%;
		/* 占满父容器宽度 */
		margin-top: 40rpx;
		/* 顶部间距 */
	}

	.restart-button {
		/* 原有样式基础上新增以下属性 */
		flex: 1;
		/* 弹性项等比例缩放 */
		margin: 0 20rpx;
		/* 左右间距 */
		width: auto;
		/* 重置固定宽度，适应内容 */
		background-color: #007aff;
		color: #fff;
	}

	//  .restart-button {
	//    background-color: #007aff;
	//    color: #fff;
	//    border: none;
	// display: flex;
	//    border-radius: 10rpx;
	//    cursor: pointer;
	//    transition: background-color 0.2s ease-in-out;
	// height: 80rpx;
	//    width: 80%;
	//    text-align: center;
	//  }

	.restart-button:hover {
		background-color: #0056b3;
	}
</style>