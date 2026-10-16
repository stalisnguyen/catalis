/* ================= TEST ENGINE (TS_*) shared by Listening, Reading and Thi thử =================
   A "section" is one listening part or one reading passage: {sid, src, groups, start, paras?, p}
   Answers live in a plain object A keyed "sid.groupIndex.itemIndex" (multi: array of picked indexes). */
const TS_ROM=['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv'];
const TS_LET='ABCDEFGHIJKLMNOP'.split('');
const TS_GAP=new Set(['form','note','table','sentcomp','sumcomp','notecomp','shortans']);
const TS_TF={tfng:['TRUE','FALSE','NOT GIVEN'],ynng:['YES','NO','NOT GIVEN']};
let TS_cleans=[];
function TS_onClean(f){TS_cleans.push(f);}
function TS_clean(){const c=TS_cleans;TS_cleans=[];c.forEach(f=>{try{f();}catch(e){console.warn(e);}});}
function TS_count(groups){return groups.reduce((s,g)=>s+g.items.length*(g.kind==='multi'?2:1),0);}
function TS_answered(A){return Object.values(A).reduce((s,v)=>s+(Array.isArray(v)?v.length:(v!==''&&v!=null&&String(v).trim()?1:0)),0);}
const TS_v=dv=>/^\d+$/.test(dv)?+dv:dv;
/* expert (band 8.5-9) pack: derived from data */
const TS_XPILL='<span class="pill ts-xp">Chuyên gia 8.5-9</span>';
const TS_bandHi=b=>{const m=String(b||'').match(/\d+(?:\.\d+)?/g);return m?+m[m.length-1]:0;};
const LS_isX=t=>+t>=7;
const RD_isXP=p=>TS_bandHi(p.band)>=9;
const RD_isXT=(R,type,t)=>R.some(p=>p.type===type&&p.test===t&&RD_isXP(p));
const TS_xHead=note=>`<div class="ts-xh"><h3>Đề chuyên gia (band 8.5-9)</h3><p class="note">${note}</p></div>`;
const LS_XNOTE='Khó hơn đề thường: người nói nhanh và tự nhiên, nhiều bẫy sửa lời và paraphrase.';
const RD_XNOTE='Khó hơn đề thường: bài học thuật dày, bẫy NOT GIVEN và paraphrase sát nghĩa.';

