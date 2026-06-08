import PermissionToolManager from './PermissionToolManager.js'
import { getRuntimePlatform, needsBleMacFromAdvertisData } from '@/utils/platformBle.js'
import { isSystemLocationPermissionError, showWechatAppLocationPermissionModal } from '@/utils/permissionUtil.js'

const WIFI_DEVICE_MAC_KEY = 'wifi_device_mac'
/** 历史兼容：读取时可迁移，写入后会被清除 */
const LEGACY_MAC_STORAGE_KEYS = ['soap_device_mac', 'device_mac', 'wifiMac', 'mac']
const WIFI_PROVISION_SUCCESS_KEY = 'wifi_provision_success'
const WIFI_5G_KEYWORDS = ['-5g', '_5g', '5ghz', '-5ghz', '_5ghz', '5g_wifi', '5g-wifi']

class WifiToolManager {
  static clearLegacyMacStorageKeys() {
    LEGACY_MAC_STORAGE_KEYS.forEach((key) => {
      try {
        uni.removeStorageSync(key)
      } catch (e) {
        // ignore
      }
    })
  }

  /** 唯一 MAC 读取入口；若仅存于旧 key 则自动迁移到 wifi_device_mac */
  static resolveWifiDeviceMac() {
    try {
      const v = uni.getStorageSync(WIFI_DEVICE_MAC_KEY)
      if (typeof v === 'string' && v.trim()) {
        return v.trim()
      }
    } catch (e) {
      // ignore
    }
    for (let i = 0; i < LEGACY_MAC_STORAGE_KEYS.length; i++) {
      try {
        const old = uni.getStorageSync(LEGACY_MAC_STORAGE_KEYS[i])
        if (typeof old === 'string' && old.trim()) {
          const mac = old.trim()
          uni.setStorageSync(WIFI_DEVICE_MAC_KEY, mac)
          WifiToolManager.clearLegacyMacStorageKeys()
          return mac
        }
      } catch (e) {
        // ignore
      }
    }
    return ''
  }

  static isWifiProvisionSuccess() {
    try {
      return !!uni.getStorageSync(WIFI_PROVISION_SUCCESS_KEY)
    } catch (e) {
      return false
    }
  }

  static clearWifiProvisionSuccess() {
    try {
      uni.removeStorageSync(WIFI_PROVISION_SUCCESS_KEY)
    } catch (e) {
      // ignore
    }
  }

  /** BluFi 连路由成功后调用，允许首页启动 WebSocket 实时心率 */
  static markWifiProvisionSuccess(mac) {
    try {
      uni.setStorageSync(WIFI_PROVISION_SUCCESS_KEY, true)
    } catch (e) {
      // ignore
    }
    let resolvedMac = typeof mac === 'string' ? mac.trim() : ''
    if (!resolvedMac) {
      resolvedMac = WifiToolManager.resolveWifiDeviceMac()
    }
    uni.$emit('wifi_provision_success', { mac: resolvedMac })
  }

  static isGoodSleepBleDeviceName(name) {
    const n = String(name || '').trim()
    return /^goodsleep/i.test(n) || /^rtk_bt/i.test(n)
  }

  static hasBlufiAdvertisedService(device) {
    const uuids = (device && device.advertisServiceUUIDs) || []
    return uuids.some((u) => {
      const s = String(u || '').toUpperCase()
      return s.indexOf('0000FFFF-0000-1000-8000-00805F9B34FB') >= 0
    })
  }

  static isGoodSleepBleDevice(device) {
    const d = device || {}
    return (
      WifiToolManager.isGoodSleepBleDeviceName(d.name) ||
      WifiToolManager.isGoodSleepBleDeviceName(d.localName) ||
      WifiToolManager.hasBlufiAdvertisedService(d)
    )
  }

  constructor(page, options = {}) {
    this.page = page
    this.storageKey = options.storageKey || 'wifiProvision:lastSsid'
    this._wifiListHandler = null
    this.permissionToolManager = new PermissionToolManager(page)
  }

  log(message) {
    if (this.page && typeof this.page.log === 'function') {
      this.page.log(`[WiFi] ${message}`)
    } else {
      console.log('[WiFiToolManager]', message)
    }
  }

  normalizeSilentFlag(silent) {
    return silent === true
  }

  initPlatform() {
    try {
      const info = uni.getSystemInfoSync()
      this.page.platform = (info.platform || '').toLowerCase()
    } catch (e) {
      this.page.platform = ''
    }
  }

