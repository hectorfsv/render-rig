/* rig-core.js — THE RENDER RIG'S ONE TABLE OF TRUTH (2026-09-27).
   The engines, their names and model ids, fal's list prices, the ratio lists, and the request builder that turns
   a mode's settings into the exact fields the webhook reads. Both pages load it: the console (index.html) reads
   its controls into a settings object and asks here for the price and the fields; the canvas (next/canvas.html)
   does the same per node. A price or a field changes HERE, once. No DOM, no fetch, no state: pure functions.

   The settings object, per kind (the canvas's own shape; the console's readSettings() builds the same):
     image   {prompt, ar, crea, use_style, style_str, seed, look}
     compose {prompt, res, ar, keep_framing, web, sysp, safety, seed, look}
     design  {prompt, words, quality, res, ar}
     upscale {factor, model, face, face_strength, subject, sharpen, denoise, fixc, up_prompt, up_crea, up_tex}
     video   {prompt, dur, audio, ar, neg, cfg, shot_type, shots, end_idx, elements, look}
     lite    {prompt, dur, vres, style, dmg, eng, ar, sound, end_idx, look}
     camera  {move, dur, res}   (PixVerse v4.5 since 2026-09-27: no sound)
     talk    {res, tr}
   plus, from the console's seed lock: prompt_same (send the words as '' so the writer is skipped), prior_prompt.
   The context x: {images:[{w,h}], audioSecs, hasVoice, noRoll}. Proven byte for byte against the console's requests
   recorded before this file existed: ./test/run.sh core (test/fixtures/core-requests.json). */
