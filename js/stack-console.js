import { skills } from './skills-data.js?v=20261103-tools1';
const groups=[{key:'web',name:'Frontend Core',items:skills.frontendCore},{key:'ui',name:'UI Frameworks',items:skills.frontendFrameworks},{key:'backend',name:'Backend & CMS',items:[...skills.backendCore,...skills.backendFrameworks]},{key:'data',name:'Databases',items:skills.databases},{key:'tools',name:'Tools & Services',items:skills.toolsServices}];
const tools=groups.flatMap(g=>g.items.map(t=>({...t,group:g.key,category:g.name})));
const stage=document.querySelector('.stack-console'),board=stage.querySelector('.stack-board'),modules=[...board.querySelectorAll('[data-stack-tool]')],filters=[...stage.querySelectorAll('[data-stack-filter]')];
const range=document.querySelector('#orbit-position'),name=stage.querySelector('.orbit-name'),category=stage.querySelector('.orbit-category'),number=stage.querySelector('.orbit-number'),summary=stage.querySelector('.stack-selection-summary');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),small=matchMedia('(max-width:767px)');
const copy={nl:{overview:'Alle tools ↗',orbit:'Terug naar de ring ↶',intro:'Dit is waar ik mee bouw.',all:'Alles',drag:'Sleep om te ontdekken',notes:'En wat ik onderweg leerde ↓',previous:'Vorige tool',next:'Volgende tool',choose:'Kies een tool'},en:{overview:'All tools ↗',orbit:'Back to the ring ↶',intro:'This is what I build with.',all:'All',drag:'Drag to explore',notes:'And what I learned along the way ↓',previous:'Previous tool',next:'Next tool',choose:'Choose a tool'}};
let visible=modules.map((_,i)=>i),active=0,position=0,target=0,overview=false,frame=0,drag=null,suppressClick=false,entered=false;
const wrap=(n,total)=>((n%total)+total)%total;
const locale=()=>copy[document.documentElement.lang==='en'?'en':'nl'];
function render(){
 const w=board.clientWidth,h=board.clientHeight,rx=w*(small.matches?.405:.40),ry=h*(small.matches?.34:.32),n=visible.length;
 modules.forEach((m,i)=>{
  const slot=visible.indexOf(i),shown=slot!==-1;m.hidden=!shown;if(!shown)return;
  m.classList.toggle('is-selected',i===active);m.setAttribute('aria-pressed',String(i===active));
  if(overview){m.style.transform='none';m.style.opacity='1';m.style.zIndex='1';return;}
  const angle=(slot-position)*Math.PI*2/n,c=Math.cos(angle),depth=(c+1)/2,scale=.58+depth*.5;
  m.style.transform=`translate(-50%,-50%) translate(${Math.sin(angle)*rx}px,${c*ry}px) scale(${scale}) rotate(${Math.sin(angle)*-12}deg)`;
  m.style.zIndex=String(Math.round(depth*100)+2);m.style.opacity=String(.48+depth*.52);
 });
}
function tick(){frame=0;if(reduced.matches)position=target;else position+=(target-position)*.11;if(Math.abs(target-position)<.002)position=target;render();if(position!==target)frame=requestAnimationFrame(tick);}
function requestRender(){if(!frame)frame=requestAnimationFrame(tick);}
function announce(animate=true){
 const t=tools[active];name.textContent=t.name;category.textContent=t.category.toUpperCase();number.textContent=String(active+1).padStart(2,'0')+' — '+tools.length;range.max=visible.length-1;range.value=visible.indexOf(active);range.setAttribute('aria-valuetext',t.name);summary.textContent=t.name+' / '+t.category;
 modules.forEach((m,i)=>{m.classList.toggle('is-selected',active===i);m.setAttribute('aria-pressed',String(active===i));});
 if(animate&&!reduced.matches){for(const el of [name,category,number]){el.getAnimations().forEach(a=>a.cancel());el.animate([{opacity:0,transform:'translateY(15px)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0px)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});}}
}
function choose(index,{focus=false,animate=true}={}){
 active=visible[wrap(index,visible.length)];const slot=visible.indexOf(active),n=visible.length;
 target=position+wrap(slot-position+n/2,n)-n/2;
 announce(animate);requestRender();if(focus)modules[active].focus({preventScroll:true});
}
function filter(key){visible=modules.map((m,i)=>({m,i})).filter(({m})=>key==='all'||m.dataset.group===key).map(({i})=>i);filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stackFilter===key)));if(!visible.includes(active))active=visible[0];target=position=visible.indexOf(active);announce();render();if(!reduced.matches)board.animate([{opacity:.3},{opacity:1}],{duration:500});}
filters.forEach(b=>b.addEventListener('click',()=>filter(b.dataset.stackFilter)));
modules.forEach((m,i)=>{
 m.addEventListener('click',()=>{if(suppressClick)return;choose(visible.indexOf(i));});
 m.addEventListener('keydown',e=>{let next=null;const index=visible.indexOf(i);if(e.key==='ArrowRight'||e.key==='ArrowDown')next=index+1;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=index-1;if(e.key==='Home')next=0;if(e.key==='End')next=visible.length-1;if(next!==null){e.preventDefault();choose(next,{focus:true});}});
});
function step(direction){choose(visible.indexOf(active)+direction);}
stage.querySelector('.orbit-prev').addEventListener('click',()=>step(-1));stage.querySelector('.orbit-next').addEventListener('click',()=>step(1));
range.addEventListener('input',()=>choose(Number(range.value)));
const toggle=stage.querySelector('.stack-reset');toggle.addEventListener('click',()=>{
 const before=modules.map(m=>m.getBoundingClientRect());modules.forEach(m=>m.getAnimations().forEach(a=>a.cancel()));
 overview=!overview;stage.classList.toggle('is-overview',overview);toggle.setAttribute('aria-pressed',String(overview));translate();render();
 if(!reduced.matches)modules.forEach((m,i)=>{if(m.hidden)return;const after=m.getBoundingClientRect(),old=before[i],base=getComputedStyle(m).transform==='none'?'matrix(1,0,0,1,0,0)':getComputedStyle(m).transform;if(!old.width||!after.width)return;m.animate([{transform:'translate('+(old.x+old.width/2-after.x-after.width/2)+'px,'+(old.y+old.height/2-after.y-after.height/2)+'px) '+base+' scale('+(old.width/after.width)+','+(old.height/after.height)+')'},{transform:base}],{duration:750,delay:i*9,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});});
});
board.addEventListener('pointerdown',e=>{if(overview||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:position,last:e.clientX,time:performance.now(),velocity:0,moved:false};});
board.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(!drag.moved){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){drag=null;return;}if(Math.abs(dx)<8)return;drag.moved=true;board.setPointerCapture(e.pointerId);board.classList.add('is-dragging');suppressClick=true;}
 const now=performance.now();drag.velocity=(e.clientX-drag.last)/Math.max(1,now-drag.time);drag.last=e.clientX;drag.time=now;
 target=drag.start-dx/(small.matches?65:110);position=target;active=visible[wrap(Math.round(position),visible.length)];announce(false);render();
});
function release(e){if(e.type==='lostpointercapture'&&e.target!==board)return;if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;board.classList.remove('is-dragging');if(d.moved){const momentum=e.type==='pointercancel'?0:Math.max(-2,Math.min(2,-d.velocity*.6));choose(Math.round(position+momentum));setTimeout(()=>suppressClick=false,100);}}
for(const type of ['pointerup','pointercancel','lostpointercapture'])board.addEventListener(type,release);
// Horizontal trackpad gestures turn the ring; ordinary page scrolling stays native.
board.addEventListener('wheel',e=>{if(overview||Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();target+=e.deltaX/220;active=visible[wrap(Math.round(target),visible.length)];announce(false);requestRender();},{passive:false});
function translate(){const t=locale();stage.querySelectorAll('[data-stack-ui]').forEach(el=>{el.textContent=t[el.dataset.stackUi==='overview'&&overview?'orbit':el.dataset.stackUi];});stage.querySelector('.orbit-prev').setAttribute('aria-label',t.previous);stage.querySelector('.orbit-next').setAttribute('aria-label',t.next);range.setAttribute('aria-label',t.choose);}
document.addEventListener('languageChanged',translate);
new ResizeObserver(()=>requestRender()).observe(board);
reduced.addEventListener('change',()=>{if(reduced.matches){stage.getAnimations({subtree:true}).forEach(a=>a.cancel());position=target;render();}});
const observer=new IntersectionObserver(entries=>{if(entered||!entries.some(e=>e.isIntersecting))return;entered=true;if(!reduced.matches){position=-2;requestRender();}observer.disconnect();},{threshold:.15});observer.observe(stage);
translate();announce(false);render();
