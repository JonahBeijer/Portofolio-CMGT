// Keep the internal colour changes, with clean edges at the photo wall and footer.
const colourHome=document.querySelector('.home-profile');
if(colourHome&&!matchMedia('(pointer:coarse), (max-width:767px)').matches){
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),root=document.documentElement;
 const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>n*n*(3-2*n);
 const scenes=[['.profile-offline','var(--blue)','iris',1],['.profile-occupation','var(--light-blue)','panels',2]].map(([selector,colour,type,count])=>{
  const element=document.querySelector(selector),field=document.createElement('div');
  field.className='home-colour-field';field.dataset.colourTransition=type;field.setAttribute('aria-hidden','true');field.style.setProperty('--arrival-colour',colour);field.style.setProperty('--bands',count);
  const bands=Array.from({length:count},(_,i)=>{const band=document.createElement('span');band.style.setProperty('--band',i);field.append(band);return band;});
  element.prepend(field);return{element,field,bands,type};
 });
 let frame=0;
 function paint(){frame=0;for(const scene of scenes){
  const r=scene.element.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight*1.1)continue;
  const start=innerHeight*.94,finish=innerHeight*.25,p=reduced.matches?1:clamp((start-r.top)/(start-finish));
  if(scene.type==='iris'){
   const fr=scene.field.getBoundingClientRect(),x=fr.width*.78,y=fr.height*.4,radius=Math.hypot(Math.max(x,fr.width-x),Math.max(y,fr.height-y))+2;
   scene.bands[0].style.transform='none';scene.field.style.clipPath=p===1?'none':'circle('+(radius*ease(p))+'px at '+x+'px '+y+'px)';
  }else scene.bands.forEach((band,i)=>band.style.transform='translateX('+(-101*(1-ease(clamp((p-i*.045)/.955))))+'%)');
  const passage=clamp((innerHeight-r.top)/(innerHeight+r.height));scene.element.style.setProperty('--colour-drift',(reduced.matches?0:(passage-.5)*-10)+'px');scene.element.style.setProperty('--colour-photo-scale',String(reduced.matches?1:1.012-Math.abs(passage-.5)*.02));
 }}
 function request(){if(!frame)frame=requestAnimationFrame(paint);}
 root.classList.add('home-colour-motion');paint();
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request);addEventListener('pageshow',request);reduced.addEventListener('change',request);
}
