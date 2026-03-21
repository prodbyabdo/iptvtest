// ========================= HLS MANAGER =========================

export class HlsManager {
  constructor(videoElement, callbacks = {}) {
    this.video = videoElement;
    this.hls = null;
    this.callbacks = callbacks; // { onError, onReady }
  }

  play(url) {
    this.destroy(); // Ensure any existing instance is cleaned up

    if (url.includes(".m3u8")) {
      // HLS stream
      if (window.Hls && Hls.isSupported()) {
        this.hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
        });

        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.video.play().catch((e) => {
            console.error("Autoplay blocked:", e);
            if (this.callbacks.onError) {
              this.callbacks.onError("autoplay_blocked");
            }
          });
          if (this.callbacks.onReady) this.callbacks.onReady();
        });

        this.hls.on(Hls.Events.ERROR, (e, data) => {
          console.error("HLS Error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (this.callbacks.onError) this.callbacks.onError("network_error");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                if (this.callbacks.onError) this.callbacks.onError("media_error_recovering");
                this.hls.recoverMediaError();
                break;
              default:
                if (this.callbacks.onError) this.callbacks.onError("fatal_error");
                this.destroy();
                break;
            }
          }
        });
      } else if (this.video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        this.video.src = url;
        this.video.play().catch((e) => {
          console.error("Play Error:", e);
          if (this.callbacks.onError) this.callbacks.onError("play_error");
        });
        if (this.callbacks.onReady) this.callbacks.onReady();
      } else {
        if (this.callbacks.onError) this.callbacks.onError("not_supported");
      }
    } else {
      // Direct video file (mp4, mkv, etc.)
      this.video.src = url;
      this.video.play().catch((e) => {
        console.error("Play Error:", e);
        if (this.callbacks.onError) this.callbacks.onError("direct_play_error");
      });
      if (this.callbacks.onReady) this.callbacks.onReady();
    }
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.video.pause();
    this.video.src = "";
    this.video.removeAttribute("src");
    this.video.load();
  }
}
