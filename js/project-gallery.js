for (const gallery of document.querySelectorAll('.case-image-gallery')) {
    const track=gallery.querySelector('.case-gallery-track');
    const slides=[...track.querySelectorAll('.case-gallery-slide')];
    const thumbs=gallery.querySelector('.case-gallery-thumbnails');
    const counter=gallery.querySelector('.case-gallery-count');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let active=0, startX=0, moved=false, programmatic=false, scrollTimer;
    const dialog=document.createElement('dialog');
    dialog.className='case-lightbox';
    dialog.innerHTML='<div class="case-lightbox-top"><span class="case-lightbox-count"></span><button type="button" data-close>×</button></div><img alt=""><div class="case-lightbox-bottom"><button type="button" data-prev>←</button><button type="button" data-next>→</button></div>';
    document.body.append(dialog);
    const preview=dialog.querySelector('img');
    const thumbButtons=slides.map((slide,index)=>{
        const button=document.createElement('button');button.type='button';
        const image=slide.querySelector('img').cloneNode();image.alt='';image.loading='lazy';button.append(image);thumbs.append(button);
        button.addEventListener('click',()=>go(index));
        slide.addEventListener('click',()=>{if(moved)return;setActive(index);preview.src=slide.querySelector('img').src;dialog.showModal();});
        return button;
    });
    function labels(){
        const en=document.documentElement.lang==='en';
        track.setAttribute('aria-label',en?'Project screenshots':'Projectscreenshots');
        dialog.setAttribute('aria-label',en?'Enlarged screenshot':'Vergroot screenshot');
        for(const [selector,label]of [['[data-gallery-prev]',en?'Previous screenshot':'Vorig screenshot'],['[data-gallery-next]',en?'Next screenshot':'Volgend screenshot']])gallery.querySelector(selector).setAttribute('aria-label',label);
        dialog.querySelector('[data-close]').setAttribute('aria-label',en?'Close':'Sluiten');
        dialog.querySelector('[data-prev]').setAttribute('aria-label',en?'Previous screenshot':'Vorig screenshot');
        dialog.querySelector('[data-next]').setAttribute('aria-label',en?'Next screenshot':'Volgend screenshot');
        thumbButtons.forEach((button,index)=>{button.setAttribute('aria-label',`${en?'Show screenshot':'Toon screenshot'} ${index+1}`);slides[index].setAttribute('aria-label',`${en?'Enlarge screenshot':'Vergroot screenshot'} ${index+1}`);});
    }
    function setActive(index){
        active=index;
        counter.innerHTML=`${String(index+1).padStart(2,'0')} <small>/ ${String(slides.length).padStart(2,'0')}</small>`;
        dialog.querySelector('.case-lightbox-count').textContent=`${index+1} / ${slides.length}`;
        slides.forEach((slide,i)=>{slide.tabIndex=i===index?0:-1;thumbButtons[i].setAttribute('aria-pressed',String(i===index));});
        const selected=thumbButtons[index];
        thumbs.scrollTo({left:selected.offsetLeft-thumbs.offsetLeft-thumbs.clientWidth/2+selected.clientWidth/2,behavior:reduced.matches?'instant':'smooth'});
        if(dialog.open){preview.src=slides[index].querySelector('img').src;preview.alt=slides[index].querySelector('img').alt;}
    }
    function go(index){index=(index+slides.length)%slides.length;programmatic=true;clearTimeout(scrollTimer);setActive(index);track.scrollTo({left:index*track.clientWidth,behavior:reduced.matches?'instant':'smooth'});scrollTimer=setTimeout(()=>programmatic=false,800);}
    gallery.querySelector('[data-gallery-prev]').addEventListener('click',()=>go(active-1));
    gallery.querySelector('[data-gallery-next]').addEventListener('click',()=>go(active+1));
    dialog.querySelector('[data-prev]').addEventListener('click',()=>go(active-1));
    dialog.querySelector('[data-next]').addEventListener('click',()=>go(active+1));
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
    let previousOverflow='';
    dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;slides[active].focus({preventScroll:true});});
    slides.forEach(slide=>slide.addEventListener('click',()=>{if(dialog.open){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';preview.alt=slide.querySelector('img').alt;}}));
    function keys(event){if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(active+(event.key==='ArrowRight'?1:-1));}}
    track.addEventListener('keydown',keys);dialog.addEventListener('keydown',keys);
    track.addEventListener('pointerdown',event=>{startX=event.clientX;moved=false;programmatic=false;},{passive:true});
    track.addEventListener('pointermove',event=>{if(event.buttons||event.pointerType==='touch')moved=Math.abs(event.clientX-startX)>10;},{passive:true});
    let pending=false;
    track.addEventListener('scrollend',()=>{programmatic=false;});
    track.addEventListener('scroll',()=>{if(programmatic)return;if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;const i=Math.round(track.scrollLeft/track.clientWidth);if(i!==active&&i>=0&&i<slides.length)setActive(i);});}},{passive:true});
    if('ResizeObserver'in window)new ResizeObserver(()=>track.scrollTo({left:active*track.clientWidth,behavior:'instant'})).observe(track);
    document.addEventListener('languageChanged',labels);
    labels();setActive(0);
}
