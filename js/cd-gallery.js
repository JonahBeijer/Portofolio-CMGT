import { playCDTransition } from './cd-transition.js?v=20261103-covers1';
import { projectsData } from './projects-data.js';
import { translations } from '../language.js';

const collection = document.querySelector('.cd-collection');
const stage = document.querySelector('.cd-stage');
const albums = [...document.querySelectorAll('.cd-album')];
const projects = [...projectsData];
const previous = document.querySelector('[data-cd-prev]');
const next = document.querySelector('[data-cd-next]');
const indexes = [...document.querySelectorAll('[data-cd-index]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
// Measured reference curves: 450ms shelf selection and 500ms case turning.
const referenceCurve=fn=>'linear('+Array.from({length:61},(_,i)=>fn(i/60).toFixed(7)).join(',')+')';
collection.style.setProperty('--cd-reference-shelf',referenceCurve(t=>t*t*t*(10-15*t+6*t*t)));
collection.style.setProperty('--cd-reference-turn',referenceCurve(t=>t*t*(3-2*t)));
let selected = 0, rotation = 0, gesture, suppressClick = false, lastWheel = 0, opening = false;
let selectionTarget=0, selectionTimer=0, peekTimer=0;
function retractDiscs(){clearTimeout(peekTimer);albums.forEach(album=>album.classList.remove('is-disc-peeking'));}
function queuePeek(){clearTimeout(peekTimer);if(reduced.matches)return;peekTimer=setTimeout(()=>{if(!opening&&!gesture&&rotation%360===0)albums[selected].classList.add('is-disc-peeking');},560); }
reduced.addEventListener('change',()=>reduced.matches?retractDiscs():queuePeek());
const labels = {
    nl: { collection: 'De projectcollectie', instruction: 'Klik om te kiezen. Open het middelste hoesje om het project te bekijken.', gesture: 'Sleep een hoesje om het te draaien', open: 'Bekijk project', prev: 'Vorig project', next: 'Volgend project', flip: 'Draai hoesje', catalogue: 'ALLE PROJECTEN', edition: 'DIGITALE COLLECTIE', projects: 'projecten' },
    en: { collection: 'The project collection', instruction: 'Click to select. Open the centre case to explore the project.', gesture: 'Drag a case to turn it around', open: 'View project', prev: 'Previous project', next: 'Next project', flip: 'Turn case', catalogue: 'ALL PROJECTS', edition: 'DIGITAL COLLECTION', projects: 'projects' }
};
function translate() {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'nl';
    const t = labels[lang];
    document.querySelectorAll('[data-cd-text]').forEach(el => el.textContent = t[el.dataset.cdText]);
    previous.setAttribute('aria-label', t.prev); next.setAttribute('aria-label', t.next);
    albums.forEach((album, i) => {
        album.querySelector('.cd-description').textContent = translations[lang][projects[i].descriptionKey];
        album.setAttribute('aria-label', `${projects[i].title} — ${t.open}`);
    });
}
function select(index,{immediate=false,peek=true}={}) {
    if(opening)return;
    selectionTarget=Math.max(0,Math.min(albums.length-1,index));
    clearTimeout(selectionTimer);selectionTimer=0;
    const wasPeeking=albums.some(album=>album.classList.contains('is-disc-peeking'));
    retractDiscs();
    if(wasPeeking&&!immediate&&!reduced.matches){selectionTimer=setTimeout(()=>{selectionTimer=0;commitSelection(selectionTarget);if(peek)queuePeek();},200);}
    else {commitSelection(selectionTarget);if(peek)queuePeek();}
}
function commitSelection(index) {
    if (opening) return;
    selected = Math.max(0, Math.min(albums.length - 1, index)); rotation = 0;
    const step = Math.min(innerWidth * .72, albums[0].offsetWidth * .98, 350);
    albums.forEach((album, i) => {
        const distance = i - selected;
        album.style.setProperty('--cd-x', `${distance * step}px`);
        album.style.setProperty('--cd-angle', `${distance === 0 ? 0 : distance < 0 ? 42 : -42}deg`);
        album.style.setProperty('--cd-depth', `${distance === 0 ? 45 : -Math.min(Math.abs(distance), 4) * 65}px`);
        album.style.setProperty('--cd-turn', '0deg');
        album.style.zIndex = String(20 - Math.abs(distance));
        album.classList.toggle('is-selected', i === selected);
        album.tabIndex = i === selected ? 0 : -1;
        album.inert = Math.abs(distance) > 2;
        album.toggleAttribute('aria-current', i === selected);
    });
    indexes.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    previous.disabled = selected === 0; next.disabled = selected === albums.length - 1;
    const project = projects[selected];
    document.querySelector('.cd-current-title').textContent = 'Projects';
    document.querySelector('.cd-position').textContent = `${String(selected + 1).padStart(2, '0')} / ${albums.length}`;
    document.querySelector('.cd-progress-fill').style.width = `${(selected + 1) / albums.length * 100}%`;
    translate();
}
previous.addEventListener('click', () => select(selectionTarget - 1));
next.addEventListener('click', () => select(selectionTarget + 1));
indexes.forEach((button, i) => button.addEventListener('click', () => select(i)));
collection.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); select(selectionTarget + (event.key === 'ArrowLeft' ? -1 : 1));
    }
    if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); select(event.key === 'Home' ? 0 : albums.length - 1);
    }
});
albums.forEach((album, i) => {
    album.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if(selectionTimer){event.preventDefault();return;}
        if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
        if (i !== selected) { event.preventDefault(); select(i); return; }
        openProject(event);
    });
    album.addEventListener('dragstart', event => event.preventDefault());
    album.addEventListener('pointerdown', event => {
        if (opening || i !== selected || event.button !== 0) return;
        retractDiscs();
        gesture = { x: event.clientX, y: event.clientY, initial: rotation, moved: false, id: event.pointerId };
    });
    album.addEventListener('pointermove', event => {
        if (!gesture || gesture.id !== event.pointerId) return;
        const delta = event.clientX - gesture.x;
        if (!gesture.moved && Math.abs(delta) > 8 && Math.abs(delta) > Math.abs(event.clientY - gesture.y)) {
            gesture.moved = true; album.setPointerCapture(event.pointerId); album.classList.add('is-turning');
        }
        if (gesture.moved) { rotation = gesture.initial + delta * .7; album.style.setProperty('--cd-turn', `${rotation}deg`); }
    });
    function endGesture(event) {
        if(event.type==='lostpointercapture'&&event.target!==album)return;
        if (!gesture) return;
        if (gesture.moved) {
            suppressClick = true; rotation = Math.round(rotation / 180) * 180;
            album.style.setProperty('--cd-turn', `${rotation}deg`); album.classList.remove('is-turning');
            setTimeout(() => { suppressClick = false; }, 250);
        }
        gesture = null;
        if(!opening)queuePeek();
    }
    album.addEventListener('pointerup', endGesture);
    album.addEventListener('pointercancel', endGesture);
    album.addEventListener('lostpointercapture', endGesture);
});
collection.addEventListener('wheel', event => {
    if (document.body.classList.contains('menu-open')) return;
    if (opening || event.ctrlKey || Math.abs(event.deltaY) + Math.abs(event.deltaX) < 8) return;
    const direction = Math.sign(Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY);
    event.preventDefault();
    if ((selected === 0 && direction < 0) || (selected === albums.length - 1 && direction > 0)) return;
    if (Date.now() - lastWheel < (reduced.matches ? 150 : 480)) return;
    lastWheel = Date.now(); select(selectionTarget + direction);
}, { passive: false });
window.addEventListener('resize', () => select(selected));
document.addEventListener('languageChanged', translate);
collection.classList.add('cd-ready');
select(0);

