/* ================= SPEAKING: Part 1, Part 2 cue cards, Part 3, AI examiner chat, full speaking test (SP_exam) ================= */
let SP_noRec=false, SP_D=null, SP_tab='p1', SP_uid=0, SP_p2f='all';
const SP_live=new Set();          // cleanup functions for timers, recognition, recording
const SP_urls=[];                 // blob URLs of recordings (revoked on leave)
const SP_CRIT=[['fc','Trôi chảy và mạch lạc','Fluency and Coherence','Nói đều, ít ngập ngừng, các ý nối với nhau rõ ràng.'],
  ['lr','Từ vựng','Lexical Resource','Từ đa dạng, đúng ngữ cảnh, biết diễn đạt lại khi bí từ.'],
  ['gra','Ngữ pháp','Grammatical Range and Accuracy','Dùng cả câu đơn lẫn câu phức, ít lỗi.'],
  ['pr','Phát âm','Pronunciation','Dễ nghe, rõ âm cuối, đúng trọng âm, ngữ điệu tự nhiên.']];
const SP_TOP={person:'Người',place:'Nơi chốn',object:'Đồ vật',event:'Sự kiện',experience:'Trải nghiệm',activity:'Hoạt động',media:'Sách, phim, mạng'};
const SP_NOSR='Trình duyệt này không nhận giọng nói, hãy dùng Chrome hoặc Edge, hoặc gõ câu trả lời';
const SP_ms=()=>window.__spFast?50:1000;
const SP_c=s=>String(s==null?'':s).replace(/\s*[\u2014\u2013]\s*/g,', ').replace(/\u2192/g,'->').replace(/\u2190/g,'<-').replace(/\u2194/g,'<->');
const SP_hasSR=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);

function SP_every(fn){let id=setInterval(fn,SP_ms());const t={stop(){if(id)clearInterval(id);id=null;SP_live.delete(t.stop);}};SP_live.add(t.stop);return t;}
function SP_stopAll(){stopSay();[...SP_live].forEach(f=>{try{f();}catch(e){}});SP_live.clear();}
function SP_hook(){window.__leave=()=>{SP_stopAll();SP_urls.splice(0).forEach(u=>{try{URL.revokeObjectURL(u);}catch(e){}});};}
function SP_store(){P.sp=P.sp||{};P.sp.att=P.sp.att||[];return P.sp;}
const SP_band=x=>{const n=+x;if(isNaN(n))return null;return Math.round(Math.min(9,Math.max(0,n))*2)/2;};
const SP_cardText=c=>c.card+'\n'+c.bullets.join('\n')+'\n'+c.explain;
async function SP_data(){if(!SP_D)SP_D=await loadJSON('speaking');return SP_D;}

/* ---------- answer recorder ----------
   SP_rec(host,{q, voice, part, hint, speakQ, hideQ, autoStart, limit, warn, exam, record, id, title, aiQ, onDone(api), onReset}) */
