import { exampleImages } from './photo-wall-examples.js?v=20261103-optimized1';
import { photoCategories, categoryFor } from './photo-wall-categories.js?v=20261105-1';

const copy = {
    nl: { categories:'Fotocategorieën', travel:'Reizen', live:'Events', people:'Vrienden', moments:'Random', hint:'Veeg om te ontdekken. Tik om te vergroten.', photo:'Foto', photos:'foto’s', of:'van', previous:'Vorige foto', next:'Volgende foto', close:'Sluit foto', enlarge:'Vergroot foto', loading:'Foto laden…', error:'Deze foto kon niet worden geladen.', about:'Over mij ↓', profileTitle:'Dit ben ik.', concerts:'Concerten bezoeken' },
    en: { categories:'Photo categories', travel:'Travels', live:'Events', people:'Loved ones', moments:'Random', hint:'Swipe to explore. Tap to enlarge.', photo:'Photo', photos:'photos', of:'of', previous:'Previous photo', next:'Next photo', close:'Close photo', enlarge:'Enlarge photo', loading:'Loading photo…', error:'This photo could not be loaded.', about:'About me ↓', profileTitle:'This is me.', concerts:'Going to concerts' }
};
const icon = direction => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${{previous:'M20 12H4m6-6-6 6 6 6',next:'M4 12h16M14 6l6 6-6 6',close:'M6 6l12 12M18 6 6 18',enlarge:'M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7'}[direction]}"/></svg>`;

