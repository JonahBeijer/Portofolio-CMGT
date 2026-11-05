/** Build lightweight wall images while preserving the originals and GIF animation. */
const fs=require('fs'),path=require('path');
let sharp;try{sharp=require('sharp');}catch{if(!process.env.SHARP_MODULE_PATH)throw Error('Install sharp or set SHARP_MODULE_PATH to its module directory.');sharp=require(process.env.SHARP_MODULE_PATH);}
sharp.cache({memory:24,files:0,items:32});sharp.concurrency(2);
const root=path.resolve(__dirname,'..');process.chdir(root);
const listFile='js/photo-wall-examples.js',list=JSON.parse(fs.readFileSync(listFile,'utf8').match(/export const exampleImages\s*=\s*(\[[\s\S]*?\]);/)[1]);
const folder='img/wall-photos',manifestFile=folder+'/manifest.json';fs.mkdirSync(folder,{recursive:true});
fs.mkdirSync(folder+'/mobile',{recursive:true});
const previous=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):[];
const originals=list.map(file=>previous.find(item=>item.optimized===file)?.original||file);
(async()=>{const manifest=[];for(const original of originals){
 const metadata=await sharp(original).metadata(),animated=(metadata.pages||1)>1;
 const stem=path.basename(original,path.extname(original)).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');
 const optimized=folder+'/'+stem+'.webp';
 let pipeline=sharp(original,{animated});if(!animated)pipeline=pipeline.rotate();
 pipeline=pipeline.resize({width:640,height:1138,fit:'inside',withoutEnlargement:true});
 await pipeline.webp({quality:78,effort:4,...(animated?{loop:metadata.loop||0,delay:metadata.delay}:{})}).toFile(optimized);
 // A still avoids continuous GIF decoding on touch devices and respects reduced motion.
 await sharp(original).rotate().resize({width:320,height:569,fit:'inside',withoutEnlargement:true}).webp({quality:74,effort:4}).toFile(folder+'/mobile/'+path.basename(optimized));
 const result=await sharp(optimized,{animated}).metadata();
 manifest.push({original,optimized,width:result.width,height:result.pageHeight||result.height,frames:result.pages||1,originalBytes:fs.statSync(original).size,optimizedBytes:fs.statSync(optimized).size,originalPixels:metadata.width*metadata.height*(metadata.pages||1),optimizedPixels:result.width*result.height});
 }
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(listFile,'// Webversies voor de fotowand en fototafel; de originelen blijven in img.\n// Opnieuw maken: node scripts/optimize-wall-photos.cjs (met sharp geïnstalleerd).\nexport const exampleImages = '+JSON.stringify(manifest.map(i=>i.optimized),null,2)+';\n');
 const total=key=>manifest.reduce((sum,item)=>sum+item[key],0);
 console.log(JSON.stringify({count:manifest.length,originalBytes:total('originalBytes'),optimizedBytes:total('optimizedBytes'),originalDecodedRGBAEstimate:total('originalPixels')*4,optimizedDecodedRGBAEstimate:total('optimizedPixels')*4,animated:manifest.filter(i=>i.frames>1)},null,2));
})();
