import {createDigitalPresenter} from './digital-presenter.js';
// All narration and movies are local assets. No cloud voice service is used.
export function createLessonPlayer(parts,onSelect){
  const dialog=document.querySelector('#lesson-dialog');
  const video=document.querySelector('#lesson-video');
  const audio=document.querySelector('#lesson-audio');
  const presenter=createDigitalPresenter({dialog,video,audio});
  const state=document.querySelector('#lesson-state');
  const toggle=document.querySelector('#lesson-play');
  const tabs=[...dialog.querySelectorAll('[data-media-kind]')];
  let catalogue=null,current=null,kind='video',token=0;
  const ready=fetch('./assets/lessons/manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('讲解资源暂未就绪');return r.json()}).then(x=>catalogue=x.lessons).catch(()=>null);
  const stop=()=>{video.pause();audio.pause()};
  const active=()=>kind==='video'?video:audio;
  const time=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  function update(){
    if(!current)return;
    const m=active();toggle.textContent=m.paused?'▶ 播放讲解':'Ⅱ 暂停讲解';
    state.textContent=m.ended?'讲解已结束，可重播或观看下一组件':m.paused?'已暂停':`${kind==='video'?'视频':'语音'}讲解中 · ${time(m.currentTime)} / ${time(current.duration)}`;
    const n=Math.max(0,current.chapters.findLastIndex(c=>m.currentTime>=c.start));
    dialog.querySelectorAll('[data-chapter]').forEach(b=>b.classList.toggle('active',Number(b.dataset.chapter)===n));
    document.querySelector('#lesson-live-transcript').textContent=current.chapters[n].narration;
  }
  async function play(){try{await active().play();update()}catch{state.textContent='请点击播放器的播放按钮开始讲解。'}}
  async function open(id,autoplay=false){
    const request=++token;stop();presenter.stop();current=null;
    if(!dialog.open)dialog.showModal();
    document.querySelector('#lesson-title').textContent=parts.find(p=>p.id===id)?.title+' · 视频讲解';state.textContent='正在加载讲解…';
    toggle.disabled=true;await ready;if(request!==token||!dialog.open)return;
    current=catalogue?.[id];
    if(!current){state.textContent='讲解资源未能加载，请刷新游戏后重试。';return}
    presenter.select(current);
    kind='video';tabs.forEach(b=>b.classList.toggle('active',b.dataset.mediaKind===kind));video.hidden=false;audio.hidden=true;
    video.poster=current.poster;video.src=current.video;audio.src=current.audio;
    const track=document.querySelector('#lesson-captions');track.src=current.captions;
    document.querySelector('#lesson-cc').checked=false;for(const t of video.textTracks)t.mode='hidden';
    video.load();audio.load();
    document.querySelector('#lesson-summary').textContent=`1080p · 中文神经网络配音 · ${Math.ceil(current.duration)} 秒`;
    document.querySelector('#lesson-source').href=current.source;
    document.querySelector('#lesson-download').href=current.video;document.querySelector('#lesson-download').download=id+'_中文讲解.mp4';
    document.querySelector('#lesson-chapters').replaceChildren();current.chapters.forEach((c,i)=>{const b=document.createElement('button');b.dataset.chapter=i;b.textContent=`${time(c.start)}  ${c.heading}`;b.onclick=()=>{active().currentTime=c.start;update();play()};document.querySelector('#lesson-chapters').append(b)});
    document.querySelector('#lesson-transcript').replaceChildren();current.chapters.forEach(c=>{const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=c.heading+'：';p.append(strong,document.createTextNode(c.narration));document.querySelector('#lesson-transcript').append(p)});
    const index=parts.findIndex(p=>p.id===id);document.querySelector('#lesson-prev').disabled=index===0;document.querySelector('#lesson-next').disabled=index===parts.length-1;
    toggle.disabled=false;dialog.scrollTop=0;update();if(autoplay)play();
  }
  toggle.onclick=()=>{const m=active();if(m.paused){if(m.ended)m.currentTime=0;play()}else{m.pause();update()}};
  for(const b of tabs)b.onclick=()=>{if(!current||b.dataset.mediaKind===kind)return;const old=active(),position=old.currentTime,wasPlaying=!old.paused;stop();presenter.stop();kind=b.dataset.mediaKind;video.hidden=kind!=='video';audio.hidden=kind!=='audio';tabs.forEach(t=>t.classList.toggle('active',t===b));active().currentTime=position;update();if(wasPlaying)play()};
  for(const m of [video,audio])for(const event of ['play','pause','ended','timeupdate'])m.addEventListener(event,update);
  for(const m of [video,audio])m.addEventListener('error',()=>{if(current)state.textContent='媒体加载失败，请刷新后重试或下载视频观看。'});
  dialog.addEventListener('close',()=>{++token;stop()});
  document.querySelector('#lesson-cc').onchange=e=>{for(const t of video.textTracks)t.mode=e.target.checked?'showing':'hidden'};
  for(const [button,delta] of [['#lesson-prev',-1],['#lesson-next',1]])document.querySelector(button).onclick=()=>{if(!current)return;const index=parts.findIndex(p=>p.id===current.id)+delta;if(index<0||index>=parts.length)return;onSelect(parts[index].id);open(parts[index].id,false)};
  for(const m of [video,audio])m.addEventListener('ended',()=>{if(current)window.dispatchEvent(new CustomEvent('lessoncompleted',{detail:current.id}))});
  return {open,attach(container,id){const entry=document.createElement('div');entry.className='media-entry';const b=document.createElement('button');b.className='watch-lesson';b.textContent='▶ 视频讲解';b.setAttribute('aria-label','观看 '+parts.find(p=>p.id===id).title+' 视频讲解');b.onclick=()=>open(id,false);const note=document.createElement('span');note.textContent='1080p · 3D 镜头 · 神经网络配音';entry.append(b,note);container.querySelector('.lesson').after(entry)}};
}
