/* ================= PHÒNG AI (lab): debate, paraphrase, real-text vocabulary ================= */
const LB_TYPE_VI={opinion:'Nêu quan điểm',discussion:'Thảo luận hai quan điểm',advantages:'Ưu và nhược điểm','problem-solution':'Vấn đề và giải pháp','two-part':'Câu hỏi hai phần'};
const LB_TOPIC_VI={education:'giáo dục',environment:'môi trường',technology:'công nghệ',health:'sức khỏe',work:'công việc',crime:'tội phạm',government:'chính phủ',media:'truyền thông',culture:'văn hóa',globalisation:'toàn cầu hóa',transport:'giao thông',family:'gia đình',tourism:'du lịch',city:'đô thị',science:'khoa học',language:'ngôn ngữ',sport:'thể thao',food:'ẩm thực'};
const LB_TABS=[['debate','Tranh luận'],['para','Paraphrase'],['real','Từ đời thật']];
const LB_POS=['phr','n','v','adj','adv','idiom'];
let LB_tab=null, LB_el=null;
const LB_mic={lis:null};

function LB_st(){P.lb=P.lb||{};const s=P.lb;s.debates=Array.isArray(s.debates)?s.debates:[];s.imports=Array.isArray(s.imports)?s.imports:[];
  s.para=Object.assign({sets:0,written:0,good:0,rsets:0,rq:0,rok:0,streak:0,best:0},s.para||{});return s;}
const LB_tgt=()=>{try{const t=+plCfg().target;return isFinite(t)&&t>0?t:7;}catch(e){return 7;}};
const LB_hi=()=>LB_tgt()>=8.5;
const LB_c=s=>String(s??'').replace(/\s*\u2014\s*/g,', ').replace(/\u2013/g,'-').replace(/[\u2192\u21d2\u27f6]/g,'->').replace(/[\u2190\u21d0]/g,'<-').replace(/\u2194/g,'<->').trim();
const LB_s=(v,max)=>{const s=typeof v==='string'?v:(v==null?'':typeof v==='number'?String(v):'');return LB_c(s).slice(0,max||2000);};
const LB_a=v=>Array.isArray(v)?v:[];
const LB_band=v=>{v=parseFloat(v);if(!isFinite(v))return null;return Math.min(9,Math.max(0,Math.round(v*2)/2));};
const LB_ten=v=>{v=parseFloat(v);if(!isFinite(v))return null;return Math.min(10,Math.max(0,Math.round(v)));};
const LB_date=t=>{const d=new Date(t);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();};
const LB_body=()=>LB_el&&document.body.contains(LB_el)?$('#lbBody',LB_el):null;
const LB_calib=()=>{const t=LB_tgt();return `The learner's target is IELTS band ${t}. Be demanding at that level: ${t>=8.5?'band 9 needs fully natural, precise, flexible language with only rare slips; anything vague, generic, slightly unnatural or imprecise must be flagged, and do not give 8 or 9 unless it is genuinely earned':'judge against the band descriptors for band '+t+' and do not inflate scores'}.`;};
const LB_rules='Write every explanation in Vietnamese (natural, plain, addressing the learner as "bạn") and every English example in British English. Never use the em dash character.';

function LB_loading(title,sub){return `<div class="panel lb-load">${mascot('idea',72)}<div class="lb-ldt"><b>${title}</b>${sub?`<p class="note">${sub}</p>`:''}<div class="lb-ld"><i></i></div></div></div>`;}
function LB_errHTML(e){return `<div class="panel lb-err">${mcSay('hmm',esc(aiError(e)),56)}<div class="row"><button class="btn primary" data-retry>${ic('rotate-ccw')} Thử lại</button></div></div>`;}
function LB_bindRetry(host,fn){const b=host&&$('[data-retry]',host);if(b)b.onclick=fn;}
function LB_stopMic(){if(LB_mic.lis){try{LB_mic.lis.stop();}catch(e){}LB_mic.lis=null;}}
function LB_stopAll(){LB_stopMic();stopSay();}

/* text box with mic: o = {ph, rows, send, extra, value, onInput, onSend, busy} */
function LB_composer(host,o){
  host.innerHTML=`<textarea class="lb-in en-s" rows="${o.rows||3}" placeholder="${esc(o.ph||'')}" ${o.busy?'disabled':''}>${esc(o.value||'')}</textarea>
    <div class="lb-cbar"><div class="row"><button type="button" class="btn sm" data-mic aria-pressed="false" ${o.busy?'disabled':''}>${ic('mic')} Nói</button>${canListen()?'':'<span class="note lb-nosr">Trình duyệt này không nhận giọng nói, hãy dùng Chrome hoặc Edge, hoặc gõ câu trả lời.</span>'}</div>
    <div class="row">${o.extra||''}<button type="button" class="btn primary" data-send ${o.busy?'disabled':''}>${o.send||'Gửi'}</button></div></div>`;
  const ta=$('textarea',host), mb=$('[data-mic]',host);
  const micOff=()=>{const L=LB_mic.lis;LB_mic.lis=null;let p=null;if(L){try{p=L.stop();}catch(e){}}
    if(L&&L.whisper&&p){mb.disabled=true;mb.innerHTML='Đang chuyển thành chữ...';return p.then(()=>{mb.disabled=false;mb.setAttribute('aria-pressed','false');mb.innerHTML=`${ic('mic')} Nói`;});}
    mb.setAttribute('aria-pressed','false');mb.innerHTML=`${ic('mic')} Nói`;return Promise.resolve();};
  mb.onclick=()=>{
    if(LB_mic.lis){micOff();return;}
    stopSay(); const base=ta.value.trim()?ta.value.trim()+' ':'';
    LB_mic.lis=listen({lang:'en-GB',onText:t=>{ta.value=base+t;o.onInput&&o.onInput(ta.value);}});
    if(!LB_mic.lis){toast('Máy này chưa ghi âm được, hãy gõ câu trả lời.',4000);ta.focus();return;}
    mb.setAttribute('aria-pressed','true');mb.innerHTML='<i class="lb-dot"></i> Đang nghe, bấm để dừng';
  };
  ta.oninput=()=>o.onInput&&o.onInput(ta.value);
  const send=async()=>{await micOff();const v=ta.value.trim();if(!v){toast('Bạn chưa nói hoặc gõ gì.');return;}o.onSend(v);};
  $('[data-send]',host).onclick=send;
  ta.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send();}};
  return ta;
}

