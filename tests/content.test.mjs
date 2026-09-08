import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseConcepts, findConcept, searchConcepts, conceptMatcher } from '../site/concepts.mjs';
import { readingURL } from '../site/reader-links.mjs';
import { markdown } from '../site/markdown.mjs';
import { labs } from '../site/labs.mjs';
import { submodules } from '../site/submodules.mjs';
const concepts=parseConcepts(readFileSync(new URL('../docs/12-concepts.md',import.meta.url),'utf8'));
test('concept aliases, related entries, and boundaries resolve',()=>{
 assert.equal(concepts.length,67);assert.equal(findConcept(concepts,'backpropagation').title,'Autograd');assert.equal(findConcept(concepts,'softmax').title,'Softmax');
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
