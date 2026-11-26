/**
 * EGLNY DocScroll compatibility shim — delegates to vendored LSDS
 * (/vendor/lsds/lsds.iife.js -> window.LSDS.initDocScroll / refreshTocPager).
 */
(function (root) {
  function init(options) {
    if (root.LSDS && typeof root.LSDS.initDocScroll === "function") {
      return root.LSDS.initDocScroll(options);
    }
    return { scrollToSection: function () {}, navigateToSection: function () {} };
  }

  function refreshTocPager() {
    if (root.LSDS && typeof root.LSDS.refreshTocPager === "function") {
      root.LSDS.refreshTocPager();
    }
  }

  root.DocScroll = {
    init: init,
    refreshTocPager: refreshTocPager,
  };
})(typeof window !== "undefined" ? window : globalThis);