/* ================= view ================= */
VIEWS.lab=el=>{
  LB_el=el; const st=LB_st();
  if(!LB_tab)LB_tab=LB_TABS.some(t=>t[0]===st.tab)?st.tab:'debate';
  window.__leave=LB_stopAll;
  el.innerHTML=`<div class="view lb"><div class="spread"><h2>Phòng AI</h2><span class="pill ai">${ic('sparkles')} Mục tiêu band ${fmtBand(LB_tgt())}</span></div>
    ${subTabs('lbTabs',LB_TABS,LB_tab,k=>{LB_stopAll();LB_tab=k;st.tab=k;touch('main');VIEWS.lab(el);})}
    <div id="lbBody" class="lb-body"></div></div>`;
  const body=$('#lbBody',el);
  if(!AI){
    const srv=WEB&&!WEB.ai;
    body.innerHTML=`<div class="panel lb-noai">${mcSay('hmm',srv?'Phòng AI cần trợ lý AI, nhưng máy chủ chưa bật AI. Người quản lý cần đặt APP_PASSWORD và GROQ_API_KEY trong Vercel.':'Jack cần trợ lý AI để tranh luận, chấm paraphrase và lọc từ cho bạn. Đăng nhập Google (hoặc nhập mã mời) để mở khóa, chỉ cần một lần.',72)}
      ${srv?'':`<div class="row"><button class="btn primary" id="lbKey">${ic('sparkles')} Đăng nhập hoặc nhập mã</button></div>`}
      <ul class="lb-ul note"><li><b>Tranh luận:</b> Jack phản biện từng lập luận của bạn bằng giọng nói, cuối trận chấm band và gợi ý dàn bài Task 2.</li><li><b>Paraphrase:</b> viết lại câu học thuật và được chấm độ giữ nghĩa, độ tự nhiên, độ khác cấu trúc.</li><li><b>Từ đời thật:</b> dán email, bài báo tiếng Anh, Jack lọc ra cụm từ đáng học và đưa vào thẻ ôn.</li></ul></div>`;
    if(!WEB){let n=0;const iv=setInterval(()=>{n++;if(!LB_body()||current!=='lab'){clearInterval(iv);return;}if(AI){clearInterval(iv);VIEWS.lab(el);}else if(WEB||n>40)clearInterval(iv);},250);}
    const k=$('#lbKey',body);
    if(k)k.onclick=async()=>{const ok=await askPassword(false);if(!ok)return;await initPlatform();if(!AI)toast(aiError({code:'no_ai'}),4500);if(LB_body())VIEWS.lab(el);};
    return;
  }
  if(LB_tab==='debate')LB_debDraw();else if(LB_tab==='para')LB_paDraw();else LB_rwDraw();
};

/* ================= 1. TRANH LUẬN ================= */
let LB_D={phase:'setup',rounds:4};
let LB_W2=null;
async function LB_t2(){if(LB_W2)return LB_W2;try{const d=await loadJSON('writing');LB_W2=LB_a(d&&d.t2).filter(x=>x&&x.prompt);}catch(e){LB_W2=[];}return LB_W2;}
const LB_motion=p=>String(p||'').split('\n').map(s=>s.trim()).filter(s=>s&&!/^(give reasons|write at least)/i.test(s)).join(' ');

