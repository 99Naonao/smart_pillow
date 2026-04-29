<template>
	<view class="report-page">
		<z-nav-bar
			bg-color="#ffffff"
			title="睡眠报告"
			font-color="#1e293b"
			:shadow="true"
			:backState="2000"
			:homeState="2000"
			bgColorAngle="90"
		></z-nav-bar>

		<scroll-view scroll-y class="report-scroll" :show-scrollbar="false">
			<view class="page-inner">
				<!-- 日期条 -->
				<view class="date-bar">
					<view class="date-arrow" hover-class="date-arrow-hover" @click.stop="prevDay">
						<image class="date-arrow-img" src="../../static/icon/left_back.png" mode="aspectFit" />
					</view>
					<view class="date-picker-center" @click.stop="openCalendar">
						<view class="date-value-wrap">
							<text class="date-value">{{ reportDate }}</text>
						</view>
					</view>
					<view class="date-arrow" hover-class="date-arrow-hover" @click.stop="nextDay">
						<image class="date-arrow-img" src="../../static/icon/right_back.png" mode="aspectFit" />
					</view>
				</view>

				<!-- 睡眠结构图：阶梯式 Hypnogram（清醒 / 浅睡 / 深睡，不含快速眼动） -->
				<view class="card hypno-card">
					<view class="hypno-top-bar">
						<view class="hypno-top-placeholder" />
						<view class="hypno-offbed-hint">
							<image class="hypno-offbed-ico" src="../../static/icon/mine.png" mode="aspectFit" />
							<text class="hypno-offbed-txt">{{ offBedText }}</text>
						</view>
					</view>
					<view class="hypno-chart-wrap">
						<view class="hypno-step-layout">
							<view class="hypno-y-labels">
								<text
									v-for="row in stageRows"
									:key="row.key + '-yl'"
									class="hypno-y-label"
								>{{ row.label }}</text>
							</view>
							<view class="hypno-plot-frame">
								<view class="hypno-grid-lines">
									<view class="hypno-dash hypno-dash-1" />
									<view class="hypno-dash hypno-dash-2" />
									<view class="hypno-dash hypno-dash-3" />
								</view>
								<view class="hypno-plot-inner">
									<view
										v-for="(vc, vi) in hypnoVerticalConnectors"
										:key="'vc' + vi"
										class="hypno-vline"
										:style="vc.style"
									/>
									<template v-for="(seg, si) in sleepStageTimeline" :key="'hb' + si">
										<view
											v-if="seg.end > seg.start"
											class="hypno-hbar"
											:class="'hypno-hbar-' + seg.stage"
											:style="hypnoHbarStyle(seg)"
										/>
									</template>
								</view>
							</view>
						</view>
					</view>
					<view class="hypno-time-row">
						<text class="hypno-time">{{ sleepRange.start }}</text>
						<text class="hypno-time">{{ sleepRange.end }}</text>
					</view>
				</view>

				<view class="summary-row">
					<view class="summary-main">
						<text class="summary-label">您在床</text>
						<text class="summary-num">{{ inBedHour }}</text>
						<text class="summary-unit">小时</text>
						<text class="summary-num">{{ inBedMin }}</text>
						<text class="summary-unit">分钟</text>
					</view>
				</view>

				<view class="sleep-split-bar">
					<view
						v-for="item in sleepSplitItems"
						:key="item.key"
						class="sleep-split-part"
						:class="item.className"
						:style="{ flex: item.flex }"
					/>
				</view>
				<scroll-view scroll-x class="sleep-split-meta-scroll" :show-scrollbar="false">
					<view class="sleep-split-meta-inner">
						<view class="sleep-split-labels-row">
							<view
								v-for="item in sleepSplitItems"
								:key="item.key + '-label'"
								class="sleep-split-meta-cell"
								:style="{ flex: item.flex }"
							>
								<text class="sleep-split-label-meta">{{ item.label }}</text>
							</view>
						</view>
						<view class="sleep-split-times-row">
							<view
								v-for="item in sleepSplitItems"
								:key="item.key + '-time'"
								class="sleep-split-meta-cell"
								:style="{ flex: item.flex }"
							>
								<text class="sleep-split-time">{{ item.timeText }}</text>
							</view>
						</view>
					</view>
				</scroll-view>

				<!-- 三项指标摘要 -->
				<view class="card metrics-strip">
					<view class="metric-cell">
						<image class="metric-ico" src="../../static/icon/heart_rate.png" mode="aspectFit" />
						<text class="metric-title">平均心率</text>
						<text class="metric-val">{{ vitalSummary.hr }} <text class="metric-unit">次/分</text></text>
					</view>
					<view class="metric-divider" />
					<view class="metric-cell">
						<image class="metric-ico" src="../../static/icon/breath_rate.png" mode="aspectFit" />
						<text class="metric-title">平均呼吸率</text>
						<text class="metric-val">{{ vitalSummary.rr }} <text class="metric-unit">次/分</text></text>
					</view>
					<view class="metric-divider" />
					<view class="metric-cell">
						<image class="metric-ico" src="../../static/icon/body_movement.png" mode="aspectFit" />
						<text class="metric-title">累计体动</text>
						<text class="metric-val">{{ vitalSummary.move }} <text class="metric-unit">次</text></text>
					</view>
				</view>

				<!-- 睡眠综合评估（暂不展示，需要时去掉 v-if="false"） -->
				<view v-if="false" class="card assess-card">
					<view class="assess-head">
						<image class="assess-ico" src="../../static/icon/diagnosis.png" mode="aspectFit" />
						<text class="assess-title">睡眠综合评估</text>
					</view>
					<view class="assess-timeline">
						<view class="assess-time-node">
							<text class="assess-time-label">{{ sleepMarkers.fallAsleep }}</text>
							<view class="assess-time-arrow" />
							<text class="assess-time-desc">入睡时刻</text>
						</view>
					</view>
				</view>

				<!-- 心率曲线卡 -->
				<view class="card chart-card">
					<view class="chart-head">
						<image class="chart-head-ico" src="../../static/icon/heart_rate.png" mode="aspectFit" />
						<text class="chart-head-title">平均心率</text>
						<view class="chart-head-right">
							<text class="chart-head-val">{{ vitalSummary.hr }}</text>
							<text class="chart-head-unit">次/分</text>
						</view>
					</view>
					<view class="chart-body">
						<view class="chart-y-labels">
							<text v-for="t in chartYHeart" :key="t" class="chart-y-t">{{ t }}</text>
						</view>
						<view
							id="heart-plot"
							class="chart-plot chart-plot-line"
							@touchstart.stop="onLineTouch($event, 'heart')"
							@touchmove.stop.prevent="onLineTouch($event, 'heart')"
						>
							<view class="chart-grid-h" />
							<view class="chart-grid-h" />
							<view class="chart-grid-h" />
							<view class="chart-line-segs">
								<view
									v-for="(seg, i) in heartCurveSegments"
									:key="'hs' + i"
									class="chart-line-seg"
									:style="seg"
								/>
							</view>
							<view class="chart-line-dots">
								<view
									v-for="(p, i) in heartLinePoints"
									:key="'h' + i"
									class="chart-dot"
									:class="{ 'is-high': p.high, 'is-low': p.low }"
									:style="{ left: p.x + '%', bottom: p.y + '%' }"
								/>
							</view>
							<view
								v-for="(m, i) in heartExtremaMarkers"
								:key="'hem' + i"
								class="chart-extrema"
								:class="m.type === 'max' ? 'is-max' : 'is-min'"
								:style="{ left: m.x + '%', bottom: m.y + '%' }"
							>
								<text class="chart-extrema-label">{{ m.value }}</text>
							</view>
							<view
								v-if="heartTooltip"
								class="chart-tooltip"
								:class="{ 'chart-tooltip--below': heartTooltip.placement === 'below' }"
								:style="{ left: heartTooltip.x + '%', bottom: heartTooltip.y + '%' }"
							>
								<text class="chart-tooltip-txt">{{ heartTooltip.time }} {{ heartTooltip.value }}</text>
							</view>
						</view>
						<view class="chart-flags">
							<text class="chart-flag">高</text>
							<text class="chart-flag">正常</text>
							<text class="chart-flag">低</text>
						</view>
					</view>
