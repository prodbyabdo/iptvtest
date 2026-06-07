// ========================= HLS MANAGER =========================

export class HlsManager {
  constructor(videoElement, callbacks = {}) {
    this.video = videoElement;
    this.hls = null;
    this.callbacks = callbacks; // { onError, onReady }
  }

  play(url, onFatalError = null) {
    this.destroy(); // Ensure any existing instance is cleaned up

    const isHls = url.includes(".m3u8");
    const isTs = url.includes(".ts");

    if (isHls || isTs || (window.Hls && Hls.isSupported())) {
      // HLS stream, TS stream, or any URL — always try HLS.js first for live/stream URLs
      if (window.Hls && Hls.isSupported()) {
        this.hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          // More lenient error recovery for IPTV streams
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 3,
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
                // Try calling the fallback before giving up
                if (onFatalError) {
                  this.destroy();
                  onFatalError();
                } else if (this.callbacks.onError) {
                  this.callbacks.onError("network_error");
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                if (this.callbacks.onError) this.callbacks.onError("media_error_recovering");
                this.hls.recoverMediaError();
                break;
              default:
                if (onFatalError) {
                  this.destroy();
                  onFatalError();
                } else {
                  if (this.callbacks.onError) this.callbacks.onError("fatal_error");
                  this.destroy();
                }
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
        // Fallback to direct play
        this.video.src = url;
        this.video.play().catch((e) => {
          console.error("Play Error:", e);
          if (this.callbacks.onError) this.callbacks.onError("direct_play_error");
        });
        if (this.callbacks.onReady) this.callbacks.onReady();
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
