/* Catalis - Stalis's IELTS. App core: helpers, data, progress, sync, speech, routing, vocabulary (SRS + dictionary).
   Feature modules (src/features/*.js) are pasted inside this closure right before the boot section by build.py. */
(function(){
'use strict';

/* ================= helpers ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=a=>a[Math.random()*a.length|0];
const DAY=86400000;
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const viFold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const enFold=s=>String(s).toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
const SPK='<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>';
const ic=(n,cls)=>`<svg class="i${cls?' '+cls:''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
function toast(msg,ms=2600){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),ms);}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const fmtTime=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const countWords=t=>(String(t).trim().match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)||[]).length;

/* ================= data ================= */
const LVS=[1,2,3,4,5,6,7,8]; const PHR_LV=L=>L>=6;
const LV_NAME={0:'Từ của bạn',1:'Nền tảng',2:'Trung cấp',3:'Học thuật',4:'Band 7+',5:'Chuyên gia',6:'Collocation',7:'Idiom',8:'Phrasal verb'};
const LV_BAND={1:'band 4.5-5.5',2:'band 5.5-6.5',3:'band 6.5-7.5',4:'band 7-8, theo chủ đề',5:'band 8.5-9, từ học thuật C2 và cách nói tự nhiên',6:'cụm từ hay đi cùng nhau, B2-C2, theo 13 chủ đề',7:'thành ngữ cho Speaking, B2-C2',8:'cụm động từ B2-C2'};
const V=[]; const VI=new Map(); const LV_COUNT=[0,0,0,0,0,0,0,0,0]; const loadedLv=new Set(); const lvLoading={};
async function loadLevel(L){
  if(loadedLv.has(L))return;
  if(!lvLoading[L])lvLoading[L]=(async()=>{
    const rows=await (await fetch('data/vocab-'+L+'.json')).json();
    rows.forEach((x,i)=>{const w={w:x[0],ipa:x[1],pos:x[2],vi:x[3],ex:x[4],exvi:x[5],col:x[6]||[],fam:x[7]||'',em:x[8]||'',topic:x[9]||'',lv:L,i,k:x[0].toLowerCase()};V.push(w);VI.set(w.k,w);});
    LV_COUNT[L]=rows.length; loadedLv.add(L);
  })();
  return lvLoading[L];
}
async function loadAllVocab(){await Promise.all(LVS.map(loadLevel));}
const JCACHE={};
function loadJSON(name){if(!JCACHE[name])JCACHE[name]=fetch('data/'+name+'.json').then(r=>{if(!r.ok)throw new Error(name);return r.json();}).catch(e=>{delete JCACHE[name];throw e;});return JCACHE[name];}

/* ================= band conversion ================= */
// raw score out of 40 -> band (commonly used tables, approximate)
const BAND_L=[[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5],[2,2],[1,1],[0,0]];
const BAND_RA=[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5],[2,2],[1,1],[0,0]];
const BAND_RG=[[40,9],[39,8.5],[37,8],[36,7.5],[34,7],[32,6.5],[30,6],[27,5.5],[23,5],[19,4.5],[15,4],[12,3.5],[9,3],[6,2.5],[3,2],[1,1],[0,0]];
function bandOf(skill,raw,total,exam){
  total=total||40; const r=Math.round(raw/total*40);
  const t=skill==='listening'?BAND_L:(exam||examType())==='general'?BAND_RG:BAND_RA;
  for(const [min,b] of t)if(r>=min)return b; return 0;
}
// overall = mean of the skill bands; .25 rounds up to .5 and .75 rounds up to the next whole band
function overallBand(bs){const v=bs.filter(x=>x!=null&&!isNaN(x));if(!v.length)return null;const a=v.reduce((s,x)=>s+x,0)/v.length;const f=Math.floor(a),r=a-f;return r<0.25?f:r<0.75?f+0.5:f+1;}
const fmtBand=b=>b==null?'-':(+b).toFixed(1);

/* ================= progress state ================= */
const DEFAULT={v:1,upd:0,settings:{lv:[1],newPerDay:10,mode:'en',voiceRate:0.95,accent:'en-GB',voiceF:'',voiceM:'',ipa:true,theme:''},srs:{},hist:{},day:{},scores:[],custom:[]};
const slugOf=n=>viFold(n).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30);
let WHO=store.get('catalis-who',null);
const PKEY=()=>WHO?'catalis-p:'+WHO.slug:'catalis-p';
let P=Object.assign(structuredClone(DEFAULT),store.get(PKEY(),{}));
P.settings=Object.assign({},DEFAULT.settings,P.settings||{});
let dirty=new Set();
function touch(part){P.upd=Date.now();dirty.add(part||'main');store.set(PKEY(),P);scheduleSync();}
function examType(){return (P.plan&&P.plan.exam)||'academic';}

/* SRS (SM-2 style), cards keyed by lowercase word */
function schedule(k,r){ // r: 0 again,1 hard,2 good,3 easy
  const now=Date.now(); let c=P.srs[k]||{iv:0,ef:2.5,n:0,l:0,due:now,s:0};
  if(r===0){c.l++;c.n=0;c.iv=0;c.ef=Math.max(1.3,c.ef-0.2);c.due=now+60*1000;c.s=1;}
  else{
    if(r===1){c.iv=c.iv<1?1:Math.max(1,Math.round(c.iv*1.2));c.ef=Math.max(1.3,c.ef-0.15);}
    else if(r===2){c.iv=c.n===0?1:c.n===1?3:Math.round(c.iv*c.ef);}
    else{c.iv=c.n===0?4:Math.round(Math.max(c.iv,1)*c.ef*1.3);c.ef+=0.15;}
    c.n++;c.s=2;c.due=today()+c.iv*DAY;
  }
  P.srs[k]=c; touch('main');
  return c;
}
function ivLabel(k,r){
  const c=Object.assign({iv:0,ef:2.5,n:0},P.srs[k]||{});
  if(r===0)return '1 phút';
  const iv= r===1?(c.iv<1?1:Math.max(1,Math.round(c.iv*1.2))): r===2?(c.n===0?1:c.n===1?3:Math.round(c.iv*c.ef)) : (c.n===0?4:Math.round(Math.max(c.iv,1)*c.ef*1.3));
  return iv<30? iv+' ngày' : iv<365? Math.round(iv/30)+' tháng' : (iv/365).toFixed(1)+' năm';
}
const known=k=>{const c=P.srs[k];return !!(c&&c.s===2&&c.iv>=7);};
const seen=k=>!!P.srs[k];
// level 0 = the learner's own words (dictionary or Phòng AI imports): always included
function dueList(levels){const now=Date.now();return V.filter(w=>(levels.includes(w.lv)||w.lv===0)&&P.srs[w.k]&&P.srs[w.k].due<=now).sort((a,b)=>P.srs[a.k].due-P.srs[b.k].due);}
function newToday(){const t=today();return Object.values(P.srs).filter(c=>c.first>=t&&!c.pl).length;}
// new words: the learner's own words first, then round-robin across the selected groups (hardest group first),
// so a band 8 learner does not wade through all the easier words before meeting harder ones
function newList(levels,limit){
  const out=V.filter(w=>w.lv===0&&!P.srs[w.k]).slice(0,limit);
  const pools=[...levels].sort((a,b)=>b-a).map(L=>V.filter(w=>w.lv===L&&!P.srs[w.k]));
  for(let i=0;out.length<limit&&pools.some(p=>i<p.length);i++)for(const p of pools){if(out.length>=limit)break;if(p[i])out.push(p[i]);}
  return out;
}
function streak(){let s=0,t=today();const on=k=>P.hist[k]||((P.day||{})[k]&&P.day[k].xp);if(!on(ymd(t)))t-=DAY;while(on(ymd(t))){s++;t-=DAY;}return s;}

