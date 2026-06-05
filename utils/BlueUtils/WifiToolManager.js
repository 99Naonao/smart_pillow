import PermissionToolManager from './PermissionToolManager.js'
import { getRuntimePlatform, needsBleMacFromAdvertisData } from '@/utils/platformBle.js'
import { isSystemLocationPermissionError, showWechatAppLocationPermissionModal } from '@/utils/permissionUtil.js'

const SOAP_MAC_STORAGE_KEYS = ['wifi_device_mac', 'soap_device_mac', 'device_mac', 'wifiMac', 'mac']
const WIFI_5G_KEYWORDS = ['-5g', '_5g', '5ghz', '-5ghz', '_5ghz', '5g_wifi', '5g-wifi']

class WifiToolManager {
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
    const hex = String(advertisData || '').replace(/[^0-9a-fA-F]/g, '')
    if (!hex || hex.length % 2 !== 0) return ''
    const raw = []
    for (let i = 0; i < hex.length; i += 2) {
      const b = parseInt(hex.slice(i, i + 2), 16)
      if (Number.isNaN(b)) return ''
      raw.push(b.toString(16).toUpperCase())
    }
    // 对齐 pillow/pages/blue/blue.js 的 _extractIOSMacAddress：
    // 参考 extractMacFromHexArray 的“半字节拼接”规则：
    // [2], [3]+[4][0], [5], [6]+[7][0], [8], [9]+[10][0]
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

  deriveWifiMacFromBlufiDevice(device) {
    const dev = device || {}
    const platform = getRuntimePlatform()

    let btMac = this.normalizeMacAddress(dev.deviceId)
    // iOS / 鸿蒙：deviceId 常为 UUID，仅从 advertisData 还原蓝牙 MAC。
    if (!btMac && needsBleMacFromAdvertisData(platform)) {
      btMac = this.convertAdvertisDataToMac(dev.advertisData)
      if (!btMac) return ''
      // 与 iOS 一致：直接使用广播解析 MAC，不再做末字节 -1。
      return btMac
    }
    // 兜底：Android 以 deviceId 为准；若恰好是 MAC 格式也可走通。
    if (!btMac) {
      btMac = this.normalizeMacAddress(dev.deviceId || dev.uuid || '')
    }
    if (!btMac) return ''
    return this.calcWifiMacMinusOne(btMac)
  }

  resolveCachedSoapMac() {
    for (let i = 0; i < SOAP_MAC_STORAGE_KEYS.length; i++) {
      const v = uni.getStorageSync(SOAP_MAC_STORAGE_KEYS[i])
      if (typeof v === 'string' && v.trim()) {
        return v.trim()
      }
    }
    return ''
  }

  /**
   * 扫描阶段从 advertisData 落库 WiFi MAC（iOS / 鸿蒙）
   * @param {object} device 蓝牙扫描设备
   * @param {{ isTargetName?: (name: string) => boolean }} options
   */
  tryPersistMacFromScanDevice(device, options = {}) {
    if (!needsBleMacFromAdvertisData(getRuntimePlatform())) {
      return ''
    }
    const d = device || {}
    const name = String(d.name || d.localName || '')
    const { isTargetName } = options
    if (typeof isTargetName === 'function' && !isTargetName(name)) {
      return ''
    }
    let advertisData = d.advertisData
    if (!advertisData) {
      return ''
    }
    if (typeof advertisData !== 'string') {
      try {
        const u8 = new Uint8Array(advertisData)
        advertisData = Array.from(u8)
          .map((b) => ('0' + (b & 0xff).toString(16)).slice(-2))
          .join('')
      } catch (e) {
        return ''
      }
    }
    if (this.resolveCachedSoapMac()) {
      return this.resolveCachedSoapMac()
    }
    return this.persistWifiMacForSoap({
      advertisData,
      deviceId: d.deviceId || '',
      uuid: d.uuid || ''
    })
  }

  persistWifiMacForSoap(device) {
    const wifiMac = this.deriveWifiMacFromBlufiDevice(device)
    if (!wifiMac) {
      this.log('未能从设备信息推导 WiFi MAC（iOS/鸿蒙需从 advertisData 提取）')
      return ''
    }
    try {
      // 兼容现有读取口径（status/report 会从这些 key 中择一读取）
      uni.setStorageSync('wifi_device_mac', wifiMac)
      uni.setStorageSync('soap_device_mac', wifiMac)
      uni.setStorageSync('device_mac', wifiMac)
      uni.setStorageSync('wifiMac', wifiMac)
      uni.setStorageSync('mac', wifiMac)
    } catch (e) {
      this.log('保存 WiFi MAC 失败: ' + ((e && e.message) || e))
    }
    this.log(`已计算并保存 WiFi MAC: ${wifiMac}`)
    return wifiMac
  }
}

export { WifiToolManager }
export default WifiToolManager
