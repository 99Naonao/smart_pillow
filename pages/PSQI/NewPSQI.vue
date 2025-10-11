<template>
	<z-nav-bar backState="1000" type='transparentFixed' fontColor='#000' transparentFixedFontColor='#000'
		title='匹兹堡睡眠质量问卷调查'></z-nav-bar>
	<view class="content">
		<view class="text-area">
<!-- 			标题仅在第一页显示，且居中
			<text v-if="currentPage === 0" class="title">
				匹兹堡睡眠质量问卷调查
			</text> -->

			<template v-for="(question, index) in displayedQuestions" :key="question.label">
				<view class="question">
					<view class="question-header">
						<text class="question-label">
							{{ question.label }}
							<text v-if="isRequired(question)" class="required-mark">*</text>
						</text>
					</view>

					<!-- 输入型问题 -->
					<input v-if="question.type === 'input'" v-model="formData[question.model]"
						:placeholder="question.placeholder" class="input-field" type="number"
						@input="validateInput(question, $event)" :data-testid="question.model" />

					<!-- 选择型问题 -->
					<picker v-else-if="question.type === 'picker'" :range="questionOptions[question.rangeKey]"
						@change="handlePickerChange(question, $event)"
						:value="formData[question.model][question.optionIndex]" class="custom-picker">
						<view class="picker-field">
							{{ selectedValueDisplay(question) || '请选择' }}
						</view>
					</picker>
				</view>
			</template>

			<!-- 操作按钮组 -->
			<view class="button-group">
				<button v-if="showPrevious" @click="prevPage" class="nav-button">
					上一页
				</button>
				<button @click="handleNext" class="nav-button primary">
					{{ isLastPage ? '提交问卷' : '下一页' }}
				</button>
			</view>

			<!-- 分页指示器移到按钮下方，且居中 -->
			<view class="pagination" v-if="!showResults">
				第 {{ currentPage + 1 }} 页 / 共 {{ totalPages }} 页
			</view>

			<!-- 结果展示 -->
			<result-panel v-if="showResults" :results="results" @restart="handleRestart" />
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentPage: 0,
				itemsPerPage: 5,
				showResults: false,
				formData: {
					bedTime: null,
					fallAsleepTime: null,
					wakeUpTime: null,
					sleepDuration: null,
					sleepTroubles: new Array(9).fill(null),
					singleSelect: new Array(4).fill(0),
					otherTroubles: ''
				},
				questionOptions: {
					trouble: ['完全没遇到', '一周不到1次', '1~2次/周', '每周3次以上'],
					quality: ['超棒！', '还不错', '有点糟', '非常差'],
					medication: ['完全不需要', '一周不到1次', '1~2次/周', '每周3次以上'],
					daytime: ['活力满满！', '偶尔打哈欠', '有时困困的', '经常眼皮打架'],
					energy: ['完全没有！', '偶尔偷懒', '有时力不从心', '经常累成汪']
				},
				questions: [{
						type: 'input',
						label: '最近一个月里，你晚上通常几点钻进被窝准备睡觉呢？',
						model: 'bedTime',
						placeholder: '请输入时间（24小时制，如23）',
						validation: {
							min: 0,
							max: 23
						},
						required: true
					},
					{
						type: 'input',
						label: '躺下后，你大概需要多少分钟才能进入梦乡呀？',
						model: 'fallAsleepTime',
						placeholder: '请输入分钟数',
						validation: {
							min: 0,
							max: 720
						},
						required: true
					},
					{
						type: 'input',
						label: '你一般几点起床呀？',
						model: 'wakeUpTime',
						placeholder: '请输入时间（24小时制，如7）',
						validation: {
							min: 0,
							max: 23
						},
						required: true
					},
					{
						type: 'input',
						label: '最近一个月，你每天实际睡着的时间大概有多久呢？',
						model: 'sleepDuration',
						placeholder: '请输入小时数',
						validation: {
							min: 0,
							max: 24
						},
						required: true
					},
					{
						type: 'picker',
						label: '有没有遇到以下睡眠烦恼呢？翻来覆去睡不着（超过30分钟）',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 0,
						required: true
					},
					{
						type: 'picker',
						label: '半夜突然醒来或醒得太早',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 1,
						required: true
					},
					{
						type: 'picker',
						label: '半夜想去卫生间',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 2,
						required: true
					},
					{
						type: 'picker',
						label: '呼吸不顺畅',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 3,
						required: true
					},
					{
						type: 'picker',
						label: '咳嗽或打呼噜声太大',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 4,
						required: true
					},
					{
						type: 'picker',
						label: '被窝里冷飕飕',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 5,
						required: true
					},
					{
						type: 'picker',
						label: '被窝里热乎乎',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 6,
						required: true
					},
					{
						type: 'picker',
						label: '做可怕的梦',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 7,
						required: true
					},
					{
						type: 'picker',
						label: '身体不舒服影响睡眠',
						rangeKey: 'trouble',
						model: 'sleepTroubles',
						optionIndex: 8,
						required: true
					},
					{
						type: 'input',
						label: '其他小状况（如果有，请写下哦）',
						model: 'otherTroubles',
						placeholder: ''
					},
					{
						type: 'picker',
						label: '总体来说，最近一个月的睡眠质量你打几分？',
						rangeKey: 'quality',
						model: 'singleSelect',
						optionIndex: 0,
						required: true
					},
					{
						type: 'picker',
						label: '最近一个月，你有借助药物助眠吗？',
						rangeKey: 'medication',
						model: 'singleSelect',
						optionIndex: 1,
						required: true
					},
					{
						type: 'picker',
						label: '最近白天会经常犯困吗？',
						rangeKey: 'daytime',
						model: 'singleSelect',
						optionIndex: 2,
						required: true
					},
					{
						type: 'picker',
						label: '最近做事时，会不会觉得精力不足？',
						rangeKey: 'energy',
						model: 'singleSelect',
						optionIndex: 3,
						required: true
					}
				],
				results: {
					scores: [],
					total: 0,
					level: ''
				},
				records: []
			}
		},

		computed: {
			totalPages() {
				return Math.ceil(this.questions.length / this.itemsPerPage)
			},
			isLastPage() {
				return this.currentPage === this.totalPages - 1
			},
			showPrevious() {
				return this.currentPage > 0
			},
			displayedQuestions() {
				const start = this.currentPage * this.itemsPerPage
				return this.questions.slice(start, start + this.itemsPerPage)
			}
		},

		mounted() {
			this.loadRecords()
		},

		methods: {
			// 处理分页导航
			handleNext() {
				if (this.validateCurrentPage()) {
					if (this.isLastPage) {
						this.submitForm()
					} else {
						this.currentPage++
						uni.pageScrollTo({
							scrollTop: 0,
							duration: 300
						})
					}
				}
			},

			// 数据验证
			validateCurrentPage() {
				return this.displayedQuestions.every(q => {
					const value = this.formData[q.model]
					if (q.required && (value === null || value === undefined)) {
						uni.showToast({
							title: `请填写${q.label}`,
							icon: 'none'
						})
						return false
					}
					if (q.validation) {
						if (typeof value === 'number' && (value < q.validation.min || value > q.validation.max)) {
							uni.showToast({
								title: `请输入${q.validation.min}-${q.validation.max}之间的数值`,
								icon: 'none'
							})
							return false
						}
					}
					return true
				})
			},

			// 时间计算优化
			calculateTimeDuration(start, end) {
				const startTime = parseInt(start) || 0
				let endTime = parseInt(end) || 0
				if (endTime < startTime) endTime += 24
				return endTime - startTime
			},

			// 得分计算模块化
			calculateScores() {
				const {
					bedTime,
					fallAsleepTime,
					wakeUpTime,
					sleepDuration,
					sleepTroubles,
					singleSelect
				} = this.formData
				const sleepQuality = this.calculateSleepQuality(singleSelect[0])
				const fallAsleep = this.calculateFallAsleep(fallAsleepTime, sleepTroubles[0])
				const sleepDurationScore = this.calculateSleepDuration(sleepDuration)
				const sleepEfficiency = this.calculateSleepEfficiency(bedTime, wakeUpTime, sleepDuration)
				const sleepTroublesScore = this.calculateSleepTroubles(sleepTroubles)
				const medication = this.calculateMedication(singleSelect[1])
				const daytimeFunction = this.calculateDaytimeFunction(singleSelect[2], singleSelect[3])

				return {
					sleepQuality,
					fallAsleep,
					sleepDuration: sleepDurationScore,
					sleepEfficiency,
					sleepTroubles: sleepTroublesScore,
					medication,
					daytimeFunction
				}
			},

			// 具体的得分计算方法
			calculateSleepQuality(value) {
				return value
			},

			calculateFallAsleep(fallAsleepTime, troubleA) {
				let fallAsleepTimeScore = fallAsleepTime <= 15 ? 0 : fallAsleepTime <= 30 ? 1 : fallAsleepTime <= 60 ? 2 :
					3
				let troubleAScore = troubleA === 0 ? 0 : troubleA === 1 ? 1 : troubleA === 2 ? 2 : 3
				let fallAsleepTotal = fallAsleepTimeScore + troubleAScore
				return fallAsleepTotal === 0 ? 0 : fallAsleepTotal <= 2 ? 1 : fallAsleepTotal <= 4 ? 2 : 3
			},

			calculateSleepDuration(sleepDuration) {
				return sleepDuration > 7 ? 0 : sleepDuration >= 6 ? 1 : sleepDuration >= 5 ? 2 : 3
			},

			calculateSleepEfficiency(bedTime, wakeUpTime, sleepDuration) {
				let bedTimeHours = this.calculateTimeDuration(bedTime, wakeUpTime)
				let sleepEfficiency = (sleepDuration / bedTimeHours) * 100
				return sleepEfficiency > 85 ? 0 : sleepEfficiency >= 75 ? 1 : sleepEfficiency >= 65 ? 2 : 3
			},

			calculateSleepTroubles(sleepTroubles) {
				let sleepTroublesTotal = 0
				for (let i = 0; i < sleepTroubles.length; i++) {
					sleepTroublesTotal += sleepTroubles[i] === 0 ? 0 : sleepTroubles[i] === 1 ? 1 : sleepTroubles[i] ===
						2 ? 2 : 3
				}
				return sleepTroublesTotal === 0 ? 0 : sleepTroublesTotal <= 9 ? 1 : sleepTroublesTotal <= 18 ? 2 : 3
			},

			calculateMedication(value) {
				return value
			},

			calculateDaytimeFunction(daytimeSleepiness, lackOfEnergy) {
				let daytimeSleepinessScore = daytimeSleepiness === 0 ? 0 : daytimeSleepiness === 1 ? 1 :
					daytimeSleepiness === 2 ? 2 : 3
				let lackOfEnergyScore = lackOfEnergy === 0 ? 0 : lackOfEnergy === 1 ? 1 : lackOfEnergy === 2 ? 2 : 3
				let daytimeFunctionTotal = daytimeSleepinessScore + lackOfEnergyScore
				return daytimeFunctionTotal === 0 ? 0 : daytimeFunctionTotal <= 2 ? 1 : daytimeFunctionTotal <= 4 ? 2 : 3
			},

			// 结果处理
			processResults(scores) {
				const total = Object.values(scores).reduce((a, b) => a + b, 0)
				return {
					scores: [{
							label: '睡眠质量得分',
							value: scores.sleepQuality
						},
						{
							label: '入睡时间得分',
							value: scores.fallAsleep
						},
						{
							label: '睡眠时间得分',
							value: scores.sleepDuration
						},
						{
							label: '睡眠效率得分',
							value: scores.sleepEfficiency
						},
						{
							label: '睡眠障碍得分',
							value: scores.sleepTroubles
						},
						{
							label: '催眠药物得分',
							value: scores.medication
						},
						{
							label: '日间功能障碍得分',
							value: scores.daytimeFunction
						}
					],
					total,
					level: this.getEvaluationLevel(total)
				}
			},

			getEvaluationLevel(total) {
				const levels = [{
						max: 5,
						text: '睡眠质量很好'
					},
					{
						max: 10,
						text: '睡眠质量还行'
					},
					{
						max: 15,
						text: '睡眠质量一般'
					},
					{
						max: Infinity,
						text: '睡眠质量很差'
					}
				]
				return levels.find(l => total <= l.max).text
			},

			// 提交表单
			submitForm() {
				const scores = this.calculateScores();
				this.results = this.processResults(scores);
				// 将结果数据转换为 JSON 字符串
				const resultsJson = JSON.stringify(this.results);
				// 使用 uni.navigateTo 跳转到 result 页面，并传递结果数据
				uni.navigateTo({
					url: `/pages/PSQI/result?results=${resultsJson}`
				});
			},

			// 保存记录到本地存储
			saveRecord() {
				const record = {
					formData: this.formData,
					results: this.results,
					timestamp: new Date().toLocaleString()
				}
				this.records.push(record)
				uni.setStorageSync('sleepQuestionnaireRecords', this.records)
			},

			// 从本地存储加载记录
			loadRecords() {
				try {
					const records = uni.getStorageSync('sleepQuestionnaireRecords')
					if (records) {
						this.records = records
					}
				} catch (e) {
					console.error('加载本地存储记录失败', e)
				}
			},

			// 处理重新测试
			handleRestart() {
				this.currentPage = 0
				this.showResults = false
				this.formData = {
					bedTime: null,
					fallAsleepTime: null,
					wakeUpTime: null,
					sleepDuration: null,
					sleepTroubles: new Array(9).fill(null),
					singleSelect: new Array(4).fill(0),
					otherTroubles: ''
				}
			},

			// 处理选择器改变
			handlePickerChange(question, event) {
				const value = event.detail.value
				this.formData[question.model][question.optionIndex] = value
			},

			// 处理输入验证
			validateInput(question, event) {
				const value = event.target.value
				const numericValue = parseInt(value)
				if (isNaN(numericValue)) {
					this.formData[question.model] = null
				} else {
					this.formData[question.model] = numericValue
				}
			},

			// 判断问题是否必填
			isRequired(question) {
				return question.required
			},

			// 获取选择器显示值
			selectedValueDisplay(question) {
				const value = this.formData[question.model][question.optionIndex]
				return this.questionOptions[question.rangeKey][value]
			},

			// 上一页
			prevPage() {
				if (this.currentPage > 0) {
					this.currentPage--
					uni.pageScrollTo({
						scrollTop: 0,
						duration: 300
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* 使用SCSS增强样式管理 */
	.content {
		padding: 20rpx;
		min-height: 100vh;
		background: #f8f9fa;
		display: flex;
		justify-content: center;
		align-items: center;

		.text-area {
			background: white;
			border-radius: 16rpx;
			padding: 32rpx;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
			width: 80%;
			max-width: 600px;
		}

		.title {
			font-weight: bold;
			font-size: 20px;
			text-align: center !important;
			margin-bottom: 30px;
		}

		.question {
			margin-bottom: 20rpx;

			&-header {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;
			}

			.required-mark {
				color: #ff4d4f;
				margin-left: 8rpx;
			}
		}

		.input-field {
			border: 1px solid #ccc;
			border-radius: 10px;
			padding: 10rpx;
			font-size: 16px;
			height: 60rpx;
			width: 100%;
			box-sizing: content-box;
			transition: border-color 0.3s ease;

			&:focus {
				border-color: #007aff;
				outline: none;
			}
		}

		.custom-picker {
			border: 2rpx solid #e9ecef;
			border-radius: 10px;
			padding: 24rpx;
			background: #f8f9fa;
		}

		.button-group {
			display: flex;
			gap: 20rpx;
			margin-top: 40rpx;
			justify-content: center;

			.nav-button {
				flex: 1;
				border-radius: 8rpx;
				transition: all 0.2s;

				&.primary {
					background: #007aff;
					color: white;
				}
			}
		}

		.pagination {
			text-align: center;
			margin-top: 10px;
		}

		.result-section {
			background: #f8f9fa;
			border-radius: 16rpx;
			padding: 32rpx;
			margin-top: 40rpx;

			.result-grid {
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: 24rpx;
			}
		}
	}
</style>