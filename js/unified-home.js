const scenes=[...document.querySelectorAll('[data-journey-scene]')];
const stage=document.querySelector('.unified-stage');
const nav=[...document.querySelectorAll('[data-journey-nav]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const copy={
 nl:{meet:'Ontmoet de persoon achter de code ↓',nextTravel:'Van achter het scherm naar de wereld ↓',travelLabel:'REIZEN / NIEUWE PERSPECTIEVEN',travelTitle:'Elke plek<br>een <em>ander verhaal.</em>',travelCopy:'Een andere stad inlopen zonder alles al te weten. Rondkijken, nieuwe dingen proberen en herinneringen meenemen. Kies een plek op mijn wereldbol en reis even mee.',sample:'10 voorbeeldbestemmingen en 10 voorbeeldconcerten. Straks met mijn eigen foto’s en verhalen.',nextMusic:'Van nieuwe plekken naar live muziek ↓',musicLabel:'LIVE MUZIEK / EVEN HELEMAAL ERGENS ANDERS',musicTitle:'Het volume omhoog.<br><em>De wereld even uit.</em>',nextRoute:'En tussendoor blijf ik bouwen ↓',nextWork:'Van ideeën naar echte projecten ↓',contact:'Iets samen maken? Stuur me een bericht ↗',navintro:'Welkom',navabout:'Over mij',navtravel:'Reizen',navmusic:'Live',navroute:'Mijn route',navfuture:'Straks',navwork:'Projecten'},
 en:{meet:'Meet the person behind the code ↓',nextTravel:'From behind the screen to the world ↓',travelLabel:'TRAVEL / NEW PERSPECTIVES',travelTitle:'Every place.<br><em>A different story.</em>',travelCopy:'Walking into another city without knowing everything in advance. Looking around, trying something new and bringing memories home. Pick a place on my globe and come along.',sample:'10 example destinations and 10 example concerts. Soon with my own photos and stories.',nextMusic:'From new places to live music ↓',musicLabel:'LIVE MUSIC / SOMEWHERE ELSE FOR A MOMENT',musicTitle:'Turn the volume up.<br><em>Tune the world out.</em>',nextRoute:'And in between, I keep building ↓',nextWork:'From ideas to real projects ↓',contact:'Make something together? Send me a message ↗',navintro:'Welcome',navabout:'About me',navtravel:'Travel',navmusic:'Live',navroute:'My journey',navfuture:'Next',navwork:'Projects'}
};
let active='',pending=false,lastMemory='';
const language=()=>document.documentElement.lang==='en'?'en':'nl';
function translate(){const t=copy[language()];document.querySelectorAll('[data-journey-text]').forEach(el=>el.innerHTML=t[el.dataset.journeyText]);updateStageLabel();}
function updateStageLabel(){const t=copy[language()];stage.querySelector('.journey-stage-label').textContent=(active==='travel'||active==='music')&&lastMemory?lastMemory:(t['nav'+active]||t.navintro).toUpperCase();}
function activate(scene){
 const key=scene.dataset.journeyScene;
 if(key===active)return;
 active=key;document.body.dataset.journey=key;
 stage.querySelector('.journey-stage-number').textContent=String(scenes.indexOf(scene)+1).padStart(2,'0')+' / 07';
 nav.forEach(a=>{if(a.dataset.journeyNav===key)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 const showMap=key==='travel'||key==='music';
 stage.querySelector('.atlas-world').inert=!showMap;
 stage.querySelector('.atlas-memories').inert=!showMap;
 stage.querySelector('.atlas-mode-switch').inert=!showMap;
 stage.querySelector('.memory-wall').inert=key!=='intro';
 if(showMap)document.dispatchEvent(new CustomEvent('atlas:navigate',{detail:{mode:key==='travel'?'destinations':'concerts'}}));
 updateStageLabel();
}
function update(){
 pending=false;const line=innerWidth<768?Math.min(innerHeight-90,innerHeight*.76):innerHeight*.48;
 let current=scenes[0];
 for(const scene of scenes){if(scene.getBoundingClientRect().top<=line)current=scene;}
 activate(current);
 const rect=current.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(line-rect.top)/Math.max(1,rect.height)));
 stage.style.setProperty('--chapter-progress',progress);
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(update);}
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('load',schedule);
document.addEventListener('languageChanged',translate);
function go(key){const scene=scenes.find(s=>s.dataset.journeyScene===key);scene?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}
for(const photo of document.querySelectorAll('[data-journey-go]'))photo.addEventListener('click',()=>go(photo.dataset.journeyGo));
stage.querySelectorAll('[data-atlas-mode]').forEach(button=>button.addEventListener('click',()=>go(button.dataset.atlasMode==='concerts'?'music':'travel')));
document.addEventListener('atlas:selection',event=>{
 lastMemory=event.detail.title;
 document.querySelectorAll('.journey-selected-location').forEach(el=>el.textContent=event.detail.title+' ↗');
 updateStageLabel();
 if(!reduced.matches&&['travel','music'].includes(active))stage.querySelector('.atlas-selected').animate([{opacity:.55,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'ease-out'});
});
translate();update();
