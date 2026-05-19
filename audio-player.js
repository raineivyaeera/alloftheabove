function initAudioPlayer(playerEl) {
  const src = playerEl.dataset.src || '';

  playerEl.innerHTML = `
    <button class="ap-play" aria-label="Play">
      <svg viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 14,8 3,15"/></svg>
    </button>
    <span class="ap-time">0:00 / 0:00</span>
    <div class="ap-scrubber">
      <div class="ap-scrubber-fill"></div>
      <input type="range" class="ap-range ap-seek" min="0" max="100" value="0" step="0.1"
        style="position:absolute;inset:0;width:100%;height:100%;opacity:0;" aria-label="Seek">
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
    <audio src="${src}"></audio>
  `;

  const audio   = playerEl.querySelector('audio');
  const playBtn = playerEl.querySelector('.ap-play');
  const timeEl  = playerEl.querySelector('.ap-time');
  const seekEl  = playerEl.querySelector('.ap-seek');
  const fillEl  = playerEl.querySelector('.ap-scrubber-fill');
  const volEl   = playerEl.querySelector('.ap-vol-range');
  const muteBtn = playerEl.querySelector('.ap-mute');
  const wave1   = playerEl.querySelector('.ap-wave1');
  const wave2   = playerEl.querySelector('.ap-wave2');

  function fmt(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return `${m}:${sec}`;
  }

  function setPlayIcon() {
    playBtn.querySelector('svg').innerHTML = '<polygon points="3,1 14,8 3,15"/>';
    playBtn.setAttribute('aria-label', 'Play');
  }

  function setPauseIcon() {
    playBtn.querySelector('svg').innerHTML =
      '<rect x="2" y="1" width="4" height="14"/><rect x="10" y="1" width="4" height="14"/>';
    playBtn.setAttribute('aria-label', 'Pause');
  }

  function setVolIcon(vol, muted) {
    wave1.style.display = (vol === 0 || muted) ? 'none' : '';
    wave2.style.display = (vol < 0.5 || muted) ? 'none' : '';
  }

  function updateTime() {
    timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fillEl.style.width = pct + '%';
    seekEl.value = pct;
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) { audio.play(); setPauseIcon(); }
    else { audio.pause(); setPlayIcon(); }
  });

  audio.addEventListener('ended', setPlayIcon);
  audio.addEventListener('timeupdate', updateTime);
  audio.addEventListener('loadedmetadata', updateTime);

  seekEl.addEventListener('input', () => {
    if (audio.duration) audio.currentTime = (seekEl.value / 100) * audio.duration;
  });

  volEl.addEventListener('input', () => {
    audio.volume = volEl.value;
    audio.muted = false;
    setVolIcon(parseFloat(volEl.value), false);
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    setVolIcon(audio.volume, audio.muted);
  });
}

document.querySelectorAll('.audio-player').forEach(initAudioPlayer);
