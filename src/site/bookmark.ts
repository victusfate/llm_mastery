export function mountBookmark() {
 const root=document.querySelector('.header-actions');if(!root)return;
 const button=document.createElement('button');button.textContent='Copy bookmark link';
 const status=document.createElement('span');status.className='small';status.setAttribute('role','status');
 button.onclick=async()=>{
  try{await navigator.clipboard.writeText(location.href);status.textContent='Page link copied. Progress stays in this browser; use Export progress to move devices.'}
  catch{status.textContent='Bookmark this page with your browser’s bookmark command. Export progress to move devices.'}
 };
 root.append(button,status);
}
