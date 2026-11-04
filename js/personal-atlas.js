import { destinations, concerts } from './memories-data.js';
const root=document.querySelector('.journal-atlas');
const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
const viewport=root.querySelector('.atlas-globe');
const list=root.querySelector('.atlas-list');
const markerLayer=root.querySelector('.atlas-markers');
const dialog=root.querySelector('dialog');
const size=420,rad=Math.PI/180;
canvas.width=canvas.height=size;
let mode='destinations', selected=0, longitude=10, latitude=28, zoom=1,texture, queued=false, flight=0,gesture;
let markers=[];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const labels={nl:{title:'Waar ik graag<br><em>verder kijk.</em>',intro:'Een wereld aan plekken en avonden om te onthouden.',example:'VOORBEELDEN / LATER JOUW PLEKKEN, FOTO’S EN VERHALEN',destinations:'Bestemmingen',concerts:'Concerten',help:'Sleep of scroll om te draaien. Kies een stip of een herinnering.',zoomIn:'Inzoomen',zoomOut:'Uitzoomen',reset:'Wereldbol herstellen',open:'Open herinnering',sample:'VOORBEELD',places:'voorbeeldbestemmingen',shows:'voorbeeldconcerten',previous:'Vorige herinnering',next:'Volgende herinnering',photo:'Voorbeeldfoto',map:'Draaibare wereldbol. Gebruik de pijltjestoetsen om te draaien en plus of min om te zoomen.'},en:{title:'A little more<br><em>of the world.</em>',intro:'A world of places and nights to remember.',example:'EXAMPLES / YOUR PLACES, PHOTOS AND STORIES GO HERE',destinations:'Destinations',concerts:'Concerts',help:'Drag or scroll to turn. Pick a pin or a memory.',zoomIn:'Zoom in',zoomOut:'Zoom out',reset:'Reset globe',open:'Open memory',sample:'EXAMPLE',places:'example destinations',shows:'example concerts',previous:'Previous memory',next:'Next memory',photo:'Example photograph',map:'Interactive globe. Use arrow keys to rotate and plus or minus to zoom.'}};
const lang=()=>document.documentElement.lang==='en'?'en':'nl';
const entries=()=>mode==='destinations'?destinations:concerts;
const country=e=>lang()==='en'?(e.countryEn||e.country):e.country;
function title(e){return mode==='concerts'?[e.artist||e.title,e.city].join(' — '):e.title;}
function project(lat,lon){const a=lat*rad,b=(lon-longitude)*rad,t=latitude*rad;return [Math.cos(a)*Math.sin(b),Math.sin(a)*Math.cos(t)-Math.cos(a)*Math.cos(b)*Math.sin(t),Math.sin(a)*Math.sin(t)+Math.cos(a)*Math.cos(b)*Math.cos(t)];}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;draw();});}
function draw(){
 const radius=size*.42*zoom,half=size/2,tilt=latitude*rad,ct=Math.cos(tilt),st=Math.sin(tilt);
 ctx.clearRect(0,0,size,size);
 const pixels=ctx.createImageData(size,size),out=pixels.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const nx=(x-half)/radius,ny=-(y-half)/radius,d=nx*nx+ny*ny;if(d>1)continue;
  const nz=Math.sqrt(1-d),oy=ny*ct+nz*st,oz=nz*ct-ny*st;
  const lat=Math.asin(Math.max(-1,Math.min(1,oy))),lon=Math.atan2(nx,oz)+longitude*rad;
  let land=false;
  if(texture){const u=Math.floor(((lon/(2*Math.PI)+.5)%1+1)%1*1024),v=Math.min(511,Math.max(0,Math.floor((.5-lat/Math.PI)*512)));land=texture[(v*1024+u)*4]>100;}
  const light=.65+.35*Math.max(0,-nx*.3+ny*.35+nz*.8),color=land?[187,193,158]:[39,69,65],i=(y*size+x)*4;
  out[i]=color[0]*light;out[i+1]=color[1]*light;out[i+2]=color[2]*light;out[i+3]=Math.min(255,(1-d)*radius*255);
 }
 ctx.putImageData(pixels,0,0);
 ctx.save();ctx.strokeStyle='#e8e4c225';ctx.lineWidth=.65;
 function line(points){ctx.beginPath();let visible=false;for(const[lat,lon]of points){const p=project(lat,lon);if(p[2]<0){visible=false;continue;}const x=half+p[0]*radius,y=half-p[1]*radius;if(visible)ctx.lineTo(x,y);else ctx.moveTo(x,y);visible=true;}ctx.stroke();}
 for(let lat=-60;lat<=60;lat+=30)line(Array.from({length:181},(_,i)=>[lat,i*2-180]));
 for(let lon=-180;lon<180;lon+=30)line(Array.from({length:91},(_,i)=>[i*2-90,lon]));
 ctx.restore();
 markers.forEach((button,i)=>{const e=entries()[i],p=project(e.lat,e.lon);button.hidden=p[2]<.04;button.style.left=(50+p[0]*42*zoom)+'%';button.style.top=(50-p[1]*42*zoom)+'%';});
 root.dataset.rotation=longitude.toFixed(1);
}
function flyTo(entry){
 const token=++flight,start=performance.now(),fromLon=longitude,fromLat=latitude;
 const delta=((entry.lon-fromLon+540)%360)-180,targetLat=Math.max(-65,Math.min(65,entry.lat));
 if(reduced.matches){longitude=fromLon+delta;latitude=targetLat;schedule();return;}
 function frame(now){if(token!==flight)return;const p=Math.min(1,(now-start)/650),ease=1-(1-p)**3;longitude=fromLon+delta*ease;latitude=fromLat+(targetLat-fromLat)*ease;schedule();if(p<1)requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}
function select(index,move=true){
 selected=(index+entries().length)%entries().length;const e=entries()[selected];
 for(const[items,attr]of [[list.children,'aria-pressed'],[markers,'aria-pressed']])Array.from(items).forEach((b,i)=>b.setAttribute(attr,String(i===selected)));
 root.querySelector('.atlas-selected-title').textContent=title(e);
 root.querySelector('.atlas-selected-place').textContent=country(e)+(e.date?' / '+e.date:'');
 root.querySelector('.atlas-selected-note').textContent=lang()==='en'?(e.noteEn||e.note):e.note;
 const image=root.querySelector('.atlas-selected-image');image.src=e.image;image.alt=labels[lang()].photo+' — '+title(e);
 root.querySelector('.atlas-selected-number').textContent=String(selected+1).padStart(2,'0')+' / '+String(entries().length).padStart(2,'0');
 root.querySelector('.atlas-selected-example').hidden=!e.example;
 document.dispatchEvent(new CustomEvent('atlas:selection',{detail:{mode,index:selected,title:title(e),city:e.city,image:e.image}}));
 if(move)flyTo(e);else schedule();
}
function render(){
 const t=labels[lang()];root.querySelectorAll('[data-atlas-text]').forEach(el=>el.innerHTML=t[el.dataset.atlasText]);
 viewport.setAttribute('aria-label',t.map);
 root.querySelector('[data-zoom="1"]').setAttribute('aria-label',t.zoomIn);root.querySelector('[data-zoom="-1"]').setAttribute('aria-label',t.zoomOut);root.querySelector('[data-atlas-reset]').setAttribute('aria-label',t.reset);
 root.querySelector('[data-memory-prev]').setAttribute('aria-label',t.previous);root.querySelector('[data-memory-next]').setAttribute('aria-label',t.next);
 root.querySelector('.atlas-counts').textContent=destinations.length+' '+t.places+' / '+concerts.length+' '+t.shows;
 root.querySelectorAll('[data-atlas-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.atlasMode===mode)));
 list.replaceChildren();markerLayer.replaceChildren();markers=[];
 entries().forEach((e,i)=>{
  const button=document.createElement('button');button.type='button';button.className='atlas-memory';
  const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');
  const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=title(e);small.textContent=country(e);text.append(strong,small);const arrow=document.createElement('span');arrow.textContent='↗';button.append(number,text,arrow);button.addEventListener('click',()=>select(i));list.append(button);
  const pin=document.createElement('button');pin.type='button';pin.className='atlas-pin';pin.setAttribute('aria-label',title(e));pin.addEventListener('click',()=>select(i));markerLayer.append(pin);markers.push(pin);
 });select(Math.min(selected,entries().length-1),false);
}
root.querySelectorAll('[data-atlas-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.atlasMode;selected=0;render();flyTo(entries()[0]);}));
function setZoom(delta){zoom=Math.max(.8,Math.min(1.15,zoom+delta));schedule();}
root.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>setZoom(Number(b.dataset.zoom)*.08)));
root.querySelector('[data-atlas-reset]').addEventListener('click',()=>{++flight;longitude=10;latitude=28;zoom=1;schedule();});
root.querySelector('[data-memory-prev]').addEventListener('click',()=>select(selected-1));root.querySelector('[data-memory-next]').addEventListener('click',()=>select(selected+1));
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const actions={ArrowLeft:()=>longitude-=12,ArrowRight:()=>longitude+=12,ArrowUp:()=>latitude=Math.min(70,latitude+8),ArrowDown:()=>latitude=Math.max(-70,latitude-8),'+':()=>setZoom(.08),'=':()=>setZoom(.08),'-':()=>setZoom(-.08)};if(actions[e.key]){e.preventDefault();++flight;actions[e.key]();schedule();}});
viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;gesture={x:e.clientX,y:e.clientY,lon:longitude,lat:latitude,moved:false};++flight;});
viewport.addEventListener('pointermove',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(!gesture.moved&&Math.abs(dx)>6){gesture.moved=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');}if(gesture.moved){longitude=gesture.lon-dx*.4;latitude=Math.max(-70,Math.min(70,gesture.lat+dy*.3));schedule();}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,()=>{gesture=null;viewport.classList.remove('is-dragging');});
viewport.addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();++flight;longitude+=(e.deltaX||e.deltaY)*.15;schedule();},{passive:false});
root.querySelectorAll('[data-open-memory]').forEach(button=>button.addEventListener('click',()=>{const e=entries()[selected];dialog.querySelector('img').src=e.image;dialog.querySelector('img').alt=title(e);dialog.querySelector('h3').textContent=title(e);dialog.querySelector('p').textContent=(lang()==='en'?(e.noteEn||e.note):e.note)+' — '+country(e);dialog.showModal();document.body.classList.add('modal-open');}));
dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
document.addEventListener('languageChanged',render);
render();
try {
 const response=await fetch(new URL('./world-land.geojson',import.meta.url));if(!response.ok)throw Error(response.status);const data=await response.json();
 const map=document.createElement('canvas');map.width=1024;map.height=512;const paint=map.getContext('2d',{willReadFrequently:true});paint.fillStyle='#000';paint.fillRect(0,0,1024,512);paint.fillStyle='#fff';
 function polygon(rings){paint.beginPath();for(const ring of rings){ring.forEach(([lon,lat],i)=>{const x=(lon+180)/360*1024,y=(90-lat)/180*512;if(i===0)paint.moveTo(x,y);else paint.lineTo(x,y);});paint.closePath();}paint.fill('evenodd');}
 for(const feature of data.features){if(feature.geometry.type==='Polygon')polygon(feature.geometry.coordinates);else if(feature.geometry.type==='MultiPolygon')feature.geometry.coordinates.forEach(polygon);}
 texture=paint.getImageData(0,0,1024,512).data;root.dataset.mapReady='true';schedule();
} catch { root.dataset.mapReady='false'; /* The full memory list remains usable without map data. */ }

document.addEventListener('atlas:navigate',event=>{const requested=event.detail?.mode;if(requested!=='destinations'&&requested!=='concerts')return;if(mode!==requested){mode=requested;selected=0;render();}flyTo(entries()[selected]);});
