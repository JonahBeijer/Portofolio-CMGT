import { currentLanguage, setLanguage, translations } from '../language.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.getElementById('mobileMenu');
const menuButton = document.getElementById('mobileMenuButton');
let menuWasOpen = false;
function closeMenu() {
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (menuWasOpen) menuButton.focus();
    menuWasOpen = false;
}
function openMenu() {
    menu.hidden = false;
    document.body.classList.add('menu-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuWasOpen = true;
    document.getElementById('closeMenuButton').focus();
}
menuButton.addEventListener('click', () => menu.hidden ? openMenu() : closeMenu());
document.getElementById('closeMenuButton').addEventListener('click', closeMenu);
menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
window.addEventListener('resize', () => { if (innerWidth >= 768 && !menu.hidden) closeMenu(); });
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeMenu(); window.closeVideoModal?.(); }
    const overlay = !menu.hidden ? menu : document.querySelector('#videoModal:not(.hidden)');
    if (event.key !== 'Tab' || !overlay) return;
    const focusables = [...overlay.querySelectorAll('a[href],button,input,video[controls]')].filter(el => !el.disabled && el.getClientRects().length);
    const first = focusables[0], last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
for (const id of ['langToggle', 'mobileLangToggle']) {
    document.getElementById(id).addEventListener('change', event => setLanguage(event.target.checked ? 'en' : 'nl'));
}
document.body.classList.remove('no-scroll-scenes');
const page = document.body.dataset.page;
for (const link of document.querySelectorAll('.desktop-nav a,.mobile-menu nav a')) {
    if (link.getAttribute('href') === `${page}.html`) link.setAttribute('aria-current', 'page');
}

// Content stays available if animation support is absent or reduced motion is requested.
let revealObserver;
if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    document.body.classList.add('motion-ready');
}
function observeReveals() { document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver?.observe(el)); }
observeReveals();
reducedMotion.addEventListener('change', () => {
    document.body.classList.toggle('motion-ready', !reducedMotion.matches && !!revealObserver);
    observeReveals();
    updateScroll();
});
const chapters = [...document.querySelectorAll('[data-chapter]')];
const opening = document.querySelector('.opening-scene');
const biography = document.querySelector('.bio-scene');
const gallery = document.querySelector('.work-gallery');
const galleryStage = document.querySelector('.gallery-stage');
const projectTrack = document.getElementById('projects');
let bioWords = [];
let galleryTravel = 0;
let scrollPending = false;
const clamp = value => Math.min(1, Math.max(0, value));
const desktopScenes = () => innerWidth >= 768 && !reducedMotion.matches;
function prepareBio() {
    const bio = document.getElementById('bio');
    if (!bio) return;
    for (const word of bio.querySelectorAll('.bio-word')) word.replaceWith(document.createTextNode(word.textContent));
    bio.normalize();
    if (reducedMotion.matches) { bioWords = []; return; }
    const walker = document.createTreeWalker(bio, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
        const fragment = document.createDocumentFragment();
        for (const piece of node.textContent.split(/(\s+)/)) {
            if (!piece.trim()) fragment.append(document.createTextNode(piece));
            else { const word = document.createElement('span'); word.className = 'bio-word'; word.textContent = piece; fragment.append(word); }
        }
        node.replaceWith(fragment);
    }
    bioWords = [...bio.querySelectorAll('.bio-word')];
}
function measureGallery() {
    if (!gallery) return;
    if (!desktopScenes()) { gallery.style.height = ''; galleryTravel = 0; return; }
    galleryTravel = Math.max(0, projectTrack.scrollWidth - innerWidth);
    gallery.style.height = `${galleryTravel + galleryStage.offsetHeight}px`;
}
function updateScroll() {
    scrollPending = false;
    const range = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--scroll-progress', range > 0 ? clamp(scrollY / range) : 0);
    if (opening && !reducedMotion.matches) {
        const rect = opening.getBoundingClientRect();
        const progress = clamp((80 - rect.top) / Math.max(1, opening.offsetHeight - (innerHeight - 80)));
        opening.style.setProperty('--intro-p', progress);
    }
    if (biography && !reducedMotion.matches) {
        const rect = biography.getBoundingClientRect();
        const progress = clamp((innerHeight * .8 - rect.top) / Math.max(1, rect.height * .75));
        biography.style.setProperty('--bio-p', progress);
        bioWords.forEach((word, index) => word.classList.toggle('is-read', index / bioWords.length <= progress));
    }
    let currentChapter = null;
    for (const chapter of chapters) {
        const rect = chapter.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) continue;
        if (rect.top <= innerHeight * .45 && rect.bottom > innerHeight * .45) currentChapter = chapter;
        const progress = desktopScenes()
            ? clamp((80 - rect.top) / Math.max(1, chapter.offsetHeight - (innerHeight - 80)))
            : clamp((innerHeight - rect.top) / (innerHeight + rect.height));
        chapter.style.setProperty('--scene-p', reducedMotion.matches ? 1 : progress);
    }
    document.body.classList.toggle('reading-story', !!currentChapter);
    for (const link of document.querySelectorAll('.journey-nav a')) {
        const active = currentChapter && link.hash === `#${currentChapter.id}`;
        if (active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    }
    for (const cover of document.querySelectorAll('.case-cover')) {
        const rect = cover.getBoundingClientRect();
        cover.style.setProperty('--cover-p', reducedMotion.matches ? 1 : clamp((innerHeight - rect.top) / (innerHeight + rect.height)));
    }
    if (gallery && desktopScenes()) {
        const rect = gallery.getBoundingClientRect();
        const progress = clamp((80 - rect.top) / Math.max(1, gallery.offsetHeight - galleryStage.offsetHeight));
        gallery.style.setProperty('--gallery-p', progress);
        gallery.style.setProperty('--gallery-x', `${progress * galleryTravel}px`);
        const count = projectTrack.children.length;
        const current = Math.min(count, Math.round(progress * Math.max(0, count - 1)) + 1);
        document.querySelector('.gallery-counter').textContent = `${String(current).padStart(2, '0')} / ${count}`;
    }
}
window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener('resize', () => { measureGallery(); updateScroll(); });
window.addEventListener('load', () => { measureGallery(); updateScroll(); });
reducedMotion.addEventListener('change', () => { prepareBio(); measureGallery(); updateScroll(); });
document.addEventListener('languageChanged', () => { prepareBio(); updateScroll(); });
prepareBio();
measureGallery();
updateScroll();

