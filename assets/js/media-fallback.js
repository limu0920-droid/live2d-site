(() => {
  const RAW_BASE = 'https://raw.githubusercontent.com/limu0920-droid/live2d-site/main/';
  const VIDEO_PATH_MARKER = '/assets/videos/';
  const METADATA_TIMEOUT_MS = 3500;

  function toRawVideoUrl(value, includeHash = true) {
    if (!value) return '';

    const url = new URL(value, window.location.href);
    const markerIndex = url.pathname.indexOf(VIDEO_PATH_MARKER);
    if (markerIndex === -1) return '';

    const filePath = url.pathname.slice(markerIndex + VIDEO_PATH_MARKER.length);
    const rawUrl = `${RAW_BASE}assets/videos/${filePath}`;
    return includeHash && url.hash ? `${rawUrl}${url.hash}` : rawUrl;
  }

  function getVideoSource(video) {
    const source = video.querySelector('source');
    return {
      source,
      src: source?.getAttribute('src') || video.getAttribute('src') || ''
    };
  }

  function swapToRawSource(video, rawUrl) {
    if (!rawUrl || video.dataset.rawFallbackUsed === 'true') return;

    const source = video.querySelector('source');
    if (source) source.src = rawUrl;
    else video.src = rawUrl;

    video.dataset.rawFallbackUsed = 'true';
    video.load();
  }

  function installPreviewFallback(video) {
    video.preload = 'metadata';

    const { source, src } = getVideoSource(video);
    const rawUrl = toRawVideoUrl(src, true);
    if (rawUrl) video.dataset.rawFallbackSrc = rawUrl;
    let metadataTimer = null;

    const showFrame = () => {
      if (metadataTimer) clearTimeout(metadataTimer);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(0.1, video.duration / 2);
      }
    };

    if (video.readyState >= 1) showFrame();
    else video.addEventListener('loadedmetadata', showFrame, { once: true });

    if (!rawUrl) return;

    metadataTimer = setTimeout(() => {
      if (video.readyState < 1) swapToRawSource(video, rawUrl);
    }, METADATA_TIMEOUT_MS);

    const onError = () => {
      if (metadataTimer) clearTimeout(metadataTimer);
      swapToRawSource(video, rawUrl);
    };
    video.addEventListener('error', onError);
    source?.addEventListener('error', onError);
  }

  function installRawVideoLinks() {
    document.querySelectorAll('a[href^="assets/videos/"]').forEach((link) => {
      const localHref = link.getAttribute('href');
      const rawUrl = toRawVideoUrl(localHref, false);
      if (!rawUrl) return;

      link.dataset.localHref = localHref;
      link.href = rawUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  window.getPortfolioVideoUrl = (value) => toRawVideoUrl(value, false) || new URL(value, window.location.href).href;

  document.querySelectorAll('video[data-preview-video]').forEach(installPreviewFallback);
  installRawVideoLinks();
})();
