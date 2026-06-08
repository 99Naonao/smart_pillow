<template>
	<view class="list-page">
		<z-nav-bar
			bg-color="#F0F6F7"
			title="睡眠报告"
			font-color="#051C2C"
			:shadow="true"
			backState="1000"
			bgColorAngle="90"
		/>

		<view class="filter-bar">
			<view
				v-for="opt in filterOptions"
				:key="opt.days"
				class="filter-chip"
				:class="{ active: filterDays === opt.days }"
				@click="onFilterChange(opt.days)"
			>
				<text class="filter-text">{{ opt.label }}</text>
			</view>
		</view>

		<scroll-view scroll-y class="list-scroll" :show-scrollbar="false">
			<view v-if="displayList.length === 0" class="empty-wrap">
				<text class="empty-text">该时间范围内暂无睡眠报告</text>
			</view>
			<view
				v-for="item in displayList"
				:key="item.id"
				class="report-card"
				@click="openReportDetail(item)"
			>
				<view class="report-row">
					<text class="report-label">睡眠评分</text>
					<text class="report-score">{{ item.score }}</text>
				</view>
				<view class="report-row sub">
					<text class="time-label">时间</text>
					<text class="time-val">{{ formatTime(item.reportTime) }}</text>
				</view>
				<text class="report-hint">点击查看当日详细报告 ›</text>
			</view>
			<view class="list-footer-space" />
		</scroll-view>
	</view>
</template>

