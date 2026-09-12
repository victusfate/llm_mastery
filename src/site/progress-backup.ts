import { validateState, type Progress } from './engine.ts';
const mainKey='llm-training-lab-v1';
export function isLearningDataKey(key:string):boolean {
 return key==='llm-mastery-hardware-v1'||/^llm-training-(?:lab-evidence|submodule)-\d{2}-\d{2}$/.test(key)||/^llm-training-zero-to-hero-l\d{1,2}$/.test(key);
}
export function createProgressBackup(state:Progress,storage:Storage) {
 const browserData:Record<string,string>={};
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(isLearningDataKey(key))browserData[key]=storage.getItem(key);
 }
 return {...state,browserData};
}
export function validateProgressBackup(input:unknown):{state:Progress;browserData?:Record<string,string>} {
 const state=validateState(input);
 const raw=(input as {browserData?:unknown}).browserData;
 if(raw===undefined)return {state};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid browser learning data');
 const entries=Object.entries(raw);
 if(entries.length>200)throw Error('Too many learning records');
 const browserData:Record<string,string>={};
 for(const [key,value] of entries){
  if(!isLearningDataKey(key)||typeof value!=='string'||value.length>30000)throw Error('Invalid learning record');
  if(key==='llm-mastery-hardware-v1')JSON.parse(value);
  browserData[key]=value;
 }
 return {state,browserData};
}
export function restoreProgressBackup(backup:ReturnType<typeof validateProgressBackup>,storage:Storage) {
 const keys=new Set([mainKey,...Object.keys(backup.browserData||{})]);
 if(backup.browserData)for(let i=0;i<storage.length;i++){const key=storage.key(i);if(isLearningDataKey(key))keys.add(key);}
 const before=new Map([...keys].map(key=>[key,storage.getItem(key)]));
 try {
  storage.setItem(mainKey,JSON.stringify(backup.state));
  if(backup.browserData)for(const key of keys){if(key===mainKey)continue;const value=backup.browserData[key];if(value===undefined)storage.removeItem(key);else storage.setItem(key,value);}
 }catch(error){
  for(const key of keys){try{storage.removeItem(key)}catch{}}
  for(const [key,value] of before){try{if(value!==null)storage.setItem(key,value)}catch{}}
  throw Error(`Could not restore browser storage. Keep your backup file. ${String(error)}`);
 }
}
