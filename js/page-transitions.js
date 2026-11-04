// Only the three main pages share this transition; CD readers keep their own handoff.
(()=>{
 if(window!==window.top)return;
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const routes=['index.html','projecten.html','programeertalen.html'];
 function route(url){try{const u=new URL(url,location.href);if(u.origin!==location.origin)return -1;return routes.indexOf(u.pathname.split('/').pop()||'index.html');}catch{return -1;}}
 function apply(from,to,transition){
  delete root.dataset.pageMotion;
  const a=route(from),b=route(to);if(!transition||reduced.matches||a<0||b<0||a===b)return;
  root.dataset.pageMotion=b>a?'forward':'backward';
  transition.finished.then(()=>{delete root.dataset.pageMotion;},()=>{delete root.dataset.pageMotion;});
 }
 window.addEventListener('pageswap',e=>apply(location.href,e.activation?.entry?.url,e.viewTransition));
 window.addEventListener('pagereveal',e=>apply(window.navigation?.activation?.from?.url,location.href,e.viewTransition));
 reduced.addEventListener('change',()=>{if(reduced.matches){delete root.dataset.pageMotion;document.getAnimations().filter(a=>a.effect?.pseudoElement?.startsWith('::view-transition')).forEach(a=>a.finish());}});
 // A small fade is the fallback in browsers without cross-document snapshots.
 if('CSSViewTransitionRule' in window)return;
 let leaving=false,exitAnimation=null;
 window.addEventListener('pageshow',()=>{
  leaving=false;exitAnimation?.cancel();exitAnimation=null;let previous;try{previous=sessionStorage.getItem('jb-primary-page');sessionStorage.setItem('jb-primary-page',location.href);}catch{}
  if(!reduced.matches&&route(previous)>=0&&route(previous)!==route(location.href))document.body.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});
 });
 document.addEventListener('click',async e=>{
  const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download')||route(a.href)<0||route(a.href)===route(location.href)||reduced.matches)return;
  e.preventDefault();if(leaving)return;leaving=true;
  exitAnimation=document.body.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'});
  await exitAnimation.finished.catch(()=>{});
  location.assign(a.href);
 });
})();
