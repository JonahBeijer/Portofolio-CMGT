import './profile-notes.js?v=20261105-1';
const stage=document.querySelector('.photo-wall-stage');
const wrap=document.querySelector('.memory-scroll');
const markup=stage.innerHTML;
const narrow=matchMedia('(max-width:767px)');
let controller;
async function mount(){
 controller?.abort();
 controller=new AbortController();
 const current=controller;
 stage.innerHTML=markup;
 stage.removeAttribute('style');
 stage.classList.remove('is-photo-table','is-wall-visible');
 delete stage.dataset.progress;delete stage.dataset.table;
 wrap.style.removeProperty('height');
 stage.classList.remove('is-mobile-photos');
 wrap.classList.remove('is-mobile-photos');
 const {initPhotoWall}=await import('./photo-wall-scroll.js?v=20261105-scroll2');
 if(!current.signal.aborted)await initPhotoWall({signal:current.signal});
}
narrow.addEventListener('change',mount);
mount();
