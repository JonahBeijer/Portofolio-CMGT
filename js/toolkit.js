import { skills } from './skills-data.js';
const tabs=[...document.querySelectorAll('[data-tool-tab]')];
const panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
const list=document.querySelector('.toolkit-tabs');
const proof=document.querySelector('.toolkit-example');
const projectName=proof.querySelector('.toolkit-project-name');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const narrow=matchMedia('(max-width:767px)');
const projects=[
 {name:'Gamemaniac',page:'Gamemaniac.html'},
 {name:'IFCC Events',page:'ifcc.html'},
 {name:'SpinShare',page:'spinshare.html'},
 {name:'Meerkat Gaming',page:'meerkatgaming.html'},
 {name:'Chatbot',page:'chatbot.html'}
];
const copy={nl:{browse:'Blader door mijn tools ↓',total:'tools, verdeeld over 5 vakken.',inside:'IN MIJN TOOLKIT',example:'Bijvoorbeeld in dit project.',view:'Bekijk het project',notes:'UIT DE PRAKTIJK',categories:'Toolcategorieën',toolkit:'Mijn toolkit'},en:{browse:'Browse my tools ↓',total:'tools, organised into 5 sections.',inside:'INSIDE MY TOOLKIT',example:'For example, in this project.',view:'View the project',notes:'FROM EXPERIENCE',categories:'Tool categories',toolkit:'My toolkit'}};
const language=()=>document.documentElement.lang==='en'?'en':'nl';
const counts=[skills.frontendCore.length,skills.frontendFrameworks.length,skills.backendCore.length+skills.backendFrameworks.length,skills.databases.length,skills.toolsServices.length];
let active=0;
function select(index,focus=false,animate=true){
 active=index;
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
 panels.forEach((panel,i)=>{panel.getAnimations().forEach(animation=>animation.cancel());panel.hidden=i!==index;});
 document.querySelector('.toolkit-active-number').textContent=String(index+1).padStart(2,'0')+' / 05';
 const project=projects[index];
 projectName.textContent=project.name;
 proof.querySelectorAll('a').forEach(link=>link.href=project.page);
 if(animate&&!reduced.matches){panels[index].animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,easing:'cubic-bezier(.2,.75,.2,1)'});}
 if(focus){tabs[index].focus({preventScroll:true});tabs[index].scrollIntoView({block:'nearest',inline:'nearest',behavior:reduced.matches?'instant':'smooth'});}
}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>{if(active!==i)select(i);});tab.addEventListener('keydown',event=>{let target=null;if(event.key==='ArrowDown'||event.key==='ArrowRight')target=(i+1)%tabs.length;if(event.key==='ArrowUp'||event.key==='ArrowLeft')target=(i-1+tabs.length)%tabs.length;if(event.key==='Home')target=0;if(event.key==='End')target=tabs.length-1;if(target!==null){event.preventDefault();select(target,true);}});tab.querySelector('.tool-tab-count').textContent=counts[i];});
function translate(){const t=copy[language()];document.querySelectorAll('[data-toolkit-ui]').forEach(element=>element.textContent=t[element.dataset.toolkitUi]);list.setAttribute('aria-label',t.categories);document.querySelector('.toolkit-workbench').setAttribute('aria-label',t.toolkit);}
function orientation(){list.setAttribute('aria-orientation',narrow.matches?'horizontal':'vertical');}
document.querySelector('.toolkit-total strong').textContent=counts.reduce((a,b)=>a+b,0);document.addEventListener('languageChanged',translate);narrow.addEventListener('change',orientation);translate();orientation();select(0,false,false);
