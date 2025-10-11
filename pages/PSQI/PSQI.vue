<template>
  <view class="content">
    <view class="text-area">
      <text class="title">睡眠状态调查问卷</text>
      <template v-for="question in paginatedQuestions" :key="question.id">
        <view class="question" v-if="question.type === 'input'">
          <label class="question-label">{{ question.label }}</label>
          <input
            v-model="formData[question.model]"
            :placeholder="question.placeholder"
            class="input-field"
            @input="validateInput(question.model, $event)"
            :type="question.inputType || 'text'"
          />
        </view>
        <view class="question" v-else-if="question.type === 'picker'">
          <label class="question-label">{{ question.label }}</label>
          <picker
            :range="question.range"
            @change="handlePickerChange(question.model, $event)"
            :value="formData[question.model] || 0"
          >
            <view class="picker-field">
              {{ question.range[formData[question.model] || 0] }}
            </view>
          </picker>
        </view>
      </template>
      <button @click="prevPage" class="nav-button" :disabled="currentPage === 0">上一页</button>
      <button @click="nextPage" class="nav-button" :disabled="currentPage === totalPages - 1">
        下一页
      </button>
      <view v-if="showResults" class="result-section">
        <text class="result-title">得分结果</text>
        <view class="result-item">睡眠质量得分: {{ sleepQualityFinalScore }}</view>
        <view class="result-item">入睡时间得分: {{ fallAsleepFinalScore }}</view>
        <view class="result-item">睡眠时间得分: {{ sleepDurationFinalScore }}</view>
        <view class="result-item">睡眠效率得分: {{ sleepEfficiencyFinalScore }}</view>
        <view class="result-item">睡眠障碍得分: {{ sleepTroublesFinalScore }}</view>
        <view class="result-item">催眠药物得分: {{ medicationFinalScore }}</view>
        <view class="result-item">日间功能障碍得分: {{ daytimeFunctionFinalScore }}</view>
        <view class="result-item">PSQI 总分: {{ totalScore }}</view>
        <view class="result-item">评价等级: {{ evaluationLevel }}</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      questions: [
        {
          id: 'bedTime',
          type: 'input',
          label: '最近一个月里，你晚上通常几点钻进被窝准备睡觉呢？',
          model: 'bedTime',
          placeholder: '请输入时间（小时）',
          inputType: 'number',
          min: 0,
          max: 24
        },
        {
          id: 'fallAsleepTime',
          type: 'input',
          label: '躺下后，你大概需要多少分钟才能进入梦乡呀？',
          model: 'fallAsleepTime',
          placeholder: '请输入分钟数',
          inputType: 'number',
          min: 0
        },
        {
          id: 'wakeUpTime',
          type: 'input',
          label: '你一般几点起床呀？',
          model: 'wakeUpTime',
          placeholder: '请输入时间（小时）',
          inputType: 'number',
          min: 0,
          max: 24
        },
        {
          id: 'sleepDuration',
          type: 'input',
          label: '最近一个月，你每天实际睡着的时间大概有多久呢？',
          model: 'sleepDuration',
          placeholder: '请输入小时数',
          inputType: 'number',
          min: 0
        },
        {
          id: 'sleepTrouble1',
          type: 'picker',
          label: '有没有遇到以下睡眠烦恼呢？翻来覆去睡不着（超过30分钟）',
          range: ['完全没遇到', '一周不到1次', '1~2次/周', '每周3次以上'],
          model: 'sleepTrouble1'
        },
        {
          id: 'sleepTrouble2',
          type: 'picker',
          label: '半夜突然醒来或醒得太早',
          range: ['完全没遇到', '一周不到1次', '1~2次/周', '每周3次以上'],
          model: 'sleepTrouble2'
        },
        // 其他问题...
        {
          id: 'sleepQuality',
          type: 'picker',
          label: '总体来说，最近一个月的睡眠质量你打几分？',
          range: ['超棒！', '还不错', '有点糟', '非常差'],
          model: 'sleepQuality'
        },
        {
          id: 'medication',
          type: 'picker',
          label: '最近一个月，你有借助药物助眠吗？',
          range: ['完全不需要', '一周不到1次', '1~2次/周', '每周3次以上'],
          model: 'medication'
        },
        {
          id: 'daytimeSleepiness',
          type: 'picker',
          label: '最近白天会经常犯困吗？',
          range: ['活力满满！', '偶尔打哈欠', '有时困困的', '经常眼皮打架'],
          model: 'daytimeSleepiness'
        },
        {
          id: 'lackOfEnergy',
          type: 'picker',
          label: '最近做事时，会不会觉得精力不足？',
          range: ['完全没有！', '偶尔偷懒', '有时力不从心', '经常累成汪'],
          model: 'lackOfEnergy'
        }
      ],
      currentPage: 0,
      itemsPerPage: 5,
      formData: {
        bedTime: null,
        fallAsleepTime: null,
        wakeUpTime: null,
        sleepDuration: null,
        sleepTrouble1: null,
        sleepTrouble2: null,
        // 其他问题...
        sleepQuality: null,
        medication: null,
        daytimeSleepiness: null,
        lackOfEnergy: null
      },
      showResults: false
    };
  },
  computed: {
    paginatedQuestions() {
		const start = this.currentPage * this.itemsPerPage;
		const end = start + this.itemsPerPage;
		return this.questions.slice(start, end);
    },
    totalPages() {
		return Math.ceil(this.questions.length / this.itemsPerPage);
    }
  },
  methods: {
    nextPage() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
      } else {
        this.calculateScore();
      }
    },
    prevPage() {
      if (this.currentPage > 0) {
        this.currentPage--;
      }
    },
    handlePickerChange(model, event) {
      this.formData[model] = event.detail.value;
    },
    validateInput(model, event) {
      const value = event.target.value;
      const numericValue = parseInt(value);
      if (!isNaN(numericValue)) {
        this.formData[model] = numericValue;
      } else {
        this.formData[model] = null;
      }
    },
    calculateScore() {
      const getScore = (value, options) => {
        return value === 0 ? 0 : value === 1 ? 1 : value === 2 ? 2 : 3;
      };

      const calculateSleepEfficiency = () => {
        const bedTime = this.formData.bedTime || 0;
        const wakeUpTime = this.formData.wakeUpTime || 0;
        const sleepDuration = this.formData.sleepDuration || 0;

        let bedTimeHours = wakeUpTime < bedTime ? 24 - bedTime + wakeUpTime : wakeUpTime - bedTime;
        if (bedTimeHours <= 0 || sleepDuration <= 0) return 3;

        const sleepEfficiency = (sleepDuration / bedTimeHours) * 100;
        return sleepEfficiency > 85 ? 0 : sleepEfficiency >= 75 ? 1 : sleepEfficiency >= 65 ? 2 : 3;
      };

      const calculateSleepTroubles = () => {
        let total = 0;
        for (let i = 1; i <= 9; i++) {
          const key = `sleepTrouble${i}`;
          if (this.formData[key] !== undefined) {
            total += getScore(this.formData[key], []);
          }
        }
        return total === 0 ? 0 : total <= 9 ? 1 : total <= 18 ? 2 : 3;
      };

      this.sleepQualityFinalScore = getScore(this.formData.sleepQuality, []);
      this.fallAsleepFinalScore = getScore(this.formData.fallAsleepTime <= 15 ? 0 : this.formData.fallAsleepTime <= 30 ? 1 : this.formData.fallAsleepTime <= 60 ? 2 : 3, []);
      this.sleepDurationFinalScore = getScore(this.formData.sleepDuration > 7 ? 0 : this.formData.sleepDuration >= 6 ? 1 : this.formData.sleepDuration >= 5 ? 2 : 3, []);
      this.sleepEfficiencyFinalScore = calculateSleepEfficiency();
      this.sleepTroublesFinalScore = calculateSleepTroubles();
      this.medicationFinalScore = getScore(this.formData.medication, []);
      this.daytimeFunctionFinalScore = getScore(this.formData.daytimeSleepiness + this.formData.lackOfEnergy, []);

      this.totalScore = Object.values({
        sleepQuality: this.sleepQualityFinalScore,
        fallAsleep: this.fallAsleepFinalScore,
        sleepDuration: this.sleepDurationFinalScore,
        sleepEfficiency: this.sleepEfficiencyFinalScore,
        sleepTroubles: this.sleepTroublesFinalScore,
        medication: this.medicationFinalScore,
        daytimeFunction: this.daytimeFunctionFinalScore
      }).reduce((sum, score) => sum + score, 0);

      this.evaluationLevel = this.totalScore <= 5 ? '睡眠质量很好' : this.totalScore <= 10 ? '睡眠质量还行' : this.totalScore <= 15 ? '睡眠质量一般' : '睡眠质量很差';
      this.showResults = true;
    }
  }
};
</script>

