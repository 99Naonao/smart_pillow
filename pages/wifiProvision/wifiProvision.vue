<template>
  <scroll-view scroll-y class="page">
    <view class="hero-card">
      <view class="hero-badge">设备联网向导</view>
      <view class="hero-title">枕头 Wi-Fi 配网</view>
      <view class="hero-desc">
        请先在首页连接枕头，再填写 <text class="em">2.4G Wi-Fi</text> 名称和密码。页面会自动完成进入配网、搜索设备和联网下发。
      </view>
      <view class="step-row">
        <view class="step-chip active">1. 连接枕头</view>
        <view class="step-chip active">2. 输入 Wi-Fi</view>
        <view class="step-chip" :class="{ active: scanning || goodSleepDevices.length }">3. 选择设备</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">Wi-Fi 信息</view>
      <view class="field-block">
        <view class="label">Wi-Fi 名称</view>
        <view class="wifi-select-box" :class="wifiSelectBoxClass">
          <view class="wifi-select-left">当前选择</view>
          <view class="wifi-select-right">
            <input
              class="wifi-select-input"
              v-model="wifiSsid"
              :placeholder="ssidPlaceholder"
              :focus="ssidInputFocused"
              confirm-type="done"
              maxlength="32"
              @focus="onWifiInputFocus"
              @blur="onWifiInputBlur"
            />
            <view
              v-if="!isIOS"
              class="wifi-select-arrow"
              :class="{ 'wifi-select-arrow--open': showWifiDropdown }"
              @click="toggleWifiDropdown"
            >
              <image class="wifi-select-arrow-icon" src="../../static/icon/down.png" mode="aspectFit"></image>
            </view>
          </view>
        </view>

        <view v-if="showWifiDropdown && !isIOS" class="wifi-dropdown">
          <view v-if="scanningWifiList" class="wifi-dropdown-empty">正在读取 Wi-Fi 列表...</view>
          <view v-else-if="!wifiCandidates.length" class="wifi-dropdown-empty">暂无可选 Wi-Fi</view>
          <view v-else>
            <view
              v-for="item in wifiCandidates"
              :key="item.ssid"
              class="wifi-dropdown-item"
              @click="onSelectWifiCandidate(item)"
            >
              <text class="wifi-dropdown-name">{{ item.ssid }}</text>
              <view class="wifi-dropdown-tags">
                <text v-if="item.isCurrent" class="wifi-dropdown-tag">当前网络</text>
                <text v-if="item.is5G" class="wifi-dropdown-tag wifi-dropdown-tag--warn">5G</text>
              </view>
            </view>
          </view>
        </view>

        <view class="ssid-tool-row">
          <view class="ssid-primary-btn" @click="fillCurrentWifi()">
            <text class="ssid-primary-btn-title">
              {{ readingCurrentWifi ? '正在读取当前 Wi-Fi...' : '点击此按钮可自动填写当前 Wi-Fi' }}
            </text>
            <text class="ssid-primary-btn-sub">优先读取手机当前已连接的网络名称，减少手动输入</text>
          </view>
        </view>

        <view class="ssid-action-row">
          <text v-if="isIOS" class="ssid-action" @click="prepareManualWifiInput">重新输入</text>
          <text v-if="wifiSsid" class="ssid-action" @click="clearWifiSsid">清空</text>
        </view>
        <view class="form-tip">{{ ssidAssistText }}</view>
        <view class="remember-row" @click="rememberWifi = !rememberWifi">
          <view class="remember-check" :class="{ 'remember-check--active': rememberWifi }">
            <text class="remember-check-icon">{{ rememberWifi ? '✓' : '' }}</text>
          </view>
          <text class="remember-text">记住上次 Wi-Fi 名称</text>
        </view>
      </view>
      <view class="field-block">
        <view class="label">Wi-Fi 密码</view>
        <view class="password-row">
          <input
            class="input input--with-action"
            :password="!showWifiPassword"
            v-model="wifiPassword"
            placeholder="请输入 Wi-Fi 密码"
          />
          <text class="input-action" @click="showWifiPassword = !showWifiPassword">
            {{ showWifiPassword ? '隐藏密码' : '显示密码' }}
          </text>
        </view>
      </view>
    </view>

    <view class="card status-card" :class="phaseToneClass">
      <view class="card-title">当前状态</view>
      <view class="status-main">{{ phaseText }}</view>
      <view class="status-sub">{{ phaseHint }}</view>
    </view>

    <view class="action-row">
      <button class="btn btn-primary" type="primary" :disabled="busy" @click="runFullProvision">
        {{ primaryButtonText }}
      </button>
      <button class="btn btn-secondary" :disabled="busy || !scanning" @click="stopScanOnly">停止扫描</button>
    </view>

    <view v-if="phase === 'done'" class="card result-card">
      <view class="result-illustration">
        <view class="result-orbit result-orbit--one"></view>
        <view class="result-orbit result-orbit--two"></view>
        <view class="result-core">
          <text class="result-check">✓</text>
        </view>
      </view>
      <view class="result-title">联网成功</view>
      <view class="result-desc">
        设备已收到网络信息，请稍候片刻等待它完成联网。若设备侧仍未联上，可确认路由器为 2.4G 后重新配网。
      </view>
      <view class="result-chip">{{ resultChipText }}</view>
      <button
        class="btn btn-secondary result-reconnect-btn"
        :disabled="busy || !_savedPillowDeviceId"
        @click="manualReconnectOriginalPillow"
      >
        回连原蓝牙设备
      </button>
    </view>

    <view class="card" v-if="goodSleepDevices.length">
      <view class="card-title">请选择设备</view>
      <view class="device-tip">已发现 {{ goodSleepDevices.length }} 台可配网设备，请点击对应设备继续。</view>
      <view
        v-for="d in goodSleepDevices"
        :key="d.deviceId"
        class="device-item"
        @click="onPickGoodSleep(d)"
      >
        <view class="device-text">
          <text class="device-name">{{ d.displayName || 'MingaXXXX' }}</text>
          <text class="device-id">{{ d.deviceWifiMac ? ('MAC ' + d.deviceWifiMac) : d.deviceId }}</text>
        </view>
        <text class="device-action">连接</text>
      </view>
    </view>

    <view class="card tips-card">
      <view class="card-title">使用提示</view>
      <view class="tip-line">1. 请先在首页完成枕头蓝牙连接。</view>
      <view class="tip-line">2. 配网过程中请保持页面停留，不要切到后台。</view>
      <view class="tip-line">3. 若搜索不到设备，可重试一次或确认设备已进入配网状态。</view>
    </view>

    <view v-if="isDebugEnv" class="card debug-card">
      <view class="debug-head" @click="toggleLogs">
        <view>
          <view class="card-title">详细日志</view>
          <view class="debug-sub">仅测试环境展示，用于协助排查联网问题</view>
        </view>
        <text class="debug-toggle">{{ showLogs ? '收起' : '展开' }}</text>
      </view>
      <view v-if="showLogs" class="log-box">
        <view v-if="!logs.length" class="log-empty">暂无日志</view>
        <view v-for="(line, i) in logs" :key="i" class="log-line">{{ line }}</view>
      </view>
    </view>
  </scroll-view>
</template>

<script>
import BluePillowProtocol, { PillowBleManager, WifiToolManager } from '@/utils/BlueUtils'
import { buildHeartModuleWifiFrame9 } from '@/common/util.js'
import { needsBleMacFromAdvertisData } from '@/utils/platformBle.js'
import * as blufiModule from '@/utils/blufi/xBlufi.js'

const blufi = blufiModule.default || blufiModule
const isDebugEnv = process.env.NODE_ENV !== 'production'
const WIFI_SSID_STORAGE_KEY = 'wifiProvision:lastSsid'

function isProvisionBlufiDevice(device) {
  return WifiToolManager.isGoodSleepBleDevice(device)
}