function SP_rec(host,o){
  const st={phase:'idle',secs:0,text:'',url:null,lis:null,recP:null,tick:null,att:null,awarded:false,edited:false};
  const uid='spr'+(++SP_uid);
  host.innerHTML=`<div class="sp-rec" id="${uid}">${o.hideQ?'':`<div class="sp-q"><button class="spk" data-sq aria-label="Nghe lại câu hỏi">${SPK}</button><div class="en-s">${esc(o.q)}</div></div>`}<div class="sp-body"></div></div>`;
  const root=$('#'+uid,host), body=$('.sp-body',root);
  const sayQ=()=>say(o.q,{voice:o.voice||'f',lang:'en-GB'});
  const sq=$('[data-sq]',root); if(sq)sq.onclick=e=>{e.preventDefault();sayQ();};
  const cleanup=()=>{if(st.tick)st.tick.stop();if(st.lis){try{st.lis.stop();}catch(e){}st.lis=null;}
    if(st.recP){const p=st.recP;st.recP=null;p.then(r=>r&&r.stop()).then(u=>{if(u)try{URL.revokeObjectURL(u);}catch(e){}}).catch(()=>{});}};
  SP_live.add(cleanup);
  const words=()=>countWords(st.text);
  const save=()=>{
    if(!st.text.trim())return;
    const S=SP_store();
    if(!st.att){st.att={q:String(o.q).slice(0,400),part:o.part||'',id:o.id||'',t:st.text,d:Date.now(),s:st.secs,band:null};S.att.push(st.att);if(S.att.length>150)S.att.splice(0,S.att.length-150);}
    else st.att.t=st.text;
    if(!st.awarded&&words()>=5){st.awarded=true;award('speak',1);}
    touch('main');
  };
  const drawIdle=()=>{
    st.phase='idle';
    body.innerHTML=`${o.hint?`<p class="note">${o.hint}</p>`:''}
      <div class="row"><button class="btn primary" data-go>${ic('mic')} Trả lời</button>${o.exam?'':'<button class="btn ghost sm" data-type>Gõ câu trả lời</button>'}</div>
      ${SP_hasSR()?'':`<p class="note">${SP_NOSR}.</p>`}`;
    $('[data-go]',body).onclick=start;
    const ty=$('[data-type]',body); if(ty)ty.onclick=()=>{st.secs=0;st.text='';drawReview(true);};
  };
  const timerHTML=()=>o.limit?`${ic('timer')} <span data-tt>${fmtTime(st.secs)}</span> / ${fmtTime(o.limit)}`:`${ic('clock')} <span data-tt>${fmtTime(st.secs)}</span>`;
  const updTimer=()=>{const t=$('[data-tt]',body);if(t)t.textContent=fmtTime(st.secs);
    const ch=$('.timer-chip',body);if(ch&&o.limit)ch.classList.toggle('low',o.limit-st.secs<=15);
    const w=$('[data-warn]',body);if(w&&o.warn){w.textContent=st.secs<60?'Cố nói đủ 1-2 phút. Nếu bí ý, quay lại các gợi ý trên thẻ.':'Tốt rồi, bạn đã nói hơn 1 phút. Có thể nói tiếp đến 2 phút.';w.className='note sp-warn'+(st.secs<60?'':' ok');}};
  function start(){
    if(st.phase!=='idle')return;
    stopSay(); st.phase='live'; st.secs=0; st.text=''; st.edited=false;
    st.lis=listen({lang:'en-GB',onText:(t,fin)=>{
      if(st.phase==='live'||st.phase==='stopping'){if(!fin||t.length>=st.text.length)st.text=t;const b=$('.sp-live',body);if(b)b.textContent=st.text||'...';}
      else if(st.phase==='review'&&fin&&!st.edited&&t.length>st.text.length){st.text=t;const ta=$('.sp-tr',body);if(ta)ta.value=t;stats();save();}
    }});
    body.innerHTML=`<div class="spread"><span class="sp-on"><i class="sp-dot"></i>${st.lis?'Đang nghe bạn nói':'Đang ghi'}</span><span class="timer-chip">${timerHTML()}</span></div>
      ${o.warn?'<p class="note sp-warn" data-warn></p>':''}
      ${st.lis?'<div class="sp-live en-s" aria-live="polite">...</div>':`<p class="note">${SP_NOSR}.</p><textarea class="sp-type en-s" rows="4" placeholder="Gõ lại những gì bạn vừa nói"></textarea>`}
      <div class="row"><button class="btn primary" data-stop>${ic('circle-stop')} Xong</button></div>`;
    $('[data-stop]',body).onclick=finish;
    const ty=$('.sp-type',body); if(ty)setTimeout(()=>ty.focus(),30);
    updTimer();
    st.recP=SP_noRec?Promise.resolve(null):recorder().then(r=>{if(!r)SP_noRec=true;return r;}).catch(()=>{SP_noRec=true;return null;});
    st.tick=SP_every(()=>{st.secs++;updTimer();if(o.limit&&st.secs>=o.limit){toast('Hết 2 phút.');finish();}});
  }
  async function finish(){
    if(st.phase!=='live')return; st.phase='stopping';
    if(st.tick)st.tick.stop();
    const ty=$('.sp-type',body); if(ty)st.text=ty.value.trim();
    if(st.lis){try{st.lis.stop();}catch(e){}st.lis=null;}
    const b=$('[data-stop]',body); if(b){b.disabled=true;b.textContent='Đang lưu...';}
    const p=st.recP; st.recP=null;
    let r=null; try{r=p?await p:null;}catch(e){}
    try{st.url=r?await r.stop():null;}catch(e){st.url=null;}
    if(st.url)SP_urls.push(st.url);
    if(!document.body.contains(root))return;
    drawReview(false);
    o.onDone&&o.onDone(api);
  }
  function stats(){
    const el=$('[data-stats]',body); if(!el)return; const n=words();
    el.innerHTML=`<span><b class="num">${n}</b> từ</span>${st.secs?`<span><b class="num">${fmtTime(st.secs)}</b></span><span><b class="num">${n?Math.round(n/(st.secs/60)):0}</b> từ/phút</span>`:''}`;
  }
  function drawReview(typed){
    st.phase='review';
    body.innerHTML=`${st.url?`<div class="sp-play"><span class="label">Nghe lại giọng bạn</span><audio controls preload="metadata" src="${st.url}"></audio></div>`:''}
      <label class="label" for="${uid}t">${typed?'Gõ câu trả lời của bạn (tiếng Anh)':'Bản ghi chữ, sửa lại chỗ máy nghe sai'}</label>
      <textarea id="${uid}t" class="sp-tr en-s" rows="${Math.min(10,Math.max(3,Math.ceil(st.text.length/60)))}" placeholder="${typed?'Gõ những gì bạn sẽ nói':'Máy chưa nghe được chữ nào. Gõ lại câu trả lời ở đây.'}">${esc(st.text)}</textarea>
      <div class="sp-stats" data-stats></div>
      ${st.secs&&words()&&st.secs>=10?`<p class="note">${SP_paceNote(words(),st.secs)}</p>`:''}
      <div class="row">${o.exam?'':`<button class="btn sm need-ai" data-ai>${ic('sparkles')} Nhận xét bằng AI</button><button class="btn ghost sm" data-again>${ic('rotate-ccw')} Nói lại</button>`}</div>
      ${o.exam?'':'<p class="note no-ai">Bật trợ lý AI (mật khẩu nhóm) để được chấm band và sửa câu.</p>'}
      <div class="sp-ai"></div>`;
    stats(); refreshAIBits();
    const ta=$('.sp-tr',body);
    ta.oninput=()=>{st.edited=true;st.text=ta.value;stats();};
    ta.onchange=()=>{st.text=ta.value.trim();save();};
    if(typed){setTimeout(()=>ta.focus(),30);}
    save();
    const ai=$('[data-ai]',body); if(ai)ai.onclick=()=>{
      st.text=ta.value.trim(); save();
      if(countWords(st.text)<5){toast('Câu trả lời còn quá ngắn để nhận xét.');return;}
      SP_feedback($('.sp-ai',body),{part:o.part,qs:[o.aiQ||o.q],answers:[st.text],secs:st.secs,record:o.record,id:o.id,title:o.title,att:st.att});
    };
    const ag=$('[data-again]',body); if(ag)ag.onclick=()=>{st.att=null;st.awarded=false;st.text='';st.secs=0;st.url=null;o.onReset&&o.onReset();drawIdle();};
    if(typed&&o.onDone)ta.addEventListener('change',()=>{if(!api._typedDone&&st.text){api._typedDone=1;o.onDone(api);}});
  }
  const api={get text(){const ta=$('.sp-tr',body);return (ta?ta.value:st.text).trim();},get secs(){return st.secs;},get url(){return st.url;},get att(){return st.att;},
    get phase(){return st.phase;},q:o.q,start,stop:finish,stopNow(){if(st.phase==='live')return finish();return Promise.resolve();}};
  drawIdle();
  if(o.autoStart)setTimeout(start,0);
  else if(o.speakQ)sayQ();
  return api;
}
function SP_paceNote(n,secs){
  const w=n/(secs/60);
  if(w<70)return 'Tốc độ khá chậm. Thử nói liền mạch hơn, dùng cụm nối như "well", "the thing is" thay vì dừng lâu.';
  if(w>190)return 'Bạn nói khá nhanh. Chậm lại một chút để phát âm rõ âm cuối.';
  return 'Tốc độ ổn, khoảng tốc độ nói tự nhiên (100-170 từ mỗi phút).';
}

