/**
 * 脊柱微调（0x09）会话：storage、冷启动收尾、统一停止
 */
import BluePillowProtocol from '@/utils/BlueUtils/bluepillow-protocol.js';
import { PillowBleManager } from '@/utils/BlueUtils/PillowBleManager.js';

export const SPINE_SESSION_KEY = 'spine_micro_session';
export const SPINE_PENDING_END_KEY = 'spine_pending_end';

export function buildSpineEndBuffer() {
	return BluePillowProtocol.spineAdjust({
		headHeight: 0,
		neckHeight: 0,
		neckRelaxHeight: 0,
		times: 0,
		holdTime1: 0,
		holdTime2: 0
	});
}

/**
 * 结束脊柱微调：下发 0x09 times=0、清状态与 storage。
 * @param {Object} [opt]
 * @param {boolean} [opt.emit=true] 是否 uni.$emit('spine_session_stopped')
 * @param {boolean} [opt.showModal] 是否弹 showModal
 * @param {string} [opt.modalTitle]
 * @param {string} [opt.modalContent]
 * @param {string} [opt.showToast] showToast 文案
 */
export function stopSpineAdjustSession(opt = {}) {
	const mgr = PillowBleManager.getInstance();
	const adjusting = mgr.getSpineAdjusting();
	if (!adjusting) {
		try {
			uni.removeStorageSync(SPINE_PENDING_END_KEY);
		} catch (e) {}
		return;
	}
	if (mgr.isConnected()) {
		mgr.write2tooth(buildSpineEndBuffer());
	}
	mgr.setSpineAdjusting(false);
	try {
		uni.removeStorageSync(SPINE_SESSION_KEY);
	} catch (e) {}
	try {
		uni.removeStorageSync(SPINE_PENDING_END_KEY);
	} catch (e) {}

	if (opt.emit !== false) {
		uni.$emit('spine_session_stopped', { reason: opt.reason || 'stop' });
	}
	if (opt.showToast) {
		uni.showToast({ title: opt.showToast, icon: 'none' });
	}
	if (opt.showModal) {
		uni.showModal({
			title: opt.modalTitle || '温馨提示',
			content: opt.modalContent || '已退出脊柱微调模式',
			showCancel: false
		});
	}
}

/** 进程被杀后冷启动：未连上枕头时记下，待 notify 就绪后补发结束帧 */
export function markPendingSpineEnd() {
	try {
		uni.setStorageSync(SPINE_PENDING_END_KEY, { t: Date.now() });
	} catch (e) {}
}

/**
 * 小程序冷启动（含从后台划掉后再次进入）：若有未收尾的脊柱会话则停设备并清标记
 */
export function onAppLaunchSpineCleanup() {
	try {
		const session = uni.getStorageSync(SPINE_SESSION_KEY);
		if (!session || !session.active) {
			return;
		}
		uni.removeStorageSync(SPINE_SESSION_KEY);
		const mgr = PillowBleManager.getInstance();
		mgr.setSpineAdjusting(false);
		if (mgr.isConnected()) {
			mgr.write2tooth(buildSpineEndBuffer());
		} else {
			markPendingSpineEnd();
		}
	} catch (e) {
		console.warn('[spineSession] onAppLaunchSpineCleanup', e);
	}
}