<!-- 					<view class="chart-footer-ico">
						<image class="chart-expand-ico" src="../../static/icon/histogram.png" mode="aspectFit" />
					</view> -->
				</view>

				<!-- 呼吸率曲线卡 -->
				<view class="card chart-card">
					<view class="chart-head">
						<image class="chart-head-ico" src="../../static/icon/breath_rate.png" mode="aspectFit" />
						<text class="chart-head-title">平均呼吸率</text>
						<view class="chart-head-right">
							<text class="chart-head-val">{{ vitalSummary.rr }}</text>
							<text class="chart-head-unit">次/分</text>
						</view>
					</view>
					<view class="chart-body">
						<view class="chart-y-labels">
							<text v-for="t in chartYBreath" :key="'b' + t" class="chart-y-t">{{ t }}</text>
						</view>
						<view
							id="breath-plot"
							class="chart-plot chart-plot-line"
							@touchstart.stop="onLineTouch($event, 'breath')"
							@touchmove.stop.prevent="onLineTouch($event, 'breath')"
						>
							<view class="chart-grid-h" />
							<view class="chart-grid-h" />
							<view class="chart-grid-h" />
							<view class="chart-line-segs">
								<view
									v-for="(seg, i) in breathCurveSegments"
									:key="'bs' + i"
									class="chart-line-seg chart-line-seg-breath"
									:style="seg"
								/>
							</view>
							<view class="chart-line-dots">
								<view
									v-for="(p, i) in breathLinePoints"
									:key="'r' + i"
									class="chart-dot chart-dot-breath"
									:style="{ left: p.x + '%', bottom: p.y + '%' }"
								/>
							</view>
							<view
								v-for="(m, i) in breathExtremaMarkers"
								:key="'bem' + i"
								class="chart-extrema"
								:class="m.type === 'max' ? 'is-max' : 'is-min'"
								:style="{ left: m.x + '%', bottom: m.y + '%' }"
							>
								<text class="chart-extrema-label">{{ m.value }}</text>
							</view>
							<view
								v-if="breathTooltip"
								class="chart-tooltip"
								:class="{ 'chart-tooltip--below': breathTooltip.placement === 'below' }"
								:style="{ left: breathTooltip.x + '%', bottom: breathTooltip.y + '%' }"
							>
								<text class="chart-tooltip-txt">{{ breathTooltip.time }} {{ breathTooltip.value }}</text>
							</view>
						</view>
						<view class="chart-flags">
							<text class="chart-flag">高</text>
							<text class="chart-flag">正常</text>
							<text class="chart-flag">低</text>
						</view>
					</view>
<!-- 					<view class="chart-footer-ico">
						<image class="chart-expand-ico" src="../../static/icon/histogram.png" mode="aspectFit" />
					</view> -->
				</view>

				<!-- 体动柱状卡 -->
				<view class="card chart-card">
					<view class="chart-head">
						<image class="chart-head-ico" src="../../static/icon/body_movement.png" mode="aspectFit" />
						<text class="chart-head-title">累计体动</text>
						<view class="chart-head-right">
							<text class="chart-head-val">{{ vitalSummary.move }}</text>
							<text class="chart-head-unit">次</text>
						</view>
					</view>
					<view class="chart-body chart-body-bars">
						<view class="chart-y-labels">
							<text v-for="t in chartYMove" :key="'m' + t" class="chart-y-t">{{ t }}</text>
						</view>
						<view
							id="move-plot"
							class="chart-bars-wrap"
							@touchstart.stop="onLineTouch($event, 'move')"
							@touchmove.stop.prevent="onLineTouch($event, 'move')"
						>
							<view v-for="(h, i) in moveBars" :key="'mv' + i" class="chart-bar-col">
								<view class="chart-bar-fill" :style="{ height: h + '%' }" />
							</view>
							<view
								v-if="moveTooltip"
								class="chart-tooltip"
								:class="{ 'chart-tooltip--below': moveTooltip.placement === 'below' }"
								:style="{ left: moveTooltip.x + '%', bottom: moveTooltip.y + '%' }"
							>
								<text class="chart-tooltip-txt">{{ moveTooltip.time }} {{ moveTooltip.value }}</text>
							</view>
						</view>
					</view>