  is5GWifiBySSID(ssid) {
    const name = (ssid || '').trim().toLowerCase()
    if (!name) return false
    return WIFI_5G_KEYWORDS.some((keyword) => name.includes(keyword))
  }

  normalizeWifiCandidate(raw, extra = {}) {
    const ssid = ((raw && (raw.SSID || raw.ssid)) || '').trim()
    if (!ssid) return null
    const frequency = Number((raw && raw.frequency) || 0)
    const is5G = frequency >= 4900 || this.is5GWifiBySSID(ssid)
    return {
      ssid,
      frequency,
      is5G,
      isCurrent: false,
      ...extra
    }
  }

  restoreRememberedWifi() {
    try {
      const ssid = uni.getStorageSync(this.storageKey)
      if (ssid) {
        this.page.wifiSsid = ssid
        this.upsertWifiCandidate(ssid)
        this.page.rememberWifi = true
        this.log(`恢复已记住 Wi-Fi：${ssid}`)
      } else {
        this.page.rememberWifi = false
        this.page.wifiSsid = ''
        this.log('未检测到记住的 Wi-Fi，默认不勾选记住选项')
      }
    } catch (e) {}
  }

  persistRememberedWifi() {
    try {
      const ssid = (this.page.wifiSsid || '').trim()
      if (this.page.rememberWifi && ssid) {
        uni.setStorageSync(this.storageKey, ssid)
      } else {
        uni.removeStorageSync(this.storageKey)
      }
    } catch (e) {}
  }

  registerWifiListListener() {
    if (this._wifiListHandler || typeof uni.onGetWifiList !== 'function') return
    this._wifiListHandler = (res) => {
      const list = Array.isArray(res && res.wifiList) ? res.wifiList : []
      const candidates = []
      if (this.page.connectedWifiSsid) {
        const currentCandidate = this.normalizeWifiCandidate(
          { SSID: this.page.connectedWifiSsid },
          { isCurrent: true }
        )
        if (currentCandidate) candidates.push(currentCandidate)
      }
      list.forEach((item) => {
        const candidate = this.normalizeWifiCandidate(item, {
          isCurrent: ((item && item.SSID) || '').trim() === this.page.connectedWifiSsid
        })
        if (!candidate) return
        if (candidates.some((existing) => existing.ssid === candidate.ssid)) return
        candidates.push(candidate)
      })
      this.page.wifiCandidates = candidates
      this.page.scanningWifiList = false
      this.page.showWifiDropdown = true
      this.log(`收到 Wi-Fi 列表，数量 ${candidates.length}`)
      if (candidates.length) {
        uni.showToast({ title: 'Wi-Fi 列表已更新', icon: 'none' })
      } else {
        uni.showToast({ title: '未扫描到可用 Wi-Fi', icon: 'none' })
      }
    }
    uni.onGetWifiList(this._wifiListHandler)
  }

  unregisterWifiListListener() {
    if (!this._wifiListHandler || typeof uni.offGetWifiList !== 'function') return
    try {
      uni.offGetWifiList(this._wifiListHandler)
    } catch (e) {}
    this._wifiListHandler = null
  }

  upsertWifiCandidate(ssid) {
    const candidate = this.normalizeWifiCandidate({ SSID: ssid })
    if (!candidate) return
    this.upsertWifiCandidateObject(candidate)
  }

  upsertWifiCandidateObject(candidate) {
    if (!candidate || !candidate.ssid) return
    const nextList = this.page.wifiCandidates.filter((item) => item && item.ssid !== candidate.ssid)
    this.page.wifiCandidates = [candidate].concat(nextList)
  }

  showWifi5GBlockedModal(ssid) {
    this.log(`拦截 5G Wi-Fi：${ssid}`)
    uni.showModal({
      title: '暂不支持 5G Wi-Fi',
      content: `你选择的“${ssid}”为 5G Wi-Fi，设备配网仅支持 2.4G Wi-Fi，请切换后重试。`,
      showCancel: false
    })
  }

  prepareManualWifiInput() {
    this.page.wifiSsid = ''
    this.log('iOS 不支持 Wi-Fi 列表，提示手动输入')
    uni.showModal({
      title: '请手动输入 Wi-Fi',
      content: 'iOS 设备不支持弹出 Wi-Fi 列表，请先到系统“无线局域网”确认已连接 2.4G 网络，再返回输入 Wi-Fi 名称。',
      showCancel: false
    })
  }

