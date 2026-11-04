// Letters turn the corner into two lines; the real heading remains accessible.
const stage=document.querySelector('.learning-type-stage');
if(stage){
 const canvas=stage.querySelector('canvas'),heading=stage.querySelector('h2'),ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let lines=[],width=0,height=0,size=0,frame=0,started=null,visible=false,ready=false;
 const ease=p=>1-Math.pow(1-Math.max(0,Math.min(1,p)),4);
 function schedule(){if(!frame&&visible)frame=requestAnimationFrame(paint);}
 function measure(){
  width=stage.clientWidth;height=stage.clientHeight;if(!width||!height)return;
  const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const en=document.documentElement.lang==='en',texts=en?['Experience','& Learnings']:['Ervaring','& Leerpunten'];
  const family=getComputedStyle(heading).fontFamily;
  ctx.font='500 100px '+family;
  const spacing=-5.5,measureText=text=>[...text].reduce((sum,c)=>sum+ctx.measureText(c).width+spacing,0)-spacing;
  size=Math.min(height*.37,width*.86/Math.max(...texts.map(measureText))*100,180);
  ctx.font='500 '+size+'px '+family;ctx.textBaseline='alphabetic';
  lines=texts.map((text,row)=>{let offset=0;const glyphs=[...text].map(char=>{const advance=ctx.measureText(char).width,g={char,s:offset+advance/2,advance};offset+=advance-size*.055;return g;});const length=offset+size*.055;
   return {glyphs,length,x:row?Math.max(width*.11,width-length):width*.11,y:row?height*.88:height*.43,radius:size*.62};});
  ready=true;stage.classList.add('is-painted');schedule();
 }
 function point(s,line){const r=line.radius,arc=r*Math.PI/2;
  if(s>=0)return {x:line.x+s,y:line.y,angle:0};
  if(s>=-arc){const a=s/r;return {x:line.x+r*Math.sin(a),y:line.y-r+r*Math.cos(a),angle:-a};}
  return {x:line.x-r,y:line.y-r+s+arc,angle:Math.PI/2};
 }
 function paint(now){frame=0;if(!ready||!visible)return;
  ctx.clearRect(0,0,width,height);const age=now-(started??now);let moving=false;
  lines.forEach((line,row)=>{
   const progress=reduced.matches?1:ease((age-row*150)/1850),travel=(line.length+size*2.3)*(1-progress);if(progress<1)moving=true;
   const trails=!reduced.matches&&travel>1?4:1;
   for(let trail=trails-1;trail>=0;trail--){
    ctx.globalAlpha=trail?(.11+(3-trail)*.025):1;ctx.fillStyle=trail?'#3F72AF':'#112D4E';
    for(const g of line.glyphs){const p=point(g.s-travel-trail*size*.045,line);
     ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillText(g.char,-g.advance/2,0);ctx.restore();
    }
   }
  });ctx.globalAlpha=1;if(moving)schedule();
 }
 const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){if(!visible){visible=true;if(started===null)started=performance.now();schedule();}}else{visible=false;if(frame)cancelAnimationFrame(frame);frame=0;}}},{threshold:.12});observer.observe(stage);
 new ResizeObserver(measure).observe(stage);
 new MutationObserver(measure).observe(heading,{childList:true,characterData:true,subtree:true});
 document.addEventListener('languageChanged',measure);
 reduced.addEventListener('change',schedule);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else schedule();});
 document.fonts.ready.then(measure);
}
