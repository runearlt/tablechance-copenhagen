import {mkdir,copyFile,rm} from 'node:fs/promises';
const files=['index.html','app.js','core.mjs','styles.css','restaurants.json','favicon.svg','leaflet.js','leaflet.css','LEAFLET-LICENSE.txt'];
await rm('dist',{recursive:true,force:true});
for(const f of files){await mkdir('dist/'+f.split('/').slice(0,-1).join('/'),{recursive:true});await copyFile(f,'dist/'+f)}
console.log('Built Copenhagen website');