export default {
  data() {
    return {
      wifiSsid: '',
      wifiPassword: '',
      platform: '',
      readingCurrentWifi: false,
      scanningWifiList: false,
      showWifiDropdown: false,
      ssidInputFocused: false,
      wifiCandidates: [],
      connectedWifiSsid: '',
      showWifiPassword: false,
      rememberWifi: true,
      phase: 'idle',
      busy: false,
      scanning: false,
      goodSleepDevices: [],
      /** GoodSleep 扫描阶段缓存的 advertisData（deviceId → hex），配网模式广播为空时回退 */
      goodSleepAdvCache: {},
      logs: [],
      showLogs: false,
      _provisionAckHandler: null,
      _blufiHandler: null,
      /** 防止重复触发配网发送 */
      _blufiRouterSent: false,
      /** 最近一次 BluFi 回调摘要（便于现场判断是否收到连路由结果） */
      lastBlufiEventText: '',
      /** 进入 BluFi 前缓存的枕头 BLE deviceId / 名称，用于配网成功后回连 */
      _savedPillowDeviceId: '',
      _savedPillowDeviceName: '',
      /** 用户点击的 GoodSleep（BluFi）设备，用于配网成功后断开 */
      _blufiDeviceId: '',
      _blufiDeviceName: '',
      /** 对齐 blue.js 的配网序列号 */
      _blufiSequenceCount: 0,
      /** 是否已收到连路由结果（type=4） */
      _routerResultReceived: false,
      /** 第二轮三包补发定时器 */
      _secondRoundTimer: null,
      /** 配网超时定时器（40s 未收到连路由结果则失败） */
      _wifiProvisionTimeout: null,
      /** 上次已输出的 BluFi 扫描诊断签名，避免重复刷屏 */
      _lastBlufiScanDiagKey: '',
      /** 是否已触发 notifyInitBleEsp32，避免重复连接回调重复初始化 */
      _blufiInitStarted: false,
      /** DH 协商超时后回退三包直写的定时器 */
      _blufiDhTimeout: null
    }
  },
  watch: {
    rememberWifi() {
      this.persistRememberedWifi()
    }
  },
  computed: {
    wifiSelectBoxClass() {
      return {
        'wifi-select-box--ios': this.platform === 'ios',
        'wifi-select-box--android': this.platform === 'android'
      }
    },
    isIOS() {
      return this.platform === 'ios'
    },
    ssidPlaceholder() {
      if (this.platform === 'ios') return '请输入当前连接的 2.4G Wi-Fi 名称'
      if (this.platform === 'android') return '选择网络或输入 2.4G Wi-Fi'
      return '选择网络或手动输入'
    },
    ssidAssistText() {
      if (this.platform === 'ios') {
        return 'iOS 不支持弹出 Wi-Fi 列表，请先在系统“无线局域网”中连接 2.4G 网络，再返回本页使用当前 Wi-Fi 或手动输入。'
      }
      if (this.platform === 'android') {
        return 'Android 下可直接读取 Wi-Fi 列表；若失败，请先开启定位权限并连接到 2.4G Wi-Fi。'
      }
      return '请选择或输入 2.4G Wi-Fi 名称。'
    },
    phaseText() {
      const m = {
        idle: '就绪',
        wait_0f_ack: '已下发配网指令，等待设备应答…',
        disconnecting: '正在断开当前蓝牙…',
        scanning: '正在搜索设备…',
        connecting: '正在连接设备…',
        init_esp: '正在配网中…',
        sending_wifi: '正在下发 wifi与密码…',
        reconnect_pillow: '正在切回枕头…',
        done: '配网成功',
        error: '流程中断，请重试'
      }
      return m[this.phase] || this.phase
    },
    phaseHint() {
      const m = {
        idle: '填写好 Wi-Fi 信息后，点击下方按钮开始。',
        wait_0f_ack: '正在通知枕头进入配网模式，请稍候。',
        disconnecting: '正在断开当前蓝牙连接，准备切换到配网设备。',
        scanning: '正在搜索可用于联网的配网设备（MingaXXXX）…',
        connecting: '正在连接配网设备，请保持手机靠近枕头。',
        init_esp: '正在与设备建立安全通信。',
        sending_wifi: '正在把 Wi-Fi 信息发送给设备。',
        reconnect_pillow: '已断开 GoodSleep 配网连接，正在重新连接枕头并下发联网状态查询。',
        done: '设备已收到网络信息，请稍等设备完成联网。',
        error: '请检查设备状态、Wi-Fi 信息与 2.4G 网络后重试。'
      }
      return m[this.phase] || '请按照页面提示完成联网。'
    },
    phaseToneClass() {
      if (this.phase === 'done') return 'status-card--success'
      if (this.phase === 'error') return 'status-card--error'
      if (this.busy || this.scanning) return 'status-card--active'
      return ''
    },
    primaryButtonText() {
      if (this.busy) return '处理中...'
      if (this.phase === 'done') return '重新配网'
      if (this.phase === 'reconnect_pillow') return '处理中…'
      return '开始配网'
    },
    resultChipText() {
      const ssid = (this.wifiSsid || '').trim()
      if (this.rememberWifi && ssid) {
        return `已记住 Wi-Fi 名称：${ssid}`
      }
      return '本次未记住 Wi-Fi 名称'
    },
    isDebugEnv() {
      return isDebugEnv
    }
  },
  onLoad() {
    this.wifiToolManager = new WifiToolManager(this, {
      storageKey: WIFI_SSID_STORAGE_KEY
    })
    this.initPlatform()
    this.restoreRememberedWifi()
    this.registerWifiListListener()
    if (this.rememberWifi && this.wifiSsid) {
      this.fillCurrentWifi(true)
    }
    this._blufiHandler = (result) => this.handleBlufiResult(result)
    try {
      blufi.initXBlufi(blufi.XMQTT_SYSTEM.WeChat)
      blufi.listenDeviceMsgEvent(true, this._blufiHandler)
      this.log('BluFi 已初始化（微信）')
    } catch (e) {
      console.error('[wifiProvision] BluFi init', e)
      uni.showToast({ title: 'BluFi 初始化失败', icon: 'none' })
    }
  },
  onUnload() {
    this.persistRememberedWifi()
    if (this._secondRoundTimer) {
      clearTimeout(this._secondRoundTimer)
      this._secondRoundTimer = null
    }
    this.clearBlufiDhTimeout()
    this.clearWifiProvisionTimeout()
    this.teardownProvisionListener()
    this.stopScanOnly()
    this.unregisterWifiListListener()
    try {
      if (this._blufiHandler) {
        blufi.listenDeviceMsgEvent(false, this._blufiHandler)
      }
    } catch (e) {}
    this._blufiHandler = null
    this.wifiToolManager = null
  },
  methods: {
    initPlatform() {
      this.wifiToolManager && this.wifiToolManager.initPlatform()
    },
    restoreRememberedWifi() {
      this.wifiToolManager && this.wifiToolManager.restoreRememberedWifi()
    },
    persistRememberedWifi() {
      this.wifiToolManager && this.wifiToolManager.persistRememberedWifi()
    },
    toggleLogs() {
      this.showLogs = !this.showLogs
    },
    registerWifiListListener() {
      this.wifiToolManager && this.wifiToolManager.registerWifiListListener()
    },
    unregisterWifiListListener() {
      this.wifiToolManager && this.wifiToolManager.unregisterWifiListListener()
    },
    upsertWifiCandidate(ssid) {
      this.wifiToolManager && this.wifiToolManager.upsertWifiCandidate(ssid)
    },
    upsertWifiCandidateObject(candidate) {
      this.wifiToolManager && this.wifiToolManager.upsertWifiCandidateObject(candidate)
    },
    showWifi5GBlockedModal(ssid) {
      this.wifiToolManager && this.wifiToolManager.showWifi5GBlockedModal(ssid)
    },
    clearWifiSsid() {
      this.wifiSsid = ''
    },
    onWifiInputFocus() {
      this.ssidInputFocused = true
      this.hideWifiDropdown()
    },
    onWifiInputBlur() {
      this.ssidInputFocused = false
    },
    hideWifiDropdown() {
      this.showWifiDropdown = false
    },
    toggleWifiDropdown() {
      if (this.isIOS) return
      this.ssidInputFocused = false
      if (typeof uni.hideKeyboard === 'function') {
        uni.hideKeyboard()
      }
      const nextVisible = !this.showWifiDropdown
      this.showWifiDropdown = nextVisible
      // 展开下拉时始终尝试刷新列表，避免先自动填入 5G 后只剩单条候选而不再触发扫描。
      if (nextVisible && !this.scanningWifiList) {
        this.openWifiSelector(true)
      }
    },
    onSelectWifiCandidate(candidate) {
      if (!candidate || !candidate.ssid) return
      if (candidate.is5G) {
        this.showWifi5GBlockedModal(candidate.ssid)
        return
      }
      this.wifiSsid = candidate.ssid
      this.upsertWifiCandidateObject(candidate)
      this.ssidInputFocused = false
      this.showWifiDropdown = false
    },
    prepareManualWifiInput() {
      this.wifiToolManager && this.wifiToolManager.prepareManualWifiInput()
    },
    fillCurrentWifi(silent = false) {
      return this.wifiToolManager && this.wifiToolManager.fillCurrentWifi(silent)
    },
    handleFillCurrentWifiFail(silent = false) {
      return this.wifiToolManager && this.wifiToolManager.handleFillCurrentWifiFail(silent)
    },
    async openWifiSelector(silent = false) {
      return this.wifiToolManager && this.wifiToolManager.openWifiSelector(silent)
    },
    ensureWifiPermissionForList() {
      return this.wifiToolManager
        ? this.wifiToolManager.ensureWifiPermissionForList()
        : Promise.resolve(false)
    },
    safeHideLoading() {
      try {
        uni.hideLoading({
          fail: () => {},
          complete: () => {}
        })
      } catch (e) {}
    },
    log(msg) {
      const t = new Date().toLocaleTimeString()
      this.logs.push(`[${t}] ${msg}`)
      if (this.logs.length > 80) this.logs.shift()
      console.log('[wifiProvision]', msg)
    },
    shortBleServiceUuids(device) {
      const uuids = (device && device.advertisServiceUUIDs) || []
      if (!uuids.length) return '-'
      return uuids
        .map((u) => {
          const s = String(u || '').toUpperCase()
          const m = s.match(/^0000([0-9A-F]{4})/)
          return m ? m[1] : s.slice(0, 8)
        })
        .join(',')
    },
    formatBlufiDeviceDiagLine(device, index) {
      const d = device || {}
      const name = String(d.name || '').trim() || '(no-name)'
      const localName = String(d.localName || '').trim()
      const localPart = localName && localName !== name ? ` local:${localName}` : ''
      const rssi = typeof d.RSSI === 'number' ? d.RSSI : '?'
      const svc = this.shortBleServiceUuids(d)
      const id = String(d.deviceId || '(no-id)')
      const idShort = id.length > 12 ? id.slice(0, 12) + '…' : id
      const adv = d.advertisData ? String(d.advertisData).slice(0, 16) : ''
      const advPart = adv ? ` adv:${adv}${String(d.advertisData).length > 16 ? '…' : ''}` : ''
      return `#${(index || 0) + 1} ${name}${localPart} RSSI=${rssi} svc=${svc} id=${idShort}${advPart}`
    },
    buildBlufiScanDiagKey(devices) {
      return (devices || [])
        .map((d) => `${d.deviceId || ''}|${d.name || ''}|${d.localName || ''}|${d.RSSI}|${this.shortBleServiceUuids(d)}`)
        .sort()
        .join(';;')
    },
    logBlufiScanDiagnostics(all) {
      const list = Array.isArray(all) ? all : []
      const key = this.buildBlufiScanDiagKey(list)
      if (key === this._lastBlufiScanDiagKey) return
      this._lastBlufiScanDiagKey = key
      if (!list.length) {
        this.log('[扫描诊断] 未扫到任何蓝牙设备（未过滤）')
        return
      }
      const goodSleepCount = list.filter((d) => isProvisionBlufiDevice(d)).length
      const summary = list.map((d, i) => this.formatBlufiDeviceDiagLine(d, i)).join(' ; ')
      this.log(
        `[扫描诊断] 共 ${list.length} 台（未过滤，GoodSleep/RTK ${goodSleepCount} 台）: ${summary}`
      )
    },
    /** 将 BluFi 回调打成可读的单行字符串（写入日志 + 页内「最近回调」） */
    formatBlufiResultForLog(result) {
      if (result == null) return 'null'
      try {
        const t = result.type != null ? String(result.type) : ''
        const r = result.result
        let dataStr = ''
        const d = result.data
        if (d === undefined || d === null) dataStr = ''
        else if (Array.isArray(d)) {
          dataStr = JSON.stringify({ _arrayLen: d.length, first: d[0] })
        } else if (typeof d === 'object') {
          dataStr = JSON.stringify(d)
        } else {
          dataStr = String(d)
        }
        return `type=${t} result=${JSON.stringify(r)} data=${dataStr}`
      } catch (e) {
        return '[formatBlufiResultForLog error]'
      }
    },
    setLastBlufiEventFromResult(result) {
      const line = this.formatBlufiResultForLog(result)
      const max = 420
      this.lastBlufiEventText = line.length > max ? line.slice(0, max) + '…' : line
    },
    encodeUtf8Char(ch) {
      const code = encodeURIComponent(ch)
      const bytes = []
      for (let i = 0; i < code.length; i++) {
        const c = code.charAt(i)
        if (c === '%') {
          const hex = code.charAt(i + 1) + code.charAt(i + 2)
          bytes.push(parseInt(hex, 16))
          i += 2
        } else {
          bytes.push(c.charCodeAt(0))
        }
      }
      return bytes
    },
    buildBlueStyleWifiFrames(ssid, password) {
      const seq = () => (this._blufiSequenceCount++) & 0xff
      const ssidPayload = [0x09, 0x00, seq()]
      const pwdPayload = [0x0d, 0x00, seq()]
      const connectPayload = [0x0c, 0x00, 0x02, seq()]
      const ssidBytes = []
      for (let i = 0; i < ssid.length; i++) {
        ssidBytes.push(...this.encodeUtf8Char(ssid[i]))
      }
      const pwdBytes = []
      for (let i = 0; i < password.length; i++) {
        pwdBytes.push(...this.encodeUtf8Char(password[i]))
      }
      ssidPayload.push(ssidBytes.length & 0xff)
      ssidPayload.push(...ssidBytes)
      pwdPayload.push(pwdBytes.length & 0xff)
      pwdPayload.push(...pwdBytes)
      return [
        new Uint8Array(ssidPayload).buffer,
        new Uint8Array(pwdPayload).buffer,
        new Uint8Array(connectPayload).buffer
      ]
    },
    resolveBlufiWritable() {
      const deviceId = this._blufiDeviceId
      return new Promise((resolve, reject) => {
        if (!deviceId) {
          reject(new Error('GoodSleep 设备未连接'))
          return
        }
        uni.getBLEDeviceServices({
          deviceId,
          success: (res) => {
            const services = (res && res.services) || []
            if (!services.length) {
              reject(new Error('未找到蓝牙服务'))
              return
            }
            const servicePriority = (uuid = '') => {
              const u = String(uuid).toUpperCase()
              if (u.indexOf('55535343-FE7D-4AE5-8FA9-9FAFD205E455') >= 0) return 100
              if (u.indexOf('0000FFFF-0000-1000-8000-00805F9B34FB') >= 0) return 50
              return 0
            }
            const sortedServices = services
              .slice()
              .sort((a, b) => servicePriority(b.uuid) - servicePriority(a.uuid))
            const tryServiceAt = (idx) => {
              if (idx >= sortedServices.length) {
                reject(new Error('未找到可写入的特征值'))
                return
              }
              const service = sortedServices[idx]
              uni.getBLEDeviceCharacteristics({
                deviceId,
                serviceId: service.uuid,
                success: (cres) => {
                  const chars = (cres && cres.characteristics) || []
                  if (!chars.length) {
                    tryServiceAt(idx + 1)
                    return
                  }
                  // 对齐 blue.js：优先固定写入通道 49535343-1E4D-4BD9-BA61-23C647249616
                  let found = chars.find((ch) => {
                    const p = ch.properties || {}
                    const cu = String(ch.uuid || '').toUpperCase()
                    return (
                      cu === '49535343-1E4D-4BD9-BA61-23C647249616' &&
                      (p.write || p.writeNoResponse)
                    )
                  })
                  if (!found) {
                    for (let i = 0; i < chars.length; i++) {
                      const p = chars[i].properties || {}
                      if (p.write || p.writeNoResponse) {
                        found = chars[i]
                        break
                      }
                    }
                  }
                  if (!found) {
                    tryServiceAt(idx + 1)
                    return
                  }
                  this.log(`选择配网写通道 service=${service.uuid} char=${found.uuid}`)
                  resolve({
                    deviceId,
                    serviceId: service.uuid,
                    characteristicId: found.uuid
                  })
                },
                fail: () => tryServiceAt(idx + 1)
              })
            }
            tryServiceAt(0)
          },
          fail: (err) => reject(new Error((err && err.errMsg) || '获取蓝牙服务失败'))
        })
      })
    },
    writeCharacteristicValueBlueStyle(dataBuffer) {
      return this.resolveBlufiWritable().then(({ deviceId, serviceId, characteristicId }) => {
        return new Promise((resolve, reject) => {
          uni.writeBLECharacteristicValue({
            deviceId,
            serviceId,
            characteristicId,
            value: dataBuffer,
            success: (res) => {
              this.log(
                `[三包写入成功] service=${serviceId} char=${characteristicId} len=${
                  (dataBuffer && dataBuffer.byteLength) || 0
                }`
              )
              resolve(res)
            },
            fail: (err) => reject(new Error((err && err.errMsg) || '特征值写入失败'))
          })
        })
      })
    },
    writeCharacteristicValueWithTarget({ deviceId, serviceId, characteristicId }, dataBuffer) {
      return new Promise((resolve, reject) => {
        uni.writeBLECharacteristicValue({
          deviceId,
          serviceId,
          characteristicId,
          value: dataBuffer,
          success: (res) => {
            this.log(
              `[三包写入成功] service=${serviceId} char=${characteristicId} len=${
                (dataBuffer && dataBuffer.byteLength) || 0
              }`
            )
            resolve(res)
          },
          fail: (err) => reject(new Error((err && err.errMsg) || '特征值写入失败'))
        })
      })
    },
    clearBlufiDhTimeout() {
      if (this._blufiDhTimeout) {
        clearTimeout(this._blufiDhTimeout)
        this._blufiDhTimeout = null
      }
    },
    startBlufiDhTimeout() {
      this.clearBlufiDhTimeout()
      this._blufiDhTimeout = setTimeout(() => {
        this._blufiDhTimeout = null
        if (this._blufiRouterSent || this.phase === 'done' || this.phase === 'error') return
        this.log('BluFi DH 协商超时（10s），回退三包直写')
        this.tryStartWifiConfigAfterDh('DH 超时回退')
      }, 10000)
    },
    tryStartWifiConfigAfterDh(reason) {
      if (this._blufiRouterSent) return
      const ssid = (this.wifiSsid || '').trim()
      const pwd = this.wifiPassword || ''
      if (!ssid || !pwd) return
      this._blufiRouterSent = true
      this.clearBlufiDhTimeout()
      this.log(`${reason}，开始三包下发`)
      void this.startWifiConfigBlueStyle()
    },
    async startWifiConfigBlueStyle() {
      const ssid = (this.wifiSsid || '').trim()
      const pwd = this.wifiPassword || ''
      if (!ssid || !pwd) {
        this.phase = 'error'
        this.busy = false
        uni.showToast({ title: '缺少 Wi-Fi 信息', icon: 'none' })
        return
      }
      this.phase = 'sending_wifi'
      this.startWifiProvisionTimeout()
      const [ssidBuf, pwdBuf, connectBuf] = this.buildBlueStyleWifiFrames(ssid, pwd)
      try {
        this.log('采用 blue.js 三包直写方式下发 0x09/0x0D/0x0C')
        const target = await this.resolveBlufiWritable()
        this.log(`三包复用写通道 service=${target.serviceId} char=${target.characteristicId}`)
        this.log(`0x09(hex)=${this.toHexCompact(ssidBuf)}`)
        await this.writeCharacteristicValueWithTarget(target, ssidBuf)
        this.log('0x09 写入完成')
        this.log(`0x0D(hex)=${this.toHexCompact(pwdBuf)}`)
        await this.writeCharacteristicValueWithTarget(target, pwdBuf)
        this.log('0x0D 写入完成')
        this.log(`0x0C(hex)=${this.toHexCompact(connectBuf)}`)
        await this.writeCharacteristicValueWithTarget(target, connectBuf)
        this.log('0x0C 写入完成（三包已全部发送）')
        // 对齐 blue 成功日志的“重复触发”特征：短延迟补发第二轮（仅在尚未收到 type=4 时）
        if (this._secondRoundTimer) {
          clearTimeout(this._secondRoundTimer)
          this._secondRoundTimer = null
        }
        this._secondRoundTimer = setTimeout(async () => {
          this._secondRoundTimer = null
          if (this._routerResultReceived || this.phase === 'done' || this.phase === 'error') return
          try {
            const [ssidBuf2, pwdBuf2, connectBuf2] = this.buildBlueStyleWifiFrames(ssid, pwd)
            this.log('未收到 type=4，触发第二轮三包补发')
            await this.writeCharacteristicValueWithTarget(target, ssidBuf2)
            await this.writeCharacteristicValueWithTarget(target, pwdBuf2)
            await this.writeCharacteristicValueWithTarget(target, connectBuf2)
            this.log('第二轮三包补发完成')
          } catch (e2) {
            this.log('第二轮三包补发失败: ' + ((e2 && e2.message) || String(e2)))
          }
        }, 350)
      } catch (e) {
        const msg = (e && e.message) || String(e)
        this.phase = 'error'
        this.busy = false
        this.log('发送 0x09/0x0D/0x0C 失败: ' + msg)
        uni.showModal({
          title: '配网发送失败',
          content: msg,
          showCancel: false
        })
      }
    },
    toHexCompact(bytesLike) {
      const u8 = bytesLike instanceof Uint8Array ? bytesLike : new Uint8Array(bytesLike || [])
      return Array.from(u8)
        .map((b) => ('0' + (b & 0xff).toString(16)).slice(-2))
        .join('')
    },
    normalizePayloadToHex(payload) {
      if (payload == null) return ''
      if (payload instanceof Uint8Array || payload instanceof ArrayBuffer) {
        return this.toHexCompact(payload).toLowerCase()
      }
      if (typeof payload === 'string') {
        const raw = payload.trim().toLowerCase()
        if (!raw) return ''
        // 纯连续 hex（如 5b5b0a00050000000f）
        const compact = raw.replace(/[^0-9a-f]/g, '')
        if (compact.length >= 2 && compact.length % 2 === 0) {
          return compact
        }
        // 分隔 token（如 "5b 5b a 0 5 0 0 0 f" 或 "0x5b,0x5b,0xa,...")
        const tokens = raw
          .replace(/[\[\]\(\),;]+/g, ' ')
          .split(/\s+/)
          .map((t) => t.trim())
          .filter(Boolean)
        if (!tokens.length) return ''
        const bytes = []
        for (let i = 0; i < tokens.length; i++) {
          let t = tokens[i]
          if (t.startsWith('0x')) t = t.slice(2)
          if (/^[0-9a-f]{1,2}$/.test(t)) {
            bytes.push(('0' + t).slice(-2))
            continue
          }
          if (/^\d{1,3}$/.test(t)) {
            const n = Number(t)
            if (!Number.isNaN(n) && n >= 0 && n <= 255) {
              bytes.push(n.toString(16).padStart(2, '0'))
              continue
            }
          }
          return ''
        }
        return bytes.join('')
      }
      return ''
    },
    persistWifiMacForSoap(device) {
      if (!this.wifiToolManager) return ''
      return this.wifiToolManager.persistWifiMacForSoap(device)
    },
    /** 配网点击 GoodSleep：仅用 GoodSleep 的 advertisData（可回退扫描缓存） */
    persistWifiMacAtProvisionPick(device) {
      if (!this.wifiToolManager) return ''
      const d = device || {}
      const advHex =
        this.wifiToolManager.normalizeAdvertisDataToHex(d.advertisData) ||
        this.wifiToolManager.normalizeAdvertisDataToHex(d.cachedAdvertisDataHex) ||
        this.wifiToolManager.normalizeAdvertisDataToHex(this.goodSleepAdvCache[d.deviceId] || '')
      if (advHex) {
        const saved = this.wifiToolManager.persistWifiMacFromGoodSleepDevice(
          { advertisData: advHex },
          { force: true }
        )
        if (!saved) {
          this.log(`配网：GoodSleep advertisData 未能解析 WiFi MAC, hex=${advHex}`)
        }
        return saved
      }
      if (needsBleMacFromAdvertisData(this.platform)) {
        const cached = this.wifiToolManager.resolveCachedSoapMac()
        if (cached) {
          this.log(`配网：GoodSleep 当前无广播，使用扫描阶段已保存 WiFi MAC ${cached}`)
          return cached
        }
        this.log('配网：GoodSleep 无 advertisData（请先在扫描列表出现时点击配网，勿等进入配网模式后再扫）')
        return ''
      }
      const saved = this.wifiToolManager.persistWifiMacForSoap(d, { force: true })
      if (saved) {
        this.log(`配网：Android GoodSleep deviceId fallback → WiFi MAC ${saved}`)
      }
      return saved
    },
    enrichGoodSleepListItem(rawDevice) {
      const d = rawDevice || {}
      const deviceId = d.deviceId || ''
      const advHex = this.wifiToolManager.normalizeAdvertisDataToHex(d.advertisData)
      if (advHex && deviceId) {
        this.goodSleepAdvCache[deviceId] = advHex
        this.wifiToolManager.tryPersistMacFromGoodSleepScan({ advertisData: advHex })
      }
      const cached = this.goodSleepAdvCache[deviceId] || ''
      const enriched = this.wifiToolManager
        ? this.wifiToolManager.enrichGoodSleepBleDevice(d, cached)
        : { ...d, displayName: 'MingaXXXX', deviceWifiMac: '' }
      if (enriched.deviceWifiMac) {
        console.log(
          '[wifiProvision] 配网设备 WiFi MAC:',
          enriched.deviceWifiMac,
          '→',
          enriched.displayName
        )
      }
      return enriched
    },
    teardownProvisionListener() {
      if (this._provisionAckHandler) {
        try {
          uni.$off('xx', this._provisionAckHandler)
        } catch (e) {}
        this._provisionAckHandler = null
      }
    },
    clearWifiProvisionTimeout() {
      if (this._wifiProvisionTimeout) {
        clearTimeout(this._wifiProvisionTimeout)
        this._wifiProvisionTimeout = null
      }
    },
    startWifiProvisionTimeout() {
      this.clearWifiProvisionTimeout()
      this._wifiProvisionTimeout = setTimeout(() => {
        this._wifiProvisionTimeout = null
        const activePhase = ['connecting', 'init_esp', 'sending_wifi']
        if (!this.busy && activePhase.indexOf(this.phase) === -1) {
          return
        }
        this.log('配网超时（40秒）')
        this.log('诊断：40秒内未收到 TYPE_CONNECT_ROUTER_RESULT（type=4）')
        this.phase = 'error'
        this.busy = false
        this.scanning = false
        this.safeHideLoading()
        if (this._blufiDeviceId) {
          try {
            blufi.notifyConnectBle({
              isStart: false,
              deviceId: this._blufiDeviceId,
              name: this._blufiDeviceName || 'GoodSleep设备'
            })
            this.log('配网超时，已请求断开 GoodSleep 设备')
          } catch (e) {
            this.log('配网超时，断开 GoodSleep 异常: ' + e)
          }
        }
        uni.showModal({
          title: '配网超时',
          content: '连接超过40秒未完成，请检查设备和Wi-Fi后重试。',
          showCancel: false
        })
      }, 40000)
    },
    stopScanOnly() {
      this.scanning = false
      try {
        blufi.notifyStartDiscoverBle({ isStart: false })
      } catch (e) {
        console.warn('[wifiProvision] stop BluFi scan', e)
      }
    },
    /**
     * BluFi 连路由成功后：仅断开 GoodSleep，交由用户回首页手动重连枕头。
     */
    async afterBluFiRouterSuccess() {
      this.busy = true
      this.phase = 'reconnect_pillow'
      uni.showToast({ title: '配网成功', icon: 'success' })
      uni.showLoading({ title: '正在结束配网连接…', mask: true })
      const mgr = PillowBleManager.getInstance()
      try {
        mgr.setManualDisconnecting(true)
        if (this._blufiDeviceId) {
          try {
            blufi.notifyConnectBle({
              isStart: false,
              deviceId: this._blufiDeviceId,
              name: this._blufiDeviceName || 'GoodSleep'
            })
            this.log(`已请求断开 BluFi 设备 ${this._blufiDeviceId}`)
          } catch (e) {
            this.log('断开 BluFi 异常: ' + e)
          }
          await new Promise((r) => setTimeout(r, 600))
        } else {
          this.log('未记录 GoodSleep deviceId，跳过断开 BluFi')
        }
        this.phase = 'done'
        WifiToolManager.markWifiProvisionSuccess()
        this.log('配网成功，已断开 GoodSleep。请返回首页手动连接枕头。')
        uni.showModal({
          title: '配网已成功',
          content: '已断开配网设备，请返回首页手动连接枕头。',
          showCancel: false
        })
      } catch (e) {
        const msg = (e && e.message) || String(e)
        this.log('结束配网连接失败: ' + msg)
        this.phase = 'done'
        WifiToolManager.markWifiProvisionSuccess()
        uni.showModal({
          title: '结束配网连接失败',
          content: msg + '。配网已成功，请在下方手动连接回连蓝牙按钮。',
          showCancel: false
        })
      } finally {
        this.busy = false
        this.safeHideLoading()
      }
    },
    /** 创建 BLE 连接并启用 notify，可选下发查询联网状态 0x0F 透传帧 */
    reconnectPillowAndSendQueryStatus(options = {}) {
      const sendQueryStatus = !options || options.sendQueryStatus !== false
      const deviceId = this._savedPillowDeviceId
      const mgr = PillowBleManager.getInstance()
      // BluFi 过程会占用 BLE 通知回调，这里先恢复枕头侧监听，避免回连后“只发不收”。
      if (typeof mgr.forceRebindNotifyDataPipeline === 'function') {
        mgr.forceRebindNotifyDataPipeline()
      }
      const name = this._savedPillowDeviceName || ''
      const norm = (s) => String(s || '').toUpperCase()
      const pickService = (services = []) => {
        if (!services.length) return null
        // 优先枕头常用服务 0xFFE0，避免误选其他 primary 服务导致“只写不回”。
        const ffe0 = services.find((s) => norm(s.uuid).indexOf('0000FFE0-0000-1000-8000-00805F9B34FB') >= 0)
        if (ffe0) return ffe0
        return services.find((s) => s.isPrimary) || services[0]
      }
      const pickChars = (chars = []) => {
        let notifyUUID = ''
        let writeUUID = ''
        const preferNotify = ['0000FFE2-0000-1000-8000-00805F9B34FB', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E']
        const preferWrite = ['0000FFE1-0000-1000-8000-00805F9B34FB', '6E400004-B5A3-F393-E0A9-E50E24DCCA9E']
        for (let i = 0; i < preferNotify.length; i++) {
          const hit = chars.find((ch) => norm(ch.uuid) === preferNotify[i])
          if (hit) {
            notifyUUID = hit.uuid
            break
          }
        }
        for (let i = 0; i < preferWrite.length; i++) {
          const hit = chars.find((ch) => norm(ch.uuid) === preferWrite[i])
          if (hit) {
            writeUUID = hit.uuid
            break
          }
        }
        if (!notifyUUID) {
          const n = chars.find((ch) => {
            const p = ch.properties || {}
            return p.notify || p.indicate
          })
          if (n) notifyUUID = n.uuid
        }
        if (!writeUUID) {
          const w = chars.find((ch) => {
            const p = ch.properties || {}
            return p.write || p.writeNoResponse
          })
          if (w) writeUUID = w.uuid
        }
        if (!notifyUUID && chars[0]) notifyUUID = chars[0].uuid
        if (!writeUUID && chars[0]) writeUUID = chars[0].uuid
        return { notifyUUID, writeUUID }
      }
      const run = () =>
        new Promise((resolve, reject) => {
          uni.createBLEConnection({
            deviceId,
            success: () => {
              mgr.deviceId = deviceId
              mgr.updateDeviceName(name)
              this.log(`createBLEConnection 枕头成功 ${deviceId}`)
              uni.getBLEDeviceServices({
                deviceId,
                success: (sres) => {
                  const services = (sres && sres.services) || []
                  const selectedService = pickService(services)
                  if (!selectedService) {
                    reject(new Error('未找到蓝牙服务'))
                    return
                  }
                  uni.getBLEDeviceCharacteristics({
                    deviceId,
                    serviceId: selectedService.uuid,
                    success: (cres) => {
                      const chars = (cres && cres.characteristics) || []
                      const { notifyUUID, writeUUID } = pickChars(chars)
                      if (!notifyUUID) {
                        reject(new Error('未找到 notify 特征'))
                        return
                      }
                      this.log(
                        `回连枕头通道 service=${selectedService.uuid} notify=${notifyUUID} write=${
                          writeUUID || mgr.characteristicId
                        }`
                      )
                      mgr.startNotice(
                        {
                          deviceUUID: deviceId,
                          serviceUUID: selectedService.uuid,
                          notifyUUID,
                          writeUUID: writeUUID || mgr.characteristicId
                        },
                        {
                          onReady: () => {
                            if (!sendQueryStatus) {
                              this.log('回连枕头成功（未下发 0x0F 查询）')
                              resolve()
                              return
                            }
                            setTimeout(() => {
                              const frame9 = buildHeartModuleWifiFrame9({
                                configWifi: false,
                                queryStatus: true,
                                byte3: 0,
                                spare567: [0, 0, 0]
                              })
                              const ok = mgr.heartRateModule({ read: false, data: frame9 })
                              const hex = frame9.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join(' ')
                              this.log(`下发 0x0F 查询联网状态(透传): ${hex}`)
                              if (!ok) {
                                this.log('heartRateModule 发送失败（未连接/未就绪）')
                              }
                              resolve()
                            }, 220)
                          }
                        }
                      )
                    },
                    fail: (err) => reject(new Error((err && err.errMsg) || '获取特征失败'))
                  })
                },
                fail: (err) => reject(new Error((err && err.errMsg) || '获取服务失败'))
              })
            },
            fail: (err) => reject(new Error((err && err.errMsg) || '连接枕头失败'))
          })
        })
      return Promise.race([
        run(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('回连枕头或启用 notify 超时')), 28000)
        )
      ])
    },
    async manualReconnectOriginalPillow() {
      if (this.busy) return
      if (!this._savedPillowDeviceId) {
        uni.showToast({ title: '未记录原设备，无法回连', icon: 'none' })
        return
      }
      this.busy = true
      this.phase = 'reconnect_pillow'
      uni.showLoading({ title: '正在回连原蓝牙…', mask: true })
      try {
        await this.reconnectPillowAndSendQueryStatus({ sendQueryStatus: false })
        this.phase = 'done'
        uni.showToast({ title: '回连成功', icon: 'success' })
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/status/status'
          })
        }, 300)
      } catch (e) {
        this.phase = 'done'
        const msg = (e && e.message) || String(e)
        this.log('手动回连失败: ' + msg)
        uni.showModal({
          title: '回连失败',
          content: msg,
          showCancel: false
        })
      } finally {
        this.busy = false
        this.safeHideLoading()
      }
    },
    handleBlufiResult(result) {
      const t = result && result.type != null ? String(result.type).trim() : ''
      this.setLastBlufiEventFromResult(result)
      this.log('BluFi← ' + this.formatBlufiResultForLog(result))
      try {
        switch (t) {
          case String(blufi.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS): {
            const all = result.data || []
            this.logBlufiScanDiagnostics(all)
            const filtered = all.filter((d) => isProvisionBlufiDevice(d))
            this.goodSleepDevices = filtered.map((d) => this.enrichGoodSleepListItem(d))
            if (filtered.length) {
              const summary = this.goodSleepDevices
                .map((d) => {
                  const name = d.displayName || d.name || d.localName || '(no-name)'
                  const devId = d.deviceId || '(no-deviceId)'
                  const mac = d.deviceWifiMac || '-'
                  const rssi =
                    typeof d.RSSI === 'number' ? String(d.RSSI) : 'unknown'
                  return `${name} | mac=${mac} | id=${devId} | RSSI=${rssi}`
                })
                .join(' ; ')
              this.log(`BluFi 列表更新 GoodSleep ${filtered.length} 台: ${summary}`)
            }
            break
          }
          case String(blufi.XBLUFI_TYPE.TYPE_CONNECTED): {
            this.safeHideLoading()
            const connectErrMsg = String((result && result.data && result.data.errMsg) || '')
            if (result.result) {
              const deviceId = result.data.deviceId
              if (this._blufiInitStarted && this._blufiDeviceId === deviceId) {
                this.log('BluFi 连接回调重复，已处于 DH 初始化阶段，忽略')
                break
              }
              this._blufiDeviceId = deviceId
              this._blufiDeviceName = result.data.name || this._blufiDeviceName || ''
              this._blufiSequenceCount = 0
              this._routerResultReceived = false
              this._blufiRouterSent = false
              this._blufiInitStarted = true
              this.log('BluFi 连接成功，notifyInitBleEsp32（等待 DH 完成后再发 Wi-Fi 三包）')
              this.phase = 'init_esp'
              uni.showLoading({ title: '正在配网中…', mask: true })
              this.startBlufiDhTimeout()
              blufi.notifyInitBleEsp32({ deviceId })
            } else {
              // 某些机型会在已连接后再回调一次 "already connect" 的失败事件，忽略该伪失败。
              if (connectErrMsg.indexOf('already connect') >= 0 && this._blufiDeviceId) {
                this.log('BluFi 收到 already connect 伪失败回调，忽略')
                break
              }
              this.clearWifiProvisionTimeout()
              this.log('BluFi 连接失败')
              this.busy = false
              this.phase = 'error'
              uni.showToast({ title: '蓝牙连接失败', icon: 'none' })
            }
            break
          }
          case String(blufi.XBLUFI_TYPE.TYPE_INIT_ESP32_RESULT): {
            this.log('初始化结果：' + JSON.stringify(result))
            if (result.result) {
              this.log('BluFi DH 完成（result=true）')
              this.tryStartWifiConfigAfterDh('BluFi DH 完成')
            } else {
              this.clearBlufiDhTimeout()
              this.clearWifiProvisionTimeout()
              this.log('BluFi 初始化失败: ' + JSON.stringify(result.data || {}))
              this.busy = false
              this.phase = 'error'
              uni.showModal({
                title: 'BluFi 初始化失败',
                content: '请确认设备已进入配网模式并支持 BluFi',
                showCancel: false
              })
            }
            break
          }
          case String(blufi.XBLUFI_TYPE.TYPE_CONNECT_ROUTER_RESULT): {
            this._routerResultReceived = true
            if (this._secondRoundTimer) {
              clearTimeout(this._secondRoundTimer)
              this._secondRoundTimer = null
            }
            this.clearWifiProvisionTimeout()
            this.safeHideLoading()
            const progress =
              result && result.data && typeof result.data.progress !== 'undefined'
                ? result.data.progress
                : 'unknown'
            const ssid =
              result && result.data && typeof result.data.ssid !== 'undefined'
                ? result.data.ssid
                : ''
            this.log(
              `[配网progress] progress=${String(progress)} result=${String(
                !!(result && result.result)
              )} ssid=${ssid || '(empty)'}`
            )
            this.log(
              '【连路由结果】result.result=' +
                JSON.stringify(result && result.result) +
                ' data=' +
                JSON.stringify((result && result.data) || null)
            )
            // 兼容部分固件：subType18/statusByte=0 常为“处理中”而非最终失败，继续等待后续上报。
            if (
              result &&
              result.result === false &&
              result.data &&
              result.data.reason === 'subType18' &&
              Number(result.data.statusByte) === 0
            ) {
              this.phase = 'sending_wifi'
              this.busy = true
              this.startWifiProvisionTimeout()
              this.log('收到 subType18/statusByte=0，判定为处理中，继续等待最终连路由结果')
              break
            }
            if (result.result) {
              this.scanning = false
              this.goodSleepDevices = []
              this.persistRememberedWifi()
              this.log('BluFi 上报连路由成功，开始断开 GoodSleep（不自动回连枕头）')
              void this.afterBluFiRouterSuccess()
            } else {
              this.phase = 'error'
              this.busy = false
              this.log('BluFi 连路由失败（result.result 为 false 或未成功）')
              uni.showModal({
                title: '配网失败',
                content: '请检查 Wi-Fi 密码与 2.4G 网络后重试',
                showCancel: false
              })
            }
            break
          }
          default:
            if (t !== '42' && t !== '41' && t !== '-2' && t !== '-1') {
              this.log('BluFi 未识别的 type=' + t + '（完整见上条 BluFi←）')
            }
            break
        }
      } catch (e) {
        console.error('[wifiProvision] handleBlufiResult', e)
      }
    },
    async runFullProvision() {
      const ssid = (this.wifiSsid || '').trim()
      const pwd = this.wifiPassword || ''
      if (!ssid || !pwd) {
        uni.showToast({ title: '请填写 Wi-Fi 名称和密码', icon: 'none' })
        return
      }
      this.persistRememberedWifi()
      const mgr = PillowBleManager.getInstance()
      if (!mgr.isConnected() || !mgr.deviceId) {
        uni.showModal({
          title: '未连接枕头',
          content: '请先在首页完成蓝牙连接后再使用本页。',
          showCancel: false
        })
        return
      }

      this._savedPillowDeviceId = mgr.deviceId
      this._savedPillowDeviceName = mgr.deviceName || ''

      WifiToolManager.clearWifiProvisionSuccess()
      this._blufiRouterSent = false
      this._blufiInitStarted = false
      this._routerResultReceived = false
      if (this._secondRoundTimer) {
        clearTimeout(this._secondRoundTimer)
        this._secondRoundTimer = null
      }
      this.clearBlufiDhTimeout()
      this.clearWifiProvisionTimeout()
      this.busy = true
      this.phase = 'wait_0f_ack'
      this.goodSleepDevices = []
      this.teardownProvisionListener()
      this.stopScanOnly()

      try {
        mgr.registerNotifyDataPipelineOnce()
        const frame9 = buildHeartModuleWifiFrame9({
          configWifi: true,
          queryStatus: false,
          byte3: 0,
          spare567: [0, 0, 0]
        })
        const frame9Hex = this.toHexCompact(frame9)
        const frame9WithWriteFlagHex = this.toHexCompact([0x00].concat(frame9))
        // 设备进入配网模式后，部分固件会回固定帧：5B 5B 0A 00 05 00 00 00 0F
        const fixedProvisionEchoHex = '5b5b0a00050000000f'
        const fixedProvisionEchoWithWriteFlagHex = '00' + fixedProvisionEchoHex
        const buf = BluePillowProtocol.heartRateModule({ read: false, data: frame9 })
        this.log(`下发 0x0F 配网指令 ${frame9.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join(' ')}`)

        await new Promise((resolve, reject) => {
          const tm = setTimeout(() => reject(new Error('等待 0x0F 应答超时')), 10000)
          this._provisionAckHandler = (res) => {
            try {
              const val = res && res.value
              if (!val) return
              const directHex = this.normalizePayloadToHex(val)
              if (!directHex) return
              const isFixedProvisionSuccessMark =
                directHex === fixedProvisionEchoHex || directHex === fixedProvisionEchoWithWriteFlagHex
              const isSameAsSentPayload =
                directHex === frame9Hex || directHex === frame9WithWriteFlagHex
              if (isFixedProvisionSuccessMark || isSameAsSentPayload) {
                clearTimeout(tm)
                uni.$off('xx', this._provisionAckHandler)
                this._provisionAckHandler = null
                if (isFixedProvisionSuccessMark) {
                  this.log('收到 0x0F 配网成功标志 5B5B0A00050000000F，已进入配网模式')
                } else {
                  this.log('收到与下发一致的 0x0F 数据回显，已进入配网模式')
                }
                resolve('echo')
                return
              }
              if (typeof val === 'string') return
              const parsed = mgr.handleNotifyBuffer(val)
              if (parsed && parsed.type === 'heart_rate_module') {
                const dataHex = this.normalizePayloadToHex((parsed.parsed && parsed.parsed.dataHex) || '')
                const isFixedProvisionSuccessMark =
                  dataHex === fixedProvisionEchoHex || dataHex === fixedProvisionEchoWithWriteFlagHex
                const isSameAsSentPayload =
                  dataHex === frame9Hex || dataHex === frame9WithWriteFlagHex
                if (isFixedProvisionSuccessMark || isSameAsSentPayload) {
                  clearTimeout(tm)
                  uni.$off('xx', this._provisionAckHandler)
                  this._provisionAckHandler = null
                  if (isFixedProvisionSuccessMark) {
                    this.log('收到 0x0F 透传的配网成功标志 5B5B0A00050000000F，已进入配网模式')
                  } else {
                    this.log('收到 0x0F 透传回显与下发一致，已进入配网模式')
                  }
                  resolve('echo')
                  return
                }
              }
              if (
                parsed &&
                parsed.type === 'write_ack' &&
                (parsed.parsed.func & 0x7f) === 0x0f &&
                parsed.parsed.success
              ) {
                clearTimeout(tm)
                uni.$off('xx', this._provisionAckHandler)
                this._provisionAckHandler = null
                this.log('收到 0x0F 写应答成功')
                resolve('ack')
              }
            } catch (e) {}
          }
          uni.$on('xx', this._provisionAckHandler)
          const ok = mgr.send(buf, { silent: true })
          if (!ok) {
            clearTimeout(tm)
            reject(new Error('发送 0x0F 失败（未连接）'))
          }
        })
      } catch (e) {
        this.log('0x0F 阶段失败: ' + ((e && e.message) || e))
        uni.showToast({ title: (e && e.message) || '0x0F 失败', icon: 'none' })
        this.phase = 'error'
        this.busy = false
        this.teardownProvisionListener()
        return
      } finally {
        if (this._provisionAckHandler) {
          try {
            uni.$off('xx', this._provisionAckHandler)
          } catch (e2) {}
          this._provisionAckHandler = null
        }
      }

      this.phase = 'disconnecting'
      this.log('断开当前枕头蓝牙')
      mgr.setManualDisconnecting(true)
      await new Promise((resolve) => {
        const id = mgr.deviceId
        uni.closeBLEConnection({
          deviceId: id,
          complete: () => setTimeout(resolve, 500)
        })
      })

      this.phase = 'scanning'
      this.scanning = true
      this._lastBlufiScanDiagKey = ''
      this.log('启动 BluFi 扫描（notifyStartDiscoverBle）')
      try {
        blufi.notifyStartDiscoverBle({ isStart: true })
      } catch (e) {
        this.log('BluFi 扫描启动异常: ' + e)
        this.phase = 'error'
        this.scanning = false
      }
      this.busy = false
      uni.showToast({ title: '请在列表中点击配网设备', icon: 'none' })
    },

    onPickGoodSleep(device) {
      const ssid = (this.wifiSsid || '').trim()
      const pwd = this.wifiPassword || ''
      if (!ssid || !pwd) {
        uni.showToast({ title: '请填写 Wi-Fi 信息', icon: 'none' })
        return
      }
      const displayName = device.displayName || 'MingaXXXX'
      const saved = this.persistWifiMacAtProvisionPick(device)
      const wifiMac =
        saved ||
        device.deviceWifiMac ||
        (this.wifiToolManager && this.wifiToolManager.resolveCachedSoapMac()) ||
        ''
      console.log('[wifiProvision] 选择配网设备 WiFi MAC:', wifiMac || '(未知)', '展示名:', displayName)
      this.log(`选择配网设备 ${displayName} WiFi MAC=${wifiMac || '(未知)'}`)
      if (needsBleMacFromAdvertisData(this.platform) && !wifiMac) {
        uni.showToast({ title: '未能从广播解析MAC，实时数据可能不可用', icon: 'none' })
      }
      this._blufiDeviceId = device.deviceId
      this._blufiDeviceName = displayName
      this._blufiRouterSent = false
      this._blufiInitStarted = false
      this._routerResultReceived = false
      if (this._secondRoundTimer) {
        clearTimeout(this._secondRoundTimer)
        this._secondRoundTimer = null
      }
      this.clearBlufiDhTimeout()
      this.busy = true
      this.phase = 'connecting'
      this.startWifiProvisionTimeout()
      this.stopScanOnly()
      uni.showLoading({ title: '连接中…', mask: true })
      this.log(`BluFi 连接 ${displayName} (${device.deviceId}) WiFi MAC=${wifiMac || '(未知)'}`)
      try {
        blufi.notifyConnectBle({
          isStart: true,
          deviceId: device.deviceId,
          name: displayName
        })
      } catch (e) {
        this.safeHideLoading()
        this.busy = false
        this.phase = 'error'
        this.log('notifyConnectBle 异常: ' + e)
      }
    }
  }
}
</script>

