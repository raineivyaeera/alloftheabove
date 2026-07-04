/**
 * Minimal audio player
 * - Injects its own styles (no separate CSS file needed)
 * - Auto-initializes any `.audio-player` element with a `data-src` attribute
 * - Safe to call `initAudioPlayer()` manually for elements added later
 */
(function () {
  'use strict';

  const ICON_PLAY = '<polygon points="3,1 14,8 3,15"/>';
  const ICON_PAUSE = '<rect x="2" y="1" width="4" height="14"/><rect x="10" y="1" width="4" height="14"/>';

  function injectStyles() {
    if (document.getElementById('ap-styles')) return;

    const style = document.createElement('style');
    style.id = 'ap-styles';
    style.textContent = `
      .audio-player {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px dashed #8b0023;
        margin: 0em 10%;
        padding: 10px 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #e5e5e5;
      }
      .audio-player audio { display: none; }
      .ap-play {
        flex: 0 0 auto;
        width: 36px;
        height: 36px;
        border: none;
        color: #a7002a;
        background: #00000000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s ease, transform 0.1s ease;
      }
      .ap-play:hover { background: #5252526d; }
      .ap-play:active { transform: scale(0.94); }
      .ap-play:disabled {
        background: #2a2a2a;
        color: #666;
        cursor: not-allowed;
      }
      .ap-play svg { width: 16px; height: 16px; }
      .ap-time {
        flex: 0 0 auto;
        font-size: 12px;
        color: #888;
        font-variant-numeric: tabular-nums;
        min-width: 84px;
        text-align: center;
      }
      .ap-scrubber {
        position: relative;
        flex: 1 1 auto;
        height: 4px;
        background: #2a2a2a;
        cursor: pointer;
      }
      .ap-scrubber-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 0%;
        background: #a7002a;
        pointer-events: none;
      }
      .ap-seek {
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
        background: transparent;
      }
      .ap-seek:disabled { cursor: not-allowed; }
      .ap-seek::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        background: #a7002a;
        border: 2px solid #000;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .ap-seek::-moz-range-thumb {
        width: 12px;
        height: 12px;
        background: #a7002a;
        border: 2px solid #000;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .ap-scrubber:hover .ap-seek::-webkit-slider-thumb,
      .ap-seek:focus::-webkit-slider-thumb,
      .ap-scrubber:hover .ap-seek::-moz-range-thumb,
      .ap-seek:focus::-moz-range-thumb {
        opacity: 1;
      }
      .ap-vol {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
      }
      .ap-mute {
        border: none;
        background: none;
        color: #a7002a;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: color 0.15s ease;
      }
      .ap-mute:hover { color: #999; }
      .ap-mute svg { width: 16px; height: 16px; }
      .ap-vol-range {
        -webkit-appearance: none;
        appearance: none;
        width: 60px;
        height: 3px;
        background: #2a2a2a;
        cursor: pointer;
      }
      .ap-vol-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        background: #a7002a;
        cursor: pointer;
      }
      .ap-vol-range::-moz-range-thumb {
        width: 10px;
        height: 10px;
        background: #a7002a;
        border: none;
        cursor: pointer;
      }
      .ap-vol-range::-moz-range-track {
        background: #2a2a2a;
        height: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  function fmt(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }

  function initAudioPlayer(playerEl) {
    // Guard against re-initializing the same element twice (duplicate
    // listeners, broken state) if this ever gets called more than once
    // for the same node, e.g. after a framework re-render.
    if (playerEl.dataset.apInitialized) return;
    playerEl.dataset.apInitialized = 'true';

    const src = playerEl.dataset.src || '';

    playerEl.innerHTML = `
      <button class="ap-play" aria-label="Play"${src ? '' : ' disabled'}>
        <svg viewBox="0 0 16 16" fill="currentColor">${ICON_PLAY}</svg>
      </button>
      <span class="ap-time">0:00 / 0:00</span>
      <div class="ap-scrubber">
        <div class="ap-scrubber-fill"></div>
        <input type="range" class="ap-range ap-seek" min="0" max="100" value="0" step="0.1"
          style="position:absolute;inset:0;width:100%;height:100%;opacity:0;" aria-label="Seek"${src ? '' : ' disabled'}>
      </div>
      <div class="ap-vol">
        <button class="ap-mute" aria-label="Mute">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 5.5h2.5L8 2.5v11L4.5 10.5H2z"/>
            <path class="ap-wave1" d="M10 5.5a3 3 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.2"/>
            <path class="ap-wave2" d="M11.5 3.5a5.5 5.5 0 0 1 0 9" fill="none" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>
        <input type="range" class="ap-vol-range" min="0" max="1" value="1" step="0.01" aria-label="Volume">
      </div>
      <audio${src ? ` src="${src}"` : ''} preload="metadata"></audio>
    `;

    const timeEl = playerEl.querySelector('.ap-time');

    if (!src) {
      // No point wiring up listeners around an empty src — also avoids
      // the browser silently re-requesting the current page as "audio".
      timeEl.textContent = 'No audio source';
      return;
    }

    const audio   = playerEl.querySelector('audio');
    const playBtn = playerEl.querySelector('.ap-play');
    const seekEl  = playerEl.querySelector('.ap-seek');
    const fillEl  = playerEl.querySelector('.ap-scrubber-fill');
    const volEl   = playerEl.querySelector('.ap-vol-range');
    const muteBtn = playerEl.querySelector('.ap-mute');
    const wave1   = playerEl.querySelector('.ap-wave1');
    const wave2   = playerEl.querySelector('.ap-wave2');

    // Prevents the timeupdate handler from yanking the scrubber back
    // while the user is actively dragging it.
    let isSeeking = false;

    function setPlayIcon() {
      playBtn.querySelector('svg').innerHTML = ICON_PLAY;
      playBtn.setAttribute('aria-label', 'Play');
    }

    function setPauseIcon() {
      playBtn.querySelector('svg').innerHTML = ICON_PAUSE;
      playBtn.setAttribute('aria-label', 'Pause');
    }

    function setVolIcon(vol, muted) {
      wave1.style.display = (vol === 0 || muted) ? 'none' : '';
      wave2.style.display = (vol < 0.5 || muted) ? 'none' : '';
    }

    function updateTime() {
      timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
      if (isSeeking) return;
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      fillEl.style.width = pct + '%';
      seekEl.value = pct;
    }

    // audio.play() returns a promise that rejects on autoplay restrictions,
    // a not-yet-ready source, or being interrupted by a near-simultaneous
    // pause(). Leaving that unhandled throws an "Uncaught (in promise)"
    // console error and can leave the icon stuck on "pause".
    function safePlay() {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.warn('Audio playback failed:', err);
          setPlayIcon();
        });
      }
    }

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        safePlay();
      } else {
        audio.pause();
      }
    });

    // Drive the icon off the audio element's actual state rather than only
    // the button click, so it stays correct even if playback is controlled
    // elsewhere (media keys, another script, etc.).
    audio.addEventListener('play', setPauseIcon);
    audio.addEventListener('pause', setPlayIcon);
    audio.addEventListener('ended', setPlayIcon);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('durationchange', updateTime);

    audio.addEventListener('error', () => {
      timeEl.textContent = 'Unable to load audio';
      playBtn.disabled = true;
      seekEl.disabled = true;
    });

    // Split the seek interaction: 'input' just previews the position while
    // dragging (no actual seek yet), 'change' commits it on release. Setting
    // currentTime on every single drag tick caused visible stutter, since
    // the browser has to re-buffer/seek on each one.
    seekEl.addEventListener('input', () => {
      isSeeking = true;
      const pct = parseFloat(seekEl.value);
      fillEl.style.width = pct + '%';
      if (audio.duration) {
        timeEl.textContent = `${fmt((pct / 100) * audio.duration)} / ${fmt(audio.duration)}`;
      }
    });

    seekEl.addEventListener('change', () => {
      if (audio.duration) {
        audio.currentTime = (seekEl.value / 100) * audio.duration;
      }
      isSeeking = false;
    });

    volEl.addEventListener('input', () => {
      const vol = parseFloat(volEl.value);
      audio.volume = vol;
      audio.muted = false;
      setVolIcon(vol, false);
    });

    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      setVolIcon(audio.volume, audio.muted);
    });
  }

  function init() {
    injectStyles();
    document.querySelectorAll('.audio-player').forEach(initAudioPlayer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed so you can initialize players added dynamically after page load,
  // e.g. window.initAudioPlayer(newPlayerEl)
  window.initAudioPlayer = initAudioPlayer;
})();