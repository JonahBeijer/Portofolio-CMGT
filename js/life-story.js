import { destinations, concerts } from './memories-data.js';
import { translations } from '../language.js';
const stage=document.querySelector('.life-desk'),scenes=[...document.querySelectorAll('[data-journey-scene]')],nav=[...document.querySelectorAll('[data-journey-nav]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const words={
  "nl": {
    "example": "VOORBEELDFOTO",
    "career": "OPLEIDING & BANEN",
    "interact": "ANIME · GAMES · CONCERTEN · MIJN AUTO",
    "travelTitle": "Even<br><em>ergens anders.</em>",
    "travelCopy": "Ik ga graag naar verschillende landen en steden, het liefst samen met mijn vriendin. Hier wil ik mijn eigen foto’s en plekken verzamelen.",
    "musicTitle": "Concerten.<br><em>En raves.</em>",
    "routeTitle": "Waar ik<br><em>werk.</em>",
    "nextFuture": "Wat ik nog wil maken ↓",
    "navintro": "Hoi",
    "navabout": "Over mij",
    "navtravel": "Reizen",
    "navmusic": "Muziek",
    "navroute": "Banen",
    "navfuture": "Plannen",
    "navwork": "Projecten",
    "meet": "Over mij ↓",
    "nextTravel": "Reizen ↓",
    "travelLabel": "REIZEN MET MIJN VRIENDIN",
    "sample": "Dit zijn nog voorbeeldfoto’s en plekken. Eigen foto’s volgen.",
    "nextMusic": "Muziek ↓",
    "musicLabel": "CONCERTEN & RAVES",
    "nextRoute": "Mijn banen ↓",
    "nextWork": "Mijn projecten ↗",
    "contact": "Mail me ↗",
    "concert": "Concert",
    "country": "Land"
  },
  "en": {
    "example": "EXAMPLE PHOTO",
    "career": "EDUCATION & JOBS",
    "interact": "ANIME · GAMES · CONCERTS · MY CAR",
    "travelTitle": "Somewhere<br><em>else.</em>",
    "travelCopy": "I like visiting different countries and cities, preferably with my girlfriend. This is where I want to collect my own photos and places.",
    "musicTitle": "Concerts.<br><em>And raves.</em>",
    "routeTitle": "Where<br><em>I work.</em>",
    "nextFuture": "What I want to build next ↓",
    "navintro": "Hi",
    "navabout": "About me",
    "navtravel": "Travel",
    "navmusic": "Music",
    "navroute": "Jobs",
    "navfuture": "Plans",
    "navwork": "Projects",
    "meet": "About me ↓",
    "nextTravel": "Travel ↓",
    "travelLabel": "TRAVELLING WITH MY GIRLFRIEND",
    "sample": "These are still example photos and places. My own photos will follow.",
    "nextMusic": "Music ↓",
    "musicLabel": "CONCERTS & RAVES",
    "nextRoute": "My jobs ↓",
    "nextWork": "My projects ↗",
    "contact": "Email me ↗",
    "concert": "Concert",
    "country": "Country"
  }
};
const objects=['person','city','concert','career','vinyl'].map(key=>stage.querySelector('.life-'+key));
// Each object follows one continuous path through the whole story, rather than appearing per section.
const poses=[
 [[0,0,-5,1,1],[-4,-1,3,1,1],[-29,-25,-13,.48,.5],[-29,-25,-14,.42,.45],[-30,-28,-12,.39,.35],[29,-25,9,.43,.45],[30,-27,13,.4,.25]],
 [[-31,24,-15,.5,.75],[28,25,10,.57,.85],[0,0,-6,1,1],[-31,-23,-14,.46,.5],[-30,28,-12,.4,.35],[-30,24,-14,.43,.5],[-28,23,-12,.4,.35]],
 [[30,22,12,.5,.8],[28,-27,13,.48,.5],[29,26,12,.56,.8],[0,0,5,1,1],[30,27,13,.42,.45],[27,23,8,.47,.65],[28,27,10,.38,.3]],
 [[0,26,8,.35,0],[0,28,9,.35,.08],[28,-29,15,.32,.12],[-27,27,-12,.36,.2],[0,0,-4,1,1],[-4,12,2,.75,.65],[-26,-25,-9,.38,.3]],
 [[0,0,-30,.3,0],[0,0,-30,.3,0],[0,0,-30,.3,0],[20,-15,-20,.3,0],[20,-15,-20,.4,.05],[0,0,-12,.8,1],[0,0,0,1,1]]
];
const colours=[[243,239,230],[229,230,219],[221,227,211],[224,211,191],[227,222,208],[225,216,198],[219,185,155]];
let current=0,target=0,active=-1,frame=0,job=0,trip=0,show=0,hoverX=0,hoverY=0,drag=null,suppressClick=false;
const offsets=objects.map(()=>({x:0,y:0}));
const language=()=>document.documentElement.lang==='en'?'en':'nl';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function go(key){scenes.find(e=>e.dataset.journeyScene===key)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}
function memoryMode(){return active===3?'concerts':'destinations';}
function memoryEntries(){return memoryMode()==='concerts'?concerts:destinations;}
function memoryTitle(entry,index){return memoryMode()==='concerts'?(entry.artist||words[language()].concert+' '+String(index+1).padStart(2,'0'))+' — '+entry.city:entry.title;}
function renderMemories(){
 const select=stage.querySelector('select'),entries=memoryEntries(),index=memoryMode()==='concerts'?show:trip;
 select.replaceChildren(...entries.map((entry,i)=>{const option=document.createElement('option');option.value=i;option.textContent=memoryTitle(entry,i);return option;}));select.value=String(index);
 const city=stage.querySelector('.life-city');city.querySelector('img').src=destinations[trip].image;city.querySelector('.life-photo-title').textContent=destinations[trip].title+' ↗';
 const concert=stage.querySelector('.life-concert');concert.querySelector('img').src=concerts[show].image;concert.querySelector('.life-photo-title').textContent=(concerts[show].artist||words[language()].concert+' '+String(show+1).padStart(2,'0'))+' / '+concerts[show].city+' ↗';
 stage.querySelector('.life-memory-count').textContent=String(index+1).padStart(2,'0')+' / '+entries.length;
 const captions=document.querySelectorAll('.journey-selected-location');captions.forEach((el,i)=>el.textContent=(i===0?destinations[trip].title:concerts[show].city)+' ↗');
}
function setJob(index){
 job=(index+4)%4;
 const t=translations[language()],labels=[t.educationText,t.work1,t.work2,t.work3];
 stage.querySelectorAll('[data-job]').forEach((el,i)=>{const distance=i-job;el.style.transform=`translate(${distance*14}px,${distance*13}px) rotate(${distance*4}deg)`;el.style.zIndex=String(10-Math.abs(distance));el.setAttribute('aria-pressed',String(i===job));});
 stage.querySelector('.life-job-current').textContent=String(job+1).padStart(2,'0')+' / 04';
 document.querySelector('.life-role-summary').textContent=labels[job];
 document.querySelectorAll('[data-job-jump]').forEach((e,i)=>e.setAttribute('aria-pressed',String(i===job)));
 stage.querySelector('.job-1 .life-job-role').textContent=language()==='en'?'Shelf stocker':'Vakkenvuller';stage.querySelector('.job-2 .life-job-role').textContent=language()==='en'?'Lashing worker':'Sjorder';
 stage.querySelector('.job-2 .life-job-period').textContent=language()==='en'?'2022 — PRESENT':'2022 — HEDEN';stage.querySelector('.job-3 .life-job-period').textContent=language()==='en'?'2026 — PRESENT':'2026 — HEDEN';
}
function translate(){
 const t=words[language()];document.querySelectorAll('[data-life-text]').forEach(el=>el.innerHTML=t[el.dataset.lifeText]);document.querySelectorAll('[data-journey-text]').forEach(el=>{if(t[el.dataset.journeyText])el.innerHTML=t[el.dataset.journeyText];});renderMemories();setJob(job);
 if(active>=0)stage.querySelector('.life-stage-title').textContent=t['nav'+scenes[active].dataset.journeyScene];
}
function measure(){
 const line=innerWidth<768?innerHeight*.74:innerHeight*.5;
 const centers=scenes.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2-line;});
 if(centers[0]>=0)target=0;else if(centers.at(-1)<=0)target=scenes.length-1;else {for(let i=0;i<centers.length-1;i++)if(centers[i]<=0&&centers[i+1]>0){target=i+(-centers[i])/(centers[i+1]-centers[i]);break;}}
 request();
}
function request(){if(!frame)frame=requestAnimationFrame(draw);}
function draw(){
 frame=0;let relaxing=false;current=reduced.matches?target:current+(target-current)*.16;if(Math.abs(target-current)<.001)current=target;
 const i=Math.min(5,Math.floor(current)),amount=current-i,ease=amount*amount*(3-2*amount),width=stage.clientWidth,height=stage.clientHeight;
 objects.forEach((el,k)=>{if(!drag||drag.index!==k){for(const axis of ['x','y']){offsets[k][axis]=reduced.matches?0:offsets[k][axis]*.78;if(Math.abs(offsets[k][axis])<.15)offsets[k][axis]=0;else relaxing=true;}}const a=poses[k][i],b=poses[k][i+1],v=a.map((n,j)=>n+(b[j]-n)*ease),offset=offsets[k];
 el.style.transform=`translate(-50%,-50%) translate(${v[0]/100*width+offset.x+hoverX*(k+1)/4}px,${v[1]/100*height+offset.y+hoverY*(k+1)/4}px) rotate(${v[2]}deg) scale(${v[3]})`;
 el.style.opacity=v[4];el.style.zIndex=String(Math.round(v[3]*30));el.inert=v[4]<.35;});
 const color=colours[i].map((n,j)=>Math.round(n+(colours[i+1][j]-n)*ease));document.body.style.setProperty('--life-bg',`rgb(${color.join(',')})`);
 const next=Math.round(current);if(next!==active){active=next;document.body.dataset.life=scenes[active].dataset.journeyScene;stage.querySelector('.life-stage-count').textContent=String(active+1).padStart(2,'0')+' / 07';stage.querySelector('.life-stage-title').textContent=words[language()]['nav'+scenes[active].dataset.journeyScene];nav.forEach((a,n)=>n===active?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current'));renderMemories();stage.querySelector('.life-memory-controls').inert=active!==2&&active!==3;}
 stage.style.setProperty('--life-progress',current/6);stage.querySelector('.life-thread path').style.strokeDashoffset=String(2100*(1-current/6));
 if(current!==target||relaxing)request();
}
for(const el of stage.querySelectorAll('[data-life-go]')){
 const key=el.dataset.lifeGo;
 el.addEventListener('click',()=>{if(suppressClick)return;if((key==='travel'&&active===2)||(key==='music'&&active===3))openMemory();else go(key);});
 el.addEventListener('dragstart',e=>e.preventDefault());
 el.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={index:objects.indexOf(el),el,x:e.clientX,y:e.clientY,moved:false};});
 el.addEventListener('pointermove',e=>{if(!drag||drag.el!==el)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.abs(dx)>8){drag.moved=true;el.setPointerCapture(e.pointerId);}if(drag.moved){offsets[drag.index]={x:clamp(dx,-90,90),y:clamp(dy,-80,80)};request();}});
 function release(){if(!drag||drag.el!==el)return;if(drag.moved){suppressClick=true;request();setTimeout(()=>suppressClick=false,200);}drag=null;}
 for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);
}
const dialog=document.querySelector('.life-memory-dialog');
function openMemory(){const entries=memoryEntries(),index=memoryMode()==='concerts'?show:trip,entry=entries[index];dialog.querySelector('img').src=entry.image;dialog.querySelector('img').alt=memoryTitle(entry,index);dialog.querySelector('h3').textContent=memoryTitle(entry,index);dialog.querySelector('p').textContent=(language()==='en'?(entry.noteEn||entry.note):entry.note);dialog.showModal();document.body.classList.add('modal-open');}
dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
stage.querySelector('select').addEventListener('change',e=>{if(memoryMode()==='concerts')show=Number(e.target.value);else trip=Number(e.target.value);renderMemories();});
stage.querySelectorAll('[data-memory-step]').forEach(button=>button.addEventListener('click',()=>{const count=memoryEntries().length,delta=Number(button.dataset.memoryStep);if(memoryMode()==='concerts')show=(show+delta+count)%count;else trip=(trip+delta+count)%count;renderMemories();}));
stage.querySelector('[data-job-prev]').addEventListener('click',()=>setJob(job-1));stage.querySelector('[data-job-next]').addEventListener('click',()=>setJob(job+1));stage.querySelectorAll('[data-job]').forEach(el=>el.addEventListener('click',()=>setJob(Number(el.dataset.job))));document.querySelectorAll('[data-job-jump]').forEach(el=>el.addEventListener('click',()=>setJob(Number(el.dataset.jobJump))));
stage.addEventListener('pointermove',e=>{if(reduced.matches||drag)return;const r=stage.getBoundingClientRect();hoverX=((e.clientX-r.left)/r.width-.5)*8;hoverY=((e.clientY-r.top)/r.height-.5)*6;request();});stage.addEventListener('pointerleave',()=>{hoverX=hoverY=0;request();});
window.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);window.addEventListener('load',measure);document.addEventListener('languageChanged',translate);translate();measure();