/* ================= platform: /api/ai (Groq) and /api/sync (Upstash), locked by the group password ================= */
let AI=null, syncState='local', SYNC=null, WEB=null;
const getKey=()=>{try{return localStorage.getItem('catalis-key')||'';}catch(e){return '';}};
const setKey=v=>{try{v?localStorage.setItem('catalis-key',v):localStorage.removeItem('catalis-key');}catch(e){}};
async function initPlatform(){
  try{
    const r=await fetch('api/status',{cache:'no-store'});
    if(r.ok){WEB=await r.json();
      if(WEB.ai){AI=makeWebAI();refreshAIBits();}
      if(WEB.sync){SYNC='web'; if(getKey()) await pullRemote(); else syncState='off';}
    }
  }catch(e){}
  renderSync();
}
function askPassword(wrong){
  return new Promise(res=>{
    const m=modal(`<h2>Mã mời hoặc mật khẩu nhóm</h2>
      <p class="note">${wrong?'Mật khẩu chưa đúng. Nhập lại nhé.':'Nhập mã mời hoặc mật khẩu nhóm để mở trợ lý AI (chấm Writing, Speaking) và đồng bộ tiến độ giữa các máy. Mỗi máy chỉ cần nhập một lần.'}</p>
      <div id="gIn"></div><p class="small muted" id="gOr"></p>
      <form id="pwF" class="row"><input type="password" id="pwI" autocomplete="current-password" placeholder="Mã mời hoặc mật khẩu" style="flex:1 1 200px"><button class="btn primary" type="submit">Mở khóa</button></form><p class="small" id="pwMsg" style="color:var(--bad,#c33)"></p>`);
    let done=false; const fin=v=>{if(done)return;done=true;res(v);};
    if(typeof authMount==='function')authMount(m,()=>{m.close();fin(true);});
    $('#pwF',m.el).onsubmit=async e=>{e.preventDefault();const v=$('#pwI',m.el).value.trim();if(!v)return;if(await refSubmit(v,m)){m.close();fin(true);}};
    const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();fin(false);}});obs.observe(document.body,{childList:true});
    setTimeout(()=>$('#pwI',m.el).focus(),50);
  });
}
async function api(path,{method='POST',body}={}){
  for(let i=0;i<3;i++){
    if(!getKey()){const ok=await askPassword(false);if(!ok)throw {code:'not_granted'};}
    let r; const hd={'content-type':'application/json','x-app-key':getKey()};
    if(WHO){hd['x-user']=WHO.slug;if(WHO.pin)hd['x-user-pin']=WHO.pin;}
    try{r=await fetch(path,{method,headers:hd,body:body?JSON.stringify(body):undefined});}catch(e){throw {code:'network'};}
    if(r.status===401){setKey('');const ok=await askPassword(true);if(!ok)throw {code:'not_granted'};continue;}
    if(r.status===402){if(path.includes('sync'))throw {code:'inactive'};const ok=await askPassword(false);if(!ok)throw {code:'not_granted'};continue;}
    if(r.status===429)throw {code:'rate_limited'};
    if(r.status===403||(r.status===400&&path.includes('sync'))){const ok=await askPin(r.status===403&&WHO&&WHO.pin);if(!ok)throw {code:'not_granted'};continue;}
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw {code:j.error||'upstream',data:j.data};
    return j;
  }
  throw {code:'not_granted'};
}
function parseJSON(text){
  const t=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
  try{return JSON.parse(t);}catch(e){}
  const a=Math.min(...['{','['].map(c=>{const k=t.indexOf(c);return k<0?1e9:k;})), b=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));
  if(a<1e9&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}
  throw {code:'bad_json'};
}
function makeWebAI(){
  const call=async(input,opts={})=>{
    const messages=typeof input==='string'?[{role:'user',content:input}]:input;
    if(opts.onText)opts.onText({text:'AI đang viết...',delta:''});
    const j=await api('api/ai',{body:{messages,tier:opts.modelTier||'default'}});
    const text=String(j.text||'');
    if(opts.onText)opts.onText({text,delta:text});
    return {text,truncated:!!j.truncated};
  };
  call.json=async(input,opts={})=>{
    const add='\n\nChỉ trả về JSON hợp lệ, không thêm chữ nào khác, không bọc trong ```.';
    const msg=typeof input==='string'?input+add:input.map((m,i)=>i===input.length-1?{role:m.role,content:m.content+add}:m);
    const {text}=await call(msg,Object.assign({},opts,{onText:null}));
    return parseJSON(text);
  };
  return call;
}
async function ask(prompt,opts={}){ if(!AI)throw {code:'no_ai'}; return AI(prompt,opts); }
async function askJSON(prompt,opts={}){ if(!AI)throw {code:'no_ai'}; return AI.json(prompt,opts); }
function aiError(e){
  const c=e&&e.code;
  if(c==='no_ai')return 'Trợ lý AI chưa bật trên máy chủ (cần APP_PASSWORD và GROQ_API_KEY trong Vercel).';
  if(c==='not_granted')return 'Cần nhập mật khẩu nhóm để dùng phần này.';
  if(c==='rate_limited')return 'Đã chạm giới hạn lượt dùng miễn phí. Đợi một lúc rồi thử lại.';
  if(c==='no_key')return 'Chưa có API key cho AI trong Vercel (GROQ_API_KEY).';
  if(c==='no_password')return 'Chưa đặt mật khẩu nhóm trong Vercel (APP_PASSWORD).';
  if(c==='too_long')return 'Nội dung quá dài để gửi một lần. Rút ngắn rồi thử lại.';
  if(c==='billing')return 'Tài khoản API hết hạn mức miễn phí hôm nay.';
  if(c==='bad_json')return 'AI trả kết quả sai định dạng. Bấm thử lại.';
  if(c==='network')return 'Mất kết nối mạng. Kiểm tra mạng rồi thử lại.';
  return 'AI chưa trả lời được. Thử lại sau ít phút.';
}
function refreshAIBits(){$$('.need-ai').forEach(el=>el.hidden=!AI);$$('.no-ai').forEach(el=>el.hidden=!!AI);}

/* ---- sync ---- */
function adopt(m){P=Object.assign(structuredClone(DEFAULT),m);P.settings=Object.assign({},DEFAULT.settings,m.settings||{});store.set(PKEY(),P);applySettings();route(true);}
/* Merge two copies of the progress (this device and the server) instead of letting the newer one win:
   a fresh device must never wipe real progress. Per item, keep what shows more learning. */
function mergeP(a,b){
  if(!a||!a.upd)return structuredClone(b); if(!b||!b.upd)return structuredClone(a);
  const [nw,old]=(a.upd||0)>=(b.upd||0)?[a,b]:[b,a];
  const m=structuredClone(nw);
  const reviews=c=>(c.n||0)+(c.l||0);
  m.srs=Object.assign({},old.srs||{});
  for(const [k,c] of Object.entries(nw.srs||{})){const o=m.srs[k];m.srs[k]=!o||reviews(c)>reviews(o)||(reviews(c)===reviews(o)&&(c.due||0)>=(o.due||0))?c:o;}
  m.day=Object.assign({},old.day||{});
  for(const [d,x] of Object.entries(nw.day||{})){const o=m.day[d];if(!o){m.day[d]=x;continue;}const r={};for(const k of new Set([...Object.keys(o),...Object.keys(x)]))r[k]=Math.max(+o[k]||0,+x[k]||0);m.day[d]=r;}
  m.hist=Object.assign({},old.hist||{});for(const [d,n] of Object.entries(nw.hist||{}))m.hist[d]=Math.max(m.hist[d]||0,n);
  const uniq=(arr,key)=>{const seen=new Set();return arr.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true;});};
  m.scores=uniq([...(old.scores||[]),...(nw.scores||[])],x=>x.t+'|'+x.skill+'|'+(x.title||'')).sort((x,y)=>x.t-y.t).slice(-300);
  m.custom=uniq([...(nw.custom||[]),...(old.custom||[])],x=>String(x.w).toLowerCase());
  m.reports=uniq([...(old.reports||[]),...(nw.reports||[])],x=>x.d+'|'+x.h);
  for(const k of ['mist','dly','cul']){if(old[k]||nw[k])m[k]=Object.assign({},old[k]||{},nw[k]||{});}
  // placement: keep the newer test (placeV 2) if either side has it
  if(!(m.placeV>=2)&&old.placeV>=2){m.placeV=old.placeV;m.placed=old.placed;m.placeBand=old.placeBand;}
  m.upd=Math.max(a.upd||0,b.upd||0)+1;
  return m;
}
async function pullRemote(){
  try{
    const j=await api('api/sync',{method:'GET'});
    if(j.data){const m=mergeP(P,j.data);const changed=JSON.stringify(m)!==JSON.stringify(j.data);adopt(m);syncState='on';if(changed){dirty.add('main');await pushRemote();}return;}
    syncState='on';dirty.add('main');await pushRemote();
  }catch(e){console.warn('sync pull',e);syncState=e&&(e.code==='not_granted'||e.code==='inactive')?'off':'err';}
}
let syncTimer=null;
function scheduleSync(){if(!SYNC||syncState==='off')return;clearTimeout(syncTimer);syncTimer=setTimeout(pushRemote,2500);}
async function pushRemote(){
  if(!SYNC||!dirty.size)return; dirty.clear();
  try{await api('api/sync',{method:'PUT',body:{data:P,summary:typeof uiSummary==='function'?uiSummary():null}});syncState='on';}
  catch(e){if(e&&e.code==='stale'){await pullRemote();renderSync();return;}console.warn('sync push',e);dirty.add('main');syncState=e&&(e.code==='not_granted'||e.code==='inactive')?'off':'err';}
  renderSync();
}
function renderSync(){
  const el=$('#sync');if(!el)return;
  el.className='sync'+(syncState==='on'?' on':'');
  const t=syncState==='on'?'Đã đồng bộ':syncState==='err'?'Lỗi đồng bộ, đang lưu trên máy':syncState==='off'?'Bấm để bật đồng bộ':'Lưu trên máy này';
  el.title=t;el.innerHTML='<i></i><span class="sync-t">'+t+'</span>';
  el.style.cursor=syncState==='off'||syncState==='err'?'pointer':'';
  el.onclick=(syncState==='off'||syncState==='err')?async()=>{await pullRemote();renderSync();}:null;
}