  startWifiModule(silent = false) {
    const silentFlag = this.normalizeSilentFlag(silent)
    return new Promise((resolve) => {
      if (typeof uni.startWifi !== 'function') {
        this.log('当前环境不支持 startWifi')
        resolve(false)
        return
      }
      uni.startWifi({
        success: () => {
          this.log('startWifi 初始化成功')
          resolve(true)
        },
        fail: (err) => {
          this.log(`startWifi 初始化失败：${(err && err.errMsg) || JSON.stringify(err || {})}`)
          if (!silentFlag) {
            uni.showToast({
              title: (err && err.errMsg) || 'Wi-Fi 初始化失败',
              icon: 'none'
            })
          }
          resolve(false)
        }
      })
    })
  }

  async fillCurrentWifi(silent = false) {
    const silentFlag = this.normalizeSilentFlag(silent)
    this.log(`点击自动填写当前 Wi-Fi，silent=${silentFlag}`)
    if (this.page.readingCurrentWifi) return
    if (typeof uni.getConnectedWifi !== 'function') {
      this.log('当前环境不支持 getConnectedWifi')
      if (!silentFlag) {
        uni.showToast({ title: '当前环境不支持读取 Wi-Fi', icon: 'none' })
      }
      return
    }
    const wifiReady = await this.startWifiModule(silentFlag)
    if (!wifiReady) return
    this.page.readingCurrentWifi = true
    this.log('开始读取当前连接的 Wi-Fi')
    uni.getConnectedWifi({
      partialInfo: true,
      success: (res) => {
        const wifi = res && res.wifi
        const candidate = this.normalizeWifiCandidate(wifi, { isCurrent: true })
        if (candidate && candidate.ssid) {
          this.log(`读取到当前 Wi-Fi：${candidate.ssid}${candidate.is5G ? '（5G）' : ''}`)
          this.page.connectedWifiSsid = candidate.ssid
          this.upsertWifiCandidateObject(candidate)
          if (candidate.is5G) {
            if (!silentFlag) this.showWifi5GBlockedModal(candidate.ssid)
            return
          }
          this.page.wifiSsid = candidate.ssid
          if (!silentFlag) {
            uni.showToast({ title: '已填入当前 Wi-Fi', icon: 'none' })
          }
          return
        }
        this.log('未读取到有效的当前 Wi-Fi SSID')
        this.handleFillCurrentWifiFail(silentFlag)
      },
      fail: (err) => {
        this.log(`读取当前 Wi-Fi 失败：${(err && err.errMsg) || JSON.stringify(err || {})}`)
        if (isSystemLocationPermissionError(err)) {
          showWechatAppLocationPermissionModal()
        } else {
          this.handleFillCurrentWifiFail(silentFlag)
        }
      },
      complete: () => {
        this.page.readingCurrentWifi = false
      }
    })
  }

  handleFillCurrentWifiFail(silent = false) {
    const silentFlag = this.normalizeSilentFlag(silent)
    this.log(`读取当前 Wi-Fi 失败，silent=${silentFlag}`)
    if (silentFlag) return
    uni.showModal({
      title: '未读取到当前 Wi-Fi',
      content: this.page.platform === 'ios'
        ? 'iOS 设备可能无法直接返回当前网络名称，请在系统 Wi-Fi 中确认后手动输入。'
        : '请确认已开启手机定位服务、微信位置权限，并连接到 2.4G Wi-Fi 后重试；也可直接手动输入。',
      showCancel: false
    })
  }

