/** Rebuild the two portfolio snapshots without touching the current worktree. */
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');process.chdir(root);
const versions={v1:'fc8e3c5629fe5de6c3e360cd2c0b2df73fff6813',v2:'08f9a3e16d7fd66335ea6799b374790e8e9f8281'};
const git=(...args)=>execFileSync('git',args,{maxBuffer:100*1024*1024});
const currentHashes=new Map();
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function save(file,bytes){const absolute=path.resolve(root,file);if(!absolute.startsWith(path.join(root,'versions')+path.sep))throw Error('Invalid archive destination');fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,bytes);}
for(const [version,commit] of Object.entries(versions)){
 const entries=git('ls-tree','-r','-z',commit).toString('utf8').split('\0').filter(Boolean).map(row=>{const [header,file]=row.split('\t');return{hash:header.split(' ')[2],file};}).filter(e=>!e.file.startsWith('.')&&!e.file.includes('/.'));
 const assetMap=new Map();let reused=0,copied=0;
 for(const entry of entries){
  if(/\.(html|css|js|json)$/i.test(entry.file))continue;
  const current=path.resolve(root,entry.file);let hash=currentHashes.get(entry.file);
  if(hash===undefined){hash=fs.existsSync(current)?git('hash-object','--',entry.file).toString().trim():null;currentHashes.set(entry.file,hash);}
  if(hash===entry.hash){assetMap.set(entry.file,entry.file);reused++;}
  else{const dest='versions/assets/'+entry.hash+'/'+path.posix.basename(entry.file);if(!fs.existsSync(dest))save(dest,git('cat-file','blob',entry.hash));assetMap.set(entry.file,dest);copied++;}
 }
 for(const entry of entries){
  if(!/\.(html|css|js|json)$/i.test(entry.file))continue;
  const destination='versions/'+version+'/'+entry.file;
  let text=git('cat-file','blob',entry.hash).toString('utf8');
  for(const [original,target] of [...assetMap].sort((a,b)=>b[0].length-a[0].length)){
   // CSS URLs resolve relative to the stylesheet; HTML and JS media URLs to the document.
   const from=entry.file.endsWith('.css')?path.posix.dirname(destination):'versions/'+version;
   const url=path.posix.relative(from,target);
   for(const spelling of new Set([original,encodeURI(original)])){
   const pattern=new RegExp('(?<![\\w/])(?:\\.\\.?/)*'+escape(spelling)+'(?=[?#\\s"\'`)]|$)','g');
   text=text.replace(pattern,()=>url);
   }
  }
  if(entry.file.endsWith('.html'))text=text.replace(/<\/body>/i,'<script type="module" src="../../js/portfolio-versions.js?v=20261103-1"></script>\n</body>');
  save(destination,text);
 }
 save('versions/'+version+'/version.json',JSON.stringify({version,commit},null,2)+'\n');
 console.log(version+': '+entries.length+' files; '+reused+' shared media, '+copied+' preserved media.');
}