/* ---------- AI examiner feedback ---------- */
function SP_gradePrompt(desc,block){
  return `You are an experienced, fair IELTS Speaking examiner helping a Vietnamese learner. Assess the candidate using the official public band descriptors (Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation), each 0-9 in half bands.

Task: ${desc}

IMPORTANT: the candidate's answers below are a speech-to-text transcript (or typed by the learner). Punctuation, capital letters and some words may be wrong because of the recogniser, so do not punish punctuation, and if a word looks like a recognition error, judge what they most likely said. Judge Pronunciation only cautiously from indirect clues (missing word endings like -s/-ed, words the recogniser clearly misheard), and say in the summary that pronunciation is estimated from the transcript. A very short answer limits Fluency and Coherence.

${block}

Return JSON exactly in this shape:
{"bands":{"fc":6,"lr":6,"gra":5.5,"pr":6},"overall":6,"summary":"2-3 sentences in Vietnamese","good":["1-3 strengths in Vietnamese"],"improve":["2-4 concrete tips in Vietnamese, each saying exactly what to do next time"],"fixes":[{"orig":"exact phrase the candidate said","fix":"better natural English","why":"short reason in Vietnamese"}],"upgrade":"a band 8 version of the candidate's answer in natural spoken British English, keeping their ideas and roughly their length or a little longer"}
Give 2-5 fixes from the candidate's own words. Vietnamese text must be natural and plain. Do not use the em dash character anywhere.`;
}
function SP_block(qs,answers){return qs.map((q,i)=>`Examiner: ${q}\nCandidate (transcript): ${answers[i]||'(no answer)'}`).join('\n\n').slice(0,40000);}
function SP_feedback(box,{part,qs,answers,secs,record,id,title,att,desc,block,onBand}){
  const run=async()=>{
    box.innerHTML=`<div class="sp-wait">${mcSay('idea','Mít đang nghe lại câu trả lời...',56)}</div>`;
    const d=desc||`${part||'Speaking'} answer.${secs?` The candidate spoke for about ${Math.round(secs)} seconds.`:''}`;
    try{
      const j=await askJSON(SP_gradePrompt(d,block||SP_block(qs,answers)));
      if(!document.body.contains(box))return;
      const b=j&&j.bands||{}; const bands={fc:SP_band(b.fc),lr:SP_band(b.lr),gra:SP_band(b.gra),pr:SP_band(b.pr)};
      let ov=overallBand([bands.fc,bands.lr,bands.gra,bands.pr]); if(ov==null)ov=SP_band(j&&j.overall);
      if(ov==null)throw {code:'bad_json'};
      box.innerHTML=SP_fbHTML(j,bands,ov);
      if(att){att.band=ov;touch('main');}
      if(record)recordScore({skill:'speaking',band:ov,id:id||'',title:title||'Speaking'});
      onBand&&onBand(ov,j);
    }catch(e){
      if(!document.body.contains(box))return;
      box.innerHTML=`<div class="fb bad">${esc(aiError(e))}</div><div class="row"><button class="btn sm" data-retry>${ic('rotate-ccw')} Thử lại</button></div>`;
      $('[data-retry]',box).onclick=run;
    }
  };
  if(!AI){box.innerHTML=`<p class="note">${esc(aiError({code:'no_ai'}))}</p>`;return;}
  run();
}
function SP_fbHTML(j,bands,ov){
  const list=a=>(Array.isArray(a)?a:[]).filter(Boolean).map(x=>`<li>${esc(SP_c(x))}</li>`).join('');
  const fixes=(Array.isArray(j.fixes)?j.fixes:[]).filter(f=>f&&(f.orig||f.fix));
  const up=SP_c(j.upgrade||'');
  return `<div class="sp-fb">
    <div class="sp-ov"><div><span class="label">Band ước tính</span><b class="num">${fmtBand(ov)}</b></div><p class="note">Chấm từ bản ghi chữ nên chỉ để tham khảo, nhất là điểm Phát âm.</p></div>
    <div class="sp-bands">${SP_CRIT.map(([k,vi,en])=>`<div class="sp-band"><b class="num">${fmtBand(bands[k])}</b><span>${vi}</span><small>${en}</small></div>`).join('')}</div>
    ${j.summary?`<p class="sp-sum">${esc(SP_c(j.summary))}</p>`:''}
    ${list(j.good)?`<div><h3>Điểm tốt</h3><ul class="sp-ul ok">${list(j.good)}</ul></div>`:''}
    ${list(j.improve)?`<div><h3>Cần cải thiện</h3><ul class="sp-ul">${list(j.improve)}</ul></div>`:''}
    ${fixes.length?`<div><h3>Sửa câu</h3><div class="sp-fixes">${fixes.map(f=>`<div class="sp-fix"><div class="en-s"><s>${esc(SP_c(f.orig))}</s></div><div class="en-s sp-fixok">${ic('check')} ${esc(SP_c(f.fix))}</div>${f.why?`<div class="note">${esc(SP_c(f.why))}</div>`:''}</div>`).join('')}</div></div>`:''}
    ${up?`<div><h3>Câu trả lời nâng cấp (band 8)</h3><div class="ex sp-ex"><button class="spk" data-say="${esc(up)}" data-voice="f" aria-label="Nghe">${SPK}</button><div class="en-s">${esc(up)}</div></div></div>`:''}
  </div>`;
}

