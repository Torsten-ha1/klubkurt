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

// --- Site Configuration Management ---
class SiteConfigManager {
  constructor() {
    this.apiBaseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api.klub-kurt.com/'
        : 'http://localhost:3001/';
    this.marqueeElement = document.querySelector('.marquee__track');
    this.soundcloudIframe = document.querySelector(
      'iframe[src*="soundcloud.com/player"]'
    );
    this.isLoading = false;

    // Initialize site configuration loading
    this.loadConfigurations();
  }

  async loadConfigurations() {
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      const response = await fetch(`${this.apiBaseUrl}/siteconfigs`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        this.applyConfigurations(data.data);
      } else {
        console.warn('Invalid response format from site config API');
      }
    } catch (error) {
      console.warn(
        'Failed to load site configurations, using defaults:',
        error
      );
      // Keep existing hardcoded values as fallback
    } finally {
      this.isLoading = false;
    }
  }

  applyConfigurations(configs) {
    // Update marquee banner
    if (configs.marquee && configs.marquee.texts && this.marqueeElement) {
      this.updateMarqueeBanner(configs.marquee.texts);
    }

    // Update SoundCloud widget
    if (configs.soundcloud && configs.soundcloud.url && this.soundcloudIframe) {
      this.updateSoundCloudWidget(configs.soundcloud.url);
    }
  }

  updateMarqueeBanner(texts) {
    if (!Array.isArray(texts) || texts.length !== 4) {
      console.warn('Invalid marquee texts format:', texts);
      return;
    }

    // Clear existing content
    this.marqueeElement.innerHTML = '';

    // Add new spans with the configured texts
    texts.forEach((text) => {
      const span = document.createElement('span');
      span.textContent = text;
      this.marqueeElement.appendChild(span);
    });

    console.log('Updated marquee banner with CMS content');
  }

  updateSoundCloudWidget(soundcloudUrl) {
    try {
      // Convert SoundCloud track URL to embeddable format
      const embedUrl = this.convertToEmbedUrl(soundcloudUrl);

      if (embedUrl && embedUrl !== this.soundcloudIframe.src) {
        // Store current widget state
        const wasReady = widgetReady;
        const wasPlaying = userWantsPlay && confirmedPlaying;

        // Stop current widget if playing
        if (wasPlaying && widget) {
          widget.pause();
          userWantsPlay = false;
          confirmedPlaying = false;
          updateUI(false);
        }

        // Update iframe src
        this.soundcloudIframe.src = embedUrl;

        // Reinitialize widget
        this.reinitializeSoundCloudWidget();

        console.log('Updated SoundCloud widget with new track:', embedUrl);
      }
    } catch (error) {
      console.error('Error updating SoundCloud widget:', error);
    }
  }

  convertToEmbedUrl(trackUrl) {
    if (!trackUrl || !trackUrl.includes('soundcloud.com')) {
      return null;
    }

    // If it's already an embed URL, return as is
    if (trackUrl.includes('w.soundcloud.com/player')) {
      return trackUrl;
    }

    // Convert regular SoundCloud URL to embed format
    const baseEmbedUrl = 'https://w.soundcloud.com/player/?url=';
    const params =
      '&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true';

    return `${baseEmbedUrl}${encodeURIComponent(trackUrl)}${params}`;
  }

  reinitializeSoundCloudWidget() {
    if (window.SC && this.soundcloudIframe) {
      // Reset widget state
      widget = null;
      widgetReady = false;

      // Small delay to ensure iframe has loaded
      setTimeout(() => {
        widget = SC.Widget(this.soundcloudIframe);
        this.bindWidgetEvents();
      }, 500);
    }
  }

  bindWidgetEvents() {
    if (!widget) return;

    widget.bind(SC.Widget.Events.READY, () => {
      widgetReady = true;
      console.log('New SoundCloud widget ready');

      if (userWantsPlay && !confirmedPlaying) {
        showLoading();
        ensurePlaying();
      }
    });

    widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
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

    widget.bind(SC.Widget.Events.PAUSE, () => {
      console.log('New widget PAUSE event');

      if (userWantsPlay && !confirmedPlaying && attempts < MAX_ATTEMPTS) {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(ensurePlaying, RETRY_DELAY_MS);
        return;
      }

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
}

// --- Events Management ---
class EventsManager {
  constructor() {
    this.eventsContainer = document.querySelector('.event-list');
    this.apiBaseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api.klub-kurt.com/'
        : 'http://localhost:3001/';
    this.isLoading = false;

    // Initialize events loading
    this.loadEvents();
  }

  async loadEvents() {
    if (this.isLoading || !this.eventsContainer) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/events?upcoming=true&limit=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        this.renderEvents(data.data);
      } else {
        this.showErrorState('Invalid response format from server');
      }
    } catch (error) {
      console.warn(
        'Failed to load dynamic events, dont using fallback:',
        error
      );
      // this.showFallbackEvents();
    } finally {
      this.isLoading = false;
    }
  }

  showLoadingState() {
    this.eventsContainer.innerHTML = `
      <div class="events-loading">
        <div class="loading-spinner"></div>
        <p>Loading upcoming events...</p>
      </div>
    `;
  }

  showErrorState(message) {
    this.eventsContainer.innerHTML = `
      <div class="events-error">
        <p>Unable to load events: ${message}</p>
        <p>Please try again later.</p>
      </div>
    `;
  }

  showFallbackEvents() {
    // Fallback to original hardcoded events if API fails
    this.eventsContainer.innerHTML = `Error loading events`;
  }

  renderEvents(events) {
    if (!events || events.length === 0) {
      this.eventsContainer.innerHTML = `
        <div class="events-empty">
          <h3>No upcoming events</h3>
          <p>Check back soon for new events!</p>
        </div>
      `;
      return;
    }

    const eventsHtml = events
      .map((event) => this.createEventHTML(event))
      .join('');
    this.eventsContainer.innerHTML = eventsHtml;
  }

  createEventHTML(event) {
    const eventDate = new Date(event.date);
    const formattedDate = this.formatEventDate(eventDate);
    const lineupText = this.formatLineup(event.lineup);
    const tagsHTML = this.formatTags(event.tags);

    return `
      <article class="event">
        <header>
          <time datetime="${
            eventDate.toISOString().split('T')[0]
          }">${formattedDate}</time>
          <h3>${this.escapeHTML(event.title)}</h3>
        </header>
        ${lineupText ? `<p class="lineup">${lineupText}</p>` : ''}
        ${tagsHTML ? `<div class="tags">${tagsHTML}</div>` : ''}
        <a class="btn btn--small" href="#tickets">Tickets</a>
      </article>
    `;
  }

  formatEventDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName} · ${day} ${month} ${year}`;
  }

  formatLineup(lineup) {
    if (!lineup || lineup.length === 0) return '';

    const formattedLineup = lineup
      .filter((artist) => artist && artist.trim())
      .map((artist) => `<strong>${this.escapeHTML(artist)}</strong>`)
      .join(', ');

    return formattedLineup ? `Line-up: ${formattedLineup}` : '';
  }

  formatTags(tags) {
    if (!tags || tags.length === 0) return '';

    return tags
      .filter((tag) => tag && tag.trim())
      .map((tag) => `<span>${this.escapeHTML(tag)}</span>`)
      .join('');
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize managers when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new EventsManager();
    new SiteConfigManager();
  });
} else {
  new EventsManager();
  new SiteConfigManager();
}
