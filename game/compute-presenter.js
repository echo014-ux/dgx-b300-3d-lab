import {localPresenterAsset, pauseOtherLessonMedia} from './digital-presenter.js';

export function createComputePresenters(dialog) {
  const cards = new Map();
  let request = 0;
  const storageKey = 'dgx-compute-digital-completed';
  function completed() {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]').filter(id => ['precision','comparison'].includes(id))); }
    catch { return new Set(); }
  }
  for (const [id, panel, title] of [
    ['precision','precision','一台 DGX B300 有多少算力'],
    ['comparison','compare','DGX B300 与昇腾 950DT 怎样比较']
  ]) {
    const card = document.createElement('article');
    card.className = 'compute-presenter';card.dataset.presenterLesson = id;
    card.innerHTML = `<div class="compute-presenter-stage"><img alt="echo数字人肖像" hidden><video controls playsinline preload="metadata" aria-label="${title} · 数字人讲解" hidden></video></div><div><div class="presenter-label">echo · 数字人讲解</div><h3>${title}</h3><p class="compute-presenter-status" role="status">正在读取素材状态…</p><button disabled>本节数字人视频 · 待制作</button><p class="compute-presenter-note">原中文旁白仍可在本页下方播放。</p><details hidden><summary>阅读这段数字人讲稿</summary><p></p></details></div>`;
    const section = dialog.querySelector('#compute-' + panel);
    section.insertBefore(card, section.children[1] || null);
    const video = card.querySelector('video'), image = card.querySelector('img');
    const button = card.querySelector('button'), status = card.querySelector('[role="status"]');
    const state = {id,title,card,video,image,button,status,entry:null,src:null,completed:false};
    cards.set(id,state);
    image.addEventListener('error',()=>{image.hidden=true;});
    button.addEventListener('click', async () => {
      if (!state.src || !dialog.open) return;
      if (!video.paused) {video.pause();return;}
      if (video.src !== state.src) {video.src=state.src;state.completed=false;}
      if (video.ended) video.currentTime=0;
      image.hidden=true;video.hidden=false;
      try {await video.play();} catch {status.textContent='请点击播放器播放；原中文旁白仍可使用。';}
    });
    function buttons() {
      if (button.disabled) return;
      button.textContent=video.ended?'重播数字人讲解':video.paused?'播放数字人讲解':'暂停数字人讲解';
    }
    video.addEventListener('play',()=>{pauseOtherLessonMedia(video);status.textContent=title+' · 数字人讲解中';buttons();});
    video.addEventListener('pause',buttons);
    video.addEventListener('ended',()=>{
      if (!state.completed) {
        const done=completed();done.add(id);
        try {localStorage.setItem(storageKey,JSON.stringify([...done]));} catch {}
        // Compute lessons have their own progress; never alter the 12-component counter.
        window.dispatchEvent(new CustomEvent('compute-lesson-completed',{detail:id}));
        state.completed=true;
      }
      status.textContent='本节数字人讲解已完成。';buttons();
    });
    video.addEventListener('error',()=>{status.textContent='数字人视频暂不可用，可继续使用本页原中文旁白。';});
  }
  dialog.addEventListener('play',event=>{
    if(event.target instanceof HTMLMediaElement)pauseOtherLessonMedia(event.target);
  },true);
  async function refresh() {
    const token=++request;
    try {
      const response=await fetch('./assets/digital-human/manifest.json',{cache:'no-cache'});
      if(!response.ok)throw Error('manifest unavailable');
      const config=await response.json();if(token!==request)return;
      const portrait=config.portrait?.available && localPresenterAsset(config.portrait.src);
      for(const state of cards.values()) {
        const entry=config.compute?.[state.id];
        const src=entry?.status==='ready' && localPresenterAsset(entry.video);
        if(state.src!==(src||null)) {
          state.video.pause();state.video.removeAttribute('src');state.video.load();state.video.hidden=true;state.completed=false;
        }
        state.entry=entry;state.src=src || null;state.button.disabled=!src;
        state.button.textContent=src?'播放数字人讲解':'本节数字人视频 · 待制作';
        if(portrait) {state.image.src=portrait;state.image.hidden=!state.video.hidden;}
        state.status.textContent=src?`${Math.round(entry.duration_seconds)} 秒 · ${completed().has(state.id)?'已完成，可重播':'可离线播放'}`:'专项数字人视频正在制作；现有页面与原旁白可正常使用。';
        const details=state.card.querySelector('details');details.hidden=!(src&&entry.script);
        details.querySelector('p').textContent=src?entry.script||'':'';
        state.card.querySelector('.compute-presenter-note').textContent=src?'本地数字人 · 中文合成旁白。此视频使用独立讲稿；原旁白仍在下方。':'原中文旁白仍可在本页下方播放。';
      }
    } catch {
      if(token!==request)return;
      for(const state of cards.values()){state.button.disabled=true;state.src=null;state.status.textContent='数字人配置暂不可用；本页原有功能仍可使用。';}
    }
  }
  refresh();return {refresh};
}