export function initMobilePhotoWall({ stage, signal }) {
    const on = (target, event, listener, options = {}) => target.addEventListener(event, listener, { ...options, signal });
    const reduced = matchMedia('(prefers-reduced-motion:reduce)');
    const text = () => copy[document.documentElement.lang === 'en' ? 'en' : 'nl'];
    const groups = photoCategories.map(group => ({ ...group, images:[...new Set(exampleImages)].filter(image => categoryFor(image) === group.id) }));
    let groupIndex = 0, active = 0, cards = [], positions = [], frame = 0, gesture = null, programmatic = false, scrollTimer;
    for (const selector of ['.photo-wall', '.photo-wall-shade', '.photo-wall-progress', '.wall-pan']) stage.querySelector(selector)?.remove();

    const album = document.createElement('div');
    album.className = 'mobile-photo-album';
    album.innerHTML = `<div class="mobile-photo-tabs" role="tablist"></div><div class="mobile-photo-context"><span class="mobile-photo-category"></span><span class="mobile-photo-total"></span></div><div class="mobile-photo-rail" id="mobile-photo-panel" role="tabpanel"></div><div class="mobile-photo-controls"><button type="button" data-photo-previous>${icon('previous')}</button><span class="mobile-photo-position" aria-live="polite" aria-atomic="true"></span><button type="button" data-photo-next>${icon('next')}</button></div><p class="mobile-photo-hint"></p>`;
    stage.append(album);
    const tablist = album.querySelector('[role=tablist]');
    const rail = album.querySelector('.mobile-photo-rail');
    const previous = album.querySelector('[data-photo-previous]');
    const next = album.querySelector('[data-photo-next]');
    const count = album.querySelector('.mobile-photo-position');
    const group = () => groups[groupIndex];
    const photoLabel = index => `${text()[group().id]} — ${text().photo.toLowerCase()} ${index + 1} ${text().of} ${group().images.length}`;
    const thumbnail = path => path.replace('wall-photos/', 'wall-photos/mobile/');
    const tabs = groups.map((item, index) => {
        const tab = document.createElement('button');
        tab.type = 'button'; tab.id = `mobile-photo-tab-${item.id}`;
        tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', rail.id);
        on(tab, 'click', () => selectGroup(index));
        on(tab, 'keydown', event => {
            let selected = null;
            if (event.key === 'ArrowRight') selected = (index + 1) % groups.length;
            if (event.key === 'ArrowLeft') selected = (index + groups.length - 1) % groups.length;
            if (event.key === 'Home') selected = 0;
            if (event.key === 'End') selected = groups.length - 1;
            if (selected !== null) { event.preventDefault(); selectGroup(selected); tabs[selected].focus({ preventScroll:true }); }
        });
        tablist.append(tab);
        return tab;
    });

    // Request only the visible prints and their nearest neighbour, not the whole wall.
    const images = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
            const image = entry.target.querySelector('img');
            if (image.dataset.src) { image.src = image.dataset.src; delete image.dataset.src; }
            images.unobserve(entry.target);
        }
    }, { root:rail, rootMargin:'0px 70% 0px 0px' });

    const dialog = document.createElement('dialog');
    dialog.className = 'mobile-photo-viewer';
    dialog.innerHTML = `<div class="mobile-photo-viewer-top"><span class="mobile-photo-viewer-category"></span><button type="button" data-photo-close>${icon('close')}</button></div><figure class="mobile-photo-viewer-image"><img alt="" decoding="async"><p class="mobile-photo-viewer-status" role="status"></p></figure><div class="mobile-photo-viewer-controls"><button type="button" data-photo-previous>${icon('previous')}</button><span class="mobile-photo-viewer-position" aria-live="polite" aria-atomic="true"></span><button type="button" data-photo-next>${icon('next')}</button></div>`;
    document.body.append(dialog);
    const preview = dialog.querySelector('img');
    const imageArea = dialog.querySelector('figure');
    const status = dialog.querySelector('[role=status]');
    const close = dialog.querySelector('[data-photo-close]');
    const viewerPrevious = dialog.querySelector('[data-photo-previous]');
    const viewerNext = dialog.querySelector('[data-photo-next]');

    function updatePosition() {
        const value = `${String(active + 1).padStart(2, '0')} / ${String(group().images.length).padStart(2, '0')}`;
        count.textContent = value;
        dialog.querySelector('.mobile-photo-viewer-position').textContent = value;
        previous.disabled = viewerPrevious.disabled = active === 0;
        next.disabled = viewerNext.disabled = active === group().images.length - 1;
    }
    function measure() { positions = cards.map(card => card.offsetLeft - (cards[0]?.offsetLeft || 0)); }
    function go(index) {
        active = Math.max(0, Math.min(group().images.length - 1, index));
        programmatic = !reduced.matches;
        clearTimeout(scrollTimer);
        rail.scrollTo({ left:positions[active] || 0, behavior:reduced.matches ? 'instant' : 'smooth' });
        scrollTimer = setTimeout(() => { programmatic = false; }, 600);
        updatePosition();
    }
    function selectGroup(index) {
        if (index === groupIndex && cards.length) return;
        groupIndex = index; active = 0; programmatic = false; clearTimeout(scrollTimer);
        images.disconnect();
        cards = group().images.map((path, index) => {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'mobile-photo-card';
            button.innerHTML = `<span class="mobile-photo-print"><img alt="" width="320" height="427" decoding="async" draggable="false"><span class="mobile-photo-print-caption"><span>${String(index + 1).padStart(2, '0')}</span>${icon('enlarge')}</span></span>`;
            button.querySelector('img').dataset.src = thumbnail(path);
            on(button, 'click', () => openPhoto(index));
            return button;
        });
        rail.replaceChildren(...cards);
        rail.scrollTo({ left:0, behavior:'instant' });
        // The first print is immediately available; others are observed horizontally.
        cards[0].querySelector('img').src = cards[0].querySelector('img').dataset.src;
        delete cards[0].querySelector('img').dataset.src;
        cards.forEach(card => images.observe(card));
        measure(); translate();
    }
    function showPhoto(index) {
        active = Math.max(0, Math.min(group().images.length - 1, index));
        updatePosition();
        preview.classList.add('is-loading');
        status.hidden = false; status.textContent = text().loading;
        preview.alt = photoLabel(active);
        // Only the opened photograph loads the larger original web version.
        preview.src = reduced.matches ? thumbnail(group().images[active]) : group().images[active];
    }
    function openPhoto(index) {
        showPhoto(index);
        document.documentElement.classList.add('photo-viewer-open');
        document.body.classList.add('photo-viewer-open');
        dialog.showModal(); close.focus({ preventScroll:true });
    }
    function unlock() {
        document.documentElement.classList.remove('photo-viewer-open');
        document.body.classList.remove('photo-viewer-open');
    }
    on(preview, 'load', () => { preview.classList.remove('is-loading'); status.hidden = true; });
    on(preview, 'error', () => { preview.classList.add('is-loading'); status.hidden = false; status.textContent = text().error; });
    on(close, 'click', () => dialog.close());
    on(dialog, 'close', () => {
        unlock();
        rail.scrollTo({ left:positions[active] || 0, behavior:'instant' });
        cards[active]?.focus({ preventScroll:true });
        preview.removeAttribute('src');
    });
    on(viewerPrevious, 'click', () => showPhoto(active - 1));
    on(viewerNext, 'click', () => showPhoto(active + 1));
    on(dialog, 'keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); showPhoto(active + (event.key === 'ArrowRight' ? 1 : -1));
        }
    });
    on(imageArea, 'pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary) return;
        gesture = { id:event.pointerId, x:event.clientX, y:event.clientY, moved:false };
    });
    on(imageArea, 'pointermove', event => {
        if (!gesture || gesture.id !== event.pointerId) return;
        const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        if (!gesture.moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) { gesture = null; return; }
        if (!gesture.moved && Math.abs(dx) > 12) { gesture.moved = true; imageArea.setPointerCapture(event.pointerId); }
    });
    on(imageArea, 'pointerup', event => {
        if (!gesture || gesture.id !== event.pointerId) return;
        const dx = event.clientX - gesture.x;
        if (gesture.moved && Math.abs(dx) > 45) showPhoto(active + (dx < 0 ? 1 : -1));
        gesture = null;
    });
    for (const event of ['pointercancel', 'lostpointercapture']) on(imageArea, event, () => { gesture = null; });
    on(previous, 'click', () => go(active - 1));
    on(next, 'click', () => go(active + 1));
    on(rail, 'scroll', () => {
        if (programmatic) { clearTimeout(scrollTimer); scrollTimer = setTimeout(() => { programmatic = false; }, 140); return; }
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            if (dialog.open) return;
            const nearest = positions.reduce((best, left, index) => Math.abs(left - rail.scrollLeft) < Math.abs(positions[best] - rail.scrollLeft) ? index : best, 0);
            if (active !== nearest) { active = nearest; updatePosition(); }
        });
    }, { passive:true });
    const resize = new ResizeObserver(measure); resize.observe(rail);
    function translate() {
        const t = text();
        tablist.setAttribute('aria-label', t.categories);
        tabs.forEach((tab, index) => {
            tab.textContent = t[groups[index].id];
            tab.setAttribute('aria-selected', String(index === groupIndex));
            tab.tabIndex = index === groupIndex ? 0 : -1;
        });
        rail.setAttribute('aria-labelledby', tabs[groupIndex].id);
        album.querySelector('.mobile-photo-category').textContent = t[group().id];
        album.querySelector('.mobile-photo-total').textContent = `${group().images.length} ${t.photos}`;
        album.querySelector('.mobile-photo-hint').textContent = t.hint;
        cards.forEach((card, index) => {
            card.setAttribute('aria-label', `${t.enlarge}: ${photoLabel(index)}`);
            card.querySelector('img').alt = photoLabel(index);
        });
        for (const button of [previous, viewerPrevious]) button.setAttribute('aria-label', t.previous);
        for (const button of [next, viewerNext]) button.setAttribute('aria-label', t.next);
        close.setAttribute('aria-label', t.close);
        dialog.setAttribute('aria-label', t.enlarge);
        dialog.querySelector('.mobile-photo-viewer-category').textContent = t[group().id];
        if (dialog.open) preview.alt = photoLabel(active);
        document.querySelectorAll('[data-memory-ui]').forEach(el => { const value = t[el.dataset.memoryUi]; if (value) el.textContent = value; });
        updatePosition();
    }
    on(document, 'languageChanged', translate);
    signal.addEventListener('abort', () => {
        cancelAnimationFrame(frame); clearTimeout(scrollTimer); images.disconnect(); resize.disconnect();
        if (dialog.open) dialog.close();
        dialog.remove(); unlock();
    }, { once:true });
    selectGroup(0);
}
