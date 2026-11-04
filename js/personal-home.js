const notes = {
  "nl": {
    "edition": "JONAH BEIJER / PORTFOLIO",
    "role": "CMGT-STUDENT & DEVELOPER",
    "hero": "Websites, apps<br>en <em>de rest.</em>",
    "intro": "Ik ben Jonah. Ik maak websites en apps. Verder ga ik graag naar concerten, reis ik met mijn vriendin en sleutel ik aan mijn auto.",
    "meet": "Over mij",
    "annotation": "",
    "city": "Ergens anders.",
    "concert": "Live.",
    "example": "VOORBEELDBEELD",
    "scroll": "SCROLL VOOR MIJN VERHAAL ↓",
    "workLink": "OF DUIK IN MIJN PROJECTEN",
    "portrait": "Jonah, op reis.",
    "aboutHeading": "Even voorstellen.",
    "route": "02 / MIJN ROUTE TOT NU TOE",
    "routeHeading": "Onderweg<br>blijf je <em>leren.</em>",
    "tools": "Dit gebruik ik om te bouwen",
    "offlineLabel": "03 / BUITEN HET SCHERM",
    "offlineHeading": "Meer dan<br><em>alleen code.</em>",
    "offlineText": "Ik ga graag naar concerten en raves. Ik reis met mijn vriendin, spreek af met vrienden en ben ook gewoon graag aan het gamen of anime aan het kijken.",
    "concertHobby": "Concerten bezoeken",
    "musicCaption": "Concerten en raves.",
    "travelCaption": "Voorbeeldfoto. Mijn eigen reisfoto’s komen hier.",
    "futureHeading": "Dit wil ik<br><em>nog maken.</em>",
    "collection": "11 PROJECTEN",
    "projectsHeading": "Dit heb ik<br><em>gemaakt.</em>",
    "smallNod": "Klein beetje Pokémon."
  },
  "en": {
    "edition": "JONAH BEIJER / PORTFOLIO",
    "role": "CMGT STUDENT & DEVELOPER",
    "hero": "Websites, apps<br>and <em>everything else.</em>",
    "intro": "I’m Jonah. I build websites and apps. I also go to concerts, travel with my girlfriend and work on my car.",
    "meet": "About me",
    "annotation": "",
    "city": "Somewhere else.",
    "concert": "Live.",
    "example": "EXAMPLE PHOTOGRAPH",
    "scroll": "SCROLL FOR MY STORY ↓",
    "workLink": "OR EXPLORE MY PROJECTS",
    "portrait": "Jonah, travelling.",
    "aboutHeading": "A bit about me.",
    "route": "02 / MY JOURNEY SO FAR",
    "routeHeading": "Keep exploring.<br><em>Keep learning.</em>",
    "tools": "What I build with",
    "offlineLabel": "03 / AWAY FROM THE SCREEN",
    "offlineHeading": "More than<br><em>just code.</em>",
    "offlineText": "I go to concerts and raves, travel with my girlfriend and spend time with friends. I also like gaming and watching anime.",
    "concertHobby": "Going to concerts",
    "musicCaption": "Concerts and raves.",
    "travelCaption": "Example photograph. My own travel photos will go here.",
    "futureHeading": "What I want<br><em>to build next.</em>",
    "collection": "11 PROJECTS",
    "projectsHeading": "Things<br><em>I’ve made.</em>",
    "smallNod": "A little Pokémon."
  }
};
const dialog = document.querySelector('.journal-lightbox');
let photoTrigger;
function translateNotes() {
 const t = notes[document.documentElement.lang === 'en' ? 'en' : 'nl'];
 for (const el of document.querySelectorAll('[data-note]')) {
  // Only locally authored translations may contain the editorial emphasis markup.
  el.innerHTML = t[el.dataset.note];
 }
 if (dialog.open && photoTrigger) dialog.querySelector('p').textContent = t[photoTrigger.dataset.caption];
}
translateNotes();
document.addEventListener('languageChanged', translateNotes);
for (const button of document.querySelectorAll('[data-photo]:not([data-journey-go])')) {
 button.addEventListener('click', () => {
  photoTrigger = button;
  dialog.querySelector('img').src = button.dataset.photo;
  dialog.querySelector('img').alt = button.querySelector('img').alt;
  const t = notes[document.documentElement.lang === 'en' ? 'en' : 'nl'];
  dialog.querySelector('p').textContent = t[button.dataset.caption];
  dialog.showModal(); document.body.classList.add('modal-open');
 });
}
dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
 const box = dialog.getBoundingClientRect();
 if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); photoTrigger?.focus({ preventScroll:true }); });