<style scoped>
.page {
  height: 100vh;
  box-sizing: border-box;
  padding: 24rpx;
  background: linear-gradient(180deg, #F0F6F7 0%, rgba(76, 140, 182, 0.12) 100%);
}
.hero-card,
.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-sizing: border-box;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
  margin-bottom: 24rpx;
}
.hero-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(37, 99, 235, 0.1);
  color: #083969;
  font-size: 22rpx;
  margin-bottom: 16rpx;
}
.hero-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #051C2C;
  margin-bottom: 12rpx;
}
.hero-desc {
  font-size: 24rpx;
  color: rgba(5, 28, 44, 0.8);
  line-height: 1.7;
  margin-bottom: 24rpx;
}
.step-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.step-chip {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #F0F6F7;
  color: rgba(5, 28, 44, 0.7);
  font-size: 22rpx;
}
.step-chip.active {
  background: #dcfce7;
  color: #1C6A51;
  box-sizing: border-box;
}
.em {
  font-weight: bold;
  color: #083969;
}
.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #051C2C;
  margin-bottom: 20rpx;
}
.field-block {
  margin-bottom: 20rpx;
}
.label {
  font-size: 26rpx;
  margin-bottom: 8rpx;
  color: rgba(5, 28, 44, 0.85);
}
.wifi-select-box {
  display: flex;
  border: 2rpx solid rgba(76, 140, 182, 0.45);
  border-radius: 18rpx;
  background: #F0F6F7;
  box-sizing: border-box;
}
.wifi-select-box--ios {
  min-height: 96rpx;
}
.wifi-select-box--android {
  min-height: 104rpx;
}
.wifi-select-left {
  width: 156rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16rpx;
  background: #F0F6F7;
  color: rgba(5, 28, 44, 0.7);
  font-size: 24rpx;
  border-right: 2rpx solid rgba(175, 160, 201, 0.35);
  box-sizing: border-box;
}
.wifi-select-right {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 16rpx;
  box-sizing: border-box;
}
.wifi-select-input {
  flex: 1;
  min-width: 0;
  height: 92rpx;
  line-height: 92rpx;
  font-size: 28rpx;
  color: #051C2C;
}
.wifi-select-arrow {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0ecff;
  color: #083969;
  flex: none;
}
.wifi-select-arrow--open .wifi-select-arrow-icon {
  transform: rotate(180deg);
}
.wifi-select-arrow-icon {
  width: 28rpx;
  height: 28rpx;
  transition: transform 0.2s ease;
}
.wifi-dropdown {
  margin-top: 14rpx;
  background: #fff;
  border: 2rpx solid rgba(76, 140, 182, 0.45);
  border-radius: 18rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
}
.wifi-dropdown-empty {
  padding: 24rpx;
  font-size: 24rpx;
  color: rgba(5, 28, 44, 0.7);
}
.wifi-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 22rpx 24rpx;
  border-top: 1rpx solid #eef2ff;
}
.wifi-dropdown-item:first-child {
  border-top: 0;
}
.wifi-dropdown-name {
  font-size: 26rpx;
  color: #051C2C;
  word-break: break-all;
}
.wifi-dropdown-tags {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.wifi-dropdown-tag {
  flex: none;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(76, 140, 182, 0.16);
  color: #083969;
  font-size: 20rpx;
}
.wifi-dropdown-tag--warn {
  background: #fff7ed;
  color: #083969;
}
.ssid-tool-row {
  margin-top: 16rpx;
}
.ssid-primary-btn {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx 22rpx;
  border-radius: 18rpx;
  background: linear-gradient(180deg, #F0F6F7 0%, rgba(76, 140, 182, 0.12) 100%);
  border: 2rpx solid rgba(76, 140, 182, 0.45);
}
.ssid-primary-btn-title {
  font-size: 28rpx;
  line-height: 1.4;
  color: #1d4ed8;
  font-weight: 700;
}
.ssid-primary-btn-sub {
  font-size: 22rpx;
  line-height: 1.6;
  color: rgba(5, 28, 44, 0.7);
}
.ssid-action-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18rpx;
  margin-top: 14rpx;
}
.ssid-action {
  font-size: 22rpx;
  line-height: 1.4;
  color: rgba(5, 28, 44, 0.7);
}
.ssid-action--primary {
  color: #083969;
  font-weight: 600;
}
.input {
  border: 2rpx solid rgba(76, 140, 182, 0.45);
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background: #F0F6F7;
}
.password-row {
  position: relative;
}
.input--with-action {
  padding-right: 148rpx;
}
.input-action {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24rpx;
  color: #083969;
  font-weight: 600;
}
.remember-row {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
}
.remember-check {
  width: 34rpx;
  height: 34rpx;
  border-radius: 10rpx;
  border: 2rpx solid #cbd5e1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
}
.remember-check--active {
  border-color: #1C6A51;
  background: #1C6A51;
}
.remember-check-icon {
  color: #fff;
  font-size: 20rpx;
  line-height: 1;
}
.remember-text {
  font-size: 24rpx;
  color: rgba(5, 28, 44, 0.8);
}
.form-tip,
.device-tip,
.debug-sub,
.tip-line {
  font-size: 22rpx;
  color: rgba(5, 28, 44, 0.7);
  line-height: 1.7;
}
.status-card {
  border: 2rpx solid rgba(76, 140, 182, 0.45);
  background: #F0F6F7;
}
.status-card--active {
  border-color: rgba(76, 140, 182, 0.45);
  background: rgba(76, 140, 182, 0.16);
}
.status-card--success {
  border-color: #86efac;
  background: #f0fdf4;
}
.status-card--error {
  border-color: #fecaca;
  background: #fff1f2;
}
.status-main {
  font-size: 34rpx;
  font-weight: 700;
  color: #051C2C;
  margin-bottom: 12rpx;
}
.status-sub {
  font-size: 24rpx;
  color: rgba(5, 28, 44, 0.8);
  line-height: 1.6;
}
.action-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.btn-primary {
  background: linear-gradient(135deg, #1C6A51 0%, #005578 100%);
  color: #fff;
}
.btn-secondary {
  background: #fff;
  color: rgba(5, 28, 44, 0.8);
  border: 2rpx solid rgba(175, 160, 201, 0.35);
}
.result-card {
  text-align: center;
}
.result-illustration {
  position: relative;
  width: 220rpx;
  height: 220rpx;
  margin: 8rpx auto 28rpx;
}
.result-orbit {
  position: absolute;
  border-radius: 50%;
  border: 2rpx dashed rgba(34, 197, 94, 0.22);
  inset: 0;
}
.result-orbit--two {
  inset: 26rpx;
  border-style: solid;
  border-color: rgba(59, 130, 246, 0.12);
}
.result-core {
  position: absolute;
  inset: 54rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #1C6A51 0%, #005578 100%);
  box-shadow: 0 18rpx 36rpx rgba(34, 197, 94, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
}
.result-check {
  color: #fff;
  font-size: 72rpx;
  font-weight: 700;
}
.result-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #166534;
  margin-bottom: 16rpx;
}
.result-desc {
  font-size: 24rpx;
  color: rgba(5, 28, 44, 0.8);
  line-height: 1.7;
}
.result-chip {
  display: inline-block;
  margin-top: 20rpx;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: #f0fdf4;
  color: #1C6A51;
  font-size: 22rpx;
}
.result-reconnect-btn {
  margin-top: 20rpx;
}
.device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 20rpx;
  border: 2rpx solid rgba(175, 160, 201, 0.35);
  border-radius: 18rpx;
  margin-bottom: 16rpx;
  background: #fff;
}
.device-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.device-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #051C2C;
}
.device-id {
  font-size: 22rpx;
  color: rgba(5, 28, 44, 0.45);
  word-break: break-all;
  margin-top: 6rpx;
}
.device-action {
  color: #083969;
  font-size: 24rpx;
  font-weight: 600;
}
.tips-card .tip-line + .tip-line {
  margin-top: 8rpx;
}
.debug-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.debug-toggle {
  color: #083969;
  font-size: 24rpx;
  font-weight: 600;
}
.log-box {
  margin-top: 24rpx;
  padding: 16rpx;
  background: #F0F6F7;
  border-radius: 16rpx;
  max-height: 420rpx;
  overflow-y: auto;
  border: 2rpx dashed rgba(175, 160, 201, 0.35);
}
.log-empty {
  font-size: 22rpx;
  color: rgba(5, 28, 44, 0.45);
}
.log-line {
  font-size: 22rpx;
  color: rgba(5, 28, 44, 0.8);
  line-height: 1.4;
  margin-bottom: 6rpx;
}
</style>
