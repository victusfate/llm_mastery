import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { compile, publicDirectories, publicFiles } from './build.ts';
const root=resolve('.'),port=Number(process.env.PORT || 8765);
const types:Record<string,string>={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.md':'text/plain; charset=utf-8','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml','.py':'text/plain; charset=utf-8'};
await compile();
createServer(async(request,response)=>{
 try {
  const url=new URL(request.url || '/',`http://localhost:${port}`);
  let path=decodeURIComponent(url.pathname);
  if(path==='/')path='/site/';
  if(path.endsWith('/'))path+='index.html';
  const parts=path.slice(1).split('/'),file=resolve(root,'.'+path);
  if(!file.startsWith(root+sep)||parts.some(p=>p.startsWith('.')||p==='private')||(!publicDirectories.includes(parts[0])&&!publicFiles.includes(parts.join('/')))||!types[extname(file)])throw new Error('Not public');
  if(!(await stat(file)).isFile())throw new Error('Not a file');
  if(path.endsWith('.md')&&!url.searchParams.has('raw')&&request.headers.accept?.includes('text/html')) {
   response.writeHead(302,{Location:'/site/read.html?doc='+encodeURIComponent(path.slice(1))});response.end();return;
  }
  const body=await readFile(file);
  response.writeHead(200,{'Content-Type':types[extname(file)],'Content-Length':body.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  response.end(request.method==='HEAD'?undefined:body);
 }catch{response.writeHead(404);response.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Training Lab: http://127.0.0.1:${port}/site/`));
