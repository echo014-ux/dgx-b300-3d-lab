// Optional local presenter media. Missing assets never block the original lessons.
export function localPresenterAsset(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value, document.baseURI);
    const root = new URL('./assets/digital-human/', document.baseURI);
    return url.origin === root.origin && url.pathname.startsWith(root.pathname) ? url.href : null;
  } catch { return null; }
}
export function pauseOtherLessonMedia(current) {
  document.querySelectorAll('#lesson-dialog video, #lesson-dialog audio, #compute-lab video, #compute-lab audio')
    .forEach(media => { if (media !== current) media.pause(); });
}
export function createDigitalPresenter({dialog, video, audio}) {
  const layout = document.createElement('div');
  layout.className = 'presenter-layout';
  video.before(layout);
  layout.append(video);
  const panel = document.createElement('aside');
  panel.className = 'digital-presenter';
  panel.setAttribute('aria-label', 'echo数字人讲解');
  panel.innerHTML = `
    <div class="presenter-label">你的数字人讲师</div>
    <h3>echo</h3>
    <div class="presenter-stage">
      <div class="presenter-placeholder"><span>e</span><small>头像待接入</small></div>
      <img class="presenter-portrait" alt="echo数字人肖像" hidden>
      <video class="presenter-video" controls playsinline preload="metadata" aria-label="echo数字人视频" hidden></video>
    </div>
    <p class="presenter-status" role="status">正在读取数字人素材状态…</p>
    <button class="presenter-intro" disabled>播放自我介绍示例</button>
    <button class="presenter-lesson" disabled>本节数字人讲解 · 待制作</button>
    <p class="presenter-note">自我介绍示例仅约 4 秒，带 HeyGen 水印，不是 DGX B300 教学视频。组件课程继续使用原有中文合成旁白。</p>
    <details class="presenter-script" hidden><summary>阅读本节数字人讲稿</summary><p></p></details>`;
  layout.append(panel);
  const portrait = panel.querySelector('img');
  const placeholder = panel.querySelector('.presenter-placeholder');
  const presenterVideo = panel.querySelector('video');
  const status = panel.querySelector('.presenter-status');
  const introButton = panel.querySelector('.presenter-intro');
  const lessonButton = panel.querySelector('.presenter-lesson');
  const note = panel.querySelector('.presenter-note');
  const script = panel.querySelector('.presenter-script');
  let config = null, selected = null, generation = 0, playback = null;
  // Only local same-origin assets under this game's digital-human folder are allowed.
  const assetPath = localPresenterAsset;
  const loadConfig = () => fetch('./assets/digital-human/manifest.json', {cache: 'no-cache'})
    .then(r => { if (!r.ok) throw Error('missing manifest'); return r.json(); })
    .catch(() => null);
  portrait.addEventListener('load', () => {
    placeholder.hidden = true;
    if (presenterVideo.hidden) portrait.hidden = false;
  });
  portrait.addEventListener('error', () => {
    portrait.hidden = true;
    placeholder.hidden = false;
    placeholder.querySelector('small').textContent = '头像暂不可用';
  });
  function stop() {
    ++generation;
    playback = null;
    presenterVideo.pause();
    presenterVideo.removeAttribute('src');
    presenterVideo.load();
    presenterVideo.hidden = true;
    portrait.hidden = !(portrait.complete && portrait.naturalWidth);
    placeholder.hidden = !portrait.hidden;
    introButton.textContent = '播放自我介绍示例';
    if (!lessonButton.disabled) lessonButton.textContent = '播放本节数字人讲解';
  }
  function renderStatus() {
    const entry = config?.lessons?.[selected?.id];
    const introReady = Boolean(config?.intro?.available && assetPath(config.intro.src));
    const lessonReady = Boolean(entry?.status === 'ready' && assetPath(entry.video));
    introButton.disabled = !introReady;
    lessonButton.disabled = !lessonReady;
    lessonButton.textContent = lessonReady ? '播放本节数字人讲解' : '本节数字人讲解 · 待制作';
    introButton.textContent = '播放自我介绍示例';
    const watermark = entry?.watermark || (entry?.heygen_video_id ? 'HeyGen' : null);
    const production = watermark ? `含 ${watermark} 水印` : '本地数字人 · 中文合成旁白';
    note.textContent = lessonReady
      ? `本节数字人视频约 ${Math.round(entry.duration_seconds || 0)} 秒，${production}。下方章节、字幕和讲稿对应原 3D 课程；自我介绍示例不计课程进度。`
      : '自我介绍示例约 4 秒，含 HeyGen 水印；不是 DGX B300 教学视频。部件课程继续使用原有的合成旁白。';
    script.hidden = !(lessonReady && entry.script);
    script.querySelector('p').textContent = lessonReady ? entry.script || '' : '';
    if (!config) status.textContent = '数字人配置暂不可用；原组件课程可正常播放。';
    else status.textContent = `${selected?.title || '本组件'}：${lessonReady ? '数字人视频已接入' : '专项数字人视频待制作'}。${introReady ? '可播放自我介绍示例。' : '自我介绍素材尚未接入本机。'}`;
  }
  async function select(lesson) {
    stop();
    selected = lesson;
    const request = generation;
    const data = await loadConfig();
    if (request !== generation) return;
    config = data;
    const src = data?.portrait?.available && assetPath(data.portrait.src);
    if (src) portrait.src = src;
    renderStatus();
  }
  async function playPresenter(type) {
    const entry = type === 'intro' ? config?.intro : config?.lessons?.[selected?.id];
    const allowed = type === 'intro' ? entry?.available : entry?.status === 'ready';
    const src = allowed && assetPath(type === 'intro' ? entry.src : entry.video);
    if (!src || !dialog.open) return;
    if (playback?.type === type && playback.id === selected.id && presenterVideo.src === src && !presenterVideo.error) {
      if (!presenterVideo.paused) { presenterVideo.pause(); return; }
      if (presenterVideo.ended) presenterVideo.currentTime = 0;
      const request = generation;
      try { await presenterVideo.play(); }
      catch { if (request === generation) status.textContent = '请点击数字人播放器播放；若仍失败，请检查本地素材。'; }
      return;
    }
    stop();
    const request = generation;
    video.pause(); audio.pause();
    playback = {type, id: selected.id, completed: false};
    portrait.hidden = true; placeholder.hidden = true;
    presenterVideo.hidden = false;
    presenterVideo.src = src;
    status.textContent = type === 'intro'
      ? '自我介绍示例：“我是echo，擅长 AI、云计算等业务。” · 非本节课程'
      : `${selected.title} · 数字人专项讲解`;
    try { await presenterVideo.play(); }
    catch { if (request === generation) status.textContent = '请点击数字人播放器播放；如仍失败，请检查本地素材。'; }
  }
  function updateButtons() {
    if (!playback) return;
    const label = presenterVideo.ended ? '重播' : presenterVideo.paused ? '继续播放' : '暂停';
    introButton.textContent = playback.type === 'intro' ? `${label}自我介绍示例` : '播放自我介绍示例';
    if (!lessonButton.disabled) lessonButton.textContent = playback.type === 'lesson' ? `${label}本节数字人讲解` : '播放本节数字人讲解';
  }
  introButton.addEventListener('click', () => playPresenter('intro'));
  lessonButton.addEventListener('click', () => playPresenter('lesson'));
  presenterVideo.addEventListener('play', () => {
    pauseOtherLessonMedia(presenterVideo);
    video.pause(); audio.pause();
    if (playback) status.textContent = playback.type === 'intro'
      ? '自我介绍示例：“我是echo，擅长 AI、云计算等业务。” · 非本节课程'
      : `${selected.title} · 数字人专项讲解`;
  });
  for (const event of ['play', 'pause', 'ended']) presenterVideo.addEventListener(event, updateButtons);
  presenterVideo.addEventListener('error', () => {
    if (playback) status.textContent = '数字人视频暂不可用，可继续播放原组件课程。';
  });
  presenterVideo.addEventListener('ended', () => {
    if (!playback) return;
    if (playback.type === 'lesson') {
      if (!playback.completed) window.dispatchEvent(new CustomEvent('lessoncompleted', {detail: playback.id}));
      playback.completed = true;
      status.textContent = '本节数字人讲解已结束。';
    } else status.textContent = '自我介绍示例已结束；它不计入组件课程完成进度。';
  });
  for (const media of [video, audio]) media.addEventListener('play', () => pauseOtherLessonMedia(media));
  dialog.addEventListener('close', stop);
  return {select, stop};
}