<script>
	import {
		filterReportsByRecentDays,
		formatReportDateTime
	} from '@/common/sleepReportStorage.js';
	import soapDeviceApi from '@/utils/soapDeviceApi.js';
	import { WifiToolManager } from '@/utils/BlueUtils';
	/** 本地联调兜底开关：仅非正式环境（develop/trial）生效。 */
	const REPORT_LIST_DEBUG_FALLBACK_ENABLED = true;
	const REPORT_LIST_DEBUG_FALLBACK_MAC = 'B4:C2:E0:F5:A7:5D';

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

	export default {
		data() {
			return {
				allList: [],
				loading: false,
				soapDeviceMac: '',
				filterDays: 1,
				filterOptions: [
					{ days: 1, label: '当天' },
					{ days: 3, label: '三天内' },
					{ days: 7, label: '一周内' }
				]
			};
		},
		computed: {
			displayList() {
				return filterReportsByRecentDays(this.allList, this.filterDays);
			}
		},
		onShow() {
			this.loadReportsFromApi(this.filterDays);
		},
		methods: {
			onFilterChange(days) {
				const n = Number(days);
				if (!Number.isFinite(n) || n <= 0) return;
				if (this.filterDays === n) return;
				this.filterDays = n;
				this.loadReportsFromApi(n);
			},
			formatTime(ts) {
				return formatReportDateTime(ts);
			},
			resolveSoapMac() {
				const mac = WifiToolManager.resolveWifiDeviceMac();
				if (mac) {
					return mac;
				}
				if (REPORT_LIST_DEBUG_FALLBACK_ENABLED && !isReleaseEnv()) {
					return REPORT_LIST_DEBUG_FALLBACK_MAC;
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
			parseTs(v) {
				if (typeof v === 'number' && Number.isFinite(v)) return v;
				const s = String(v || '').trim();
				if (!s) return 0;
				if (/^\d+$/.test(s)) {
					const n = Number(s);
					return Number.isFinite(n) ? n : 0;
				}
				const t = new Date(s.replace(/-/g, '/')).getTime();
				return Number.isFinite(t) ? t : 0;
			},
			formatYmdFromTs(ts) {
				const d = new Date(ts);
				if (!Number.isFinite(d.getTime())) return '';
				const p = (n) => (n < 10 ? '0' + n : String(n));
				return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
			},
			normalizeReportItem(item, idx) {
				const reportId = item.report_id || item.reportId || item.id || '';
				const scoreNum = Number(item.sleep_score ?? item.score);
				const score = Number.isFinite(scoreNum) ? Math.round(scoreNum) : '--';
				const timeCandidate =
					item.end_time ||
					item.report_time ||
					item.create_time ||
					item.endSleepTime ||
					item.date ||
					'';
				let reportTime = this.parseTs(timeCandidate);
				if (!reportTime) {
					// 兜底用当日 00:00，避免记录被过滤丢失
					const dateOnly = String(item.date || '').replace(/[年月]/g, '-').replace(/日/g, '').trim();
					reportTime = this.parseTs(dateOnly ? `${dateOnly} 00:00:00` : 0);
				}
				const reportDateYmd = this.formatYmdFromTs(reportTime);
				return {
					id: String(reportId || `${reportDateYmd || 'report'}-${idx}`),
					reportId,
					score,
					reportTime,
					reportDateYmd,
					raw: item
				};
			},
			async loadReportsFromApi(days = this.filterDays) {
				const mac = this.resolveSoapMac();
				this.soapDeviceMac = mac;
				if (!mac || this.loading) {
					this.allList = [];
					return;
				}
				this.loading = true;
				try {
					const queryDays = Math.max(1, Math.min(7, Number(days) || 1));
					const today = new Date();
					const endInclusive = new Date(today.getFullYear(), today.getMonth(), today.getDate());
					// 日志验证：接口 end_date 为右开区间（不包含 end_date 当天），故这里 +1 天。
					const endExclusive = new Date(
						endInclusive.getFullYear(),
						endInclusive.getMonth(),
						endInclusive.getDate() + 1
					);
					// 当天=今天；三天内=今天及前2天；一周内=今天及前6天。
					const start = new Date(
						endInclusive.getFullYear(),
						endInclusive.getMonth(),
						endInclusive.getDate() - (queryDays - 1)
					);
					const p = (n) => (n < 10 ? '0' + n : String(n));
					const toYmd = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
					const res = await soapDeviceApi.getSleepReportList({
						mac,
						start_date: toYmd(start),
						end_date: toYmd(endExclusive)
					});
					const list = this.extractReportList(res)
						.map((item, idx) => this.normalizeReportItem(item, idx))
						.filter((it) => Number(it.reportTime) > 0)
						.sort((a, b) => Number(b.reportTime) - Number(a.reportTime));
					this.allList = list;
				} catch (err) {
					console.warn('[sleepReportList] loadReportsFromApi failed:', err);
					this.allList = [];
					uni.showToast({ title: '报告列表加载失败', icon: 'none' });
				} finally {
					this.loading = false;
				}
			},
			openReportDetail(item) {
				const ymd = item && item.reportDateYmd;
				if (!ymd) {
					return;
				}
				try {
					uni.setStorageSync('sleepReportOpenDate', ymd);
				} catch (e) {}
				uni.switchTab({
					url: '/pages/report/report'
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.list-page {
		min-height: 100vh;
		height: 100vh;
		background-color: #F0F6F7;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.filter-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		padding: 20rpx 28rpx 12rpx;
		box-sizing: border-box;
	}

	.filter-chip {
		flex: 1;
		text-align: center;
		padding: 18rpx 12rpx;
		background: #fff;
		border-radius: 999rpx;
		border: 2rpx solid rgba(175, 160, 201, 0.35);
	}

	.filter-chip.active {
		background: rgba(76, 140, 182, 0.16);
		border-color: #083969;
	}

	.filter-text {
		font-size: 26rpx;
		color: rgba(5, 28, 44, 0.7);
	}

	.filter-chip.active .filter-text {
		color: #083969;
		font-weight: 600;
	}

	.list-scroll {
		flex: 1;
		height: 0;
		padding: 0 28rpx;
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.empty-wrap {
		padding: 120rpx 32rpx;
		text-align: center;
	}

	.empty-text {
		font-size: 28rpx;
		color: rgba(5, 28, 44, 0.45);
	}

	.report-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx 24rpx 22rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid rgba(175, 160, 201, 0.35);
		box-shadow: 0 4rpx 20rpx rgba(5, 28, 44, 0.08);
	}

	.report-row {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 12rpx;
	}

	.report-row.sub {
		margin-bottom: 16rpx;
	}

	.report-label {
		font-size: 30rpx;
		color: #051C2C;
		font-weight: 600;
	}

	.report-score {
		font-size: 40rpx;
		font-weight: 700;
		color: #083969;
	}

	.time-label {
		font-size: 26rpx;
		color: rgba(5, 28, 44, 0.7);
	}

	.time-val {
		font-size: 26rpx;
		color: rgba(5, 28, 44, 0.85);
	}

	.report-hint {
		font-size: 22rpx;
		color: rgba(5, 28, 44, 0.45);
	}

	.list-footer-space {
		height: 24rpx;
	}
</style>
