#!/usr/bin/env node
/* rig-core.js against the request fixture, with no browser: the same 22 configurations test/inject/core.txt
   drives through the console, here as settings objects, must give the fields and the price the console built
   (test/fixtures/core-requests.json, recorded before rig-core.js existed). Pictures and sounds are the pages'
   business, so a blob is compared as "the core asked for it" (image_N count, the audio flag).

     node test/check-rig-core.js

   Read-only. Sends nothing, spends nothing. */
const path = require('path');
const C = require(path.join(__dirname, '..', 'rig-core.js'));
const FIX = require(path.join(__dirname, 'fixtures', 'core-requests.json'));
const im = (w, h) => ({ w, h });
const two = [im(300, 200), im(340, 230)], one = [im(300, 200)];
// the 22 configurations, in the fixture's order: kind, settings, context
const CASES = [
  ['image', { prompt: 'a tiger on a rock', ar: '16:9', crea: 'low' }, {}],
  ['image', { prompt: 'a tiger', ar: '4:5', crea: 'high', use_style: true, style_str: '0.7', seed: '4242' }, { images: two }],
  ['image', { prompt: 'a tiger', ar: '16:9', crea: 'low', look: { format: '35mm', palette: 'teal', aperture: 'f1.4' } }, {}],
  ['compose', { prompt: 'a room', res: '4K', ar: '16:9', web: true, sysp: 'You are a cinematographer.' }, {}],
  ['compose', { prompt: 'him on a beach', res: '2K', ar: '3:2', keep_framing: false }, { images: one }],
  ['compose', { prompt: 'both', res: '2K', ar: 'auto', seed: '99', safety: '5' }, { images: two }],
  ['design', { prompt: 'a summer party flyer', words: 'SUMMER JAM\nFriday 9pm', quality: 'low', res: '1K', ar: '2:3' }, {}],
  ['design', { prompt: 'poster', quality: 'medium', res: '2K', ar: 'auto' }, { images: two }],
  ['upscale', { factor: '2.5', model: 'High Fidelity V2', face: true, face_strength: '0.6', subject: 'Foreground', sharpen: '0.2', denoise: '0.1', fixc: '0.3' }, { images: one }],
  ['upscale', { factor: '2', model: 'Redefine', face: false, up_prompt: 'restore the brickwork', up_crea: '4', up_tex: '2', sharpen: '0', denoise: '0', fixc: '0' }, { images: one }],
  ['video', { prompt: 'he walks in', dur: '7', audio: true, ar: '9:16', neg: 'blur, text', cfg: '0.7', shot_type: 'intelligent' }, {}],
  ['video', { prompt: 'it turns', dur: '5', audio: false, end_idx: '1', shot_type: 'customize' }, { images: two }],
  ['video', { prompt: 'x', dur: '5', ar: '16:9', shot_type: 'customize', shots: [{ prompt: 'she looks up', duration: '2' }, { prompt: 'she smiles', duration: '3' }] }, {}],
  ['video', { prompt: 'he speaks', dur: '5', audio: false, shot_type: 'customize', elements: [{ frontal: 0, refs: [1], voice: 'voice-1' }] }, { images: two, hasVoice: true }],
  ['lite', { prompt: 'it roars', dur: '5', vres: '768P', ar: '16:9', style: '', eng: 'max', sound: 'h3' }, {}],
  ['lite', { prompt: 'it roars', dur: '6', vres: '1080P', ar: '21:9', style: '', eng: 'turbo', sound: 'h3' }, {}],
  ['lite', { prompt: 'tape', dur: '5', vres: '768P', style: 'vhs', dmg: 'heavy', eng: 'max', sound: 'h3' }, { images: one }],
  ['lite', { prompt: 'blocks', dur: '5', vres: '768P', ar: '16:9', style: 'low-poly', eng: 'max', sound: 'h3', look: { format: '35mm' } }, {}],
  ['lite', { prompt: 'sing', dur: '5', vres: '768P', style: '', eng: 'max', sound: 'mine', end_idx: '0' }, { images: one, audioSecs: 6.2 }],
  ['camera', { move: 'crane-up', dur: '8', res: '720p' }, { images: one }],
  ['camera', { move: 'push-in', dur: '5', res: '1080p' }, { images: one }],
  ['talk', { res: '2K', tr: true }, { images: one, audioSecs: 7.3 }],
];
let pass = 0, fail = 0;
CASES.forEach(([kind, s, x], i) => {
  const fx = FIX[i]; if (!fx) { fail++; console.log('  FAIL ' + i + ': no fixture'); return; }
  const r = C.fields(kind, s, x), price = C.price(kind, s, x), diffs = [];
  const want = Object.assign({}, fx.fields); delete want.action; delete want.password;
  const wantImgs = Object.keys(want).filter(k => /^image_\d+$/.test(k)).length, wantAudio = !!want.audio;
  Object.keys(want).forEach(k => { if (/^image_\d+$/.test(k) || k === 'audio') delete want[k]; });
  const got = Object.assign({}, r.f);
  const seedSet = s.seed !== undefined && s.seed !== '';
  if (!seedSet && 'seed' in want) { if (!('seed' in got)) diffs.push('seed: the console rolls one, the core did not'); delete want.seed; delete got.seed; }
  const keys = new Set([...Object.keys(want), ...Object.keys(got)]);
  keys.forEach(k => { if (want[k] !== got[k]) diffs.push(k + ': ' + JSON.stringify(want[k]) + ' -> ' + JSON.stringify(got[k])); });
  if (r.img.length !== wantImgs) diffs.push('pictures: ' + wantImgs + ' -> ' + r.img.length);
  if (r.audio !== wantAudio) diffs.push('audio: ' + wantAudio + ' -> ' + r.audio);
  const fxPrice = parseFloat(String(fx.cost).replace(/[^0-9.]/g, ''));
  if (Math.abs(fxPrice - price) > 1e-9) diffs.push('price: ' + fx.cost + ' -> ' + price);
  if (diffs.length) { fail++; console.log('  FAIL ' + i + ' ' + fx.name + ': ' + diffs.join(' | ')); } else pass++;
});
console.log((fail ? '  ' : '  ALL GREEN: ') + pass + ' pass / ' + fail + ' fail  (rig-core.js ' + C.VERSION + ' vs the console\'s recorded requests)');
process.exit(fail ? 1 : 0);