(function(root){
  'use strict';
  var C={};
  C.VERSION='2026-09-27b';
  C.N8N='https://hectorfsv.app.n8n.cloud';
  C.BASE=C.N8N+'/webhook/kling-form';
  C.DOWNLOAD=C.N8N+'/webhook/kling-download';

  /* ---------- the engines ---------- */
  C.ENGINE_NAME={video:'Kling 3.0 Pro',lite:'MiniMax H3 Max',image:'Krea 2 Large',compose:'Nano Banana Pro',design:'Grok Imagine 2.0',upscale:'Topaz',
    camera:'PixVerse v4.5 Camera',talk:'MiniMax H3 Max Lip Sync'};
  C.STYLE_NAME={'vhs':'VHS','retro-toon-70s':'Retro Toon 70s','low-poly':'Low Poly','hand-drawn':'Hand Drawn','16bit-pixel':'16-bit Pixel'};
  C.STYLES=[['','None'],['vhs','VHS'],['retro-toon-70s','70s Toon'],['low-poly','Low Poly'],['hand-drawn','Hand Drawn'],['16bit-pixel','16-bit Pixel']];
  // CAMERA = PixVerse v4.5 (2026-09-27): the three moves that held the scene in the paid proofs (no sound at all). The
  // H3 names stay readable for older jobs; n8n maps any of them onto a proven move.
  C.CAM_NAME={'rotate':'Rotate','orbit-left':'Orbit left','orbit-right':'Orbit right','orbit-360':'Full 360','crane-up':'Crane up','drop-down':'Drop down',
    'push-in':'Push in','pull-out':'Pull out','top-down':'Top-down reveal','hero-arc':'Hero arc'};
  C.MOVES=[['rotate','Rotate'],['crane-up','Crane up'],['push-in','Push in']];
  C.CAM_RES=[['540p','540p'],['720p','720p'],['1080p','1080p']];
  C.CAM_DURS=[['5','5 s'],['8','8 s']];
  // a size and a length as n8n reads them: an old 480P / 768P lands on 540p / 720p; 5 or 8 s; 1080p is 5 s only (fal)
  C.camRes=function(s){ var r=String((s&&s.res)||'720p').toLowerCase(); return {'540p':'540p','720p':'720p','1080p':'1080p','480p':'540p','768p':'720p'}[r]||'720p' };
  C.camDur=function(s){ return ((parseInt(s&&s.dur,10)||5)>=7 && C.camRes(s)!=='1080p') ? '8' : '5' };
  C.UPMODELS=[['Standard V2','Standard: most photos'],['High Fidelity V2','High Fidelity: fine detail'],['Low Resolution V2','Low Resolution: small or soft'],
    ['CGI','CGI: renders, illustration'],['Text Refine','Text Refine: screenshots, type'],['Recovery V2','Recovery: damaged'],['Standard MAX','Standard MAX'],
    ['Redefine','Redefine: its own prompt'],['Wonder 3','Wonder 3'],['Wonder','Wonder']];
  C.GEN_UPS=['Redefine','Wonder','Wonder 3','Standard MAX'];   // fal publishes no price for these: the meter is a floor
  // the ratios each engine offers, straight from the live schemas (the console's lists)
  C.AR={
    video:[['16:9','16:9'],['9:16','9:16'],['1:1','1:1']],
    krea:[['1:1','1:1'],['4:5','4:5'],['2:3','2:3'],['9:16','9:16'],['4:3','4:3'],['3:2','3:2'],['16:9','16:9'],['2.35:1','2.35']],
    nbp:[['auto','Auto'],['1:1','1:1'],['4:5','4:5'],['9:16','9:16'],['3:2','3:2'],['16:9','16:9']],
    design:[['3:4','3:4'],['auto','Auto'],['2:3','2:3'],['1:1','1:1'],['4:3','4:3'],['16:9','16:9'],['9:16','9:16']],
    lite:[['16:9','16:9'],['9:16','9:16'],['1:1','1:1'],['4:3','4:3'],['3:4','3:4'],['21:9','21:9']]
  };
  C.DESIGN_MAX_SRC=3;      // Grok's edit takes 3; n8n slices to 3 as well
  C.KREA_MAX_REFS=10;      // Detect & Prepare slices style refs to 10
  C.NBP_MAX=14;            // Nano Banana Pro takes up to 14
  C.MAXEDGE=2048;          // every source is shrunk to this on its long edge before it goes up (Upscale, Camera and Talk send the original)
  C.SUBMIT_CAP=9e6;        // the base64 the webhook is trusted to carry; a guess, conservative on purpose
  C.LOOK_FAMS=[
    ['format','Camera',  [['clean','Clean digital'],['35mm','35mm film'],['16mm','16mm film'],['dv','DV camcorder']]],
    ['lens','Lens',      [['sharp','Clean sharp'],['anamorphic','Anamorphic'],['vintage','Warm vintage'],['halation','Halation'],['macro','Macro']]],
    ['aperture','Depth', [['f1.4','f/1.4 - shallow'],['f4','f/4 - middling'],['f11','f/11 - deep']]],
    ['light','Light',    [['contre','Back-lit'],['practicals','Practicals only'],['window','Window'],['silhouette','Silhouette'],['hard','One hard source']]],
    ['palette','Grade',  [['teal','Teal & orange'],['bleach','Bleach bypass'],['sodium','Sodium night'],['steel','Cold steel'],['bw','Black & white'],['warm','Warm']]]
  ];
  // photographic jobs only: Design's recipe owns its own colour, Upscale has no writer, Camera and Talk take no words
  C.LOOK_BY_MODE={image:'all',compose:'all',video:'all',lite:'all',design:[],upscale:[],camera:[],talk:[]};
  C.lookFams=function(kind,s){ var m=(kind==='lite'&&s&&s.style)?[]:(C.LOOK_BY_MODE[kind]||[]);
    return m==='all'?C.LOOK_FAMS:C.LOOK_FAMS.filter(function(f){ return m.indexOf(f[0])>-1 }) };

  C.isClip=function(kind){ return kind==='video'||kind==='lite'||kind==='camera'||kind==='talk' };
  C.outOf=function(kind){ return C.isClip(kind)?'video':'image' };
  C.modelFor=function(kind,hasImage){
    if(kind==='video') return hasImage?'kling-i2v':'kling-t2v';
    return {lite:'h3',camera:'h3cam',talk:'h3talk',image:'krea',compose:'nbp',design:'grok'}[kind]||'topaz';
  };
  C.engineLabel=function(kind,s){
    if(kind==='lite'&&s){ if(s.style) return 'MiniMax H3 Max '+(C.STYLE_NAME[s.style]||s.style); if(s.eng==='turbo') return 'MiniMax H3 Max Turbo' }
    return C.ENGINE_NAME[kind]||'';
  };
  C.isGenUpscale=function(model){ return C.GEN_UPS.indexOf(model)>=0 };

  /* ---------- money: fal's list prices, quoted from its model pages, never estimated ---------- */
  C.perSec=function(r){ return r==='480P'?0.05:r==='1080P'?0.16:r==='2K'?0.32:0.08 };
  C.topazTier=function(mp){ return mp<=24?0.08:mp<=48?0.16:mp<=96?0.32:1.36 };
  // Talk bills the audio's whole seconds, 5 at least, 14.8 at most; 0 with no audio
  C.talkSecs=function(secs){ return secs>0 ? Math.ceil(Math.min(14.8,Math.max(5,secs))) : 0 };
  // Kling bills $0.112 a second, so real prices land on a third decimal: a meter that rounds is a meter that lies
  C.money=function(c){ return (Math.round(c*1000)%10) ? c.toFixed(3) : c.toFixed(2) };
  function num(v,lo,hi,d){ var x=parseFloat(v); if(!(x===x)) x=d; return Math.min(hi,Math.max(lo,x)) }
  function tf3(x){ return +x.toFixed(3) }
  function has(v){ return v!==null&&v!==undefined&&String(v).trim()!=='' }
  // the price of one run: kind, its settings, and what it has (pictures with sizes, audio seconds, a character voice)
  C.price=function(kind,s,x){
    s=s||{}; x=x||{}; var imgs=x.images||[], n=imgs.length;
    // PixVerse v4.5 Camera, fal's page: 5 s $0.15 at 540p, $0.20 at 720p, $0.40 at 1080p; 8 s costs double
    if(kind==='camera'){ var cr=C.camRes(s); return tf3((cr==='1080p'?0.40:cr==='540p'?0.15:0.20)*(C.camDur(s)==='8'?2:1)) }
    if(kind==='talk') return tf3(C.talkSecs(+x.audioSecs||0)*C.perSec(s.res));
    if(kind==='lite'){
      var ld=Math.min(15,Math.max(5,parseInt(s.dur,10)||5));
      if(s.style) return tf3(ld*0.08);
      if(s.eng==='turbo') return tf3(ld*(s.vres==='1080P'?0.08:0.04));
      return tf3(ld*(s.vres==='1080P'?0.16:0.08));   // list; fal's page shows 50% off, the Rig charges list (his call)
    }
    if(kind==='video'){
      var per=x.hasVoice?0.196:(s.audio?0.168:0.112);
      return tf3(Math.min(15,Math.max(3,parseInt(s.dur,10)||5))*per);
    }
    if(kind==='upscale'){
      var d=imgs[0]; if(!d||!d.w||!d.h) return 0;      // priced by the picture that comes OUT: unknown until the source is
      var f=num(s.factor,1,4,2); return C.topazTier((d.w*f*d.h*f)/1e6);
    }
    if(kind==='image') return (s.use_style&&n)?0.065:0.060;   // style references are the only thing that moves Krea off $0.060
    if(kind==='design'){
      var base=(s.res==='1K')?(s.quality==='low'?0.04:0.06):(s.quality==='low'?0.06:0.08);   // plus $0.01 per input, capped at 3
      return tf3(base+0.01*Math.min(n,C.DESIGN_MAX_SRC));
    }
    var c=s.res==='4K'?0.30:0.15; if(s.web) c+=0.015; return tf3(c);   // Nano Banana Pro
  };

  /* ---------- the request: the fields the webhook reads, and which pictures ride as image_0..N ----------
     Omission is meaningful: a field left out becomes null upstream and is dropped from the fal body, so the model
     applies its OWN default. Nothing here sends a placeholder to mean "unset". */
  C.fields=function(kind,s,x){
    s=s||{}; x=x||{}; var imgs=x.images||[], n=imgs.length, f={}, prompt=String(s.prompt||'').trim();
    var vhs=kind==='lite'&&s.style==='vhs';
    f.mode=kind==='upscale'?'upscale':(kind==='design'?'design':'generate');
    C.lookFams(kind,s).forEach(function(fam){ var v=s.look&&s.look[fam[0]]; if(v) f['look_'+fam[0]]=v });   // nothing for a family left on Auto
    f.model=C.modelFor(kind,n>0);
    if(kind!=='upscale'&&kind!=='camera'&&kind!=='talk') f.prompt=s.prompt_same?'':prompt;   // the same words again skip the writer
    if(has(s.prior_prompt)) f.prior_prompt=s.prior_prompt;
    // the ratio: never for Upscale, Camera, Talk, nor a clip from a frame (Kling and H3 inherit the frame's shape)
    var arShown=!(kind==='upscale'||kind==='camera'||kind==='talk'||(C.isClip(kind)&&n>0));
    if(arShown){ var ar=s.ar; if(ar==='auto'&&!n) ar=(kind==='design'?'3:4':'1:1'); if(has(ar)) f.aspect_ratio=vhs?'4:3':ar }
    var pick=[], original=false;
    if(kind==='upscale'){
      f.upscale_factor=String(s.factor); f.upscale_model=s.model; f.face_enhancement=s.face===false?'off':'on';
      if(has(s.face_strength)) f.face_strength=String(s.face_strength);
      if(has(s.subject)) f.subject_detection=s.subject;
      if(parseFloat(s.sharpen)) f.sharpen=String(s.sharpen);
      if(parseFloat(s.denoise)) f.denoise=String(s.denoise);
      if(parseFloat(s.fixc)) f.fix_compression=String(s.fixc);
      if(s.model==='Redefine'){ if(has(s.up_prompt)) f.up_prompt=String(s.up_prompt).trim(); if(has(s.up_crea)) f.up_creativity=String(s.up_crea); if(has(s.up_tex)) f.up_texture=String(s.up_tex) }
      pick=n?[0]:[]; original=true;   // the one place nothing is shrunk
    }else if(kind==='video'||kind==='lite'){
      f.duration=String(kind==='lite'?Math.min(15,Math.max(5,parseInt(s.dur,10)||5)):Math.min(15,Math.max(3,parseInt(s.dur,10)||5)));
      if(kind==='lite'){
        f.resolution=s.style?'768P':s.vres;
        if(s.style){ f.h3_style=s.style; if(vhs) f.h3_damage=s.dmg||'medium' }
        else if(s.eng==='turbo') f.h3_turbo='on';
      }else{
        if(s.audio||x.hasVoice) f.generate_audio='on';
        if(has(s.cfg)) f.cfg_scale=String(s.cfg);
        if(has(s.neg)) f.negative_prompt=String(s.neg).trim();
        if(s.shot_type&&s.shot_type!=='customize') f.shot_type=s.shot_type;
      }
      if(s.shots&&s.shots.length) f.multi_prompt=JSON.stringify(s.shots);
      if(has(s.end_idx)) f.end_image_idx=String(s.end_idx);
      if(kind==='video'&&s.elements&&s.elements.length) f.elements=JSON.stringify(s.elements.map(function(e){ return {frontal:e.frontal,refs:e.refs||[],voice_id:e.voice||e.voice_id||''} }));
      for(var i=0;i<n;i++) pick.push(i);
    }else if(kind==='camera'||kind==='talk'){
      pick=n?[0]:[]; original=true;   // straight to fal: the still (or the face) and the settings, no words, no writer
      if(kind==='camera'){ f.cam_move=s.move; f.duration=C.camDur(s); f.resolution=C.camRes(s) }   // PixVerse makes no sound: nothing about sound is sent
      else{ if(x.audioSecs>0) f.audio_secs=(+x.audioSecs).toFixed(2); f.resolution=s.res; if(s.tr) f.talk_transcribe='on' }
    }else{
      // every image run carries a seed: fal rolls one when the box is empty and Nano Banana never reports it back,
      // so rolling it here makes the seed under every render real (and the picture revisable)
      // (x.noRoll: the canvas asks for the fields to sign a node with; it rolls the seed itself at submit, so a random
      // seed never makes a node look changed)
      if(kind==='image'||kind==='compose'){ if(has(s.seed)) f.seed=String(s.seed).trim(); else if(!x.noRoll) f.seed=String(Math.floor(Math.random()*1e9)) }
      else if(has(s.seed)) f.seed=String(s.seed).trim();
      if(kind==='image'){
        f.creativity=s.crea;
        if(s.use_style&&n){ f.use_style_refs='on'; f.style_strength=String(s.style_str); for(var k=0;k<n;k++) pick.push(k) }
      }else if(kind==='design'){
        f.resolution=s.res; f.quality=s.quality;
        if(has(s.words)) f.exact_text=String(s.words).trim();
        for(var d=0;d<Math.min(n,C.DESIGN_MAX_SRC);d++) pick.push(d);   // send 3, so the request matches the quoted price
      }else{
        f.resolution=s.res;
        if(n===1) f.keep_framing=s.keep_framing===false?'off':'on';   // only one source has a framing question; n8n defaults it ON when absent
        if(has(s.safety)) f.safety_tolerance=String(s.safety);
        if(has(s.sysp)) f.system_prompt=String(s.sysp).trim();
        if(s.web) f.enable_web_search='on';
        for(var m=0;m<n;m++) pick.push(m);
      }
    }
    var audio=(kind==='talk')||(kind==='lite'&&!s.style&&s.sound==='mine');
    return {f:f,img:pick,original:original,tape:vhs,audio:audio};
  };

  /* ---------- what a run cannot do without: the one sentence, or '' ---------- */
  C.needs=function(kind,s,x){
    s=s||{}; x=x||{}; var n=(x.images||[]).length, prompt=String(s.prompt||'').trim(), shots=s.shots&&s.shots.length;
    if(kind==='upscale'&&!n) return 'Add a source image to upscale.';
    if(kind==='camera'&&!n) return 'Add a still: Camera moves through your first source.';
    if(kind==='talk'&&!n) return 'Add a face: Talk animates your first source.';
    if(kind==='talk'&&!(x.audioSecs>0)) return 'Add what they say: choose an audio file or record one.';
    if(kind==='lite'&&!s.style&&s.sound==='mine'&&!(x.audioSecs>0)) return 'Add your audio, or set Sound back to “H3 makes it”.';
    if(kind==='compose'&&!n&&!prompt) return 'Write a prompt, or add sources to combine.';
    if(kind==='image'&&!prompt) return 'Krea draws from words. Write a prompt.';
    if(kind==='design'&&!prompt&&!has(s.words)&&!n) return 'Describe the piece, type the words that go on it, or add a source.';
    if((kind==='video'||kind==='lite')&&!prompt&&!n&&!shots) return 'Write a prompt, add an opening frame, or write a shot list.';
    if((kind==='video'||kind==='lite')&&shots){ var tot=s.shots.reduce(function(a,q){ return a+(parseInt(q.duration,10)||0) },0), dur=parseInt(s.dur,10);
      if(tot!==dur) return 'Shot durations add up to '+tot+'s but the clip is '+dur+'s.' }
    return '';
  };

  if(typeof module!=='undefined'&&module.exports) module.exports=C;
  root.RigCore=C;
})(typeof window!=='undefined'?window:this);
