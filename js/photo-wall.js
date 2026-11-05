import { exampleImages } from './photo-wall-examples.js?v=20261103-optimized1';
import { photoCategories, categoryFor } from './photo-wall-categories.js?v=20261105-1';
import './profile-notes.js?v=20261105-1';
const wrap=document.querySelector('.memory-scroll'),stage=document.querySelector('.photo-wall-stage'),wall=document.querySelector('.photo-wall');
const shade=stage.querySelector('.photo-wall-shade'),heading=stage.querySelector('h1'),bar=stage.querySelector('.photo-wall-progress span'),panControl=stage.querySelector('.wall-pan');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),columns=10,rows=5;
let metadata=[];try{metadata=await fetch('img/wall-photos/manifest.json').then(r=>r.json());}catch{}
const dimensions=new Map(metadata.map(m=>[m.optimized,m.width/m.height]));
const photos=Array.from({length:columns*rows},(_,i)=>{const image=exampleImages[i%exampleImages.length];return{image,group:categoryFor(image),ratio:dimensions.get(image)||9/16};});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const language=()=>document.documentElement.lang==='en'?'en':'nl';
const copy={nl:{about:'Over mij ↓',guide:'Scroll ↓ · kijk eens wat dichterbij',museumGuide:'Beweeg je muis over de foto’s',touchGuide:'Tik of sleep met het vergrootglas',mixed:'Mijn herinneringen',profileTitle:'Dit ben ik.',concerts:'Concerten bezoeken',profileNote:'Even voorstellen.',hobbyNote:'Als mijn laptop dicht is.',workNote:'Ook een deel van mij.',studyNote:'Nog lang niet uitgeleerd.',projectNote:'Van kijken naar maken.',pan:'Verschuif de fototafel',wall:'Mijn foto’s, gegroepeerd als een fototafel. Gebruik de pijltjestoetsen voor het vergrootglas.',categories:'Verzamelingen'},en:{about:'About me ↓',guide:'Scroll ↓ · take a closer look',museumGuide:'Move your mouse over the photographs',touchGuide:'Tap or drag the magnifying glass',mixed:'My memories',profileTitle:'This is me.',concerts:'Going to concerts',profileNote:'Nice to meet you.',hobbyNote:'When my laptop is closed.',workNote:'Part of me, too.',studyNote:'Still learning.',projectNote:'From looking to making.',pan:'Pan the photo table',wall:'My photographs, grouped as a photo table. Use the arrow keys to move the magnifying glass.',categories:'Collections'}};
const cards=photos.map((photo,i)=>{const card=document.createElement('figure');card.className='photo-wall-card';card.dataset.slot=i+1;card.dataset.category=photo.group;const print=document.createElement('div');print.className='photo-wall-print';const img=document.createElement('img');img.src=photo.image;img.width=640;img.height=Math.round(640/photo.ratio);img.draggable=false;img.decoding='async';print.append(img);card.append(print);wall.append(card);return{card,img};});
const labels=photoCategories.map(group=>{const h=document.createElement('h2');h.className='photo-table-label';h.dataset.category=group.id;wall.append(h);return h;});
const nav=document.createElement('nav');nav.className='photo-table-nav';nav.setAttribute('aria-label','Verzamelingen');
const buttons=photoCategories.map((group,i)=>{const b=document.createElement('button');b.type='button';b.dataset.photoCategory=group.id;b.addEventListener('click',()=>focusGroup(i));nav.append(b);return b;});stage.append(nav);
const glass=document.createElement('div');glass.className='photo-table-lens';glass.setAttribute('aria-hidden','true');
const canvas=document.createElement('canvas');glass.append(canvas);stage.append(glass);const ctx=canvas.getContext('2d',{alpha:false});
let origin=0,distance=innerHeight*2.6,endHold=innerHeight*.7,target=0,progress=0,raf=0,lastFrame=0,visible=true,pan=0,panTarget=0,selectedGroup=0;
let layoutData=null,screenPhotos=[],screenLabels=[],baseWidth=0,lensSize=0,dpr=1,drag=null;
const lens={x:0,y:0,targetX:0,targetY:0,active:false,touch:false};
wall.tabIndex=0;wall.setAttribute('role','group');
function request(){if(!raf)raf=requestAnimationFrame(draw);}
function measure(){target=clamp((scrollY-origin)/distance);if(target<.72)lens.active=false;if(visible)request();}
function makeLayout(w,h){
 if(w>=768)return makeDesktopLayout(w,h);
 const mobile=w<768,groupW=mobile?255:340,cols=4,tileGap=mobile?14:18,tileW=(groupW-(cols-1)*tileGap)/cols;
 const positions=[],heads=[],groups=[];
 const noise=(i,seed)=>{const n=Math.sin(i*127.1+seed*311.7)*43758.5453;return n-Math.floor(n);};
 photoCategories.forEach((group,g)=>{
  const heights=Array.from({length:cols},(_,c)=>46+noise(c,g+1)*34),members=photos.map((p,i)=>({...p,i})).filter(p=>p.group===group.id),local=[];
  members.forEach((photo,n)=>{const col=heights.indexOf(Math.min(...heights)),width=tileW*(.86+noise(photo.i,3)*.2),height=width/clamp(photo.ratio,.48,1.8),x=col*(tileW+tileGap)+(noise(photo.i,4)-.5)*9,y=heights[col];local.push({index:photo.i,x,y,w:width,h:height,angle:(noise(photo.i,5)-.5)*9});heights[col]+=height+tileGap+noise(photo.i,6)*14;});
  groups.push({local,height:Math.max(...heights)});
 });
 const anchors=mobile?groups.map((_,g)=>({x:g*(groupW+65),y:[55,0,105,30][g]})):[{x:0,y:15},{x:groupW+105,y:135},{x:groupW*2+225,y:0},{x:groupW*1.48+105,y:Math.max(groups[1].height+190,groups[2].height+65)}];
 let worldW=0,worldH=0;
 groups.forEach((group,g)=>{const anchor=anchors[g];heads.push({x:anchor.x,y:anchor.y,w:groupW,group:g});for(const p of group.local)positions[p.index]={...p,x:p.x+anchor.x,y:p.y+anchor.y};worldW=Math.max(worldW,anchor.x+groupW+12);worldH=Math.max(worldH,anchor.y+group.height+12);});
 const top=Math.max(mobile?250:170,h*(mobile?.32:.27)),availableH=Math.max(60,Math.min(h*.62,h-top-85));
 const scale=Math.min(mobile?1:w*.90/worldW,availableH/worldH),worldWidth=worldW*scale,worldHeight=worldH*scale;
 return{positions,heads,scale,width:worldWidth,height:worldHeight,groupW:groupW*scale,top,overflow:Math.max(0,worldWidth-w*.9),mobile};
}
// Fit the islands to the available width as well as height, instead of
// shrinking a fixed tall composition into the middle of a wide screen.
function makeDesktopLayout(w,h){
 const noise=(i,seed)=>{const n=Math.sin(i*127.1+seed*311.7)*43758.5453;return n-Math.floor(n);};
 const top=Math.max(150,h*.20),availableW=w*.89,availableH=Math.max(80,h-top-55),cache=photoCategories.map((group,g)=>{
  const members=photos.map((p,i)=>({...p,i})).filter(p=>p.group===group.id),choices=[];
  for(let cols=2;cols<=7;cols++){
   const heights=Array.from({length:cols},(_,c)=>.8+noise(c,g+1)*.35),local=[];
   for(const photo of members){const col=heights.indexOf(Math.min(...heights)),width=.88+noise(photo.i,3)*.16,height=width/clamp(photo.ratio,.48,1.8),x=.12+col*1.18+(noise(photo.i,4)-.5)*.10,y=heights[col];local.push({index:photo.i,x,y,w:width,h:height,angle:(noise(photo.i,5)-.5)*9});heights[col]+=height+.18+noise(photo.i,6)*.12;}
   choices.push({local,width:cols*1.18-.18+.24,height:Math.max(...heights)+.12});
  }return choices;
 });
 let best=null;
 for(const a of cache[0])for(const b of cache[1])for(const c of cache[2])for(const d of cache[3]){
  const groups=[a,b,c,d],gap=.85;
  const layouts=[
   [{x:0,y:.35},{x:a.width+gap,y:1.05},{x:a.width+b.width+gap*2,y:0},{x:a.width+b.width+c.width+gap*3,y:.75}],
   [{x:0,y:.3},{x:a.width+gap,y:.75},{x:a.width+Math.max(b.width,d.width)+gap*2,y:0},{x:a.width+gap+.3,y:.75+b.height+gap}]
  ];
  for(const anchors of layouts){const width=Math.max(...groups.map((g,i)=>anchors[i].x+g.width)),height=Math.max(...groups.map((g,i)=>anchors[i].y+g.height)),scale=Math.min(availableW/width,availableH/height);if(!best||scale>best.scale)best={groups,anchors,width,height,scale};}
 }
 const positions=[],heads=[];
 best.groups.forEach((group,g)=>{const anchor=best.anchors[g];heads.push({x:anchor.x,y:anchor.y,w:group.width,group:g});for(const p of group.local)positions[p.index]={...p,x:p.x+anchor.x,y:p.y+anchor.y};});
 return{positions,heads,scale:best.scale,width:best.width*best.scale,height:best.height*best.scale,groupW:best.groups[0].width*best.scale,top,overflow:0,mobile:false};
}
function layout(){origin=wrap.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(stage).top);distance=innerHeight*2.6;endHold=innerHeight*.7;wrap.style.height=stage.offsetHeight+distance+endHold+'px';layoutData=makeLayout(stage.clientWidth,stage.clientHeight);measure();}
function boardX(w){return layoutData.overflow?w*.05-pan*layoutData.overflow:(w-layoutData.width)/2;}
function focusGroup(i){selectedGroup=i;const w=stage.clientWidth;panTarget=layoutData.overflow?clamp(((layoutData.heads[i].x+layoutData.heads[i].w/2)*layoutData.scale-w*.45)/layoutData.overflow):0;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));if(!layoutData.mobile){lens.targetX=(w-layoutData.width)/2+(layoutData.heads[i].x+layoutData.heads[i].w/2)*layoutData.scale;lens.targetY=layoutData.top+(layoutData.heads[i].y+100)*layoutData.scale;lens.active=true;}request();}
function placeLens(x,y){const r=lensSize/2;const w=stage.clientWidth,h=stage.clientHeight;lens.targetX=clamp(x,12,w-12);lens.targetY=clamp(y,layoutData.top-5,h-65);if(!lens.active){lens.x=lens.targetX;lens.y=lens.targetY;}lens.active=true;request();}
function draw(now){
 raf=0;if(!layoutData)return;const dt=Math.min(.05,Math.max(.001,(now-(lastFrame||now-16))/1000));lastFrame=now;
 progress=reduced.matches?target:lerp(progress,target,1-Math.exp(-dt*9));if(Math.abs(progress-target)<.0002)progress=target;
 pan=reduced.matches?panTarget:lerp(pan,panTarget,1-Math.exp(-dt*12));if(Math.abs(pan-panTarget)<.0002)pan=panTarget;
 lens.x=reduced.matches?lens.targetX:lerp(lens.x,lens.targetX,1-Math.exp(-dt*22));lens.y=reduced.matches?lens.targetY:lerp(lens.y,lens.targetY,1-Math.exp(-dt*22));
 const w=stage.clientWidth,h=stage.clientHeight,mobile=layoutData.mobile,wallT=smooth(clamp(progress/.62)),tableT=smooth(clamp((progress-.55)/.45));
 const gap=lerp(12,mobile?8:12,wallT),endCellH=Math.min(h*.65/5.25,mobile?110:(w*.91-gap*9)/10*16/9),cellW=lerp(Math.max(w/4.2,h*.24),endCellH*9/16,wallT),cellH=cellW*16/9;
 const gridW=cellW*10+gap*9,gridH=cellH*5+gap*4,cx=w/2,cy=lerp(h*.5,h*.58,wallT),bx=boardX(w);

 if(baseWidth!==64){baseWidth=64;cards.forEach(({card})=>{card.style.width='64px';card.style.height='113.7778px';});}
 screenPhotos=[];
 cards.forEach(({card,img},i)=>{const p=layoutData.positions[i],col=i%columns,row=Math.floor(i/columns),width=lerp(cellW,p.w*layoutData.scale*1.08,tableT),height=lerp(cellH,p.h*layoutData.scale*1.08,tableT);
  const x=lerp(cx-gridW/2+col*(cellW+gap),bx+(p.x-p.w*.04)*layoutData.scale,tableT),y=lerp(cy-gridH/2+row*(cellH+gap)+Math.sin(col*1.8)*h*.1*(1-wallT),layoutData.top+(p.y-p.h*.04)*layoutData.scale,tableT);
  // Fixed-size wrappers keep movement composited; only the print's aspect changes during assembly.
  const angle=lerp(0,p.angle,tableT);card.style.transform=`translate3d(${x}px,${y}px,0) scale(${width/64}) rotate(${angle}deg)`;card.style.height=(height*64/width)+'px';card.style.opacity='1';card.style.zIndex=String(i+1);card.style.setProperty('--turn',(Math.sin(i*5.1)*1.8*(1-tableT))+'deg');card.style.setProperty('--print-scale','1');img.style.filter=`grayscale(${tableT}) brightness(${1-tableT*.46})`;
  screenPhotos.push({x,y,w:width,h:height,img,angle});
 });
 screenLabels=layoutData.heads.map((head,i)=>{const x=bx+head.x*layoutData.scale,y=layoutData.top+head.y*layoutData.scale;labels[i].textContent=photoCategories[i][language()];labels[i].style.transform=`translate(${x}px,${y}px)`;labels[i].style.opacity=tableT;return{x,y,text:photoCategories[i][language()]};});
 shade.style.opacity=1-wallT;stage.style.backgroundColor='#112d4e';stage.style.color='#f9f7f7';heading.style.color='inherit';heading.style.transform='translateY(-50%)';heading.style.fontSize=lerp(Math.min(mobile?w*.19:w*.11,175),mobile?42:56,wallT)+'px';heading.style.top=lerp(mobile?43:50,14,wallT)+'%';
 bar.style.transform=`scaleX(${clamp((scrollY-origin)/(distance+endHold))})`;stage.dataset.progress=progress.toFixed(3);stage.dataset.table=tableT.toFixed(3);wall.dataset.pan=pan.toFixed(3);stage.classList.toggle('is-photo-table',tableT>.6);
 panControl.hidden=!(mobile&&progress>.78&&layoutData.overflow>0);panControl.value=pan;nav.classList.toggle('is-ready',progress>.78);
 const newSize=mobile?168:244;if(lensSize!==newSize||dpr!==Math.min(devicePixelRatio||1,2)){lensSize=newSize;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(lensSize*dpr);canvas.height=Math.round(lensSize*dpr);glass.style.width=glass.style.height=lensSize+'px';}
 const showLens=lens.active&&progress>.78&&visible;glass.classList.toggle('is-active',showLens);document.body.classList.toggle('is-photo-magnifying',showLens);const displayX=lens.touch?clamp(lens.x,lensSize/2+8,w-lensSize/2-8):lens.x,displayY=lens.touch?clamp(lens.y,lensSize/2+8,h-lensSize/2-55):lens.y;glass.style.transform=`translate3d(${displayX-lensSize/2}px,${displayY-lensSize/2}px,0)`;
 if(showLens)paintLens();
 if(visible&&(progress!==target||pan!==panTarget||Math.abs(lens.x-lens.targetX)>.15||Math.abs(lens.y-lens.targetY)>.15))request();
}
function paintLens(){
 const r=lensSize/2,zoom=2.82;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#112d4e';ctx.fillRect(0,0,lensSize,lensSize);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 for(const photo of screenPhotos){const x=r+(photo.x-lens.x)*zoom,y=r+(photo.y-lens.y)*zoom,w=photo.w*zoom,h=photo.h*zoom,pad=Math.max(w,h)*.16;if(x-pad>lensSize||y-pad>lensSize||x+w+pad<0||y+h+pad<0||!photo.img.complete||!photo.img.naturalWidth)continue;ctx.save();ctx.translate(x,y);ctx.rotate(photo.angle*Math.PI/180);ctx.fillStyle='#f9f7f7';const border=1.5*zoom;ctx.fillRect(-border,-border,w+2*border,h+2*border);const fit=Math.max(w/photo.img.naturalWidth,h/photo.img.naturalHeight),sw=w/fit,sh=h/fit;ctx.drawImage(photo.img,(photo.img.naturalWidth-sw)/2,(photo.img.naturalHeight-sh)/2,sw,sh,0,0,w,h);ctx.restore();}
 ctx.fillStyle='#f9f7f7';ctx.font='600 '+((layoutData.mobile?18:21)*zoom)+'px "Manrope", sans-serif';for(const label of screenLabels){const x=r+(label.x-lens.x)*zoom,y=r+(label.y+18-lens.y)*zoom;if(y>-10&&y<lensSize+30)ctx.fillText(label.text,x,y);}
}
wall.addEventListener('pointermove',e=>{if(progress<.78)return;const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(e.pointerType==='touch')lens.touch=true;if(y<layoutData.top-10||y>stage.clientHeight-65){if(!lens.touch){lens.active=false;request();}return;}placeLens(x,y);});
wall.addEventListener('pointerdown',e=>{if(progress<.78||e.button!==0)return;lens.touch=e.pointerType==='touch';const r=stage.getBoundingClientRect();placeLens(e.clientX-r.left,e.clientY-r.top);drag={id:e.pointerId,x:e.clientX,y:e.clientY,active:false};});
wall.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(!drag.active&&Math.abs(e.clientX-drag.x)>8&&Math.abs(e.clientX-drag.x)>Math.abs(e.clientY-drag.y)){drag.active=true;wall.setPointerCapture(e.pointerId);}});
function release(e){if(e.type==='lostpointercapture'&&e.target!==wall)return;drag=null;}
for(const event of ['pointerup','pointercancel','lostpointercapture'])wall.addEventListener(event,release);
wall.addEventListener('pointerleave',()=>{if(!lens.touch){lens.active=false;request();}});
wall.addEventListener('keydown',e=>{const moves={ArrowLeft:[-28,0],ArrowRight:[28,0],ArrowUp:[0,-28],ArrowDown:[0,28]};if(progress<.78)return;if(moves[e.key]){e.preventDefault();placeLens((lens.active?lens.targetX:stage.clientWidth/2)+moves[e.key][0],(lens.active?lens.targetY:layoutData.top+120)+moves[e.key][1]);}if(e.key==='Escape'){lens.active=false;request();}});
panControl.addEventListener('input',()=>{panTarget=Number(panControl.value);const center=panTarget*layoutData.overflow+stage.clientWidth*.45;selectedGroup=layoutData.heads.reduce((best,head,i)=>Math.abs((head.x+head.w/2)*layoutData.scale-center)<Math.abs((layoutData.heads[best].x+layoutData.heads[best].w/2)*layoutData.scale-center)?i:best,0);buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selectedGroup)));request();});
function translate(){const c=copy[language()];document.querySelectorAll('[data-memory-ui]').forEach(el=>{if(c[el.dataset.memoryUi])el.textContent=c[el.dataset.memoryUi];});wall.setAttribute('aria-label',c.wall);panControl.setAttribute('aria-label',c.pan);nav.setAttribute('aria-label',c.categories);buttons.forEach((b,i)=>{b.textContent=photoCategories[i][language()];b.setAttribute('aria-pressed',String(i===selectedGroup));});cards.forEach(({img},i)=>img.alt=(language()==='en'?'Personal photograph ':'Persoonlijke foto ')+(i+1));request();}
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stage.classList.toggle('is-wall-visible',visible);if(!visible){lens.active=false;glass.classList.remove('is-active');document.body.classList.remove('is-photo-magnifying');}else request();}).observe(stage);
window.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',layout);window.addEventListener('load',layout);reduced.addEventListener('change',measure);document.addEventListener('languageChanged',translate);translate();layout();
