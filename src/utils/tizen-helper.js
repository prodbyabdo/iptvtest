export const TizenHelper = {
  isTizen() {
    return !!(window.tizen && window.tizen.tvinputdevice);
  },

  registerKeys() {
    if (!this.isTizen()) return;
    const keys = ["MediaPlay", "MediaPause", "MediaStop", "MediaFastForward", "MediaRewind"];
    keys.forEach(keyName => {
      try {
        window.tizen.tvinputdevice.registerKey(keyName);
      } catch (e) {
        console.error("Failed to register Tizen key:", keyName, e);
      }
    });
  },

  exitApp() {
    if (window.tizen && window.tizen.application) {
      try {
        window.tizen.application.getCurrentApplication().exit();
      } catch (err) {
        console.error("Failed to exit Tizen app:", err);
      }
    }
  }
};
