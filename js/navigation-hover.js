export function initNavigationHover(){
 const links=[...document.querySelectorAll('.desktop-nav .nav-link,.mobile-menu nav a')];
 function build(){for(const link of links){
  const text=link.textContent.trim();
  const window=document.createElement('span');window.className='nav-label-window';
  const original=document.createElement('span');original.className='nav-label-copy';original.textContent=text;
  const alternate=document.createElement('span');alternate.className='nav-label-copy nav-label-echo';alternate.textContent=text;alternate.setAttribute('aria-hidden','true');
  window.append(original,alternate);link.replaceChildren(window);link.classList.add('has-nav-hover');
 }}
 document.addEventListener('languageChanged',build);build();
}