function TS_itemHTML(g,it,k,n,A,sec){
  const v=A[k], kind=g.kind;
  const num=`<span class="ts-n num">${kind==='multi'?n+'-'+(n+1):n}</span>`;
  let body;
  if(TS_GAP.has(kind)){
    const inp=`<input type="text" class="ts-gap" data-k="${k}" placeholder="${n}" value="${esc(v||'')}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Câu ${n}">`;
    const parts=String(it.q).split(/_{3,}/);
    const txt=s=>esc(s).replace(/ \| /g,'<span class="ts-sep">|</span>');
    body=`<div class="ts-qt">${parts.length>1?txt(parts[0])+inp+txt(parts.slice(1).join('___')):txt(it.q)+' '+inp}</div>`;
  }else if(kind==='mcq'){
    body=`<div class="ts-qt">${esc(it.q)}</div><div class="ts-ch">${it.o.map((o,i)=>`<button type="button" class="ts-c" data-k="${k}" data-v="${i}" aria-pressed="${v===i}"><b>${TS_LET[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`;
  }else if(TS_TF[kind]){
    body=`<div class="ts-qt">${esc(it.q)}</div><div class="ts-tf">${TS_TF[kind].map(c=>`<button type="button" class="ts-c sm" data-k="${k}" data-v="${c}" aria-pressed="${v===c}">${c}</button>`).join('')}</div>`;
  }else if(kind==='multi'){
    const s=v||[];
    body=`<div class="ts-qt">${esc(it.q)} <span class="ts-hint">Chọn 2 đáp án</span></div><div class="ts-ch">${it.o.map((o,i)=>`<button type="button" class="ts-c ts-m" data-k="${k}" data-m="${i}" aria-pressed="${s.includes(i)}"><b>${TS_LET[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`;
  }else{ // matching, matchfeat, headings, matchinfo
    const labs=kind==='matchinfo'?(sec.paras||[]):(kind==='headings'?TS_ROM:TS_LET).slice(0,(g.opts||[]).length);
    const vals=kind==='matchinfo'?labs:labs.map((_,i)=>String(i));
    body=`<div class="ts-sel"><span class="ts-qt">${esc(it.q)}</span><select data-k="${k}" aria-label="Câu ${n}"><option value="">Chọn</option>${labs.map((l,i)=>`<option value="${vals[i]}" ${v!=null&&String(v)===vals[i]?'selected':''}>${l}</option>`).join('')}</select></div>`;
  }
  return `<div class="ts-it" data-item="${k}">${num}<div class="ts-body">${body}<div class="ts-fb" hidden></div></div></div>`;
}
function TS_qHTML(sec,A){
  let n=sec.start;
  return sec.groups.map((g,gi)=>{
    let box='';
    if(g.opts&&g.opts.length){const lab=g.kind==='headings'?TS_ROM:TS_LET;
      box=`<div class="ts-box">${g.kind==='headings'?'<div class="ts-box-t">List of Headings</div>':''}${g.opts.map((o,i)=>`<div class="ts-bo"><b>${lab[i]}</b><span>${esc(o)}</span></div>`).join('')}</div>`;}
    const items=g.items.map((it,ii)=>{const h=TS_itemHTML(g,it,sec.sid+'.'+gi+'.'+ii,n,A,sec);n+=g.kind==='multi'?2:1;return h;}).join('');
    return `<div class="ts-grp"><div class="ts-instr">${esc(g.instr)}</div>${box}<div class="ts-items">${items}</div></div>`;
  }).join('');
}
/* delegated input handling; survives innerHTML redraws of root */
function TS_bind(root,A,onChange){
  root.addEventListener('input',e=>{const t=e.target;if(t.matches('.ts-gap')){A[t.dataset.k]=t.value;onChange&&onChange();}});
  root.addEventListener('change',e=>{const t=e.target;if(t.matches('select[data-k]')){A[t.dataset.k]=t.value;onChange&&onChange();}});
  root.addEventListener('keydown',e=>{const t=e.target;if(e.key==='Enter'&&t.matches('.ts-gap')){e.preventDefault();const all=$$('.ts-gap',root);const nx=all[all.indexOf(t)+1];if(nx)nx.focus();else t.blur();}});
  root.addEventListener('click',e=>{
    const b=e.target.closest('.ts-c');if(!b||b.disabled||!root.contains(b))return;const k=b.dataset.k;
    if(b.dataset.m!=null){let s=(A[k]||[]).slice();const i=+b.dataset.m;
      if(s.includes(i))s=s.filter(x=>x!==i);else{s.push(i);if(s.length>2)s.shift();}
      A[k]=s;$$('.ts-c',b.parentNode).forEach(x=>x.setAttribute('aria-pressed',s.includes(+x.dataset.m)));}
    else{const v=TS_v(b.dataset.v);A[k]=A[k]===v?undefined:v;if(A[k]===undefined)delete A[k];
      $$('.ts-c',b.parentNode).forEach(x=>x.setAttribute('aria-pressed',A[k]!==undefined&&TS_v(x.dataset.v)===A[k]));}
    onChange&&onChange();
  });
}
function TS_mark(sec,A){
  const out=[];let n=sec.start;
  sec.groups.forEach((g,gi)=>g.items.forEach((it,ii)=>{
    const k=sec.sid+'.'+gi+'.'+ii, v=A[k], kind=g.kind;
    if(kind==='multi'){const s=(v||[]).slice().sort((a,b)=>a-b);const c=s.filter(i=>it.a.includes(i)).length;
      const r={k,kind,g,it,sec,multi:true,c,user:s.map(i=>TS_LET[i]).join(', '),right:it.a.slice().sort((a,b)=>a-b).map(i=>TS_LET[i]).join(', ')};
      out.push(Object.assign({},r,{n,ok:c>=1}),Object.assign({},r,{n:n+1,ok:c>=2,dup:true}));n+=2;return;}
    let ok=false,user='',right='';
    if(TS_GAP.has(kind)){user=String(v||'').trim();ok=!!user&&checkAnswer(user,it.a);right=String(it.a).split('|').join(' / ');}
    else if(kind==='mcq'){ok=v===it.a;user=v!=null?TS_LET[v]+'. '+it.o[v]:'';right=TS_LET[it.a]+'. '+it.o[it.a];}
    else if(TS_TF[kind]){ok=v===it.a;user=v||'';right=it.a;}
    else if(kind==='matchinfo'){ok=!!v&&v===it.a;user=v||'';right=it.a;}
    else{const lab=kind==='headings'?TS_ROM:TS_LET;const vi=v===''||v==null?null:+v;ok=vi===it.a;user=vi!=null?lab[vi]+'. '+g.opts[vi]:'';right=lab[it.a]+'. '+g.opts[it.a];}
    out.push({k,n,kind,g,it,sec,ok,user,right});n++;
  }));
  return out;
}
function TS_applyMarks(root,results,{onPara}={}){
  $$('input.ts-gap,select[data-k],.ts-c',root).forEach(x=>x.disabled=true);
  results.forEach(r=>{
    if(r.dup)return;const it=$(`[data-item="${r.k}"]`,root);if(!it)return;
    const full=r.multi?r.c===2:r.ok;it.classList.add(full?'ok':'bad');
    if(r.kind==='multi')$$('.ts-c',it).forEach(b=>{const i=+b.dataset.m;if(r.it.a.includes(i))b.classList.add('right');else if(b.getAttribute('aria-pressed')==='true')b.classList.add('wrong');});
    else if(r.kind==='mcq'||TS_TF[r.kind])$$('.ts-c',it).forEach(b=>{if(TS_v(b.dataset.v)===r.it.a)b.classList.add('right');else if(b.getAttribute('aria-pressed')==='true')b.classList.add('wrong');});
    else{const f=$('input.ts-gap,select',it);if(f)f.classList.add(r.ok?'ok':'bad');}
    const verdict=full?'Đúng':r.multi&&r.c===1?'Đúng 1 trong 2':'Sai';
    const fb=$('.ts-fb',it);
    fb.innerHTML=`<div><b class="${full?'ts-okt':'ts-badt'}">${verdict}.</b>${full?'':` Bạn ${TS_GAP.has(r.kind)?'viết':'chọn'}: <b>${r.user?esc(r.user):'(bỏ trống)'}</b>.`} Đáp án: <b>${esc(r.right)}</b></div>${r.it.why?`<div class="ts-why">${esc(r.it.why)}</div>`:''}${onPara&&r.it.para?`<button type="button" class="btn sm ts-para" data-para="${esc(r.it.para)}" data-sid="${esc(r.sec.sid)}">${ic('search')} Xem trong bài (đoạn ${esc(r.it.para)})</button>`:''}`;
    fb.hidden=false;
  });
  if(onPara)$$('.ts-para',root).forEach(b=>b.onclick=()=>onPara(b.dataset.sid,b.dataset.para));
}
/* wrong answers -> mistakes notebook, right ones -> __mistOk */
function TS_log(results){
  results.forEach(r=>{
    if(r.dup)return;const it=r.it,k=r.kind;let x;
    if(k==='mcq')x={q:it.q,o:it.o,a:it.a};
    else if(TS_TF[k])x={q:it.q,o:TS_TF[k],a:TS_TF[k].indexOf(it.a)};
    else if(k==='multi')x={q:it.q+' (chọn 2: '+it.o.map((o,i)=>TS_LET[i]+'. '+o).join('; ')+')',a:it.a.map(i=>it.o[i]).join(' and ')};
    else if(k==='matchinfo')x={q:it.q+' (đoạn nào?)',a:it.a};
    else if(r.g.opts)x={q:it.q,o:r.g.opts,a:it.a};
    else x={q:it.q,a:it.a};
    x.w=it.why||'';x.src=r.sec.src;
    if(r.multi?r.c===2:r.ok){window.__mistOk&&window.__mistOk(x);}else window.__mistake&&window.__mistake('q',x);
  });
}
function TS_resHTML({raw,total,band,label,results,buttons=''}){
  const p=raw/total, st=p>=.8?'yay':p>=.55?'ok':'hmm';
  const msg=p>=.8?'Rất tốt. Xem lại vài câu sai rồi thử đề khó hơn.':p>=.55?'Khá ổn. Đọc kỹ phần giải thích các câu sai bên dưới.':'Chưa sao, xem giải thích từng câu sai rồi làm lại sau vài ngày.';
  return `<div class="panel ts-res"><div class="ts-res-top">${typeof mascot==='function'?mascot(st,80):''}
    <div class="ts-res-n"><span class="label">${esc(label)}</span><div class="ts-score num">${raw}<span>/${total}</span></div><div class="ts-bandl">Band ước tính <b class="num">${fmtBand(band)}</b></div>${band>=8.5?'<span class="small ts-top">Mức này đủ cho yêu cầu 8.5+ của các chương trình khó nhất.</span>':''}</div></div>
    <p class="note">${msg} Bấm vào số câu để xem lại.</p>
    <div class="ts-dots">${results.map(r=>`<button type="button" class="ts-dot ${r.ok?'ok':''}" data-go="${r.k}" aria-label="Câu ${r.n} ${r.ok?'đúng':'sai'}">${r.n}</button>`).join('')}</div>
    ${buttons?`<div class="row">${buttons}</div>`:''}</div>`;
}
function TS_modeHTML(cur,notes){
  return `<div class="panel ts-mode"><div class="spread"><h3>Chế độ làm bài</h3><div class="row" id="tsMode">${[['practice','Luyện tập',ic('repeat')],['exam','Như thi thật',ic('timer')]].map(([k,t,i])=>`<button class="chip" data-mode="${k}" aria-pressed="${cur===k}">${i}${t}</button>`).join('')}</div></div><p class="note" id="tsModeN">${notes[cur]}</p></div>`;
}
function TS_bindMode(el,obj,notes){
  $$('#tsMode [data-mode]',el).forEach(b=>b.onclick=()=>{obj.mode=b.dataset.mode;touch('main');$$('#tsMode [data-mode]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));$('#tsModeN',el).textContent=notes[obj.mode];});
}
/* exit button: second press within 3 s leaves when work is in progress */
function TS_exitBtn(btn,busy,leave){let arm=0;btn.onclick=()=>{if(busy()&&Date.now()-arm>3000){arm=Date.now();toast('Bấm Thoát lần nữa để rời bài. Bài làm dở sẽ không được lưu.');return;}TS_clean();leave();};}
function TS_barHTML(title,extra=''){
  return `<div class="ts-bar"><div class="ts-bar-r1"><button class="btn ghost sm ts-back" id="tsBack" aria-label="Thoát">${ic('chevron-left')}<span class="ts-hide-s">Thoát</span></button>
    <div class="ts-bar-t"><b>${esc(title)}</b><span class="small muted" id="tsCnt"></span></div>
    <span class="timer-chip" id="tsTm" hidden>${ic('clock')}<span id="tsTmT">00:00</span></span>
    <button class="btn primary sm" id="tsSub">Nộp bài</button></div>${extra}</div>`;
}

/* ================= LISTENING (LS_*) ================= */
let LS_tok=0, LS_tab='parts';
const LS_sleep=ms=>new Promise(r=>setTimeout(r,ms));
const LS_PAUSE='<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>';
const LS_NOTES={practice:'Nghe lại từng câu thoải mái, dừng khi cần. Nộp bài xong sẽ xem được lời thoại và nghe lại từng dòng.',exam:'Bài nghe phát một lần, không dừng được. Câu hỏi hiện sẵn trong lúc nghe, hết bài có 2 phút kiểm tra lại rồi tự nộp.'};
// speaker of a line; two speakers of the same gender and accent in one part get different voices (f / f2, m / m2)
const LS_spk=(p,id)=>{
  if(!p._spk){const seen={};p._spk={};p.speakers.forEach(sp=>{const k=sp.accent+sp.voice;seen[k]=(seen[k]||0)+1;p._spk[sp.id]=Object.assign({},sp,{voice:seen[k]>1?sp.voice+'2':sp.voice});});}
  return p._spk[id]||p._spk[p.speakers[0].id];
};

VIEWS.listen=async el=>{
  window.__leave=TS_clean;TS_clean();
  el.innerHTML='<div class="view"><p class="note">Đang tải bài nghe...</p></div>';
  let L;try{L=await loadJSON('listening');}catch(e){el.innerHTML='<div class="view"><p class="note">Không tải được bài nghe. Kiểm tra mạng rồi thử lại.</p></div>';return;}
  P.ls=P.ls||{};P.ls.best=P.ls.best||{};
  LS_home(el,L);
};
function LS_home(el,L){
  TS_clean();window.__leave=TS_clean;
  el.innerHTML=`<div class="view"><div class="spread"><h2>Listening</h2><span class="note">${new Set(L.map(p=>p.test)).size} đề, ${L.length} part, ${L.reduce((s,p)=>s+TS_count(p.groups),0)} câu</span></div>
    ${subTabs('lsTabs',[['parts','Đề luyện'],['dict','Chép chính tả']],LS_tab,t=>{LS_tab=t;LS_home(el,L);})}
    <div id="lsBody" class="view"></div></div>`;
  const box=$('#lsBody',el);
  if(LS_tab==='dict'){LS_dict(box,L);return;}
  const mode=P.ls.mode||'practice', full=P.ls.full||{};
  const tests=[...new Set(L.map(p=>p.test))].sort((a,b)=>a-b);
  const sec=t=>{const ps=L.filter(p=>p.test===t).sort((a,b)=>a.part-b.part), n=ps.reduce((s,p)=>s+TS_count(p.groups),0), x=LS_isX(t);
    return `<section class="ts-test${x?' ts-xt':''}"><div class="spread"><h3>Test ${t}</h3><button class="btn sm" data-full="${t}">${ic('headphones')}Làm cả đề ${n} câu${full[t]!=null?` <span class="ts-best">${full[t]}/${n}</span>`:''}</button></div>
      <div class="ts-cards">${ps.map(p=>{const b=P.ls.best[p.id],c=TS_count(p.groups);
        return `<button class="ts-card" data-id="${p.id}"><span class="ts-card-h"><span class="pill">Part ${p.part}</span>${x?TS_XPILL:''}<span class="small muted num">Câu ${(p.part-1)*10+1}-${(p.part-1)*10+c}</span>${b!=null?`<span class="ts-best">${b}/${c}</span>`:''}</span><span class="t">${esc(p.title)}</span><span class="s">${esc(p.setting)}</span></button>`;}).join('')}</div></section>`;};
  const xs=tests.filter(LS_isX);
  box.innerHTML=TS_modeHTML(mode,LS_NOTES)+tests.filter(t=>!LS_isX(t)).map(sec).join('')+(xs.length?TS_xHead(LS_XNOTE)+xs.map(sec).join(''):'');
  TS_bindMode(box,P.ls,LS_NOTES);
  $$('[data-id]',box).forEach(b=>b.onclick=()=>{const p=L.find(x=>x.id===b.dataset.id);
    LS_run(el,{parts:[p],exam:(P.ls.mode||'practice')==='exam',title:`Listening Test ${p.test} Part ${p.part}`});});
  $$('[data-full]',box).forEach(b=>b.onclick=()=>TS_listenTest(el,+b.dataset.full,{exam:(P.ls.mode||'practice')==='exam'}));
}

/* runner: one part or a whole test (parts back to back) */
function LS_run(el,o){
  TS_clean();window.scrollTo(0,0);
  const {parts,exam=false,title,onDone,nextLabel,mock=false}=o;
  const onExit=o.onExit||(()=>go('listen'));
  const A={}, multi=parts.length>1;
  const secs=parts.map(p=>({sid:p.id,src:'Listening Test '+p.test+' Part '+p.part,groups:p.groups,start:(p.part-1)*10+1,p}));
  const total=secs.reduce((s,x)=>s+TS_count(x.groups),0);
  const seq=[];parts.forEach((p,pi)=>p.lines.forEach(([sid,t],li)=>seq.push({pi,sp:LS_spk(p,sid),t,pid:p.id,li,n:p.lines.length})));
  const LO=x=>({pid:x.pid,li:x.li,n:x.n,t:x.t,lang:x.sp.accent,voice:x.sp.voice});
  let last=-1,playing=false,pauseReq=false,started=false,done=false,sub=false,results=null,cp=0,chk=null,wait=0;
  const ctl=exam?'':`<button class="spk" id="lsPrev" aria-label="Dòng trước">${ic('chevron-left')}</button><button class="spk" id="lsRep" aria-label="Nghe lại dòng này">${ic('rotate-ccw')}</button><button class="spk" id="lsNext" aria-label="Dòng sau">${ic('chevron-right')}</button>`;
  el.innerHTML=`<div class="view ls-run">
    ${TS_barHTML(title,`<div class="ls-player" id="lsPlayer"><button class="ls-pp" id="lsPlay" aria-label="Phát">${ic('play')}</button>${ctl}<div class="ls-prog"><div class="ls-bar"><i id="lsFill"></i></div><div class="ls-meta" id="lsMeta"></div></div></div>`)}
    ${multi?`<div class="row tabs" id="lsParts">${parts.map((p,i)=>`<button class="chip" data-pt="${i}" aria-pressed="${i===0}">Part ${p.part}</button>`).join('')}</div>`:''}
    ${!multi?`<div class="ls-intro"><span class="pill">${exam?'Như thi thật':'Luyện tập'}</span> ${esc(parts[0].setting)}</div>`:`<div class="ls-intro"><span class="pill">${exam?'Như thi thật':'Luyện tập'}</span> Bốn part nghe liền nhau, giữa các part có 10 giây để đọc trước câu hỏi.</div>`}
    <div id="lsRes"></div>
    <div class="panel ts-qs" id="lsQs"></div>
    <div id="lsTr"></div></div>`;
  const qs=$('#lsQs',el);
  const cnt=()=>{const c=$('#tsCnt',el);if(c)c.textContent=sub?'Đã nộp bài':`Đã làm ${TS_answered(A)}/${total} câu`;};
  const drawQs=()=>{const s=secs[cp];
    qs.innerHTML=`<div class="spread"><h3>Part ${s.p.part}</h3><span class="small muted num">Câu ${s.start}-${s.start+TS_count(s.groups)-1}</span></div>${TS_qHTML(s,A)}`;
    if(results)TS_applyMarks(qs,results.filter(r=>r.sec===s));
    $$('#lsParts [data-pt]',el).forEach(b=>b.setAttribute('aria-pressed',+b.dataset.pt===cp));};
  const upd=()=>{
    if(sub)return;const x=seq[Math.max(0,last)];
    $('#lsFill',el).style.width=(done?100:Math.max(0,last+1)/seq.length*100)+'%';
    const pb=$('#lsPlay',el);
    if(exam){pb.disabled=started;pb.innerHTML=ic('play');}
    else{pb.innerHTML=playing&&!pauseReq?LS_PAUSE:ic('play');pb.setAttribute('aria-label',playing?'Tạm dừng':'Phát');}
    let m;
    if(exam)m=wait?`Đọc trước câu hỏi. Part ${parts[Math.min(parts.length-1,x.pi+1)].part} bắt đầu sau ${wait} giây`:done?'Bài nghe đã kết thúc. Kiểm tra lại câu trả lời.':started?`Đang phát${multi?' Part '+parts[x.pi].part:''}. Bài nghe không dừng được.`:'Bấm nút phát để bắt đầu. Bài nghe chỉ phát một lần.';
    else m=last<0?'Bấm phát để bắt đầu nghe':`Dòng ${last+1}/${seq.length}<span class="ls-who"> · ${esc(x.sp.name)}</span>${pauseReq?' · dừng sau câu này':''}${done&&!playing?' · đã hết bài':''}`;
    $('#lsMeta',el).innerHTML=m;
  };
  async function runFrom(i){
    const my=++LS_tok;stopSay();playing=true;pauseReq=false;started=true;done=false;upd();
    for(let j=i;j<seq.length;j++){
      const x=seq[j];
      if(multi&&x.pi!==cp&&(exam||j===i||x.pi!==seq[j-1].pi)){cp=x.pi;drawQs();}
      if(exam&&j>0&&x.pi!==seq[j-1].pi){last=j-1;for(wait=10;wait>0;wait--){upd();await LS_sleep(1000);if(my!==LS_tok)return;}wait=0;}
      last=j;upd();
      for(let q=1;q<=2;q++){const y=seq[j+q];if(y)prefetchLine(LO(y));}
      await sayLine(LO(x));
      if(my!==LS_tok)return;
      if(pauseReq){pauseReq=false;playing=false;upd();return;}
      const nx=seq[j+1];
      if(nx){await LS_sleep(nx.sp!==x.sp||nx.pi!==x.pi?800:350);if(my!==LS_tok)return;if(pauseReq){pauseReq=false;playing=false;upd();return;}}
    }
    playing=false;done=true;last=seq.length-1;upd();
    if(exam&&!sub)startCheck();
  }
  const halt=()=>{LS_tok++;stopSay();playing=false;pauseReq=false;};
  const startCheck=()=>{const tm=$('#tsTm',el);tm.hidden=false;
    chk=makeTimer(120,l=>{$('#tsTmT',el).textContent=fmtTime(l);tm.classList.toggle('low',l<=30);},()=>{toast('Hết giờ kiểm tra. Bài đã được nộp.');submit();});};
  $('#lsPlay',el).onclick=()=>{
    if(exam){if(!started)runFrom(0);return;}
    if(playing){if(pauseReq){halt();upd();}else{pauseReq=true;upd();}return;}
    runFrom(done||last<0?0:Math.min(seq.length-1,last+1));
  };
  if(!exam){
    $('#lsRep',el).onclick=()=>runFrom(Math.max(0,last));
    $('#lsPrev',el).onclick=()=>runFrom(Math.max(0,last-1));
    $('#lsNext',el).onclick=()=>runFrom(Math.min(seq.length-1,last+1));
  }
  $$('#lsParts [data-pt]',el).forEach(b=>b.onclick=()=>{cp=+b.dataset.pt;drawQs();});
  TS_bind(qs,A,cnt);
  TS_onClean(()=>{halt();chk&&chk.stop();});
  TS_exitBtn($('#tsBack',el),()=>(started||TS_answered(A)>0)&&!sub,onExit);
  $('#tsSub',el).onclick=()=>{if(!sub&&exam&&started&&!done&&TS_answered(A)<total&&!$('#tsSub',el).dataset.arm){$('#tsSub',el).dataset.arm=1;toast('Bài nghe chưa hết. Bấm Nộp bài lần nữa nếu muốn nộp ngay.');return;}submit();};

  function submit(){
    if(sub)return;sub=true;halt();chk&&chk.stop();
    results=secs.flatMap(s=>TS_mark(s,A));
    const raw=results.filter(r=>r.ok).length, band=bandOf('listening',raw,total);
    P.ls=P.ls||{};P.ls.best=P.ls.best||{};
    secs.forEach(s=>{const r=results.filter(x=>x.sec===s&&x.ok).length;P.ls.best[s.sid]=Math.max(P.ls.best[s.sid]??-1,r);});
    if(multi&&total>=40){P.ls.full=P.ls.full||{};P.ls.full[parts[0].test]=Math.max(P.ls.full[parts[0].test]??-1,raw);}
    TS_log(results);
    award('listen',total);if(total>=40&&!mock)award('test',1);
    recordScore({skill:'listening',band,raw,total,id:multi?'lt'+parts[0].test:parts[0].id,title});
    touch('main');
    $('#tsSub',el).hidden=true;$('#tsTm',el).hidden=true;$('#lsPlayer',el).hidden=true;cnt();
    const btns=onDone?`<button class="btn primary" id="lsNextSec">${esc(nextLabel||'Tiếp tục')} ${ic('chevron-right')}</button>`
      :`<button class="btn primary" id="lsAgain">${ic('rotate-ccw')}Làm lại</button><button class="btn" id="lsList">Về danh sách</button>`;
    $('#lsRes',el).innerHTML=TS_resHTML({raw,total,band,label:title,results,buttons:btns});
    const nb=$('#lsNextSec',el);if(nb)nb.onclick=()=>{TS_clean();onDone(raw,total);};
    const ag=$('#lsAgain',el);if(ag)ag.onclick=()=>LS_run(el,o);
    const li=$('#lsList',el);if(li)li.onclick=()=>{TS_clean();onExit();};
    $$('[data-go]',$('#lsRes',el)).forEach(b=>b.onclick=()=>{const r=results.find(x=>x.k===b.dataset.go);const i=secs.indexOf(r.sec);if(i!==cp){cp=i;drawQs();}const it=$(`[data-item="${r.k}"]`,qs);if(it){it.scrollIntoView({behavior:'smooth',block:'center'});it.classList.remove('ts-flash');void it.offsetWidth;it.classList.add('ts-flash');}});
    cp=0;drawQs();
    const tr=parts.map(p=>`${multi?`<h3 class="ls-trh">Part ${p.part}</h3>`:''}${p.lines.map(([sid,t],li)=>{const sp=LS_spk(p,sid);return `<div class="ls-tl"><button class="spk sm" data-pid="${p.id}" data-li="${li}" data-say="${esc(t)}" data-lang="${esc(sp.accent)}" data-voice="${esc(sp.voice)}" aria-label="Nghe dòng này">${SPK}</button><div class="ls-tlt"><span class="ls-sp">${esc(sp.name)}</span><span class="en-s">${esc(t)}</span></div></div>`;}).join('')}`).join('');
    $('#lsTr',el).innerHTML=exam?`<details class="g"><summary><span class="t">Xem lời thoại (transcript)</span>${ic('chevron-right')}</summary><div class="ls-trb">${tr}</div></details>`
      :`<div class="panel"><div class="spread"><h3>Lời thoại</h3><span class="small muted">Bấm loa để nghe lại từng dòng</span></div><div class="ls-trb">${tr}</div></div>`;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  drawQs();upd();cnt();
}

/* exported for the mock test: all 4 parts of a test as one 40-question exam */
async function TS_listenTest(el,testNo,opts={}){
  const L=await loadJSON('listening');
  const parts=L.filter(p=>p.test===testNo).sort((a,b)=>a.part-b.part);
  if(!parts.length){toast('Không tìm thấy đề Listening '+testNo);return;}
  LS_run(el,Object.assign({exam:true,title:'Listening Test '+testNo},opts,{parts,exam:opts.exam!==false}));
}
window.TS_listenTest=TS_listenTest;

/* ---------- dictation ---------- */
const LS_nw=w=>normAns(w).replace(/[^a-z0-9%]/g,'');
function LS_diff(target,typed){
  const T=target.split(/\s+/).filter(w=>LS_nw(w)), U=typed.split(/\s+/).filter(w=>LS_nw(w));
  const nt=T.map(LS_nw), nu=U.map(LS_nw), m=T.length, n=U.length;
  const d=Array.from({length:m+1},()=>new Array(n+1).fill(0));
  for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)d[i][j]=nt[i]===nu[j]?d[i+1][j+1]+1:Math.max(d[i+1][j],d[i][j+1]);
  const ops=[];let i=0,j=0;
  while(i<m||j<n){
    if(i<m&&j<n&&nt[i]===nu[j]){ops.push(['ok',T[i]]);i++;j++;}
    else if(j<n&&(i>=m||d[i][j+1]>=d[i+1][j])){ops.push(['extra',U[j]]);j++;}
    else{ops.push(['miss',T[i]]);i++;}
  }
  return {ops,ok:ops.filter(x=>x[0]==='ok').length,total:m};
}
function LS_dict(box,L){
  const pool=[];L.forEach(p=>p.lines.forEach(([sid,t],li)=>{const n=countWords(t);if(n>=8&&n<=25)pool.push({t,sp:LS_spk(p,sid),pid:p.id,li,n:p.lines.length,src:'Test '+p.test+' Part '+p.part});}));
  const sess={n:0,perfect:0};let cur=null,checked=false;
  const play=rate=>sayLine({pid:cur.pid,li:cur.li,n:cur.n,t:cur.t,lang:cur.sp.accent,voice:cur.sp.voice,rate});
  const draw=auto=>{
    cur=pick(pool);checked=false;
    box.innerHTML=`<div class="panel ls-dict"><div class="spread"><h3>Chép chính tả</h3><span class="small muted">${esc(cur.src)} · ${countWords(cur.t)} từ</span></div>
      <p class="note">Nghe một câu trong bài thi rồi gõ lại đúng từng từ. Nghe bao nhiêu lần cũng được. Không cần quan tâm chữ hoa và dấu câu.</p>
      <div class="row"><button class="btn primary" id="ldPlay">${ic('volume-2')}Nghe</button><button class="btn" id="ldSlow">${ic('snail')}Nghe chậm</button></div>
      <textarea id="ldIn" rows="3" placeholder="Gõ lại câu bạn nghe được" autocapitalize="off" autocorrect="off" spellcheck="false" class="en-s"></textarea>
      <div class="row"><button class="btn primary" id="ldChk">${ic('check')}Kiểm tra</button><button class="btn ghost" id="ldNext">Câu khác ${ic('chevron-right')}</button></div>
      <div id="ldOut"></div></div>
      <p class="note" id="ldSess">${sess.n?`Phiên này: ${sess.n} câu, ${sess.perfect} câu đúng hoàn toàn.`:'Mỗi câu chép xong được tính vào mục tiêu Nghe hôm nay.'}</p>`;
    $('#ldPlay',box).onclick=()=>play();
    $('#ldSlow',box).onclick=()=>play(Math.max(0.55,(P.settings.voiceRate||0.95)*0.72));
    $('#ldNext',box).onclick=()=>draw(true);
    const inp=$('#ldIn',box);
    inp.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();check();}};
    $('#ldChk',box).onclick=check;
    if(auto){play();setTimeout(()=>inp.focus(),50);}
  };
  function check(){
    const v=$('#ldIn',box).value;if(!v.trim()){toast('Gõ câu bạn nghe được trước đã.');return;}
    const r=LS_diff(cur.t,v), perfect=r.ok===r.total&&!r.ops.some(x=>x[0]==='extra');
    if(!checked){checked=true;sess.n++;if(perfect)sess.perfect++;award('listen',1);}
    $('#ldOut',box).innerHTML=`<div class="fb ${perfect?'ok':'bad'}"><b>${perfect?'Chính xác từng từ.':`Đúng ${r.ok}/${r.total} từ.`}</b>${perfect?'':' Chữ xanh là từ bạn nghe đúng, chữ đỏ gạch dưới là từ còn thiếu hoặc sai, chữ đỏ gạch ngang là từ thừa.'}</div>
      <div class="ls-diff en-s">${r.ops.map(([t,w])=>`<span class="ls-dw ${t}">${esc(w)}</span>`).join(' ')}</div>
      <div class="ex"><button class="spk" data-pid="${cur.pid}" data-li="${cur.li}" data-say="${esc(cur.t)}" data-lang="${esc(cur.sp.accent)}" data-voice="${esc(cur.sp.voice)}" aria-label="Nghe lại">${SPK}</button><div><div class="small muted">${esc(cur.sp.name)}</div><div class="en-s">${esc(cur.t)}</div></div></div>`;
    $('#ldSess',box).textContent=`Phiên này: ${sess.n} câu, ${sess.perfect} câu đúng hoàn toàn.`;
  }
  draw(false);
}