// Forward and return share the same case geometry and animation path.
const navigationKey = 'jb-cd-navigation';
function fitCases(){collection.style.setProperty('--case-fit',Math.max(56,stage.clientHeight*.78)+'px');}
new ResizeObserver(fitCases).observe(stage);fitCases();
let transitionCleanup=null;
async function openProject(event,returning=false,transitionState=null){
    if(!returning){
        if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
        const project=projects[selected];
        if(reduced.matches||!Element.prototype.animate){
            try{sessionStorage.setItem(navigationKey,JSON.stringify({index:selected,page:project.page,color:albums[selected].style.getPropertyValue('--album-color'),direction:'enter',createdAt:Date.now()}));}catch{}
            return;
        }
        event.preventDefault();
    }
    if(opening)return;opening=true;
    clearTimeout(selectionTimer);selectionTimer=0;retractDiscs();
    const album=albums[selected],project=projects[selected];
    try{
        if(!returning){
            const disc=album.querySelector('.cd-disc');getComputedStyle(disc).transform;
            await Promise.all(disc.getAnimations().map(animation=>animation.finished.catch(()=>{})));
            const prefetch=document.createElement('link');prefetch.rel='prefetch';prefetch.href=project.page;document.head.append(prefetch);
            if(rotation%360!==0){
                const object=album.querySelector('.cd-object'),from=getComputedStyle(object).transform;
                rotation=0;object.style.transition='none';album.style.setProperty('--cd-turn','0deg');
                getComputedStyle(object).transform;
                await object.animate([{transform:from},{transform:'rotateY(0deg)'}],{duration:400,easing:'cubic-bezier(.333333,0,.666667,1)'}).finished;
                object.style.removeProperty('transition');
            }
        }
        const result=await playCDTransition({album,stage,project,index:selected,returning,entryAngle:transitionState?.spinAngle,readerScroll:transitionState?.readerScroll||0,onReady:()=>document.documentElement.classList.remove('cd-arriving')});transitionCleanup=result.cleanup;
        if(!returning){
            try{sessionStorage.setItem(navigationKey,JSON.stringify({index:selected,page:project.page,color:album.style.getPropertyValue('--album-color'),direction:'enter',createdAt:Date.now(),handoff:result.handoff,spinAngle:result.angle}));}catch{}
            location.assign(project.page);
        }else{opening=false;transitionCleanup=null;queuePeek();}
    }catch(error){
        transitionCleanup?.();transitionCleanup=null;opening=false;document.documentElement.classList.remove('cd-arriving');
        if(!returning)location.assign(project.page);
    }
}