async function LB_debDraw(){
  const body=LB_body(); if(!body||LB_tab!=='debate')return;
  const D=LB_D;
  if(D.phase==='setup'){
    const list=await LB_t2(); if(!LB_body()||LB_tab!=='debate'||LB_D.phase!=='setup')return;
    const hist=LB_st().debates.slice().reverse();
    body.innerHTML=`${mcSay('hi','Chọn một đề, nêu lập trường của bạn, rồi Jack sẽ phản biện từng câu trả lời. Bạn trả lời bằng giọng nói hoặc gõ. Cuối trận Jack chấm band và gợi ý dàn bài Task 2 từ chính những gì bạn đã nói.',64)}
      <div class="panel"><div class="spread"><h3>Chọn đề tranh luận</h3><button class="btn sm" id="lbRand">${ic('shapes')} Ngẫu nhiên</button></div>
        <div class="row lb-rounds"><span class="label">Số lượt</span>${[3,4,5,6].map(n=>`<button class="chip" data-rn="${n}" aria-pressed="${D.rounds===n}">${n}</button>`).join('')}</div>
        <div class="lb-plist">${list.map((x,i)=>`<button class="lb-pi" data-pi="${i}"><span class="row lb-pills"><span class="pill">${esc(LB_TYPE_VI[x.type]||x.type||'')}</span>${x.topic?`<span class="pill">${esc(LB_TOPIC_VI[x.topic]||x.topic)}</span>`:''}</span><span class="en lb-pt">${esc(LB_motion(x.prompt))}</span></button>`).join('')||'<p class="note">Chưa tải được kho đề. Bạn có thể tự gõ chủ đề bên dưới.</p>'}</div>
        <label class="label" for="lbOwn">Hoặc tự gõ chủ đề (tiếng Anh)</label>
        <textarea id="lbOwn" class="en-s" rows="2" placeholder="Ví dụ: Remote work does more harm than good to young professionals."></textarea>
        <div class="row"><button class="btn" id="lbOwnGo">Dùng chủ đề này</button></div></div>
      ${hist.length?`<div class="panel"><h3>Các trận gần đây</h3><div class="lb-hist">${hist.map((h,i)=>`<button class="lb-hi" data-hi="${hist.length-1-i}"><span class="en lb-pt">${esc(h.motion)}</span><span class="note num">${LB_date(h.t)}${h.overall!=null?' | Band '+fmtBand(h.overall):''}</span></button>`).join('')}</div></div>`:''}`;
    $$('[data-rn]',body).forEach(b=>b.onclick=()=>{D.rounds=+b.dataset.rn;$$('[data-rn]',body).forEach(x=>x.setAttribute('aria-pressed',x===b));});
    const start=(motion,x)=>{LB_D={phase:'pos',rounds:D.rounds,motion,type:x&&x.type||'',topic:x&&x.topic||'',draft:'',id:Date.now()};LB_debDraw();window.scrollTo(0,0);};
    $$('[data-pi]',body).forEach(b=>b.onclick=()=>{const x=list[+b.dataset.pi];start(LB_motion(x.prompt),x);});
    $('#lbRand',body).onclick=()=>{if(!list.length){toast('Chưa có kho đề, hãy tự gõ chủ đề.');return;}const x=pick(list);start(LB_motion(x.prompt),x);};
    $('#lbOwnGo',body).onclick=()=>{const v=$('#lbOwn',body).value.trim();if(countWords(v)<4){toast('Gõ chủ đề dài hơn một chút, ít nhất 4 từ.');return;}start(v.slice(0,400),null);};
    $$('[data-hi]',body).forEach(b=>b.onclick=()=>LB_debOld(LB_st().debates[+b.dataset.hi]));
    return;
  }
  const head=`<div class="panel lb-motion"><div class="spread"><span class="label">Đề tranh luận</span><div class="row">${D.type?`<span class="pill">${esc(LB_TYPE_VI[D.type]||D.type)}</span>`:''}<button class="btn ghost sm" id="lbBack">${ic('chevron-left')} Đổi đề</button></div></div>
    <div class="lb-mrow"><button class="spk" data-say="${esc(D.motion)}" data-voice="m" aria-label="Nghe đề">${SPK}</button><p class="en-s">${esc(D.motion)}</p></div></div>`;
  if(D.phase==='pos'){
    body.innerHTML=`${head}<div class="panel"><h3>Lập trường của bạn</h3><p class="note">Nói hoặc gõ ngắn gọn 1-3 câu: bạn đồng ý hay không, và lý do chính. Jack sẽ đứng ở phía ngược lại.</p><div id="lbComp"></div></div>`;
    LB_composer($('#lbComp',body),{ph:'I firmly believe that...',rows:3,send:'Bắt đầu tranh luận',value:D.draft,onInput:v=>D.draft=v,onSend:v=>LB_debStart(v)});
    LB_debBack(body); return;
  }
  /* run / done */
  const answered=D.turns.filter(t=>t.who==='me'&&!t.pos).length, round=Math.min(D.rounds,D.turns.filter(t=>t.who==='ai').length);
  body.innerHTML=`${head}
    <div class="lb-steps" aria-label="Lượt ${round} trên ${D.rounds}">${Array.from({length:D.rounds},(_,i)=>`<i class="${i<answered?'on':i===answered&&D.phase==='run'?'cur':''}"></i>`).join('')}</div>
    <div class="lb-chat" id="lbChat">${D.turns.map(LB_bub).join('')}${D.busy?'<div class="lb-msg ai lb-typing"><div class="lb-who">Jack</div><div class="lb-bub"><span class="lb-dots"><i></i><i></i><i></i></span></div></div>':''}</div>
    ${D.phase==='run'?`<div class="panel lb-comp"><div class="spread"><span class="label">Lượt ${Math.max(1,round)}/${D.rounds}: phản hồi của bạn</span></div><div id="lbComp"></div></div>`:''}
    <div id="lbDebOut" class="lb-out"></div>`;
  LB_debBack(body);
  if(D.phase==='run'){
    LB_composer($('#lbComp',body),{ph:D.busy?'Jack đang suy nghĩ...':'Bấm Nói để trả lời bằng giọng, hoặc gõ câu trả lời',rows:3,busy:D.busy,value:D.draft,onInput:v=>D.draft=v,
      extra:`<button type="button" class="btn ghost" data-end ${D.busy?'disabled':''}>Kết thúc</button>`,onSend:v=>LB_debReply(v)});
    $('[data-end]',body).onclick=()=>{LB_stopAll();if(!answered){toast('Bạn chưa trả lời lượt nào nên chưa có gì để tổng kết.');LB_D={phase:'setup',rounds:D.rounds};LB_debDraw();return;}LB_debFinish();};
  }else LB_debOut();
  const last=$('#lbChat .lb-msg:last-child',body); if(last&&last.scrollIntoView&&D.phase==='run')setTimeout(()=>{try{($('#lbComp',body)||last).scrollIntoView({block:'nearest',behavior:'smooth'});}catch(e){}},40);
}
function LB_debBack(body){const b=$('#lbBack',body);if(b)b.onclick=()=>{LB_stopAll();LB_D={phase:'setup',rounds:LB_D.rounds||4};LB_debDraw();};}
function LB_bub(t){
  if(t.who==='ai')return `<div class="lb-msg ai"><div class="lb-who">Jack phản biện</div><div class="lb-bub"><div class="en-s">${esc(t.text)}</div><button class="spk" data-say="${esc(t.text)}" data-voice="m" data-lang="en-GB" aria-label="Nghe lại">${SPK}</button></div></div>`;
  return `<div class="lb-msg me"><div class="lb-who">${t.pos?'Lập trường của bạn':'Bạn'}</div><div class="lb-bub"><div class="en-s">${esc(t.text)}</div></div></div>`;
}
function LB_debSys(D){
  return `You are Jack, a sharp but fair debate opponent helping a Vietnamese IELTS learner practise defending a position in spoken English.
Motion: "${D.motion}"
The learner's position: "${D.position}"
You argue the opposing side for ${D.rounds} rounds.
${LB_calib()}
Rules for every turn:
- Attack the learner's most recent argument with ONE focused counter-argument of 60 to 100 words. Go for its weakest point: an unsupported claim, a hasty generalisation, a vague term, an ignored trade-off or counter-example.
- Speak naturally in precise British English at band 9 level, as you would in a live debate. No lists, no markdown, no headings, no stage directions. Never use the em dash character.
- Do not simply concede, and do not mock. Acknowledge a genuinely strong point in a few words at most, then push back.
- End with exactly one pointed question that forces the learner to defend, clarify or refine their view.
- Reply with your spoken turn only.`;
}
async function LB_debStart(pos){
  const D=LB_D; stopSay();
  D.position=pos.slice(0,800); D.turns=[{who:'me',text:D.position,pos:true}]; D.phase='run'; D.draft='';
  D.msgs=[{role:'user',content:LB_debSys(D)+`\n\nRound 1 of ${D.rounds}. Give your first counter-argument to the learner's position now.`}];
  LB_debDraw(); await LB_debTurn();
}
async function LB_debReply(v){
  const D=LB_D; if(D.busy||D.phase!=='run')return; stopSay();
  D.turns.push({who:'me',text:v.slice(0,2000)}); D.draft='';
  const answered=D.turns.filter(t=>t.who==='me'&&!t.pos).length;
  if(answered>=D.rounds){LB_debFinish();return;}
  D.msgs.push({role:'user',content:`Learner (answer ${answered}): "${v.slice(0,2000)}"\n\n[Round ${answered+1} of ${D.rounds}. Counter this latest answer as instructed: one focused counter-argument, 60-100 words, ending with one pointed question.]`});
  LB_debDraw(); await LB_debTurn();
}
async function LB_debTurn(){
  const D=LB_D, id=D.id; D.busy=true; LB_debDraw();
  let text='';
  try{const r=await ask(D.msgs,{});text=LB_c(r&&r.text||'').replace(/^["“]|["”]$/g,'').replace(/^\s*(Jack|Opponent)\s*:\s*/i,'').trim();}
  catch(e){if(LB_D.id!==id)return;D.busy=false;LB_debDraw();const c=$('#lbDebOut',LB_body()||document);if(c){c.innerHTML=LB_errHTML(e);LB_bindRetry(c,()=>{c.innerHTML='';LB_debTurn();});}return;}
  if(LB_D.id!==id)return;
  if(countWords(text)<5)text='That sounds reasonable on the surface, but you have not shown why it holds in practice. Plenty of societies have tried exactly this and faced serious unintended consequences. What concrete evidence makes you confident your view survives those consequences?';
  if(countWords(text)>160)text=text.split(/\s+/).slice(0,150).join(' ');
  D.msgs.push({role:'assistant',content:text}); D.turns.push({who:'ai',text}); D.busy=false;
  LB_debDraw();
  if(LB_body()&&LB_tab==='debate')say(text,{voice:'m',lang:'en-GB'});
}
function LB_debFinish(){
  const D=LB_D; LB_stopAll(); D.phase='done'; D.busy=false;
  const n=D.turns.filter(t=>t.who==='me'&&!t.pos).length;
  if(!D.awarded&&n){D.awarded=1;award('speak',n);}
  LB_debDraw(); LB_debGrade();
}
function LB_debPrompt(D){
  const tr=D.turns.map(t=>(t.who==='ai'?'Opponent: ':t.pos?'Learner (opening position): ':'Learner: ')+t.text).join('\n\n');
  return `You are an experienced IELTS Speaking examiner and debate coach. A Vietnamese learner has just debated the motion below against an AI opponent. Evaluate ONLY the learner's turns.

Motion: "${D.motion}"
${LB_calib()}

Transcript (the learner's turns come from speech recognition or typing, so ignore punctuation and capitalisation):
"""
${tr.slice(0,20000)}
"""

Judge Fluency and Coherence (fc) on how well the learner develops, links and defends ideas; Lexical Resource (lr) and Grammatical Range and Accuracy (gra) on the learner's words. Judge Pronunciation (pr) cautiously: you only have a transcript, so use only indirect evidence such as recognition errors that suggest mispronounced words, and otherwise keep it close to the other bands.

Return JSON only with this exact shape:
{"winner_point":"Vietnamese: the learner's strongest moment, quoting their exact words","weak":[{"quote":"the learner's exact words","issue":"Vietnamese: the logical gap, vague claim or unsupported point","better":"a stronger English version of that argument"}],"language":[{"orig":"an exact phrase the learner used","upgrade":"a more precise band 9 phrasing","why":"Vietnamese"}],"essay_plan":"Vietnamese: how to turn this debate into a band 9 Task 2 plan: clear position, 2-3 body ideas with support, and the concession to include and rebut","bands":{"fc":7,"lr":7,"gra":7,"pr":7}}
Rules: "quote" and "orig" must be copied from the learner's turns. Give 2 to 4 weak items and 3 to 6 language items. Each band is a number from 0 to 9 in steps of 0.5. ${LB_rules}`;
}
function LB_normDeb(j){
  j=j&&typeof j==='object'?j:{}; const b=j.bands&&typeof j.bands==='object'?j.bands:{};
  const bands={fc:LB_band(b.fc),lr:LB_band(b.lr),gra:LB_band(b.gra),pr:LB_band(b.pr)};
  if(Object.values(bands).every(v=>v==null))throw {code:'bad_json'};
  const weak=LB_a(j.weak).filter(x=>x&&typeof x==='object').map(x=>({quote:LB_s(x.quote,400),issue:LB_s(x.issue,600),better:LB_s(x.better,600)})).filter(x=>x.issue||x.better).slice(0,6);
  const language=LB_a(j.language).filter(x=>x&&typeof x==='object').map(x=>({orig:LB_s(x.orig,200),upgrade:LB_s(x.upgrade,300),why:LB_s(x.why,400)})).filter(x=>x.upgrade).slice(0,8);
  return {bands,overall:overallBand(Object.values(bands)),winner:LB_s(j.winner_point,800),weak,language,plan:LB_s(j.essay_plan,2500)};
}
async function LB_debGrade(){
  const D=LB_D, id=D.id, out=()=>LB_body()&&$('#lbDebOut',LB_body());
  D.res=null; D.err=null; D.grading=true; LB_debOut();
  try{const j=await askJSON(LB_debPrompt(D));if(LB_D.id!==id)return;D.res=LB_normDeb(j);}
  catch(e){if(LB_D.id!==id)return;D.err=e;}
  D.grading=false;
  if(D.res){const st=LB_st();st.debates.push({t:Date.now(),motion:D.motion,position:D.position,turns:D.turns.map(t=>({who:t.who,text:t.text,pos:!!t.pos})),res:D.res,overall:D.res.overall});
    if(st.debates.length>20)st.debates=st.debates.slice(-20);touch('main');}
  if(out())LB_debOut();
}
function LB_debOut(){
  const body=LB_body(); const c=body&&$('#lbDebOut',body); if(!c)return; const D=LB_D;
  if(D.grading){c.innerHTML=LB_loading('Jack đang tổng kết trận tranh luận, khoảng 15-30 giây','Đang đọc lại từng câu bạn nói để tìm điểm mạnh, lỗ hổng lập luận và cách nói hay hơn.');return;}
  if(D.err){c.innerHTML=LB_errHTML(D.err);LB_bindRetry(c,LB_debGrade);return;}
  if(!D.res)return;
  c.innerHTML=LB_debResHTML(D.res)+`<div class="row"><button class="btn primary" id="lbAgain">${ic('repeat')} Đấu lại đề này</button><button class="btn" id="lbNew">Tranh luận đề khác</button></div>`;
  $('#lbAgain',c).onclick=()=>{LB_stopAll();LB_D={phase:'pos',rounds:D.rounds,motion:D.motion,type:D.type,topic:D.topic,draft:'',id:Date.now()};LB_debDraw();window.scrollTo(0,0);};
  $('#lbNew',c).onclick=()=>{LB_stopAll();LB_D={phase:'setup',rounds:D.rounds};LB_debDraw();window.scrollTo(0,0);};
}
function LB_debResHTML(r){
  const crit=[['fc','Trôi chảy và mạch lạc','Fluency and Coherence'],['lr','Từ vựng','Lexical Resource'],['gra','Ngữ pháp','Grammar'],['pr','Phát âm','ước lượng từ bản ghi']];
  return `<div class="panel lb-res"><div class="lb-ovr"><div class="lb-ovb"><span class="label">Band nói ước tính</span><span class="band-big">${fmtBand(r.overall)}</span></div>
      ${r.winner?`<div class="lb-win">${mascot('yay',56)}<div><span class="label">Khoảnh khắc tốt nhất của bạn</span><p>${esc(r.winner)}</p></div></div>`:''}</div>
    <div class="lb-crits">${crit.map(([k,vi,en])=>`<div class="lb-cr"><b>${fmtBand(r.bands[k])}</b><span class="lb-crv">${vi}</span><span class="small muted">${en}</span></div>`).join('')}</div></div>
  ${r.weak.length?`<div class="panel"><h3>Chỗ lập luận còn hở</h3><div class="lb-items">${r.weak.map(w=>`<div class="lb-wk">${w.quote?`<q class="en lb-q">${esc(w.quote)}</q>`:''}${w.issue?`<p>${esc(w.issue)}</p>`:''}${w.better?`<div class="lb-better"><span class="label">Lập luận chặt hơn</span><div class="lb-mrow"><button class="spk" data-say="${esc(w.better)}" aria-label="Nghe">${SPK}</button><p class="en-s">${esc(w.better)}</p></div></div>`:''}</div>`).join('')}</div></div>`:''}
  ${r.language.length?`<div class="panel"><h3>Nâng cấp cách nói</h3><div class="lb-items">${r.language.map(l=>`<div class="lb-up">${l.orig?`<s class="en">${esc(l.orig)}</s>`:''}<div class="lb-mrow"><button class="spk" data-say="${esc(l.upgrade)}" aria-label="Nghe">${SPK}</button><b class="en">${esc(l.upgrade)}</b></div>${l.why?`<span class="note">${esc(l.why)}</span>`:''}</div>`).join('')}</div></div>`:''}
  ${r.plan?`<div class="panel"><h3>${ic('pen-line')} Từ tranh luận thành dàn bài Task 2</h3><div class="lb-plan">${esc(r.plan)}</div></div>`:''}`;
}
function LB_debOld(h){
  if(!h)return;
  const m=modal(`<h2>Trận tranh luận ${LB_date(h.t)}</h2><p class="en-s">${esc(h.motion)}</p><div class="lb-chat">${LB_a(h.turns).map(LB_bub).join('')}</div>${h.res?LB_debResHTML(h.res):''}`);
  m.el.classList.add('lb-modal');
}

