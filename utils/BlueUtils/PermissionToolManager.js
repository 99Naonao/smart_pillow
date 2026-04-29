class PermissionToolManager {
  constructor(page) {
    this.page = page
  }

  ensureScope(scope, options = {}) {
    const modalTitle = options.modalTitle || '需要权限'
    const modalContent = options.modalContent || '请先授权后再重试。'
    const confirmText = options.confirmText || '去设置'

    return new Promise((resolve) => {
      uni.getSetting({
        success: (res) => {
          const auth = res.authSetting || {}
          if (auth[scope]) {
            resolve(true)
            return
          }
          uni.authorize({
            scope,
            success: () => resolve(true),
            fail: () => {
              uni.showModal({
                title: modalTitle,
                content: modalContent,
                confirmText,
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    uni.openSetting({
                      complete: (settingRes) => {
                        const nextAuth = (settingRes && settingRes.authSetting) || {}
                        resolve(!!nextAuth[scope])
                      }
                    })
                  } else {
                    resolve(false)
                  }
                }
              })
            }
          })
        },
        fail: () => resolve(false)
      })
    })
  }

  ensureLocationForWifiList() {
    return this.ensureScope('scope.userLocation', {
      modalTitle: '需要定位权限',
      modalContent: 'Android 获取 Wi-Fi 列表需要定位权限，请先授权后再重试。',
      confirmText: '去设置'
    })
  }
}

export { PermissionToolManager }
export default PermissionToolManager
