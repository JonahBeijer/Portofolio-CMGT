import './project-gallery.js?v=20261104-1';
const layout = document.querySelector('.case-layout');
if (layout) {
    const media = layout.querySelector('.case-media');
    const chapters = [...layout.querySelectorAll('.case-narrative > .case-chapter')].filter(chapter => chapter.querySelector('h2,h3'));
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const rail = document.createElement('nav');
    rail.className = 'case-chapter-rail';
    rail.setAttribute('aria-label', document.documentElement.lang === 'nl' ? 'Projecthoofdstukken' : 'Project chapters');
    const buttons = chapters.map((chapter, index) => {
        chapter.id ||= `project-chapter-${index + 1}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = chapter.dataset.index;
        button.setAttribute('aria-controls', chapter.id);
        button.addEventListener('click', () => {
            const y = chapter.getBoundingClientRect().top + scrollY - 110;
            window.scrollTo({ top: y, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        });
        rail.append(button);
        return button;
    });
    media?.append(rail);
    function labels() {
        rail.setAttribute('aria-label', document.documentElement.lang === 'nl' ? 'Projecthoofdstukken' : 'Project chapters');
        buttons.forEach((button, index) => button.setAttribute('aria-label', `${button.textContent} — ${chapters[index].querySelector('h2,h3').textContent.trim()}`));
    }
    let pending = false;
    function update() {
        pending = false;
        let current = 0;
        chapters.forEach((chapter, index) => {
            if (chapter.getBoundingClientRect().top <= innerHeight * .43) current = index;
        });
        chapters.forEach((chapter, index) => {
            chapter.classList.toggle('is-current', index === current);
            if (index === current) buttons[index].setAttribute('aria-current', 'step');
            else buttons[index].removeAttribute('aria-current');
        });
    }
    function requestUpdate() { if (!pending) { pending = true; requestAnimationFrame(update); } }
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate);
    addEventListener('pageshow', requestUpdate);
    document.addEventListener('languageChanged', () => { labels(); requestUpdate(); });
    if ('ResizeObserver' in window) new ResizeObserver(requestUpdate).observe(layout);
    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('story-seen'); observer.unobserve(entry.target); }
            });
        }, { threshold: .12 });
        layout.classList.add('story-ready');
        layout.querySelectorAll('.case-feature-list > div').forEach(row => observer.observe(row));
        reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) layout.classList.remove('story-ready'); });
    }
    labels();
    update();
}
