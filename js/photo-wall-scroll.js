import { exampleImages } from './photo-wall-examples.js?v=20261105-intro5';
import { photoCategories, categoryFor } from './photo-wall-categories.js?v=20261105-intro5';
export async function initPhotoWall({ signal }) {
const on=(target,event,listener,options={})=>target.addEventListener(event,listener,{...options,signal});
const wrap=document.querySelector('.memory-scroll'),stage=document.querySelector('.photo-wall-stage'),wall=document.querySelector('.photo-wall');
const shade=stage.querySelector('.photo-wall-shade'),heading=stage.querySelector('h1'),bar=stage.querySelector('.photo-wall-progress span'),panControl=stage.querySelector('.wall-pan');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),rows=5;
// Mobile paints one bounded canvas rather than one composited layer per photograph.
const mobileRenderer=matchMedia('(max-width:767px)').matches;
const boardCanvas=mobileRenderer?document.createElement('canvas'):null;
const boardContext=boardCanvas?.getContext('2d');
let boardDpr=1;
if(boardCanvas){boardCanvas.className='photo-wall-canvas';boardCanvas.setAttribute('role','img');wall.append(boardCanvas);}
stage.dataset.renderer=mobileRenderer?'canvas':'dom';
let metadata=[];try{metadata=await fetch('img/wall-photos/manifest.json',{signal}).then(r=>r.json());}catch{}
if(signal.aborted)return;
const dimensions=new Map(metadata.map(m=>[m.optimized,m.width/m.height]));
const photos=[...new Set(exampleImages)].map(image=>({image,group:categoryFor(image),ratio:dimensions.get(image)||9/16}));
const columns=Math.max(1,Math.ceil(photos.length/rows));
// Reserve central grid positions for the four opening prints, so they shrink into the wall.
const openingColumns=mobileRenderer?2:4,openingRows=mobileRenderer?2:1;
const openingSlots=Array.from({length:Math.min(4,photos.length)},(_,i)=>(Math.floor((rows-openingRows)/2)+Math.floor(i/openingColumns))*columns+Math.floor((columns-openingColumns)/2)+i%openingColumns);
const gridSlots=[...openingSlots,...Array.from({length:columns*rows},(_,i)=>i).filter(i=>!openingSlots.includes(i))];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const language=()=>document.documentElement.lang==='en'?'en':'nl';
const copy={nl:{about:'Over mij ↓',guide:'Scroll ↓ · kijk eens wat dichterbij',museumGuide:'Beweeg je muis over de foto’s',touchGuide:'Tik op een foto om dichterbij te kijken',mixed:'Mijn herinneringen',profileTitle:'Dit ben ik.',concerts:'Concerten bezoeken',profileNote:'Even voorstellen.',hobbyNote:'Als mijn laptop dicht is.',workNote:'Ook een deel van mij.',studyNote:'Nog lang niet uitgeleerd.',projectNote:'Van kijken naar maken.',pan:'Verschuif de fototafel',wall:'Mijn foto’s, gegroepeerd als een fototafel. Gebruik de pijltjestoetsen voor het vergrootglas.',categories:'Verzamelingen'},en:{about:'About me ↓',guide:'Scroll ↓ · take a closer look',museumGuide:'Move your mouse over the photographs',touchGuide:'Tap a photograph to take a closer look',mixed:'My memories',profileTitle:'This is me.',concerts:'Going to concerts',profileNote:'Nice to meet you.',hobbyNote:'When my laptop is closed.',workNote:'Part of me, too.',studyNote:'Still learning.',projectNote:'From looking to making.',pan:'Pan the photo table',wall:'My photographs, grouped as a photo table. Use the arrow keys to move the magnifying glass.',categories:'Collections'}};
const cards=photos.map((photo,i)=>{const card=document.createElement('figure');card.className='photo-wall-card';card.dataset.slot=i+1;card.dataset.category=photo.group;const print=document.createElement('div');print.className='photo-wall-print';const img=document.createElement('img');const picture=document.createElement('picture'),source=document.createElement('source');source.media='(max-width:767px), (prefers-reduced-motion:reduce)';source.srcset=photo.image.replace('wall-photos/','wall-photos/mobile/');picture.append(source,img);img.src=mobileRenderer?photo.image.replace('wall-photos/','wall-photos/mobile/'):photo.image;img.width=640;img.height=Math.round(640/photo.ratio);img.draggable=false;img.decoding='async';print.append(picture);card.append(print);if(!mobileRenderer)wall.append(card);return{card,img};});
const labels=photoCategories.map(group=>{const h=document.createElement('h2');h.className='photo-table-label';h.dataset.category=group.id;stage.append(h);return h;});
const nav=document.createElement('nav');nav.className='photo-table-nav';nav.setAttribute('aria-label','Verzamelingen');
const buttons=photoCategories.map((group,i)=>{const b=document.createElement('button');b.type='button';b.dataset.photoCategory=group.id;on(b,'click',()=>focusGroup(i));nav.append(b);return b;});stage.append(nav);
const glass=document.createElement('div');glass.className='photo-table-lens';glass.setAttribute('aria-hidden','true');
const canvas=document.createElement('canvas');glass.append(canvas);stage.append(glass);const ctx=canvas.getContext('2d',{alpha:false});
// A stationary print keeps the photograph clear of the user's finger on mobile.
const detail=document.createElement('section');detail.className='photo-print-detail';detail.hidden=true;
detail.setAttribute('aria-label','Foto bekijken');
detail.innerHTML=`<button class="photo-print-close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><figure><img alt=""><figcaption aria-live="polite"></figcaption></figure><div class="photo-print-controls"><button type="button" data-step="-1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h14"/></svg></button><span class="photo-print-count"></span><button type="button" data-step="1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7M3 12h14"/></svg></button></div>`;
const inspect=document.createElement('button');inspect.type='button';inspect.className='photo-print-open';inspect.hidden=true;
if(mobileRenderer)stage.append(detail,inspect);
const detailImage=detail.querySelector('img'),detailCaption=detail.querySelector('figcaption'),detailCount=detail.querySelector('.photo-print-count'),detailClose=detail.querySelector('.photo-print-close');
const detailFigure=detail.querySelector('figure');
const themeHint=document.createElement('p');themeHint.className='photo-theme-hint';themeHint.hidden=true;if(mobileRenderer)stage.append(themeHint);
let detailIndex=-1,requestedIndex=-1,printRevision=0,closingPrint=false;
const printAnimations=new Set();
function cancelPrintMotion(){printRevision++;for(const animation of printAnimations)animation.cancel();printAnimations.clear();return printRevision;}
async function animatePrint(element,keyframes,duration){
 if(reduced.matches||signal.aborted)return;
 const animation=element.animate(keyframes,{duration,easing:'cubic-bezier(.22,.7,.3,1)',fill:'forwards'});printAnimations.add(animation);
 try{await animation.finished;}catch{}
 return animation;
}
function releaseAnimation(animation){animation?.cancel();printAnimations.delete(animation);}
function renderPrint(i){
 detailIndex=i;const members=groupMembers(),photo=photos[i],group=photoCategories.find(group=>group.id===photo.group);
 detailImage.src=photo.image;detailImage.alt=(language()==='en'?'Personal photograph ':'Persoonlijke foto ')+(i+1);
 detailCaption.textContent=group[language()];detailCount.textContent=`${members.indexOf(i)+1} / ${members.length}`;
}