<!-- 					<view class="chart-footer-ico">
						<image class="chart-expand-ico" src="../../static/icon/histogram.png" mode="aspectFit" />
					</view> -->
				</view>

				<!-- 睡眠质量诊断 -->
				<view class="section-block">
					<view class="section-title-row">
						<image class="section-ico" src="../../static/icon/diagnosis.png" mode="aspectFit" />
						<text class="section-title">睡眠质量诊断</text>
					</view>
					<view class="tag-row">
						<text v-for="(tag, i) in diagnosisTags" :key="'tg' + i" :class="['diag-tag', tag.tone]">{{ tag.text }}</text>
					</view>
					<view class="bullet-list">
						<view v-for="(line, i) in diagnosisLines" :key="'dl' + i" class="bullet-item">
							<text class="bullet-dot">·</text>
							<text class="bullet-txt" user-select>{{ line }}</text>
						</view>
					</view>
				</view>

				<!-- 温馨提示 -->
				<view class="section-block">
					<view class="section-title-row">
						<image class="section-ico" src="../../static/icon/warm.png" mode="aspectFit" />
						<text class="section-title">温馨提示</text>
					</view>
					<view class="bullet-list">
						<view v-for="(line, i) in warmTips" :key="'w' + i" class="bullet-item">
							<text class="bullet-dot">·</text>
							<text class="bullet-txt" user-select>{{ line }}</text>
						</view>
					</view>
				</view>

				<!-- 相关问答 -->
				<view class="section-block section-block-last">
					<view class="section-title-row">
						<image class="section-ico" src="../../static/icon/question.png" mode="aspectFit" />
						<text class="section-title">相关问答</text>
					</view>
					<view class="qa-switch-row" v-if="qaList.length > 1">
						<text class="qa-switch-btn" :class="{ disabled: qaIndex <= 0 }" @click="prevQa">上一条</text>
						<text class="qa-switch-indicator">{{ qaIndex + 1 }}/{{ qaList.length }}</text>
						<text class="qa-switch-btn" :class="{ disabled: qaIndex >= qaList.length - 1 }" @click="nextQa">下一条</text>
					</view>
					<text class="qa-q" user-select>{{ currentQa.question }}</text>
					<text class="qa-a" user-select>{{ currentQa.answer }}</text>
				</view>
			</view>
		</scroll-view>

		<!-- 月历 -->
		<view v-if="showCalendar" class="cal-mask" @click.self="closeCalendar">
			<view class="cal-panel" @click.stop>
				<view class="cal-panel-head">
					<view class="cal-month-arrow" :class="{ disabled: !canPrevMonthCal }" @click="prevMonthCal">
						<image class="cal-month-arrow-img" src="../../static/icon/arrow_left.png" mode="aspectFit" />
					</view>
					<text class="cal-month-title">{{ viewMonthTitle }}</text>
					<view class="cal-month-arrow" :class="{ disabled: !canNextMonthCal }" @click="nextMonthCal">
						<image class="cal-month-arrow-img" src="../../static/icon/arrow_right.png" mode="aspectFit" />
					</view>
				</view>
				<view class="cal-weekdays">
					<text v-for="(w, idx) in weekdayLabels" :key="'w' + idx" class="cal-weekday">{{ w }}</text>
				</view>
				<view class="cal-grid">
					<view
						v-for="(c, i) in gridCells"
						:key="'c' + i"
						class="cal-cell"
						:class="{
							'is-empty': c.type === 'empty',
							'is-disabled': c.type === 'day' && c.disabled,
							'is-today': c.type === 'day' && c.isToday,
							'is-selected': c.type === 'day' && c.isSelected
						}"
						@click="onCalendarCellClick(c)"
					>
						<text v-if="c.type === 'day'" class="cal-day-num">{{ c.day }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import soapDeviceApi from '@/utils/soapDeviceApi.js';
	/** 本地联调兜底开关：仅非正式环境（develop/trial）生效。 */
	const REPORT_DEBUG_FALLBACK_ENABLED = true;
	/** 本地联调兜底 MAC：未从缓存拿到设备 MAC 时可使用（受上方开关和环境限制）。 */
	const REPORT_DEBUG_FALLBACK_MAC = 'B4:C2:E0:F5:A7:5D';

	function isReleaseEnv() {
		try {
			const accountInfo = uni.getAccountInfoSync && uni.getAccountInfoSync();
			const env = accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion;
			return env === 'release';
		} catch (e) {
			// 无法识别环境时按正式环境处理，避免误用兜底 MAC。
			return true;
		}
	}

	function pad2(n) {
		return n < 10 ? '0' + n : String(n);
	}
	function formatYMD(d) {
		return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
	}
	function parseYMD(str) {
		const parts = str.split('-');
		if (parts.length !== 3) return new Date();
		return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
	}
	function todayDateOnly() {
		const d = new Date();
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	}

	/** 睡眠结构时序：清醒 / 浅睡 / 深睡（start/end 为 0～100%，接接口后按真实时间换算；不含 REM） */
	function buildSleepStageTimeline() {
		return [
			{ start: 0, end: 4, stage: 'wake' },
			{ start: 4, end: 17, stage: 'light' },
			{ start: 17, end: 36, stage: 'deep' },
			{ start: 36, end: 71, stage: 'light' },
			{ start: 71, end: 84, stage: 'deep' },
			{ start: 84, end: 96, stage: 'light' },
			{ start: 96, end: 100, stage: 'wake' }
		];
	}

	function hypnoBandTopPct(stage) {
		const m = { offbed: 0, wake: 25, light: 50, deep: 75 };
		return m[stage] != null ? m[stage] : 0;
	}

	function hypnoBandCenterPct(stage) {
		const m = { offbed: 12.5, wake: 37.5, light: 62.5, deep: 87.5 };
		return m[stage] != null ? m[stage] : 0;
	}

	function mockLine(n, base, amp) {
		const arr = [];
		for (let i = 0; i < n; i++) {
			const t = (i / (n - 1)) * Math.PI * 2;
			const y = base + Math.sin(t) * amp + (i % 5) * 1.2;
			arr.push({
				x: (i / (n - 1)) * 92 + 4,
				y: Math.max(12, Math.min(88, y))
			});
		}
		return arr;
	}
	function mapPointToValue(yPct, min, max) {
		const ratio = Math.max(0, Math.min(1, yPct / 100));
		return Math.round(min + (max - min) * ratio);
	}
	function buildTimeSlots(startHHMM, endHHMM, n) {
		const [sh, sm] = (startHHMM || '22:00').split(':').map(v => Number(v) || 0);
		const [eh, em] = (endHHMM || '06:00').split(':').map(v => Number(v) || 0);
		const startMin = sh * 60 + sm;
		let endMin = eh * 60 + em;
		if (endMin <= startMin) endMin += 24 * 60;
		const total = Math.max(1, endMin - startMin);
		const arr = [];
		for (let i = 0; i < n; i++) {
			const ratio = n <= 1 ? 0 : i / (n - 1);
			const m = Math.round(startMin + total * ratio) % (24 * 60);
			arr.push(`${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`);
		}
		return arr;
	}

	function catmullRomSpline(points, step = 6) {
		if (!Array.isArray(points) || points.length < 2) return [];
		if (points.length === 2) return points.slice();
		const out = [];
		const get = (idx) => points[Math.max(0, Math.min(points.length - 1, idx))];
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = get(i - 1);
			const p1 = get(i);
			const p2 = get(i + 1);
			const p3 = get(i + 2);
			for (let j = 0; j < step; j++) {
				const t = j / step;
				const t2 = t * t;
				const t3 = t2 * t;
				const x =
					0.5 *
					((2 * p1.x) +
						(-p0.x + p2.x) * t +
						(2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
						(-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
				const y =
					0.5 *
					((2 * p1.y) +
						(-p0.y + p2.y) * t +
						(2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
						(-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
				// 限幅：防止 Catmull-Rom 在相邻点之间出现过冲，导致“视觉最高点”偏离真实极值点。
				const yMin = Math.min(p1.y, p2.y);
				const yMax = Math.max(p1.y, p2.y);
				out.push({
					x: Math.max(0, Math.min(100, x)),
					y: Math.max(0, Math.min(100, Math.max(yMin, Math.min(yMax, y))))
				});
			}
		}
		out.push(points[points.length - 1]);
		return out;
	}

	function buildLineSegments(points) {
		if (!Array.isArray(points) || points.length < 2) return [];
		const segs = [];
		for (let i = 0; i < points.length - 1; i++) {
			const a = points[i];
			const b = points[i + 1];
			const dx = (b.x || 0) - (a.x || 0);
			const dy = (b.y || 0) - (a.y || 0);
			const len = Math.sqrt(dx * dx + dy * dy);
			if (!(len > 0)) continue;
			const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
			segs.push({
				left: (a.x || 0) + '%',
				bottom: `calc(${a.y || 0}% - 1rpx)`,
				width: len + '%',
				transform: `rotate(${-angle}deg)`
			});
		}
		return segs;
	}

	function buildExtremaMarkers(points, toValue) {
		if (!Array.isArray(points) || points.length < 2) return [];
		let maxIdx = 0;
		let minIdx = 0;
		for (let i = 1; i < points.length; i++) {
			if ((points[i].y || 0) > (points[maxIdx].y || 0)) maxIdx = i;
			if ((points[i].y || 0) < (points[minIdx].y || 0)) minIdx = i;
		}
		const markers = [];
		const mk = (idx, type) => {
			const p = points[idx] || {};
			markers.push({
				x: p.x || 0,
				y: p.y || 0,
				type,
				value: String(toValue(p.y || 0))
			});
		};
		mk(maxIdx, 'max');
		if (minIdx !== maxIdx) mk(minIdx, 'min');
		return markers;
	}

	export default {
		data() {
			return {
				reportDate: formatYMD(todayDateOnly()),
				showCalendar: false,
				viewMonth: null,
				weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
				offBedText: '离床 14min',
				stageRows: [
					{ key: 'offbed', label: '离床' },
					{ key: 'wake', label: '清醒' },
					{ key: 'light', label: '浅睡' },
					{ key: 'deep', label: '深睡' }
				],
				sleepStageTimeline: [],
				sleepRange: { start: '19:43', end: '07:52' },
				inBedHour: '12',
				inBedMin: '3',
				stageStats: {
					deep: '1.5 小时',
					light: '9.1 小时',
					awake: '1.5 小时',
					offbed: '0.0 小时'
				},
				splitDeep: 1.5,
				splitLight: 9.1,
				splitAwake: 1.5,
				splitOffbed: 0.2,
				vitalSummary: { hr: '75', rr: '15', move: '218' },
				sleepMarkers: { fallAsleep: '19:48' },
				chartYHeart: ['150', '100', '50', '0'],
				chartYBreath: ['30', '20', '10', '0'],
				chartYMove: ['6', '4', '2', '0'],
				heartLinePoints: [],
				breathLinePoints: [],
				moveBars: [],
				heartPointTimes: [],
				breathPointTimes: [],
				movePointTimes: [],
				heartValueSeries: [],
				breathValueSeries: [],
				moveValueSeries: [],
				activeHeartIndex: 0,
				activeBreathIndex: 0,
				activeMoveIndex: 0,
				heartTooltipVisible: false,
				breathTooltipVisible: false,
				moveTooltipVisible: false,
				diagnosisTags: [
					{ text: '正常', tone: 'tone-blue' },
					{ text: '多次觉醒', tone: 'tone-warn' },
					{ text: '深度睡眠时间不足', tone: 'tone-warn' },
					{ text: '起床太迟', tone: 'tone-warn' }
				],
				diagnosisLines: [
					'深睡时长尚可，但深睡占比略低，可适当提前入睡。',
					'夜间觉醒次数偏多，建议保持卧室安静、恒温。',
					'起床时间偏晚，规律作息有助于稳定生物钟。'
				],
				warmTips: [
					'本报告基于设备采集数据估算，如有不适请咨询医生。',
					'睡前避免大量饮水与咖啡因，减少夜间觉醒。',
					'固定起床时间，即使周末也尽量不要晚起超过 1 小时。'
				],
				qa: {
					question: '什么样的环境益于睡眠?',
					answer: '安静、较暗、温度适宜（约 18–24℃）的环境更有利于入睡与维持深睡。'
				},
				qaList: [],
				qaIndex: 0,
				reportLoading: false,
				soapDeviceMac: ''
			};
		},
		created() {
			this.sleepStageTimeline = buildSleepStageTimeline();
			const h = mockLine(36, 48, 18);
			this.heartLinePoints = h.map((p, i) => ({
				x: p.x,
				y: p.y,
				high: i === 10,
				low: i === 24
			}));
			this.breathLinePoints = mockLine(32, 42, 12).map(p => ({ x: p.x, y: p.y }));
			this.heartPointTimes = buildTimeSlots(this.sleepRange.start, this.sleepRange.end, this.heartLinePoints.length);
			this.breathPointTimes = buildTimeSlots(this.sleepRange.start, this.sleepRange.end, this.breathLinePoints.length);
			this.activeHeartIndex = Math.floor(this.heartLinePoints.length / 2);
			this.activeBreathIndex = Math.floor(this.breathLinePoints.length / 2);
			const bars = [];
			for (let i = 0; i < 40; i++) {
				bars.push(15 + (i * 17 + (i % 7) * 11) % 75);
			}
			this.moveBars = bars;
			this.movePointTimes = buildTimeSlots(this.sleepRange.start, this.sleepRange.end, this.moveBars.length);
			this.activeMoveIndex = Math.floor(this.moveBars.length / 2);
		},
		computed: {
			pickerEnd() {
				return formatYMD(todayDateOnly());
			},
			pickerStart() {
				const d = new Date();
				d.setFullYear(d.getFullYear() - 10);
				return formatYMD(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
			},
			viewMonthTitle() {
				if (!this.viewMonth) return '';
				return `${this.viewMonth.getFullYear()}年${pad2(this.viewMonth.getMonth() + 1)}月`;
			},
			canPrevMonthCal() {
				if (!this.viewMonth) return false;
				const start = parseYMD(this.pickerStart);
				const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
				return this.viewMonth > startMonth;
			},
			canNextMonthCal() {
				if (!this.viewMonth) return false;
				const t = todayDateOnly();
				const endMonth = new Date(t.getFullYear(), t.getMonth(), 1);
				return this.viewMonth < endMonth;
			},
			hypnoVerticalConnectors() {
				const segs = this.sleepStageTimeline;
				const list = [];
				for (let i = 0; i < segs.length - 1; i++) {
					const a = segs[i];
					const b = segs[i + 1];
					if (!a || !b || a.stage === b.stage) {
						continue;
					}
					const x = a.end;
					const c1 = hypnoBandCenterPct(a.stage);
					const c2 = hypnoBandCenterPct(b.stage);
					const top = Math.min(c1, c2);
					const height = Math.abs(c2 - c1);
					if (height < 0.5) {
						continue;
					}
					list.push({
						style: {
							left: x + '%',
							top: top + '%',
							height: height + '%'
						}
					});
				}
				return list;
			},
			gridCells() {
				if (!this.viewMonth) return [];
				const year = this.viewMonth.getFullYear();
				const month = this.viewMonth.getMonth();
				const firstDow = new Date(year, month, 1).getDay();
				const daysInMonth = new Date(year, month + 1, 0).getDate();
				const today = todayDateOnly();
				const start = parseYMD(this.pickerStart);
				const selected = parseYMD(this.reportDate);
				const cells = [];
				for (let i = 0; i < firstDow; i++) cells.push({ type: 'empty' });
				for (let d = 1; d <= daysInMonth; d++) {
					const dt = new Date(year, month, d);
					const disabled = dt > today || dt < start;
					const isToday =
						dt.getFullYear() === today.getFullYear() &&
						dt.getMonth() === today.getMonth() &&
						dt.getDate() === today.getDate();
					const isSelected =
						dt.getFullYear() === selected.getFullYear() &&
						dt.getMonth() === selected.getMonth() &&
						dt.getDate() === selected.getDate();
					cells.push({
						type: 'day',
						day: d,
						disabled,
						isToday,
						isSelected,
						ymd: formatYMD(dt)
					});
				}
				while (cells.length % 7 !== 0) cells.push({ type: 'empty' });
				return cells;
			},
			heartTooltip() {
				if (!this.heartTooltipVisible) return null;
				const p = this.heartLinePoints[this.activeHeartIndex];
				if (!p) return null;
				const hv = this.heartValueSeries[this.activeHeartIndex];
				const valueText = Number.isFinite(hv)
					? `${Math.round(hv)}次/分`
					: `${mapPointToValue(p.y, 40, 120)}次/分`;
				const x = Math.max(14, Math.min(86, p.x));
				return {
					x,
					y: p.y,
					placement: p.y > 72 ? 'below' : 'above',
					time: this.heartPointTimes[this.activeHeartIndex] || '--:--',
					value: valueText
				};
			},
			breathTooltip() {
				if (!this.breathTooltipVisible) return null;
				const p = this.breathLinePoints[this.activeBreathIndex];
				if (!p) return null;
				const rv = this.breathValueSeries[this.activeBreathIndex];
				const valueText = Number.isFinite(rv)
					? `${Number(rv).toFixed(1)}次/分`
					: `${mapPointToValue(p.y, 8, 28)}次/分`;
				const x = Math.max(14, Math.min(86, p.x));
				return {
					x,
					y: p.y,
					placement: p.y > 72 ? 'below' : 'above',
					time: this.breathPointTimes[this.activeBreathIndex] || '--:--',
					value: valueText
				};
			},
			moveTooltip() {
				if (!this.moveTooltipVisible) return null;
				const h = this.moveBars[this.activeMoveIndex];
				if (h == null) return null;
				const mv = this.moveValueSeries[this.activeMoveIndex];
				const valueText = Number.isFinite(mv)
					? `${Math.round(mv)}次`
					: `${Math.max(0, Math.round((h / 100) * 6))}次`;
				const x = Math.max(14, Math.min(86, (this.activeMoveIndex / Math.max(1, this.moveBars.length - 1)) * 92 + 4));
				return {
					x,
					y: Math.max(12, Math.min(92, h)),
					placement: h > 72 ? 'below' : 'above',
					time: this.movePointTimes[this.activeMoveIndex] || '--:--',
					value: valueText
				};
			},
			heartCurveSegments() {
				return buildLineSegments(this.heartSmoothPoints);
			},
			breathCurveSegments() {
				return buildLineSegments(this.breathSmoothPoints);
			},
			heartSmoothPoints() {
				return catmullRomSpline(this.heartLinePoints, 6);
			},
			breathSmoothPoints() {
				return catmullRomSpline(this.breathLinePoints, 6);
			},
			heartExtremaMarkers() {
				const points = this.heartSmoothPoints;
				const values = this.heartValueSeries;
				if (!Array.isArray(points) || points.length < 2 || !Array.isArray(values) || !values.length) {
					return buildExtremaMarkers(this.heartLinePoints, (y) => mapPointToValue(y, 40, 120));
				}
				let maxValIdx = 0;
				let minValIdx = 0;
				for (let i = 1; i < values.length; i++) {
					if (Number(values[i]) > Number(values[maxValIdx])) maxValIdx = i;
					if (Number(values[i]) < Number(values[minValIdx])) minValIdx = i;
				}
				let maxPosIdx = 0;
				let minPosIdx = 0;
				for (let i = 1; i < points.length; i++) {
					if (Number(points[i].y) > Number(points[maxPosIdx].y)) maxPosIdx = i;
					if (Number(points[i].y) < Number(points[minPosIdx].y)) minPosIdx = i;
				}
				const markers = [
					{
						x: points[maxPosIdx].x || 0,
						y: points[maxPosIdx].y || 0,
						type: 'max',
						value: String(Math.round(Number(values[maxValIdx]) || 0))
					}
				];
				if (minPosIdx !== maxPosIdx) {
					markers.push({
						x: points[minPosIdx].x || 0,
						y: points[minPosIdx].y || 0,
						type: 'min',
						value: String(Math.round(Number(values[minValIdx]) || 0))
					});
				}
				return markers;
			},
			breathExtremaMarkers() {
				const points = this.breathSmoothPoints;
				const values = this.breathValueSeries;
				if (!Array.isArray(points) || points.length < 2 || !Array.isArray(values) || !values.length) {
					return buildExtremaMarkers(this.breathLinePoints, (y) => mapPointToValue(y, 8, 28));
				}
				let maxValIdx = 0;
				let minValIdx = 0;
				for (let i = 1; i < values.length; i++) {
					if (Number(values[i]) > Number(values[maxValIdx])) maxValIdx = i;
					if (Number(values[i]) < Number(values[minValIdx])) minValIdx = i;
				}
				let maxPosIdx = 0;
				let minPosIdx = 0;
				for (let i = 1; i < points.length; i++) {
					if (Number(points[i].y) > Number(points[maxPosIdx].y)) maxPosIdx = i;
					if (Number(points[i].y) < Number(points[minPosIdx].y)) minPosIdx = i;
				}
				const markers = [
					{
						x: points[maxPosIdx].x || 0,
						y: points[maxPosIdx].y || 0,
						type: 'max',
						value: String(Math.round(Number(values[maxValIdx]) || 0))
					}
				];
				if (minPosIdx !== maxPosIdx) {
					markers.push({
						x: points[minPosIdx].x || 0,
						y: points[minPosIdx].y || 0,
						type: 'min',
						value: String(Math.round(Number(values[minValIdx]) || 0))
					});
				}
				return markers;
			},
			currentQa() {
				if (Array.isArray(this.qaList) && this.qaList.length) {
					return this.qaList[this.qaIndex] || this.qaList[0];
				}
				return this.qa || { question: '', answer: '' };
			},
			sleepSplitItems() {
				return [
					{
						key: 'deep',
						label: '深睡',
						timeText: this.stageStats.deep || '--',
						flex: Math.max(0.1, Number(this.splitDeep) || 0.1),
						className: 'sleep-split-deep',
						textClass: 'is-light'
					},
					{
						key: 'light',
						label: '浅睡',
						timeText: this.stageStats.light || '--',
						flex: Math.max(0.1, Number(this.splitLight) || 0.1),
						className: 'sleep-split-light',
						textClass: 'is-light'
					},
					{
						key: 'awake',
						label: '清醒',
						timeText: this.stageStats.awake || '--',
						flex: Math.max(0.1, Number(this.splitAwake) || 0.1),
						className: 'sleep-split-awake',
						textClass: 'is-dark'
					},
					{
						key: 'offbed',
						label: '离床',
						timeText: this.stageStats.offbed || '--',
						flex: Math.max(0.1, Number(this.splitOffbed) || 0.1),
						className: 'sleep-split-offbed',
						textClass: 'is-light'
					}
				];
			}
		},
		watch: {
			reportDate() {
				this.loadReportForDate();
			}
		},
		onShow() {
			try {
				const openDate = uni.getStorageSync('sleepReportOpenDate');
				if (openDate && typeof openDate === 'string') {
					this.reportDate = openDate;
					uni.removeStorageSync('sleepReportOpenDate');
				}
			} catch (e) {}
			const curPages = getCurrentPages()[0];
			if (typeof curPages.getTabBar === 'function' && curPages.getTabBar()) {
				curPages.getTabBar().setData({ selected: 1 });
			}
			this.loadReportForDate();
		},
		methods: {
			resolveSoapMac() {
				const keys = ['wifi_device_mac', 'soap_device_mac', 'device_mac', 'wifiMac', 'mac'];
				for (let i = 0; i < keys.length; i++) {
					const v = uni.getStorageSync(keys[i]);
					if (typeof v === 'string' && v.trim()) {
						return v.trim();
					}
				}
				if (REPORT_DEBUG_FALLBACK_ENABLED && !isReleaseEnv()) {
					return REPORT_DEBUG_FALLBACK_MAC;
				}
				return '';
			},
			extractReportList(res) {
				if (!res) return [];
				const arr =
					(Array.isArray(res.data) && res.data) ||
					(res.data && Array.isArray(res.data.data) && res.data.data) ||
					(Array.isArray(res.records) && res.records) ||
					[];
				return Array.isArray(arr) ? arr : [];
			},
			matchReportByDate(list, ymd) {
				if (!Array.isArray(list) || !list.length) return null;
				const target = String(ymd || '');
				for (let i = 0; i < list.length; i++) {
					const it = list[i] || {};
					const endText = String(it.end_time || it.endSleepTime || '');
					const endDate = endText.slice(0, 10);
					if (endDate === target) {
						return it;
					}
				}
				return null;
			},
			applyEmptyReportView() {
				this.offBedText = '离床 0min';
				this.sleepRange = { start: '--:--', end: '--:--' };
				this.inBedHour = '0';
				this.inBedMin = '0';
				this.stageStats = {
					deep: '0.0 小时',
					light: '0.0 小时',
					awake: '0.0 小时',
					offbed: '0.0 小时'
				};
				this.splitDeep = 0.1;
				this.splitLight = 0.1;
				this.splitAwake = 0.1;
				this.splitOffbed = 0.1;
				this.vitalSummary = { hr: '--', rr: '--', move: '0' };
				this.sleepStageTimeline = [];
				this.heartLinePoints = [];
				this.breathLinePoints = [];
				this.moveBars = [];
				this.heartPointTimes = [];
				this.breathPointTimes = [];
				this.movePointTimes = [];
				this.heartValueSeries = [];
				this.breathValueSeries = [];
				this.moveValueSeries = [];
				this.activeHeartIndex = 0;
				this.activeBreathIndex = 0;
				this.activeMoveIndex = 0;
				this.heartTooltipVisible = false;
				this.breathTooltipVisible = false;
				this.moveTooltipVisible = false;
				this.diagnosisTags = [];
				this.diagnosisLines = ['当日暂无睡眠报告'];
				this.warmTips = [];
				this.qaList = [];
				this.qaIndex = 0;
				this.qa = { question: '当日暂无睡眠报告', answer: '' };
			},
			resolveReportId(reportItem) {
				if (!reportItem) return null;
				return (
					reportItem.report_id ||
					reportItem.reportId ||
					reportItem.id ||
					null
				);
			},
			parseTimeHHMM(input, fallback) {
				const s = String(input || '');
				const m = s.match(/(\d{2}):(\d{2})/);
				if (!m) return fallback;
				return `${m[1]}:${m[2]}`;
			},
			parseNumber(v, fallback = 0) {
				const n = Number(v);
				return Number.isFinite(n) ? n : fallback;
			},
			parseTextLines(text) {
				const s = String(text || '');
				if (!s) return [];
				return s
					.split(/\r?\n/)
					.map(v => String(v || '').trim())
					.filter(Boolean);
			},
			buildDiagnosisTags(tags) {
				if (!Array.isArray(tags) || !tags.length) {
					return [];
				}
				return tags
					.map((t, i) => {
						const text = String((t && (t.tag_text || t.text || t.tagText)) || '').trim();
						if (!text) return null;
						const tone = i === 0 ? 'tone-blue' : 'tone-warn';
						return { text, tone };
					})
					.filter(Boolean);
			},
			buildQuestionList(questions) {
				if (!Array.isArray(questions) || !questions.length) {
					return [];
				}
				return questions
					.map((q) => ({
						question: String((q && (q.question_text || q.question)) || '').trim(),
						answer: String((q && (q.questions_answer || q.answer)) || '').trim()
					}))
					.filter(item => item.question || item.answer);
			},
			pickBestSide(dataRoot) {
				const left = (dataRoot && dataRoot.left) || {};
				const right = (dataRoot && dataRoot.right) || {};
				const score = (side) => {
					let s = 0;
					if (this.parseNumber(side.sleep_score, 0) > 0) s += 2;
					if (this.parseNumber(side.sleep_duration, 0) > 0) s += 2;
					if (this.parseNumber(side.heart_rate, 0) > 0) s += 1;
					if (this.parseNumber(side.breath_rate ?? side.respiration_rate, 0) > 0) s += 1;
					if (Array.isArray(side.sleep_report) && side.sleep_report.length) s += 2;
					return s;
				};
				return score(left) >= score(right) ? left : right;
			},
			normalizeWaveToPoints(wave) {
				if (!Array.isArray(wave) || wave.length < 2) return [];
				const nums = wave.map(v => Number(v)).filter(v => Number.isFinite(v));
				if (nums.length < 2) return [];
				let min = nums[0];
				let max = nums[0];
				for (let i = 1; i < nums.length; i++) {
					if (nums[i] < min) min = nums[i];
					if (nums[i] > max) max = nums[i];
				}
				const span = Math.max(1, max - min);
				return nums.map((v, i) => ({
					x: (i / Math.max(1, nums.length - 1)) * 92 + 4,
					y: Math.max(12, Math.min(88, ((v - min) / span) * 76 + 12))
				}));
			},
			buildStageFromReport(sleepReport) {
				if (!Array.isArray(sleepReport) || !sleepReport.length) {
					return buildSleepStageTimeline();
				}
				const stageMap = {
					1: 'deep', // 深睡
					2: 'light', // REM 先并入浅睡
					3: 'light', // 浅睡
					4: 'wake', // 清醒
					5: 'offbed', // 离床单独展示
					offbed: 'offbed',
					wake: 'wake',
					awake: 'wake',
					light: 'light',
					deep: 'deep'
				};
				const normalized = [];
				for (let i = 0; i < sleepReport.length; i++) {
					const item = sleepReport[i];
					const code = item && (item.state ?? item.stage ?? item.sleep_state ?? item.status ?? item.type);
					const stage = stageMap[code];
					if (!stage) continue;
					const dur = this.parseNumber(item && item.value, 0);
					normalized.push({
						stage,
						duration: dur > 0 ? dur : 0
					});
				}
				if (!normalized.length) return buildSleepStageTimeline();
				const totalDur = normalized.reduce((sum, it) => sum + (it.duration > 0 ? it.duration : 0), 0);
				if (totalDur > 0) {
					let acc = 0;
					const out = [];
					for (let i = 0; i < normalized.length; i++) {
						const it = normalized[i];
						const start = (acc / totalDur) * 100;
						acc += Math.max(0, it.duration);
						const end = (acc / totalDur) * 100;
						out.push({
							start: Number(start.toFixed(3)),
							end: Number(end.toFixed(3)),
							stage: it.stage
						});
					}
					// 末段强制贴齐 100，避免浮点误差出现缝隙
					if (out.length) out[out.length - 1].end = 100;
					return out;
				}
				// 若无有效时长，退回等分
				const size = 100 / normalized.length;
				return normalized.map((it, i) => ({
					start: Number((i * size).toFixed(3)),
					end: Number(((i + 1) * size).toFixed(3)),
					stage: it.stage
				}));
			},
			sumStageMinutesFromReport(sleepReport) {
				const sums = { deep: 0, rem: 0, light: 0, awake: 0, offbed: 0 };
				if (!Array.isArray(sleepReport) || !sleepReport.length) return sums;
				const stageKeyMap = {
					1: 'deep',
					2: 'rem',
					3: 'light',
					4: 'awake',
					5: 'offbed'
				};
				for (let i = 0; i < sleepReport.length; i++) {
					const it = sleepReport[i] || {};
					const code = it.state ?? it.stage ?? it.sleep_state ?? it.status ?? it.type;
					const key = stageKeyMap[code];
					if (!key) continue;
					const dur = this.parseNumber(it.value, 0);
					if (dur > 0) sums[key] += dur;
				}
				return sums;
			},
			applyReportToView(reportItem, detailRes) {
				const root = (detailRes && detailRes.data) || detailRes || {};
				const side = this.pickBestSide(root);
				const startText = reportItem?.start_time || side.start_sleep_time || root.start_sleep_time || '';
				const endText = reportItem?.end_time || side.end_sleep_time || root.end_sleep_time || '';
				const sleepStart = this.parseTimeHHMM(startText, this.sleepRange.start);
				const sleepEnd = this.parseTimeHHMM(endText, this.sleepRange.end);
				this.sleepRange = { start: sleepStart, end: sleepEnd };

				const bedDuration = this.parseNumber(side.bed_duration ?? root.bed_duration, 0);
				const bedMins = bedDuration > 24 * 60 ? Math.round(bedDuration / 60) : Math.round(bedDuration);
				const h = Math.max(0, Math.floor(bedMins / 60));
				const m = Math.max(0, bedMins % 60);
				this.inBedHour = String(h);
				this.inBedMin = String(m);

				const sleepReport = side.sleep_report || root.sleep_report || [];
				const stageMins = this.sumStageMinutesFromReport(sleepReport);
				const deepFromStage = this.parseNumber(stageMins.deep, 0);
				const remFromStage = this.parseNumber(stageMins.rem, 0);
				const lightFromStage = this.parseNumber(stageMins.light, 0);
				const awakeFromStage = this.parseNumber(stageMins.awake, 0);
				const offBedFromStage = this.parseNumber(stageMins.offbed, 0);

				const deepField = this.parseNumber(side.deep_sleep_duration ?? root.deep_sleep_duration, 0);
				// 不支持 REM：将 rem_sleep_duration 并入浅睡展示
				const lightField = this.parseNumber(side.light_sleep_duration ?? root.light_sleep_duration, 0);
				const remField = this.parseNumber(side.rem_sleep_duration ?? root.rem_sleep_duration, 0);
				const awakeField = this.parseNumber(side.awake_duration ?? root.awake_duration, 0);

				const deepMin = deepFromStage > 0 ? deepFromStage : deepField;
				const lightBaseMin = lightFromStage > 0 ? lightFromStage : lightField;
				const remMin = remFromStage > 0 ? remFromStage : remField;
				const lightMin = lightBaseMin + remMin;
				const awakeMin = awakeFromStage > 0 ? awakeFromStage : awakeField;
				this.stageStats = {
					deep: `${(deepMin / 60).toFixed(1)} 小时`,
					light: `${(lightMin / 60).toFixed(1)} 小时`,
					awake: `${(awakeMin / 60).toFixed(1)} 小时`,
					offbed: `${(offBedFromStage / 60).toFixed(1)} 小时`
				};
				this.splitDeep = Math.max(0.1, deepMin);
				this.splitLight = Math.max(0.1, lightMin);
				this.splitAwake = Math.max(0.1, awakeMin);
				this.splitOffbed = Math.max(0.1, offBedFromStage);

				const offBedMinutes = offBedFromStage;
				this.offBedText = `离床 ${Math.max(0, Math.round(offBedMinutes))}min`;

				const hr = this.parseNumber(side.heart_rate ?? root.heart_rate, 0);
				const rr = this.parseNumber(side.breath_rate ?? side.respiration_rate ?? root.breath_rate ?? root.respiration_rate, 0);
				const mv = this.parseNumber(side.turn_count ?? side.turnover_count ?? side.turn_over_count ?? root.turn_count ?? root.turnover_count ?? 0, 0);
				this.vitalSummary = {
					hr: hr > 0 ? String(hr) : '--',
					rr: rr > 0 ? String(rr) : '--',
					move: String(Math.max(0, Math.round(mv)))
				};

				this.sleepStageTimeline = this.buildStageFromReport(sleepReport);

				// 按 pillow 项目趋势数据提取方式：other_data.heartrate / breathrate / turn
				const otherData = (side && side.other_data) || (root && root.other_data) || {};
				const heartWave = otherData.heartrate || side.heart_rate_wave || root.heart_rate_wave || [];
				const breathWave = otherData.breathrate || side.respiratory_wave || side.breath_rate_wave || root.respiratory_wave || [];
				const heartNums = Array.isArray(heartWave)
					? heartWave.map(v => Number(v)).filter(v => Number.isFinite(v))
					: [];
				const breathNums = Array.isArray(breathWave)
					? breathWave.map(v => Number(v)).filter(v => Number.isFinite(v))
					: [];
				const heartPts = this.normalizeWaveToPoints(heartNums);
				const breathPts = this.normalizeWaveToPoints(breathNums);
				if (heartPts.length && heartNums.length === heartPts.length) {
					this.heartValueSeries = heartNums;
					this.heartLinePoints = heartPts.map(p => ({ ...p, high: p.y > 76, low: p.y < 24 }));
				}
				if (breathPts.length && breathNums.length === breathPts.length) {
					this.breathValueSeries = breathNums;
					this.breathLinePoints = breathPts;
				}
				this.heartPointTimes = buildTimeSlots(sleepStart, sleepEnd, this.heartLinePoints.length);
				this.breathPointTimes = buildTimeSlots(sleepStart, sleepEnd, this.breathLinePoints.length);
				this.activeHeartIndex = Math.floor(this.heartLinePoints.length / 2);
				this.activeBreathIndex = Math.floor(this.breathLinePoints.length / 2);

				const moveWave = otherData.turn || side.turn_over_wave || side.body_movement_wave || root.turn_over_wave || root.body_movement_wave || [];
				if (Array.isArray(moveWave) && moveWave.length > 2) {
					const nums = moveWave.map(v => this.parseNumber(v, 0));
					let max = 1;
					for (let i = 0; i < nums.length; i++) {
						if (nums[i] > max) max = nums[i];
					}
					this.moveValueSeries = nums;
					this.moveBars = nums.map(v => Math.max(8, Math.min(92, (v / max) * 92)));
					this.movePointTimes = buildTimeSlots(sleepStart, sleepEnd, this.moveBars.length);
					this.activeMoveIndex = Math.floor(this.moveBars.length / 2);
				}

				const tags = side.sleep_assessment_tags || root.sleep_assessment_tags || [];
				const assessText = side.sleep_assessment || root.sleep_assessment || '';
				const advice = side.advice || root.advice || [];
				const questions = side.questions || root.questions || [];
				this.diagnosisTags = this.buildDiagnosisTags(tags);
				this.diagnosisLines = this.parseTextLines(assessText);
				this.warmTips = Array.isArray(advice) ? advice.map(v => String(v || '').trim()).filter(Boolean) : [];
				const qaList = this.buildQuestionList(questions);
				if (qaList.length) {
					this.qaList = qaList;
					this.qaIndex = 0;
					this.qa = qaList[0];
				}
			},
			prevQa() {
				if (!Array.isArray(this.qaList) || this.qaList.length <= 1) return;
				this.qaIndex = Math.max(0, this.qaIndex - 1);
			},
			nextQa() {
				if (!Array.isArray(this.qaList) || this.qaList.length <= 1) return;
				this.qaIndex = Math.min(this.qaList.length - 1, this.qaIndex + 1);
			},
			async loadReportForDate() {
				const mac = this.resolveSoapMac();
				this.soapDeviceMac = mac;
				if (!mac || this.reportLoading) {
					return;
				}
				this.reportLoading = true;
				try {
					const d = parseYMD(this.reportDate);
					const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
					const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
					const listRes = await soapDeviceApi.getSleepReportList({
						mac,
						start_date: formatYMD(prev),
						end_date: formatYMD(next)
					});
					const list = this.extractReportList(listRes);
					const hit = this.matchReportByDate(list, this.reportDate);
					const reportId = this.resolveReportId(hit);
					if (!reportId) {
						this.applyEmptyReportView();
						uni.showModal({
							title: '提示',
							content: '当日暂无睡眠报告',
							showCancel: false
						});
						return;
					}
					const detailRes = await soapDeviceApi.getSleepReportDetail({ report_id: reportId });
					this.applyReportToView(hit, detailRes);
				} catch (err) {
					console.warn('[report] loadReportForDate failed:', err);
				} finally {
					this.reportLoading = false;
				}
			},
			openCalendar() {
				const d = parseYMD(this.reportDate);
				this.viewMonth = new Date(d.getFullYear(), d.getMonth(), 1);
				this.showCalendar = true;
			},
			closeCalendar() {
				this.showCalendar = false;
			},
			prevMonthCal() {
				if (!this.canPrevMonthCal || !this.viewMonth) return;
				const y = this.viewMonth.getFullYear();
				const m = this.viewMonth.getMonth();
				this.viewMonth = new Date(y, m - 1, 1);
			},
			nextMonthCal() {
				if (!this.canNextMonthCal || !this.viewMonth) return;
				const y = this.viewMonth.getFullYear();
				const m = this.viewMonth.getMonth();
				this.viewMonth = new Date(y, m + 1, 1);
			},
			onCalendarCellClick(c) {
				if (!c || c.type !== 'day' || c.disabled || !c.ymd) return;
				this.reportDate = c.ymd;
				this.closeCalendar();
			},
			prevDay() {
				const d = parseYMD(this.reportDate);
				d.setDate(d.getDate() - 1);
				const start = parseYMD(this.pickerStart);
				if (d < start) {
					uni.showToast({ title: '超出可选范围', icon: 'none' });
					return;
				}
				this.reportDate = formatYMD(d);
			},
			nextDay() {
				const d = parseYMD(this.reportDate);
				d.setDate(d.getDate() + 1);
				const end = todayDateOnly();
				if (d > end) {
					uni.showToast({ title: '已是今天', icon: 'none' });
					return;
				}
				this.reportDate = formatYMD(d);
			},
			hypnoHbarStyle(seg) {
				return {
					left: seg.start + '%',
					width: seg.end - seg.start + '%',
					top: hypnoBandTopPct(seg.stage) + '%'
				};
			},
			onLineTouch(e, type) {
				const touch = (e && e.touches && e.touches[0]) || (e && e.changedTouches && e.changedTouches[0]);
				if (!touch) return;
				const plotId = type === 'breath' ? '#breath-plot' : type === 'move' ? '#move-plot' : '#heart-plot';
				const query = uni.createSelectorQuery().in(this);
				query
					.select(plotId)
					.boundingClientRect(rect => {
						if (!rect || !rect.width) return;
						const x = Math.max(rect.left, Math.min(rect.left + rect.width, touch.clientX));
						const ratio = (x - rect.left) / rect.width;
						const points =
							type === 'breath'
								? this.breathLinePoints
								: type === 'move'
									? this.moveBars
									: this.heartLinePoints;
						if (!points || !points.length) return;
						const idx = Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1))));
						if (type === 'breath') {
							this.activeBreathIndex = idx;
							this.breathTooltipVisible = true;
						} else if (type === 'move') {
							this.activeMoveIndex = idx;
							this.moveTooltipVisible = true;
						} else {
							this.activeHeartIndex = idx;
							this.heartTooltipVisible = true;
						}
					})
					.exec();
			}
		}
	};
</script>

<style lang="scss" scoped>
	.report-page {
		min-height: 100vh;
		height: 100vh;
		background-color: #e8eef2;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.report-scroll {
		flex: 1;
		height: 0;
		padding: 0 28rpx;
		padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.page-inner {
		padding-top: 20rpx;
	}

	/* 日期条 */
	.date-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18rpx 8rpx;
		margin-bottom: 20rpx;
		background-color: #fff;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(15, 23, 42, 0.06);
	}

	.date-arrow {
		width: 88rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.date-arrow-hover {
		opacity: 0.65;
	}

	.date-arrow-img {
		width: 36rpx;
		height: 36rpx;
	}

	.date-picker-center {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.date-value-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 72rpx;
		padding: 0 16rpx;
	}

	.date-value {
		font-size: 30rpx;
		color: #1e293b;
		font-weight: 500;
		letter-spacing: 1rpx;
	}

	.card {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 2rpx 12rpx rgba(15, 23, 42, 0.06);
	}

	/* 睡眠结构时序：与报告页 #e8eef2 / 白卡 / 灰蓝 统一 */
	.hypno-card {
		padding: 0;
		overflow: hidden;
	}

	.hypno-top-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx 20rpx;
		background-color: #f1f5f9;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.hypno-top-placeholder {
		flex: 1;
	}

	.hypno-offbed-hint {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.hypno-offbed-ico {
		width: 28rpx;
		height: 28rpx;
		margin-right: 8rpx;
	}

	.hypno-offbed-txt {
		font-size: 24rpx;
		color: #475569;
	}

	.hypno-chart-wrap {
		background-color: #faf8fc;
		padding: 16rpx 12rpx 12rpx;
	}

	/* 阶梯式 Hypnogram：单图区 + 三阶段纵轴 */
	.hypno-step-layout {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		min-height: 300rpx;
	}

	.hypno-y-labels {
		width: 100rpx;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 8rpx 6rpx 8rpx 0;
		box-sizing: border-box;
	}

	.hypno-y-label {
		font-size: 22rpx;
		color: #64748b;
		line-height: 1.2;
		text-align: right;
	}

	.hypno-plot-frame {
		flex: 1;
		min-width: 0;
		position: relative;
		border: 1rpx solid #93c5fd;
		border-radius: 16rpx;
		background: linear-gradient(180deg, #fdf2f2 0%, #f5e6ff 50%, #ede3f7 100%);
		overflow: hidden;
		box-sizing: border-box;
	}

	.hypno-grid-lines {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 0;
	}

	.hypno-dash {
		position: absolute;
		left: 0;
		right: 0;
		height: 0;
		border-top: 1rpx dashed rgba(148, 163, 184, 0.55);
	}

	.hypno-dash-1 {
		top: 25%;
	}

	.hypno-dash-2 {
		top: 50%;
	}

	.hypno-dash-3 {
		top: 75%;
	}

	.hypno-plot-inner {
		position: relative;
		width: 100%;
		height: 300rpx;
		z-index: 1;
	}

	.hypno-vline {
		position: absolute;
		width: 2rpx;
		margin-left: -2rpx;
		border-radius: 2rpx;
		background: linear-gradient(180deg, rgba(196, 120, 106, 0.85), rgba(107, 76, 154, 0.85));
		box-shadow: 0 0 6rpx rgba(139, 92, 246, 0.35);
		z-index: 1;
	}

	.hypno-hbar {
		position: absolute;
		height: 25%;
		box-sizing: border-box;
		border-radius: 14rpx;
		min-width: 4rpx;
		z-index: 2;
		box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.08);
	}

	.hypno-hbar-offbed {
		background: linear-gradient(180deg, #94a3b8 0%, #64748b 55%, #475569 100%);
	}

	.hypno-hbar-wake {
		background: linear-gradient(180deg, #c97b6e 0%, #d9a399 55%, #e8bdb5 100%);
	}

	.hypno-hbar-light {
		background: linear-gradient(180deg, #e879a9 0%, #c084fc 45%, #a78bfa 100%);
	}

	.hypno-hbar-deep {
		background: linear-gradient(180deg, #7c3aed 0%, #5b21b6 55%, #4c1d95 100%);
	}

	.hypno-time-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 14rpx 20rpx 18rpx;
		background-color: #f1f5f9;
		border-top: 1rpx solid #e2e8f0;
	}

	.hypno-time {
		font-size: 24rpx;
		color: #64748b;
	}

	.summary-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.summary-main {
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: baseline;
		flex-wrap: wrap;
	}

	.summary-label {
		font-size: 26rpx;
		color: #64748b;
		margin-right: 8rpx;
	}

	.summary-num {
		font-size: 44rpx;
		font-weight: 600;
		color: #0f172a;
		margin: 0 4rpx;
	}

	.summary-unit {
		font-size: 26rpx;
		color: #475569;
		margin-right: 12rpx;
	}

	.sleep-split-bar {
		display: flex;
		flex-direction: row;
		height: 56rpx;
		border-radius: 12rpx;
		overflow: hidden;
		margin-bottom: 8rpx;
	}

	.sleep-split-part {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		padding: 0 8rpx;
	}

	.sleep-split-deep {
		background: linear-gradient(180deg, #7c3aed 0%, #5b21b6 55%, #4c1d95 100%);
	}

	.sleep-split-light {
		background: linear-gradient(180deg, #e879a9 0%, #c084fc 45%, #a78bfa 100%);
	}

	.sleep-split-awake {
		background: linear-gradient(180deg, #c97b6e 0%, #d9a399 55%, #e8bdb5 100%);
	}

	.sleep-split-offbed {
		background: linear-gradient(180deg, #94a3b8 0%, #64748b 55%, #475569 100%);
	}

	.sleep-split-meta-scroll {
		width: 100%;
		margin-bottom: 24rpx;
	}

	.sleep-split-meta-inner {
		min-width: 100%;
		display: flex;
		flex-direction: column;
	}

	.sleep-split-labels-row,
	.sleep-split-times-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.sleep-split-labels-row {
		margin-bottom: 4rpx;
	}

	.sleep-split-meta-cell {
		min-width: 92rpx;
		display: flex;
		justify-content: center;
		padding: 0 6rpx;
		box-sizing: border-box;
	}

	.sleep-split-label-meta {
		font-size: 22rpx;
		line-height: 1.2;
		text-align: center;
		color: #334155;
		white-space: nowrap;
	}

	.sleep-split-time {
		font-size: 20rpx;
		line-height: 1.2;
		text-align: center;
		color: #475569;
		white-space: nowrap;
	}

	.metrics-strip {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		padding: 28rpx 16rpx;
	}

	.metric-cell {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}

	.metric-ico {
		width: 48rpx;
		height: 48rpx;
		margin-bottom: 12rpx;
	}

	.metric-title {
		font-size: 22rpx;
		color: #64748b;
		margin-bottom: 8rpx;
		text-align: center;
	}

	.metric-val {
		font-size: 30rpx;
		font-weight: 600;
		color: #1e293b;
	}

	.metric-unit {
		font-size: 22rpx;
		color: #94a3b8;
		font-weight: 400;
	}

	.metric-divider {
		width: 1rpx;
		background: rgba(148, 163, 184, 0.35);
		margin: 8rpx 0;
	}

	.assess-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.assess-ico {
		width: 40rpx;
		height: 40rpx;
		margin-right: 12rpx;
	}

	.assess-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #1e293b;
	}

	.assess-timeline {
		padding-left: 8rpx;
	}

	.assess-time-node {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		position: relative;
		padding-left: 24rpx;
		border-left: 2rpx solid #cbd5e1;
		padding-bottom: 8rpx;
	}

	.assess-time-label {
		font-size: 28rpx;
		color: #0f172a;
		font-weight: 600;
	}

	.assess-time-arrow {
		width: 0;
		height: 0;
		border-left: 10rpx solid transparent;
		border-right: 10rpx solid transparent;
		border-top: 12rpx solid #64748b;
		margin: 8rpx 0;
	}

	.assess-time-desc {
		font-size: 24rpx;
		color: #64748b;
	}

	.chart-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.chart-head-ico {
		width: 40rpx;
		height: 40rpx;
		margin-right: 12rpx;
	}

	.chart-head-title {
		flex: 1;
		font-size: 28rpx;
		color: #1e293b;
		font-weight: 500;
	}

	.chart-head-right {
		display: flex;
		flex-direction: row;
		align-items: baseline;
	}

	.chart-head-val {
		font-size: 36rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.chart-head-unit {
		font-size: 22rpx;
		color: #64748b;
		margin-left: 6rpx;
	}

	.chart-body {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		min-height: 220rpx;
		position: relative;
	}

	.chart-body-bars {
		min-height: 200rpx;
	}

	.chart-y-labels {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 48rpx;
		padding-right: 8rpx;
	}

	.chart-y-t {
		font-size: 20rpx;
		color: #64748b;
		text-align: right;
	}

	.chart-plot {
		flex: 1;
		position: relative;
		min-height: 200rpx;
		border-left: 1rpx solid rgba(148, 163, 184, 0.2);
		border-bottom: 1rpx solid rgba(148, 163, 184, 0.2);
	}

	.chart-grid-h {
		position: absolute;
		left: 0;
		right: 0;
		height: 1rpx;
		background: rgba(148, 163, 184, 0.12);
	}

	.chart-grid-h:nth-child(1) {
		top: 25%;
	}
	.chart-grid-h:nth-child(2) {
		top: 50%;
	}
	.chart-grid-h:nth-child(3) {
		top: 75%;
	}

	.chart-line-segs {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 1;
	}

	.chart-line-seg {
		position: absolute;
		height: 2rpx;
		background: #60a5fa;
		border-radius: 999rpx;
		transform-origin: left center;
		opacity: 0.95;
	}

	.chart-line-seg-breath {
		background: #38bdf8;
	}

	.chart-line-dots {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		pointer-events: none;
		opacity: 0.45;
		z-index: 2;
	}

	.chart-extrema {
		position: absolute;
		transform: translate(-50%, 50%);
		z-index: 4;
	}

	.chart-extrema::before {
		content: '';
		display: block;
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
	}

	.chart-extrema.is-max::before {
		background: #facc15;
		box-shadow: 0 0 0 4rpx rgba(250, 204, 21, 0.28), 0 0 10rpx rgba(250, 204, 21, 0.45);
	}

	.chart-extrema.is-min::before {
		background: #7dd3fc;
		box-shadow: 0 0 0 4rpx rgba(125, 211, 252, 0.28), 0 0 10rpx rgba(56, 189, 248, 0.45);
	}

	.chart-extrema-label {
		position: absolute;
		left: 20rpx;
		top: 50%;
		transform: translateY(-50%);
		font-size: 22rpx;
		line-height: 1;
		font-weight: 600;
		white-space: nowrap;
	}

	.chart-extrema.is-max .chart-extrema-label {
		color: #eab308;
	}

	.chart-extrema.is-min .chart-extrema-label {
		color: #38bdf8;
	}

	.chart-dot {
		position: absolute;
		width: 10rpx;
		height: 10rpx;
		margin-left: -5rpx;
		margin-bottom: -5rpx;
		border-radius: 50%;
		background: #60a5fa;
	}
	.chart-dot.is-high {
		background: #fbbf24;
		width: 12rpx;
		height: 12rpx;
		margin-left: -6rpx;
		margin-bottom: -6rpx;
	}
	.chart-dot.is-low {
		background: #7dd3fc;
	}
	.chart-dot-breath {
		background: #38bdf8;
	}

	.chart-tooltip {
		position: absolute;
		transform: translate(-50%, -100%);
		margin-bottom: 8rpx;
		background: rgba(15, 23, 42, 0.92);
		padding: 8rpx 16rpx;
		border-radius: 8rpx;
		z-index: 6;
		pointer-events: none;
	}
	.chart-tooltip--below {
		transform: translate(-50%, 120%);
		margin-bottom: 0;
	}
	.chart-tooltip-txt {
		font-size: 22rpx;
		color: #e2e8f0;
		white-space: nowrap;
	}

	.chart-flags {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 48rpx;
		padding-left: 8rpx;
	}
	.chart-flag {
		font-size: 20rpx;
		color: #64748b;
	}

	.chart-bars-wrap {
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		min-height: 200rpx;
		padding: 8rpx 4rpx 0;
		border-left: 1rpx solid rgba(148, 163, 184, 0.2);
		border-bottom: 1rpx solid rgba(148, 163, 184, 0.2);
	}
	.chart-bar-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		height: 100%;
		padding: 0 1rpx;
	}
	.chart-bar-fill {
		width: 100%;
		background: linear-gradient(180deg, #7dd3fc, #38bdf8);
		border-radius: 4rpx 4rpx 0 0;
		min-height: 4rpx;
	}

	.chart-footer-ico {
		display: flex;
		justify-content: center;
		padding-top: 16rpx;
	}
	.chart-expand-ico {
		width: 28rpx;
		height: 28rpx;
		opacity: 0.45;
	}

	.section-block {
		margin-bottom: 36rpx;
		padding: 0 8rpx;
	}
	.section-block-last {
		margin-bottom: 48rpx;
	}

	.section-title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 20rpx;
	}
	.section-ico {
		width: 36rpx;
		height: 36rpx;
		margin-right: 12rpx;
	}
	.section-title {
		font-size: 28rpx;
		color: #5b7897;
		font-weight: 500;
	}

	.tag-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-bottom: 20rpx;
	}
	.diag-tag {
		font-size: 24rpx;
		padding: 8rpx 18rpx;
		border-radius: 8rpx;
	}
	.tone-blue {
		background: #eff6ff;
		color: #2563eb;
	}
	.tone-warn {
		background: #fef9c3;
		color: #a16207;
	}

	.bullet-list {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}
	.bullet-item {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}
	.bullet-dot {
		font-size: 28rpx;
		color: #64748b;
		margin-right: 12rpx;
		line-height: 1.5;
	}
	.bullet-txt {
		flex: 1;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.55;
	}

	.qa-q {
		display: block;
		font-size: 28rpx;
		color: #2563eb;
		margin-bottom: 16rpx;
		line-height: 1.5;
	}
	.qa-switch-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12rpx;
	}
	.qa-switch-btn {
		font-size: 22rpx;
		color: #2563eb;
		padding: 6rpx 10rpx;
	}
	.qa-switch-btn.disabled {
		color: #94a3b8;
	}
	.qa-switch-indicator {
		font-size: 22rpx;
		color: #64748b;
	}
	.qa-a {
		display: block;
		font-size: 26rpx;
		color: #64748b;
		line-height: 1.55;
	}

	.cal-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.55);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48rpx 40rpx;
		box-sizing: border-box;
	}
	.cal-panel {
		width: 100%;
		max-width: 640rpx;
		background: #fff;
		border-radius: 24rpx;
		padding: 28rpx 24rpx 32rpx;
		box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.12);
	}
	.cal-panel-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24rpx;
		padding: 0 8rpx;
	}
	.cal-month-arrow {
		width: 72rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cal-month-arrow.disabled {
		opacity: 0.25;
		pointer-events: none;
	}
	.cal-month-arrow-img {
		width: 32rpx;
		height: 32rpx;
	}
	.cal-month-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #1e293b;
	}
	.cal-weekdays {
		display: flex;
		flex-direction: row;
		margin-bottom: 12rpx;
	}
	.cal-weekday {
		flex: 1;
		text-align: center;
		font-size: 24rpx;
		color: #64748b;
	}
	.cal-grid {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}
	.cal-cell {
		width: 14.2857%;
		height: 76rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		padding: 4rpx;
	}
	.cal-cell.is-empty {
		pointer-events: none;
	}
	.cal-day-num {
		width: 64rpx;
		height: 64rpx;
		line-height: 64rpx;
		text-align: center;
		font-size: 28rpx;
		color: #334155;
		border-radius: 50%;
	}
	.cal-cell.is-today .cal-day-num {
		color: #2563eb;
		font-weight: 600;
		border: 2rpx solid #3b82f6;
		box-sizing: border-box;
		line-height: 60rpx;
	}
	.cal-cell.is-selected .cal-day-num {
		background: linear-gradient(135deg, #5794d2, #607796);
		color: #fff;
		border: none;
		line-height: 64rpx;
	}
	.cal-cell.is-selected.is-today .cal-day-num {
		border: none;
		line-height: 64rpx;
	}
	.cal-cell.is-disabled .cal-day-num {
		color: #cbd5e1;
	}
</style>
