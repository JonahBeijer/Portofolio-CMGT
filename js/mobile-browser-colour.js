// Browsers own their toolbar transparency. Keep their solid-colour fallback in
// sync with the content at the visible bottom edge, rather than a fixed colour.
export function initMobileBrowserColour() {
    const root = document.documentElement;
    const mobile = matchMedia('(max-width:767px)');
    let theme = document.querySelector('meta[name="theme-color"][data-mobile-theme]');
    if (!theme) {
        theme = document.createElement('meta');
        theme.name = 'theme-color'; theme.media = '(max-width: 767px)';
        theme.dataset.mobileTheme = ''; document.head.append(theme);
    }
    let frame = 0, timer = 0, lastColour = '';
    const fallback = document.body.dataset.page === 'projecten' ? '#f9f7f7' : '#112d4e';
    function update() {
        frame = 0;
        if (!mobile.matches) {
            root.style.removeProperty('--mobile-edge-color'); lastColour = ''; return;
        }
        let colour = fallback;
        if (root.classList.contains('menu-open') || root.classList.contains('photo-viewer-open')) colour = '#112d4e';
        else {
            const viewport = window.visualViewport;
            const x = Math.max(0, Math.min(innerWidth - 1, (viewport?.offsetLeft || 0) + (viewport?.width || innerWidth) / 2));
            const y = Math.max(0, Math.min(innerHeight - 1, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - 2));
            let element = document.elementFromPoint(x, y);
            while (element && element !== document.body && element !== root) {
                const background = getComputedStyle(element).backgroundColor;
                // Ignore transparent surfaces so the actual painted ancestor wins.
                if (/^rgb\(/.test(background)) { colour = background; break; }
                element = element.parentElement;
            }
        }
        if (colour === lastColour) return;
        lastColour = colour;
        root.style.setProperty('--mobile-edge-color', colour);
        theme.content = colour;
    }
    function request(immediate = false) {
        if (immediate) { clearTimeout(timer); timer = 0; if (!frame) frame = requestAnimationFrame(update); }
        else if (!timer && !frame) timer = setTimeout(() => { timer = 0; frame = requestAnimationFrame(update); }, 100);
    }
    addEventListener('scroll', () => request(), { passive:true });
    addEventListener('resize', () => request(true));
    addEventListener('pageshow', () => request(true));
    addEventListener('load', () => request(true), { once:true });
    window.visualViewport?.addEventListener('resize', () => request(true));
    window.visualViewport?.addEventListener('scroll', () => request(), { passive:true });
    mobile.addEventListener('change', () => request(true));
    new MutationObserver(() => request(true)).observe(root, { attributes:true, attributeFilter:['class'] });
    new ResizeObserver(() => request(true)).observe(document.body);
    document.fonts.ready.then(() => request(true));
    addEventListener('pagehide', () => { clearTimeout(timer); cancelAnimationFrame(frame); timer = frame = 0; });
    request(true);
}