  async openWifiSelector(silent = false) {
    const silentFlag = this.normalizeSilentFlag(silent)
    this.log(`准备读取 Wi-Fi 列表，silent=${silentFlag}`)
    if (this.page.scanningWifiList) return
    if (this.page.platform === 'ios') {
      this.prepareManualWifiInput()
      return
    }
    if (typeof uni.startWifi !== 'function' || typeof uni.getWifiList !== 'function') {
      uni.showToast({ title: '当前环境不支持 Wi-Fi 列表', icon: 'none' })
      return
    }
    const ok = await this.ensureWifiPermissionForList()
    if (!ok) return
    this.page.scanningWifiList = true
    this.page.showWifiDropdown = true
    const wifiReady = await this.startWifiModule(silentFlag)
    if (!wifiReady) {
      this.page.scanningWifiList = false
      return
    }
    uni.getWifiList({
      success: () => {
        this.log('已调用 getWifiList，等待 onGetWifiList 回调')
        if (!silentFlag && this.page.platform === 'ios') {
          uni.showToast({ title: '如列表未更新，请返回系统 Wi-Fi 后再回微信', icon: 'none' })
        }
      },
      fail: (err) => {
        this.page.scanningWifiList = false
        this.log(`读取 Wi-Fi 列表失败：${(err && err.errMsg) || JSON.stringify(err || {})}`)
        if (isSystemLocationPermissionError(err)) {
          showWechatAppLocationPermissionModal()
          return
        }
        uni.showToast({ title: (err && err.errMsg) || '读取 Wi-Fi 列表失败', icon: 'none' })
      }
    })
  }

  ensureWifiPermissionForList() {
    if (this.page.platform !== 'android') {
      return Promise.resolve(true)
    }
    this.log('检查 Android Wi-Fi 列表所需定位权限')
    return this.permissionToolManager.ensureLocationForWifiList()
  }

