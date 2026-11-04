import { destinations, concerts } from './memories-data.js';
// A deliberately mixed photo line. The order is editorial, never sorted by dates.
// Replace example images/captions here and add any number of new memories.
const loosePhotos=[
 {id:'loose-friends',title:'Met vrienden',titleEn:'With friends',image:'img/memory-example-friends.webp'},
 {id:'loose-sea',title:'Even aan zee',titleEn:'By the sea',image:'img/memory-example-sea.webp'},
 {id:'loose-street',title:'Nog even buiten',titleEn:'Still out',image:'img/memory-example-street.webp'},
 {id:'loose-sunset',title:'Deze bewaren',titleEn:'Keeping this one',image:'img/memory-example-sea.webp'},
 {id:'loose-company',title:'Gewoon een leuke foto',titleEn:'Just a good photo',image:'img/memory-example-friends.webp'}
].map(photo=>({...photo,kind:'photo',example:true,note:'Een plek voor een eigen foto. Geen datum nodig; een korte zin is genoeg.',noteEn:'A space for your own photograph. No date needed; one short sentence is enough.'}));
export const memories=[{id:'jonah',title:'Jonah.',titleEn:'Jonah.',kind:'me',image:'img/IMG_4026.JPEG',example:false,note:'Ik maak websites en apps, studeer CMGT en werk bij DIGIWEDO en Stena Line. Verder: reizen, concerten, vrienden, anime, games en mijn auto.',noteEn:'I build websites and apps, study CMGT and work at DIGIWEDO and Stena Line. Also: travel, concerts, friends, anime, games and my car.'}];
for(let i=0;i<Math.max(destinations.length,concerts.length);i++){
 if(destinations[i])memories.push({...destinations[i],kind:'travel',titleEn:destinations[i].title,note:'Voorbeeld van een vakantiefoto. Hier komt straks jouw plek, foto en herinnering.',noteEn:'An example travel photograph. Your place, photo and memory go here.'});
 if(i%2===0&&loosePhotos[i/2])memories.push(loosePhotos[i/2]);
 if(concerts[i])memories.push({...concerts[i],kind:'music',title:'Live in '+concerts[i].city,titleEn:'Live in '+concerts[i].city,note:'Voorbeeld van een concertfoto. Hier komt straks de artiest of het moment dat je wilt bewaren.',noteEn:'An example concert photograph. Add the artist or the moment you want to keep.'});
}