// Keep the native pointer and add a restrained companion ring on fine pointers.
if (matchMedia('(pointer:fine)').matches && !reducedMotion.matches) {
    const ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.setAttribute('aria-hidden', 'true'); document.body.append(ring);
    document.addEventListener('pointermove', event => {
        if (reducedMotion.matches) return;
        const interactive = !!event.target.closest('a,button,label,input');
        ring.classList.toggle('over-link', interactive); ring.classList.add('is-visible');
        ring.style.transform = `translate(${event.clientX - (interactive ? 27 : 16)}px,${event.clientY - (interactive ? 27 : 16)}px)`;
    }, { passive: true });
    document.addEventListener('pointerout', event => { if (!event.relatedTarget) ring.classList.remove('is-visible'); });
}

const modal = document.getElementById('videoModal');
let modalTrigger;
if (modal) {
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Project demo');
    window.openVideoModal = () => {
        modalTrigger = document.activeElement; modal.classList.remove('hidden'); document.body.classList.add('modal-open');
        modal.querySelector('button')?.focus(); modal.querySelector('video')?.play().catch(() => {});
    };
    window.closeVideoModal = () => {
        if (modal.classList.contains('hidden')) return;
        modal.classList.add('hidden'); document.body.classList.remove('modal-open');
        modal.querySelector('video')?.pause(); modalTrigger?.focus();
    };
    modal.addEventListener('click', event => { if (!event.target.closest('video,button')) window.closeVideoModal(); });
    modal.querySelector('video')?.setAttribute('preload', 'none');
}
const slider = document.getElementById('appSlider');
if (slider) {
    let position = 0;
    const images = [...slider.querySelectorAll('img')];
    const dots = document.getElementById('sliderDotsContainer');
    const update = () => {
        slider.style.transform = `translateX(-${position * 100}%)`;
        images.forEach((image, index) => image.setAttribute('aria-hidden', index !== position));
        [...dots.children].forEach((dot, index) => dot.setAttribute('aria-current', index === position));
    };
    images.forEach((_, index) => {
        const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'w-2.5 h-2.5 rounded-full bg-white';
        dot.setAttribute('aria-label', `Screenshot ${index + 1}`);
        dot.addEventListener('click', () => { position = index; update(); }); dots.append(dot);
    });
    const previous = document.getElementById('sliderPrev'), next = document.getElementById('sliderNext');
    previous.setAttribute('aria-label', 'Previous screenshot'); next.setAttribute('aria-label', 'Next screenshot');
    previous.addEventListener('click', () => { position = (position - 1 + images.length) % images.length; update(); });
    next.addEventListener('click', () => { position = (position + 1) % images.length; update(); });
    slider.parentElement.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); previous.click(); }
        if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); }
    });
    update();
}