  normalizeMacAddress(input) {
    const s = String(input || '').trim().toUpperCase()
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(s)) return ''
    return s
  }

  convertAdvertisServiceUUIDsToMac(advertisServiceUUIDs) {
    if (!Array.isArray(advertisServiceUUIDs) || advertisServiceUUIDs.length < 3) return ''
    const parts = []
    for (let i = 0; i < 3; i++) {
      const u = String(advertisServiceUUIDs[i] || '')
      if (u.length < 8) return ''
      const first8 = u.slice(0, 8).toUpperCase()
      const nonZero = first8.replace(/^0+/, '')
      parts.push(nonZero.length ? nonZero : first8.slice(4))
    }
    const combined = parts.join('')
    if (combined.length < 12) return ''
    const mac = []
    for (let i = 0; i < 12; i += 2) mac.push(combined.slice(i, i + 2))
    return this.normalizeMacAddress(mac.join(':'))
  }

  convertAdvertisDataToMac(advertisData) {
    const hex = this.normalizeAdvertisDataToHex(advertisData)
    if (!hex || hex.length % 2 !== 0) return ''
    const raw = []
    for (let i = 0; i < hex.length; i += 2) {
      const b = parseInt(hex.slice(i, i + 2), 16)
      if (Number.isNaN(b)) return ''
      raw.push(b.toString(16).toUpperCase())
    }
    // 对齐 pillow BluetoothManager.extractMacFromHexArray / blue.js _parseMacFromAdvertisData
    if (raw.length < 11) return ''
    const c0 = raw[2]
    const c1 = raw[3] + raw[4].charAt(0)
    const c2 = raw[5]
    const c3 = raw[6] + raw[7].charAt(0)
    const c4 = raw[8]
    const c5 = raw[9] + raw[10].charAt(0)
    const mac = [c0, c1, c2, c3, c4, c5]
      .map((s) => String(s || '').toUpperCase().padStart(2, '0').slice(-2))
      .join(':')
    return this.normalizeMacAddress(mac)
  }

  /** 从 advertisData 解析 WiFi MAC（与 iOS 相同，全平台 GoodSleep 配网应用此结果） */
  parseWifiMacFromAdvertisData(advertisData) {
    return this.convertAdvertisDataToMac(advertisData)
  }

  /** WiFi/蓝牙 MAC 末 4 位十六进制（如 A4:2F → A42F） */
  getMacSuffixLast4(mac) {
    const clean = String(mac || '').replace(/[:\-\s]/g, '').toUpperCase()
    return clean.length >= 4 ? clean.slice(-4) : 'XXXX'
  }

  /** 配网列表展示名：Minga + MAC 末四位 */
  formatMingaDisplayNameFromWifiMac(wifiMac) {
    return `Minga${this.getMacSuffixLast4(wifiMac)}`
  }

  /** 从 BluFi 扫描项解析 WiFi MAC 并生成 MingaXXXX 展示名 */
  formatMingaDisplayNameFromBleDevice(device) {
    const dev = device || {}
    const advHex = this.normalizeAdvertisDataToHex(dev.advertisData)
    if (advHex) {
      const wifiMac = this.parseWifiMacFromAdvertisData(advHex)
      if (wifiMac) {
        return this.formatMingaDisplayNameFromWifiMac(wifiMac)
      }
    }
    if (!needsBleMacFromAdvertisData(getRuntimePlatform())) {
      const btMac = this.normalizeMacAddress(dev.deviceId)
      if (btMac) {
        const wifiMac = this.calcWifiMacMinusOne(btMac)
        if (wifiMac) {
          return this.formatMingaDisplayNameFromWifiMac(wifiMac)
        }
      }
    }
    return 'MingaXXXX'
  }

  enrichGoodSleepBleDevice(device, cachedAdvertisDataHex = '') {
    const dev = device || {}
    const advHex =
      this.normalizeAdvertisDataToHex(dev.advertisData) ||
      this.normalizeAdvertisDataToHex(cachedAdvertisDataHex)
    let deviceWifiMac = advHex ? this.parseWifiMacFromAdvertisData(advHex) : ''
    if (!deviceWifiMac) {
      deviceWifiMac = this.resolveCachedSoapMac()
    }
    const displayName = deviceWifiMac
      ? this.formatMingaDisplayNameFromWifiMac(deviceWifiMac)
      : this.formatMingaDisplayNameFromBleDevice({ ...dev, advertisData: advHex || cachedAdvertisDataHex })
    if (deviceWifiMac) {
      const advNote = advHex
        ? `advertisData=${advHex.slice(0, 24)}${advHex.length > 24 ? '…' : ''}`
        : 'advertisData 为空，使用 work 页扫描缓存 MAC'
      this.log(`配网设备 WiFi MAC=${deviceWifiMac} → ${displayName} (${advNote})`)
    } else {
      this.log(`配网设备未能解析 WiFi MAC，展示名 ${displayName}`)
    }
    return {
      ...dev,
      cachedAdvertisDataHex: advHex || cachedAdvertisDataHex || '',
      deviceWifiMac: deviceWifiMac || '',
      displayName
    }
  }

  calcWifiMacMinusOne(bluetoothMac) {
    const mac = this.normalizeMacAddress(bluetoothMac)
    if (!mac) return ''
    const seg = mac.split(':')
    const last = parseInt(seg[5], 16)
    if (Number.isNaN(last)) return ''
    const next = (last - 1 + 256) % 256
    seg[5] = next.toString(16).padStart(2, '0').toUpperCase()
    return seg.join(':')
  }

  deriveWifiMacFromBlufiDevice(device, options = {}) {
    const dev = device || {}
    const platform = getRuntimePlatform()
    const preferAdvertisData = options.preferAdvertisData === true
    const mustUseAdvertisData = preferAdvertisData || needsBleMacFromAdvertisData(platform)

    const advHex = this.normalizeAdvertisDataToHex(dev.advertisData)
    if (advHex) {
      const fromAdv = this.parseWifiMacFromAdvertisData(advHex)
      if (fromAdv) {
        this.log(`WiFi MAC 来自 advertisData: ${fromAdv}`)
        return fromAdv
      }
    }
    // iOS / 鸿蒙：有 deviceId 也不能用末字节 -1，必须与 iOS 一样只认 advertisData
    if (mustUseAdvertisData) {
      this.log('iOS/鸿蒙：advertisData 无法解析 WiFi MAC')
      return ''
    }

    let btMac = this.normalizeMacAddress(dev.deviceId)
    if (!btMac) {
      btMac = this.normalizeMacAddress(dev.deviceId || dev.uuid || '')
    }
    if (!btMac) return ''
    const wifiMac = this.calcWifiMacMinusOne(btMac)
    if (wifiMac) {
      this.log(`WiFi MAC 来自 deviceId 末字节-1: ${btMac} -> ${wifiMac}`)
    }
    return wifiMac
  }

  resolveCachedSoapMac() {
    return WifiToolManager.resolveWifiDeviceMac()
  }

  normalizeAdvertisDataToHex(advertisData) {
    if (!advertisData) return ''
    if (typeof advertisData === 'string') {
      return advertisData.replace(/[^0-9a-fA-F]/g, '')
    }
    try {
      const u8 = new Uint8Array(advertisData)
      return Array.from(u8)
        .map((b) => ('0' + (b & 0xff).toString(16)).slice(-2))
        .join('')
    } catch (e) {
      return ''
    }
  }

  /**
   * GoodSleep（BluFi）设备：从 advertisData 解析并写入 WiFi MAC（非 Minga 枕头广播）
   */
  persistWifiMacFromGoodSleepDevice(device, options = {}) {
    const d = device || {}
    const advHex = this.normalizeAdvertisDataToHex(
      d.advertisData || d.cachedAdvertisDataHex || ''
    )
    if (!advHex) {
      this.log('GoodSleep：无 advertisData，无法解析 WiFi MAC')
      return ''
    }
    const force = options.force !== false
    const saved = this.persistWifiMacForSoap(
      { advertisData: advHex },
      { force, preferAdvertisData: true }
    )
    if (saved) {
      const displayName = this.formatMingaDisplayNameFromWifiMac(saved)
      this.log(`GoodSleep：advertisData=${advHex.slice(0, 24)}${advHex.length > 24 ? '…' : ''} → WiFi MAC ${saved} → ${displayName}`)
    }
    return saved
  }

  /**
   * work 页扫描：发现 GoodSleep 且带 advertisData 时解析 WiFi MAC（不加入枕头连接列表）
   */
  handleGoodSleepDeviceOnScan(device, options = {}) {
    if (!WifiToolManager.isGoodSleepBleDevice(device)) {
      return ''
    }
    const advHex = this.normalizeAdvertisDataToHex(device && device.advertisData)
    if (!advHex) {
      return ''
    }
    return this.tryPersistMacFromGoodSleepScan({ advertisData: advHex }, options)
  }

  isGoodSleepBleDevice(device) {
    return WifiToolManager.isGoodSleepBleDevice(device)
  }

  /**
   * BluFi 扫描列表更新时：缓存 GoodSleep advertisData，有数据则尽早落库 WiFi MAC
   */
  tryPersistMacFromGoodSleepScan(device, options = {}) {
    const d = device || {}
    const advHex = this.normalizeAdvertisDataToHex(d.advertisData)
    if (!advHex) {
      return ''
    }
    if (!options.force && this.resolveCachedSoapMac()) {
      return this.resolveCachedSoapMac()
    }
    return this.persistWifiMacFromGoodSleepDevice(
      { advertisData: advHex },
      { force: options.force === true }
    )
  }

  /**
   * @deprecated 仅 GoodSleep 广播可解析 WiFi MAC，勿用 Minga 枕头 advertisData
   */
  tryPersistMacFromScanDevice(device, options = {}) {
    if (!needsBleMacFromAdvertisData(getRuntimePlatform())) {
      return ''
    }
    const d = device || {}
    const name = String(d.name || d.localName || '')
    const { isTargetName, force = false } = options
    if (typeof isTargetName === 'function' && !isTargetName(name)) {
      return ''
    }
    const advertisData = this.normalizeAdvertisDataToHex(d.advertisData)
    if (!advertisData) {
      return ''
    }
    if (!force && this.resolveCachedSoapMac()) {
      return this.resolveCachedSoapMac()
    }
    return this.persistWifiMacForSoap({
      advertisData,
      deviceId: d.deviceId || '',
      uuid: d.uuid || ''
    }, { force, preferAdvertisData: true })
  }

  /**
   * 配网点击 GoodSleep：从 GoodSleep advertisData 解析 WiFi MAC（非 Minga）
   */
  persistWifiMacFromAdvertisDataAtProvision(device) {
    const d = device || {}
    const advertisData = this.normalizeAdvertisDataToHex(d.advertisData)
    if (!advertisData) {
      this.log('配网：当前设备无 advertisData，无法解析 WiFi MAC')
      return ''
    }
    return this.persistWifiMacForSoap({
      advertisData
    }, { force: true, preferAdvertisData: true })
  }

  persistWifiMacForSoap(device, options = {}) {
    const force = options.force === true
    if (!force && this.resolveCachedSoapMac()) {
      return this.resolveCachedSoapMac()
    }
    const wifiMac = this.deriveWifiMacFromBlufiDevice(device, options)
    if (!wifiMac) {
      this.log('未能从设备信息推导 WiFi MAC（iOS/鸿蒙需从 advertisData 提取）')
      return ''
    }
    try {
      uni.setStorageSync(WIFI_DEVICE_MAC_KEY, wifiMac)
      WifiToolManager.clearLegacyMacStorageKeys()
    } catch (e) {
      this.log('保存 WiFi MAC 失败: ' + ((e && e.message) || e))
    }
    this.log(`已计算并保存 WiFi MAC: ${wifiMac}`)
    return wifiMac
  }
}

export { WifiToolManager }
export default WifiToolManager
