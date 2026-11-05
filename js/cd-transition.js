/** Motion measured from the reference: smoothstep position, integrated angular velocity. */
const motion={pick:380,align:100,open:850,pause:120,accelerate:700,hold:250,enter:1000,exit:760,close:650,returnDelay:470,return:700,speed:2880};
const smooth=t=>t*t*(3-2*t);
const frames=(fn,count=80)=>Array.from({length:count+1},(_,i)=>({offset:i/count,...fn(i/count)}));
const done=animations=>Promise.all(animations.map(a=>a.finished.catch(()=>{})));
export async function playCDTransition({album,stage,project,index,returning=false,entryAngle=4608,readerScroll=0,onReady=()=>{}}){
 const effects=[],reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let spinFrame=0,profile=null,angle=0,speed=0;
 function angularState(now){
  if(!profile)return;
  const t=Math.max(0,(now-profile.start)/1000);
  if(profile.kind==='ramp'){
   const duration=motion.accelerate/1000,p=Math.min(1,t/duration);
   angle=profile.from+motion.speed*duration*(p*p*p-.5*p*p*p*p)+Math.max(0,t-duration)*motion.speed;
   speed=motion.speed*smooth(p);
  }else if(profile.kind==='constant'){angle=profile.from+t*motion.speed;speed=motion.speed;}
  else{
   const p=Math.min(1,t/(profile.duration/1000)),v=profile.slope;
   angle=profile.from+profile.delta*((v-2)*p*p*p+(3-2*v)*p*p+v*p);
   speed=profile.delta/(profile.duration/1000)*(3*(v-2)*p*p+2*(3-2*v)*p+v);
  }
  print.style.transform=`rotate(${angle}deg)`;
  layer.dataset.spinAngle=String(angle);layer.dataset.spinSpeed=String(speed);
 }
 function tick(now){spinFrame=0;angularState(now);if(profile&&!reduced.matches)spinFrame=requestAnimationFrame(tick);}
 function startSpin(kind,from,extra={}){cancelAnimationFrame(spinFrame);profile={kind,from,start:performance.now(),...extra};angularState(profile.start);if(!reduced.matches)spinFrame=requestAnimationFrame(tick);}
 function stopSpin(){angularState(performance.now());cancelAnimationFrame(spinFrame);spinFrame=0;profile=null;}
 function animate(el,keyframes,options={}){const a=el.animate(keyframes,{fill:'both',easing:'linear',...options,...(reduced.matches?{duration:0,delay:0}:{})});effects.push(a);return a;}
 const clock=ms=>animate(layer,[],{duration:ms}).finished;
 const finishForReduced=()=>{if(reduced.matches){stopSpin();speed=0;effects.forEach(a=>{try{a.finish();}catch{}});}};
 reduced.addEventListener('change',finishForReduced);
 const sceneBounds=stage.getBoundingClientRect(),initialTransform=getComputedStyle(album).transform;
 const size=Math.min(album.offsetWidth/.9856,innerWidth*.45,410);
 const centerY=sceneBounds.top+sceneBounds.height*.48;
 const rest={left:album.offsetLeft,top:album.offsetTop,width:album.offsetWidth,height:album.offsetHeight};
 const picked={...rest,top:rest.top-sceneBounds.height*.025};
 const opened={left:innerWidth/2-sceneBounds.left,top:centerY-size/2-sceneBounds.top,width:size,height:size};
 const positionFrames=(from,to)=>frames(p=>{const t=smooth(p);return Object.fromEntries(Object.keys(from).map(k=>[k,(from[k]+(to[k]-from[k])*t)+'px']));});
 const layer=document.createElement('div');layer.className='cd-opening-layer cd-transition-layer';layer.setAttribute('aria-hidden','true');layer.style.setProperty('--album-color',album.style.getPropertyValue('--album-color'));
 const camera=document.createElement('div');camera.className='cd-transition-camera';Object.assign(camera.style,{left:sceneBounds.left+'px',top:sceneBounds.top+'px',width:sceneBounds.width+'px',height:sceneBounds.height+'px'});
 const shell=document.createElement('div');shell.className='cd-opening-case';
 const shadow=document.createElement('div');shadow.className='cd-transition-shadow';shell.append(shadow);
 const tray=document.createElement('div');tray.className='cd-opening-tray';
 const disc=document.createElement('div');disc.className='cd-disc cd-opening-disc';
 const print=document.createElement('div');print.className='cd-disc-print';
 const rim=document.createElement('span');rim.className='cd-disc-rim';
 const title=document.createElement('span');title.className='cd-disc-label';title.textContent=project.title;
 const hub=document.createElement('span');hub.className='cd-disc-hub';print.append(rim,title,hub);disc.append(print);tray.append(disc);
 const lid=document.createElement('div');lid.className='cd-opening-lid';
 const front=album.querySelector('.cd-front').cloneNode(true),inside=document.createElement('div');inside.className='cd-lid-inside';
 const edition=document.createElement('span');edition.className='cd-inside-edition';edition.textContent='VOL. '+String(index+1).padStart(2,'0');
 const linerTitle=document.createElement('h2');linerTitle.textContent=project.title;
 const tags=document.createElement('p');tags.textContent=project.tags.join(' / ');inside.append(edition,linerTitle,tags);lid.append(front,inside);shell.append(tray,lid);camera.append(shell);layer.append(camera);document.body.append(layer);
 const reader=document.createElement('div');reader.className='cd-reader-preview';reader.style.clipPath='circle(0px at 50% 50%)';
 const iframe=document.createElement('iframe');iframe.dataset.cdPreview='true';iframe.title=project.title;iframe.tabIndex=-1;iframe.setAttribute('aria-hidden','true');
 const wash=document.createElement('div');wash.className='cd-reader-wash';wash.style.background=album.style.getPropertyValue('--album-color');
 reader.append(iframe,wash);layer.append(reader);
 let timer;
 const readerReady=new Promise(resolve=>{const finish=value=>{clearTimeout(timer);resolve(value);};iframe.addEventListener('load',async()=>{try{const header=iframe.contentDocument.querySelector('.site-header');if(header){header.style.backdropFilter='none';header.style.position='absolute';header.style.top=(returning?readerScroll:0)+'px';}await iframe.contentDocument.fonts.ready;iframe.contentWindow.scrollTo({top:returning?readerScroll:0,left:0,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(resolve));finish(true);}catch{finish(false);}},{once:true});iframe.addEventListener('error',()=>finish(false),{once:true});timer=setTimeout(()=>finish(false),6000);});
 iframe.src=new URL(project.page,document.baseURI).href;
 const help=document.querySelector('.cd-help');if(help){const r=help.getBoundingClientRect(),caption=document.createElement('div');caption.className='cd-transition-caption';caption.textContent=document.documentElement.lang==='en'?(returning?'Returning to the collection':'Opening the project'):(returning?'Terug naar de collectie':'Project openen');Object.assign(caption.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});layer.append(caption);}
 document.body.classList.add('cd-is-opening');album.classList.add('is-opening-source');
 const neighbours=[...document.querySelectorAll('.cd-album')].filter(el=>el!==album).map(el=>({el,base:getComputedStyle(el).transform}));
 function setPose(pose){for(const [key,value]of Object.entries(pose))shell.style[key]=value+'px';}
 function setCircle(){const r=disc.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return{x,y,r:Math.min(tray.getBoundingClientRect().width,tray.getBoundingClientRect().height)*.45,max:Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))+4};}
 function clip(circle,progress){return `circle(${circle.r+(circle.max-circle.r)*progress}px at ${circle.x}px ${circle.y}px)`;}
 function revealReader(circle,reverse,duration){
  const circleMotion=animate(reader,frames(p=>({clipPath:clip(circle,reverse?1-smooth(p):smooth(p))})),{duration});
  animate(wash,frames(p=>{const progress=reverse?1-smooth(p):smooth(p);return{opacity:1-Math.min(1,progress/.45)};}),{duration});
  return circleMotion.finished;
 }
 function cleanup(){clearTimeout(timer);stopSpin();reduced.removeEventListener('change',finishForReduced);effects.forEach(a=>a.cancel());layer.remove();album.classList.remove('is-opening-source');document.body.classList.remove('cd-is-opening');}
 try{
  if(!returning){
   layer.dataset.phase='picking';setPose(rest);shell.style.transform=initialTransform;lid.style.transform='rotateY(0deg)';tray.style.visibility='hidden';
   neighbours.forEach(({el,base})=>animate(el,frames(p=>({transform:base+` translateY(${smooth(p)*sceneBounds.height*.25}px) scale(${1-.3*smooth(p)})`,opacity:1-.86*smooth(p)})),{duration:motion.pick}));
   await animate(shell,positionFrames(rest,picked),{duration:motion.pick}).finished;
   await clock(motion.align);
   layer.dataset.phase='opening';tray.style.visibility='visible';
   animate(shell,positionFrames(picked,opened),{duration:motion.open});
   animate(shell,[{transform:initialTransform},{transform:'rotateY(0deg)'}],{duration:motion.open,easing:'cubic-bezier(.333333,0,.666667,1)'});
   animate(shadow,frames(p=>({left:-100*smooth(p)+'%',width:100+100*smooth(p)+'%'})),{duration:motion.open});
   animate(tray,frames(p=>({opacity:smooth(Math.min(1,smooth(p)*4))})),{duration:motion.open});
   await animate(lid,frames(p=>({transform:`rotateY(${-180*smooth(p)}deg)`})),{duration:motion.open}).finished;
   layer.dataset.phase='spinning';await clock(motion.pause);
   startSpin('ramp',0);await clock(motion.accelerate);await clock(motion.hold);
   const handoff=await readerReady;
   const circle=setCircle();
   layer.dataset.phase='entering';
   if(!handoff){iframe.style.visibility='hidden';wash.style.opacity='1';}
   await revealReader(circle,false,motion.enter);
   stopSpin();speed=0;layer.dataset.phase='covered';
   return {cleanup,handoff,angle};
  }
  setPose(opened);shell.style.transform='rotateY(0deg)';lid.style.transform='rotateY(-180deg)';Object.assign(shadow.style,{left:'-100%',width:'200%'});
  neighbours.forEach(({el,base})=>animate(el,[{transform:base+` translateY(${sceneBounds.height*.25}px) scale(.7)`,opacity:.14}],{duration:1}));
  const ready=await readerReady;
  const circle=setCircle();reader.style.clipPath=clip(circle,1);wash.style.opacity=ready?'0':'1';
  if(!ready)iframe.style.visibility='hidden';
  layer.dataset.phase='exiting';onReady();startSpin('constant',entryAngle);
  await revealReader(circle,true,motion.exit);
  stopSpin();reader.style.visibility='hidden';
  layer.dataset.phase='stopping';
  const target=Math.ceil((angle+motion.speed*.35)/360)*360,delta=target-angle;
  const duration=reduced.matches?0:Math.min(900,delta*2000/motion.speed);
  startSpin('brake',angle,{delta,duration:Math.max(1,duration),slope:duration?motion.speed*duration/1000/delta:0});
  await clock(duration);stopSpin();angle=target;print.style.transform=`rotate(${target}deg)`;
  layer.dataset.phase='closing';
  const close=animate(lid,frames(p=>({transform:`rotateY(${-180*(1-smooth(p))}deg)`})),{duration:motion.close});
  animate(tray,frames(p=>({opacity:smooth(Math.min(1,(1-smooth(p))*4))})),{duration:motion.close});
  await clock(motion.returnDelay);layer.dataset.phase='returning';
  await done([
   close,
   animate(shell,positionFrames(opened,rest),{duration:motion.return}),
   animate(shell,[{transform:'rotateY(0deg)'},{transform:initialTransform}],{duration:motion.return,easing:'cubic-bezier(.333333,0,.666667,1)'}),
   animate(shadow,frames(p=>({left:-100*(1-smooth(p))+'%',width:100+100*(1-smooth(p))+'%'})),{duration:motion.return}),
   ...neighbours.map(({el,base})=>animate(el,frames(p=>({transform:base+` translateY(${(1-smooth(p))*sceneBounds.height*.25}px) scale(${.7+.3*smooth(p)})`,opacity:.14+.86*smooth(p)})),{duration:motion.return}))
  ]);
  cleanup();album.focus({preventScroll:true});return {cleanup};
 }catch(error){cleanup();throw error;}
}
