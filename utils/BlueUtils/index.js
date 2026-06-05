// 聚合导出：协议组包（bluepillow-protocol.js）+ 蓝牙管理（PillowBleManager.js）
// 拆分为两文件可避免 PillowBleManager 与入口循环依赖

// 默认导出仍为 BluePillowProtocol，与历史用法 import BluePillowProtocol from '@/utils/BlueUtils' 一致
export { default, BluePillowProtocol, crc16Modbus } from './bluepillow-protocol.js';
export {
  PillowBleManager,
  PILLOW_PROFILE_HEIGHT_WINDOW,
  pillowProfileHeightWindows,
  parsePillowUploadFrame,
  parseWriteAckPayload,
  parseDeviceInfoPayload,
  parsePillowStatusPayload,
  parseSpineAdjustPayload,
  resolveSpineReadRemainTimes,
  SPINE_ADJUST_DATA_LEN,
  parsePostureSensor0x0BPayload,
  parsePillowParams0x0CPayload,
  parseCalibrationCorrect0x11Payload,
  readFirmwareVersionCache,
  formatFirmwareVersionFromRaw
} from './PillowBleManager.js';
export { default as WifiToolManager, WifiToolManager as BlueWifiToolManager } from './WifiToolManager.js';
export { default as PermissionToolManager, PermissionToolManager as BluePermissionToolManager } from './PermissionToolManager.js';
