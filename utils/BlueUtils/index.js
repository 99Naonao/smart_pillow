// 基于《枕头蓝牙通讯协议》的发包工具类
// 负责：按协议格式组包 + CRC16(Modbus) 校验，并提供常用功能号的便捷方法

/**
 * 计算 MODBUS CRC16，小端输出
 * 多数文档默认多项式 0xA001，初始值 0xFFFF
 * @param {Uint8Array} bytes
 * @returns {number} 16bit 整数（低位在前，高位在后）
 */
function crc16Modbus(bytes) {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc & 0xffff;
}

/**
 * 通用报文构建：
 * 下发：起始 0x55
 * 长度：2 bytes，小端，为「功能号 + 数据」长度
 * 功能号：1 byte
 * 数据：N bytes
 * CRC16：2 bytes，小端，对「功能号 + 数据」做 MODBUS CRC16
 */
class BluePillowProtocol {
  /**
   * 构建写命令
   * @param {number} funcCode 原始功能号（0x01~0x0A）
   * @param {Uint8Array|number[]} [data] 数据区
   * @returns {ArrayBuffer}
   */
  static buildWrite(funcCode, data = []) {
    const dataArr = data instanceof Uint8Array ? data : Uint8Array.from(data);
    const bodyLen = 1 + dataArr.length; // 功能号 + 数据

    const totalLen = 1 /* start */ + 2 /* length */ + bodyLen + 2 /* crc16 */;
    const buffer = new ArrayBuffer(totalLen);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // 起始字节
    bytes[0] = 0x55;
    // 长度（小端）
    view.setUint16(1, bodyLen, true);
    // 功能号
    bytes[3] = funcCode & 0xff;
    // 数据
    for (let i = 0; i < dataArr.length; i++) {
      bytes[4 + i] = dataArr[i];
    }

    // 计算 CRC16（功能号 + 数据）
    const crcTarget = bytes.subarray(3, 3 + bodyLen);
    const crc = crc16Modbus(crcTarget);
    const crcOffset = 3 + bodyLen;
    view.setUint16(crcOffset, crc, true); // 小端

    return buffer;
  }

  /**
   * 构建读命令
   * 协议约定：功能号 bit7=1 表示读，且无数据区，长度固定为 1
   * @param {number} funcCode 原始功能号（如 0x01~0x0E）
   * @returns {ArrayBuffer} 线路上功能字节为 funcCode|0x80（读位）
   */
  static buildRead(funcCode) {
    const readCode = (funcCode | 0x80) & 0xff;
    // 读命令无数据区（0x02/0x03 等带索引读在各自方法里单独组包）
    return BluePillowProtocol.buildWrite(readCode, []);
  }

  /**
   * 协议《一》：小端 uint16 —— 低字节在前、高字节在后（与 DataView.setUint16(_, _, true) 一致）
   * @example 数值 0x1234 → 字节序列 [0x34, 0x12]
   * @param {Uint8Array} bytes
   * @param {number} offset
   * @param {number} value
   * @returns {number} 写入后的下一个 offset
   */
  static _putUint16LE(bytes, offset, value) {
    const v = Number(value) >>> 0
    bytes[offset] = v & 0xff
    bytes[offset + 1] = (v >>> 8) & 0xff
    return offset + 2
  }

  // ===== 具体功能封装，便于直接调用 =====

  /**
   * 0x01 读取枕头信息（版本号、序列号等）
   */
  static readDeviceInfo() {
    return BluePillowProtocol.buildRead(0x01);
  }

  /**
   * 0x02 配置枕头仰卧使用参数（可读可写）
   * @param {Object} payload
   * @param {number} payload.index 0 成人男、1 成人女、2 儿童、3 特殊群体1、4 特殊群体2
   * @param {number} payload.headHeight 0~100（%）
   * @param {number} [payload.headWindow=0] 头枕有效窗口值
   * @param {number} payload.neckHeight 0~100（%）
   * @param {number} [payload.neckWindow=0] 颈枕有效窗口值
   */
  static writeSupineConfig({ index, headHeight, headWindow = 0, neckHeight, neckWindow = 0 }) {
    // 索引 + 头枕高度 + 头枕有效窗口值 + 颈枕高度 + 颈枕有效窗口值（uint16 均为小端）
    const bytes = new Uint8Array(1 + 2 + 2 + 2 + 2);
    let o = 0
    bytes[o++] = index & 0xff
    o = BluePillowProtocol._putUint16LE(bytes, o, headHeight)
    o = BluePillowProtocol._putUint16LE(bytes, o, headWindow)
    o = BluePillowProtocol._putUint16LE(bytes, o, neckHeight)
    o = BluePillowProtocol._putUint16LE(bytes, o, neckWindow)
    return BluePillowProtocol.buildWrite(0x02, bytes)
  }

