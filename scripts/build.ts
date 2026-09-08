import { build } from 'esbuild';
import { mkdir, readdir, copyFile, rm, writeFile } from 'node:fs/promises';
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
 console.log('Built static course in dist/');
}
if(process.argv[1]?.endsWith('/build.ts'))await buildSite();
