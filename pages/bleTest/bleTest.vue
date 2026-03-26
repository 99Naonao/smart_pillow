<template>
  <view class="container">
    <view class="title">蓝牙协议测试页（BluePillowProtocol）</view>
    <view class="tips">在本页完成蓝牙连接与协议测试。</view>

    <view class="section">
      <view class="section-title">蓝牙连接</view>
      <view class="ble-status">当前状态：{{ connected ? '已连接' : '未连接' }}</view>
      <view class="ble-status" v-if="connected && connectedDeviceName">设备：{{ connectedDeviceName }}</view>
      <view class="ble-row">
        <button class="btn-half" type="primary" @click="initBle">初始化蓝牙</button>
        <button
          class="btn-half"
          :type="scanning ? 'warn' : 'default'"
          @click="toggleScan"
        >{{ scanning ? '停止扫描' : '开始扫描' }}</button>
      </view>
      <view v-if="devices.length" class="device-list">
        <view class="device-item" v-for="item in devices" :key="item.deviceId">
          <view class="device-name">{{ item.name || '(无名设备)' }}</view>
          <view class="device-id">{{ item.deviceId }}</view>
          <button
            v-if="!connected || item.deviceId !== currentDeviceId"
            size="mini"
            type="primary"
            @click="connectDevice(item)"
          >连接</button>
          <button
            v-else
            size="mini"
            type="warn"
            @click="disconnectDevice"
          >断开连接</button>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">基础读取</view>
      <view class="form-row">
        <text class="form-label">仰卧/侧卧读取索引</text>
        <input class="form-input" type="number" v-model.number="form.readProfileIndex" />
      </view>
      <view class="status-row" style="margin-bottom: 12rpx; font-size: 24rpx; color: #666;">
        协议要求读取 0x02、0x03 时带索引；与下方「用户索引」独立，便于只读某档而不改写入目标。
      </view>
      <button class="btn" type="primary" @click="send('readDeviceInfo')">读取枕头信息 0x01</button>
      <button class="btn" type="primary" @click="send('readSupineConfig')">读取仰卧参数 0x02 读(带索引)</button>
      <button class="btn" type="primary" @click="send('readSideConfig')">读取侧卧参数 0x03 读(带索引)</button>
      <button class="btn" type="primary" @click="send('readPillowStatus')">读取枕头状态 0x04</button>
      <button class="btn" type="primary" @click="send('readHeadHeight')">读取头枕高度 0x05 读</button>
      <button class="btn" type="primary" @click="send('readNeckHeight')">读取颈枕高度 0x06 读</button>
    </view>

    <view class="section">
      <view class="section-title">当前高度 / 加热参数（可调）</view>
      <view class="form-row">
        <text class="form-label">头枕高度(0~100)</text>
        <input class="form-input" type="number" v-model.number="form.headHeight" />
        <button class="btn-mini" type="default" @click="send('setHeadHeight')">写入 0x05</button>
      </view>
      <view class="form-row">
        <text class="form-label">颈枕高度(0~100)</text>
        <input class="form-input" type="number" v-model.number="form.neckHeight" />
        <button class="btn-mini" type="default" @click="send('setNeckHeight')">写入 0x06</button>
      </view>
      <view class="form-row">
        <text class="form-label">加热温度(℃,0~45)</text>
        <input class="form-input" type="number" v-model.number="form.heatTemp" />
        <button class="btn-mini" type="warn" @click="send('startHeating')">开始加热</button>
        <button class="btn-mini" type="default" @click="send('stopHeating')">停止</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">仰卧 / 侧卧参数（索引 + 高度可调）</view>
      <view class="form-row">
        <text class="form-label">用户索引(0~4)</text>
        <input class="form-input" type="number" v-model.number="form.profileIndex" />
      </view>
      <view class="status-row" style="margin-bottom: 12rpx;">
        索引说明：0 成人男性，1 成人女性，2 儿童，3 特殊群体1，4 特殊群体2
      </view>
      <view class="form-row">
        <text class="form-label">仰卧头枕</text>
        <input class="form-input" type="number" v-model.number="form.supineHead" />
        <text class="form-label">仰卧颈枕</text>
        <input class="form-input" type="number" v-model.number="form.supineNeck" />
      </view>
      <view class="form-row">
        <text class="form-label">仰卧头枕窗口</text>
        <input class="form-input" type="number" v-model.number="form.supineHeadWindow" />
        <text class="form-label">仰卧颈枕窗口</text>
        <input class="form-input" type="number" v-model.number="form.supineNeckWindow" />
      </view>
      <view class="form-row">
        <text class="form-label">侧卧头枕</text>
        <input class="form-input" type="number" v-model.number="form.sideHead" />
        <text class="form-label">侧卧颈枕</text>
        <input class="form-input" type="number" v-model.number="form.sideNeck" />
      </view>
      <view class="form-row">
        <text class="form-label">侧卧头枕窗口</text>
        <input class="form-input" type="number" v-model.number="form.sideHeadWindow" />
        <text class="form-label">侧卧颈枕窗口</text>
        <input class="form-input" type="number" v-model.number="form.sideNeckWindow" />
      </view>
      <view class="form-row">
        <button class="btn" type="default" @click="send('setSupineConfig')">写入仰卧参数 0x02</button>
        <button class="btn" type="default" @click="send('setSideConfig')">写入侧卧参数 0x03</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">学习 / 脊柱微调 / 标定</view>
      <button class="btn" type="warn" @click="send('startSupineLearn')">仰卧学习 开始 0x07</button>
      <button class="btn" type="warn" @click="send('confirmSupineLearn')">仰卧学习 确认 0x07</button>
      <button class="btn" type="warn" @click="send('startSideLearn')">侧卧学习 开始 0x07</button>
      <button class="btn" type="warn" @click="send('confirmSideLearn')">侧卧学习 确认 0x07</button>
      <button class="btn" type="warn" @click="send('stopHeating')">停止加热 0x08</button>
      <button class="btn" type="warn" @click="send('startSpineAdjust')">脊柱微调 启动 0x09</button>
      <button class="btn" type="warn" @click="send('calibrateEnter')">标定枕头 进入模式 0x0A</button>
      <button class="btn" type="warn" @click="send('calibrateExit')">标定枕头 退出模式 0x0A</button>
	  <button class="btn" type="warn" @click="send('calibrateSuccess')">标定枕头 成功模式 0x0A</button>
	  
    </view>

    <view class="section">
      <view class="section-title">睡姿数据配置 / 读取 0x0B</view>
      <view class="status-row">限位值与有效位均为 16 个点，使用英文逗号分隔。</view>
      <view class="form-row">
        <text class="form-label">限位值(uint16×16)</text>
      </view>
      <textarea
        class="textarea"
        v-model="posture.limitText"
        placeholder="示例：100,100,100,... 共16个数"
      />
      <view class="form-row">
        <text class="form-label">有效位(0/1 ×16)</text>
      </view>
      <textarea
        class="textarea"
        v-model="posture.flagsText"
        placeholder="示例：1,1,1,... 共16个数"
      />
      <view class="form-row">
        <button class="btn" type="default" @click="send('writePostureConfig')">写入睡姿配置 0x0B</button>
        <button class="btn" type="primary" @click="send('readPostureData')">读取睡姿数据 0x0B 读</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">枕头参数 0x0C（睡姿稳定时间）</view>
      <view class="status-row">确认睡姿稳定时间，单位：秒（uint16）</view>
      <view class="form-row">
        <text class="form-label">稳定时间(秒)</text>
        <input class="form-input" type="number" v-model.number="ext0x0C.stabilitySeconds" />
        <button class="btn-mini" type="primary" @click="send('readPillowParams0x0C')">读取 0x0C</button>
        <button class="btn-mini" type="default" @click="send('writePillowParams0x0C')">写入 0x0C</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">RTC 0x0D（年 月 日 时 分 秒）</view>
      <view class="form-row">
        <text class="form-label">年</text>
        <input class="form-input" type="number" v-model.number="ext0x0D.year" />
        <text class="form-label">月</text>
        <input class="form-input" type="number" v-model.number="ext0x0D.month" />
        <text class="form-label">日</text>
        <input class="form-input" type="number" v-model.number="ext0x0D.day" />
      </view>
      <view class="form-row">
        <text class="form-label">时</text>
        <input class="form-input" type="number" v-model.number="ext0x0D.hour" />
        <text class="form-label">分</text>
        <input class="form-input" type="number" v-model.number="ext0x0D.minute" />
        <text class="form-label">秒</text>
        <input class="form-input" type="number" v-model.number="ext0x0D.second" />
      </view>
      <view class="form-row">
        <button class="btn" type="primary" @click="send('readRtc0x0D')">读取 RTC 0x0D</button>
        <button class="btn" type="default" @click="send('writeRtc0x0D')">写入 RTC 0x0D</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">气囊手动充放气 0x0E</view>
      <view class="status-row">通道：0 头部气囊；1 颈部气囊。操作：1 充气 2 放气 3 保持。时间：秒。</view>
      <view class="form-row">
        <text class="form-label">通道(0/1)</text>
        <input class="form-input" type="number" v-model.number="ext0x0E.channel" />
      </view>
      <view class="form-row">
        <text class="form-label">操作(1/2/3)</text>
        <input class="form-input" type="number" v-model="ext0x0E.mode" />
      </view>
      <view class="form-row">
        <text class="form-label">时间(秒)</text>
        <input class="form-input" type="number" v-model.number="ext0x0E.seconds" />
        <button class="btn-mini" type="primary" @click="send('readAirbag0x0E')">读取 0x0E</button>
        <button class="btn-mini" type="default" @click="send('writeAirbag0x0E')">写入 0x0E</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">实时枕头状态</view>
      <view class="status-row">工作状态：{{ statusInfo.workStatusText }}</view>
      <view class="status-row">故障码1：{{ statusInfo.fault1 }}，故障码2：{{ statusInfo.fault2 }}</view>
      <view class="status-row">气泵1状态：{{ statusInfo.pump1Text }}，气泵2状态：{{ statusInfo.pump2Text }}</view>
      <view class="status-row">加热片温度：{{ statusInfo.temperature }} ℃</view>
      <view class="status-row">
        气阀状态：{{ statusInfo.valveBits.join(' / ') }}
      </view>
      <view class="status-row">RTC时间：{{ statusInfo.rtcText }}</view>
      <view class="status-row">气压1：{{ statusInfo.press1 }}（放大100倍）</view>
      <view class="status-row">气压2：{{ statusInfo.press2 }}（放大100倍）</view>
    </view>

    <view class="log-section">
      <view class="section-title">最近一次发送的指令（16进制展示）</view>
      <scroll-view scroll-y class="log-box">
        <text selectable>{{ lastHex }}</text>
      </scroll-view>
    </view>

    <view class="log-section">
      <view class="section-title">最近一次状态上报（原始16进制）</view>
      <scroll-view scroll-y class="log-box">
        <text selectable>{{ lastStatusHex }}</text>
      </scroll-view>
    </view>

    <view class="log-section">
      <view class="section-title-row">
        <text class="section-title">调试日志（下发 / 设备返回）</text>
        <button class="btn-clear-log" size="mini" type="default" @click="clearDebugLogs">清空</button>
      </view>
      <view class="status-row log-hint">含 notify 原始 HEX、功能字节摘要；完整内容见控制台 [bleTest]</view>
      <scroll-view scroll-y class="log-box debug-log-box" :scroll-into-view="logScrollAnchor">
        <view
          v-for="(line, idx) in debugLogs"
          :key="idx"
          :id="'log-' + idx"
          class="log-line"
        >
          <text selectable>{{ line }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import blue_class from '@/utils/BlueManager'
import BluePillowProtocol, { crc16Modbus } from '@/utils/BlueUtils'
import { ab2hex } from '@/common/util.js'

export default {
  data() {
    return {
      debugLogs: [],
      logScrollAnchor: '',
      lastHex: '',
      lastStatusHex: '',
      scanning: false,
      devices: [],
      connected: false,
      connectedDeviceName: '',
      currentDeviceId: '',
      statusInfo: {
        workStatus: 0,
        workStatusText: '',
        fault1: 0,
        fault2: 0,
        pump1: 0,
        pump2: 0,
        pump1Text: '',
        pump2Text: '',
        temperature: 0,
        valve: 0,
        valveBits: [],
        rtcText: '',
        press1: 0,
        press2: 0
      },
      form: {
        headHeight: 50,
        neckHeight: 40,
        heatTemp: 40,
        readProfileIndex: 0,
        profileIndex: 0,
        supineHead: 50,
        supineNeck: 40,
        supineHeadWindow: 0,
        supineNeckWindow: 0,
        sideHead: 60,
        sideNeck: 50,
        sideHeadWindow: 0,
        sideNeckWindow: 0
      },
      posture: {
        limitText: '',
        flagsText: ''
      },
      ext0x0C: {
        stabilitySeconds: 30
      },
      ext0x0D: {
        year: 25,
        month: 3,
        day: 20,
        hour: 12,
        minute: 0,
        second: 0
      },
      ext0x0E: {
        channel: 0,
        mode: '',
        seconds: 30
      }
    }
  },
  onLoad() {
    // 只注册一次设备发现监听：iOS 上反复 off/on 易导致回调丢失；Android 也避免重复叠加
    this._deviceFoundHandler = (res) => {
      if (!this.scanning) return
      const list = this._normalizeBleDeviceList(res)
      this.mergeDevicesFromList(list)
    }
    uni.onBluetoothDeviceFound(this._deviceFoundHandler)
    this._listenerDetached = false
    this.updateConnectState()
    uni.$on('bluetooth_status_change', this.updateConnectState)
    uni.$on('xx', this.handleNotify)
    uni.$on('ble_write_result', this.onBleWriteResult)
  },
  onShow() {
    this._bleTeardownDone = false
    this.updateConnectState()
    // 离开本页时 teardown 会 off 监听；页面缓存再次进入时 onLoad 不执行，需补注册
    if (this._listenerDetached && this._deviceFoundHandler) {
      uni.onBluetoothDeviceFound(this._deviceFoundHandler)
      this._listenerDetached = false
    }
  },
  onHide() {
    this.teardownBlePage()
  },
  onUnload() {
    this.teardownBlePage()
    uni.$off('bluetooth_status_change', this.updateConnectState)
    uni.$off('xx', this.handleNotify)
    uni.$off('ble_write_result', this.onBleWriteResult)
  },
  methods: {
    onBleWriteResult(payload) {
      if (!payload) return
      if (payload.ok) {
        return
      }
      const msg = payload.errMsg || (payload.err && JSON.stringify(payload.err)) || '未知错误'
      const code = payload.err && (payload.err.errCode != null ? payload.err.errCode : payload.err.code)
      const extra = [msg, code != null ? `code=${code}` : '', payload.hex ? `hex=${payload.hex}` : '']
        .filter(Boolean)
        .join(' | ')
      this.appendBleLog('WRITE_FAIL', extra)
    },
    /** 时间戳 + 写入内存 + 控制台，便于真机调试 */
    appendBleLog(tag, message) {
      const line = `[${this._formatLogTime()}] ${tag} ${message}`
      this.debugLogs.push(line)
      const max = 250
      if (this.debugLogs.length > max) {
        this.debugLogs.splice(0, this.debugLogs.length - max)
      }
      this.logScrollAnchor = 'log-' + (this.debugLogs.length - 1)
      console.log('[bleTest]', line)
    },
    _formatLogTime() {
      const d = new Date()
      const p = (n) => (n < 10 ? '0' : '') + n
      const ms = ('00' + d.getMilliseconds()).slice(-3)
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${ms}`
    },
    clearDebugLogs() {
      this.debugLogs = []
      this.logScrollAnchor = ''
    },
    _byte2hex(b) {
      return ('0' + (b & 0xff).toString(16)).slice(-2).toUpperCase()
    },
    /** 根据协议（上传 AA + 小端长度 + 功能号…）生成一行可读摘要，仅用于日志 */
    describeDevicePayload(buffer) {
      try {
        const dv = new DataView(buffer)
        const n = dv.byteLength
        if (n < 4) {
          return `len=${n}（过短）`
        }
        const start = dv.getUint8(0)
        const startHex = '0x' + this._byte2hex(start)
        if (start !== 0xaa) {
          return `首字节=${startHex} len=${n}（非 AA 上传帧）`
        }
        const bodyLen = dv.getUint16(1, true)
        const func = dv.getUint8(3)
        const funcHex = '0x' + this._byte2hex(func)
        console.log('[bleTest describeDevicePayload]', 'dv=', dv, 'func=', func, 'funcHex=', funcHex)
        const isAckBit = (func & 0x80) !== 0
        // 写命令应答：功能号与写命令一致 + 1 字节应答码（协议「写命令应答」表）
        if (n >= 5 && bodyLen === 2) {
          const ack = dv.getUint8(4)
          const ackText = ack === 0 ? '成功' : `失败码=${ack}`
          return `AA 功能=${funcHex} 写应答 ${ackText}`
        }
        // 协议：读应答功能字节 = 0x80 | 原功能号，故 0x04 读回应为 0x84；部分固件也可能发 0x04
        if ((func & 0x7f) === 0x04) {
          const st = this.parseStatusFromBuffer(buffer)
          if (st) {
            return `AA 枕头数据(0x04) 功能=${funcHex} 工作:${st.workStatusText} 故障:${st.fault1}/${st.fault2} 温:${st.temperature}℃`
          }
        }
        return `AA 功能=${funcHex}(${isAckBit ? '读类应答' : '数据'}) 声明len=${bodyLen} 总字节=${n}`
      } catch (e) {
        return '摘要解析异常'
      }
    },
    initBle() {
      const instance = blue_class.getInstance()
      // 先停止扫描，避免适配器处于「正在搜寻」导致后续 open/scan 异常
      uni.stopBluetoothDevicesDiscovery({
        complete: () => {
          uni.openBluetoothAdapter({
            success: () => {
              instance.bluetoothStatus = 'open'
              this.appendBleLog('BLE', 'openBluetoothAdapter 成功')
              uni.showToast({
                title: '蓝牙已就绪',
                icon: 'none'
              })
            },
            fail: (err) => {
              console.error('openBluetoothAdapter fail', err)
              this.appendBleLog('BLE', `openBluetoothAdapter 失败 ${JSON.stringify(err)}`)
              // 兜底：关闭适配器后再开（常见于上次未释放状态）
              uni.closeBluetoothAdapter({
                complete: () => {
                  uni.openBluetoothAdapter({
                    success: () => {
                      instance.bluetoothStatus = 'open'
                      this.appendBleLog('BLE', 'openBluetoothAdapter 重试成功')
                      uni.showToast({
                        title: '已重新打开蓝牙',
                        icon: 'none'
                      })
                    },
                    fail: (err2) => {
                      console.error('openBluetoothAdapter retry fail', err2)
                      this.appendBleLog('BLE', `openBluetoothAdapter 重试仍失败 ${JSON.stringify(err2)}`)
                      instance.bluetoothStatus = 'error'
                      uni.showToast({
                        title: '请打开手机蓝牙后重试',
                        icon: 'none'
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    },
    toggleScan() {
      if (this.scanning) {
        this.stopScan()
      } else {
        this.startScan()
      }
    },
    /** 兼容不同端回调结构 */
    _normalizeBleDeviceList(res) {
      if (!res) return []
      if (res.devices && res.devices.length) return res.devices
      if (res.deviceId) return [res]
      return []
    },
    mergeDevicesFromList(list) {
      if (!list || !list.length) return
      list.forEach((d) => {
        if (!d || !d.deviceId) return
        const exists = this.devices.find((x) => x.deviceId === d.deviceId)
        if (!exists) {
          this.devices.push({
            name: d.name || d.localName || '',
            deviceId: d.deviceId
          })
        }
      })
    },
    clearScanPollTimer() {
      if (this._scanPollTimer) {
        clearInterval(this._scanPollTimer)
        this._scanPollTimer = null
      }
    },
    /** iOS 上 onBluetoothDeviceFound 常不稳定，需配合 getBluetoothDevices 拉已发现列表 */
    syncBluetoothDevicesFromCache() {
      uni.getBluetoothDevices({
        success: (res) => {
          this.mergeDevicesFromList(res.devices || [])
        },
        fail: (e) => {
          console.warn('getBluetoothDevices fail', e)
        }
      })
    },
    startScan() {
      const that = this
      if (!that._deviceFoundHandler) {
        uni.showToast({ title: '页面未就绪', icon: 'none' })
        return
      }
      const isIos = uni.getSystemInfoSync().platform === 'ios'
      uni.stopBluetoothDevicesDiscovery({
        complete: () => {
          that.clearScanPollTimer()
          that.devices = []
          // 先置为扫描中，避免首包回调早于 success 被丢弃
          that.scanning = true
          uni.startBluetoothDevicesDiscovery({
            // iOS 建议 true 以持续收到广播；Android 用 false 去重
            allowDuplicatesKey: isIos,
            success() {
              that.appendBleLog('SCAN', 'startBluetoothDevicesDiscovery 已开始')
              that.syncBluetoothDevicesFromCache()
              if (isIos) {
                that._scanPollTimer = setInterval(() => {
                  if (that.scanning) {
                    that.syncBluetoothDevicesFromCache()
                  }
                }, 1500)
              }
            },
            fail(err) {
              console.error('startBluetoothDevicesDiscovery fail', err)
              that.appendBleLog('SCAN', `startBluetoothDevicesDiscovery 失败 ${JSON.stringify(err)}`)
              that.scanning = false
              uni.showToast({
                title: '扫描失败，请先初始化或重进本页',
                icon: 'none'
              })
            }
          })
        }
      })
    },
    stopScan() {
      this.clearScanPollTimer()
      this.scanning = false
      this.appendBleLog('SCAN', '已停止扫描')
      uni.stopBluetoothDevicesDiscovery({
        complete() {}
      })
    },
    /**
     * 离开测试页时释放：停止扫描、移除监听、断开 BLE（避免适配器占用导致再次进入无法扫描）
     */
    teardownBlePage() {
      if (this._bleTeardownDone) return
      this._bleTeardownDone = true
      this.clearScanPollTimer()
      this.scanning = false
      try {
        if (this._deviceFoundHandler) {
          uni.offBluetoothDeviceFound(this._deviceFoundHandler)
          this._listenerDetached = true
        }
      } catch (e) {
        console.warn('teardown offBluetoothDeviceFound', e)
      }
      const instance = blue_class.getInstance()
      uni.stopBluetoothDevicesDiscovery({
        complete: () => {
          const deviceId = this.currentDeviceId || instance.deviceId
          if (!deviceId) {
            this.connected = false
            this.currentDeviceId = ''
            this.connectedDeviceName = ''
            return
          }
          instance.setManualDisconnecting(true)
          uni.closeBLEConnection({
            deviceId,
            complete: () => {
              instance.loginSuccess = false
              instance.deviceId = ''
              instance.deviceName = ''
              instance.serviceId = ''
              instance.characteristicId = '6E400004-B5A3-F393-E0A9-E50E24DCCA9E'
              instance.isNotify = false
              this.connected = false
              this.connectedDeviceName = ''
              this.currentDeviceId = ''
              this.devices = []
              uni.$emit('bluetooth_status_change')
            },
            fail: (err) => {
              console.error('teardown closeBLEConnection fail', err)
              instance.loginSuccess = false
              instance.deviceId = ''
              instance.deviceName = ''
              instance.serviceId = ''
              instance.characteristicId = '6E400004-B5A3-F393-E0A9-E50E24DCCA9E'
              instance.isNotify = false
              this.connected = false
              this.currentDeviceId = ''
              this.devices = []
              uni.$emit('bluetooth_status_change')
            }
          })
        }
      })
    },
    connectDevice(device) {
      const instance = blue_class.getInstance()
      const deviceId = device.deviceId
      const name = device.name || ''

      uni.createBLEConnection({
        deviceId,
        success: () => {
          console.log('createBLEConnection success', deviceId)
          this.appendBleLog('CONN', `createBLEConnection 成功 name=${name || '-'} id=${deviceId}`)
          instance.deviceId = deviceId
          instance.updateDeviceName(name)
          instance.loginSuccess = true
          this.connected = true
          this.connectedDeviceName = name || deviceId
          this.currentDeviceId = deviceId
          // 列表中只保留当前已连接的设备
          this.devices = [{
            name,
            deviceId
          }]
          this.stopScan()
          this.initServicesAndNotify(deviceId)
        },
        fail: (err) => {
          console.error('createBLEConnection fail', err)
          this.appendBleLog('CONN', `createBLEConnection 失败 ${JSON.stringify(err)}`)
          uni.showToast({
            title: '连接失败',
            icon: 'none'
          })
        }
      })
    },
    disconnectDevice() {
      const instance = blue_class.getInstance()
      const deviceId = this.currentDeviceId || instance.deviceId
      if (!deviceId) {
        return
      }
      instance.setManualDisconnecting(true)
      uni.closeBLEConnection({
        deviceId,
        success: () => {
          console.log('closeBLEConnection success', deviceId)
          this.appendBleLog('CONN', `closeBLEConnection 成功 id=${deviceId}`)
          this.connected = false
          this.connectedDeviceName = ''
          this.currentDeviceId = ''
          instance.loginSuccess = false
          instance.deviceId = ''
        },
        fail: (err) => {
          console.error('closeBLEConnection fail', err)
          this.appendBleLog('CONN', `closeBLEConnection 失败 ${JSON.stringify(err)}`)
          uni.showToast({
            title: '断开失败',
            icon: 'none'
          })
        }
      })
    },
    initServicesAndNotify(deviceId) {
      const that = this
      const instance = blue_class.getInstance()
      uni.getBLEDeviceServices({
        deviceId,
        success(res) {
          const services = res.services || []
          if (!services.length) {
            uni.showToast({
              title: '无服务',
              icon: 'none'
            })
            return
          }

          let writeServiceUUID = ''
          let writeCharUUID = ''
          let notifyServiceUUID = ''
          let notifyCharUUID = ''

          const findChars = (index) => {
            if (index >= services.length) {
              if (writeServiceUUID && writeCharUUID && notifyServiceUUID && notifyCharUUID) {
                // 将系统获取到的 serviceId / characteristicId 写回 BlueManager
                instance.serviceId = writeServiceUUID
                instance.characteristicId = writeCharUUID
                that.appendBleLog(
                  'GATT',
                  `写特征=${writeCharUUID} notify=${notifyCharUUID}`
                )
                instance.startNotice({
                  deviceUUID: deviceId,
                  serviceUUID: notifyServiceUUID,
                  notifyUUID: notifyCharUUID
                })
                uni.showToast({
                  title: '连接完成',
                  icon: 'success'
                })
              } else {
                uni.showToast({
                  title: '未找到可用特征值',
                  icon: 'none'
                })
              }
              return
            }

            const serviceId = services[index].uuid
            uni.getBLEDeviceCharacteristics({
              deviceId,
              serviceId,
              success(cres) {
                const chars = cres.characteristics || []
                chars.forEach((ch) => {
                  const props = ch.properties || {}
                  // 选一个支持写入的特征作为写特征
                  if (!writeCharUUID && (props.write || props.writeNoResponse)) {
                    writeServiceUUID = serviceId
                    writeCharUUID = ch.uuid
                  }
                  // 选一个支持 notify 的特征作为通知特征
                  if (!notifyCharUUID && props.notify) {
                    notifyServiceUUID = serviceId
                    notifyCharUUID = ch.uuid
                  }
                })
                findChars(index + 1)
              },
              fail() {
                findChars(index + 1)
              }
            })
          }

          findChars(0)
        },
        fail(err) {
          console.error('getBLEDeviceServices fail', err)
          that.appendBleLog('GATT', `getBLEDeviceServices 失败 ${JSON.stringify(err)}`)
          uni.showToast({
            title: '获取服务失败',
            icon: 'none'
          })
        }
      })
    },
    updateConnectState() {
      const instance = blue_class.getInstance()
      this.connected = !!instance.loginSuccess
      this.connectedDeviceName = instance.deviceName || instance.deviceId || ''
    },
    handleNotify(res) {
      if (!res || !res.value) {
        this.appendBleLog('<<', '(notify 无 value)')
        return
      }
      const buffer = res.value
      const hex = ab2hex(buffer)
      const cid = (res.characteristicId || '').slice(0, 36)
      const summary = this.describeDevicePayload(buffer)
      this.appendBleLog('<<', `${summary} | ${hex}${cid ? ' | char=' + cid : ''}`)
      this.lastStatusHex = hex
      const status = this.parseStatusFromBuffer(buffer)
      if (status) {
        this.statusInfo = status
      }
    },
    parseStatusFromBuffer(buffer) {
      try {
        const dv = new DataView(buffer)
        const n = dv.byteLength
        if (n < 5) return null
        const start = dv.getUint8(0)
        if (start !== 0xaa && start !== 0xAA) return null
        const func = dv.getUint8(3)
        
        if ((func & 0x7f) !== 0x04) return null

        let offset = 4
        // 存在精简包与完整包，先保证基础状态字段可读。
        if (n < offset + 7) return null
        const workStatus = dv.getUint8(offset++)
        const fault1 = dv.getUint8(offset++)
        const fault2 = dv.getUint8(offset++)
        const pump1 = dv.getUint8(offset++)
        const pump2 = dv.getUint8(offset++)
        const temperature = dv.getUint8(offset++)
        const valve = dv.getUint8(offset++)

        // 与协议文档「读取枕头数据 0x04」工作状态一致
        const workStatusMap = {
          0: '空闲',
          1: '仰卧',
          2: '侧卧'
        }

        const pumpStatusMap = {
          0: '正常',
          1: '异常'
        }

        const valveBits = []
        for (let i = 0; i < 4; i++) {
          valveBits.push(`阀${i + 1}:${(valve >> i) & 0x01 ? '开' : '关'}`)
        }

        const result = {
          workStatus,
          workStatusText: workStatusMap[workStatus] || String(workStatus),
          fault1,
          fault2,
          pump1,
          pump2,
          pump1Text: pumpStatusMap[pump1] || String(pump1),
          pump2Text: pumpStatusMap[pump2] || String(pump2),
          temperature,
          valve,
          valveBits
        }
        const fullPayloadNeed = 32 + 6 + 4
        const compactPayloadNeed = 6 + 4
        const remain = n - offset

        if (remain >= fullPayloadNeed) {
          // 完整包：含 16*uint16 睡姿 + RTC + 2 路压力
          offset += 16 * 2
          const year = dv.getUint8(offset++)
          const month = dv.getUint8(offset++)
          const day = dv.getUint8(offset++)
          const hour = dv.getUint8(offset++)
          const minute = dv.getUint8(offset++)
          const second = dv.getUint8(offset++)
          const press1 = dv.getUint16(offset, true)
          offset += 2
          const press2 = dv.getUint16(offset, true)
          result.rtcText = `${year}-${month}-${day} ${hour}:${minute}:${second}`
          result.press1 = press1
          result.press2 = press2
          result.packetType = 'full'
          return result
        }

        if (remain >= compactPayloadNeed) {
          // 简版包：无睡姿数组，仅带 RTC + 2 路压力（常见 len=18/总长=23）
          const year = dv.getUint8(offset++)
          const month = dv.getUint8(offset++)
          const day = dv.getUint8(offset++)
          const hour = dv.getUint8(offset++)
          const minute = dv.getUint8(offset++)
          const second = dv.getUint8(offset++)
          const press1 = dv.getUint16(offset, true)
          offset += 2
          const press2 = dv.getUint16(offset, true)
          result.rtcText = `${year}-${month}-${day} ${hour}:${minute}:${second}`
          result.press1 = press1
          result.press2 = press2
          result.packetType = 'compact'
          return result
        }

        result.packetType = 'base'
        return result
      } catch (e) {
        console.error('parseStatusFromBuffer error', e)
        return null
      }
    },
    ensureConnected() {
      const instance = blue_class.getInstance()
      if (!instance.loginSuccess) {
        uni.showModal({
          title: '提示',
          content: '请先在本页连接枕头设备',
          showCancel: false,
          confirmText: '我知道了'
        })
        return false
      }
      return true
    },
    send(action) {
      if (!this.ensureConnected()) return

      let buffer = null
      try {
        switch (action) {
          case 'readDeviceInfo':
            buffer = BluePillowProtocol.readDeviceInfo()
            break
          case 'readSupineConfig':
            buffer = BluePillowProtocol.readSupineConfig(this.form.readProfileIndex)
            break
          case 'readSideConfig':
            buffer = BluePillowProtocol.readSideConfig(this.form.readProfileIndex)
            break
          case 'readPillowStatus':
            buffer = BluePillowProtocol.readPillowStatus()
            break
          case 'readHeadHeight':
            buffer = BluePillowProtocol.headHeight()
            break
          case 'readNeckHeight':
            buffer = BluePillowProtocol.neckHeight()
            break
          case 'setHeadHeight':
            buffer = BluePillowProtocol.headHeight(this.form.headHeight)
            break
          case 'setNeckHeight':
            buffer = BluePillowProtocol.neckHeight(this.form.neckHeight)
            break
          case 'setSupineConfig':
            buffer = BluePillowProtocol.writeSupineConfig({
              index: this.form.profileIndex,
              headHeight: this.form.supineHead,
              headWindow: this.form.supineHeadWindow,
              neckHeight: this.form.supineNeck,
              neckWindow: this.form.supineNeckWindow
            })
            break
          case 'setSideConfig':
            buffer = BluePillowProtocol.writeSideConfig({
              index: this.form.profileIndex,
              headHeight: this.form.sideHead,
              headWindow: this.form.sideHeadWindow,
              neckHeight: this.form.sideNeck,
              neckWindow: this.form.sideNeckWindow
            })
            break
          case 'startSupineLearn':
            buffer = BluePillowProtocol.learnPosture({
              mode: 0x01,
              state: 0x02
            })
            break
          case 'confirmSupineLearn':
            buffer = BluePillowProtocol.learnPosture({
              mode: 0x01,
              state: 0x04
            })
            break
          case 'startSideLearn':
            buffer = BluePillowProtocol.learnPosture({
              mode: 0x02,
              state: 0x02
            })
            break
          case 'confirmSideLearn':
            buffer = BluePillowProtocol.learnPosture({
              mode: 0x02,
              state: 0x04
            })
            break
          case 'startHeating':
            // 限制加热温度在 0~45℃ 之间
            if (this.form.heatTemp < 0) this.form.heatTemp = 0
            if (this.form.heatTemp > 45) this.form.heatTemp = 45
            buffer = BluePillowProtocol.heating({
              on: true,
              targetTemperature: this.form.heatTemp
            })
            break
          case 'stopHeating':
            buffer = BluePillowProtocol.heating({
              on: false,
              targetTemperature: 0
            })
            break
          case 'startSpineAdjust':
            buffer = BluePillowProtocol.spineAdjust({
              headHeight: 60,
              neckHeight: 50,
              times: 1,
              holdTime1: 10,
              holdTime2: 10
            })
            break
          case 'writePostureConfig': {
            const limits = this.posture.limitText
              .split(',')
              .map((s) => Number(s.trim()))
              .filter((v) => !Number.isNaN(v))
            const flags = this.posture.flagsText
              .split(',')
              .map((s) => Number(s.trim()))
              .filter((v) => !Number.isNaN(v))
            if (!limits.length || !flags.length) {
              uni.showToast({
                title: '请先填写限位值和有效位',
                icon: 'none'
              })
              return
            }
            buffer = BluePillowProtocol.writePostureConfig({
              limit16: limits,
              validFlags: flags
            })
            break
          }
          case 'readPostureData':
            buffer = BluePillowProtocol.readPostureData()
            break
          case 'readPillowParams0x0C':
            buffer = BluePillowProtocol.pillowParams()
            break
          case 'writePillowParams0x0C':
            buffer = BluePillowProtocol.pillowParams(this.ext0x0C.stabilitySeconds)
            break
          case 'readRtc0x0D':
            buffer = BluePillowProtocol.rtcConfig()
            break
          case 'writeRtc0x0D':
            buffer = BluePillowProtocol.rtcConfig(this.ext0x0D)
            break
          case 'readAirbag0x0E':
            buffer = BluePillowProtocol.airbagManual()
            break
          case 'writeAirbag0x0E': {
            const m = this.ext0x0E.mode
            const modeOpt = (m === '' || m === null || typeof m === 'undefined')
              ? undefined
              : Number(m)
            buffer = BluePillowProtocol.airbagManual({
              channel: this.ext0x0E.channel,
              mode: modeOpt,
              seconds: this.ext0x0E.seconds
            })
            break
          }
          case 'calibrateEnter':
            buffer = BluePillowProtocol.calibrate(0x01)
            break
          case 'calibrateExit':
            buffer = BluePillowProtocol.calibrate(0x02)
            break
			case 'calibrateSuccess':
			buffer = BluePillowProtocol.calibrate(0x03)
			break
          default:
            uni.showToast({
              title: '未知指令',
              icon: 'none'
            })
            return
        }
      } catch (e) {
        console.error('构建指令失败:', e)
        uni.showToast({
          title: '构建指令失败',
          icon: 'none'
        })
        return
      }

      if (!buffer) {
        uni.showToast({
          title: '指令为空',
          icon: 'none'
        })
        return
      }

      // 记录 hex 展示
      this.lastHex = ab2hex(buffer)
      this.appendBleLog('>>', `${action} | ${this.lastHex}`)

      // 真正下发到枕头
      blue_class.getInstance().write2tooth(buffer)
    }
  }
}
</script>

<style lang="scss">
.container {
  padding: 24rpx;
  box-sizing: border-box;
}

.title {
  font-size: 34rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.tips {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.section {
  margin-bottom: 32rpx;
}

.form-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}

.form-label {
  font-size: 26rpx;
  margin-right: 8rpx;
}

.form-input {
  flex: 1;
  min-width: 120rpx;
  padding: 8rpx 12rpx;
  margin-right: 8rpx;
  border-radius: 6rpx;
  border: 1px solid #ddd;
  font-size: 26rpx;
}

.textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 12rpx;
  border-radius: 6rpx;
  border: 1px solid #ddd;
  font-size: 26rpx;
  margin-bottom: 12rpx;
  box-sizing: border-box;
}

.ble-status {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 6rpx;
}

.ble-row {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
  margin-bottom: 12rpx;
}

.btn-half {
  width: 48%;
}

.device-list {
  margin-top: 8rpx;
}

.device-item {
  padding: 8rpx 0;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.device-name {
  font-size: 26rpx;
  color: #333;
}

.device-id {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 12rpx;
}

.btn {
  margin-bottom: 12rpx;
}

.btn-mini {
  margin-left: 4rpx;
  margin-bottom: 8rpx;
  font-size: 24rpx;
  padding: 0 12rpx;
}

.log-section {
  margin-top: 16rpx;
}

.status-row {
  font-size: 26rpx;
  margin-bottom: 4rpx;
}

.log-box {
  margin-top: 8rpx;
  height: 200rpx;
  padding: 12rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 24rpx;
  word-break: break-all;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.section-title-row .section-title {
  margin-bottom: 0;
}

.btn-clear-log {
  margin-left: 12rpx;
}

.log-hint {
  color: #888;
  font-size: 22rpx;
  margin-bottom: 8rpx;
}

.debug-log-box {
  height: 420rpx;
  font-family: monospace;
}

.log-line {
  font-size: 22rpx;
  line-height: 1.45;
  margin-bottom: 6rpx;
  word-break: break-all;
}
</style>

