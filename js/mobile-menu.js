// One composited curtain and staggered rows; no scroll loop, blur or canvas.
export function initMobileMenu(reduced) {
    const menu = document.getElementById('mobileMenu');
    const menuButton = document.getElementById('mobileMenuButton');
    const closeButton = document.getElementById('closeMenuButton');
    const nav = menu.querySelector('nav');
    // Give Safari/Chrome the same edge colour as the page or its open menu.
    const pageTheme = document.body.dataset.page === 'projecten' ? '#f9f7f7' : '#112d4e';
    let mobileTheme = document.querySelector('meta[name="theme-color"][data-mobile-theme]');
    if (!mobileTheme) {
        mobileTheme = document.createElement('meta');
        mobileTheme.name = 'theme-color';
        mobileTheme.media = '(max-width: 767px)';
        mobileTheme.dataset.mobileTheme = '';
        document.head.append(mobileTheme);
    }
    mobileTheme.content = pageTheme;
    let phase = 'closed', generation = 0, animations = [], background = [];
    document.body.append(menu);
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.inert = true;
    menu.dataset.menuState = phase;

    const curtain = document.createElement('div');
    curtain.className = 'menu-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    const topline = document.createElement('div');
    topline.className = 'menu-topline';
    topline.setAttribute('aria-hidden', 'true');
    topline.innerHTML = '<span class="menu-monogram">J/B</span><span class="menu-edition">Portfolio / <span data-menu-copy="navigation"></span></span>';
    menu.prepend(curtain, topline);
    const footer = document.createElement('div');
    footer.className = 'menu-contact';
    footer.innerHTML = '<span data-menu-copy="contact"></span><a href="mailto:jonahbeijer@gmail.com">jonahbeijer@gmail.com <svg class="ui-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6h12v12"></path></svg></a><span class="menu-signature">Jonah Beijer — Portfolio</span>';
    menu.append(footer);
    closeButton.textContent = '';
    closeButton.append(document.createElement('span'), document.createElement('span'));
    const rows = [...nav.querySelectorAll('a')];
    rows.forEach((row, i) => { row.dataset.menuIndex = String(i + 1).padStart(2, '0'); });
    const secondary = [topline, menu.querySelector('.language-switch'), footer];
    function translate() {
        const en = document.documentElement.lang === 'en';
        menu.setAttribute('aria-label', en ? 'Navigation' : 'Navigatie');
        nav.setAttribute('aria-label', en ? 'Mobile navigation' : 'Mobiele navigatie');
        closeButton.setAttribute('aria-label', en ? 'Close menu' : 'Sluit menu');
        menu.querySelector('[data-menu-copy="navigation"]').textContent = en ? 'Navigation' : 'Navigatie';
        menu.querySelector('[data-menu-copy="contact"]').textContent = en ? 'Have something in mind?' : 'Iets moois in gedachten?';
    }
    function animate(element, keyframes, options) {
        const animation = element.animate(keyframes, { fill: 'both', ...options });
        animations.push(animation);
        return animation;
    }
    function cancel() { animations.forEach(a => a.cancel()); animations = []; }
    function lock() {
        if (background.length) return;
        background = [...document.body.children].filter(el => el.matches('header,main,footer')).map(el => ({ el, inert: el.inert }));
        background.forEach(({ el }) => { el.inert = true; });
        document.documentElement.classList.add('menu-open');
        mobileTheme.content = '#112d4e';
        document.body.classList.add('menu-open');
    }
    function unlock() {
        background.forEach(({ el, inert }) => { el.inert = inert; });
        background = [];
        document.documentElement.classList.remove('menu-open');
        mobileTheme.content = pageTheme;
        document.body.classList.remove('menu-open');
    }
    async function openMenu() {
        if (phase === 'open' || phase === 'opening') return;
        const token = ++generation;
        const from = menu.hidden ? 'translateY(100%)' : getComputedStyle(menu).transform;
        cancel();
        phase = 'opening';
        menu.dataset.menuState = phase;
        menu.hidden = false;
        menu.inert = false;
        lock();
        menuButton.setAttribute('aria-expanded', 'true');
        closeButton.focus({ preventScroll: true });
        if (!reduced.matches && Element.prototype.animate) {
            animate(menu, [{ transform: from }, { transform: 'translateY(0)' }], { duration: 720, easing: 'cubic-bezier(.76,0,.24,1)' });
            animate(curtain, [{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }], { duration: 780, delay: 100, easing: 'cubic-bezier(.76,0,.24,1)' });
            rows.forEach((row, i) => animate(row, [
                { opacity: 0, transform: 'translateY(65px) rotate(3deg)' },
                { opacity: 1, transform: 'translateY(0) rotate(0)' }
            ], { duration: 720, delay: 290 + i * 85, easing: 'cubic-bezier(.22,1,.36,1)' }));
            secondary.forEach((el, i) => animate(el, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, delay: 430 + i * 80, easing: 'cubic-bezier(.22,1,.36,1)' }));
            await Promise.all(animations.map(a => a.finished.catch(() => {})));
        }
        if (token !== generation) return;
        cancel();
        phase = 'open';
        menu.dataset.menuState = phase;
    }
    async function closeMenu({ immediate = false, restoreFocus = true } = {}) {
        if (phase === 'closed') return;
        if (phase === 'closing' && !immediate) return;
        const token = ++generation;
        const from = getComputedStyle(menu).transform;
        const rowStates = rows.map(row => ({ opacity: getComputedStyle(row).opacity, transform: getComputedStyle(row).transform }));
        cancel();
        phase = 'closing';
        menu.dataset.menuState = phase;
        menu.inert = true;
        menuButton.setAttribute('aria-expanded', 'false');
        if (!immediate && !reduced.matches && Element.prototype.animate) {
            const exit = animate(menu, [{ transform: from }, { transform: 'translateY(-101%)' }], { duration: 520, easing: 'cubic-bezier(.76,0,.24,1)' });
            rows.forEach((row, i) => animate(row, [rowStates[i], { opacity: 0, transform: 'translateY(-30px)' }], { duration: 240, delay: (rows.length - 1 - i) * 35, easing: 'ease-in' }));
            await exit.finished.catch(() => {});
        }
        if (token !== generation) return;
        cancel();
        menu.hidden = true;
        phase = 'closed';
        menu.dataset.menuState = phase;
        unlock();
        if (restoreFocus && innerWidth < 768) menuButton.focus({ preventScroll: true });
    }
    menuButton.addEventListener('click', () => phase === 'closed' || phase === 'closing' ? openMenu() : closeMenu());
    closeButton.addEventListener('click', () => closeMenu());
    menu.addEventListener('click', async event => {
        const link = event.target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin) { closeMenu(); return; }
        event.preventDefault();
        event.stopPropagation();
        const token = generation + 1;
        await closeMenu({ restoreFocus: false });
        if (generation === token && phase === 'closed') location.assign(url.href);
    });
    addEventListener('resize', () => { if (innerWidth >= 768) closeMenu({ immediate: true, restoreFocus: false }); });
    addEventListener('pageshow', event => { if (event.persisted) closeMenu({ immediate: true, restoreFocus: false }); });
    reduced.addEventListener('change', () => { if (reduced.matches) animations.forEach(a => a.finish()); });
    document.addEventListener('languageChanged', translate);
    translate();
    return { menu, menuButton, closeMenu };
}
