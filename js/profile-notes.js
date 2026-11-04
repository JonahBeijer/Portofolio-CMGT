// Hobby selection changes the pair; hovering the prints changes their front/back order.
const buttons=[...document.querySelectorAll('[data-hobby]')];
const stack=document.querySelector('.offline-photos'),frontPrint=stack?.querySelector('.offline-front'),backPrint=stack?.querySelector('.offline-back'),front=frontPrint?.querySelector('img'),back=backPrint?.querySelector('img');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const images={anime:['img/animecollection.png','img/wall-photos/IMG_8892.webp'],games:['img/game.png','img/meerkatgaming.png'],raves:['img/wall-photos/IMG_7313.webp','img/wall-photos/IMG_7314.webp'],friends:['img/memory-example-friends.webp','img/memory-example-street.webp'],travel:['img/journal-portrait-city.webp','img/wall-photos/IMG_1659.webp'],car:['img/wall-photos/IMG_8892.webp','img/memory-example-street.webp'],concerts:['img/journal-portrait-concert.webp','img/wall-photos/IMG_0602.webp']};
let selected='travel',swapped=false,swapAnimations=[];
if(stack){stack.tabIndex=0;stack.setAttribute('role','button');stack.setAttribute('aria-pressed','false');stack.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSwapped(!swapped);}});}
function makeSwapAnimations(){swapAnimations.forEach(animation=>animation.cancel());swapAnimations=[];if(!frontPrint||reduced.matches||!Element.prototype.animate)return;
 const narrow=innerWidth<768,frontReach=narrow?'18%':'26%',backReach=narrow?'-16%':'-27%';
 const timing={duration:850,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'};
 swapAnimations=[frontPrint.animate([
  {transform:'translate(0,0) rotate(7deg)',zIndex:2},
  {offset:.44,transform:`translate(${frontReach},-8%) rotate(13deg)`,zIndex:2},
  {offset:.5,transform:`translate(${frontReach},-10%) rotate(11deg)`,zIndex:1},
  {transform:'translate(-32%,-15%) rotate(-9deg)',zIndex:1}
 ],timing),backPrint.animate([
  {transform:'translate(0,0) rotate(-9deg)',zIndex:1},
  {offset:.44,transform:`translate(${backReach},-10%) rotate(-16deg)`,zIndex:1},
  {offset:.5,transform:`translate(${backReach},-8%) rotate(-13deg)`,zIndex:2},
  {transform:'translate(37%,16%) rotate(7deg)',zIndex:2}
 ],timing)];
 swapAnimations.forEach(animation=>{animation.pause();animation.currentTime=swapped?850:0;});
}
function setSwapped(value){if(!stack||value===swapped)return;swapped=value;stack.classList.toggle('is-swapped',swapped);stack.setAttribute('aria-pressed',String(swapped));swapAnimations.forEach(animation=>{animation.playbackRate=swapped?1:-1;animation.play();});}
const isMoving=()=>swapAnimations.some(animation=>animation.playState==='running');
function describe(){const en=document.documentElement.lang==='en',own=selected==='anime'||selected==='games';if(front){front.alt=own?(en?'One of my projects':'Een van mijn projecten'):(en?'Example photograph for this hobby':'Voorbeeldfoto bij deze hobby');back.alt=en?'Accompanying example image':'Bijpassend voorbeeldbeeld';stack.setAttribute('aria-label',en?'Show the other photograph':'Toon de andere foto');}}
function activate(button){if(!front||!button)return;const changed=selected!==button.dataset.hobby;selected=button.dataset.hobby;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));front.src=images[selected][0];back.src=images[selected][1];setSwapped(false);describe();if(changed&&!reduced.matches){for(const img of [front,back])img.animate([{opacity:.35},{opacity:1}],{duration:300,easing:'ease-out'});}}
buttons.forEach(button=>{button.addEventListener('click',()=>activate(button));button.addEventListener('focus',()=>activate(button));button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')activate(button);});});
if(front){makeSwapAnimations();activate(buttons.find(button=>button.dataset.hobby===selected));
 backPrint.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!isMoving())setSwapped(true);});
 frontPrint.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!isMoving())setSwapped(false);});
 for(const print of [frontPrint,backPrint])print.addEventListener('click',()=>setSwapped(!swapped));
 stack.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')setSwapped(false);});reduced.addEventListener('change',makeSwapAnimations);
}
// Each work/study card owns one print. Mouse hover, keyboard focus and tap use the same state.
const careers=[...document.querySelectorAll('.career-reveal')];
const careerNames={ah:'Albert Heijn',stena:'Stena Line',digiwedo:'DIGIWEDO',study:'Hogeschool Rotterdam'};
const careerDescriptions={nl:{ah:'Foto bij mijn werk bij Albert Heijn',stena:'Foto tijdens mijn werk bij Stena Line',digiwedo:'Teamfoto bij DIGIWEDO',study:'Foto bij mijn opleiding aan Hogeschool Rotterdam'},en:{ah:'Photo from my work at Albert Heijn',stena:'Photo from my work at Stena Line',digiwedo:'Team photograph at DIGIWEDO',study:'Photo from my studies at Rotterdam University of Applied Sciences'}};
const states=new Map();
function displayCareer(card){const state=states.get(card),open=state.hover||state.focus||state.pinned;card.classList.toggle('is-photo-visible',open);card.querySelector('.career-trigger').setAttribute('aria-expanded',String(open));card.querySelector('.career-photo').setAttribute('aria-hidden',String(!open));}
function closeOtherCareers(active){for(const card of careers){if(card===active)continue;const state=states.get(card);state.pinned=false;displayCareer(card);}}
for(const card of careers){const trigger=card.querySelector('.career-trigger');const state={hover:false,focus:false,pinned:false,pointerType:null};states.set(card,state);
 card.addEventListener('pointerenter',event=>{if(event.pointerType!=='mouse')return;closeOtherCareers(card);state.hover=true;displayCareer(card);});
 card.addEventListener('pointerleave',event=>{if(event.pointerType!=='mouse')return;state.hover=false;displayCareer(card);});
 trigger.addEventListener('pointerdown',event=>{state.pointerType=event.pointerType;});
 trigger.addEventListener('focus',()=>{if(trigger.matches(':focus-visible')){closeOtherCareers(card);state.focus=true;displayCareer(card);}});
 trigger.addEventListener('blur',()=>{state.focus=false;state.pinned=false;displayCareer(card);});
 trigger.addEventListener('click',()=>{closeOtherCareers(card);state.pinned=!state.pinned;displayCareer(card);});
}
function translateCareers(){const en=document.documentElement.lang==='en';for(const card of careers){const key=card.dataset.career;card.querySelector('.career-trigger').setAttribute('aria-label',(en?'Show a photograph for ':'Toon foto bij ')+careerNames[key]);card.querySelector('.career-photo img').alt=careerDescriptions[en?'en':'nl'][key];}}
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.career-reveal'))closeOtherCareers(null);});
document.addEventListener('keydown',event=>{if(event.key==='Escape')for(const card of careers){Object.assign(states.get(card),{hover:false,focus:false,pinned:false});displayCareer(card);}});
function translate(){describe();translateCareers();}document.addEventListener('languageChanged',translate);translate();