/* ================= speech =================
   TTS: browser English voices (en-GB by default), or Azure neural voices through /api/tts when configured.
   say(text,{lang:'en-GB'|'en-AU'|'en-US', voice:'f'|'m', rate}) -> Promise (resolves when finished) */
let voices=[]; let curAudio=null;
const F_NAMES=/sonia|libby|maisie|serena|kate|martha|stephanie|fiona|moira|tessa|karen|samantha|victoria|susan|hazel|zira|aria|jenny|michelle|natasha|catherine|female|amy|emma|olivia|ava|allison|nicky|shelley|sandy|flo|grandma/i;
const M_NAMES=/ryan|daniel|arthur|oliver|thomas|george|alfie|guy|william|james|lee|gordon|david|mark|fred|alex|tom|aaron|rocko|reed|eddy|male|grandpa|ralph|albert|bruce|junior/i;
function voiceScore(v,lang){const n=v.name;let s=0;
  if(v.lang.replace('_','-').toLowerCase()===lang.toLowerCase())s+=40; else if(/^en/i.test(v.lang))s+=5;
  if(/natural|neural|online/i.test(n))s+=50; if(/premium/i.test(n))s+=45; if(/enhanced/i.test(n))s+=35; if(/google/i.test(n))s+=25;
  if(/novelty|whisper|bells|bad news|good news|boing|bubbles|cellos|jester|organ|superstar|trinoids|wobble|zarvox|hysterical/i.test(n))s-=200;
  return s;}
function loadVoices(){try{voices=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));}catch(e){}}
try{loadVoices();speechSynthesis.onvoiceschanged=()=>{loadVoices();};}catch(e){}
function pickVoice(lang,g){
  if(!voices.length)return null;
  const pref=g==='m'?P.settings.voiceM:P.settings.voiceF;
  if(pref&&lang===P.settings.accent){const v=voices.find(x=>x.name===pref);if(v)return v;}
  const genderOk=v=>g==='m'?M_NAMES.test(v.name)&&!F_NAMES.test(v.name):F_NAMES.test(v.name)&&!M_NAMES.test(v.name);
  const sorted=voices.slice().sort((a,b)=>voiceScore(b,lang)-voiceScore(a,lang));
  return sorted.find(v=>genderOk(v)&&voiceScore(v,lang)>=40)||sorted.find(genderOk)||sorted[0];
}
const TTS_CACHE=new Map(); let ttsFail=0;
const ttsOn=()=>!!(WEB&&WEB.tts&&getKey()&&ttsFail<3);
// fetch (or reuse) the neural voice audio for one line; resolves to a blob URL or null
function ttsURL(text,rate,lang,g){
  const key=lang+g+'|'+rate+'|'+text; if(TTS_CACHE.has(key))return TTS_CACHE.get(key);
  const ctl=new AbortController(); setTimeout(()=>ctl.abort(),7000); // never keep the learner waiting on a slow voice server
  const pr=fetch('api/tts',{method:'POST',signal:ctl.signal,headers:{'content-type':'application/json','x-app-key':getKey()},body:JSON.stringify({text,rate,lang,voice:g})})
    .then(async r=>{if(!r.ok)throw new Error('tts '+r.status);ttsFail=0;return URL.createObjectURL(await r.blob());})
    .catch(()=>{ttsFail++;TTS_CACHE.delete(key);return null;});
  TTS_CACHE.set(key,pr);
  if(TTS_CACHE.size>400){const k=TTS_CACHE.keys().next().value;const old=TTS_CACHE.get(k);TTS_CACHE.delete(k);Promise.resolve(old).then(u=>u&&URL.revokeObjectURL(u));}
  return pr;
}
// warm the cache for a line that will be played soon (listening scripts)
function ttsPrefetch(text,{rate,lang,voice='f'}={}){if(ttsOn())ttsURL(text,rate||P.settings.voiceRate,lang||P.settings.accent||'en-GB',voice);}
async function cloudTTS(text,rate,lang,g,tok){
  const url=await ttsURL(text,rate,lang,g); if(!url||tok!==sayToken)return !!url;
  return playURL(url);
}
/* pre-generated Kokoro audio for every fixed text in the app (audio/t/<h[:2]>/<h>.mp3, h = sha1(text) first 12 hex).
   Built by tools/collect_texts.py + tools/make_text_audio.py in GitHub Actions. British voices, so used for en-GB only. */
let TAUD=null;
function textAudioIndex(){if(!TAUD)TAUD=fetch('audio/t/index.json').then(r=>r.ok?r.json():[]).then(a=>new Set(a)).catch(()=>new Set());return TAUD;}
const HCACHE=new Map();
async function textHash(t){t=String(t).trim();if(HCACHE.has(t))return HCACHE.get(t);let h='';
  try{const b=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(t));h=[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,12);}catch(e){}
  HCACHE.set(t,h);return h;}