  /**
   * 读取仰卧配置（逻辑功能号仍是 0x02）
   * 协议《一》约定：读命令时功能号 bit7=1，故线路上功能字节为 0x02|0x80 = 0x82（不是另一条命令）。
   * 0x02 表格要求读取时带索引，故数据区为 1 字节索引（与「仅长度 1、无数据」的纯读略有不同）。
   * @param {number} [index=0] 用户索引 0~4
   */
  static readSupineConfig(index) {
    const readCode = (0x02 | 0x80) & 0xff // 0x02 的读形态
    let idx = index === null || typeof index === 'undefined' ? 0 : Number(index)
    if (Number.isNaN(idx)) idx = 0
    return BluePillowProtocol.buildWrite(readCode, [idx & 0xff])
  }

  /**
   * 0x03 配置枕头侧卧使用参数（可读可写）
   * 结构与 0x02 相同：索引 + 头枕高度 + 头枕有效窗口值 + 颈枕高度 + 颈枕有效窗口值
   */
  static writeSideConfig({ index, headHeight, headWindow = 0, neckHeight, neckWindow = 0 }) {
    const bytes = new Uint8Array(1 + 2 + 2 + 2 + 2)
    let o = 0
    bytes[o++] = index & 0xff
    o = BluePillowProtocol._putUint16LE(bytes, o, headHeight)
    o = BluePillowProtocol._putUint16LE(bytes, o, headWindow)
    o = BluePillowProtocol._putUint16LE(bytes, o, neckHeight)
    o = BluePillowProtocol._putUint16LE(bytes, o, neckWindow)
    return BluePillowProtocol.buildWrite(0x03, bytes)
  }

  /**
   * 读取侧卧配置（逻辑功能号仍是 0x03；线路上为 0x03|0x80 = 0x83 + 索引 1 字节）
   * @param {number} [index=0] 用户索引 0~4
   */
  static readSideConfig(index) {
    const readCode = (0x03 | 0x80) & 0xff // 0x03 的读形态
    let idx = index === null || typeof index === 'undefined' ? 0 : Number(index)
    if (Number.isNaN(idx)) idx = 0
    return BluePillowProtocol.buildWrite(readCode, [idx & 0xff])
  }

  /**
   * 一次性配置同一索引下的仰卧 + 侧卧使用参数
   * 协议本身依然是两条命令（0x02 和 0x03），这里只是做一个聚合封装，方便调用。
   * @param {Object} payload
   * @param {number} payload.index 用户索引
   * @param {number} payload.supineHead 仰卧头枕高度 0~100（%）
   * @param {number} payload.supineNeck 仰卧颈枕高度 0~100（%）
   * @param {number} [payload.supineHeadWindow=0] 仰卧头枕有效窗口
   * @param {number} [payload.supineNeckWindow=0] 仰卧颈枕有效窗口
   * @param {number} payload.sideHead 侧卧头枕高度 0~100（%）
   * @param {number} payload.sideNeck 侧卧颈枕高度 0~100（%）
   * @param {number} [payload.sideHeadWindow=0] 侧卧头枕有效窗口
   * @param {number} [payload.sideNeckWindow=0] 侧卧颈枕有效窗口
   * @returns {Array<ArrayBuffer>} [supineBuffer, sideBuffer]
   */
  static writeFullProfile({
    index,
    supineHead,
    supineNeck,
    supineHeadWindow = 0,
    supineNeckWindow = 0,
    sideHead,
    sideNeck,
    sideHeadWindow = 0,
    sideNeckWindow = 0
  }) {
    const supine = BluePillowProtocol.writeSupineConfig({
      index,
      headHeight: supineHead,
      headWindow: supineHeadWindow,
      neckHeight: supineNeck,
      neckWindow: supineNeckWindow
    })
    const side = BluePillowProtocol.writeSideConfig({
      index,
      headHeight: sideHead,
      headWindow: sideHeadWindow,
      neckHeight: sideNeck,
      neckWindow: sideNeckWindow
    })
    return [supine, side]
  }

  /**
   * 0x04 读取枕头数据（工作状态、睡姿、RTC、气压等，见协议「读取枕头数据」）
   * 下发线路上为 0x84；设备上传应答功能字节亦为 0x84（读应答位）
   */
  static readPillowStatus() {
    return BluePillowProtocol.buildRead(0x04);
  }

