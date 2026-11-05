// A single left-to-right decode pass, with the real text preserved for assistive technology.
export function initBioDecode() {
    const bio = document.querySelector('#bio[data-bio-decode]');
    if (!bio || !('IntersectionObserver' in window)) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const played = new Set();
    let frame = 0, savedHTML = null, generation = 0;
    const language = () => document.documentElement.lang || 'nl';
    function restore() {
        cancelAnimationFrame(frame); frame = 0;
        if (savedHTML !== null) { bio.innerHTML = savedHTML; savedHTML = null; }
        bio.removeAttribute('aria-busy');
        delete bio.dataset.decodeState;
    }
    async function play() {
        const lang = language();
        if (reduced.matches || played.has(lang) || frame) return;
        const token = ++generation;
        await document.fonts.ready;
        if (token !== generation || reduced.matches || played.has(lang)) return;
        const bounds = bio.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > innerHeight || document.hidden) return;
        played.add(lang);
        savedHTML = bio.innerHTML;
        const text = bio.textContent;
        const accessible = document.createElement('span');
        accessible.className = 'bio-decode-source';
        accessible.textContent = text;
        const fragment = document.createDocumentFragment();
        fragment.append(accessible);
        const words = [];
        let total = 0;
        for (const piece of text.split(/(\s+)/u)) {
            if (!piece.trim()) { fragment.append(document.createTextNode(piece)); continue; }
            const word = document.createElement('span');
            word.className = 'bio-decode-word';
            word.setAttribute('aria-hidden', 'true');
            const original = document.createElement('span');
            original.className = 'bio-decode-original'; original.textContent = piece;
            word.append(original); fragment.append(word);
            words.push({ word, original, letters: [...piece], start: total, cells: [] });
            total += [...piece].length;
        }
        bio.replaceChildren(fragment);
        bio.setAttribute('aria-busy', 'true');
        bio.dataset.decodeState = 'running';
        for (const item of words) {
            const origin = item.original.getBoundingClientRect();
            let offset = 0;
            for (const letter of item.letters) {
                const range = document.createRange();
                range.setStart(item.original.firstChild, offset);
                offset += letter.length;
                range.setEnd(item.original.firstChild, offset);
                const rect = range.getBoundingClientRect();
                const cell = document.createElement('span');
                cell.className = 'bio-decode-glyph';
                cell.style.left = `${rect.left - origin.left}px`;
                cell.style.width = `${Math.max(1,rect.width)}px`;
                item.word.append(cell); item.cells.push(cell);
            }
        }
        const alphabet = '01/<>_:+*';
        const duration = Math.min(2400, Math.max(1100, 950 + total * 2.4));
        let start = null, previous = -1;
        function tick(now) {
            if (token !== generation) return;
            if (start === null) start = now;
            const elapsed = now - start;
            if (elapsed >= duration || reduced.matches || document.hidden) { restore(); return; }
            const step = Math.floor(elapsed / 45);
            if (step !== previous) {
                previous = step;
                const revealed = Math.floor(Math.max(0, (elapsed - 100) / (duration - 260)) * total);
                for (const item of words) {
                    const count = Math.max(0, Math.min(item.letters.length, revealed - item.start));
                    const edge = count === 0 ? 0 : parseFloat(item.cells[count-1].style.left) + parseFloat(item.cells[count-1].style.width);
                    item.original.style.clipPath = count === item.letters.length ? 'none' : `inset(-.2em calc(100% - ${edge}px) -.2em -.2em)`;
                    item.cells.forEach((cell,index) => {
                        if (index < count) { cell.textContent = ''; return; }
                        const seed = (item.start + index) * 17 + step * 13;
                        cell.textContent = seed % 5 < 2 ? '' : alphabet[seed % alphabet.length];
                        cell.style.opacity = seed % 3 ? '.55' : '.3';
                    });
                }
            }
            frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
    }
    const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) play();
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    observer.observe(bio);
    document.addEventListener('languageChanged', () => {
        // setLanguage has already written the new text; never restore the old language over it.
        ++generation; cancelAnimationFrame(frame); frame = 0; savedHTML = null;
        bio.removeAttribute('aria-busy'); delete bio.dataset.decodeState;
        play();
    });
    reduced.addEventListener('change', () => { ++generation; restore(); if (!reduced.matches) play(); });
    addEventListener('pagehide', () => { ++generation; restore(); });
    play();
}