/* ---------- view ---------- */
VIEWS.speak=async el=>{
  SP_hook();
  el.innerHTML='<div class="view"><p class="note">Đang tải phòng luyện nói...</p></div>';
  try{await SP_data();}catch(e){el.innerHTML='<div class="view"><p class="note">Chưa tải được dữ liệu Speaking. Kiểm tra mạng rồi tải lại trang.</p></div>';return;}
  SP_home(el);
};
function SP_home(el){
  SP_stopAll(); SP_hook();
  const D=SP_D;
  el.innerHTML=`<div class="view sp">
    <div class="spread"><h2>Speaking</h2><span class="note">Phòng luyện nói với giám khảo</span></div>
    <div class="panel sp-intro">
      ${mcSay('hi','Bài thi Speaking dài 11-14 phút, nói trực tiếp với giám khảo. Ở đây bạn luyện từng phần, nghe lại giọng mình và xem câu mẫu.',60)}
      <div class="sp-parts">
        <div><b>Part 1</b><span>4-5 phút. Câu hỏi ngắn về bản thân, công việc, sở thích. Trả lời 2-3 câu mỗi câu hỏi.</span></div>
        <div><b>Part 2</b><span>3-4 phút. Nhận một cue card, có 1 phút chuẩn bị rồi nói liền 1-2 phút.</span></div>
        <div><b>Part 3</b><span>4-5 phút. Thảo luận sâu hơn quanh chủ đề Part 2: nêu quan điểm, giải thích, so sánh.</span></div>
      </div>
      <details class="sp-det"><summary>4 tiêu chí chấm điểm (mỗi tiêu chí 25%)</summary>
        <div class="sp-crit">${SP_CRIT.map(([k,vi,en,d])=>`<div><b>${vi}</b><small>${en}</small><span>${d}</span></div>`).join('')}</div></details>
      <p class="note">App ghi âm để bạn nghe lại và chuyển giọng nói thành chữ (tốt nhất trên Chrome hoặc Edge). Bản ghi âm không được lưu, chỉ lưu phần chữ.</p>
    </div>
    ${subTabs('spTabs',[['p1','Part 1'],['p2','Part 2 (cue card)'],['p3','Part 3'],['ai','Giám khảo AI']],SP_tab,t=>{SP_tab=t;SP_home(el);})}
    <div id="spTab"></div>
    ${SP_recentHTML()}
  </div>`;
  const box=$('#spTab',el);
  if(SP_tab==='p1'){
    box.innerHTML=`<div class="panel"><h3>Chọn chủ đề Part 1</h3><p class="note">Mỗi chủ đề có 4-5 câu hỏi. Giám khảo đọc câu hỏi, bạn trả lời khoảng 20-30 giây.</p>
      <div class="sp-topics">${D.p1.map((t,i)=>`<button class="sp-topic" data-i="${i}"><b>${esc(t.topic)}</b><span class="note">${t.qs.length} câu${SP_doneP1(t)?' · đã luyện':''}</span></button>`).join('')}</div></div>`;
    $$('[data-i]',box).forEach(b=>b.onclick=()=>SP_p1(el,+b.dataset.i));
  }else if(SP_tab==='p2'||SP_tab==='p3'){
    const p2=SP_tab==='p2';
    const draw=()=>{
      const list=D.p2.map((c,i)=>[c,i]).filter(([c])=>SP_p2f==='all'||c.topic===SP_p2f);
      box.innerHTML=`<div class="panel"><div class="spread"><h3>${p2?'Chọn cue card':'Câu hỏi thảo luận Part 3 theo chủ đề'}</h3>${p2?`<button class="btn primary sm" data-rand>${ic('repeat')} Ngẫu nhiên</button>`:''}</div>
        <p class="note">${p2?'Thẻ giống hệt đề thi: 1 phút chuẩn bị, 2 phút nói. Sau đó xem từ vựng, bài mẫu band 8 và sang Part 3.':'Mỗi cue card có 5 câu hỏi Part 3. Trả lời từng câu, khoảng 40-60 giây, rồi xem câu mẫu.'}</p>
        <div class="row">${[['all','Tất cả'],...Object.entries(SP_TOP)].map(([k,t])=>`<button class="chip" data-f="${k}" aria-pressed="${SP_p2f===k}">${t}</button>`).join('')}</div>
        <div class="sp-cards">${list.map(([c,i])=>`<button class="sp-cl" data-c="${i}"><span class="pill">${SP_TOP[c.topic]||esc(c.topic)}</span><span class="en sp-clt">${esc(p2?c.card:c.card.replace(/^Describe /,'').replace(/\.$/,''))}</span>${p2?'':`<span class="note en">${esc(c.p3[0])}</span>`}${SP_doneId(c.id,p2?'Part 2':'Part 3')?`<span class="sp-tick" title="Đã luyện">${ic('check')}</span>`:''}</button>`).join('')}</div></div>`;
      $$('[data-f]',box).forEach(b=>b.onclick=()=>{SP_p2f=b.dataset.f;draw();});
      $$('[data-c]',box).forEach(b=>b.onclick=()=>p2?SP_p2(el,+b.dataset.c):SP_p3(el,+b.dataset.c));
      const r=$('[data-rand]',box); if(r)r.onclick=()=>SP_p2(el,D.p2.indexOf(pick(D.p2)));
    };
    draw();
  }else{
    box.innerHTML=`<div class="panel sp-mock">
        <h3>${ic('message-circle')} Phỏng vấn với giám khảo AI</h3>
        <p class="note">Giám khảo AI hỏi Part 1, đưa cue card cho Part 2 (có giờ chuẩn bị và giờ nói), rồi hỏi tiếp Part 3 dựa trên những gì bạn nói. Trong lúc thi giám khảo không sửa lỗi. Bấm "Kết thúc và chấm" để nhận band và nhận xét.</p>
        <div class="row need-ai"><button class="btn primary" data-chat>${ic('mic')} Bắt đầu phỏng vấn</button></div>
        <p class="note no-ai">Cần bật trợ lý AI (mật khẩu nhóm) để dùng giám khảo AI. Bạn vẫn có thể làm bài thi đủ 3 phần bên dưới.</p>
      </div>
      <div class="panel"><h3>${ic('clipboard-check')} Thi thử Speaking đủ 3 phần</h3>
        <p class="note">Khoảng 12 phút: Part 1 (4 câu), Part 2 (1 phút chuẩn bị, 2 phút nói), Part 3 (3-4 câu). Câu hỏi lấy từ ngân hàng đề, không cần AI. Có AI thì được chấm cả bài.</p>
        <div class="row"><button class="btn" data-exam>Bắt đầu thi thử</button></div></div>`;
    refreshAIBits();
    $('[data-chat]',box).onclick=()=>SP_chat(el);
    $('[data-exam]',box).onclick=()=>SP_exam(el,{onDone:()=>{},back:()=>SP_home(el)});
  }
}
function SP_doneP1(t){const a=(P.sp&&P.sp.att)||[];return a.some(x=>x.part==='Part 1'&&t.qs.includes(x.q));}
function SP_doneId(id,part){const a=(P.sp&&P.sp.att)||[];return a.some(x=>x.id===id&&x.part===part);}
function SP_recentHTML(){
  const a=((P.sp&&P.sp.att)||[]).slice(-5).reverse(); if(!a.length)return '';
  return `<div class="panel"><h3>Lần luyện gần đây</h3><div class="sp-recent">${a.map(x=>`<div class="sp-rc"><span class="pill">${esc(x.part||'')}</span><span class="en sp-rcq">${esc(x.q.split('\n')[0])}</span><span class="note num">${x.band!=null?'Band '+fmtBand(x.band):countWords(x.t)+' từ'}</span></div>`).join('')}</div></div>`;
}
function SP_head(el,back,label,title,step){
  return `<div class="spread"><button class="btn ghost sm" data-back>${ic('chevron-left')} ${back}</button><span class="pill ai">${label}</span></div>
    <div class="spread"><h2 class="${/[A-Za-z]/.test(title)&&!/[À-ỹ]/.test(title)?'en':''}">${esc(title)}</h2>${step?`<span class="note num">${step}</span>`:''}</div>`;
}
function SP_dots(n,i){return `<div class="sp-steps" aria-hidden="true">${Array.from({length:n},(_,k)=>`<i class="${k<i?'d':k===i?'c':''}"></i>`).join('')}</div>`;}
function SP_sampleHTML(q,samples,label){
  const s=(samples||[]).find(x=>enFold(x[0])===enFold(q)); if(!s)return '';
  return `<div class="panel sp-sample"><h3>${label||'Câu trả lời mẫu'}</h3><div class="ex sp-ex"><button class="spk" data-say="${esc(s[1])}" data-voice="f" aria-label="Nghe câu mẫu">${SPK}</button><div class="en-s">${esc(s[1])}</div></div></div>`;
}

