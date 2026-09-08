// Install kokoro-js@1.2.1 separately, or set KOKORO_MODULE to its entry point.
import { mkdir } from 'node:fs/promises';
const { KokoroTTS } = await import(process.env.KOKORO_MODULE || 'kokoro-js');
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {dtype:'q8', device:'cpu'});
const text = "Let's make this concrete. Your model gives two possible answers the same score. But only one answer is right. What should change? Before we touch the code, make a prediction. The correct answer should become more likely. Now we'll calculate the gradient, take one small step, and check whether that actually happened.";
await mkdir('site/audio', {recursive:true});
for (const voice of ['af_heart', 'bm_george', 'bf_emma']) {
 const started=performance.now();
 const audio=await tts.generate(text,{voice,speed:1});
 await audio.save(`site/audio/sample-kokoro-${voice}.wav`);
 console.log(`${voice}: ${((performance.now()-started)/1000).toFixed(1)}s generation`);
}
