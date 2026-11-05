const isProjects=path=>/\/(?:projecten\.html|projects\/?)$/.test(path);
// Transition requests are single-use. Merely visiting a detail page does not arm a return.
const key='jb-cd-navigation',reduced=matchMedia('(prefers-reduced-motion:reduce)');
function read(){try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}}
function write(state){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
function clear(){try{sessionStorage.removeItem(key);}catch{}}
function matches(state){return state&&location.pathname.endsWith('/'+state.page);}
function colorLayer(color){const layer=document.createElement('div');layer.className='cd-navigation-color';layer.style.background=color;layer.setAttribute('aria-hidden','true');document.body.append(layer);return layer;}
const preview=!!window.frameElement?.hasAttribute('data-cd-preview');
let leaving=false;
async function arrive(){
 if(preview){document.documentElement.classList.remove('cd-arriving');return;}
 const state=read();
 if(isProjects(location.pathname))return;
 if(!matches(state)){clear();document.documentElement.classList.remove('cd-arriving');return;}
 const incoming=state.direction==='enter'&&Date.now()-(state.createdAt||0)<20000;
 write({...state,direction:'detail'});
 if(!incoming||state.handoff||reduced.matches||!Element.prototype.animate){document.documentElement.classList.remove('cd-arriving');return;}
 const layer=colorLayer(state.color);document.documentElement.classList.remove('cd-arriving');
 try{await layer.animate([{opacity:1},{opacity:0}],{duration:550,easing:'ease-out',fill:'forwards'}).finished;}finally{layer.remove();}
}
arrive();
document.addEventListener('click',async event=>{
 if(preview)return;
 const link=event.target.closest('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
 const target=new URL(link.href,location.href),state=read();
 if(target.origin!==location.origin||target.pathname===location.pathname)return;
 if(isProjects(location.pathname)&&state?.direction==='enter'&&target.pathname.endsWith('/'+state.page))return;
 if(!matches(state)||!isProjects(target.pathname)){clear();return;}
 event.preventDefault();if(leaving)return;leaving=true;
 write({...state,direction:'return',from:location.pathname,createdAt:Date.now(),readerScroll:scrollY});
 if(!state.handoff&&!reduced.matches&&Element.prototype.animate){const layer=colorLayer(state.color);await layer.animate([{opacity:0},{opacity:1}],{duration:280,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});}
 location.assign(link.href);
});
window.addEventListener('pageshow',event=>{if(event.persisted){leaving=false;document.querySelectorAll('.cd-navigation-color').forEach(layer=>layer.remove());arrive();}});

window.addEventListener('pagehide',()=>{if(preview)return;const state=read();if(matches(state)&&state.direction==='detail')write({...state,readerScroll:scrollY});});
