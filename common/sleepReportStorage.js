/**
 * 睡眠报告列表数据（后续可改为接口返回后写入 storage）
 */
const STORAGE_KEY = 'sleepReportHistory';

function pad2(n) {
	return n < 10 ? '0' + n : String(n);
}

/** 展示用时间：2026-3-27 08:22:12 */
export function formatReportDateTime(ts) {
	const d = new Date(Number(ts));
	if (Number.isNaN(d.getTime())) {
		return '—';
	}
	return (
		`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ` +
		`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
	);
}

function formatYMDFromTs(ts) {
	const d = new Date(Number(ts));
	if (Number.isNaN(d.getTime())) {
		return '';
	}
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 首次无数据时写入示例，便于联调 UI；接入接口后可删除 seed 或改为空数组 */
function seedMockReports() {
	const now = Date.now();
	const H = 3600000;
	const D = 86400000;
	return [
		{ id: 'demo-1', score: 86, reportTime: now - 8 * H },
		{ id: 'demo-2', score: 79, reportTime: now - 1 * D - 3 * H },
		{ id: 'demo-3', score: 91, reportTime: now - 2 * D - 22 * H },
		{ id: 'demo-4', score: 72, reportTime: now - 5 * D },
		{ id: 'demo-5', score: 84, reportTime: now - 9 * D },
		{ id: 'demo-6', score: 68, reportTime: now - 18 * D },
		{ id: 'demo-7', score: 77, reportTime: now - 35 * D }
	];
}

/**
 * @returns {{ id: string, score: number, reportTime: number }[]}
 */
export function getSleepReports() {
	try {
		let list = uni.getStorageSync(STORAGE_KEY);
		if (!Array.isArray(list) || list.length === 0) {
			list = seedMockReports();
			uni.setStorageSync(STORAGE_KEY, list);
		}
		return [...list].sort((a, b) => Number(b.reportTime) - Number(a.reportTime));
	} catch (e) {
		return seedMockReports();
	}
}

/**
 * @param {number} days 3 | 7 | 30
 */
export function filterReportsByRecentDays(list, days) {
	const d = Number(days);
	const n = Number.isFinite(d) && d > 0 ? Math.floor(d) : 1;
	const now = new Date();
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1)).getTime();
	return list.filter((item) => {
		const ts = Number(item && item.reportTime);
		return Number.isFinite(ts) && ts >= start && ts < end;
	});
}

export function getReportDateYmdForTab(item) {
	return formatYMDFromTs(item.reportTime);
}