  /**
   * 0x05 当前获取或设置头枕高度
   * 无参数时默认读；传入 height 则为写
   * @param {number|null|undefined} height 0~100（%）
   */
  static headHeight(height) {
    if (height === null || typeof height === 'undefined') {
      return BluePillowProtocol.buildRead(0x05);
    }
    const bytes = new Uint8Array(2);
    bytes[0] = height & 0xff;
    bytes[1] = (height >> 8) & 0xff;
    return BluePillowProtocol.buildWrite(0x05, bytes);
  }

  /**
   * 0x06 当前获取或设置颈枕高度
   * 无参数时默认读；传入 height 则为写
   * @param {number|null|undefined} height 0~100（%）
   */
  static neckHeight(height) {
    if (height === null || typeof height === 'undefined') {
      return BluePillowProtocol.buildRead(0x06);
    }
    const bytes = new Uint8Array(2);
    bytes[0] = height & 0xff;
    bytes[1] = (height >> 8) & 0xff;
    return BluePillowProtocol.buildWrite(0x06, bytes);
  }

  /**
   * 一次性设置当前头枕 + 颈枕高度
   * 协议上是 0x05、0x06 两条命令，这里返回 [headBuffer, neckBuffer]，方便上层依次发送。
   * @param {Object} payload
   * @param {number} payload.headHeight 头枕高度 0~100（%）
   * @param {number} payload.neckHeight 颈枕高度 0~100（%）
   * @returns {Array<ArrayBuffer>} [headBuffer, neckBuffer]
   */
  static writeCurrentHeights({ headHeight, neckHeight }) {
    const headBuf = BluePillowProtocol.headHeight(headHeight)
    const neckBuf = BluePillowProtocol.neckHeight(neckHeight)
    return [headBuf, neckBuf]
  }

  /**
   * 0x07 学习睡姿
   * @param {Object} payload
   * @param {number} payload.mode 0x01 仰卧学习，0x02 侧卧学习
   * @param {number} payload.state 0x00 空闲 0x01 初始化 0x02 开始学习 0x03 结束学习 0x04 确认学习
   */
  static learnPosture({ mode, state }) {
    const bytes = new Uint8Array(2);
    bytes[0] = mode & 0xff;
    bytes[1] = state & 0xff;
    return BluePillowProtocol.buildWrite(0x07, bytes);
  }

  /**
   * 0x08 加热控制
   * @param {Object} payload
   * @param {boolean} payload.on true 开始加热 / false 停止
   * @param {number} payload.targetTemperature 目标温度（uint8）
   */
  static heating({ on, targetTemperature }) {
    const bytes = new Uint8Array(2);
    bytes[0] = on ? 0x01 : 0x00;
    bytes[1] = targetTemperature & 0xff;
    return BluePillowProtocol.buildWrite(0x08, bytes);
  }

  /**
   * 0x09 脊柱微调
   * @param {Object} payload
   * @param {number} payload.headHeight 0~100（%）
   * @param {number} payload.neckHeight 0~100（%）
   * @param {number} payload.times 脊柱调整次数（uint8）
   * @param {number} payload.holdTime1 支撑高度保持时间（秒，uint16）
   * @param {number} payload.holdTime2 放松高度保持时间（秒，uint16）
   */
  static spineAdjust({ headHeight, neckHeight, times, holdTime1, holdTime2 }) {
    const bytes = new Uint8Array(2 + 2 + 1 + 2 + 2);
    let offset = 0;
    // 头枕高度
    bytes[offset++] = headHeight & 0xff;
    bytes[offset++] = (headHeight >> 8) & 0xff;
    // 颈枕高度
    bytes[offset++] = neckHeight & 0xff;
    bytes[offset++] = (neckHeight >> 8) & 0xff;
    // 脊柱调整次数
    bytes[offset++] = times & 0xff;
    // 支撑高度保持时间
    bytes[offset++] = holdTime1 & 0xff;
    bytes[offset++] = (holdTime1 >> 8) & 0xff;
    // 放松高度保持时间
    bytes[offset++] = holdTime2 & 0xff;
    bytes[offset++] = (holdTime2 >> 8) & 0xff;

    return BluePillowProtocol.buildWrite(0x09, bytes);
  }

  /**
   * 0x0A 标定枕头
   * @param {number} mode 0x01 进入标定模式 0x02 退出标定模式 0x03 标定成功
   */
  static calibrate(mode) {
    const bytes = new Uint8Array(1);
    bytes[0] = mode & 0xff;
    return BluePillowProtocol.buildWrite(0x0a, bytes);
  }

