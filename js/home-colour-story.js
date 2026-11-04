// Scroll-linked colour fields: no timers, text additions or permanent animation loop.
const colourHome=document.querySelector('.home-profile');
if(colourHome){
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),root=document.documentElement;
 const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>n*n*(3-2*n);
 const scenes=[['.profile-opening','var(--paper)'],['.profile-offline','var(--blue)'],['.profile-occupation','var(--light-blue)'],['.home-footer','var(--navy)']].map(([selector,colour],index)=>{
  const element=document.querySelector(selector),field=document.createElement('div'),type=['shutter','iris','panels','fold'][index];field.className='home-colour-field';field.dataset.colourTransition=type;field.setAttribute('aria-hidden','true');field.style.setProperty('--arrival-colour',colour);
  const count=index===0?6:index===2?2:1;field.style.setProperty('--bands',count);const bands=Array.from({length:count},(_,i)=>{const band=document.createElement('span');band.style.setProperty('--band',i);field.append(band);return band;});element.prepend(field);return{element,field,bands,index,type,footer:index===3};
 });
 let frame=0;
 function paint(){frame=0;for(const scene of scenes){
  const r=scene.element.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight*1.1)continue;
  const start=innerHeight*(scene.footer?.98:.94),finish=scene.footer?innerHeight-r.height+16:innerHeight*.25,p=reduced.matches?1:clamp((start-r.top)/(start-finish));
  if(scene.type==='shutter'){
   scene.bands.forEach((band,i)=>{const delay=i/(scene.bands.length-1)*.06,position=ease(clamp((p-delay)/.94));band.style.transform='translateY('+(-101*(1-position))+'%)';});
  }else if(scene.type==='iris'){
   const fr=scene.field.getBoundingClientRect(),x=fr.width*.78,y=fr.height*.4,radius=Math.hypot(Math.max(x,fr.width-x),Math.max(y,fr.height-y))+2;
   scene.bands[0].style.transform='none';scene.field.style.clipPath=p===1?'none':'circle('+(radius*ease(p))+'px at '+x+'px '+y+'px)';
  }else if(scene.type==='panels'){
   scene.bands.forEach((band,i)=>{const position=ease(clamp((p-i*.045)/.955));band.style.transform='translateX('+(-101*(1-position))+'%)';});
  }else{
   scene.bands[0].style.transform='scaleY('+ease(p)+')';
  }
  const passage=clamp((innerHeight-r.top)/(innerHeight+r.height));scene.element.style.setProperty('--colour-drift',(reduced.matches?0:(passage-.5)*-10)+'px');scene.element.style.setProperty('--colour-photo-scale',String(reduced.matches?1:1.012-Math.abs(passage-.5)*.02));
 }}
 function request(){if(!frame)frame=requestAnimationFrame(paint);}
 root.classList.add('home-colour-motion');paint();
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request);addEventListener('pageshow',request);reduced.addEventListener('change',request);
}
