import type {Progress} from './engine.ts';
export function nextStudyStep(state:Progress,now=Date.now()):{kind:string;message:string} {
 const attempts=state.history.filter(a=>a.module===state.selected).slice(-4);
 const due=Object.entries(state.reviews).some(([key,r])=>key.startsWith(`${state.selected}-`)&&r.due<=now);
 if(!attempts.length)return {kind:'learn',message:'Begin with a definition and visual example. Predict what will happen before changing the interactive controls.'};
 const last=attempts.at(-1);
 if(!last.correct)return {kind:'repair',message:'Revisit the definition and visual for the missed idea. Explain why your prediction failed, then try a new example.'};
 if(last.assisted)return {kind:'recall',message:'The explanation helped. Close it and try a fresh question unaided before treating the idea as recalled.'};
 if(due)return {kind:'review',message:'A spaced check is due. Recall the idea without notes; use any difficulty to choose what to revisit.'};
 if(attempts.length>=2&&attempts.every(a=>a.correct&&!a.assisted))return {kind:'build',message:'Recent unaided checks are correct. Apply the idea in a lab and defend the result. Numerical recall alone does not establish practical mastery.'};
 return {kind:'practice',message:'Try a different example unaided. If you can explain the mechanism, continue to a lab or follow a deeper reading.'};
}
export function renderCoach(root:HTMLElement,state:Progress) {
 const step=nextStudyStep(state);
 root.replaceChildren();
 const heading=document.createElement('h2');heading.textContent='Your next learning step';
 const text=document.createElement('p');text.textContent=step.message;
 const link=document.createElement('a');link.href='read.html?doc=docs/15-learning-paths.md';link.textContent='Choose a learning route and workload';
 root.append(heading,text,link);
}
export function confidenceFeedback(confidence:string,correct:boolean,assisted:boolean):string {
 if(assisted)return 'This was assisted practice. Recheck unaided to calibrate confidence.';
 if(confidence==='high'&&!correct)return 'High confidence and a missed answer: revisit the assumption, then test a contrasting example.';
 if(confidence==='low'&&correct)return 'Your unaided answer was correct despite uncertainty. Explain why it works, then repeat later to build confidence.';
 return correct?'Correct on this check. Look for the same understanding on a new problem and after a delay.':'Use this mismatch to choose the next explanation or experiment.';
}
