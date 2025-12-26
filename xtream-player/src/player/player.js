// Video player wrapper for HLS.js
class VideoPlayer {
  constructor(videoElement, options = {}) {
    this.video = videoElement;
    this.hls = null;
    this.options = { ...CONFIG.HLS_CONFIG, ...options };
    this.currentStreamId = null;
    this.currentStreamType = 'live';
    this.playbackPosition = 0;
    this.setupListeners();
  }

  setupListeners() {
    this.video.addEventListener('play', () => this.onPlay());
    this.video.addEventListener('pause', () => this.onPause());
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('ended', () => this.onEnded());
  }

  play(streamUrl, streamId, streamType = 'live') {
    this.currentStreamId = streamId;
    this.currentStreamType = streamType;

    // Determine stream type
    const { isM3U8, isMKV, isMP4, isTS } = Utils.parseStreamUrl(streamUrl);

    if (isM3U8 && Hls.isSupported()) {
      this.playHLS(streamUrl);
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      this.video.src = streamUrl;
      this.video.play().catch(err => console.error('Play error:', err));
    } else if (isMKV || isTS) {
      // MKV/TS typically need external player or conversion
      // Try to play as video stream
      this.video.src = streamUrl;
      this.video.play().catch(err => console.error('Play error:', err));
    } else {
      // Direct media file
      this.video.src = streamUrl;
      this.video.play().catch(err => console.error('Play error:', err));
    }

    // Resume playback position if available
    this.resumePlaybackPosition();
  }

  playHLS(url) {
    if (this.hls) {
      this.hls.destroy();
    }

    this.hls = new Hls(this.options);
    this.hls.loadSource(url);
    this.hls.attachMedia(this.video);

    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.video.play().catch(err => console.error('Play error:', err));
    });

    this.hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS error:', data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            this.hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            this.video.play().catch(err => console.error('Play error:', err));
            break;
        }
      }
    });
  }

  stop() {
    this.video.pause();
    this.video.src = '';
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  onPlay() {
    console.log('Video playing');
  }

  onPause() {
    console.log('Video paused');
  }

  onTimeUpdate() {
    this.playbackPosition = this.video.currentTime;
  }

  onEnded() {
    console.log('Video ended');
    if (CONFIG.FEATURES.WATCH_HISTORY) {
      storage.addToHistory(this.currentStreamType, { id: this.currentStreamId }, this.video.duration);
    }
  }

  async savePlaybackPosition() {
    if (!CONFIG.FEATURES.RESUME_PLAYBACK) return;
    const key = `playback_${this.currentStreamType}_${this.currentStreamId}`;
    localStorage.setItem(key, JSON.stringify({
      position: this.playbackPosition,
      duration: this.video.duration,
      timestamp: Date.now()
    }));
  }

  async resumePlaybackPosition() {
    if (!CONFIG.FEATURES.RESUME_PLAYBACK) return;
    const key = `playback_${this.currentStreamType}_${this.currentStreamId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const { position } = JSON.parse(saved);
      if (position > 0 && position < this.video.duration) {
        this.video.currentTime = position;
      }
    }
  }

  setVolume(volume) {
    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  setPlaybackRate(rate) {
    this.video.playbackRate = rate;
  }

  enterFullscreen() {
    if (this.video.requestFullscreen) {
      this.video.requestFullscreen();
    } else if (this.video.webkitRequestFullscreen) {
      this.video.webkitRequestFullscreen();
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}
