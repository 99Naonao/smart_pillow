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
   * @param {number} funcCode 原始功能号（0x01~0x10）
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
   * @param {number} funcCode 原始功能号（如 0x01~0x10）
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

  /** 小端 int16（short） */
  static _putInt16LE(bytes, offset, value) {
    let v = Math.floor(Number(value))
    if (Number.isNaN(v)) v = 0
    v = Math.max(-32768, Math.min(32767, v))
    if (v < 0) v = 0x10000 + v
    return BluePillowProtocol._putUint16LE(bytes, offset, v)
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
   * 0x04 读取枕头数据（见协议「读取枕头高度 0x04」表）
   * 应答数据区：工作状态、故障码×2、气压泵1/2（0 空闲，1 充气中）、加热片温度、设备状态（bit0~2 气阀，bit3 加热）；其后为 RTC×6、气压1/2（uint16，×0.01kPa）
   * 睡姿 16 点已不在 0x04 表中（改由 0x0B 等协议）。
   * 下发线路上为 0x84；须由 App 主动读，再在 notify 里收解析结果。
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
   * @param {boolean} [payload.read=false] true：读（线路上 0x87）
   * @param {number} payload.mode 0x01 仰卧学习，0x02 侧卧学习，0x03 空闲学习
   * @param {number} payload.state 0x00 空闲 0x01 初始化 0x02 开始学习 0x03 结束学习 0x04 确认学习
   * @param {number} [payload.postureValidLimit=0] 睡姿有效点位值（uint8），协议亦称「可读可写，统计有效位／点数」；未传按 0
   * @param {number} [payload.supinePeak1] 仰卧峰值1（uint16）
   * @param {number} [payload.supinePeak2] 仰卧峰值2（uint16）
   * @param {number} [payload.supineWidth] 仰卧宽度（uint8）
   * @param {number} [payload.sidePeak] 侧卧峰值（uint16）
   * @param {number} [payload.sideWidth] 侧卧宽度（uint8）
   */
  static learnPosture(payload) {
    const p = payload && typeof payload === 'object' ? payload : {};
    const read = !!p.read;
    if (read) {
      return BluePillowProtocol.buildRead(0x07);
    }
    const clampU8 = (v) => {
      let n = Number(v);
      if (Number.isNaN(n)) n = 0;
      return Math.max(0, Math.min(255, Math.floor(n))) & 0xff;
    };
    const clampU16 = (v) => {
      let n = Number(v);
      if (Number.isNaN(n)) n = 0;
      return Math.max(0, Math.min(65535, Math.floor(n))) & 0xffff;
    };
    const mode = clampU8(p.mode);
    const state = clampU8(p.state);
    const postureValidLimit = clampU8(p.postureValidLimit);
    const hasExtended =
      p.supinePeak1 !== undefined ||
      p.supinePeak2 !== undefined ||
      p.supineWidth !== undefined ||
      p.sidePeak !== undefined ||
      p.sideWidth !== undefined;
    if (!hasExtended) {
      const bytes = new Uint8Array(3);
      bytes[0] = mode;
      bytes[1] = state;
      bytes[2] = postureValidLimit;
      return BluePillowProtocol.buildWrite(0x07, bytes);
    }
    const bytes = new Uint8Array(11);
    let o = 0;
    bytes[o++] = mode;
    bytes[o++] = state;
    bytes[o++] = postureValidLimit;
    o = BluePillowProtocol._putUint16LE(bytes, o, clampU16(p.supinePeak1));
    o = BluePillowProtocol._putUint16LE(bytes, o, clampU16(p.supinePeak2));
    bytes[o++] = clampU8(p.supineWidth);
    o = BluePillowProtocol._putUint16LE(bytes, o, clampU16(p.sidePeak));
    bytes[o++] = clampU8(p.sideWidth);
    return BluePillowProtocol.buildWrite(0x07, bytes);
  }

  /** 0x07 读（线路上 0x87）：读取学习参数（峰值/宽度） */
  static readLearnPosture() {
    return BluePillowProtocol.buildRead(0x07);
  }

  /**
   * 0x08 加热控制
   * @param {Object} payload
   * @param {boolean} payload.on true 开始加热 / false 停止
   * @param {number} payload.targetTemperature 目标温度（uint8）
   * @param {number} [payload.durationSeconds] 最长加热时间（uint16，小端），单位秒；停止时可 0；未传则按 0
   */
  static heating({ on, targetTemperature, durationSeconds }) {
    const bytes = new Uint8Array(4);
    bytes[0] = on ? 0x01 : 0x00;
    bytes[1] = targetTemperature & 0xff;
    let sec = durationSeconds === null || typeof durationSeconds === 'undefined' ? 0 : Number(durationSeconds);
    if (Number.isNaN(sec)) sec = 0;
    sec = Math.max(0, Math.min(65535, Math.floor(sec)));
    BluePillowProtocol._putUint16LE(bytes, 2, sec);
    return BluePillowProtocol.buildWrite(0x08, bytes);
  }

  /**
   * 0x09 脊柱微调
   * 头枕支撑 / 颈枕支撑 / 颈枕放松高度：0~100%（小端 uint16），与协议 0x09 表一致
   * @param {Object} payload
   * @param {number} payload.headHeight 头枕支撑高度 0~100（%）
   * @param {number} payload.neckHeight 颈枕支撑高度 0~100（%）
   * @param {number} [payload.neckRelaxHeight=0] 颈枕放松高度 0~100（%），uint16 小端
   * @param {number} payload.times 脊柱调整次数（uint8）；0 表示结束微调
   * @param {number} payload.holdTime1 脊柱支撑高度保持时间（秒，uint16）
   * @param {number} payload.holdTime2 脊柱放松高度保持时间（秒，uint16）
   */
  static spineAdjust({ headHeight, neckHeight, neckRelaxHeight = 0, times, holdTime1, holdTime2 }) {
    const clampPct = (v) => {
      let n = Number(v);
      if (Number.isNaN(n)) n = 0;
      return Math.max(0, Math.min(100, Math.floor(n)));
    };
    const h = clampPct(headHeight);
    const n = clampPct(neckHeight);
    const nr = clampPct(neckRelaxHeight);
    let t = Number(times);
    if (Number.isNaN(t)) t = 0;
    t = Math.max(0, Math.min(255, Math.floor(t)));
    let t1 = Number(holdTime1);
    if (Number.isNaN(t1)) t1 = 0;
    t1 = Math.max(0, Math.min(65535, Math.floor(t1)));
    let t2 = Number(holdTime2);
    if (Number.isNaN(t2)) t2 = 0;
    t2 = Math.max(0, Math.min(65535, Math.floor(t2)));

    const bytes = new Uint8Array(11);
    let offset = 0;
    offset = BluePillowProtocol._putUint16LE(bytes, offset, h);
    offset = BluePillowProtocol._putUint16LE(bytes, offset, n);
    offset = BluePillowProtocol._putUint16LE(bytes, offset, nr);
    bytes[offset++] = t & 0xff;
    offset = BluePillowProtocol._putUint16LE(bytes, offset, t1);
    BluePillowProtocol._putUint16LE(bytes, offset, t2);

    return BluePillowProtocol.buildWrite(0x09, bytes);
  }

  /**
   * 读 0x09：线路上功能字节为 0x89（0x09|0x80），无数据区；用于读取当前脊柱调整剩余次数。
   * @returns {ArrayBuffer}
   */
  static readSpineAdjust() {
    return BluePillowProtocol.buildRead(0x09);
  }

  /**
   * 0x0A 标定枕头（与《枕头蓝牙通讯协议》一致）
   * @param {number} mode
   *   0x01 进入双气囊同步标定
   *   0x02 标定成功（人为确认后下发，设备计算标定值）
   *   0x03 进入颈枕气囊标定
   *   0x04 进入头枕气囊标定
   *   0x05 退出标定模式
   */
  static calibrate(mode) {
    const bytes = new Uint8Array(1);
    bytes[0] = mode & 0xff;
    return BluePillowProtocol.buildWrite(0x0a, bytes);
  }

  /**
   * 0x0B 睡姿数据写：限位 uint16×16 + 有效位 uint8×16 + 睡姿数据 uint16×16（与协议表顺序一致）
   * @param {Object} payload
   * @param {number[]} payload.limit16 睡姿传感器有效限位值×16
   * @param {number[]} payload.validFlags 睡姿有效位×16（0/1）
   * @param {number[]} [payload.postureSamples] 睡姿数据×16；不传则全 0
   */
  static writePostureConfig({ limit16, validFlags, postureSamples }) {
    const limits = (limit16 || []).slice(0, 16)
    const flags = (validFlags || []).slice(0, 16)
    const samples = (postureSamples || []).slice(0, 16)
    while (limits.length < 16) limits.push(0)
    while (flags.length < 16) flags.push(0)
    while (samples.length < 16) samples.push(0)

    const bytes = new Uint8Array(16 * 2 + 16 + 16 * 2)
    let offset = 0
    limits.forEach((v) => {
      offset = BluePillowProtocol._putUint16LE(bytes, offset, v & 0xffff)
    })
    flags.forEach((v) => {
      bytes[offset++] = v & 0xff
    })
    samples.forEach((v) => {
      offset = BluePillowProtocol._putUint16LE(bytes, offset, v & 0xffff)
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
   * 0x0C 读取和配置枕头参数（协议：睡姿稳定时间 uint16 秒 + 头枕压力维持 uint16 ms + 颈枕压力维持 uint16 ms，小端）
   * @param {number|object|null|undefined} payload
   *   - 不传 / null / undefined：读命令
   *   - number：仅写睡姿稳定时间（秒），头/颈压力维持写 0（兼容旧调用）
   *   - object：{ stabilitySeconds, headPressureHoldMs?, neckPressureHoldMs? }，缺省按 0
   */
  static pillowParams(payload) {
    if (payload === null || typeof payload === 'undefined') {
      return BluePillowProtocol.buildRead(0x0c)
    }
    let stabilitySeconds = 0
    let headMs = 0
    let neckMs = 0
    if (typeof payload === 'number') {
      stabilitySeconds = payload & 0xffff
    } else if (typeof payload === 'object') {
      stabilitySeconds = Number(payload.stabilitySeconds) & 0xffff
      headMs = Number(payload.headPressureHoldMs) & 0xffff
      neckMs = Number(payload.neckPressureHoldMs) & 0xffff
    }
    const bytes = new Uint8Array(6)
    let o = 0
    o = BluePillowProtocol._putUint16LE(bytes, o, stabilitySeconds)
    o = BluePillowProtocol._putUint16LE(bytes, o, headMs)
    BluePillowProtocol._putUint16LE(bytes, o, neckMs)
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

  /**
   * 0x0F 心率模块控制读取
   * @param {Object} [payload]
   * @param {boolean} [payload.read=false] false：将 data0~datan 写入心率模块（首字节 0）；true：**读命令**（线路上功能字节 **0x8F**，与协议「读应答 bit7=1」一致）
   * @param {number[]|Uint8Array} [payload.data=[]] 仅写操作：透传 data0~datan（含 5A5A 帧等）
   * @returns {ArrayBuffer}
   */
  static heartRateModule(payload) {
    const p =
      payload === undefined
        ? { read: true }
        : payload && typeof payload === 'object'
          ? payload
          : {}
    const read = !!p.read
    if (read) {
      return BluePillowProtocol.buildRead(0x0f)
    }
    const raw = p.data
    const arr =
      !raw || (Array.isArray(raw) && raw.length === 0)
        ? []
        : raw instanceof Uint8Array
          ? Array.from(raw)
          : Array.prototype.slice.call(raw)
    const bytes = new Uint8Array(1 + arr.length)
    bytes[0] = 0x00
    for (let i = 0; i < arr.length; i++) {
      let b = Number(arr[i])
      if (Number.isNaN(b)) b = 0
      bytes[i + 1] = b & 0xff
    }
    return BluePillowProtocol.buildWrite(0x0f, bytes)
  }

  /**
   * 0x10 读取和配置枕头参数（调试模式开关 + 睡姿状态）
   * @param {Object} [payload]
   * @param {boolean} [payload.read=true] true：读（线路上 0x90）；false：写（线路上 0x10）
   * @param {number} [payload.debugMode=0] 调试模式开关（uint8，1=进入调试模式）
   * @param {number} [payload.sleepState=0] 睡姿状态（uint8，0=无睡姿，1=仰卧，2=侧卧）
   */
  static headParams0x10(payload) {
    const p =
      payload === undefined
        ? { read: true }
        : payload && typeof payload === 'object'
          ? payload
          : {}
    const read = p.read !== false
    if (read) {
      return BluePillowProtocol.buildRead(0x10)
    }
    let debugMode = Number(p.debugMode)
    if (Number.isNaN(debugMode)) debugMode = 0
    let sleepState = Number(p.sleepState)
    if (Number.isNaN(sleepState)) sleepState = 0
    const bytes = new Uint8Array(2)
    bytes[0] = debugMode & 0xff
    bytes[1] = sleepState & 0xff
    return BluePillowProtocol.buildWrite(0x10, bytes)
  }

  /**
   * 0x11 配置和读取修正值（量程 0~100，最多 20 档，节点 0~19）
   * 节点与档位数据一一对应；节点 0 阈值最低，节点序号越大档位数据应越大。
   * 写：档位节点(u8) + 档位数据(u16) + 充气修正(i16) + 放气修正(i16)，共 7 字节
   * 读：仅档位节点 1 字节（线路上 0x91）
   * @param {Object} payload
   * @param {boolean} payload.read true=读 false=写
   * @param {number} payload.nodeIndex 档位节点 0~19
   * @param {number} [payload.levelData] 写：档位数据 0~100
   * @param {number} [payload.inflateCorrect] 写：充气修正 short
   * @param {number} [payload.deflateCorrect] 写：放气修正 short
   */
  static calibrationCorrect0x11(payload) {
    const p = payload && typeof payload === 'object' ? payload : {}
    let node = Number(p.nodeIndex)
    if (Number.isNaN(node)) node = 0
    node = Math.max(0, Math.min(19, Math.floor(node)))

    if (p.read) {
      const readCode = (0x11 | 0x80) & 0xff
      return BluePillowProtocol.buildWrite(readCode, [node])
    }

    let levelData = Number(p.levelData)
    if (Number.isNaN(levelData)) levelData = 0
    levelData = Math.max(0, Math.min(100, Math.floor(levelData)))

    let inflate = Number(p.inflateCorrect)
    if (Number.isNaN(inflate)) inflate = 0
    inflate = Math.max(-50, Math.min(50, Math.floor(inflate)))

    let deflate = Number(p.deflateCorrect)
    if (Number.isNaN(deflate)) deflate = 0
    deflate = Math.max(-50, Math.min(50, Math.floor(deflate)))

    const bytes = new Uint8Array(7)
    let o = 0
    bytes[o++] = node
    o = BluePillowProtocol._putUint16LE(bytes, o, levelData)
    o = BluePillowProtocol._putInt16LE(bytes, o, inflate)
    BluePillowProtocol._putInt16LE(bytes, o, deflate)
    return BluePillowProtocol.buildWrite(0x11, bytes)
  }

}

export default BluePillowProtocol;
export { BluePillowProtocol, crc16Modbus };

