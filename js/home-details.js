// Reveal existing content without changing the photograph hover animations.
const home=document.querySelector('.home-profile');
if(home&&'IntersectionObserver' in window){
 const elements=[...home.querySelectorAll('.profile-portrait,.profile-introduction,.offline-list,.offline-photos,.work-stub,.profile-study')];
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-in-view');observer.unobserve(entry.target);}},{threshold:.08,rootMargin:'0px 0px -10px'});
 elements.forEach((el,i)=>{el.classList.add('detail-reveal');el.style.setProperty('--detail-delay',(el.classList.contains('work-stub')?(i%3)*65:0)+'ms');observer.observe(el);});
 document.documentElement.classList.add('home-details-ready');
}