const groupMembers=()=>photos.map((photo,i)=>photo.group===photos[detailIndex]?.group&&photos.findIndex(item=>item.image===photo.image)===i?i:-1).filter(i=>i>=0);
function openPrint(i,focus=false){
 i=photos.findIndex(photo=>photo.image===photos[i].image);
 const revision=cancelPrintMotion();closingPrint=false;requestedIndex=i;renderPrint(i);
 detail.hidden=false;stage.classList.add('is-print-open');positionPrint();
 if(focus)detailClose.focus({preventScroll:true});
 animatePrint(detail,[{opacity:0},{opacity:1}],180).then(animation=>{if(revision===printRevision)releaseAnimation(animation);});
 animatePrint(detailFigure,[{opacity:0,transform:'translateY(24px) scale(.88) rotate(-5deg)'},{opacity:1,transform:'translateY(0) scale(1) rotate(0deg)'}],320).then(animation=>{if(revision===printRevision)releaseAnimation(animation);});
}
function positionPrint(){const headerBottom=document.querySelector('.site-header')?.getBoundingClientRect().bottom||0;detail.style.top=Math.max(0,headerBottom-stage.getBoundingClientRect().top)+'px';}
function finishClose(restore){detail.hidden=true;detailIndex=requestedIndex=-1;closingPrint=false;stage.classList.remove('is-print-open');if(restore&&!inspect.hidden)inspect.focus({preventScroll:true});}
async function closePrint(restore=false){
 if(detail.hidden||closingPrint)return;
 const revision=cancelPrintMotion();closingPrint=true;
 await Promise.all([
  animatePrint(detailFigure,[{opacity:1,transform:'translateY(0) scale(1) rotate(0deg)'},{opacity:0,transform:'translateY(20px) scale(.9) rotate(4deg)'}],180),
  animatePrint(detail,[{opacity:1},{opacity:0}],200)
 ]);
 if(signal.aborted||revision!==printRevision)return;
 finishClose(restore);cancelPrintMotion();
}
on(detailClose,'click',()=>closePrint(true));
on(window,'wheel',()=>{if(detailIndex>=0)closePrint();},{passive:true});
on(detail,'touchmove',()=>closePrint(),{passive:true});
on(inspect,'click',()=>openPrint(photos.findIndex(photo=>photo.group===photoCategories[selectedGroup].id),true));
async function stepPrint(step){
 if(detail.hidden||closingPrint)return;
 const members=groupMembers(),base=requestedIndex<0?detailIndex:requestedIndex;
 const next=members[(members.indexOf(base)+step+members.length)%members.length];
 const revision=cancelPrintMotion();requestedIndex=next;
 // Decode the incoming original before moving the visible card away.
 const incoming=new Image();incoming.src=photos[next].image;try{await incoming.decode();}catch{if(revision===printRevision)requestedIndex=detailIndex;return;}
 if(signal.aborted||revision!==printRevision)return;
 const outgoing=await animatePrint(detailFigure,[{opacity:1,transform:'translateX(0) scale(1) rotate(0deg)'},{opacity:0,transform:`translateX(${-step*54}px) scale(.92) rotate(${-step*5}deg)`}],150);
 if(signal.aborted||revision!==printRevision)return;
 renderPrint(next);releaseAnimation(outgoing);
 const entering=await animatePrint(detailFigure,[{opacity:0,transform:`translateX(${step*64}px) scale(.92) rotate(${step*5}deg)`},{opacity:1,transform:'translateX(0) scale(1) rotate(0deg)'}],260);
 if(revision===printRevision)releaseAnimation(entering);
}
detail.querySelectorAll('[data-step]').forEach(button=>on(button,'click',()=>stepPrint(Number(button.dataset.step))));
on(detail,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();closePrint(true);}if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();stepPrint(event.key==='ArrowLeft'?-1:1);}});
let origin=0,distance=innerHeight*2.6,endHold=innerHeight*.7,target=0,progress=0,raf=0,lastFrame=0,visible=true,pan=0,panTarget=0,selectedGroup=0;
let layoutData=null,screenPhotos=[],screenLabels=[],baseWidth=0,lensSize=0,dpr=1,drag=null;
let stageWidth=0,stageHeight=0,paintedProgress=-1,paintedPan=-1,layoutFrame=0;
const cardHeights=new Map();
if(!mobileRenderer)cards.forEach(({card},i)=>{card.style.opacity='1';card.style.zIndex=String(i+1);card.style.setProperty('--print-scale','1');});
const lens={x:0,y:0,targetX:0,targetY:0,active:false,touch:false};
wall.tabIndex=0;wall.setAttribute('role','group');
function request(){if(visible&&!document.hidden&&!raf)raf=requestAnimationFrame(draw);}
function measure(){const next=clamp((scrollY-origin)/distance);const changed=next!==target;target=next;if(visible)bar.style.transform=`scaleX(${clamp((scrollY-origin)/(distance+endHold))})`;if(target<.72)lens.active=false;if(detailIndex>=0){if(target<.9||stage.getBoundingClientRect().bottom<180)closePrint();else positionPrint();}if(changed||progress!==target)request();}
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
 const anchors=mobile?groups.map((_,g)=>({x:g*(groupW+65),y:[55,0,105,30][g%4]})):[{x:0,y:15},{x:groupW+105,y:135},{x:groupW*2+225,y:0},{x:groupW*1.48+105,y:Math.max(groups[1].height+190,groups[2].height+65)}];
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
  for(let cols=Math.min(2,members.length);cols<=Math.min(7,members.length);cols++){
   const heights=Array.from({length:cols},(_,c)=>.8+noise(c,g+1)*.35),local=[];
   for(const photo of members){const col=heights.indexOf(Math.min(...heights)),width=.88+noise(photo.i,3)*.16,height=width/clamp(photo.ratio,.48,1.8),x=.12+col*1.18+(noise(photo.i,4)-.5)*.10,y=heights[col];local.push({index:photo.i,x,y,w:width,h:height,angle:(noise(photo.i,5)-.5)*9});heights[col]+=height+.18+noise(photo.i,6)*.12;}
   choices.push({local,width:cols*1.18-.18+.24,height:Math.max(...heights)+.12});
  }return choices;
 });
 let best=null;
 // Pack any number of themes in one or two rows, choosing a shared print size.
 function evaluate(groups){
  const gap=.85;
  const pack=(row,startY=0)=>{let x=0;return row.map((group,i)=>{const anchor={x,y:startY+(i%2)*.35};x+=group.width+gap;return anchor;});};
  const layouts=[pack(groups)];
  for(let split=1;split<groups.length;split++){
   const first=groups.slice(0,split),second=groups.slice(split);
   const anchors=pack(first),nextY=Math.max(...first.map((group,i)=>anchors[i].y+group.height))+gap;
   layouts.push([...anchors,...pack(second,nextY)]);
  }
  for(const anchors of layouts){const width=Math.max(...groups.map((g,i)=>anchors[i].x+g.width)),height=Math.max(...groups.map((g,i)=>anchors[i].y+g.height)),scale=Math.min(availableW/width,availableH/height);if(!best||scale>best.scale)best={groups:[...groups],anchors,width,height,scale};}
 }
 function choose(index,groups){if(index===cache.length){evaluate(groups);return;}for(const choice of cache[index])choose(index+1,[...groups,choice]);}
 choose(0,[]);
 const positions=[],heads=[];
 best.groups.forEach((group,g)=>{const anchor=best.anchors[g];heads.push({x:anchor.x,y:anchor.y,w:group.width,group:g});for(const p of group.local)positions[p.index]={...p,x:p.x+anchor.x,y:p.y+anchor.y};});
 return{positions,heads,scale:best.scale,width:best.width*best.scale,height:best.height*best.scale,groupW:best.groups[0].width*best.scale,top,overflow:0,mobile:false};
}
function layout(){
 layoutFrame=0;const w=stage.clientWidth,h=stage.clientHeight;
 origin=wrap.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(stage).top);
 // svh is stable while the mobile address bar expands/collapses.
 distance=h*2.6;endHold=h*.7;wrap.style.height=h+distance+endHold+'px';
 if(w!==stageWidth||h!==stageHeight||!layoutData){stageWidth=w;stageHeight=h;layoutData=makeLayout(w,h);paintedProgress=-1;if(boardCanvas){boardDpr=Math.min(devicePixelRatio||1,1.5);boardCanvas.width=Math.round(w*boardDpr);boardCanvas.height=Math.round(h*boardDpr);}}
 measure();request();
}
function requestLayout(){if(!layoutFrame)layoutFrame=requestAnimationFrame(layout);}
function boardX(w){return layoutData.overflow?w*.05-pan*layoutData.overflow:(w-layoutData.width)/2;}
function focusGroup(i){selectedGroup=i;const w=stage.clientWidth;panTarget=layoutData.overflow?clamp(((layoutData.heads[i].x+layoutData.heads[i].w/2)*layoutData.scale-w*.45)/layoutData.overflow):0;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));if(!layoutData.mobile){lens.targetX=(w-layoutData.width)/2+(layoutData.heads[i].x+layoutData.heads[i].w/2)*layoutData.scale;lens.targetY=layoutData.top+(layoutData.heads[i].y+100)*layoutData.scale;lens.active=true;}request();}
function placeLens(x,y){const r=lensSize/2;const w=stage.clientWidth,h=stage.clientHeight;lens.targetX=clamp(x,12,w-12);lens.targetY=clamp(y,layoutData.top-5,h-65);if(!lens.active){lens.x=lens.targetX;lens.y=lens.targetY;}lens.active=true;request();}
function draw(now){
 raf=0;if(!layoutData)return;const dt=Math.min(.05,Math.max(.001,(now-(lastFrame||now-16))/1000));lastFrame=now;
 progress=(mobileRenderer||reduced.matches)?target:lerp(progress,target,1-Math.exp(-dt*9));if(Math.abs(progress-target)<.0002)progress=target;
 pan=reduced.matches?panTarget:lerp(pan,panTarget,1-Math.exp(-dt*12));if(Math.abs(pan-panTarget)<.0002)pan=panTarget;
 lens.x=reduced.matches?lens.targetX:lerp(lens.x,lens.targetX,1-Math.exp(-dt*22));lens.y=reduced.matches?lens.targetY:lerp(lens.y,lens.targetY,1-Math.exp(-dt*22));
 const w=stageWidth,h=stageHeight,mobile=layoutData.mobile,wallT=smooth(clamp(progress/.62)),tableT=smooth(clamp((progress-.55)/.45));
 const gap=lerp(12,mobile?8:12,wallT),endCellH=Math.min(h*.65/(rows+.25),mobile?110:(w*.91-gap*(columns-1))/columns*16/9),cellW=lerp(Math.max(w/4.2,h*.24),endCellH*9/16,wallT),cellH=cellW*16/9;
 const gridW=cellW*columns+gap*(columns-1),gridH=cellH*rows+gap*(rows-1),cx=w/2,cy=lerp(h*.5,h*.58,wallT),bx=boardX(w);

 if(!mobileRenderer&&baseWidth!==64){baseWidth=64;cards.forEach(({card})=>{card.style.width='64px';card.style.height='113.7778px';});}
 const openingT=smooth(clamp(progress/.32));
 const openingGap=12,openingWidth=(w-(openingColumns-1)*openingGap)/openingColumns,openingHeight=(h-(openingRows-1)*openingGap)/openingRows;
 const geometryChanged=paintedProgress!==progress||paintedPan!==pan;
 if(geometryChanged){
 screenPhotos=[];
 cards.forEach(({card,img},i)=>{const p=layoutData.positions[i],slot=gridSlots[i],col=slot%columns,row=Math.floor(slot/columns);
  let width=lerp(cellW,p.w*layoutData.scale*1.08,tableT),height=lerp(cellH,p.h*layoutData.scale*1.08,tableT);
  let x=lerp(cx-gridW/2+col*(cellW+gap),bx+(p.x-p.w*.04)*layoutData.scale,tableT),y=lerp(cy-gridH/2+row*(cellH+gap)+Math.sin(col*1.8)*h*.1*(1-wallT),layoutData.top+(p.y-p.h*.04)*layoutData.scale,tableT);
  const opacity=i<4?1:smooth(clamp((progress-.035)/.20));
  if(i<4){width=lerp(openingWidth,Math.min(width,openingWidth),openingT);height=lerp(openingHeight,Math.min(height,openingHeight),openingT);x=lerp((i%openingColumns)*(openingWidth+openingGap),x,openingT);y=lerp(Math.floor(i/openingColumns)*(openingHeight+openingGap),y,openingT);}
  if(!mobileRenderer){card.style.opacity=String(opacity);card.style.zIndex=String(i<4&&openingT<1?photos.length+i+1:i+1);}
  // Fixed-size wrappers keep movement composited; only the print's aspect changes during assembly.
  const angle=lerp(0,p.angle,tableT);if(!mobileRenderer){card.style.transform=`translate3d(${x}px,${y}px,0) scale(${width/64}) rotate(${angle}deg)`;const cardHeight=(height*64/width).toFixed(3)+'px';if(cardHeights.get(card)!==cardHeight){card.style.height=cardHeight;cardHeights.set(card,cardHeight);}card.style.setProperty('--turn',(Math.sin(i*5.1)*1.8*(1-tableT)*(i<4?openingT:1))+'deg');}
  screenPhotos.push({x,y,w:width,h:height,img,angle,opacity,turn:Math.sin(i*5.1)*1.8*(1-tableT)*(i<4?openingT:1)});
 });
 if(mobileRenderer)paintBoard();
 screenLabels=layoutData.heads.map((head,i)=>{const x=bx+head.x*layoutData.scale,y=layoutData.top+head.y*layoutData.scale;labels[i].style.transform=`translate(${x}px,${y}px)`;labels[i].style.opacity=tableT;return{x,y,text:photoCategories[i][language()]};});
 shade.style.opacity=1-wallT;stage.style.backgroundColor='#112d4e';stage.style.color='#f9f7f7';heading.style.color='inherit';heading.style.transform='translateY(-50%)';heading.style.fontSize=lerp(Math.min(mobile?w*.19:w*.11,175),mobile?42:56,wallT)+'px';heading.style.top=lerp(mobile?43:50,14,wallT)+'%';
 // One shared filter, outside the separate colour magnifier canvas.
 wall.style.filter=mobileRenderer?'none':`grayscale(${tableT}) brightness(${1-tableT*.46})`;
 paintedProgress=progress;paintedPan=pan;
 }
 bar.style.transform=`scaleX(${clamp((scrollY-origin)/(distance+endHold))})`;stage.dataset.progress=progress.toFixed(3);stage.dataset.table=tableT.toFixed(3);wall.dataset.pan=pan.toFixed(3);stage.classList.toggle('is-photo-table',tableT>.6);
 panControl.hidden=!(mobile&&progress>.78&&layoutData.overflow>0);panControl.value=pan;nav.classList.toggle('is-ready',progress>.78);
 const newSize=mobile?168:244;if(lensSize!==newSize||dpr!==Math.min(devicePixelRatio||1,2)){lensSize=newSize;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(lensSize*dpr);canvas.height=Math.round(lensSize*dpr);glass.style.width=glass.style.height=lensSize+'px';}
 inspect.hidden=!(mobileRenderer&&progress>.92);themeHint.hidden=inspect.hidden;const showLens=!mobileRenderer&&lens.active&&progress>.78&&visible;glass.classList.toggle('is-active',showLens);document.body.classList.toggle('is-photo-magnifying',showLens);const displayX=lens.touch?clamp(lens.x,lensSize/2+8,w-lensSize/2-8):lens.x,displayY=lens.touch?clamp(lens.y,lensSize/2+8,h-lensSize/2-55):lens.y;glass.style.transform=`translate3d(${displayX-lensSize/2}px,${displayY-lensSize/2}px,0)`;
 if(showLens)paintLens();
 if(visible&&(progress!==target||pan!==panTarget||Math.abs(lens.x-lens.targetX)>.15||Math.abs(lens.y-lens.targetY)>.15))request();
}
function paintBoard(){
 const context=boardContext;if(!context)return;
 context.setTransform(boardDpr,0,0,boardDpr,0,0);
 context.clearRect(0,0,stageWidth,stageHeight);
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='low';
 for(const photo of screenPhotos){
  const {x,y,w,h,img}=photo,pad=Math.max(w,h)*.2;
  if(photo.opacity<=0||x-pad>stageWidth||y-pad>stageHeight||x+w+pad<0||y+h+pad<0||!img.complete||!img.naturalWidth)continue;
  context.save();context.globalAlpha=photo.opacity;context.translate(x,y);context.rotate((photo.angle+photo.turn)*Math.PI/180);
  const border=1.5*w/64;
  context.fillStyle='#f9f7f7';context.fillRect(-border,-border,w+border*2,h+border*2);
  const fit=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/fit,sh=h/fit;
  context.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,0,0,w,h);
  context.restore();
 }
}
function paintLens(){
 const r=lensSize/2,zoom=2.82;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#112d4e';ctx.fillRect(0,0,lensSize,lensSize);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=layoutData.mobile?'low':'high';
 for(const photo of screenPhotos){const x=r+(photo.x-lens.x)*zoom,y=r+(photo.y-lens.y)*zoom,w=photo.w*zoom,h=photo.h*zoom,pad=Math.max(w,h)*.16;if(x-pad>lensSize||y-pad>lensSize||x+w+pad<0||y+h+pad<0||!photo.img.complete||!photo.img.naturalWidth)continue;ctx.save();ctx.translate(x,y);ctx.rotate(photo.angle*Math.PI/180);ctx.fillStyle='#f9f7f7';const border=1.5*zoom;ctx.fillRect(-border,-border,w+2*border,h+2*border);const fit=Math.max(w/photo.img.naturalWidth,h/photo.img.naturalHeight),sw=w/fit,sh=h/fit;ctx.drawImage(photo.img,(photo.img.naturalWidth-sw)/2,(photo.img.naturalHeight-sh)/2,sw,sh,0,0,w,h);ctx.restore();}
 ctx.fillStyle='#f9f7f7';ctx.font='400 '+((layoutData.mobile?18:21)*zoom)+'px "Misto", sans-serif';for(const label of screenLabels){const x=r+(label.x-lens.x)*zoom,y=r+(label.y+18-lens.y)*zoom;if(y>-10&&y<lensSize+30)ctx.fillText(label.text,x,y);}
}
function pointerPosition(event){const bounds=stage.getBoundingClientRect();return{x:event.clientX-bounds.left,y:event.clientY-bounds.top};}
on(wall,'pointerdown',event=>{
 if(progress<.78||event.button!==0)return;
 if(mobileRenderer){if(progress<.92||detailIndex>=0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,active:false,group:selectedGroup,pan:panTarget};return;}
 lens.touch=event.pointerType==='touch';
 const p=pointerPosition(event);placeLens(p.x,p.y);
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,active:false};
});
on(wall,'pointermove',event=>{
 if(progress<.78)return;
 if(mobileRenderer){
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.active&&Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}
  if(!drag.active&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.2){drag.active=true;wall.setPointerCapture(event.pointerId);wall.classList.add('is-dragging');}
  if(drag.active){panTarget=layoutData.overflow?clamp(drag.pan-dx/layoutData.overflow):0;request();}
  return;
 }
 if(drag&&drag.id===event.pointerId){
  const dx=Math.abs(event.clientX-drag.x),dy=Math.abs(event.clientY-drag.y);
  if(!drag.active&&dy>8&&dy>dx){drag=null;if(event.pointerType==='touch'){lens.active=false;request();}return;}
  if(!drag.active&&dx>8&&dx>dy){drag.active=true;wall.setPointerCapture(event.pointerId);}
 }else if(event.pointerType==='touch')return;
 const p=pointerPosition(event);
 if(p.y<layoutData.top-10||p.y>stageHeight-65){if(!lens.touch){lens.active=false;request();}return;}
 placeLens(p.x,p.y);
});
function release(event){
 if(mobileRenderer&&drag?.id===event.pointerId&&drag.active){
  const dx=event.clientX-drag.x;
  const next=event.type==='pointerup'&&Math.abs(dx)>40?clamp(drag.group+(dx<0?1:-1),0,photoCategories.length-1):drag.group;
  focusGroup(next);drag=null;wall.classList.remove('is-dragging');return;
 }
 if(mobileRenderer&&event.type==='pointerup'&&drag?.id===event.pointerId&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<10&&progress>.92){
  const point=pointerPosition(event);let nearest=-1,distance=Infinity;
  screenPhotos.forEach((photo,i)=>{const dx=Math.max(photo.x-point.x,0,point.x-photo.x-photo.w),dy=Math.max(photo.y-point.y,0,point.y-photo.y-photo.h),d=Math.hypot(dx,dy);if(d<distance){distance=d;nearest=i;}});
  if(nearest>=0&&distance<22)openPrint(nearest,true);
 }
 if(event.type==='lostpointercapture'&&event.target!==wall)return;drag=null;if(event.type==='pointercancel'){lens.active=false;request();}}
