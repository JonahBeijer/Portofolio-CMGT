// Reveal existing content without changing the photograph hover animations.
const home=document.querySelector('.home-profile');
if(home&&'IntersectionObserver' in window){
 const elements=[...home.querySelectorAll('.profile-portrait,.profile-introduction,.offline-list,.offline-photos,.work-stub,.profile-study')];
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-in-view');observer.unobserve(entry.target);}},{threshold:.08,rootMargin:'0px 0px -10px'});
 elements.forEach((el,i)=>{el.classList.add('detail-reveal');el.style.setProperty('--detail-delay',(el.classList.contains('work-stub')?(i%3)*65:0)+'ms');observer.observe(el);});
 document.documentElement.classList.add('home-details-ready');
}
// Each trait rolls into its blue alternate line without moving the surrounding layout.
const traitRows=[...document.querySelectorAll('.profile-traits li')];
for(const row of traitRows){
 const id=row.id;
 const original=document.createElement('span');original.className='trait-line';original.id=id;original.textContent=row.textContent;
 const echo=document.createElement('span');echo.className='trait-line trait-echo';echo.setAttribute('aria-hidden','true');echo.textContent=original.textContent;
 const window=document.createElement('span');window.className='trait-roll';window.append(original,echo);
 row.removeAttribute('id');row.tabIndex=0;row.replaceChildren(window);
 row.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){traitRows.forEach(other=>{if(other!==row)other.classList.remove('is-trait-active');});row.classList.toggle('is-trait-active');}});
}
function syncTraits(){for(const row of traitRows)row.querySelector('.trait-echo').textContent=row.querySelector('.trait-line:not(.trait-echo)').textContent;}
document.addEventListener('languageChanged',syncTraits);syncTraits();
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.profile-traits'))traitRows.forEach(row=>row.classList.remove('is-trait-active'));});
document.addEventListener('keydown',event=>{if(event.key==='Escape')traitRows.forEach(row=>row.classList.remove('is-trait-active'));});