/* ---------- Part 1 and Part 3 practice (one question at a time) ---------- */
function SP_series(el,{label,title,qs,samples,hint,part,id,back,voice,extra}){
  SP_stopAll(); SP_hook();
  let i=0; const ans=[];
  const draw=()=>{
    SP_stopAll();
    el.innerHTML=`<div class="view sp">${SP_head(el,back,label,title,`Câu ${i+1}/${qs.length}`)}${SP_dots(qs.length,i)}
      <div class="panel" id="spR"></div><div id="spAfter" class="sp-after"></div></div>`;
    $('[data-back]',el).onclick=()=>SP_home(el);
    SP_rec($('#spR',el),{q:qs[i],voice,part,id,hint,speakQ:true,
      onReset:()=>{$('#spAfter',el).innerHTML='';},
      onDone:r=>{
        ans[i]=r;
        const last=i===qs.length-1;
        $('#spAfter',el).innerHTML=`${SP_sampleHTML(qs[i],samples)}<div class="row"><button class="btn primary" data-next>${last?'Xem tổng kết':'Câu tiếp'} ${ic('chevron-right')}</button></div>`;
        $('[data-next]',el).onclick=()=>{ans[i]={q:qs[i],text:r.text,secs:r.secs};if(last)summary();else{i++;draw();}};
      }});
  };
  const summary=()=>{
    SP_stopAll();
    const done=ans.filter(a=>a&&a.text);
    el.innerHTML=`<div class="view sp">${SP_head(el,back,label,title,'Tổng kết')}
      <div class="panel">${mcSay(done.length===qs.length?'yay':'ok',done.length?`Xong ${done.length}/${qs.length} câu. Đọc lại câu trả lời của bạn và so với câu mẫu nhé.`:'Bạn chưa trả lời câu nào. Thử lại nhé.',56)}</div>
      <div class="panel"><h3>Câu trả lời của bạn</h3><div class="sp-sumlist">${qs.map((q,k)=>`<div class="sp-sq"><div class="en sp-sqq">${esc(q)}</div><div class="en-s">${ans[k]&&ans[k].text?esc(ans[k].text):'<span class="note">(chưa trả lời)</span>'}</div>${SP_sampleHTML(q,samples,'Câu mẫu').replace('panel sp-sample','sp-sample sm')}</div>`).join('')}</div>
        <div class="row">${done.length?`<button class="btn sm need-ai" data-ai>${ic('sparkles')} Nhận xét cả lượt bằng AI</button>`:''}<button class="btn sm" data-again>${ic('rotate-ccw')} Làm lại</button>${extra?extra.html:''}</div>
        <div class="sp-ai"></div></div></div>`;
    refreshAIBits();
    $('[data-back]',el).onclick=()=>SP_home(el);
    $('[data-again]',el).onclick=()=>{i=0;ans.length=0;draw();};
    const ai=$('[data-ai]',el); if(ai)ai.onclick=()=>{const d=qs.map((q,k)=>[q,ans[k]&&ans[k].text]).filter(x=>x[1]);
      SP_feedback($('.sp-ai',el),{part,qs:d.map(x=>x[0]),answers:d.map(x=>x[1]),desc:`IELTS Speaking ${part}, ${d.length} questions on "${title}". Judge the set of answers as a whole.`});};
    if(extra)extra.bind(el);
  };
  draw();
}
function SP_p1(el,ti){
  const t=SP_D.p1[ti];
  SP_series(el,{label:'Part 1',title:t.topic,qs:t.qs.slice(0,5),samples:t.samples,part:'Part 1',back:'Chủ đề khác',voice:pick(['m','f']),
    hint:'Trả lời 2-3 câu, khoảng 20-30 giây: nói ý chính, thêm một lý do hoặc ví dụ.',
    extra:{html:`<button class="btn sm" data-other>Chủ đề khác</button>`,bind:el=>{$('[data-other]',el).onclick=()=>{SP_tab='p1';SP_home(el);};}}});
}
function SP_p3(el,ci){
  const c=SP_D.p2[ci];
  SP_series(el,{label:'Part 3',title:c.card.replace(/^Describe /,'').replace(/\.$/,'').replace(/^./,m=>m.toUpperCase()),qs:c.p3,samples:c.p3samples,part:'Part 3',id:c.id,back:'Danh sách',voice:pick(['m','f']),
    hint:'Part 3 cần trả lời dài hơn, khoảng 40-60 giây: nêu quan điểm, giải thích lý do, thêm ví dụ hoặc so sánh.',
    extra:{html:`<button class="btn sm" data-other>Chủ đề khác</button>`,bind:el=>{$('[data-other]',el).onclick=()=>{SP_tab='p3';SP_home(el);};}}});
}

/* ---------- Part 2: cue card + 1 minute prep + 2 minutes talk ---------- */
function SP_cardHTML(c){
  return `<div class="sp-card en"><div class="sp-card-t">${esc(c.card)}</div><div class="sp-card-s">${esc(c.bullets[0])}</div>
    <ul>${c.bullets.slice(1).map(b=>`<li>${esc(b)}</li>`).join('')}</ul><div class="sp-card-t2">${esc(c.explain)}</div></div>`;
}
/* runs the cue card: ready -> prep (60s, notes) -> talk (120s) ; opts {voice, exam, onDone(rec)} */
function SP_p2run(host,c,o){
  const voice=o.voice||'f';
  host.innerHTML=`${SP_cardHTML(c)}<div class="sp-p2s"></div>`;
  const s=$('.sp-p2s',host);
  const intro="Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish.";
  s.innerHTML=`<p class="note">Giám khảo đưa thẻ và cho bạn 1 phút chuẩn bị. Bạn được ghi chú ngắn.</p>
    <div class="row"><button class="btn primary" data-prep>${ic('timer')} Bắt đầu 1 phút chuẩn bị</button><button class="btn ghost sm" data-now>Bắt đầu nói luôn</button></div>`;
  let notes='';
  const talk=()=>{
    SP_stopAll(); const ta=$('.sp-notes',s); if(ta)notes=ta.value;
    s.innerHTML=`${notes.trim()?`<div class="sp-notesv"><span class="label">Ghi chú của bạn</span><div>${esc(notes)}</div></div>`:''}<div class="sp-talk"></div>`;
    const go=()=>{if(!document.body.contains(s))return;SP_rec($('.sp-talk',s),{q:SP_cardText(c),aiQ:SP_cardText(c),hideQ:true,voice,part:'Part 2',id:c.id,title:'Speaking Part 2: '+c.card,record:!o.exam,exam:o.exam,
      autoStart:true,limit:120,warn:true,onDone:r=>o.onDone&&o.onDone(r),onReset:()=>o.onReset&&o.onReset()});};
    say("Alright. Remember, you have one to two minutes for this. Please start speaking now.",{voice,lang:'en-GB'}).then(go);
  };
  const prep=()=>{
    stopSay(); let left=60;
    s.innerHTML=`<div class="spread"><span class="label">Thời gian chuẩn bị</span><span class="timer-chip">${ic('timer')} <span data-pt>${fmtTime(left)}</span></span></div>
      <textarea class="sp-notes" rows="4" placeholder="Ghi chú ý chính: ai, ở đâu, khi nào, chuyện gì, cảm nghĩ... Chỉ vài từ khóa thôi."></textarea>
      <p class="note">Mẹo: mỗi gợi ý trên thẻ ghi 2-3 từ khóa, thêm một chi tiết cụ thể (tên, con số, cảm xúc) để nói đủ 2 phút.</p>
      <div class="row"><button class="btn primary" data-now>${ic('mic')} Bắt đầu nói luôn</button></div>`;
    $('[data-now]',s).onclick=talk;
    setTimeout(()=>{const t=$('.sp-notes',s);if(t)t.focus({preventScroll:true});},30);
    const t=SP_every(()=>{left--;const e=$('[data-pt]',s);if(e)e.textContent=fmtTime(left);const ch=$('.timer-chip',s);if(ch)ch.classList.toggle('low',left<=10);if(left<=0){t.stop();talk();}});
  };
  $('[data-prep]',s).onclick=()=>{prep();say(intro,{voice,lang:'en-GB'});};
  $('[data-now]',s).onclick=talk;
}
function SP_p2(el,ci){
  SP_stopAll(); SP_hook();
  const c=SP_D.p2[ci], voice=pick(['m','f']);
  el.innerHTML=`<div class="view sp">${SP_head(el,'Danh sách','Part 2',SP_TOP[c.topic]?'Cue card: '+SP_TOP[c.topic]:'Cue card')}
    <div class="panel" id="spRun"></div><div id="spAfter" class="sp-after"></div></div>`;
  $('[data-back]',el).onclick=()=>{SP_tab='p2';SP_home(el);};
  SP_p2run($('#spRun',el),c,{voice,onReset:()=>{$('#spAfter',el).innerHTML='';},onDone:()=>{
    const a=$('#spAfter',el);
    a.innerHTML=`<div class="panel"><h3>Từ vựng hay cho đề này</h3><div class="sp-vocab">${c.vocab.map(([en,vi])=>`<div class="sp-v"><button class="spk sm" data-say="${esc(en)}" aria-label="Nghe">${SPK}</button><div><b class="en">${esc(en)}</b><span class="note">${esc(vi)}</span></div></div>`).join('')}</div></div>
      <div class="panel"><div class="spread"><h3>Bài mẫu band 8</h3><button class="btn sm" data-show>Xem bài mẫu</button></div><div class="sp-hid" hidden>
        <div class="ex sp-ex"><button class="spk" data-say="${esc(c.sample)}" data-voice="${voice==='m'?'f':'m'}" aria-label="Nghe bài mẫu">${SPK}</button><div class="en-s">${esc(c.sample)}</div></div>
        <p class="note">Để ý cách bài mẫu đi lần lượt qua từng gợi ý trên thẻ và kết bằng phần "explain" dài nhất.</p></div></div>
      <div class="row"><button class="btn primary" data-p3>Sang Part 3 ${ic('chevron-right')}</button><button class="btn" data-other>${ic('repeat')} Cue card khác</button></div>`;
    $('[data-show]',a).onclick=e=>{const h=$('.sp-hid',a);h.hidden=!h.hidden;e.currentTarget.textContent=h.hidden?'Xem bài mẫu':'Ẩn bài mẫu';};
    $('[data-p3]',a).onclick=()=>SP_p3(el,ci);
    $('[data-other]',a).onclick=()=>SP_p2(el,SP_D.p2.indexOf(pick(SP_D.p2.filter(x=>x!==c))));
  }});
}

