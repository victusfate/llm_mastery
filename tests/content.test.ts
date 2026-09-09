import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseConcepts, findConcept, searchConcepts, conceptMatcher } from '../src/site/concepts.ts';
import { readingURL } from '../src/site/reader-links.ts';
import { markdown } from '../src/site/markdown.ts';
import { labs } from '../src/site/labs.ts';
import { submodules } from '../src/site/submodules.ts';
const concepts=parseConcepts(readFileSync(new URL('../docs/12-concepts.md',import.meta.url),'utf8'));
test('concept aliases, related entries, and boundaries resolve',()=>{
 assert.equal(concepts.length,71);assert.equal(findConcept(concepts,'backpropagation').title,'Autograd');assert.equal(findConcept(concepts,'softmax').title,'Softmax');
 for(const concept of concepts){assert.ok(concept.body.includes('### Concrete example'));for(const related of concept.related)assert.ok(findConcept(concepts,related),related);}
 const matcher=conceptMatcher(concepts);assert.deepEqual([...('softmaximum softmax').matchAll(matcher)].map(m=>m[0]),['softmax']);assert.equal(searchConcepts(concepts,'ddp')[0].title,'DDP');
});
test('all lab and submodule pages have guidance and reference actual files',()=>{
 assert.equal(labs.length,52);assert.equal(submodules.length,35);
 for(const lab of labs){const text=readFileSync(new URL(lab.file,new URL('../site/',import.meta.url)),'utf8');assert.ok(text.includes('## Guided procedure'));assert.ok(text.includes('## Completion and transfer check'));}
 for(const unit of submodules){assert.ok(existsSync(new URL(unit.file,new URL('../site/',import.meta.url))));for(const id of unit.labs)assert.ok(labs.some(l=>l.id===id));}
});
test('reading URLs preserve a GitHub project prefix and external URLs',()=>{
 assert.equal(readingURL('../docs/06-resources.md','https://example.com/course/site/index.html'),'https://example.com/course/site/read.html?doc=docs%2F06-resources.md');
 assert.equal(readingURL('https://other.com/paper.md','https://example.com/docs/a.md'),'https://other.com/paper.md');
 assert.equal(readingURL('a.md?raw=1','https://example.com/docs/b.md'),'https://example.com/docs/a.md?raw=1');
});
test('reader renders lists, code, table headers and safe links',()=>{
 const rendered=markdown('# Title\n\n1. First\n2. Second\n\n| Name | Value |\n| --- | --- |\n| A | 2 |\n\n```python\nprint("<x>")\n```\n\n<script>bad()</script>\n[bad](javascript:alert)','https://example.com/docs/a.md');
 assert.ok(rendered.includes('<ol>'));assert.ok(rendered.includes('<th scope="col">'));assert.ok(rendered.includes('&lt;x&gt;'));assert.ok(!rendered.includes('<script>'));assert.ok(!rendered.includes('href="javascript:'));
});

import { visualSteps, conceptVisual } from '../src/site/concept-visuals.ts';
import { deeperResources } from '../src/site/deeper-resources.ts';
import { nextStudyStep, confidenceFeedback } from '../src/site/study-coach.ts';
import { freshState } from '../src/site/engine.ts';
import { safeTutorURL, tutorPrompt } from '../src/site/tutor.ts';
test('every concept has a definition, specific visual, and deeper references',()=>{
 for(const concept of concepts){assert.ok(concept.body.includes('### What it means'));assert.ok(visualSteps[concept.title]?.length>=3,concept.title);const graphic=conceptVisual(concept.title);assert.match(graphic,/<svg[^>]+role="img"/,concept.title);assert.match(graphic,/<desc>[^<]+<\/desc>/,concept.title);assert.match(graphic,/<(?:path|rect|circle) /,concept.title);assert.ok(!graphic.includes('NaN'),concept.title);assert.ok(deeperResources(concept.module).every(r=>r.url.startsWith('https://')&&r.purpose.length>20));}
});
test('study recommendations distinguish errors, assisted practice, and independent application',()=>{
 const state=freshState();assert.equal(nextStudyStep(state).kind,'learn');
 const attempt={question:'test',answer:'1',module:0,time:1,correct:false,assisted:false};
 state.history.push(attempt);assert.equal(nextStudyStep(state).kind,'repair');
 attempt.correct=true;attempt.assisted=true;assert.equal(nextStudyStep(state).kind,'recall');
 attempt.assisted=false;state.history.push({...attempt});assert.equal(nextStudyStep(state).kind,'build');
 state.reviews['0-0']={streak:1,attempts:1,correct:1,due:0,last:0};assert.equal(nextStudyStep(state).kind,'review');
 assert.ok(confidenceFeedback('high',false,false).includes('assumption'));
});
test('tutor handoffs preserve context and reject executable destinations',()=>{
 assert.throws(()=>safeTutorURL('javascript:alert(1)'));
 assert.throws(()=>safeTutorURL('https://user:pass@example.com/'));
 assert.equal(safeTutorURL('http://localhost:3000/'),'http://localhost:3000/');
 const prompt=tutorPrompt('Gradient','Example slope is −4.');assert.ok(prompt.includes('Example slope is −4.'));assert.ok(prompt.includes('wait for my answer'));
});

import { hardwarePlan, parseHardwareProfile } from '../src/site/hardware-profile.ts';
import { createProgressBackup, validateProgressBackup, restoreProgressBackup } from '../src/site/progress-backup.ts';
test('hardware guidance follows the learner and defaults to no cloud spending',()=>{
 assert.equal(parseHardwareProfile(null).cloud,'0');
 assert.ok(hardwarePlan({hardware:'cpu',memory:'unknown',cloud:'0'}).join(' ').includes('CPU'));
 assert.ok(hardwarePlan({hardware:'multi',memory:'8to16',cloud:'25'}).join(' ').includes('$25'));
 assert.equal(parseHardwareProfile({hardware:'inherited',cloud:'999'}).hardware,'browser');
});
test('full backup restores separate notes, rejects unrelated keys, and keeps old backups compatible',()=>{
 const map=new Map<string,string>();const storage={get length(){return map.size},key:(i:number)=>[...map.keys()][i],getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)},removeItem:(k:string)=>{map.delete(k)}} as Storage;
 storage.setItem('llm-training-lab-evidence-01-01','my evidence');storage.setItem('unrelated','keep');
 const full=validateProgressBackup(createProgressBackup(freshState(),storage));storage.setItem('llm-training-lab-evidence-01-02','old');restoreProgressBackup(full,storage);
 assert.equal(storage.getItem('llm-training-lab-evidence-01-01'),'my evidence');assert.equal(storage.getItem('llm-training-lab-evidence-01-02'),null);assert.equal(storage.getItem('unrelated'),'keep');
 restoreProgressBackup(validateProgressBackup(freshState()),storage);assert.equal(storage.getItem('llm-training-lab-evidence-01-01'),'my evidence');
 assert.throws(()=>validateProgressBackup({...freshState(),browserData:{unrelated:'override'}}));
});
