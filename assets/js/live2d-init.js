(() => {
  const root = document.querySelector('[data-live2d-root]');
  if (!root) return;

  const canvas = root.querySelector('canvas');
  const status = root.querySelector('[data-live2d-status]');
  const MODEL_PATH = 'assets/live2d/model/canned-god/model.model3.json';
  const FALLBACK_MODEL_PATH = 'assets/live2d/model/canned-god/model-lite.model3.json';
  const RAW_MODEL_PATH = 'https://raw.githubusercontent.com/limu0920-droid/live2d-site/main/assets/live2d/model/canned-god/model.model3.json';
  const RAW_FALLBACK_MODEL_PATH = 'https://raw.githubusercontent.com/limu0920-droid/live2d-site/main/assets/live2d/model/canned-god/model-lite.model3.json';
  const MODEL_SOURCES = [
    ['GitHub Pages', MODEL_PATH, FALLBACK_MODEL_PATH],
    ['GitHub raw', RAW_MODEL_PATH, RAW_FALLBACK_MODEL_PATH]
  ];
  const MODEL_OPTIONS = {
    autoHitTest: true,
    autoFocus: true
  };
  const RUNTIME_FALLBACK_SCRIPTS = [
    'assets/js/vendor/pixi-live2d-display-cubism4.min.js?v=20260708-runtime-fallback1',
    'assets/js/vendor/pixi-live2d-display.min.js?v=20260708-runtime-fallback1'
  ];
  const CUBISM_MEMORY_BYTES = 128 * 1024 * 1024;
  const MAX_RENDER_RESOLUTION = 3;
  const MASK_RENDER_TEXTURE_COUNT = 2;
  const HIDDEN_DRAWABLE_IDS = new Set(['ArtMesh312']);
  const MODEL_DEFAULT_PARAMETERS = [
    ['Param33', 0], ['Param34', 0], ['Param46', 0], ['Param51', 0],
    ['Param52', 0], ['Param53', 0], ['Param62', 0], ['Param65', 0],
    ['Param66', 0], ['Param67', 0], ['Param69', 0], ['Param71', 0],
    ['Param72', 0], ['Param73', 0], ['Param75', 1]
  ];
  const CLOSED_MOUTH_PARAMETERS = [
    ['ParamMouthForm', 0],
    ['ParamMouthOpenY', 0],
    ['ParamMouthX', 0],
    ['ParamMouthPucker', 0],
    ['ParamMouthshrug', 0],
    ['ParamJawOpen', 0],
    ['ParamCheek', 0],
    ['TongueOut2', 0]
  ];

  let app = null;
  let settled = false;

  function setStatus(text) {
    if (!status) return;
    status.textContent = text;
    status.hidden = !text;
    status.title = text || '';
  }

  function formatError(error) {
    if (!error) return 'unknown error';
    if (error.message) return error.message;
    return String(error);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function fitModel(model) {
    const width = app.screen.width;
    const height = app.screen.height;
    const bounds = model.getLocalBounds();
    const modelWidth = bounds.width || model.internalModel?.width || 1400;
    const modelHeight = bounds.height || model.internalModel?.height || 1500;
    const scale = Math.min(width / modelWidth, height / modelHeight) * 0.92;

    model.anchor.set(0.5, 0.5);
    model.x = width * 0.5;
    model.y = height * 0.54;
    model.scale.set(scale);
  }

  function getRenderResolution() {
    return Math.min(window.devicePixelRatio || 1, MAX_RENDER_RESOLUTION);
  }

  function syncRenderer(model) {
    const resolution = getRenderResolution();
    if (app.renderer.resolution !== resolution) app.renderer.resolution = resolution;
    app.renderer.resize(root.clientWidth, root.clientHeight);
    fitModel(model);
  }

  function getCubismId(id) {
    const manager = window.Live2DCubismFramework?.CubismFramework?.getIdManager?.();
    return manager ? manager.getId(id) : id;
  }

  function setModelParameter(model, id, value) {
    const coreModel = model.internalModel?.coreModel;
    if (!coreModel) return;

    const cubismId = getCubismId(id);
    if (
      typeof coreModel.getParameterIndex === 'function' &&
      typeof coreModel.getParameterCount === 'function' &&
      typeof coreModel.setParameterValueByIndex === 'function'
    ) {
      const index = coreModel.getParameterIndex(cubismId);
      if (index >= 0 && index < coreModel.getParameterCount()) {
        coreModel.setParameterValueByIndex(index, value);
        return;
      }
    }

    if (typeof coreModel.setParameterValueById === 'function') {
      coreModel.setParameterValueById(cubismId, value);
    }
  }

  function applyModelDefaults(model) {
    for (const [id, value] of MODEL_DEFAULT_PARAMETERS) setModelParameter(model, id, value);
    applyClosedMouth(model);
  }

  function applyClosedMouth(model) {
    for (const [id, value] of CLOSED_MOUTH_PARAMETERS) {
      setModelParameter(model, id, value);
    }
  }

  function hideModelDrawables(model) {
    const internalModel = model.internalModel;
    const coreModel = internalModel?.coreModel;
    const source = coreModel?.getModel?.();
    const ids = internalModel?.getDrawableIDs?.();
    const opacities = source?.drawables?.opacities;
    if (!ids || !opacities) return;

    for (let index = 0; index < ids.length; index += 1) {
      if (HIDDEN_DRAWABLE_IDS.has(ids[index])) opacities[index] = 0;
    }
  }

  function configureMaskRenderer(model) {
    const internalModel = model.internalModel;
    const renderer = internalModel?.renderer;
    const coreModel = internalModel?.coreModel;
    if (!renderer || !coreModel?.isUsingMasking?.()) return;

    renderer._clippingManager?.release?.();
    renderer.initialize(coreModel, MASK_RENDER_TEXTURE_COUNT);
    renderer.setIsPremultipliedAlpha(true);
  }

  function installModelDefaults(model) {
    applyModelDefaults(model);
    hideModelDrawables(model);

    const internalModel = model.internalModel;
    internalModel?.on?.('beforeModelUpdate', () => applyClosedMouth(model));
  }

  function installDrag() {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const moveTo = (left, top) => {
      const maxLeft = window.innerWidth - root.offsetWidth;
      const maxTop = window.innerHeight - root.offsetHeight;
      root.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
      root.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
      root.style.right = 'auto';
      root.style.bottom = 'auto';
    };

    root.addEventListener('pointerdown', (event) => {
      dragging = true;
      root.setPointerCapture?.(event.pointerId);
      const rect = root.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
    });

    root.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      event.preventDefault();
      moveTo(startLeft + event.clientX - startX, startTop + event.clientY - startY);
      if (window.__live2dModel) fitModel(window.__live2dModel);
    });

    const stop = (event) => {
      dragging = false;
      root.releasePointerCapture?.(event.pointerId);
    };
    root.addEventListener('pointerup', stop);
    root.addEventListener('pointercancel', stop);
    window.addEventListener('resize', () => {
      const rect = root.getBoundingClientRect();
      moveTo(rect.left, rect.top);
    });
  }

  function assertBrowserMode() {
    if (window.location.protocol === 'file:') {
      throw new Error('请不要直接双击 index.html，请先运行 node server.js，再打开 http://127.0.0.1:8000/index.html');
    }
  }

  function hasLive2DModelRuntime() {
    return Boolean(
      window.PIXI &&
      window.PIXI.live2d &&
      window.PIXI.live2d.Live2DModel &&
      typeof window.PIXI.live2d.Live2DModel.from === 'function'
    );
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureRuntime() {
    if (!canvas) throw new Error('Live2D canvas is missing');
    if (!window.PIXI) throw new Error('PIXI runtime is missing');
    if (!window.Live2DCubismCore) throw new Error('Live2D Cubism Core runtime is missing');

    for (const src of RUNTIME_FALLBACK_SCRIPTS) {
      if (hasLive2DModelRuntime()) break;
      setStatus('Live2D: loading fallback runtime');
      await loadScript(src);
    }

    if (!window.PIXI.live2d) throw new Error('pixi-live2d-display runtime is missing');
    if (!hasLive2DModelRuntime()) throw new Error('Live2DModel runtime is missing');
  }

  function assertWebGL() {
    const probe = document.createElement('canvas');
    const gl =
      probe.getContext('webgl2') ||
      probe.getContext('webgl') ||
      probe.getContext('experimental-webgl');

    if (!gl) throw new Error('当前浏览器没有开启 WebGL，Live2D 无法渲染。请换 Chrome/Edge，或在浏览器设置里开启硬件加速后重启浏览器');
  }

  async function waitForCubismCore() {
    const deadline = Date.now() + 8000;
    let lastError = null;

    while (Date.now() < deadline) {
      try {
        const core = window.Live2DCubismCore;
        const version = core.Version.csmGetVersion();
        const latestMocVersion = core.Version.csmGetLatestMocVersion();
        if (version && latestMocVersion) return;
      } catch (error) {
        lastError = error;
      }

      await sleep(100);
    }

    throw new Error(`Cubism Core did not become ready: ${formatError(lastError)}`);
  }

  async function prepareCubism() {
    setStatus('Live2D: preparing runtime');
    await waitForCubismCore();

    if (window.Live2DCubismCore.Memory?.initializeAmountOfMemory) {
      window.Live2DCubismCore.Memory.initializeAmountOfMemory(CUBISM_MEMORY_BYTES);
    }

    if (typeof window.PIXI.live2d.cubism4Ready === 'function') {
      await window.PIXI.live2d.cubism4Ready();
    }
  }

  function waitForFrames(count) {
    return new Promise((resolve) => {
      let remaining = count;
      const tick = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function loadModel() {
    setStatus('Live2D: loading model');
    const Live2DModel = window.PIXI.live2d.Live2DModel;
    let lastError = null;

    for (const [sourceName, fullPath, litePath] of MODEL_SOURCES) {
      try {
        setStatus(`Live2D: loading model from ${sourceName}`);
        return await Live2DModel.from(fullPath, { ...MODEL_OPTIONS });
      } catch (error) {
        lastError = error;
        console.warn(`Live2D full model load failed from ${sourceName}, retrying without physics:`, error);
        setStatus(`Live2D: retrying ${sourceName} without physics (${formatError(error)})`);

        try {
          return await Live2DModel.from(litePath, { ...MODEL_OPTIONS });
        } catch (fallbackError) {
          lastError = fallbackError;
          console.warn(`Live2D lite model load failed from ${sourceName}:`, fallbackError);
        }
      }
    }

    throw lastError || new Error('Texture loading error');
  }

  async function main() {
    assertBrowserMode();
    await ensureRuntime();
    assertWebGL();
    await prepareCubism();

    app = new window.PIXI.Application({
      view: canvas,
      autoStart: true,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: getRenderResolution(),
      resizeTo: root
    });

    const model = await loadModel();
    window.__live2dApp = app;
    window.__live2dModel = model;
    installDrag();
    configureMaskRenderer(model);
    installModelDefaults(model);
    app.stage.addChild(model);
    fitModel(model);

    const refit = () => requestAnimationFrame(() => syncRenderer(model));
    window.addEventListener('resize', refit);
    new ResizeObserver(refit).observe(root);
    setStatus('Live2D: finalizing');
    await waitForFrames(12);
    root.dataset.state = 'ready';
    setStatus('');
  }

  const timeout = setTimeout(() => {
    if (settled) return;
    setStatus('Live2D: loading timeout');
    root.dataset.state = 'timeout';
  }, 20000);

  main()
    .then(() => {
      settled = true;
      clearTimeout(timeout);
    })
    .catch((error) => {
      settled = true;
      clearTimeout(timeout);
      console.error('Live2D model load failed:', error);
      setStatus(`Live2D failed: ${formatError(error)}`);
      root.dataset.state = 'model-error';
      root.dataset.error = formatError(error);
    });
})();