async function textAudioURL(t){const ix=await textAudioIndex();if(!ix.size)return null;const h=await textHash(t);return h&&ix.has(h)?'audio/t/'+h.slice(0,2)+'/'+h+'.mp3':null;}
let sayToken=0;
function say(text,{rate,lang,voice='f'}={}){
  const rr=rate||P.settings.voiceRate, L=lang||P.settings.accent||'en-GB'; stopSay(); const tok=++sayToken;
  if(L!=='en-US')return textAudioURL(text).then(u=>{if(tok!==sayToken)return;if(!u)return sayRest(text,rr,L,voice,tok);return playURL(u,rr/0.95).then(ok=>ok||tok!==sayToken?undefined:sayRest(text,rr,L,voice,tok));});
  return sayRest(text,rr,L,voice,tok);
}
function sayRest(text,rr,L,voice,tok){
  if(ttsOn())return cloudTTS(text,rr,L,voice,tok).then(ok=>ok||tok!==sayToken?undefined:sayLocal(text,{rate:rr,lang:L,voice:voice[0]},tok));
  return sayLocal(text,{rate:rr,lang:L,voice:voice[0]},tok);
}
function sayLocal(text,{rate,lang,voice},tok){
  return new Promise(res=>{
    try{
      const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=rate;
      const v=pickVoice(lang,voice); if(v)u.voice=v;
      if(voice==='m'&&v&&!M_NAMES.test(v.name))u.pitch=0.75;
      let done=false;const fin=()=>{if(done)return;done=true;res();};
      u.onend=fin;u.onerror=fin;speechSynthesis.speak(u);
      // safety timeout: some browsers never fire onend
      setTimeout(fin,Math.max(4000,text.length*120/rate));
      if(!voices.length&&!window.__ttsWarned)setTimeout(()=>{loadVoices();if(!voices.length&&!window.__ttsWarned){window.__ttsWarned=1;window.__voiceBanner&&window.__voiceBanner();}},800);
    }catch(e){res();}
  });
}
function playURL(url,rate){
  return new Promise(res=>{
    const a=new Audio(url); curAudio=a; if(rate)a.playbackRate=rate;
    a.onended=()=>res(true); a.onerror=()=>res(false);
    a.play().catch(()=>res(false));
  });
}
function stopAudio(){if(curAudio){try{curAudio.pause();}catch(e){}curAudio=null;}}
function stopSay(){sayToken++;stopAudio();try{speechSynthesis.cancel();}catch(e){}}
const speak=(text,opts)=>say(text,opts);
/* pre-generated human-like audio for listening scripts (Kokoro, audio/l/<part>/<line>.mp3, see tools/make_audio.py) */
let LAUD=null;
function lineAudioIndex(){if(!LAUD)LAUD=fetch('audio/l/index.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{}).catch(()=>({}));return LAUD;}
async function lineAudioURL(pid,li,n){const ix=await lineAudioIndex();const e=ix[pid];if(!e||(n&&e.n!==n))return null;return 'audio/l/'+pid+'/'+String(li).padStart(3,'0')+'.mp3';}
// play one script line: recorded file when available, otherwise TTS. o = {pid, li, n, t, lang, voice, rate}
async function sayLine(o){
  const u=o.pid!=null?await lineAudioURL(o.pid,o.li,o.n):null;
  if(u){stopSay();const tok=++sayToken;const ok=await playURL(u,(o.rate||P.settings.voiceRate)/0.95);if(ok||tok!==sayToken)return;}
  return say(o.t,{lang:o.lang,voice:o.voice,rate:o.rate});
}
function prefetchLine(o){lineAudioURL(o.pid,o.li,o.n).then(u=>{if(u){const a=new Audio();a.preload='auto';a.src=u;}else ttsPrefetch(o.t,{lang:o.lang,voice:o.voice});});}
lineAudioIndex();textAudioIndex();
document.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){e.preventDefault();const o={t:b.dataset.say,lang:b.dataset.lang||undefined,voice:b.dataset.voice||'f'};if(b.dataset.pid){o.pid=b.dataset.pid;o.li=+b.dataset.li;sayLine(o);}else say(o.t,o);}});

/* ================= voice input =================
   listen({lang, onText(text, isFinal), onEnd(finalText), continuous}) -> handle or null.
   Two engines:
   - browser speech recognition (live words), used on desktop Chrome/Edge/Safari;
   - record + Whisper on the server (api/stt), used on phones and browsers without recognition. Phone browsers
     handle live recognition badly (iPhone stops it when anything else uses the mic, Android repeats or cuts words).
   Whisper handle: {whisper:true, stop(): Promise<text>, url(): Promise<blobURL of the recording>}. */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const IS_MOBILE=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const CAN_REC=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
const whisperOK=()=>CAN_REC&&!!(WEB&&WEB.ai);
const useWhisper=()=>whisperOK()&&(IS_MOBILE||!SR);
const canListen=()=>useWhisper()||!!SR;
function recMime(){const c=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];try{for(const t of c)if(MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))return t;}catch(e){}return '';}
async function transcribe(blob,lang){
  for(let i=0;i<2;i++){
    if(!getKey()){const ok=await askPassword(false);if(!ok)return '';}
    let r;try{r=await fetch('api/stt?lang='+(lang||'en'),{method:'POST',headers:{'content-type':blob.type||'audio/webm','x-app-key':getKey()},body:blob});}
    catch(e){toast('Mất mạng nên chưa chuyển được giọng thành chữ.',3500);return '';}
    if(r.status===401){setKey('');continue;}
    if(!r.ok){toast(r.status===429?'Đã chạm giới hạn lượt chuyển giọng miễn phí, đợi một lát rồi thử lại.':r.status===413?'Bản ghi quá dài, nói ngắn hơn rồi thử lại.':'Chưa chuyển được giọng thành chữ, thử lại sau.',4000);return '';}
    const j=await r.json().catch(()=>({}));return String(j.text||'').trim();
  }
  return '';
}
function micDenied(){toast('Trình duyệt chưa cho dùng micro. Trên điện thoại: vào Cài đặt của trình duyệt, cho phép Micro cho trang này rồi tải lại.',5000);}
function listenWhisper({lang,onText,onEnd,continuous,maxMs=9000}){
  let stream=null,mr=null,chunks=[],ctx=null,timer=null,stopped=false,heard=false,alive=false,quietSince=0,started=Date.now();
  // create the audio context inside the tap (iPhone keeps it suspended otherwise); if it never reports sound we do not trust it
  try{const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();ctx.resume&&ctx.resume();}catch(e){ctx=null;}
  let resolveUrl;const urlP=new Promise(r=>resolveUrl=r);let textP=null;
  const code=String(lang||'en').slice(0,2);
  const cleanup=()=>{clearInterval(timer);try{ctx&&ctx.close();}catch(e){}if(stream)stream.getTracks().forEach(t=>t.stop());};
  const finish=()=>{
    if(textP)return textP;
    textP=new Promise(async res=>{
      stopped=true;
      const blob=await new Promise(r=>{if(!mr||mr.state==='inactive'){r(chunks.length?new Blob(chunks,{type:(mr&&mr.mimeType)||'audio/webm'}):null);return;}
        mr.onstop=()=>r(chunks.length?new Blob(chunks,{type:mr.mimeType||'audio/webm'}):null);try{mr.stop();}catch(e){r(null);}});
      cleanup();
      resolveUrl(blob?URL.createObjectURL(blob):null);
      let t='';if(blob&&(heard||!alive))t=await transcribe(blob,code);
      onText&&onText(t,true);onEnd&&onEnd(t);res(t);
    });
    return textP;
  };
  (async()=>{
    try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});}
    catch(e){micDenied();stopped=true;resolveUrl(null);textP=Promise.resolve('');onText&&onText('',true);onEnd&&onEnd('');return;}
    if(stopped){stream.getTracks().forEach(t=>t.stop());return;}
    const mt=recMime();try{mr=new MediaRecorder(stream,mt?{mimeType:mt,audioBitsPerSecond:48000}:{});}catch(e){mr=new MediaRecorder(stream);}
    mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};mr.start(250);
    // loudness watch: knows whether anything was said, and stops single answers after a pause
    let an=null,buf=null;
    try{if(ctx){const src=ctx.createMediaStreamSource(stream);an=ctx.createAnalyser();an.fftSize=1024;src.connect(an);buf=new Float32Array(an.fftSize);}}catch(e){an=null;}
    timer=setInterval(()=>{const now=Date.now();let rms=0;
      if(an){an.getFloatTimeDomainData(buf);let s=0;for(const v of buf)s+=v*v;rms=Math.sqrt(s/buf.length);}
      if(rms>1e-4)alive=true;
      if(rms>0.02){heard=true;quietSince=0;}else if(!quietSince)quietSince=now;
      if(!continuous){
        if(alive&&((heard&&quietSince&&now-quietSince>1300)||(!heard&&now-started>6000)))finish();
        else if(!alive&&now-started>4000)finish();   // no level reading on this device: fixed 4 s for one word
        else if(now-started>maxMs)finish();
      }
      else if(now-started>180000)finish();},100);
  })();
  return {whisper:true,stop:finish,url:()=>urlP};
}
function listenBrowser({lang,onText,onEnd,continuous}){
  if(!SR)return null;
  const rec=new SR(); rec.lang=lang; rec.interimResults=true; rec.continuous=continuous; rec.maxAlternatives=1;
  let finalText='', stopped=false, lastInterim='';
  rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)finalText+=r[0].transcript+' ';else interim+=r[0].transcript;}lastInterim=interim;onText&&onText((finalText+interim).trim(),false);};
  rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')micDenied();};
  rec.onend=()=>{if(!stopped&&continuous){try{rec.start();return;}catch(e){}}const t=(finalText.trim()||lastInterim.trim());onText&&onText(t,true);onEnd&&onEnd(t);};
  try{rec.start();}catch(e){return null;}
  return {stop(){stopped=true;try{rec.stop();}catch(e){}return Promise.resolve(finalText.trim());}};
}
function listen({lang='en-GB',onText,onEnd,continuous=true,maxMs}={}){
  if(useWhisper())return listenWhisper({lang,onText,onEnd,continuous,maxMs});
  return listenBrowser({lang,onText,onEnd,continuous});
}
/* audio recorder: await recorder() -> {stop():Promise<blobURL>} or null */
async function recorder(){
  if(!CAN_REC)return null;
  let stream; try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}catch(e){micDenied();return null;}
  const mt=recMime(); let mr; try{mr=new MediaRecorder(stream,mt?{mimeType:mt}:{});}catch(e){mr=new MediaRecorder(stream);}
  const chunks=[]; mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);}; mr.start(250);
  return {stop:()=>new Promise(res=>{mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());res(chunks.length?URL.createObjectURL(new Blob(chunks,{type:mr.mimeType||'audio/webm'})):null);};try{mr.stop();}catch(e){res(null);}})};
}