  /**
   * 0x0B 睡姿数据配置 / 读取
   * 这里只给一个写配置的封装：写入 16 个有效限位值（uint16）和 16 个有效位（uint8），不含返回的实时睡姿数据。
   * @param {Object} payload
   * @param {number[]} payload.limit16 长度 16 的数组，睡姿传感器有效限位值
   * @param {number[]} payload.validFlags 长度 16 的数组，睡姿有效位（0/1）
   */
  static writePostureConfig({ limit16, validFlags }) {
    const limits = (limit16 || []).slice(0, 16)
    const flags = (validFlags || []).slice(0, 16)
    while (limits.length < 16) limits.push(0)
    while (flags.length < 16) flags.push(0)

    // 16 * uint16 + 16 * uint8 = 48 字节
    const bytes = new Uint8Array(16 * 2 + 16)
    let offset = 0
    limits.forEach((v) => {
      const val = v & 0xffff
      bytes[offset++] = val & 0xff
      bytes[offset++] = (val >> 8) & 0xff
    })
    flags.forEach((v) => {
      bytes[offset++] = v & 0xff
    })
    return BluePillowProtocol.buildWrite(0x0b, bytes)
  }

  /**
   * 读取 0x0B 睡姿传感器相关数据
   */
  static readPostureData() {
    return BluePillowProtocol.buildRead(0x0b)
  }

  /**
   * 0x0C 读取和配置枕头参数（睡姿稳定时间）
   * @param {number} [stabilitySeconds] 确认睡姿稳定时间，单位：秒（uint16）。不传则为读命令
   */
  static pillowParams(stabilitySeconds) {
    if (stabilitySeconds === null || typeof stabilitySeconds === 'undefined') {
      return BluePillowProtocol.buildRead(0x0c)
    }
    const v = stabilitySeconds & 0xffff
    const bytes = new Uint8Array(2)
    bytes[0] = v & 0xff
    bytes[1] = (v >> 8) & 0xff
    return BluePillowProtocol.buildWrite(0x0c, bytes)
  }

  /**
   * 0x0D 配置和读取 RTC（年 月 日 时 分 秒，各 uint8）
   * @param {Object|null|undefined} rtc 不传或 null 为读命令
   */
  static rtcConfig(rtc) {
    if (!rtc || rtc === null) {
      return BluePillowProtocol.buildRead(0x0d)
    }
    const { year, month, day, hour, minute, second } = rtc
    const bytes = new Uint8Array(6)
    bytes[0] = year & 0xff
    bytes[1] = month & 0xff
    bytes[2] = day & 0xff
    bytes[3] = hour & 0xff
    bytes[4] = minute & 0xff
    bytes[5] = second & 0xff
    return BluePillowProtocol.buildWrite(0x0d, bytes)
  }

  /**
   * 0x0E 手动调节气囊充放气控制
   * 读：不传参数或传 null/undefined → buildRead(0x0E)
   * 写：气囊通道 + 操作方式 + 保持时间（秒），均为 uint8
   * @param {null|undefined|number|Object} payload 读命令不传。写命令传对象，或兼容旧写法仅传通道 number
   * @param {number} [payload.channel] 0：头部气囊；1：颈部气囊
   * @param {number} [payload.mode] 1：充气 2：放气 3：保持
   * @param {number} [payload.seconds] 单位秒；操作方式保持的时间
   */
  static airbagManual(payload) {
    if (payload === null || typeof payload === 'undefined') {
      return BluePillowProtocol.buildRead(0x0e)
    }
    let channel = 0
    let mode = 1
    let seconds = 30
    if (typeof payload === 'number') {
      channel = payload
    } else if (payload && typeof payload === 'object') {
      channel = payload.channel
      if (payload.mode != null && payload.mode !== '') {
        mode = Number(payload.mode)
      }
      const t = payload.seconds != null ? payload.seconds : payload.time
      if (t != null) seconds = Number(t)
    }
    channel = (Number(channel) & 0xff) === 1 ? 1 : 0
    mode = Number(mode)
    if (Number.isNaN(mode) || mode < 1) mode = 1
    if (mode > 3) mode = 3
    seconds = Number(seconds)
    if (Number.isNaN(seconds)) seconds = 30
    seconds = Math.max(0, Math.min(255, Math.floor(seconds)))
    const bytes = new Uint8Array(3)
    bytes[0] = channel
    bytes[1] = mode & 0xff
    bytes[2] = seconds & 0xff
    return BluePillowProtocol.buildWrite(0x0e, bytes)
  }
}

export default BluePillowProtocol;
export { BluePillowProtocol, crc16Modbus };

