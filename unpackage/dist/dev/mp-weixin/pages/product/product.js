"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      title: "Hello123"
    };
  },
  onShow() {
    let curPages = getCurrentPages()[0];
    if (typeof curPages.getTabBar === "function" && curPages.getTabBar()) {
      curPages.getTabBar().setData({
        selected: 2
      });
    }
  },
  onLoad() {
  },
  methods: {}
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/workBase/Vue/sleeping/pages/product/product.vue"]]);
wx.createPage(MiniProgramPage);
