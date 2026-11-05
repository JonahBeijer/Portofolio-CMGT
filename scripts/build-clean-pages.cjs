// GitHub Pages serves these directories without exposing .html in the URL.
// Keep the root HTML sources editable, then run this after updating them:
// node scripts/build-clean-pages.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const routes = { 'index.html':'home', 'projecten.html':'projects', 'programeertalen.html':'programming-languages' };
for (const [source, slug] of Object.entries(routes)) {
    let html = fs.readFileSync(path.join(root, source), 'utf8');
    html = html.replace(/<script\b[^>]*\bdata-clean-redirect(?:="[^"]*")?[^>]*>[\s\S]*?<\/script>\s*/g, '');
    html = html.replace(/<head>/, '<head><base href="../">');
    // A relative base also affects fragments, so point each fragment to its own page.
    html = html.replace(/href="#([^\"]*)"/g, `href="${slug}/#$1"`);
    fs.mkdirSync(path.join(root, slug), { recursive:true });
    fs.writeFileSync(path.join(root, slug, 'index.html'), html);
    console.log(`/${slug}/`);
}