let collectionShown=false;
async function restoreCollection(event){
    if(collectionShown&&!event?.persisted)return;
    collectionShown=true;
    transitionCleanup?.();transitionCleanup=null;
    document.documentElement.classList.remove('cd-arriving');opening=false;
    document.body.classList.remove('cd-is-opening');
    document.querySelectorAll('.cd-opening-layer').forEach(layer=>layer.remove());
    albums.forEach(album=>album.classList.remove('is-opening-source'));
    let state;try{state=JSON.parse(sessionStorage.getItem(navigationKey));sessionStorage.removeItem(navigationKey);}catch{}
    if(!state||!projects[state.index]||projects[state.index].page!==state.page)return;
    const historyReturn=state.direction==='detail'&&(event?.persisted||performance.getEntriesByType('navigation')[0]?.type==='back_forward');
    const explicitReturn=state.direction==='return'&&Date.now()-(state.createdAt||0)<20000&&state.from?.endsWith('/'+state.page);
    if(!historyReturn&&!explicitReturn)return;
    document.documentElement.style.setProperty('--cd-arrival-color',state.color);
    if(!reduced.matches)document.documentElement.classList.add('cd-arriving');
    await document.fonts.ready;
    fitCases();select(state.index,{immediate:true,peek:false});
    if(reduced.matches||!Element.prototype.animate){document.documentElement.classList.remove('cd-arriving');return;}
    albums.forEach(album=>album.getAnimations({subtree:true}).forEach(animation=>animation.finish()));
    const motion=openProject(null,true,state);
    await motion;
}
window.addEventListener('pageshow',restoreCollection);
if(document.readyState==='complete')restoreCollection();
