/* Platform-independent arrow artwork. Text labels remain separate from decorative icons. */
(() => {
    const paths = {
        '→':'M4 12h16M14 6l6 6-6 6',
        '←':'M20 12H4m6-6-6 6 6 6',
        '↑':'M12 20V4m-6 6 6-6 6 6',
        '↓':'M12 4v16m-6-6 6 6 6-6',
        '↗':'M6 18 18 6M6 6h12v12',
        '↶':'M4 10h9a6 6 0 0 1 0 12M9 5l-5 5 5 5',
        '↔':'M4 12h16M9 7l-5 5 5 5m6-10 5 5-5 5'
    };
    const arrowPattern = /[→←↑↓↗↶↔]/g;
    const ignored = 'script,style,textarea,pre,code,svg,title,option,[data-native-arrows]';
    function replaceText(node) {
        if (!node.isConnected || !node.parentElement || node.parentElement.closest(ignored)) return;
        const value = node.nodeValue;
        arrowPattern.lastIndex = 0;
        if (!arrowPattern.test(value)) return;
        arrowPattern.lastIndex = 0;
        const fragment = document.createDocumentFragment();
        let end = 0;
        for (const match of value.matchAll(arrowPattern)) {
            if (match.index > end) fragment.append(value.slice(end, match.index));
            const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            svg.classList.add('ui-arrow');
            svg.setAttribute('viewBox','0 0 24 24');
            svg.setAttribute('aria-hidden','true');
            svg.setAttribute('focusable','false');
            svg.setAttribute('fill','none');
            svg.setAttribute('stroke','currentColor');
            svg.setAttribute('stroke-width','1.7');
            svg.setAttribute('stroke-linecap','round');
            svg.setAttribute('stroke-linejoin','round');
            const path = document.createElementNS(svg.namespaceURI,'path');
            path.setAttribute('d',paths[match[0]]);
            svg.append(path); fragment.append(svg);
            end = match.index + match[0].length;
        }
        if (end < value.length) fragment.append(value.slice(end));
        node.replaceWith(fragment);
    }
    function scan(root) {
        if (root.nodeType === Node.TEXT_NODE) { replaceText(root); return; }
        if (root.nodeType !== Node.ELEMENT_NODE || root.closest(ignored)) return;
        const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        const nodes=[];
        while(walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(replaceText);
    }
    function init() {
        scan(document.body);
        new MutationObserver(records => {
            const roots = new Set();
            for (const record of records) {
                if(record.type === 'characterData') roots.add(record.target);
                else for(const node of record.addedNodes) roots.add(node);
            }
            for (const root of roots) if(root.isConnected) scan(root);
        }).observe(document.body,{childList:true,characterData:true,subtree:true});
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
    else init();
})();