for(const event of ['pointerup','pointercancel','lostpointercapture'])on(wall,event,release);
on(wall,'pointerleave',()=>{if(!lens.touch){lens.active=false;request();}});
on(wall,'keydown',e=>{const moves={ArrowLeft:[-28,0],ArrowRight:[28,0],ArrowUp:[0,-28],ArrowDown:[0,28]};if(progress<.78)return;if(mobileRenderer){if(progress<.92)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect.click();}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();focusGroup(clamp(selectedGroup+(e.key==='ArrowRight'?1:-1),0,photoCategories.length-1));}return;}if(moves[e.key]){e.preventDefault();placeLens((lens.active?lens.targetX:stage.clientWidth/2)+moves[e.key][0],(lens.active?lens.targetY:layoutData.top+120)+moves[e.key][1]);}if(e.key==='Escape'){lens.active=false;request();}});
on(panControl,'input',()=>{panTarget=Number(panControl.value);const center=panTarget*layoutData.overflow+stage.clientWidth*.45;selectedGroup=layoutData.heads.reduce((best,head,i)=>Math.abs((head.x+head.w/2)*layoutData.scale-center)<Math.abs((layoutData.heads[best].x+layoutData.heads[best].w/2)*layoutData.scale-center)?i:best,0);buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selectedGroup)));request();});
function translate(){const c=copy[language()];
const english=language()==='en';inspect.textContent=english?'Explore the photographs':'Bekijk de foto’s';detail.setAttribute('aria-label',english?'Photograph detail':'Foto bekijken');detailClose.setAttribute('aria-label',english?'Back to the wall':'Terug naar de wand');detail.querySelector('[data-step="-1"]').setAttribute('aria-label',english?'Previous photograph':'Vorige foto');detail.querySelector('[data-step="1"]').setAttribute('aria-label',english?'Next photograph':'Volgende foto');themeHint.textContent=english?'Swipe between collections':'Swipe tussen thema’s';if(detailIndex>=0)renderPrint(detailIndex);
boardCanvas?.setAttribute('aria-label',mobileRenderer?c.touchGuide:c.wall);paintedProgress=-1;labels.forEach((label,i)=>label.textContent=photoCategories[i][language()]);document.querySelectorAll('[data-memory-ui]').forEach(el=>{if(c[el.dataset.memoryUi])el.textContent=c[el.dataset.memoryUi];});wall.setAttribute('aria-label',mobileRenderer?(english?'Photo table. Tap a photograph or press Enter to open it.':'Fototafel. Tik op een foto of druk op Enter om deze te openen.'):c.wall);panControl.setAttribute('aria-label',c.pan);nav.setAttribute('aria-label',c.categories);buttons.forEach((b,i)=>{b.textContent=photoCategories[i][language()];b.setAttribute('aria-pressed',String(i===selectedGroup));});cards.forEach(({img},i)=>img.alt=(language()==='en'?'Personal photograph ':'Persoonlijke foto ')+(i+1));request();}
const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stage.classList.toggle('is-wall-visible',visible);if(!visible){cancelAnimationFrame(raf);raf=0;lastFrame=0;lens.active=false;glass.classList.remove('is-active');document.body.classList.remove('is-photo-magnifying');}else{lastFrame=0;measure();request();}});visibilityObserver.observe(stage);
on(window,'scroll',measure,{passive:true});const sizeObserver=new ResizeObserver(requestLayout);sizeObserver.observe(stage);on(window,'load',requestLayout);on(reduced,'change',()=>{if(reduced.matches){cancelPrintMotion();if(closingPrint)finishClose(false);else if(requestedIndex>=0)renderPrint(requestedIndex);}measure();request();});on(document,'languageChanged',translate);translate();layout();

on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{lastFrame=0;measure();request();}});
cards.forEach(({img})=>on(img,'load',()=>{if(mobileRenderer){paintedProgress=-1;request();}else if(lens.active)request();}));

signal.addEventListener('abort',()=>{cancelPrintMotion();stage.classList.remove('is-print-open');cancelAnimationFrame(raf);cancelAnimationFrame(layoutFrame);visibilityObserver.disconnect();sizeObserver.disconnect();document.body.classList.remove('is-photo-magnifying');},{once:true});
}