/* ================= 2. PARAPHRASE ================= */
const LB_P={mode:'write',src:'mix',cur:null,paras:[''],res:null,err:null,busy:false,ropt:null,picked:[],checked:false};
let LB_POOL=null;
function LB_split(t){return String(t||'').replace(/\s+/g,' ').split(/(?<=[.!?])\s+(?=["“A-Z])/).map(s=>s.trim());}
async function LB_pool(){
  if(LB_POOL)return LB_POOL; const out=[]; const ok=s=>{const n=countWords(s);return n>=18&&n<=40&&/[.!?]$/.test(s)&&!/[_]{2,}|\?$/.test(s);};
  try{const r=await loadJSON('reading');LB_a(r).forEach(p=>LB_a(p.paras).forEach(pa=>LB_split(pa&&pa[1]).forEach(s=>{if(ok(s))out.push({s,src:'Reading: '+(p.title||'')});})));}catch(e){}
  try{const w=await loadJSON('writing');[['t1a','Task 1'],['t1g','Task 1 thư'],['t2','Task 2']].forEach(([k,n])=>LB_a(w&&w[k]).forEach(x=>{if(x.model9)String(x.model9).split(/\n\s*\n/).forEach(pa=>LB_split(pa).forEach(s=>{if(ok(s))out.push({s,src:'Bài mẫu band 9: '+n});}));}));}catch(e){}
  LB_POOL=out; return out;
}
async function LB_aiSentence(){
  const j=await askJSON(`Write one sentence of formal academic English, 22 to 34 words, of the kind found in IELTS Academic Reading passages or band 9 Task 2 essays, on a random IELTS topic (for example urban planning, linguistics, public health, archaeology, economics, ecology, psychology). It should contain at least one subordinate clause or nominalised phrase so it is worth paraphrasing. British English, no em dashes. Return JSON {"sentence":"...","topic":"one or two words"}.`,{modelTier:'quick'});
  const s=LB_s(j&&j.sentence,400); if(countWords(s)<10)throw {code:'bad_json'};
  return {s,src:'AI tạo'+(j.topic?': '+LB_s(j.topic,40):'')};
}
async function LB_paNext(){
  const P_=LB_P; P_.res=null;P_.err=null;P_.ropt=null;P_.picked=[];P_.checked=false;P_.paras=[''];stopSay();
  const pool=await LB_pool();
  const useAI=P_.src==='ai'||(P_.src==='mix'&&(Math.random()<0.34||!pool.length))||(!pool.length);
  if(useAI){
    P_.busy=true;P_.cur=null;P_.loadMsg='Jack đang soạn một câu học thuật mới...';LB_paDraw();
    try{P_.cur=await LB_aiSentence();}catch(e){P_.busy=false;if(pool.length){P_.cur=pick(pool);toast('Không tạo được câu mới, dùng câu trong kho.');}else{P_.err=e;LB_paDraw();return;}}
    P_.busy=false;
  }else P_.cur=pick(pool);
  if(P_.mode==='read')await LB_paRead();else LB_paDraw();
}
function LB_paStats(){
  const s=LB_st().para;
  const acc=s.rq?Math.round(s.rok/s.rq*100):null;
  return `<div class="lb-stats"><div><b class="num">${s.sets}</b><span>câu đã chấm</span></div><div><b class="num">${s.written?Math.round(s.good/s.written*100)+'%':'-'}</b><span>paraphrase đạt</span></div><div><b class="num">${acc==null?'-':acc+'%'}</b><span>đúng ở Reading</span></div><div><b class="num">${s.streak}</b><span>chuỗi đúng (cao nhất ${s.best})</span></div></div>`;
}
function LB_paDraw(){
  const body=LB_body(); if(!body||LB_tab!=='para')return; const S=LB_P;
  const top=`<div class="panel lb-pset"><div class="row lb-modes">${[['write','Tự viết paraphrase'],['read','Paraphrase cho Reading']].map(([k,t])=>`<button class="chip" data-pm="${k}" aria-pressed="${S.mode===k}">${t}</button>`).join('')}</div>
    <div class="row"><span class="label">Nguồn câu</span>${[['mix','Trộn'],['data','Bài đọc và bài mẫu'],['ai','AI tạo câu mới']].map(([k,t])=>`<button class="chip" data-ps="${k}" aria-pressed="${S.src===k}">${t}</button>`).join('')}</div>
    <p class="note">${S.mode==='write'?'Viết lại câu bằng từ và cấu trúc của bạn, giữ đúng nghĩa. Đổi cấu trúc câu (danh từ hóa, đổi chủ động bị động, đảo mệnh đề) được điểm cao hơn chỉ thay từ đồng nghĩa.':'Giống bẫy trong Reading: Jack đưa 4 cách diễn đạt lại, chỉ một số giữ đúng nghĩa. Chọn tất cả các câu bạn thấy giữ đúng nghĩa.'}</p></div>${LB_paStats()}`;
  if(S.err&&!S.cur){body.innerHTML=top+LB_errHTML(S.err);LB_bindRetry(body,LB_paNext);LB_paBind(body);return;}
  if(S.busy&&!S.cur){body.innerHTML=top+LB_loading(S.loadMsg||'Jack đang chuẩn bị...','');LB_paBind(body);return;}
  if(!S.cur){body.innerHTML=top+`<div class="panel">${mcSay('idea','Sẵn sàng thì bấm bắt đầu, Jack chọn một câu cho bạn.',56)}<div class="row"><button class="btn primary" id="lbPaGo">Bắt đầu</button></div></div>`;LB_paBind(body);$('#lbPaGo',body).onclick=LB_paNext;return;}
  const src=`<div class="panel lb-src"><div class="spread"><span class="label">Câu gốc</span><span class="pill">${esc(S.cur.src)}</span></div>
    <div class="lb-mrow"><button class="spk" data-say="${esc(S.cur.s)}" aria-label="Nghe câu gốc">${SPK}</button><p class="en-s lb-orig">${esc(S.cur.s)}</p></div><span class="note">${countWords(S.cur.s)} từ</span></div>`;
  let main='';
  if(S.mode==='write'){
    main=`<div class="panel"><h3>Cách viết lại của bạn</h3><div class="lb-pas">${S.paras.map((v,i)=>`<div class="lb-pa"><span class="lb-pn">${i+1}</span><textarea class="en-s" rows="3" data-pa="${i}" placeholder="Paraphrase ${i+1}" ${S.busy||S.res?'disabled':''}>${esc(v)}</textarea>${S.paras.length>1&&!S.res&&!S.busy?`<button class="btn ghost sm" data-rm="${i}" aria-label="Bỏ cách ${i+1}">${ic('x')}</button>`:''}</div>`).join('')}</div>
      ${S.res?'':`<div class="spread">${S.paras.length<3&&!S.busy?`<button class="btn sm" id="lbAdd">+ Thêm cách khác</button>`:'<span></span>'}<div class="row"><button class="btn ghost" id="lbSkip" ${S.busy?'disabled':''}>Đổi câu</button><button class="btn primary" id="lbGrade" ${S.busy?'disabled':''}>Chấm</button></div></div>`}</div>
      <div id="lbPaOut" class="lb-out"></div>`;
  }else{
    main=`<div id="lbPaOut" class="lb-out"></div>`;
  }
  body.innerHTML=top+src+main; LB_paBind(body);
  const out=$('#lbPaOut',body);
  if(S.mode==='write'){
    $$('[data-pa]',body).forEach(t=>t.oninput=()=>{S.paras[+t.dataset.pa]=t.value;});
    $$('[data-rm]',body).forEach(b=>b.onclick=()=>{S.paras.splice(+b.dataset.rm,1);LB_paDraw();});
    const a=$('#lbAdd',body);if(a)a.onclick=()=>{S.paras.push('');LB_paDraw();const ts=$$('[data-pa]',LB_body());ts[ts.length-1]&&ts[ts.length-1].focus();};
    const g=$('#lbGrade',body);if(g)g.onclick=LB_paGrade;
    const sk=$('#lbSkip',body);if(sk)sk.onclick=LB_paNext;
    if(S.busy)out.innerHTML=LB_loading('Jack đang chấm paraphrase, khoảng 10-20 giây','So nghĩa, độ tự nhiên và mức độ đổi cấu trúc với câu gốc.');
    else if(S.err){out.innerHTML=LB_errHTML(S.err);LB_bindRetry(out,LB_paGrade);}
    else if(S.res){out.innerHTML=LB_paResHTML(S.res)+`<div class="row"><button class="btn primary" id="lbNext">Câu tiếp theo ${ic('chevron-right')}</button></div>`;$('#lbNext',out).onclick=LB_paNext;}
  }else LB_paReadOut(out);
}
function LB_paBind(body){
  $$('[data-pm]',body).forEach(b=>b.onclick=()=>{if(LB_P.busy)return;const m=b.dataset.pm;if(m===LB_P.mode)return;LB_P.mode=m;
    if(LB_P.cur){LB_P.res=null;LB_P.err=null;LB_P.ropt=null;LB_P.picked=[];LB_P.checked=false;LB_P.paras=[''];if(m==='read')LB_paRead();else LB_paDraw();}else LB_paDraw();});
  $$('[data-ps]',body).forEach(b=>b.onclick=()=>{LB_P.src=b.dataset.ps;$$('[data-ps]',body).forEach(x=>x.setAttribute('aria-pressed',x===b));});
}
const LB_bar=(label,v)=>`<div class="lb-bar"><span>${label}</span><div class="lb-trk"><i class="${v==null?'':v>=8?'hi':v>=6?'mid':'lo'}" style="width:${v==null?0:v*10}%"></i></div><b class="num">${v==null?'-':v}</b></div>`;
function LB_paResHTML(r){
  return `<div class="panel"><h3>Kết quả</h3><div class="lb-items">${r.items.map((x,i)=>`<div class="lb-pr"><div class="spread"><span class="label">Cách ${i+1}</span>${x.band!=null?`<span class="pill ai">Band ${fmtBand(x.band)}</span>`:''}</div>
      <p class="en-s lb-mine">${esc(x.text)}</p>
      <div class="lb-bars">${LB_bar('Giữ nghĩa',x.meaning)}${LB_bar('Tự nhiên',x.naturalness)}${LB_bar('Đổi cấu trúc',x.change)}</div>
      ${x.comment?`<p>${esc(x.comment)}</p>`:''}
      ${x.fix&&x.fix.toLowerCase()!==x.text.trim().toLowerCase()?`<div class="lb-better"><span class="label">Bản sửa</span><div class="lb-mrow"><button class="spk" data-say="${esc(x.fix)}" aria-label="Nghe">${SPK}</button><p class="en-s">${esc(x.fix)}</p></div></div>`:''}</div>`).join('')}</div></div>
    ${r.model.length?`<div class="panel"><h3>${ic('award')} Paraphrase band 9 mẫu</h3><div class="lb-items">${r.model.map(m=>`<div class="lb-mrow"><button class="spk" data-say="${esc(m)}" aria-label="Nghe">${SPK}</button><p class="en-s">${esc(m)}</p></div>`).join('')}</div>
      ${r.techniques.length?`<div class="row lb-tech"><span class="label">Kỹ thuật đã dùng</span>${r.techniques.map(t=>`<span class="chip lb-tag">${esc(t)}</span>`).join('')}</div>`:''}</div>`:''}`;
}
function LB_normPara(j,texts){
  j=j&&typeof j==='object'?j:{}; const its=LB_a(j.items);
  const items=texts.map((t,i)=>{const x=its[i]&&typeof its[i]==='object'?its[i]:{};return {text:t,meaning:LB_ten(x.meaning),naturalness:LB_ten(x.naturalness),change:LB_ten(x.change),band:LB_band(x.band),comment:LB_s(x.comment,800),fix:LB_s(x.fix,600)};});
  if(items.every(x=>x.meaning==null&&x.band==null))throw {code:'bad_json'};
  return {items,model:LB_a(j.model).map(m=>LB_s(m,600)).filter(Boolean).slice(0,3),techniques:LB_a(j.techniques).map(m=>LB_s(m,60)).filter(Boolean).slice(0,6)};
}
async function LB_paGrade(){
  const S=LB_P; if(S.busy)return; const texts=S.paras.map(s=>String(s||'').trim()).filter(Boolean);
  if(!texts.length){toast('Viết ít nhất một cách paraphrase trước đã.');return;}
  if(texts.some(t=>countWords(t)<5)){toast('Mỗi cách viết lại nên là một câu đầy đủ.');return;}
  S.paras=texts.slice(); S.busy=true; S.err=null; const cur=S.cur; LB_paDraw();
  const prompt=`You are a demanding IELTS writing coach. A Vietnamese learner paraphrased an academic sentence.
${LB_calib()}
Original sentence: "${cur.s}"
Learner's paraphrases:
${texts.map((t,i)=>`${i+1}. "${t}"`).join('\n')}

For each paraphrase, in the same order, score: "meaning" 0-10 (10 = exactly the same meaning, no added, lost or distorted information, same degree of certainty and quantity), "naturalness" 0-10 (idiomatic, accurate British English), "change" 0-10 (how different it is in structure and wording; swapping a few synonyms while keeping the same structure scores at most 4), and an IELTS-style "band" for this sentence as a piece of band-level writing. Penalise meaning shifts heavily even if the language is good.
Return JSON only:
{"items":[{"meaning":8,"naturalness":7,"change":6,"band":7.5,"comment":"Vietnamese, specific: what was kept, lost or changed, and what would lift it","fix":"a corrected version of the learner's paraphrase that keeps their approach (same as theirs if nothing needs fixing)"}],"model":["two band 9 paraphrases of the original that use clearly different techniques"],"techniques":["Vietnamese names of the techniques used in the models, e.g. danh từ hóa, đổi chủ động sang bị động, đảo trật tự mệnh đề, đổi từ loại"]}
${LB_rules}`;
  let r=null;
  try{r=LB_normPara(await askJSON(prompt),texts);}catch(e){if(S.cur!==cur)return;S.busy=false;S.err=e;LB_paDraw();return;}
  if(S.cur!==cur)return;
  S.busy=false; S.res=r;
  const st=LB_st().para; st.sets++; st.written+=r.items.length; st.good+=r.items.filter(x=>(x.meaning||0)>=8&&(x.band||0)>=7).length; touch('main');
  award('read',1); LB_paDraw();
}
/* reading-style options */
async function LB_paRead(){
  const S=LB_P, cur=S.cur; if(!cur){LB_paDraw();return;}
  S.busy=true; S.err=null; S.ropt=null; S.picked=[]; S.checked=false; LB_paDraw();
  const prompt=`You write IELTS Academic Reading questions. Given the sentence below, write 4 candidate paraphrases of it, as a Reading test would. Between 1 and 3 of them must keep the original meaning exactly (using different structure and vocabulary); the others must look plausible but change the meaning in a typical Reading trap: a changed quantity or frequency (some vs most, often vs always), certainty removed or added (may vs will), cause and effect reversed or invented, a comparison or time reference changed, an over-generalisation, or a detail that is not stated. ${LB_hi()?'Make the traps subtle, at the level of band 8.5-9 candidates.':'Make the traps realistic but fair.'}
Sentence: "${cur.s}"
Return JSON only: {"options":[{"text":"the paraphrase","ok":true,"why":"Vietnamese: why it keeps or changes the meaning, naming the exact words"}]}
${LB_rules}`;
  let opts=null;
  try{const j=await askJSON(prompt);
    opts=LB_a(j&&j.options).filter(o=>o&&typeof o==='object').map(o=>({text:LB_s(o.text,500),ok:o.ok===true||o.ok==='true',why:LB_s(o.why,600)})).filter(o=>o.text).slice(0,5);
    if(opts.length<2||!opts.some(o=>o.ok))throw {code:'bad_json'};
  }catch(e){if(S.cur!==cur)return;S.busy=false;S.err=e;LB_paDraw();return;}
  if(S.cur!==cur)return;
  S.busy=false; S.ropt=shuffle(opts); LB_paDraw();
}
function LB_paReadOut(out){
  const S=LB_P;
  if(S.busy){out.innerHTML=LB_loading('Jack đang soạn 4 cách diễn đạt có bẫy...','Khoảng 10-20 giây.');return;}
  if(S.err){out.innerHTML=LB_errHTML(S.err);LB_bindRetry(out,LB_paRead);return;}
  if(!S.ropt)return;
  out.innerHTML=`<div class="panel"><h3>Câu nào giữ đúng nghĩa câu gốc?</h3><p class="note">Có thể có nhiều hơn một đáp án đúng. Chọn tất cả các câu bạn thấy đúng nghĩa.</p>
    <div class="opts lb-ropts">${S.ropt.map((o,i)=>{const p=S.picked.includes(i);let cls='';if(S.checked){cls=o.ok?(p?'right':'right lb-miss'):(p?'wrong':'lb-fine');}
      return `<div class="lb-ro"><button class="opt en ${cls}" data-ro="${i}" aria-pressed="${p}" ${S.checked?'disabled':''}><span class="lb-box">${S.checked?(o.ok?ic('check'):ic('x')):p?ic('check'):''}</span><span>${esc(o.text)}</span></button>
      ${S.checked?`<div class="fb ${o.ok===p?'ok':'bad'} lb-why"><b>${o.ok?'Giữ đúng nghĩa':'Sai nghĩa'}${o.ok===p?'':o.ok?', bạn bỏ sót câu này':', bạn đã chọn nhầm'}.</b> ${esc(o.why)}</div>`:''}</div>`;}).join('')}</div>
    <div class="row">${S.checked?`<span class="lb-score">${S.score}/${S.ropt.length} câu phân loại đúng</span><button class="btn primary" id="lbNext">Câu tiếp theo ${ic('chevron-right')}</button>`:`<button class="btn ghost" id="lbSkip">Đổi câu</button><button class="btn primary" id="lbCheck">Kiểm tra</button>`}</div></div>`;
  $$('[data-ro]',out).forEach(b=>b.onclick=()=>{if(S.checked)return;const i=+b.dataset.ro;const k=S.picked.indexOf(i);if(k<0)S.picked.push(i);else S.picked.splice(k,1);LB_paDraw();});
  const c=$('#lbCheck',out);if(c)c.onclick=LB_paCheck;
  const n=$('#lbNext',out);if(n)n.onclick=LB_paNext;
  const sk=$('#lbSkip',out);if(sk)sk.onclick=LB_paNext;
}
function LB_paCheck(){
  const S=LB_P; if(!S.ropt||S.checked)return;
  if(!S.picked.length){toast('Chọn ít nhất một câu bạn thấy giữ đúng nghĩa.');return;}
  S.checked=true; let ok=0;
  S.ropt.forEach((o,i)=>{const p=S.picked.includes(i);const item={q:`Câu gốc: "${S.cur.s}"\nCách diễn đạt: "${o.text}"\nCâu này có giữ đúng nghĩa không?`,o:['Giữ đúng nghĩa','Sai nghĩa'],a:o.ok?0:1,w:o.why,src:'Phòng AI: Paraphrase cho Reading'};
    if(p===o.ok){ok++;try{window.__mistOk&&window.__mistOk(item);}catch(e){}}else{try{window.__mistake&&window.__mistake('q',item);}catch(e){}}});
  S.score=ok; const st=LB_st().para; st.rsets++; st.rq+=S.ropt.length; st.rok+=ok;
  if(ok===S.ropt.length){st.streak++;st.best=Math.max(st.best,st.streak);}else st.streak=0;
  st.sets++; touch('main'); award('read',1);
  if(ok===S.ropt.length&&st.streak>0&&st.streak%5===0)try{confetti();}catch(e){}
  LB_paDraw();
}

/* ================= 3. TỪ ĐỜI THẬT ================= */
const LB_R={text:'',busy:false,err:null,res:null,sel:[],added:false,skipped:0};
const LB_MAX=6000;
function LB_rwDraw(){
  const body=LB_body(); if(!body||LB_tab!=='real')return; const R=LB_R, st=LB_st();
  body.innerHTML=`<div class="panel"><h3>Dán email, bài báo, tài liệu công việc bằng tiếng Anh</h3>
      <p class="note">Jack lọc ra 8-15 cụm từ đáng học cho mục tiêu band ${fmtBand(LB_tgt())}, bỏ qua từ quá dễ và từ bạn đã có trong từ điển. Bạn chọn cụm nào muốn học rồi đưa vào thẻ ôn.</p>
      <textarea id="lbTxt" class="en-s lb-txt" rows="9" maxlength="${LB_MAX}" placeholder="Dán nội dung tiếng Anh vào đây..." ${R.busy?'disabled':''}>${esc(R.text)}</textarea>
      <div class="spread"><span class="note num" id="lbCnt"></span><div class="row">${R.text?`<button class="btn ghost sm" id="lbClr" ${R.busy?'disabled':''}>Xóa</button>`:''}<button class="btn primary" id="lbMine" ${R.busy?'disabled':''}>${ic('sparkles')} Lọc từ và cụm từ đáng học</button></div></div></div>
    <div id="lbRwOut" class="lb-out"></div>
    ${st.imports.length?`<div class="panel"><h3>Lịch sử nhập từ</h3><div class="lb-imps">${st.imports.slice().reverse().slice(0,20).map(h=>`<div class="lb-imp"><div class="spread"><span class="note num">${LB_date(h.t)}</span><span class="pill">${h.count} thẻ</span></div>${h.summary?`<p>${esc(h.summary)}</p>`:''}${LB_a(h.words).length?`<p class="small muted en">${esc(h.words.join(', '))}</p>`:''}</div>`).join('')}</div></div>`:''}`;
  const ta=$('#lbTxt',body), cnt=$('#lbCnt',body);
  const upd=()=>{const n=ta.value.length;cnt.textContent=n+'/'+LB_MAX+' ký tự, '+countWords(ta.value)+' từ';cnt.classList.toggle('lb-warn',n>=LB_MAX);};
  ta.oninput=()=>{R.text=ta.value.slice(0,LB_MAX);upd();};upd();
  $('#lbMine',body).onclick=LB_rwMine;
  const c=$('#lbClr',body);if(c)c.onclick=()=>{R.text='';R.res=null;R.err=null;LB_rwDraw();};
  LB_rwOut();
}
function LB_normRw(j){
  j=j&&typeof j==='object'?j:{}; const seen=new Set(); let skipped=0;
  const items=LB_a(j.items).filter(x=>x&&typeof x==='object').map(x=>{
    let pos=LB_s(x.pos,10).toLowerCase(); if(!LB_POS.includes(pos))pos=/\s/.test(LB_s(x.w,80))?'phr':'n';
    let ipa=LB_s(x.ipa,80); if(ipa&&!ipa.startsWith('/'))ipa='/'+ipa.replace(/^\/|\/$/g,'')+'/';
    return {w:LB_s(x.w,80).replace(/^["'“]+|["'”.,;:]+$/g,'').trim(),ipa,pos,vi:LB_s(x.vi,200),ex:LB_s(x.ex,500),exvi:LB_s(x.exvi,500),col:LB_a(x.col).map(c=>LB_s(c,60)).filter(Boolean).slice(0,3),why:LB_s(x.why,500)};})
    .filter(x=>{if(!x.w||!/[a-z]/i.test(x.w)||!x.vi)return false;const k=x.w.toLowerCase();if(seen.has(k))return false;seen.add(k);if(VI.has(k)){skipped++;return false;}return true;}).slice(0,20);
  if(!items.length&&!skipped)throw {code:'bad_json'};
  return {items,summary:LB_s(j.summary,600),skipped};
}
async function LB_rwMine(){
  const R=LB_R; const ta=LB_body()&&$('#lbTxt',LB_body()); if(ta)R.text=ta.value.slice(0,LB_MAX);
  const t=R.text.trim();
  if(countWords(t)<25){toast('Dán đoạn văn dài hơn, ít nhất khoảng 25 từ tiếng Anh.');return;}
  if(R.busy)return; R.busy=true; R.err=null; R.res=null; R.added=false; LB_rwDraw();
  try{await loadAllVocab();addCustomWords();}catch(e){}
  const prompt=`You help a Vietnamese learner aiming for IELTS band ${fmtBand(LB_tgt())} (already C1) turn real-world English into vocabulary cards.
${LB_calib()}
From the text below, pick 8 to 15 collocations, phrasal verbs, idioms or precise words that are genuinely worth learning for band 8.5-9: precise or nuanced meaning, useful register (formal, professional, academic), strong collocations, natural idiomatic phrasing. Skip anything trivial for a C1 user (for example "important", "make a decision", "in addition"), proper names, numbers, and narrow jargon that is only useful in that one workplace. Prefer the multi-word item as it is used in the text; give "w" in its dictionary form (e.g. "shoulder the burden" for "shouldered the burden").
Return JSON only:
{"items":[{"w":"collocation or phrase","ipa":"/British RP IPA/","pos":"phr|n|v|adj|adv|idiom","vi":"short Vietnamese meaning","ex":"the full sentence from the text where it appears, copied verbatim","exvi":"Vietnamese translation of that sentence","col":["2-3 related collocations"],"why":"Vietnamese: why it is worth learning for band 8.5-9 (precision, register, collocation)"}],"summary":"Vietnamese, 1-2 sentence gist of the text"}
${LB_rules}

Text:
"""
${t.slice(0,LB_MAX)}
"""`;
  try{const r=LB_normRw(await askJSON(prompt));R.res=r;R.sel=r.items.map(()=>true);}
  catch(e){R.err=e;}
  R.busy=false;
  if(LB_body()&&LB_tab==='real')LB_rwDraw();
}
function LB_hlEx(ex,w){
  const e=esc(ex); if(!w)return e;
  const words=String(w).split(/\s+/).filter(Boolean).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').slice(0,Math.max(3,x.length-2))+'[\\w\'-]*');
  try{const re=new RegExp('('+words.join('\\s+(?:\\w+\\s+){0,2}?')+')','i');return e.replace(re,'<mark class="lb-hl">$1</mark>');}catch(err){return e;}
}
function LB_rwOut(){
  const body=LB_body(); const c=body&&$('#lbRwOut',body); if(!c)return; const R=LB_R;
  if(R.busy){c.innerHTML=LB_loading('Jack đang đọc và lọc cụm từ đáng học, khoảng 15-30 giây','Văn bản dài có thể lâu hơn một chút.');return;}
  if(R.err){c.innerHTML=LB_errHTML(R.err);LB_bindRetry(c,LB_rwMine);return;}
  if(!R.res){c.innerHTML='';return;}
  const r=R.res, n=R.sel.filter(Boolean).length;
  c.innerHTML=`${r.summary?`<div class="panel lb-sum">${mcSay('ok','<b>Nội dung chính:</b> '+esc(r.summary),56)}</div>`:''}
    ${r.items.length?`<div class="spread"><span class="label">${r.items.length} mục${r.skipped?`, bỏ qua ${r.skipped} mục đã có trong từ điển`:''}</span>${R.added?'':`<div class="row"><button class="btn ghost sm" id="lbAll">Chọn tất cả</button><button class="btn ghost sm" id="lbNone">Bỏ chọn</button></div>`}</div>
    <div class="lb-cards">${r.items.map((x,i)=>`<label class="lb-card ${R.sel[i]?'on':''} ${R.added?'done':''}"><input type="checkbox" data-sel="${i}" ${R.sel[i]?'checked':''} ${R.added?'disabled':''}>
      <div class="lb-cw"><div class="lb-ch"><b class="en">${esc(x.w)}</b><button type="button" class="spk" data-say="${esc(x.w)}" aria-label="Nghe">${SPK}</button></div>
        <div class="row lb-meta">${x.ipa?`<span class="ipa">${esc(x.ipa)}</span>`:''}<span class="pill">${esc(x.pos)}</span></div>
        <p class="lb-vi">${esc(x.vi)}</p>
        ${x.ex?`<div class="lb-ex"><div class="lb-mrow"><button type="button" class="spk" data-say="${esc(x.ex)}" aria-label="Nghe câu">${SPK}</button><p class="en-s">${LB_hlEx(x.ex,x.w)}</p></div>${x.exvi?`<p class="note">${esc(x.exvi)}</p>`:''}</div>`:''}
        ${x.col.length?`<div class="row lb-cols">${x.col.map(cl=>`<span class="chip lb-tag en">${esc(cl)}</span>`).join('')}</div>`:''}
        ${x.why?`<p class="note lb-whyw">${ic('lightbulb')} ${esc(x.why)}</p>`:''}</div></label>`).join('')}</div>
    <div class="panel lb-addbar">${R.added?mcSay('yay',`Đã thêm ${R.addedN} thẻ. Chúng có trong thẻ ôn hôm nay và trong từ điển, mục "Của bạn".`,56)+`<div class="row"><button class="btn primary" id="lbGoStudy">${ic('layers')} Ôn ngay</button><button class="btn" id="lbMore">Dán văn bản khác</button></div>`
      :`<button class="btn primary" id="lbAddC" ${n?'':'disabled'}>${ic('layers')} Thêm ${n} thẻ vào ôn tập</button>`}</div>`
    :mcSay('ok','Bạn đã có hết các cụm đáng học trong văn bản này trong từ điển rồi. Thử một văn bản khó hơn nhé.',56)}`;
  $$('[data-sel]',c).forEach(b=>b.onchange=()=>{R.sel[+b.dataset.sel]=b.checked;b.closest('.lb-card').classList.toggle('on',b.checked);const k=R.sel.filter(Boolean).length;const a=$('#lbAddC',c);if(a){a.disabled=!k;a.innerHTML=`${ic('layers')} Thêm ${k} thẻ vào ôn tập`;}});
  const all=$('#lbAll',c);if(all)all.onclick=()=>{R.sel=R.res.items.map(()=>true);LB_rwOut();};
  const no=$('#lbNone',c);if(no)no.onclick=()=>{R.sel=R.res.items.map(()=>false);LB_rwOut();};
  const add=$('#lbAddC',c);if(add)add.onclick=LB_rwAdd;
  const gs=$('#lbGoStudy',c);if(gs)gs.onclick=()=>go('study');
  const mo=$('#lbMore',c);if(mo)mo.onclick=()=>{R.text='';R.res=null;R.added=false;LB_rwDraw();window.scrollTo(0,0);setTimeout(()=>{const t=$('#lbTxt');t&&t.focus();},50);};
}
function LB_rwAdd(){
  const R=LB_R; if(!R.res||R.added)return;
  P.custom=Array.isArray(P.custom)?P.custom:[];
  const now=Date.now(), words=[];
  R.res.items.forEach((x,i)=>{if(!R.sel[i])return;const k=x.w.toLowerCase();if(VI.has(k)||P.custom.some(c=>String(c.w).toLowerCase()===k))return;
    P.custom.push({w:x.w,vi:x.vi,ipa:x.ipa,pos:x.pos,ex:x.ex,exvi:x.exvi,col:x.col.slice(0,3),t:now});words.push(x.w);});
  if(!words.length){toast('Các cụm đã chọn đều có trong từ điển rồi.');return;}
  addCustomWords();
  words.forEach(w=>{const k=w.toLowerCase();if(!P.srs[k])P.srs[k]={iv:0,ef:2.5,n:0,l:0,due:Date.now(),s:1,first:Date.now()};});
  queue=[];
  const st=LB_st(); st.imports.push({t:now,summary:R.res.summary,count:words.length,words});
  if(st.imports.length>30)st.imports=st.imports.slice(-30);
  touch('main');
  R.added=true; R.addedN=words.length;
  toast('Đã thêm '+words.length+' thẻ vào ôn tập.');
  award('dict',words.length);
  LB_rwDraw();
}
