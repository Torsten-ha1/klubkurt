// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Simple mobile nav (no backdrop)
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  // close menu when a link is clicked
  navMenu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
  // close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// --- Music + Flash controller (confirmed playback) ---
const prefersReduced = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
const musicBtn = document.querySelector('.toggle-music');
const musicBadge = musicBtn ? musicBtn.querySelector('.music-badge') : null;
const nowPlayingBtn = document.querySelector('.now-playing-btn');
const scIframe = document.querySelector('iframe[src*="soundcloud.com/player"]');

let widget = null;
let widgetReady = false;

let userWantsPlay = false; // what the user intends
let confirmedPlaying = false; // we’ve observed real progress
let lastPlayCmdAt = 0;
let attempts = 0;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 160; // short retry keeps gesture context
let retryTimer = null;

function setBadge(stateText, isPlaying) {
  if (!musicBadge) return;
  musicBadge.textContent = stateText;
  musicBadge.classList.toggle('is-playing', !!isPlaying);
}

function updateUI(playing) {
  document.body.classList.toggle('flash-mode', playing);
  document.body.classList.toggle('music-on', playing);
  if (musicBtn) musicBtn.setAttribute('aria-pressed', String(playing));
  if (nowPlayingBtn) nowPlayingBtn.hidden = !playing;
  setBadge(playing ? 'Playing' : 'Not playing', playing);
}

function showLoading() {
  setBadge('Loading…', false);
  document.body.classList.add('music-on'); // show chip while we attempt
  if (musicBtn) musicBtn.setAttribute('aria-pressed', 'true');
  if (nowPlayingBtn) nowPlayingBtn.hidden = false;
}

function ensurePlaying() {
  if (!widget) return;
  lastPlayCmdAt = Date.now();
  attempts++;
  widget.play();
}

function confirmAndShowPlaying() {
  confirmedPlaying = true;
  attempts = 0;
  updateUI(true);
}

if (window.SC && scIframe) {
  // ---
  // Load the widget early and call play/pause to "prime" it
  SC.Widget(scIframe).bind(SC.Widget.Events.READY, function () {
    const widget = SC.Widget(scIframe);

    console.log('SoundCloud Widget ready');

    // Only prime for Safari to avoid Chrome scroll issues
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
      // Prime the widget for Safari - play then immediately pause
      widget.play();
      setTimeout(() => {
        widget.pause();
      }, 10);
    }
  });

  // --- Create widget and bind events
  widget = SC.Widget(scIframe);

  widget.bind(SC.Widget.Events.READY, () => {
    widgetReady = true;
    if (userWantsPlay && !confirmedPlaying) {
      showLoading();
      ensurePlaying();
    }
  });

  // The moment we see real progress, we know audio is actually rolling.
  widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
    // Only confirm if the user still intends to play
    if (!userWantsPlay) return;
    if (
      !confirmedPlaying &&
      e &&
      typeof e.currentPosition === 'number' &&
      e.currentPosition > 0
    ) {
      confirmAndShowPlaying();
    }
  });

  widget.bind(SC.Widget.Events.PLAY, () => {
    // Don’t switch UI yet — wait for PLAY_PROGRESS to prove it’s real
    // (this avoids the “lights up then snaps off” on Safari)
  });

  widget.bind(SC.Widget.Events.PAUSE, () => {
    console.log('Widget PAUSE event');

    if (userWantsPlay && !confirmedPlaying && attempts < MAX_ATTEMPTS) {
      // Safari/SC paused before progress — retry quickly within gesture window
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(ensurePlaying, RETRY_DELAY_MS);
      return;
    }
    // Real pause: reflect it
    confirmedPlaying = false;
    userWantsPlay = false;
    attempts = 0;
    updateUI(false);
  });

  widget.bind(SC.Widget.Events.FINISH, () => {
    confirmedPlaying = false;
    userWantsPlay = false;
    attempts = 0;
    updateUI(false);
  });
}

if (musicBtn) {
  musicBtn.addEventListener('click', () => {
    if (widget) {
      if (!widgetReady) {
        userWantsPlay = true;
        showLoading(); // visual feedback while we wait for READY
      } else {
        widget.isPaused((paused) => {
          if (paused) {
            userWantsPlay = true;
            confirmedPlaying = false;
            attempts = 0;
            showLoading();
            ensurePlaying();
          } else {
            // User requested pause: stop visuals immediately (optimistic UI)
            userWantsPlay = false;
            confirmedPlaying = false;
            attempts = 0;
            if (retryTimer) {
              clearTimeout(retryTimer);
              retryTimer = null;
            }
            widget.pause();
            lastPlayCmdAt = 0;
            updateUI(false);
          }
        });
      }
    } else {
      // Fallback (no API): just toggle visuals
      userWantsPlay = !userWantsPlay;
      confirmedPlaying = userWantsPlay;
      updateUI(confirmedPlaying);
    }

    // Close mobile menu if open
    const navToggle = document.querySelector('.nav-toggle');
    if (document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }

    if (prefersReduced) {
      musicBtn.title =
        'Playing works; visual effects are reduced due to motion preference';
    }
  });
}

if (nowPlayingBtn) {
  nowPlayingBtn.addEventListener('click', () => {
    userWantsPlay = false;
    confirmedPlaying = false;
    attempts = 0;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (widget) widget.pause();
    updateUI(false);
  });
}