/* ---------- AI examiner chat (mock interview) ---------- */
function SP_chat(el){
  SP_stopAll(); SP_hook();
  const D=SP_D, t1=pick(D.p1), card=pick(D.p2), voice=pick(['m','f']);
  const C={stage:'p1',n1:0,n3:0,msgs:[],log:[],busy:false,ended:false,lis:null,base:'',t0:0};
  const sys=`You are a friendly but strict IELTS Speaking examiner running a real practice test with a Vietnamese candidate. Speak British English. Rules: ask exactly one question per turn; keep each turn short (one or two sentences); never correct, teach or praise the candidate's English during the test; do not give feedback or scores; react naturally to what the candidate says when moving on; no lists, no markdown, no emoji, no em dash. Output only what the examiner says aloud.`;
  el.innerHTML=`<div class="view sp">
    <div class="spread"><button class="btn ghost sm" data-back>${ic('chevron-left')} Thoát</button><span class="pill ai" data-stage>Part 1</span></div>
    <div class="spread"><h2>Giám khảo AI</h2><button class="btn sm" data-end>${ic('award')} Kết thúc và chấm</button></div>
    <div class="sp-chat" aria-live="polite"></div>
    <div class="panel sp-comp"></div>
    <div class="sp-res"></div></div>`;
  const log=$('.sp-chat',el), comp=$('.sp-comp',el), res=$('.sp-res',el);
  $('[data-back]',el).onclick=()=>{SP_tab='ai';SP_home(el);};
  $('[data-end]',el).onclick=()=>grade();
  const stageName={p1:'Part 1',p2:'Part 2',p3:'Part 3',end:'Chấm điểm'};
  const setStage=s=>{C.stage=s;const p=$('[data-stage]',el);if(p)p.textContent=stageName[s]||s;};
  const scroll=()=>{const last=log.lastElementChild;if(last&&last.scrollIntoView)last.scrollIntoView({block:'nearest',behavior:'smooth'});};
  const addEx=(text,{speak=true,cardHTML=''}={})=>{
    text=SP_c(text).trim(); C.log.push({who:'ex',text});
    const d=document.createElement('div'); d.className='sp-msg ex';
    d.innerHTML=`<div class="sp-who">Giám khảo</div><div class="sp-bub"><div class="en-s">${esc(text)}</div><button class="spk sm" data-say="${esc(text)}" data-voice="${voice}" aria-label="Nghe lại">${SPK}</button></div>${cardHTML}`;
    log.appendChild(d); scroll();
    setTimeout(()=>{if(comp.scrollIntoView&&!C.ended)comp.scrollIntoView({block:'nearest',behavior:'smooth'});},60);
    return speak?say(text,{voice,lang:'en-GB'}):Promise.resolve();
  };
  const addMe=text=>{C.log.push({who:'me',text,stage:C.stage});const d=document.createElement('div');d.className='sp-msg me';d.innerHTML=`<div class="sp-who">Bạn</div><div class="sp-bub"><div class="en-s">${esc(text)}</div></div>`;log.appendChild(d);scroll();};
  const typing=on=>{let d=$('.sp-typing',log);if(on&&!d){d=document.createElement('div');d.className='sp-msg ex sp-typing';d.innerHTML='<div class="sp-bub"><span class="sp-dots"><i></i><i></i><i></i></span></div>';log.appendChild(d);scroll();}if(!on&&d)d.remove();};
  const fallbackQ=()=>C.stage==='p1'?(C.n1===0?`Let's talk about ${t1.topic.toLowerCase()}. ${t1.qs[0]}`:(t1.qs[C.n1]||pick(t1.qs))):(card.p3[C.n3]||pick(card.p3));
  async function exTurn(userContent){
    C.busy=true; drawComp(); typing(true);
    C.msgs.push({role:'user',content:userContent});
    let text='';
    try{const r=await ask(C.msgs);text=SP_c(r&&r.text||'').trim();}catch(e){text='';if(!C.warned){C.warned=1;toast(aiError(e)+' Mít dùng câu hỏi có sẵn.',4000);}}
    if(!document.body.contains(log))return;
    if(!text)text=fallbackQ();
    C.msgs.push({role:'assistant',content:text});
    typing(false); C.busy=false; drawComp();
    await addEx(text);
  }
  function stopMic(){if(C.lis){try{C.lis.stop();}catch(e){}C.lis=null;}const b=$('[data-mic]',comp);if(b){b.setAttribute('aria-pressed','false');b.innerHTML=`${ic('mic')} Nói`;}}
  SP_live.add(stopMic);
  function micOn(ta){
    if(C.lis){stopMic();return;}
    stopSay(); C.base=ta.value.trim()?ta.value.trim()+' ':'';
    C.lis=listen({lang:'en-GB',onText:tx=>{ta.value=C.base+tx;}});
    if(!C.lis){toast(SP_NOSR+'.',4000);ta.focus();return;}
    const b=$('[data-mic]',comp); if(b){b.setAttribute('aria-pressed','true');b.innerHTML=`<i class="sp-dot"></i> Đang nghe, bấm để dừng`;}
  }
  function drawComp(){
    if(C.ended){comp.hidden=true;return;}
    comp.hidden=false;
    if(C.stage==='p2'){return;} // Part 2 composer is drawn by p2 flow
    comp.innerHTML=`<textarea class="sp-in en-s" rows="3" placeholder="${C.busy?'Giám khảo đang nói...':'Bấm Nói để trả lời bằng giọng, hoặc gõ câu trả lời'}" ${C.busy?'disabled':''}></textarea>
      <div class="spread"><div class="row"><button class="btn sm" data-mic aria-pressed="false" ${C.busy?'disabled':''}>${ic('mic')} Nói</button>${SP_hasSR()?'':`<span class="note">${SP_NOSR}.</span>`}</div>
      <button class="btn primary" data-send ${C.busy?'disabled':''}>Gửi ${ic('chevron-right')}</button></div>`;
    const ta=$('.sp-in',comp);
    $('[data-mic]',comp).onclick=()=>micOn(ta);
    $('[data-send]',comp).onclick=()=>send(ta.value);
    ta.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send(ta.value);}};
  }
  async function send(v){
    v=String(v||'').trim(); if(!v||C.busy||C.ended)return;
    stopMic(); stopSay(); addMe(v); if(countWords(v)>=5)award('speak',1);
    if(C.stage==='p1'){
      C.n1++;
      if(C.n1<4)await exTurn(`Candidate: ${v}\n\n[Examiner note: ask the next Part 1 question about "${t1.topic}" (or a natural follow-up to the answer). Suggested questions: ${t1.qs.join(' | ')}]`);
      else startP2(v);
    }else if(C.stage==='p3'){
      C.n3++;
      if(C.n3<4)await exTurn(`Candidate: ${v}\n\n[Examiner note: Part 3. Ask the next discussion question linked to the cue card topic, reacting to what the candidate just said. You may use or adapt: ${card.p3.join(' | ')}]`);
      else{C.msgs.push({role:'user',content:'Candidate: '+v});await addEx('Thank you. That is the end of the speaking test.');grade();}
    }
  }
  function startP2(lastAns){
    setStage('p2');
    const line="Thank you. Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish. Here is your topic.";
    C.msgs.push({role:'user',content:'Candidate: '+lastAns});
    C.msgs.push({role:'assistant',content:line+' Cue card: '+SP_cardText(card).replace(/\n/g,' ')});
    addEx(line,{cardHTML:SP_cardHTML(card)});
    comp.innerHTML='';
    let left=60;
    comp.innerHTML=`<div class="spread"><span class="label">1 phút chuẩn bị</span><span class="timer-chip">${ic('timer')} <span data-pt>${fmtTime(left)}</span></span></div>
      <textarea class="sp-notes" rows="3" placeholder="Ghi chú vài từ khóa"></textarea>
      <div class="row"><button class="btn primary" data-now>${ic('mic')} Bắt đầu nói luôn</button></div>`;
    const tk=SP_every(()=>{left--;const e=$('[data-pt]',comp);if(e)e.textContent=fmtTime(left);if(left<=0){tk.stop();talk();}});
    $('[data-now]',comp).onclick=()=>{tk.stop();talk();};
    function talk(){
      const notes=($('.sp-notes',comp)||{}).value||'';
      tk.stop();
      comp.innerHTML=`${notes.trim()?`<div class="sp-notesv"><span class="label">Ghi chú</span><div>${esc(notes)}</div></div>`:''}<div class="sp-talk"></div>`;
      const go=()=>{if(!document.body.contains(comp))return;
        const r=SP_rec($('.sp-talk',comp),{q:SP_cardText(card),hideQ:true,voice,part:'Part 2',id:card.id,exam:true,autoStart:true,limit:120,warn:true,
          onDone:rr=>{const box=$('.sp-talk',comp);const row=document.createElement('div');row.className='row';row.innerHTML=`<button class="btn primary" data-p2send>Gửi phần nói ${ic('chevron-right')}</button>`;box.appendChild(row);
            $('[data-p2send]',comp).onclick=()=>{const v=rr.text;if(!v){toast('Chưa có nội dung. Gõ lại phần bạn đã nói.');return;}endP2(v);};}});
        C.p2rec=r;};
      addEx('Alright. Remember, you have one to two minutes for this. Please start speaking now.').then(go);
    }
  }
  async function endP2(v){
    addMe(v); setStage('p3');
    await exTurn(`Candidate (Part 2 long turn): ${v}\n\n[Examiner note: Part 2 is over. Say a very short thank you, then begin Part 3: "We've been talking about ${card.card.replace(/^Describe /,'').replace(/\.$/,'')}. I'd like to discuss some more general questions related to this." Then ask one discussion question that reacts to what the candidate said. You may use or adapt: ${card.p3.join(' | ')}]`);
  }
  function grade(){
    const answers=C.log.filter(x=>x.who==='me');
    if(!answers.length){toast('Bạn chưa trả lời câu nào.');return;}
    SP_stopAll(); C.ended=true; setStage('end'); drawComp();
    const b=$('[data-end]',el); if(b)b.hidden=true;
    const block=C.log.map(x=>(x.who==='ex'?'Examiner: ':'Candidate (transcript): ')+x.text).join('\n\n').slice(-38000);
    res.innerHTML=`<div class="panel"><h3>Kết quả buổi phỏng vấn</h3><div class="sp-ai"></div><div class="row"><button class="btn" data-new>${ic('repeat')} Phỏng vấn lại</button></div></div>`;
    $('[data-new]',res).onclick=()=>SP_chat(el);
    SP_feedback($('.sp-ai',res),{record:true,id:'mock-ai',title:'Speaking: phỏng vấn giám khảo AI',block,
      desc:`A full IELTS Speaking mock interview (Part 1 on "${t1.topic}", Part 2 cue card "${card.card}", Part 3 discussion). The test may have been ended early; assess what is there. For "upgrade", rewrite the candidate's Part 2 long turn (or their longest answer) at band 8.`});
    res.scrollIntoView&&res.scrollIntoView({block:'start',behavior:'smooth'});
  }
  drawComp();
  exTurn(sys+`\n\nThe test starts now. Part 1 topic: "${t1.topic}". Suggested questions: ${t1.qs.join(' | ')}\nBegin with a one-line greeting, say you will ask some questions about ${t1.topic.toLowerCase()}, then ask the first question.`);
}