/* voice settings modal */
function openVoice(){
  const opts=g=>{const L=P.settings.accent;const list=voices.slice().sort((a,b)=>voiceScore(b,L)-voiceScore(a,L));const cur=pickVoice(L,g);
    return list.length?list.map(v=>`<option value="${esc(v.name)}" ${cur&&v.name===cur.name?'selected':''}>${esc(v.name)} (${esc(v.lang)})</option>`).join(''):'<option>Máy chưa có giọng tiếng Anh</option>';};
  const m=modal(`<h2>Giọng đọc</h2>
    <p class="note">${WEB&&WEB.tts?'Đang dùng giọng neural của Azure (cần mật khẩu nhóm), máy chỉ dùng giọng có sẵn khi mất mạng.':'App dùng giọng đọc tiếng Anh có sẵn trên máy. Bài nghe tự đổi giọng nam, nữ và giọng Anh, Úc, Mỹ nếu máy có.'}</p>
    <label class="label">Giọng mặc định</label><div class="row">${[['en-GB','Anh (UK)'],['en-AU','Úc'],['en-US','Mỹ']].map(([k,t])=>`<button class="chip" data-acc="${k}" aria-pressed="${P.settings.accent===k}">${t}</button>`).join('')}</div>
    <label class="label" for="vRate">Tốc độ</label>
    <div class="row"><input type="range" id="vRate" min="0.6" max="1.2" step="0.05" value="${P.settings.voiceRate}" style="flex:1"><span class="num" id="vRateT"></span></div>
    <label class="label" for="vF">Giọng nữ</label><div class="row"><select id="vF" style="flex:1 1 220px;min-width:0">${opts('f')}</select><button class="btn sm" id="vTF">Nghe thử</button></div>
    <label class="label" for="vM">Giọng nam</label><div class="row"><select id="vM" style="flex:1 1 220px;min-width:0">${opts('m')}</select><button class="btn sm" id="vTM">Nghe thử</button></div>
    <div class="vn"><b>Muốn giọng tự nhiên hơn:</b><br>
      Mac: System Settings -> Accessibility -> Spoken Content -> System Voice -> Manage Voices -> English (United Kingdom) -> tải giọng có chữ Premium hoặc Enhanced. Tải xong mở lại trang.<br>
      iPhone: Cài đặt -> Trợ năng -> Nội dung được đọc -> Giọng nói -> Tiếng Anh (Vương quốc Anh) -> chọn giọng Nâng cao.<br>
      Windows: dùng Edge, có sẵn giọng "Microsoft Sonia Online (Natural)" và "Ryan Online (Natural)".<br>
      Chrome: có "Google UK English Female" và "Google UK English Male".</div>`);
  const rt=()=>{$('#vRateT',m.el).textContent=Math.round(P.settings.voiceRate*100)+'%';};rt();
  $('#vRate',m.el).oninput=e=>{P.settings.voiceRate=+e.target.value;rt();};
  $('#vRate',m.el).onchange=()=>touch('main');
  $$('[data-acc]',m.el).forEach(b=>b.onclick=()=>{P.settings.accent=b.dataset.acc;P.settings.voiceF='';P.settings.voiceM='';touch('main');$$('[data-acc]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));$('#vF',m.el).innerHTML=opts('f');$('#vM',m.el).innerHTML=opts('m');});
  $('#vF',m.el).onchange=e=>{P.settings.voiceF=e.target.value;touch('main');};
  $('#vM',m.el).onchange=e=>{P.settings.voiceM=e.target.value;touch('main');};
  $('#vTF',m.el).onclick=()=>say('Good morning. In this part of the test, you will hear a conversation about booking a holiday cottage.',{voice:'f'});
  $('#vTM',m.el).onclick=()=>say('Right, so the first thing to say about urban planning is that it rarely follows a single plan.',{voice:'m'});
}

/* ================= routing ================= */
const VIEWS={};
let current='home';
function go(v){if(v===current){route();return;}current=v;try{history.pushState(null,'','#'+v);}catch(e){}route();window.scrollTo(0,0);}
window.addEventListener('popstate',()=>{const h=(location.hash||'').slice(1)||'home';if(VIEWS[h]&&h!==current){current=h;route();}});
function route(soft){
  if(typeof uiNav==='function')uiNav();
  if(soft&&['test','listen','read','write','speak'].includes(current))return;
  stopSay(); window.__leave&&window.__leave(); window.__leave=null;
  const v=$('#view'); v.innerHTML='';
  try{(VIEWS[current]||VIEWS.home)(v);}catch(e){console.error(e);v.innerHTML=`<div class="view"><p class="note">Có lỗi khi mở trang này. Tải lại trang rồi thử lại.</p></div>`;}
}
function applySettings(){
  if(P.settings.theme)document.documentElement.dataset.theme=P.settings.theme;else delete document.documentElement.dataset.theme;
}

/* ================= shared UI ================= */
function modal(html){
  const bg=document.createElement('div');bg.className='modal-bg';bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><button class="spk x" aria-label="Đóng"><svg class="i"><use href="#i-x"/></svg></button>${html}</div>`;
  document.body.appendChild(bg);const close=()=>{bg.remove();stopSay();document.removeEventListener('keydown',onk);};
  const onk=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onk);
  bg.addEventListener('click',e=>{if(e.target===bg)close();});$('.x',bg).onclick=close;return {el:$('.modal',bg),close};
}
function levelChips(sel,onChange,{multi=true,id='lvc'}={}){
  const html=`<div class="row lvchips" id="${id}">${LVS.map(L=>`<button class="chip" data-l="${L}" aria-pressed="${sel.includes(L)}" title="${LV_BAND[L]}">${LV_NAME[L]}</button>`).join('')}</div>`;
  setTimeout(()=>{$$('#'+id+' .chip').forEach(b=>b.onclick=()=>{
    const L=+b.dataset.l; let s;
    if(multi){s=sel.includes(L)?sel.filter(x=>x!==L):[...sel,L].sort();if(!s.length)return;} else s=[L];
    onChange(s);
  });});
  return html;
}
function subTabs(id,items,cur,onPick){
  setTimeout(()=>{$$('#'+id+' [data-t]').forEach(b=>b.onclick=()=>onPick(b.dataset.t));});
  return `<div class="row tabs" id="${id}" role="tablist">${items.map(([k,t])=>`<button class="chip" role="tab" data-t="${k}" aria-pressed="${k===cur}">${t}</button>`).join('')}</div>`;
}
/* timer: makeTimer(seconds, onTick(left), onEnd) -> {stop, left()} ; counts down once per second */
function makeTimer(sec,onTick,onEnd){
  let left=sec, id=setInterval(()=>{left--;onTick&&onTick(left);if(left<=0){clearInterval(id);id=null;onEnd&&onEnd();}},1000);
  onTick&&onTick(left);
  return {stop(){if(id)clearInterval(id);id=null;},left:()=>left};
}
/* generic quiz runner for mcq items {q, o:[...], a:index, w:'giải thích'} and fill items {q:'... ___ ...', a:'ans|alt', w}
   runQuiz(el,{title, items, kind, onDone(score,total)}) */
function runQuiz(el,{title,items,kind='review',onDone,intro=''}){
  let i=0,score=0;
  const draw=()=>{
    const x=items[i];
    if(!x){el.innerHTML=`<div class="view"><h2>${esc(title)}</h2><div class="panel quiz-end">${typeof mascot==='function'?mascot(score>=items.length*0.8?'yay':score>=items.length/2?'ok':'hmm',100):''}<h3>Đúng ${score}/${items.length} câu</h3><div class="row"><button class="btn primary" id="qzAgain">Làm lại</button><button class="btn" id="qzHome">Về Hôm nay</button></div></div></div>`;
      $('#qzAgain').onclick=()=>{i=0;score=0;items=shuffle(items);draw();};$('#qzHome').onclick=()=>go('home');onDone&&onDone(score,items.length);return;}
    const isMc=Array.isArray(x.o);
    el.innerHTML=`<div class="view"><div class="spread"><h2>${esc(title)}</h2><span class="note num">${i+1}/${items.length}</span></div>${i===0&&intro?`<p class="note">${intro}</p>`:''}
      <div class="panel qz">${x.pre||''}<div class="qz-q">${esc(x.q)}</div>
      ${isMc?`<div class="opts">${x.o.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`
        :`<form class="row" id="qzF"><input type="text" id="qzI" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ đáp án" style="flex:1 1 200px"><button class="btn primary">Kiểm tra</button></form>`}
      <div id="qzW"></div></div></div>`;
    const hl=$('.qz-hl',el);if(hl){const b=hl.closest('.qz-ctxb');b.scrollTop=hl.offsetTop-b.offsetTop-12;}
    const after=ok=>{if(ok)score++;else window.__mistake&&window.__mistake('q',x);if(ok&&window.__mistOk)window.__mistOk(x);
      window.__award&&window.__award(kind,1);
      $('#qzW').innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?'Đúng rồi.':'Chưa đúng.'}</b>${!ok&&!isMc?` Đáp án: <b>${esc(String(x.a).split('|')[0])}</b>.`:''} ${esc(x.w||'')}</div><button class="btn primary" id="qzN">Câu tiếp ${ic('chevron-right')}</button>`;
      $('#qzN').onclick=()=>{i++;draw();};$('#qzN').focus();};
    if(isMc)$$('[data-k]',el).forEach(b=>b.onclick=()=>{const k=+b.dataset.k;$$('[data-k]',el).forEach((y,j)=>{y.disabled=true;if(j===x.a)y.classList.add('right');else if(j===k)y.classList.add('wrong');});after(k===x.a);});
    else{$('#qzF').onsubmit=e=>{e.preventDefault();const v=$('#qzI').value;if(!v.trim())return;$('#qzI').disabled=true;after(checkAnswer(v,x.a));};setTimeout(()=>$('#qzI').focus(),30);}
  };
  draw();
}
/* answer check for gap fills: "carbon dioxide|CO2", ignores case, punctuation, articles at start, and number words */
const NUMW={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100};
function normAns(s){
  let t=String(s).toLowerCase().replace(/[’`]/g,"'").replace(/£|\$|€/g,'').replace(/(\d),(\d{3})/g,'$1$2').replace(/(\d)(st|nd|rd|th)\b/g,'$1')
    .replace(/[^a-z0-9.%':/ -]+/g,' ').replace(/-/g,' ').replace(/\s+/g,' ').trim();
  t=t.replace(/^(the|a|an) /,'').replace(/\.$/,'');
  t=t.split(' ').map(x=>NUMW[x]!=null?String(NUMW[x]):x).join(' ');
  return t;
}
function checkAnswer(input,answer){const v=normAns(input);if(!v)return false;return String(answer).split('|').some(a=>normAns(a)===v);}

/* ================= VOCAB: study (SRS) ================= */
let queue=[],qcur=null,revealed=false,sessDone=0;
function buildQueue(){
  const lv=P.settings.lv; const due=dueList(lv); const nw=newList(lv,Math.max(0,P.settings.newPerDay-newToday()));
  queue=[...due,...nw]; sessDone=0;
}
function ipaHTML(w){return P.settings.ipa!==false&&w.ipa?`<span class="ipa">${esc(w.ipa)}</span>`:'';}
VIEWS.study=async el=>{
  el.innerHTML='<div class="view"><p class="note">Đang tải từ vựng...</p></div>';
  await Promise.all(P.settings.lv.map(loadLevel));
  if(!queue.length||!queue.every(w=>P.settings.lv.includes(w.lv)||w.lv===0))buildQueue();
  el.innerHTML=`<div class="view"><div class="spread"><h2>Thẻ từ vựng</h2>
     <div class="row"><span class="label">Mặt trước</span>${[['en','Tiếng Anh'],['vi','Nghĩa'],['au','Nghe']].map(([m,t])=>`<button class="chip" data-m="${m}" aria-pressed="${P.settings.mode===m}">${t}</button>`).join('')}</div></div>
     ${levelChips(P.settings.lv,s=>{P.settings.lv=s;if(P.plan)P.plan.auto=false;touch('main');queue=[];VIEWS.study(el);},{id:'slv'})}
     <div class="study"><div id="cardBox"></div>
     <aside class="panel"><h3>Phiên này</h3><div id="sessInfo" class="small"></div>
      <p class="note">Lật thẻ rồi tự chấm: Quên thì gặp lại sau 1 phút, các mức còn lại đẩy lần ôn sau ra xa dần. Phím tắt: Space lật thẻ, 1 2 3 4 chấm điểm.</p>
      <button class="btn sm" id="addNew">Thêm 10 từ mới</button></aside></div></div>`;
  $$('[data-m]',el).forEach(b=>b.onclick=()=>{P.settings.mode=b.dataset.m;touch('main');$$('[data-m]',el).forEach(x=>x.setAttribute('aria-pressed',x.dataset.m===P.settings.mode));nextCard(true);});
  $('#addNew').onclick=()=>{const extra=newList(P.settings.lv,400).filter(w=>!queue.includes(w)).slice(0,10);queue.push(...extra);if(!qcur)nextCard();info();toast('Đã thêm '+extra.length+' từ mới vào phiên.');};
  nextCard(true);
};
function info(){const n=queue.filter(w=>!P.srs[w.k]).length;const s=$('#sessInfo');if(s)s.innerHTML=`Còn <b>${queue.length}</b> thẻ (${n} từ mới). Đã ôn <b>${sessDone}</b>.`;}
function nextCard(keep){if(!keep||!qcur)qcur=queue[0]||null;revealed=false;drawCard();info();}
function wordBack(w){
  return `${w.em?`<div class="emo">${w.em}</div>`:''}<div class="big en${PHR_LV(w.lv)?' ph':''}">${esc(w.w)}</div><div class="row" style="justify-content:center;gap:8px">${ipaHTML(w)}<span class="pill">${esc(w.pos)}</span></div>
    <div class="mean">${esc(w.vi)}</div>
    ${w.col&&w.col.length?`${PHR_LV(w.lv)?'<div class="small muted">Cụm liên quan</div>':''}<div class="cols">${w.col.map(c=>`<span class="cl-chip">${esc(c)}</span>`).join('')}</div>`:''}
    ${w.fam?`<div class="small muted">${PHR_LV(w.lv)?'Cách dùng':'Họ từ'}: ${esc(w.fam)}</div>`:''}
    <div class="ex"><button class="spk" data-say="${esc(w.ex)}" aria-label="Nghe câu">${SPK}</button><div><div class="en-s">${hiWord(w.ex,w.w)}</div><div class="vil">${esc(w.exvi)}</div></div></div>`;
}
function hiWord(sent,word){
  if(/\s/.test(word.trim())){ /* phrase: mark each content word */
    const ws=word.toLowerCase().replace(/\b(sb|sth|someone|something|one's|sb's|sth's)\b/g,' ').split(/[^a-z']+/).filter(x=>x.length>2&&!['the','and','for','with','into','from','than','that'].includes(x));
    let h=esc(sent);ws.forEach(x=>{const st=x.replace(/(e|y)$/,'').slice(0,Math.max(3,x.length-2));h=h.replace(new RegExp('\\b('+st.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"[a-z']*)",'i'),'<mark>$1</mark>');});return h;}
  const stem=word.toLowerCase().split(' ')[0].replace(/(e|y)$/,'').slice(0,Math.max(3,word.length-2));
  return esc(sent).replace(new RegExp('\\b('+stem.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[a-z]*)','i'),'<mark>$1</mark>');
}
function drawCard(){
  const box=$('#cardBox');if(!box)return; const w=qcur;
  if(!w){box.innerHTML=`<div class="card"><div class="done">${typeof mascot==='function'?mascot('yay',110):''}<h2>Xong phần thẻ hôm nay</h2><p class="note">Giỏi lắm! Quay lại ngày mai, hoặc học thêm vài từ mới.</p><div class="row" style="justify-content:center"><button class="btn primary" id="cdMore">Học 5 từ mới</button><button class="btn" id="cdGame">Chơi Tốc độ 60 giây</button></div></div></div>`;
    $('#cdMore').onclick=()=>{const extra=newList(P.settings.lv,400).filter(x=>!queue.includes(x)).slice(0,5);queue.push(...extra);nextCard();};
    $('#cdGame').onclick=()=>go('games');return;}
  const m=P.settings.mode, isNew=!P.srs[w.k];
  const front = m==='vi'?`${w.em?`<div class="emo">${w.em}</div>`:''}<div class="prompt-vi">${esc(w.vi)}</div><div class="small muted">${esc(w.pos)}</div>`
    : m==='au'?`<button class="btn primary" data-say="${esc(w.w)}">${ic('volume-2')} Nghe lại</button>`
    : `<div class="big en${PHR_LV(w.lv)?' ph':''}">${esc(w.w)}</div>${ipaHTML(w)}`;
  box.innerHTML=`<div class="card ${revealed?'back-in':'tap'}"><div class="corner"><span class="pill">${LV_NAME[w.lv]}</span>${w.topic?`<span class="pill">${esc(w.topic)}</span>`:''}${isNew?'<span class="pill ai">Mới</span>':''}</div>
    <div class="corner-r"><button class="spk" data-say="${esc(w.w)}" aria-label="Nghe">${SPK}</button><button class="spk" id="cInfo" aria-label="Chi tiết">${ic('book-open')}</button></div>
    ${revealed?wordBack(w):front}
    ${revealed?'':'<button class="btn primary" id="cFlip" style="margin-top:auto">Lật thẻ <span class="kbd">Space</span></button>'}
  </div>
  ${revealed?`<div class="rate rate-bar" style="margin-top:10px">${['Quên','Khó','Nhớ','Dễ'].map((t,i)=>`<button class="btn r${i}" data-r="${i}">${i===0?ic('rotate-ccw'):ic('check')}${t}<small>${ivLabel(w.k,i)}</small></button>`).join('')}</div>`:''}`;
  if(m==='au'&&!revealed)say(w.w);
  const card=$('.card',box); if(card&&!revealed)card.onclick=e=>{if(e.target.closest('button'))return;flip();};
  const f=$('#cFlip');if(f)f.onclick=flip;
  $('#cInfo').onclick=()=>openWord(w.k);
  $$('[data-r]',box).forEach(b=>b.onclick=()=>rate(+b.dataset.r));
}
function flip(){if(!qcur||revealed)return;revealed=true;drawCard();say(qcur.w);}
function rate(r){
  if(!qcur||!revealed)return; const w=qcur;
  const wasNew=!P.srs[w.k]; const c=schedule(w.k,r); if(!c.first)c.first=Date.now();
  window.__award&&window.__award(wasNew?'new':'review',1); if(r===0)window.__mistake&&window.__mistake('word',w.k);
  queue.shift(); sessDone++;
  if(r===0)queue.splice(Math.min(queue.length,4),0,w);
  qcur=null; nextCard();
}
document.addEventListener('keydown',e=>{
  if(current!=='study'||e.target.closest('input,textarea,select')||$('.modal-bg'))return;
  if(e.code==='Space'){e.preventDefault();flip();}
  else if(['1','2','3','4'].includes(e.key)&&revealed)rate(+e.key-1);
});

/* ================= VOCAB: dictionary ================= */
let dq='',dlv=[1,2,3,4,5],dshow=80,dfilter='all',dtopic='';
VIEWS.dict=async el=>{
  el.innerHTML='<div class="view"><p class="note">Đang tải từ điển...</p></div>';
  await loadAllVocab();
  const topics=[...new Set(V.filter(w=>w.topic).map(w=>w.topic))].sort();
  el.innerHTML=`<div class="view"><div class="spread"><h2>Từ điển IELTS</h2><span class="note num" id="dCount"></span></div>
   <div class="dict-tools"><input type="search" id="dq" placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt (không dấu cũng được)" value="${esc(dq)}">
    <select id="df"><option value="all">Tất cả</option><option value="new">Chưa học</option><option value="seen">Đang học</option><option value="known">Đã thuộc</option></select>
    <select id="dt"><option value="">Mọi chủ đề</option>${topics.map(t=>`<option ${t===dtopic?'selected':''}>${esc(t)}</option>`).join('')}</select></div>
   ${levelChips(dlv,s=>{dlv=s;dshow=80;VIEWS.dict(el);},{id:'dlv'})}
   <div class="wlist" id="dl"></div><button class="btn" id="dMore" hidden>Xem thêm</button>
   <div class="panel"><h3>Thêm từ của riêng bạn</h3><p class="note">Từ gặp khi đọc báo, xem phim... sẽ vào thẻ ôn như từ khác.${AI?' Để trống nghĩa thì AI điền giúp nghĩa, phiên âm và câu ví dụ.':''}</p>
    <div class="row"><input type="text" id="cw" placeholder="Từ tiếng Anh, ví dụ 'mitigate'" style="flex:1 1 160px" autocapitalize="off"><input type="text" id="cv" placeholder="Nghĩa tiếng Việt" style="flex:2 1 200px"><button class="btn sm" id="cAdd">Thêm</button></div>
    <div id="cList" class="row"></div></div></div>`;
  $('#df').value=dfilter;
  const draw=()=>{
    const q=dq.trim().toLowerCase(); const qf=viFold(q);
    let list=V.filter(w=>dlv.includes(w.lv)||w.lv===0);
    if(dtopic)list=list.filter(w=>w.topic===dtopic);
    if(dfilter==='new')list=list.filter(w=>!seen(w.k));else if(dfilter==='seen')list=list.filter(w=>seen(w.k)&&!known(w.k));else if(dfilter==='known')list=list.filter(w=>known(w.k));
    if(q){
      list=list.map(w=>{let s=0;
        if(w.k===q)s=100;else if(w.k.startsWith(q))s=60;else if(w.k.includes(q))s=30;
        if(!s&&w.fam&&w.fam.toLowerCase().includes(q))s=20;
        const v=viFold(w.vi);if(v.split(/[;,]\s*/).some(x=>x.replace(/\(.*?\)/g,'').trim()===qf))s=Math.max(s,80);else if(qf.length>1&&v.includes(qf))s=Math.max(s,25);
        return [s,w];}).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]||a[1].lv-b[1].lv).map(x=>x[1]);
    }
    $('#dCount').textContent=list.length+' từ';
    $('#dl').innerHTML=list.length?list.slice(0,dshow).map(w=>{const st=known(w.k)?'s2':seen(w.k)?'s1':'';
      return `<button class="wrow en-row" data-k="${esc(w.k)}"><span class="e">${w.em||''}</span><span class="h en">${esc(w.w)}</span><span class="p">${esc(w.ipa)}</span><span class="v">${esc(w.vi)}</span><span class="st row" style="gap:6px"><span class="pill">${esc(w.pos)}</span><span class="dot ${st}"></span></span></button>`;}).join(''):'<div class="empty">Không tìm thấy từ nào.</div>';
    $('#dMore').hidden=list.length<=dshow;
    $$('#dl .wrow').forEach(b=>b.onclick=()=>openWord(b.dataset.k));
  };
  let t;$('#dq').oninput=e=>{dq=e.target.value;dshow=80;clearTimeout(t);t=setTimeout(draw,120);};
  $('#df').onchange=e=>{dfilter=e.target.value;dshow=80;draw();};
  $('#dt').onchange=e=>{dtopic=e.target.value;dshow=80;draw();};
  $('#dMore').onclick=()=>{dshow+=120;draw();};
  const drawCustom=()=>{$('#cList').innerHTML=P.custom.map((c,i)=>`<span class="chip">${esc(c.w)} <span class="muted">${esc(c.vi)}</span> <button class="btn ghost sm" data-ci="${i}" aria-label="Xóa">x</button></span>`).join('');
    $$('[data-ci]').forEach(b=>b.onclick=()=>{const c=P.custom.splice(+b.dataset.ci,1)[0];if(c){const k=c.w.toLowerCase();const w=VI.get(k);if(w&&w.lv===0){VI.delete(k);V.splice(V.indexOf(w),1);}}touch('main');drawCustom();});};
  $('#cAdd').onclick=async()=>{
    const w=$('#cw').value.trim();if(!/[a-z]/i.test(w)){toast('Nhập từ tiếng Anh trước.');return;}
    if(VI.get(w.toLowerCase())&&VI.get(w.toLowerCase()).lv){toast('Từ này đã có trong từ điển.');openWord(w.toLowerCase());return;}
    let vi=$('#cv').value.trim(); let extra={};
    if(AI&&!vi){const b=$('#cAdd');b.disabled=true;b.textContent='AI đang điền...';
      try{extra=await askJSON(`Bạn là từ điển Anh-Việt cho người học IELTS. Với từ "${w}", trả JSON {"vi":"nghĩa tiếng Việt ngắn gọn","ipa":"phiên âm IPA giọng Anh (RP) có dấu /","pos":"n|v|adj|adv|phr","ex":"một câu ví dụ tiếng Anh tự nhiên 10-18 từ","exvi":"dịch câu ví dụ","col":["2-3 collocation thường gặp"]}.`,{modelTier:'quick'});vi=extra.vi||'';}
      catch(e){toast(aiError(e));}
      b.disabled=false;b.textContent='Thêm';}
    if(!vi){toast('Nhập nghĩa tiếng Việt.');return;}
    P.custom.push({w,vi,ipa:extra.ipa||'',pos:extra.pos||'',ex:extra.ex||'',exvi:extra.exvi||'',col:Array.isArray(extra.col)?extra.col.slice(0,3):[],t:Date.now()});
    addCustomWords();touch('main');
    $('#cw').value='';$('#cv').value='';drawCustom();toast('Đã thêm '+w);
  };
  draw();drawCustom();
};
function addCustomWords(){(P.custom||[]).forEach(c=>{const k=c.w.toLowerCase();if(VI.has(k))return;const w={w:c.w,ipa:c.ipa||'',pos:c.pos||'',vi:c.vi,ex:c.ex||'',exvi:c.exvi||'',col:c.col||[],fam:'',em:'',topic:'Của bạn',lv:0,i:0,k};V.push(w);VI.set(k,w);});}

/* word detail modal */
function openWord(k){
  const w=VI.get(String(k).toLowerCase());if(!w)return; const c=P.srs[w.k];
  const m=modal(`<div class="wd-head">${w.em?`<span class="em">${w.em}</span>`:''}<div style="min-width:0"><div class="h en">${esc(w.w)}</div>
     <div class="row" style="gap:8px">${w.ipa?`<span class="ipa">${esc(w.ipa)}</span>`:''}<span class="pill">${esc(w.pos)}</span>${w.lv?`<span class="pill">${LV_NAME[w.lv]}</span>`:''}${w.topic?`<span class="pill">${esc(w.topic)}</span>`:''}</div></div>
     <button class="spk" data-say="${esc(w.w)}" aria-label="Nghe" style="margin-left:auto">${SPK}</button></div>
   <div class="row small">${['en-GB','en-US','en-AU'].map(L=>`<button class="lnk" data-say="${esc(w.w)}" data-lang="${L}">${L==='en-GB'?'Anh':L==='en-US'?'Mỹ':'Úc'}</button>`).join(' ')}</div>
   ${c?`<div class="small muted">${known(w.k)?'Đã thuộc':'Đang học'}, ôn lại sau ${Math.max(0,Math.round((c.due-Date.now())/DAY))} ngày</div>`:''}
   <div style="font-size:19px;font-weight:600">${esc(w.vi)}</div>
   ${w.col&&w.col.length?`<div><span class="label">${PHR_LV(w.lv)?'Cụm liên quan':'Collocation'}</span><div class="cols">${w.col.map(x=>`<button class="cl-chip" data-say="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`:''}
   ${w.fam?`<div class="small"><span class="label">${PHR_LV(w.lv)?'Cách dùng':'Họ từ'}</span> ${esc(w.fam)}</div>`:''}
   ${w.ex?`<div class="ex"><button class="spk" data-say="${esc(w.ex)}" aria-label="Nghe câu">${SPK}</button><div><div class="en-s">${hiWord(w.ex,w.w)}</div><div class="muted small">${esc(w.exvi)}</div></div></div>`:''}
   <div class="row">${c?'':'<button class="btn sm" id="wdLearn">Thêm vào thẻ ôn</button>'}<button class="btn sm need-ai" id="wdMore">${ic('sparkles')} AI giải thích thêm</button><button class="btn ghost sm" id="wdRep">Báo lỗi</button></div>
   <div id="wdAiOut"></div>`);
  refreshAIBits();
  const l=$('#wdLearn',m.el);if(l)l.onclick=()=>{P.srs[w.k]={iv:0,ef:2.5,n:0,l:0,due:Date.now(),s:1,first:Date.now()};touch('main');l.remove();queue=[];toast('Đã thêm vào thẻ ôn hôm nay.');};
  $('#wdRep',m.el).onclick=()=>window.__report&&window.__report(w.w);
  $('#wdMore',m.el).onclick=async e=>{
    const b=e.currentTarget;b.disabled=true;const out=$('#wdAiOut',m.el);out.innerHTML='<div class="ai-out">AI đang viết...</div>';
    try{await ask(`Bạn là giáo viên IELTS cho người Việt. Giải thích từ "${w.w}" (${w.pos}, nghĩa: ${w.vi}) bằng tiếng Việt tự nhiên, ngắn gọn:
1. Cách dùng chính, sắc thái (trang trọng hay thân mật), có hợp với Writing học thuật không.
2. 4 collocation hay dùng trong IELTS, mỗi cái kèm nghĩa.
3. 3 câu ví dụ mới theo chủ đề IELTS (giáo dục, môi trường, công nghệ, xã hội...), mỗi câu kèm dịch.
4. Từ dễ nhầm hoặc từ đồng nghĩa và cách phân biệt.
5. Lỗi người Việt hay mắc với từ này (nếu có).
Không dùng markdown đậm, không dùng dấu gạch ngang dài. Văn bản thuần, xuống dòng rõ ràng.`,{onText:({text})=>{out.innerHTML=`<div class="ai-out">${esc(text)}</div>`;}});}
    catch(err){out.innerHTML=`<p class="note">${esc(aiError(err))}</p>`;}
    b.disabled=false;
  };
}

/* ================= boot ================= */
async function boot(){
  applySettings();
  if(typeof uiInit==='function')uiInit();
  const h=(location.hash||'').slice(1); if(VIEWS[h])current=h;
  route();
  loadLevel(1).then(()=>{if(['home','study'].includes(current))route();});
  initPlatform().then(()=>{if(current==='home'||current==='settings'||current==='friends')route(true);});
  loadAllVocab().then(()=>{addCustomWords();if(typeof uiNav==='function')uiNav();});
  if(typeof uiIntro==='function')setTimeout(()=>uiIntro(false),400);
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty.size&&SYNC){clearTimeout(syncTimer);pushRemote();}});
boot();
})();