if (page === 'projecten') {
    const { projectsData } = await import('./projects-data.js');
    function renderProjects(lang) {
        const container = document.getElementById('projects');
        // Update existing cards on language changes so scroll position and focus remain stable.
        if (container.children.length) {
            projectsData.forEach((project, index) => {
                container.children[index].querySelector('.project-description').textContent = translations[lang][project.descriptionKey];
                container.children[index].querySelector('.text-link span').textContent = translations[lang].projectDetailsLink;
            });
            return;
        }
        projectsData.forEach((project, index) => {
            const article = document.createElement('article'); article.className = 'project-card';
            article.innerHTML = `<a class="project-image" data-number="${String(index + 1).padStart(2, '0')}" href="${project.page}" aria-label="${project.title}"><img src="${project.image}" alt="${project.title}" loading="lazy" width="640" height="360"></a><div class="project-info"><p class="eyebrow">${String(index + 1).padStart(2, '0')} / ${String(projectsData.length).padStart(2, '0')}</p><h2>${project.title}</h2><div class="project-tags">${project.tags.map(tag => `<span>${tag}</span>`).join('')}</div><p class="project-description">${translations[lang][project.descriptionKey]}</p><a class="text-link" href="${project.page}"><span>${translations[lang].projectDetailsLink}</span><span>↗</span></a></div>`;
            container.append(article);
        });
        measureGallery();
        updateScroll();
    }
    renderProjects(currentLanguage);
    document.addEventListener('languageChanged', event => renderProjects(event.detail));
    projectTrack.addEventListener('focusin', event => {
        if (!desktopScenes()) return;
        const card = event.target.closest('.project-card');
        const viewport = document.querySelector('.project-viewport');
        viewport.scrollLeft = 0;
        const rect = card?.getBoundingClientRect();
        if (!rect || (rect.left >= 0 && rect.right <= innerWidth)) return;
        const offset = Math.min(galleryTravel, card.offsetLeft - innerWidth * .05);
        window.scrollTo({ top: gallery.getBoundingClientRect().top + scrollY - 80 + offset, behavior: 'instant' });
        updateScroll();
    });
}
if (page === 'programeertalen') {
    const { skills } = await import('./skills-data.js');
    const groups = { 'frontend-core': skills.frontendCore, 'frontend-frameworks': skills.frontendFrameworks, 'backend-core': skills.backendCore, 'backend-frameworks': skills.backendFrameworks, databases: skills.databases, 'tools-services': skills.toolsServices };
    for (const [id, items] of Object.entries(groups)) {
        const container = document.getElementById(id);
        container.replaceChildren();
        items.forEach(skill => {
            const item = document.createElement('div'); item.className = 'skill-item';
            item.innerHTML = `<i class="${skill.icon}" aria-hidden="true"></i><p>${skill.name}</p>`; container.append(item);
        });
    }
}
setLanguage(currentLanguage);
for (const image of document.querySelectorAll('.scene-pokemon,.portrait-pokemon,.next-pokemon')) {
    // Preserve the original Pokémon sprites; keep the local Pokéball as an offline fallback.
    image.addEventListener('error', () => { image.src = 'img/pokeball.png'; }, { once: true });
}
