import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';

/** A second viewer uses shared geometry and isolated materials, leaving gameplay intact. */
export async function createReferenceDesk({groups,parts,select,lessonPlayer}){
 const response=await fetch('./assets/references/manifest.json');if(!response.ok)throw Error('参考图库加载失败');const data=await response.json();
 const dialog=document.createElement('dialog');dialog.id='reference-desk';dialog.setAttribute('aria-labelledby','reference-title');
 dialog.innerHTML=`<header class="reference-header"><div><div class="section-tag">REFERENCE EDITION / 实物对照台</div><h2 id="reference-title">把每个细节，放回真实硬件。</h2></div><button class="close" aria-label="关闭实物对照">×</button></header><nav class="reference-parts" aria-label="对照组件"></nav><div class="reference-panes"><section class="reference-model"><div class="pane-caption"><span>01 / 可旋转三维重建</span><b id="reference-count"></b></div><div id="reference-viewport" role="img" aria-label="所选组件的三维对照模型"></div><div class="reference-camera"><button data-camera="iso">立体视角</button><button data-camera="match">对齐参考视角</button><button id="reference-context" aria-pressed="false">装机位置</button><button id="reference-spin" aria-pressed="false" hidden>风扇低速演示</button><button id="reference-xray" aria-pressed="false">内部示意</button></div><small class="reference-gesture">拖动旋转 · 滚轮缩放 · 三维轮廓依据公开资料重建</small></section><section class="reference-photo"><div class="pane-caption"><span>02 / NVIDIA 官方参考</span><button id="reference-full">查看原图 ↗</button></div><div class="reference-photo-tabs"></div><div class="reference-image-stage"><div class="reference-image-wrap"><img id="reference-image" alt=""><div class="reference-regions" aria-hidden="true"></div></div></div><div class="reference-credit"><span id="reference-image-note"></span><a id="reference-source" target="_blank" rel="noreferrer">官方原始出处 ↗</a></div></section></div><div class="reference-notes"><section><div class="section-tag">LOOK CLOSER / 对照观察</div><h3 id="reference-part-title"></h3><ul id="reference-matched"></ul></section><section class="reference-limit"><b>还原到哪里？</b><p id="reference-limit"></p><span>尺寸比例参考官方资料；内部细节未经过实物测量。</span></section><button id="reference-video">观看本组件讲解 →</button></div>`;
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s),vp=$('#reference-viewport');let current='gpus',photoIndex=0,context=false,xray=false,raf=0,openedBy=null,spin=false,previous=0;
 const world=new THREE.Scene();world.background=new THREE.Color(0x101a22);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;vp.append(renderer.domElement);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);world.environment=environment.texture;room.dispose();pmrem.dispose();
 world.add(new THREE.HemisphereLight(0xffffff,0x788076,1.8));for(const p of [[5,8,7],[-5,3,-5]]){const l=new THREE.DirectionalLight(0xffffff,2.3);l.position.set(...p);world.add(l)}
 const camera=new THREE.PerspectiveCamera(35,1,.05,150),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.4;controls.maxDistance=40;
 const model=new THREE.Group();world.add(model);const clones=new Map();
 for(const [id,g]of groups){const c=g.clone(true);c.position.set(0,0,0);c.visible=true;c.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=false;o.material.opacity=1;o.visible=true}});model.add(c);clones.set(id,c)}
 const grid=new THREE.GridHelper(16,32,0x354849,0x22323b);grid.material.opacity=.25;grid.material.transparent=true;grid.position.y=-.045;world.add(grid);
 function entry(){return data.components[current]}
 function resize(){const w=vp.clientWidth,h=vp.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
 const observer=new ResizeObserver(()=>{resize()});observer.observe(vp);
 function fit(view='iso'){
  resize();const b=new THREE.Box3();for(const [id,g]of clones)if(g.visible)b.expandByObject(g);const c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());
  const dir=view==='top'?new THREE.Vector3(0,1,0):view==='front'?new THREE.Vector3(0,0,1):view==='rear'?new THREE.Vector3(0,0,-1):new THREE.Vector3(1,.8,1.2).normalize();
  camera.up.set(...(view==='top'?[1,0,0]:[0,1,0]));camera.position.copy(c).add(dir);camera.lookAt(c);camera.updateMatrixWorld(true);
  // Fit all projected corners, so long boards and tall fans never get clipped.
  const q=camera.quaternion.clone().invert();let mx=0,my=0,mz=0;
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new THREE.Vector3(x,y,z).sub(c).applyQuaternion(q);mx=Math.max(mx,Math.abs(p.x));my=Math.max(my,Math.abs(p.y));mz=Math.max(mz,Math.abs(p.z))}
  const d=(Math.max(my,mx/camera.aspect)/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))+mz)*1.16;
  camera.position.copy(c).addScaledVector(dir,Math.max(d,1.3));controls.target.copy(c);controls.update();
 }
 function visibility(){
  const related=['gpus','nvlink','cx8'].includes(current)?['gpus','nvlink','cx8']:['cpu','memory','dpu','cache','boot'].includes(current)?['cpu','memory','dpu','cache','boot']:parts.map(p=>p.id);
  for(const [id,g]of clones){g.visible=id===current||(context&&related.includes(id));g.traverse(o=>{if(!o.isMesh)return;const role=o.userData.surface_role;o.visible=!(role==='bezel'&&(current!=='chassis'||photoIndex!==0))&&!(role==='tray_screen'&&entry().photos[photoIndex].view==='top')&&!(role==='heatsink'&&xray);o.material.transparent=context&&current!=='chassis'&&id!==current;o.material.opacity=o.material.transparent?.15:1;o.material.depthWrite=!o.material.transparent})}
  $('#reference-context').setAttribute('aria-pressed',context);$('#reference-xray').setAttribute('aria-pressed',xray);$('#reference-xray').textContent=xray?'收起内部示意':'内部示意';
 }
 function photo(index){photoIndex=index;const p=entry().photos[index];const img=$('#reference-image');img.src='./assets/references/'+p.file;img.alt=entry().title+' — '+p.label;$('#reference-image-note').textContent=p.note+' · © NVIDIA';$('#reference-source').href=p.source;$('.reference-regions').replaceChildren();for(const [x,y,w,h]of p.regions){const r=document.createElement('i');Object.assign(r.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});$('.reference-regions').append(r)}$('.reference-photo-tabs').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===index));visibility();fit(p.view)}
 function show(id){current=id;spin=false;$('#reference-spin').hidden=id!=='cooling';$('#reference-spin').setAttribute('aria-pressed','false');$('#reference-spin').textContent='风扇低速演示';photoIndex=0;context=id==='chassis';xray=false;const e=entry();$('#reference-part-title').textContent=e.title;$('#reference-count').textContent=e.count;$('#reference-limit').textContent=e.limit;$('#reference-matched').replaceChildren(...e.matched.map(t=>{const li=document.createElement('li');li.textContent=t;return li}));$('.reference-photo-tabs').replaceChildren(...e.photos.map((p,i)=>{const b=document.createElement('button');b.textContent=p.label;b.onclick=()=>photo(i);return b}));$('.reference-parts').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.part===id);b.setAttribute('aria-pressed',b.dataset.part===id)});photo(0)}
 parts.forEach((p,i)=>{const b=document.createElement('button');b.dataset.part=p.id;b.setAttribute('aria-label','对照 '+p.short);b.innerHTML=`<small>${String(i+1).padStart(2,'0')}</small>${p.short}`;b.onclick=()=>{select(p.id);show(p.id)};$('.reference-parts').append(b)});
 function frame(now=performance.now()){if(!dialog.open)return;const dt=previous?Math.min((now-previous)/1000,.1):0;previous=now;if(spin)clones.get('cooling').traverse(o=>{if(o.userData.animated_fan)o.rotation.z+=dt*1.6});controls.update();renderer.render(world,camera);raf=requestAnimationFrame(frame)}
 function open(id){openedBy=document.activeElement;if(!dialog.open)dialog.showModal();show(id);cancelAnimationFrame(raf);frame()}
 dialog.addEventListener('close',()=>{cancelAnimationFrame(raf);openedBy?.focus()});$('.close').onclick=()=>dialog.close();
 $('[data-camera="iso"]').onclick=()=>fit('iso');$('[data-camera="match"]').onclick=()=>fit(entry().photos[photoIndex].view);
 $('#reference-spin').onclick=()=>{spin=!spin;$('#reference-spin').setAttribute('aria-pressed',spin);$('#reference-spin').textContent=spin?'暂停演示（非真实转速）':'风扇低速演示'};
 $('#reference-context').onclick=()=>{context=!context;visibility();fit(entry().photos[photoIndex].view)};$('#reference-xray').onclick=()=>{xray=!xray;visibility()};
 $('#reference-video').onclick=()=>{dialog.close();lessonPlayer.open(current)};
 $('#reference-full').onclick=()=>window.open('./assets/references/'+entry().photos[photoIndex].file,'_blank','noopener');
 function attach(container,id){const b=document.createElement('button');b.className='reference-entry';b.setAttribute('aria-label','实物对照 '+data.components[id].title);b.innerHTML='<span>◫ 实物对照</span><small>官方图片 × 可旋转模型 ↗</small>';b.onclick=()=>open(id);const media=container.querySelector('.media-entry');if(media)media.before(b);else container.append(b)}
 return {open,attach};
}
