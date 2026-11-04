const film=document.querySelector('.scroll-film'),stage=document.querySelector('.scroll-stage');
const frames=[...stage.querySelectorAll('.story-frame')],stops=[...film.querySelectorAll('.story-stop')],links=[...document.querySelectorAll('.pin-nav a')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let unit=innerHeight*1.1,origin=0,queued=false,chapter=0;
const paper=[[240,236,223],[228,231,216],[236,225,204],[30,43,34],[235,229,214],[228,217,185],[227,211,184]];
function position(){return Math.max(0,Math.min(frames.length-1,(scrollY-origin)/unit));}
function layout(preserve=false){const before=position();unit=innerHeight*1.1;const header=document.querySelector('.site-header').getBoundingClientRect().height;origin=film.getBoundingClientRect().top+scrollY;film.style.height=((frames.length-.25)*unit+innerHeight-header)+'px';stops.forEach((stop,i)=>stop.style.top=(i*unit)+'px');if(preserve&&scrollY>=origin)window.scrollTo({top:origin+before*unit,behavior:'instant'});update();}
function update(){
 queued=false;const p=position(),base=Math.min(frames.length-1,Math.floor(p)),fraction=p-base;
 let mix=Math.max(0,Math.min(1,(fraction-.62)/.38));mix=mix*mix*(3-2*mix);if(reduced.matches)mix=mix>=.5?1:0;
 if(base===frames.length-1)mix=0;
 frames.forEach((frame,i)=>{const opacity=i===base?1-mix:i===base+1?mix:0;frame.style.opacity=opacity;frame.style.visibility=opacity>0?'visible':'hidden';const current=opacity>=.5;frame.classList.toggle('is-current',current);frame.inert=!current;frame.setAttribute('aria-hidden',String(!current));});
 chapter=base+(mix>=.5?1:0);document.body.dataset.storyFrame=frames[chapter].dataset.storyId;
 links.forEach((link,i)=>i===chapter?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
 const a=paper[base],b=paper[Math.min(base+1,paper.length-1)];stage.style.setProperty('--story-paper','rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*mix)).join(',')+')');
 stage.querySelector('.story-location').textContent=String(chapter+1).padStart(2,'0')+' / '+String(frames.length).padStart(2,'0');
 stage.querySelector('[data-story-step="-1"]').disabled=chapter===0;stage.querySelector('[data-story-step="1"]').disabled=chapter===frames.length-1;
 film.style.setProperty('--story-progress',p/(frames.length-1));
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
function go(index,instant=false){index=Math.max(0,Math.min(frames.length-1,index));window.scrollTo({top:origin+index*unit,behavior:instant||reduced.matches?'instant':'smooth'});history.replaceState(null,'','#'+frames[index].dataset.storyId);schedule();}
function indexFor(id){return frames.findIndex(frame=>frame.dataset.storyId===id||frame.querySelector('#'+CSS.escape(id)));}
for(const link of document.querySelectorAll('a[href^="#"]'))link.addEventListener('click',event=>{const id=link.hash.slice(1);if(!id)return;const index=indexFor(id);if(index<0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();go(index);});
for(const button of stage.querySelectorAll('[data-story-step]'))button.addEventListener('click',()=>go(chapter+Number(button.dataset.storyStep)));
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',()=>layout(true));
window.addEventListener('keydown',event=>{if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,select,textarea,button,a,dialog')||document.querySelector('dialog[open]'))return;if(scrollY<origin-100||scrollY>origin+(frames.length-.1)*unit)return;const direction=event.key==='PageDown'||event.key==='ArrowDown'||(event.key===' '&&!event.shiftKey)?1:event.key==='PageUp'||event.key==='ArrowUp'||(event.key===' '&&event.shiftKey)?-1:0;if(direction){event.preventDefault();go(chapter+direction);}});
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(!id)return;const index=indexFor(id);if(index>=0)go(index,true);});
function restoreHash(){const id=location.hash.slice(1);if(!id)return;const index=indexFor(id);if(index>=0)go(index,true);}
layout();requestAnimationFrame(restoreHash);window.addEventListener('load',()=>{layout();restoreHash();},{once:true});
