import { build } from 'esbuild';
import { mkdir, readdir, copyFile, rm, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
export const publicDirectories = ['site','docs','modules','assessments','projects','templates','progress','examples'];
export const publicFiles = ['README.md','START_HERE.md','CONTRIBUTING.md','LICENSE.md','index.html','.nojekyll'];
export async function compile() {
 const entries = (await readdir('src/site')).filter(name=>name.endsWith('.ts')).map(name=>`src/site/${name}`);
 await build({entryPoints:entries,outdir:'site',outExtension:{'.js':'.mjs'},bundle:true,format:'esm',platform:'browser',target:'es2022',logLevel:'warning'});
}
async function copyTree(source:string,target:string) {
 await mkdir(target,{recursive:true});
 for(const entry of await readdir(source,{withFileTypes:true})) {
  if(entry.name.startsWith('.') || entry.name==='private' || entry.name.endsWith('.partial'))continue;
  const from=join(source,entry.name),to=join(target,entry.name);
  if(entry.isDirectory())await copyTree(from,to);
  else if(entry.isFile() && /\.(md|html|css|mjs|js|svg|mp3|wav|py)$/.test(entry.name))await copyFile(from,to);
 }
}
export async function buildSite() {
 await compile();
 const output=resolve('dist');
 await rm(output,{recursive:true,force:true});
 await mkdir(output,{recursive:true});
 for(const directory of publicDirectories)await copyTree(directory,join(output,directory));
 for(const file of publicFiles)await copyFile(file,join(output,file));
 // Content versions prevent an old stylesheet from being paired with new SVG markup.
 for(const name of await readdir(join(output,'site'))) {
  if(!name.endsWith('.html'))continue;
  const file=join(output,'site',name);
  let html=await readFile(file,'utf8');
  const assets=[...html.matchAll(/(?:href|src)="([^"/?]+\.(?:css|mjs))"/g)];
  for(const [,asset] of assets){
   const hash=createHash('sha256').update(await readFile(join(output,'site',asset))).digest('hex').slice(0,12);
   html=html.replaceAll(`"${asset}"`,`"${asset}?v=${hash}"`);
  }
  await writeFile(file,html);
 }
 console.log('Built static course in dist/');
}
if(process.argv[1]?.endsWith('/build.ts'))await buildSite();
