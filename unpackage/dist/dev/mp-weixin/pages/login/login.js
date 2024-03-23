"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  // behaviors: [getBehavior(), yuvBehavior],
  onShow() {
    let curPages = getCurrentPages()[0];
    if (typeof curPages.getTabBar === "function" && curPages.getTabBar()) {
      curPages.getTabBar().setData({
        selected: 0,
        onshow: true
      });
    }
    console.log("createScopedThreejs:", common_vendor.dist.createScopedThreejs);
  },
  onShareAppMessage() {
  },
  data() {
    return {
      imgData: "",
      session: "",
      bodyImgUrl: "",
      bodyImgWidth: 0,
      bodyImgHeight: 0,
      bodyImgOriginWidth: 0,
      bodyImgOriginHeight: 0
    };
  },
  methods: {
    // 开始拍照
    startCamera() {
      common_vendor.index.navigateTo({
        url: "/pages/camera/camera"
      });
    },
    base64({
      url
    }) {
      return new Promise((resolve, reject) => {
        console.log("url:", url);
        common_vendor.wx$1.getFileSystemManager().readFile({
          filePath: url,
          //选择图片返回的相对路径
          encoding: "base64",
          //编码格式
          success: (res) => {
            resolve(res.data);
          },
          fail: (res) => reject(res.errMsg)
        });
      });
    },
    urlTobase64(url) {
      console.log("urlTobase641");
      return new Promise(function(resolve, reject) {
        console.log("urlTobase6421111");
        common_vendor.index.request({
          url,
          responseType: "arraybuffer",
          //最关键的参数，设置返回的数据格式为arraybuffer
          // responseType: 'text', //最关键的参数，设置返回的数据格式为arraybuffer
          success: (res) => {
            console.log("urlTobase642");
            let base64 = common_vendor.wx$1.arrayBufferToBase64(res.data);
            console.log(base64);
            resolve(base64);
          },
          fail: (error) => {
            console.log("err:", error);
          }
        });
      });
    },
    connectHandler() {
      common_vendor.index.chooseImage({
        success: async (chooseImageRes) => {
          const tempFilePaths = chooseImageRes.tempFilePaths;
          console.log("tempFiles:", chooseImageRes.tempFiles);
          common_vendor.wx$1.getImageInfo({
            src: tempFilePaths[0],
            success: (res) => {
              const fixWidth = 300;
              const {
                width,
                height
              } = res;
              console.log("getImageInfo res", res);
              this.bodyImgUrl = tempFilePaths[0];
              console.log("bodyImgUrl", this.bodyImgUrl);
              this.bodyImgWidth = fixWidth;
              this.bodyImgHeight = fixWidth / width * height;
              this.bodyImgOriginWidth = width;
              this.bodyImgOriginHeight = height;
              this.detecting(tempFilePaths);
            },
            fail: (res) => {
              console.error(res);
            }
          });
        }
      });
    },
    async detecting(tempFilePaths) {
      let base64 = await this.base64({
        url: tempFilePaths[0]
      });
      common_vendor.index.uploadFile({
        url: "https://dev.ic1101.top/new_battle/zhBaiduAip",
        filePath: tempFilePaths[0],
        name: "file",
        formData: {
          "fileName": base64,
          "user": "test"
        },
        success: (uploadFileRes) => {
          let obj = JSON.parse(uploadFileRes.data);
          console.log("success", obj);
          let person = obj.person_info[0];
          let body_parts = person.body_parts;
          let left_shoulder = body_parts.left_shoulder;
          let right_shoulder = body_parts.right_shoulder;
          let leftShoulder = left_shoulder.x;
          let rightShoulder = right_shoulder.x;
          let space = Math.abs(rightShoulder - leftShoulder);
          space = space / this.bodyImgOriginWidth;
          space = space.toFixed(2);
          common_vendor.index.showToast({
            title: "肩宽约:" + space + "m",
            icon: "none",
            //如果要纯文本，不要icon，将值设为'none'
            duration: 5e3
            //持续时间为 2秒
          });
        },
        fail: () => {
          console.log("fail");
        }
      });
    },
    chooseMedia() {
      if (!this.session) {
        this.session = common_vendor.wx$1.createVKSession({
          track: {
            body: {
              mode: 1
            }
            // mode: 1 - 使用摄像头；2 - 手动传入图像
          },
          version: "v2"
        });
        this.session.on("updateAnchors", (anchors) => {
          anchors.forEach((anchor) => {
            console.log("anchor.points", anchor.points);
            console.log("anchor.origin", anchor.origin);
            console.log("anchor.size", anchor.size);
            console.log("anchor.angle", anchor.angle);
          });
        });
      }
      common_vendor.wx$1.chooseMedia({
        count: 1,
        mediaType: ["image"],
        success: (res) => {
          console.log("chooseMedia res", res);
          const imgUrl = res.tempFiles[0].tempFilePath;
          common_vendor.wx$1.getImageInfo({
            src: imgUrl,
            success: (res2) => {
              const fixWidth = 300;
              const {
                width,
                height
              } = res2;
              console.log("getImageInfo res", res2);
              this.bodyImgUrl = imgUrl;
              console.log("bodyImgUrl", this.bodyImgUrl);
              this.bodyImgWidth = fixWidth;
              this.bodyImgHeight = fixWidth / width * height;
              this.bodyImgOriginWidth = width;
              this.bodyImgOriginHeight = height;
            },
            fail: (res2) => {
              console.error(res2);
            }
          });
        },
        fail: (res) => {
          console.error(res);
        }
      });
    },
    async detectbody() {
      if (this.bodyImgUrl) {
        const canvas = common_vendor.wx$1.createOffscreenCanvas({
          type: "2d",
          width: this.bodyImgOriginWidth,
          height: this.bodyImgOriginHeight
        });
        const context = canvas.getContext("2d");
        const img = canvas.createImage();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = this.bodyImgUrl;
        });
        context.clearRect(0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight);
        context.drawImage(img, 0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight);
        this.imgData = context.getImageData(0, 0, this.bodyImgOriginWidth, this.bodyImgOriginHeight);
        console.log("[frameBuffer] --> ", this.imgData.data.buffer);
        console.log("this.session.detectBody", this.session.detectBody);
        console.log("width", this.bodyImgOriginWidth);
        console.log("height", this.bodyImgOriginHeight);
        this.session.start((errno) => {
          if (errno) {
            console.log("errno", errno);
          } else {
            this.session.detectBody({
              frameBuffer: this.imgData.data.buffer,
              width: this.bodyImgOriginWidth,
              height: this.bodyImgOriginHeight,
              scoreThreshold: 0.1,
              // 评分阈值
              sourceType: 1
            });
          }
        });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.connectHandler && $options.connectHandler(...args)),
    b: $data.bodyImgUrl,
    c: common_vendor.o((...args) => $options.startCamera && $options.startCamera(...args)),
    d: common_vendor.o((...args) => $options.chooseMedia && $options.chooseMedia(...args)),
    e: $data.bodyImgUrl == "",
    f: common_vendor.o((...args) => $options.detectbody && $options.detectbody(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/workBase/Vue/sleeping/pages/login/login.vue"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
