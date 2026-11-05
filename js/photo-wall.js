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
 stage.classList.toggle('is-mobile-photos',narrow.matches);
 wrap.classList.toggle('is-mobile-photos',narrow.matches);
 if(narrow.matches){
  const {initMobilePhotoWall}=await import('./photo-wall-mobile.js?v=20261105-album1');
  if(!current.signal.aborted)initMobilePhotoWall({stage,signal:current.signal});
 }else{
  const {initDesktopPhotoWall}=await import('./photo-wall-desktop.js?v=20261105-album1');
  if(!current.signal.aborted)await initDesktopPhotoWall({signal:current.signal});
 }
}
narrow.addEventListener('change',mount);
mount();
