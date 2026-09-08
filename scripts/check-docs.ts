import { readdir, readFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { publicDirectories, publicFiles } from './build.ts';
const files:string[]=[];
async function collect(directory:string){for(const entry of await readdir(directory,{withFileTypes:true})){if(entry.name.startsWith('.')||entry.name==='private')continue;const path=join(directory,entry.name);if(entry.isDirectory())await collect(path);else if(entry.name.endsWith('.md'))files.push(path);}}
for(const directory of publicDirectories)await collect(directory);
files.push(...publicFiles.filter(f=>f.endsWith('.md')));
const errors:string[]=[];
for(const file of files){
 const text=await readFile(file,'utf8');
 if(text.split('\n').filter(line=>line.startsWith('```')).length%2)errors.push(`${file}: unclosed code fence`);
 for(const [,target] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)||target.startsWith('#'))continue;
  const local=decodeURIComponent(target.split('#')[0].split('?')[0]).replace(/^<|>$/g,'');
  if(!local)continue;
  try{await access(resolve(dirname(file),local))}catch{errors.push(`${file}: missing ${target}`)}
 }
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Checked ${files.length} public Markdown documents.`);