/* ---------- full speaking test without AI questions: window.SP_exam(el,{onDone}) ---------- */
async function SP_exam(el,{onDone,back}={}){
  SP_stopAll(); SP_hook();
  el.innerHTML='<div class="view"><p class="note">Đang chuẩn bị đề...</p></div>';
  let D; try{D=await SP_data();}catch(e){el.innerHTML='<div class="view"><p class="note">Chưa tải được đề Speaking. Kiểm tra mạng rồi thử lại.</p></div>';onDone&&onDone(null);return;}
  const t1=pick(D.p1), card=pick(D.p2), voice=pick(['m','f']);
  const q1=t1.qs.slice(0,4), q3=shuffle(card.p3).slice(0,Math.random()<0.5?3:4);
  const steps=[...q1.map((q,k)=>({part:'Part 1',q,k,n:q1.length})),{part:'Part 2'},...q3.map((q,k)=>({part:'Part 3',q,k,n:q3.length}))];
  const out=[]; let i=0, finished=false;
  const fin=b=>{if(finished)return;finished=true;onDone&&onDone(b);};
  const shell=(inner,label)=>`<div class="view sp sp-exam"><div class="spread"><h2>Thi thử Speaking</h2><span class="pill ai">${label||''}</span></div>${SP_dots(steps.length,i)}${inner}</div>`;
  el.innerHTML=shell(`<div class="panel">${mcSay('calm','Bài thi gồm 3 phần, khoảng 12 phút. Giám khảo đọc từng câu hỏi, bạn bấm "Trả lời" rồi nói, xong bấm "Xong". Part 2 có 1 phút chuẩn bị và tối đa 2 phút nói. Trong bài thi không có câu mẫu hay nhận xét, kết quả xem ở cuối.',60)}
    <ul class="sp-ul"><li>Part 1: ${q1.length} câu về chủ đề quen thuộc</li><li>Part 2: một cue card</li><li>Part 3: ${q3.length} câu thảo luận</li></ul>
    <div class="row"><button class="btn primary" data-start>${ic('play')} Bắt đầu</button>${back?'<button class="btn ghost" data-back>Quay lại</button>':''}</div></div>`,'Sẵn sàng');
  $('[data-start]',el).onclick=()=>step();
  const bk=$('[data-back]',el); if(bk)bk.onclick=back;
  function step(){
    SP_stopAll();
    const s=steps[i];
    if(!s)return results();
    if(s.part==='Part 2'){
      el.innerHTML=shell(`<div class="panel" id="spRun"></div><div class="row" id="spNx"></div>`,'Part 2');
      SP_p2run($('#spRun',el),card,{voice,exam:true,onDone:r=>{
        $('#spNx',el).innerHTML=`<button class="btn primary" data-next>Sang Part 3 ${ic('chevron-right')}</button>`;
        $('[data-next]',el).onclick=()=>{out.push({part:'Part 2',q:SP_cardText(card),text:r.text,secs:r.secs});i++;step();};
      }});
      return;
    }
    el.innerHTML=shell(`<div class="spread"><h3>${s.part}</h3><span class="note num">Câu ${s.k+1}/${s.n}</span></div><div class="panel" id="spR"></div><div class="row" id="spNx"></div>`,s.part);
    const pre=s.k===0?(s.part==='Part 1'?`In this first part, I'd like to ask you some questions about ${t1.topic.toLowerCase()}. `:`We've been talking about ${card.card.replace(/^Describe /,'').replace(/\.$/,'')}. I'd like to discuss with you some more general questions related to this. `):'';
    const r=SP_rec($('#spR',el),{q:s.q,voice,part:s.part,exam:true,hint:s.part==='Part 1'?'Trả lời 2-3 câu, khoảng 20-30 giây.':'Trả lời khoảng 40-60 giây: quan điểm, lý do, ví dụ.',
      onDone:rr=>{
        const last=i===steps.length-1;
        $('#spNx',el).innerHTML=`<button class="btn primary" data-next>${last?'Nộp bài':'Câu tiếp'} ${ic('chevron-right')}</button>`;
        $('[data-next]',el).onclick=()=>{out.push({part:s.part,q:s.q,text:rr.text,secs:rr.secs});i++;step();};
      }});
    say(pre+s.q,{voice,lang:'en-GB'});
    void r;
  }
  function results(){
    SP_stopAll(); i=steps.length;
    const answered=out.filter(x=>x.text);
    const samples=`<div class="panel"><h3>Câu mẫu để so sánh</h3>
      ${q1.map(q=>SP_sampleHTML(q,t1.samples,'Part 1: '+esc(q))).join('')}
      <div class="panel sp-sample"><h3>Part 2: bài mẫu band 8</h3><div class="ex sp-ex"><button class="spk" data-say="${esc(card.sample)}" aria-label="Nghe">${SPK}</button><div class="en-s">${esc(card.sample)}</div></div></div>
      ${q3.map(q=>SP_sampleHTML(q,card.p3samples,'Part 3: '+esc(q))).join('')}</div>`;
    const yours=`<details class="sp-det panel"><summary>Xem lại câu trả lời của bạn (${answered.length}/${out.length})</summary><div class="sp-sumlist">${out.map(x=>`<div class="sp-sq"><span class="pill">${x.part}</span><div class="en sp-sqq">${esc(x.q.split('\n')[0])}</div><div class="en-s">${x.text?esc(x.text):'<span class="note">(chưa trả lời)</span>'}</div></div>`).join('')}</div></details>`;
    el.innerHTML=shell(`<div class="panel"><h3>Kết quả</h3><div class="sp-ai"></div></div>${yours}${samples}
      <div class="row"><button class="btn" data-again>${ic('repeat')} Thi đề khác</button></div>`,'Kết quả');
    $('[data-again]',el).onclick=()=>SP_exam(el,{onDone,back});
    const box=$('.sp-ai',el);
    if(!answered.length){box.innerHTML=mcSay('hmm','Bạn chưa trả lời câu nào nên chưa chấm được. Xem câu mẫu bên dưới rồi thử lại nhé.',56);fin(null);return;}
    if(!AI){box.innerHTML=mcSay('ok','Bạn đã làm xong bài thi. Chưa bật trợ lý AI nên chưa chấm band được. Nghe lại câu mẫu và so với câu trả lời của bạn nhé.',56);fin(null);return;}
    const block=out.map(x=>`[${x.part}]${x.secs?` (${Math.round(x.secs)}s)`:''}\nExaminer: ${x.q.replace(/\n/g,' ')}\nCandidate (transcript): ${x.text||'(no answer)'}`).join('\n\n');
    SP_feedback(box,{record:true,id:'exam-'+card.id,title:'Thi thử Speaking: '+t1.topic+' + '+card.card,block,
      desc:`A full IELTS Speaking test: Part 1 (${q1.length} questions on "${t1.topic}"), Part 2 long turn (cue card "${card.card}", 1 minute preparation, up to 2 minutes), Part 3 (${q3.length} discussion questions). Give one set of band scores for the whole test. For "upgrade", rewrite the candidate's Part 2 long turn at band 8.`,
      onBand:b=>{confetti&&b>=6.5&&confetti();fin(b);}});
    // if grading fails, the retry button stays; let the caller continue anyway
    const skip=document.createElement('div');skip.className='row';skip.innerHTML='<button class="btn ghost sm" data-skip>Bỏ qua chấm điểm</button>';
    box.parentNode.appendChild(skip); $('[data-skip]',skip).onclick=()=>{skip.remove();fin(null);};
    const obs=setInterval(()=>{if(finished||!document.body.contains(skip)){clearInterval(obs);skip.remove();}},500);
  }
}
window.SP_exam=(el,opts)=>SP_exam(el,opts||{});
