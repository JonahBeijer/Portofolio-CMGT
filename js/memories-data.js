// Replace the example entries with Jonah's actual journeys and concerts.
// Add as many entries as needed. Coordinates are [latitude, longitude].
// Optional fields: date, photos (array), artist, venue. No fixed collection limit.
const places = [
 ['Amsterdam','Nederland','Netherlands',52.37,4.90],['Lissabon','Portugal','Portugal',38.72,-9.14],['Londen','Verenigd Koninkrijk','United Kingdom',51.51,-.13],['Berlijn','Duitsland','Germany',52.52,13.40],['Barcelona','Spanje','Spain',41.39,2.17],['Rome','Italië','Italy',41.90,12.50],['Reykjavík','IJsland','Iceland',64.15,-21.94],['New York','Verenigde Staten','United States',40.71,-74.01],['Tokyo','Japan','Japan',35.68,139.69],['Sydney','Australië','Australia',-33.87,151.21]
];
export const destinations = places.map(([city,country,countryEn,lat,lon],i) => ({
 id:'trip-'+(i+1), city, country, countryEn, lat, lon, example:true,
 title:city, image:'img/journal-portrait-city.webp',
 note:'Een plek voor een eigen reisverhaal: de stad, de mensen en wat je is bijgebleven.',
 noteEn:'A place for a travel story of your own: the city, the people and what stayed with you.'
}));
export const concerts = [
 ['Amsterdam','Nederland','Netherlands',52.37,4.90],['Rotterdam','Nederland','Netherlands',51.92,4.48],['Londen','Verenigd Koninkrijk','United Kingdom',51.51,-.13],['Berlijn','Duitsland','Germany',52.52,13.40],['Parijs','Frankrijk','France',48.86,2.35],['Antwerpen','België','Belgium',51.22,4.40],['Barcelona','Spanje','Spain',41.39,2.17],['Kopenhagen','Denemarken','Denmark',55.68,12.57],['New York','Verenigde Staten','United States',40.71,-74.01],['Tokyo','Japan','Japan',35.68,139.69]
].map(([city,country,countryEn,lat,lon],i)=>({
 id:'live-'+(i+1),city,country,countryEn,lat,lon,example:true,
 title:'Concert '+String(i+1).padStart(2,'0'),image:'img/journal-portrait-concert.webp',
 note:'Hier komt jouw concert: artiest, locatie, datum en de foto die je weer even terugbrengt.',
 noteEn:'Your concert goes here: artist, venue, date and the photograph that takes you back.'
}));
