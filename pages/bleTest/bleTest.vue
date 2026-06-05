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
      <button class="btn" type="primary" @click="send('readPostureData')">读取睡姿数据 0x0B 读</button>
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
      <view class="form-row">
        <text class="form-label">加热时间(秒,uint16)</text>
        <input class="form-input" type="number" v-model.number="form.heatDurationSeconds" />
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
      <view class="status-row" style="margin-bottom: 12rpx; font-size: 24rpx; color: #666;">
        睡姿学习：每次「开始学习」前先读 0x0B；仰卧峰值1/2 为有效点位最小值与最大值；仰卧宽度 5、侧卧宽度 2；侧卧下发峰值 = 计算侧卧峰值 − x。
      </view>
      <view class="form-row">
        <text class="form-label">侧卧偏移 x</text>
        <input class="form-input" type="number" v-model.number="form.learnSidePeakOffsetX" placeholder="下发侧卧峰值=计算值−x" />
      </view>
      <view class="status-row" style="margin-bottom: 8rpx; font-size: 24rpx; color: #333;" v-if="learnPreviewText">
        {{ learnPreviewText }}
      </view>
      <button class="btn" type="warn" @click="onLearnPostureClick('supine', 'start')">仰卧学习 开始 0x07</button>
      <button class="btn" type="warn" @click="onLearnPostureClick('supine', 'confirm')">仰卧学习 确认 0x07</button>
      <button class="btn" type="warn" @click="onLearnPostureClick('side', 'start')">侧卧学习 开始 0x07</button>
      <button class="btn" type="warn" @click="onLearnPostureClick('side', 'confirm')">侧卧学习 确认 0x07</button>
      <button class="btn" type="warn" @click="send('stopHeating')">停止加热 0x08</button>
      <button class="btn" type="warn" @click="send('startSpineAdjust')">脊柱微调 启动 0x09</button>
      <button class="btn" type="warn" @click="send('calibrateEnter')">标定 0x0A 双气囊同步进入(0x01)</button>
      <button class="btn" type="warn" @click="send('calibrateNeck')">标定 0x0A 颈枕气囊(0x03)</button>
      <button class="btn" type="warn" @click="send('calibrateHead')">标定 0x0A 头枕气囊(0x04)</button>
      <button class="btn" type="warn" @click="send('calibrateSuccess')">标定 0x0A 成功(0x02)</button>
      <button class="btn" type="warn" @click="send('calibrateExit')">标定 0x0A 退出(0x05)</button>
	  
    </view>

    <view class="section">
      <view class="section-title">睡姿数据配置 / 读取 0x0B</view>
      <view class="status-row">限位值与有效位均为 16 个点，使用英文逗号分隔。读取与上方「基础读取」中 0x0B 读为同一指令。</view>
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
      <view class="section-title">枕头参数 0x0C（睡姿稳定 + 压力维持）</view>
      <view class="status-row">睡姿稳定时间 uint16 秒；头枕/颈枕压力变化维持时间各 uint16 毫秒；写命令数据区共 6 字节小端。</view>
      <view class="form-row-0x0c-grid">
        <view class="col-0x0c-left">
          <view class="form-row-0x0c-line">
            <text class="form-label">稳定(秒)</text>
            <input class="form-input form-input-0x0c" type="number" v-model.number="ext0x0C.stabilitySeconds" />
          </view>
          <view class="form-row-0x0c-line">
            <text class="form-label">头枕(ms)</text>
            <input class="form-input form-input-0x0c" type="number" v-model.number="ext0x0C.headPressureHoldMs" />
          </view>
        </view>
        <view class="col-0x0c-right">
          <view class="form-row-0x0c-line">
            <text class="form-label">颈枕(ms)</text>
            <input class="form-input form-input-0x0c" type="number" v-model.number="ext0x0C.neckPressureHoldMs" />
          </view>
          <view class="form-row-0x0c-btns">
            <button class="btn-mini" type="primary" @click="send('readPillowParams0x0C')">读取 0x0C</button>
            <button class="btn-mini" type="default" @click="send('writePillowParams0x0C')">写入 0x0C</button>
          </view>
        </view>
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
      <view class="section-title">心率模块 0x0F 控制帧（仅蓝牙）</view>
      <view class="status-row">
        经枕头 BLE 下发 9 字节载荷（8 数据 + XOR 校验），不调用手机 Wi-Fi。设备写应答、心率模块回传（含 5A5A 等）在下方调试日志与「最近一次状态上报」中查看。
      </view>
      <view class="form-row align-switch">
        <text class="form-label">配置 WiFi 位 0x0A</text>
        <switch :checked="heartWifi.configWifi" @change="onHeartWifiSwitch('configWifi', $event)" />
        <text class="form-label" style="margin-left: 24rpx;">查询状态位 0x0A</text>
        <switch :checked="heartWifi.queryStatus" @change="onHeartWifiSwitch('queryStatus', $event)" />
      </view>
      <view class="form-row">
        <text class="form-label">字节4(byte3)</text>
        <input class="form-input" type="number" v-model.number="heartWifi.byte3" />
        <text class="form-label">备用×3</text>
        <input class="form-input form-input-narrow" type="number" v-model.number="heartWifi.spare0" />
        <input class="form-input form-input-narrow" type="number" v-model.number="heartWifi.spare1" />
        <input class="form-input form-input-narrow" type="number" v-model.number="heartWifi.spare2" />
      </view>
      <view class="status-row mono-preview">
        9 字节：{{ heartWifiFrameHex }}　｜　CHK=0x{{ heartWifiChkHex }}（十进制 {{ heartWifiChkDec }}）
      </view>
      <view class="status-row">
        配网页默认参数：`configWifi=true`、`queryStatus=false`、`byte3=0`、备用字节全 0，对应 9 字节应为
        `5A 5A 0A 00 00 00 00 00 0A`
      </view>
      <view class="ble-row">
        <button class="btn-half" type="primary" @click="sendHeartWifi0x0F">下发指令 0x0F</button>
        <button class="btn-half" type="default" @click="queryWifiNetworkStatus">查询联网状态</button>
      </view>
      <view class="ble-row">
        <button class="btn-half" type="warn" @click="queryWifiStatusOnly8F">只发一包 0x8F</button>
      </view>
      <view class="status-row" style="font-size: 24rpx; color: #666;">
        「查询联网状态」分两步：① **第一帧功能码必须是 0x0F（写）**，把 5A5A 查询帧透传给模块（故日志里仍是 …000f…，属正常）；② 约 200ms 后第二帧才是 **0x8F（读，0x0F|0x80）** 取回数据。请在日志中查看第二包 5501008f… 及后续 AA 长帧中含 5B5B（联网 0A/05）。
      </view>
      <view class="status-row" style="font-size: 24rpx; color: #2f855a;">
        联网状态解析：{{ wifiLinkStatusText }}
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
import BluePillowProtocol, { crc16Modbus, PillowBleManager } from '@/utils/BlueUtils'
import { ab2hex, buildHeartModuleWifiFrame9 } from '@/common/util.js'

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
      wifiLinkStatusText: '未解析',
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
        heatDurationSeconds: 1800,
        readProfileIndex: 0,
        profileIndex: 0,
        supineHead: 50,
        supineNeck: 40,
        supineHeadWindow: 0,
        supineNeckWindow: 0,
        sideHead: 60,
        sideNeck: 50,
        sideHeadWindow: 0,
        sideNeckWindow: 0,
        /** 侧卧下发峰值 = 0x0B 计算的侧卧峰值 − x */
        learnSidePeakOffsetX: 0
      },
      /** 与正式睡姿页一致：下发前由 0x0B 填充，确认步沿用缓存 */
      learnProfile: {
        supinePeak1: 0,
        supinePeak2: 0,
        supineWidth: 5,
        sidePeak: 0,
        sideWidth: 2
      },
      lastLearnValidCount: 0,
      learnPreviewText: '',
      posture: {
        limitText: '',
        flagsText: ''
      },
      ext0x0C: {
        stabilitySeconds: 30,
        headPressureHoldMs: 0,
        neckPressureHoldMs: 0
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
      },
      /** 心率模块 0x0F 控制帧参数（与 util buildHeartModuleWifiFrame9 一致） */
      heartWifi: {
        configWifi: true,
        queryStatus: false,
        byte3: 0,
        spare0: 0,
        spare1: 0,
        spare2: 0
      }
    }
  },
  computed: {
    heartWifiFrameBytes() {
      return buildHeartModuleWifiFrame9({
        configWifi: this.heartWifi.configWifi,
        queryStatus: this.heartWifi.queryStatus,
        byte3: this.heartWifi.byte3,
        spare567: [this.heartWifi.spare0, this.heartWifi.spare1, this.heartWifi.spare2]
      })
    },
    heartWifiFrameHex() {
      return this.heartWifiFrameBytes.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2).toUpperCase()).join(' ')
    },
    heartWifiChkHex() {
      const c = this.heartWifiFrameBytes[8] & 0xff
      return ('0' + c.toString(16)).slice(-2).toUpperCase()
    },
    heartWifiChkDec() {
      return this.heartWifiFrameBytes[8] & 0xff
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
    // applyWifiProvisionPreset() {
    //   this.heartWifi = {
    //     configWifi: true,
    //     queryStatus: false,
    //     byte3: 0,
    //     spare0: 0,
    //     spare1: 0,
    //     spare2: 0
    //   }
    //   this.appendBleLog('PRESET', `已恢复配网页默认 0x0F：${this.heartWifiFrameHex}`)
    //   uni.showToast({ title: '已恢复配网页默认参数', icon: 'none' })
    // },
    onHeartWifiSwitch(key, e) {
      const v = e.detail && e.detail.value
      if (typeof v === 'boolean') {
        this.$set(this.heartWifi, key, v)
      }
    },
    sendHeartWifi0x0F() {
      if (!this.ensureConnected()) return
      const bytes = this.heartWifiFrameBytes
      let buffer
      try {
        buffer = BluePillowProtocol.heartRateModule({ read: false, data: bytes })
      } catch (err) {
        console.error(err)
        uni.showToast({ title: '组包失败', icon: 'none' })
        return
      }
      this.lastHex = ab2hex(buffer)
      this.appendBleLog(
        '>>',
        `0x0F_control CHK=0x${this.heartWifiChkHex} | ${this.lastHex}`
      )
      PillowBleManager.getInstance().write2tooth(buffer)
    },
    /**
     * 固定「仅查联网状态」：先 0x0F 写透传（5A5A 且 queryStatus=1），间隔约 200ms 再发 **读命令 0x8F**（协议：0x0F|0x80，无数据区）；结果在 notify 长帧中含 5B5B 上发（联网字节 0A/05）。
     */
    queryWifiNetworkStatus() {
      if (!this.ensureConnected()) return
      const frame9 = buildHeartModuleWifiFrame9({
        configWifi: false,
        queryStatus: true,
        byte3: 0,
        spare567: [0, 0, 0]
      })
      let buffer
      try {
        buffer = BluePillowProtocol.heartRateModule({ read: false, data: frame9 })
      } catch (err) {
        console.error(err)
        uni.showToast({ title: '组包失败', icon: 'none' })
        return
      }
      this.lastHex = ab2hex(buffer)
      const hex9 = frame9.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join(' ')
      this.appendBleLog('>>', `0x0F 查询联网状态 写透传[${hex9}] | BLE ${this.lastHex}`)
      PillowBleManager.getInstance().write2tooth(buffer)
      const delayMs = 220
      if (this._wifiStatusReadTimer) {
        clearTimeout(this._wifiStatusReadTimer)
        this._wifiStatusReadTimer = null
      }
      this._wifiStatusReadTimer = setTimeout(() => {
        this._wifiStatusReadTimer = null
        let readBuf
        try {
          readBuf = BluePillowProtocol.heartRateModule({ read: true })
        } catch (e) {
          console.error(e)
          this.appendBleLog('ERR', `0x8F 读命令组包失败 ${e && e.message}`)
          return
        }
        const readHex = ab2hex(readBuf)
        this.appendBleLog('>>', `0x8F 读心率/WiFi模块(间隔 ${delayMs}ms) ${readHex}`)
        PillowBleManager.getInstance().write2tooth(readBuf)
      }, delayMs)
      uni.showToast({ title: '已下发查询', icon: 'none' })
    },
    /** 仅发送一包 0x8F（55 01 00 8F FE E4），不做前置 0x0F 写透传。 */
    queryWifiStatusOnly8F() {
      if (!this.ensureConnected()) return
      let readBuf
      try {
        readBuf = BluePillowProtocol.heartRateModule({ read: true })
      } catch (e) {
        console.error(e)
        this.appendBleLog('ERR', `0x8F 单包组包失败 ${e && e.message}`)
        uni.showToast({ title: '组包失败', icon: 'none' })
        return
      }
      const readHex = ab2hex(readBuf)
      this.lastHex = readHex
      this.appendBleLog('>>', `0x8F 单包查询 ${readHex}`)
      PillowBleManager.getInstance().write2tooth(readBuf)
      uni.showToast({ title: '已发送0x8F', icon: 'none' })
    },
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
          const fn = (func & 0x7f) === 0x0f ? '心率模块0x0F ' : ''
          return `AA ${fn}功能=${funcHex} 写应答 ${ackText}`
        }
        // 协议：读应答功能字节 = 0x80 | 原功能号，故 0x04 读回应为 0x84；部分固件也可能发 0x04
        if ((func & 0x7f) === 0x04) {
          const st = this.parseStatusFromBuffer(buffer)
          if (st) {
            return `AA 枕头数据(0x04) 功能=${funcHex} 工作:${st.workStatusText} 故障:${st.fault1}/${st.fault2} 温:${st.temperature}℃ 头/颈高(0~100%):${st.headHeightPct}%/${st.neckHeightPct}%`
          }
        }
        if ((func & 0x7f) === 0x0c) {
          try {
            const parsed = PillowBleManager.getInstance().handleNotifyBuffer(buffer)
            if (parsed && parsed.type === 'pillow_params_0x0c' && parsed.parsed && parsed.parsed.ok) {
              const p = parsed.parsed
              const d = (n) => String((Number(n) >>> 0) & 0xffff)
              return `AA 枕头参数(0x0C) 功能=${funcHex} 十进制 稳定=${d(p.stabilitySeconds)}秒 头枕维持=${d(p.headPressureHoldMs)}ms 颈枕维持=${d(p.neckPressureHoldMs)}ms`
            }
          } catch (e) {}
        }
        if ((func & 0x7f) === 0x0f) {
          let hint = ''
          if (n >= 6 && dv.getUint8(4) === 0x5a && dv.getUint8(5) === 0x5a) {
            hint = ' 载荷含5A5A(心率侧回显)'
          }
          if (n >= 6 && dv.getUint8(4) === 0x5b && dv.getUint8(5) === 0x5b) {
            hint += (hint ? '；' : ' ') + '载荷含5B5B(WiFi/联网上发)'
          }
          const readTag = isAckBit ? '读应答' : '数据'
          return `AA 心率模块 功能=${funcHex}(${readTag}) 声明len=${bodyLen} 总字节=${n}${hint}`
        }
        return `AA 功能=${funcHex}(${isAckBit ? '读类应答' : '数据'}) 声明len=${bodyLen} 总字节=${n}`
      } catch (e) {
        return '摘要解析异常'
      }
    },
    initBle() {
      const instance = PillowBleManager.getInstance()
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
      if (this._wifiStatusReadTimer) {
        clearTimeout(this._wifiStatusReadTimer)
        this._wifiStatusReadTimer = null
      }
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
      const instance = PillowBleManager.getInstance()
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
      const instance = PillowBleManager.getInstance()
      const deviceId = device.deviceId
      const name = device.name || ''

      uni.createBLEConnection({
        deviceId,
        success: () => {
          console.log('createBLEConnection success', deviceId)
          this.appendBleLog('CONN', `createBLEConnection 成功 name=${name || '-'} id=${deviceId}`)
          instance.deviceId = deviceId
          instance.updateDeviceName(name)
          this.connectedDeviceName = name || deviceId
          this.currentDeviceId = deviceId
          // 列表中只保留当前已连接的设备
          this.devices = [{
            name,
            deviceId
          }]
          this.stopScan()
          this.updateConnectState()
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
      const instance = PillowBleManager.getInstance()
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
      const instance = PillowBleManager.getInstance()
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
                // 将系统获取到的 serviceId / characteristicId 写回 PillowBleManager 实例
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
      const instance = PillowBleManager.getInstance()
      // notify 成功前：已有 deviceId 视为物理连接中；成功后以 loginSuccess 为准
      this.connected = !!instance.loginSuccess || !!this.currentDeviceId
      this.connectedDeviceName = instance.deviceName || instance.deviceId || this.connectedDeviceName || ''
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
      try {
        const parsed = PillowBleManager.getInstance().handleNotifyBuffer(buffer)
        if (parsed && parsed.type === 'pillow_params_0x0c' && parsed.parsed && parsed.parsed.ok) {
          const p = parsed.parsed
          const u16 = (n) => (Number(n) >>> 0) & 0xffff
          this.$set(this.ext0x0C, 'stabilitySeconds', u16(p.stabilitySeconds))
          this.$set(this.ext0x0C, 'headPressureHoldMs', u16(p.headPressureHoldMs))
          this.$set(this.ext0x0C, 'neckPressureHoldMs', u16(p.neckPressureHoldMs))
        }
      } catch (e) {}
      const wifiStatus = this.parseWifiStatusFrom0x0F(buffer)
      if (wifiStatus) {
        this.wifiLinkStatusText = wifiStatus.statusText
        this.appendBleLog('WIFI', `${wifiStatus.statusText} | ${wifiStatus.frameHex} | ${wifiStatus.source}`)
      }
      const status = this.parseStatusFromBuffer(buffer)
      if (status) {
        this.statusInfo = status
      }
    },
    /**
     * 解析 0x0F/0x8F 上报中的联网状态：
     * - 二进制透传：直接包含 5B 5B xx xx xx xx xx xx CHK
     * - ASCII 文本：例如 "5b 5b 0 0 a 0 0 0 a\\r\\n"
     */
    parseWifiStatusFrom0x0F(buffer) {
      try {
        const dv = new DataView(buffer)
        const n = dv.byteLength
        if (n < 6) return null
        if (dv.getUint8(0) !== 0xaa) return null
        const bodyLen = dv.getUint16(1, true)
        const func = dv.getUint8(3)
        if ((func & 0x7f) !== 0x0f) return null
        const dataLen = bodyLen - 1
        if (dataLen <= 0 || 4 + dataLen > n) return null
        const payload = new Uint8Array(buffer, 4, dataLen)

        const binFrame = this._findWifiFrame9(payload)
        if (binFrame) {
          return this._buildWifiStatusResult(binFrame, 'bin-5b5b')
        }

        const asciiBytes = this._extractAsciiHexBytes(payload)
        if (!asciiBytes || !asciiBytes.length) return null
        const asciiFrame = this._findWifiFrame9(Uint8Array.from(asciiBytes))
        if (!asciiFrame) return null
        return this._buildWifiStatusResult(asciiFrame, 'ascii-5b5b')
      } catch (e) {
        console.warn('parseWifiStatusFrom0x0F error', e)
        return null
      }
    },
    _extractAsciiHexBytes(payload) {
      const txt = Array.from(payload)
        .map((b) => String.fromCharCode(b & 0xff))
        .join('')
      const tokens = txt.match(/[0-9a-fA-F]{1,2}/g)
      if (!tokens || tokens.length < 9) return []
      const out = []
      for (let i = 0; i < tokens.length; i++) {
        const v = parseInt(tokens[i], 16)
        if (!Number.isNaN(v)) out.push(v & 0xff)
      }
      return out
    },
    _findWifiFrame9(bytesLike) {
      const bytes = bytesLike instanceof Uint8Array ? bytesLike : Uint8Array.from(bytesLike || [])
      if (bytes.length < 9) return null
      for (let i = 0; i <= bytes.length - 9; i++) {
        if (bytes[i] !== 0x5b || bytes[i + 1] !== 0x5b) continue
        let xor = 0
        for (let j = 0; j < 8; j++) xor ^= bytes[i + j]
        if ((xor & 0xff) === (bytes[i + 8] & 0xff)) {
          return Array.from(bytes.slice(i, i + 9))
        }
      }
      return null
    },
    _buildWifiStatusResult(frame9, source) {
      const statusByte = frame9[4] & 0xff
      const statusText =
        statusByte === 0x0a
          ? '已联网(0x0A)'
          : statusByte === 0x05
            ? '未联网(0x05)'
            : `未知状态(0x${this._byte2hex(statusByte)})`
      const frameHex = frame9.map((b) => this._byte2hex(b)).join(' ')
      return { statusByte, statusText, frameHex, source }
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
        /** 0x04 数据区 21B（末两头枕/颈枕为 uint16 LE）+ 功能 1B；含 CRC 时总长 27 */
        if (n < offset + 21) return null
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

        /** 协议 0x04：气压泵1/2 工作状态，0 空闲、1 充气中 */
        const pumpStatusMap = {
          0: '空闲',
          1: '充气中'
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
        const year = dv.getUint8(offset++)
        const month = dv.getUint8(offset++)
        const day = dv.getUint8(offset++)
        const hour = dv.getUint8(offset++)
        const minute = dv.getUint8(offset++)
        const second = dv.getUint8(offset++)
        const press1 = dv.getUint16(offset, true)
        offset += 2
        const press2 = dv.getUint16(offset, true)
        offset += 2
        result.rtcText = `${year}-${month}-${day} ${hour}:${minute}:${second}`
        result.press1 = press1
        result.press2 = press2
        result.headHeightPct = dv.getUint16(offset, true)
        offset += 2
        result.neckHeightPct = dv.getUint16(offset, true)
        offset += 2
        result.packetType = '0x04_full'
        return result
      } catch (e) {
        console.error('parseStatusFromBuffer error', e)
        return null
      }
    },
    ensureConnected() {
      const instance = PillowBleManager.getInstance()
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
    /**
     * 与正式睡姿页 study.vue 一致：仰卧峰值2 须大于峰值1；侧卧峰值下限等约束。
     */
    normalizeLearnProfileForBleTest() {
      const clampU16 = (v) => {
        let n = Number(v)
        if (Number.isNaN(n)) n = 0
        return Math.max(0, Math.min(65535, Math.floor(n)))
      }
      const clampU8 = (v) => {
        let n = Number(v)
        if (Number.isNaN(n)) n = 0
        return Math.max(0, Math.min(255, Math.floor(n)))
      }
      let supinePeak1 = clampU16(this.learnProfile.supinePeak1)
      let supinePeak2 = clampU16(this.learnProfile.supinePeak2)
      let sidePeak = clampU16(this.learnProfile.sidePeak)
      const supineWidth = clampU8(this.learnProfile.supineWidth)
      const sideWidth = clampU8(this.learnProfile.sideWidth)
      if (supinePeak2 <= supinePeak1) {
        supinePeak2 = Math.min(65535, supinePeak1 + 2)
      }
      const minSidePeak = Math.min(65535, supinePeak2 + 100)
      if (sidePeak < minSidePeak) {
        sidePeak = minSidePeak
      }
      this.learnProfile = {
        supinePeak1,
        supinePeak2,
        supineWidth,
        sidePeak,
        sideWidth
      }
    },
    _collectValidPointsFromSnap(snap) {
      const flags = Array.isArray(snap.validFlags) ? snap.validFlags : []
      const samples = Array.isArray(snap.postureSamples) ? snap.postureSamples : []
      const validValues = []
      for (let i = 0; i < Math.min(flags.length, samples.length); i++) {
        if (Number(flags[i])) {
          validValues.push(Number(samples[i]) || 0)
        }
      }
      return validValues
    },
    _updateLearnPreview(posture) {
      const lp = this.learnProfile
      const x = Number(this.form.learnSidePeakOffsetX)
      const xn = Number.isNaN(x) ? 0 : Math.max(0, Math.floor(x))
      if (posture === 'supine') {
        this.learnPreviewText = `0x0B：仰卧峰值1=${lp.supinePeak1} 峰值2=${lp.supinePeak2} 仰卧宽/侧卧宽=${lp.supineWidth}/${lp.sideWidth} 有效点=${this.lastLearnValidCount}`
      } else {
        const sent = Math.max(0, lp.sidePeak - xn)
        this.learnPreviewText = `0x0B：侧卧计算峰值=${lp.sidePeak} 下发侧卧峰值=${sent}(−${xn}) 仰卧1/2=${lp.supinePeak1}/${lp.supinePeak2} 有效点=${this.lastLearnValidCount}`
      }
    },
    async onLearnPostureClick(posture, phase) {
      if (!this.ensureConnected()) return
      const ble = PillowBleManager.getInstance()
      try {
        if (phase === 'start') {
          uni.showLoading({ title: '读取睡姿数据…', mask: true })
          const snap = await ble.readPostureSnapshot0x0B({ silent: true, timeoutMs: 8000 })
          uni.hideLoading()
          if (!snap || !snap.ok) {
            uni.showToast({ title: '读取睡姿数据失败', icon: 'none' })
            return
          }
          this.lastLearnValidCount = Number(snap.validPointCount) || 0
          const validValues = this._collectValidPointsFromSnap(snap)
          if (posture === 'supine') {
            if (validValues.length) {
              this.learnProfile.supinePeak1 = Math.min(...validValues)
              this.learnProfile.supinePeak2 = Math.max(...validValues)
            } else {
              this.learnProfile.supinePeak1 = 0
              this.learnProfile.supinePeak2 = 0
            }
          } else {
            const rawSide = validValues.length ? Math.max(...validValues) : 0
            this.learnProfile.sidePeak = rawSide
          }
          this.learnProfile.supineWidth = 5
          this.learnProfile.sideWidth = 2
          this.normalizeLearnProfileForBleTest()
          this._updateLearnPreview(posture)
        }
        const offsetX = Number(this.form.learnSidePeakOffsetX)
        const x = Number.isNaN(offsetX) ? 0 : Math.max(0, Math.floor(offsetX))
        let sidePeakSend = this.learnProfile.sidePeak
        if (posture === 'side') {
          sidePeakSend = Math.max(0, Math.min(65535, this.learnProfile.sidePeak - x))
        }
        const mode = posture === 'supine' ? 0x01 : 0x02
        const state = phase === 'start' ? 0x02 : 0x04
        const buffer = BluePillowProtocol.learnPosture({
          mode,
          state,
          postureValidLimit: this.lastLearnValidCount,
          supinePeak1: this.learnProfile.supinePeak1,
          supinePeak2: this.learnProfile.supinePeak2,
          supineWidth: this.learnProfile.supineWidth,
          sidePeak: sidePeakSend,
          sideWidth: this.learnProfile.sideWidth
        })
        this.lastHex = ab2hex(buffer)
        const tag = `${posture}-${phase}`
        const sideNote =
          posture === 'side'
            ? ` sidePeak下发=${sidePeakSend}(计算${this.learnProfile.sidePeak}-x${x})`
            : ''
        this.appendBleLog(
          '>>',
          `learn0x07 ${tag} valid=${this.lastLearnValidCount}${sideNote} | ${this.lastHex}`
        )
        PillowBleManager.getInstance().write2tooth(buffer)
        uni.showToast({ title: '已下发 0x07', icon: 'none' })
      } catch (e) {
        uni.hideLoading()
        console.warn('[bleTest] onLearnPostureClick', e)
        const msg =
          e && e.message === 'read_posture_timeout' ? '读取睡姿数据超时' : '读取睡姿数据失败'
        uni.showToast({ title: msg, icon: 'none' })
      }
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
          case 'startHeating':
            // 限制加热温度在 0~45℃ 之间
            if (this.form.heatTemp < 0) this.form.heatTemp = 0
            if (this.form.heatTemp > 45) this.form.heatTemp = 45
            buffer = BluePillowProtocol.heating({
              on: true,
              targetTemperature: this.form.heatTemp,
              durationSeconds: this.form.heatDurationSeconds
            })
            break
          case 'stopHeating':
            buffer = BluePillowProtocol.heating({
              on: false,
              targetTemperature: 0,
              durationSeconds: 0
            })
            break
          case 'startSpineAdjust':
            buffer = BluePillowProtocol.spineAdjust({
              headHeight: 60,
              neckHeight: 50,
              neckRelaxHeight: 40,
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
            buffer = BluePillowProtocol.pillowParams({
              stabilitySeconds: this.ext0x0C.stabilitySeconds,
              headPressureHoldMs: this.ext0x0C.headPressureHoldMs,
              neckPressureHoldMs: this.ext0x0C.neckPressureHoldMs
            })
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
          case 'calibrateNeck':
            buffer = BluePillowProtocol.calibrate(0x03)
            break
          case 'calibrateHead':
            buffer = BluePillowProtocol.calibrate(0x04)
            break
          case 'calibrateSuccess':
            buffer = BluePillowProtocol.calibrate(0x02)
            break
          case 'calibrateExit':
            buffer = BluePillowProtocol.calibrate(0x05)
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
      PillowBleManager.getInstance().write2tooth(buffer)
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
  color: rgba(5, 28, 44, 0.7);
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
  border: 1px solid rgba(175, 160, 201, 0.45);
  font-size: 26rpx;
}

.textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 12rpx;
  border-radius: 6rpx;
  border: 1px solid rgba(175, 160, 201, 0.45);
  font-size: 26rpx;
  margin-bottom: 12rpx;
  box-sizing: border-box;
}

.ble-status {
  font-size: 26rpx;
  color: #051C2C;
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
  border-bottom: 1px solid rgba(175, 160, 201, 0.4);
  display: flex;
  flex-direction: column;
}

.device-name {
  font-size: 26rpx;
  color: #051C2C;
}

.device-id {
  font-size: 22rpx;
  color: rgba(5, 28, 44, 0.7);
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
  background-color: #F0F6F7;
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
  color: rgba(5, 28, 44, 0.65);
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

.picker-value {
  flex: 1;
  padding: 12rpx 16rpx;
  border: 1px solid rgba(175, 160, 201, 0.45);
  border-radius: 6rpx;
  font-size: 26rpx;
  color: #051C2C;
}

.mono-preview {
  font-family: monospace;
  font-size: 22rpx;
  line-height: 1.5;
  word-break: break-all;
}

.align-switch {
  align-items: center;
  gap: 8rpx;
}

.form-input-narrow {
  flex: 0 0 100rpx;
  min-width: 80rpx;
  text-align: center;
}

/* 0x0C：一排两列；右列为颈枕 + 读/写按钮 */
.form-row-0x0c-grid {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.col-0x0c-left {
  flex: 1;
  min-width: 0;
  padding-right: 20rpx;
  box-sizing: border-box;
}

.col-0x0c-right {
  flex: 0 0 280rpx;
  width: 280rpx;
  max-width: 46%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.form-row-0x0c-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 12rpx;
}

.form-row-0x0c-line .form-label {
  flex-shrink: 0;
  margin-right: 8rpx;
}

.form-row-0x0c-line .form-input-0x0c {
  flex: 1;
  width: auto;
  min-width: 0;
  max-width: none;
  margin-right: 0;
  margin-bottom: 0;
}

.form-input-0x0c {
  box-sizing: border-box;
}

.form-row-0x0c-btns {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 0;
}

.form-row-0x0c-btns .btn-mini {
  margin-left: 0;
  margin-right: 12rpx;
  margin-bottom: 8rpx;
}
</style>