<style scoped>
:root {
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
}

.content {
  padding: var(--spacing-md);
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
}

.text-area {
  border-radius: var(--spacing-md);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 48rem;
  box-sizing: border-box;
  background-color: #ffffff;
  padding: var(--spacing-md) * 2;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  color: #1e293b;
  margin-bottom: var(--spacing-md) * 1.5;
}

.question {
  margin-bottom: var(--spacing-md);
}

.question-label {
  display: block;
  font-size: 0.875rem;
  font-weight: bold;
  color: #334155;
  margin-bottom: var(--spacing-sm);
}

.input-field {
  border-radius: var(--spacing-sm);
  border: 1px solid #cbd5e1;
  padding: var(--spacing-sm) var(--spacing-md);
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
  height: 2rem;
  box-sizing: border-box;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.5);
}

.picker-field {
  border-radius: var(--spacing-sm);
  border: 1px solid #cbd5e1;
  padding: var(--spacing-sm) var(--spacing-md);
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.875rem;
  color: #334155;
}

.picker-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.5);
}

.nav-button {
  border-radius: var(--spacing-sm);
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  transition: background-color 0.2s ease-in-out;
  width: auto;
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  margin: var(--spacing-sm);
}

.nav-button:hover {
  background-color: var(--color-primary-hover);
}

.nav-button:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.result-section {
  border-radius: var(--spacing-sm);
  background-color: #f3f4f6;
  padding: var(--spacing-md);
  margin-top: var(--spacing-md) * 1.5;
  box-sizing: border-box;
}

.result-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: var(--spacing-md);
}

.result-item {
  font-size: 0.875rem;
  color: #334155;
  margin-bottom: var(--spacing-sm);
}
</style>