/* ================= PLAN: XP, ranks, daily plan, band records, placement, mistakes, daily tip, reports ================= */
const PL_W={review:1,new:3,listen:1.5,read:1.5,write:25,speak:4,grammar:8,pron:2,test:30,game:1,daily:5,dict:2};
const PL_RANKS=[[0,'Freshman','Tân sinh viên'],[300,'Sophomore','Sinh viên năm hai'],[1000,'Junior','Sinh viên năm ba'],[2500,'Senior','Sinh viên năm cuối'],[5000,'Bachelor','Cử nhân'],[9000,'Master','Thạc sĩ'],[15000,'PhD','Tiến sĩ'],[25000,'Professor','Giáo sư']];
const TARGETS=[5,5.5,6,6.5,7,7.5,8,8.5,9];
function plDay(k){P.day=P.day||{};k=k||ymd(Date.now());return P.day[k]=P.day[k]||{xp:0};}
function plXPTotal(){return Object.values(P.day||{}).reduce((a,d)=>a+(d.xp||0),0);}
function plRank(xp){let r=PL_RANKS[0],nx=PL_RANKS[1];for(let i=0;i<PL_RANKS.length;i++){if(xp>=PL_RANKS[i][0]){r=PL_RANKS[i];nx=PL_RANKS[i+1]||null;}}return {r,nx};}
function award(kind,n){
  n=n||1; const d=plDay(); d[kind]=(d[kind]||0)+n; const before=plXPTotal();
  const gain=Math.round((PL_W[kind]||1)*n); d.xp=(d.xp||0)+gain;
  const k=ymd(Date.now()); P.hist[k]=(P.hist[k]||0)+n; touch('main');
  const a=plRank(before).r, b=plRank(plXPTotal()).r;
  window.__xpFly&&window.__xpFly(gain);
  if(b!==a){if(window.__rankUp)window.__rankUp(b);else toast('Lên danh hiệu mới: '+b[1],4000);}
  const goal=plGoalXP(); if(d.xp>=goal&&d.xp-gain<goal){if(window.__goalDone)setTimeout(window.__goalDone,b!==a?2500:600);}
}
window.__award=award;
function plCfg(){P.plan=P.plan||{target:6.5,minutes:30,exam:'academic',start:today(),auto:true};return P.plan;}
function plGoalXP(){return Math.round(plCfg().minutes*3.5);}
function plNewPerDay(){const m=plCfg().minutes;return m>=90?30:m>=60?22:m>=45?16:m>=30?12:8;}
function plLevels(t){return t<=5?[1]:t<=6?[1,2]:t<=7?[1,2,3]:t<=8?[1,2,3,4]:[3,4,5];}
function plApply(){const c=plCfg();if(!c.auto)return;P.settings.lv=plLevels(c.target);P.settings.newPerDay=plNewPerDay();}
function plTasks(){
  const c=plCfg(), d=plDay(), dow=new Date().getDay(), even=Math.floor(today()/DAY)%2===0;
  let due=0,nw=0;try{due=dueList(P.settings.lv).length;nw=Math.max(0,P.settings.newPerDay-newToday());}catch(e){}
  const t=[
    {k:'srs',t:'Ôn thẻ và học từ mới',sub:due+nw?`${due} thẻ đến hạn, ${nw} từ mới`:'Đã xong phần thẻ hôm nay',done:V.length>0&&due===0&&nw===0,go:'study'},
    {k:'listen',t:'Nghe 10 câu',sub:'Một part Listening hoặc chép chính tả',done:(d.listen||0)>=10,go:'listen',n:[(d.listen||0),10]},
    {k:'read',t:'Đọc 13 câu',sub:'Một passage Reading',done:(d.read||0)>=13,go:'read',n:[(d.read||0),13]},
    even?{k:'speak',t:'Nói 3 câu trả lời',sub:'Part 1, cue card hoặc Part 3',done:(d.speak||0)>=3,go:'speak',n:[(d.speak||0),3]}
        :{k:'grammar',t:'Học 1 điểm ngữ pháp',sub:'Đọc, làm quiz, bấm "Đã nắm"',done:(d.grammar||0)>=1,go:'grammar'},
    {k:'daily',t:'Mẹo hôm nay',sub:'Idiom, collocation hoặc mẹo thi',done:(d.daily||0)>=1,go:'daily'},
  ];
  if(c.minutes>=45)t.push({k:'write',t:'Viết 1 bài',sub:'Task 1 hoặc Task 2, AI chấm theo 4 tiêu chí',done:(d.write||0)>=1,go:'write'});
  if(c.minutes>=45&&!even)t.push({k:'speak',t:'Nói 3 câu trả lời',sub:'Part 1, cue card hoặc Part 3',done:(d.speak||0)>=3,go:'speak',n:[(d.speak||0),3]});
  if(dow===0)t.push({k:'test',t:'Thi thử cuối tuần',sub:'Một bài Listening hoặc Reading đủ 40 câu',done:(d.test||0)>=1,go:'test'});
  const mist=plMistList().length; if(mist)t.push({k:'mist',t:'Ôn sổ lỗi',sub:mist+' mục đang chờ',done:(d.mist||0)>=1,go:'mistakes'});
  return t;
}
function plWeek(){let xp=0,act=0,nw=0;for(let i=0;i<7;i++){const d=(P.day||{})[ymd(today()-i*DAY)];if(d){xp+=d.xp||0;if(d.xp)act++;nw+=d.new||0;}}return {xp,act,nw};}
function plSettings(){
  const c=plCfg();
  const m=modal(`<h2>Lộ trình học</h2>
    <label class="label">Dạng bài thi</label><div class="row">${[['academic','Academic'],['general','General Training']].map(([k,t])=>`<button class="chip" data-ex="${k}" aria-pressed="${c.exam===k}">${t}</button>`).join('')}</div>
    <label class="label">Band mục tiêu</label><div class="row">${TARGETS.map(b=>`<button class="chip" data-t="${b}" aria-pressed="${c.target===b}">${b.toFixed(1)}</button>`).join('')}</div>
    <label class="label">Số phút mỗi ngày</label><div class="row">${[15,30,45,60,90].map(n=>`<button class="chip" data-m="${n}" aria-pressed="${c.minutes===n}">${n} phút</button>`).join('')}</div>
    <label class="label">Ngày thi (nếu đã đăng ký)</label><input type="date" id="plDate" value="${c.date||''}" style="max-width:220px">
    <p class="note" id="plInfo"></p>
    <label class="row small"><input type="checkbox" id="plAuto" ${c.auto?'checked':''}> Tự chọn nhóm từ vựng và số từ mới mỗi ngày theo lộ trình</label>`);
  const info=()=>{plApply();const days=c.date?Math.ceil((new Date(c.date).getTime()-today())/DAY):null;
    $('#plInfo',m.el).textContent=`Mục tiêu band ${c.target.toFixed(1)} (${c.exam==='general'?'General Training':'Academic'}). Từ vựng: ${P.settings.lv.map(L=>LV_NAME[L]).join(', ')}, ${P.settings.newPerDay} từ mới mỗi ngày. Mục tiêu ${plGoalXP()} XP mỗi ngày.${days!=null&&days>0?` Còn ${days} ngày đến ngày thi.`:''}`;};info();
  $$('[data-ex]',m.el).forEach(b=>b.onclick=()=>{c.exam=b.dataset.ex;$$('[data-ex]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));info();touch('main');});
  $$('[data-t]',m.el).forEach(b=>b.onclick=()=>{c.target=+b.dataset.t;$$('[data-t]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));info();touch('main');});
  $$('[data-m]',m.el).forEach(b=>b.onclick=()=>{c.minutes=+b.dataset.m;$$('[data-m]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));info();touch('main');});
  $('#plDate',m.el).onchange=e=>{c.date=e.target.value;info();touch('main');};
  $('#plAuto',m.el).onchange=e=>{c.auto=e.target.checked;info();touch('main');};
  const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();queue=[];route();}});obs.observe(document.body,{childList:true});
}

/* ---------- band records ----------
   recordScore({skill:'listening'|'reading'|'writing'|'speaking'|'overall', band, raw, total, id, title, exam, detail})
   latestBands() -> {listening, reading, writing, speaking, overall} (latest band of each skill, or null) */
function recordScore(o){
  P.scores=P.scores||[]; P.scores.push(Object.assign({t:Date.now(),exam:examType()},o));
  if(P.scores.length>300)P.scores=P.scores.slice(-300); touch('main');
}
window.__score=recordScore;
function latestBands(){
  const out={listening:null,reading:null,writing:null,speaking:null,overall:null};
  (P.scores||[]).forEach(s=>{if(s.skill in out&&s.band!=null)out[s.skill]=s.band;});
  if(out.overall==null&&P.placeBand)out.overall=P.placeBand;
  return out;
}
function estBand(){const b=latestBands();const o=overallBand([b.listening,b.reading,b.writing,b.speaking].filter(x=>x!=null));return o!=null&&[b.listening,b.reading,b.writing,b.speaking].filter(x=>x!=null).length>=2?o:(b.overall!=null?b.overall:o);}

/* ---------- placement test: objective and adaptive, about 15-18 minutes ----------
   Sections: 1 vocabulary (meaning in context, adaptive by level), 2 grammar (12 items), 3 reading (2 short timed tasks
   cut from real passages), 4 optional listening (5 items from one part, played once).
   Scoring is strict on purpose (the old self-report version inflated bands):
   - Vocabulary: a level is passed with >= 5/6 right (level 1: >= 4/6). A level below a tested level where the learner got
     >= 3/6 counts as passed (easier words). Highest passed level: none 4.5, L1 5.0, L2 6.0, L3 7.0, L4 7.5, L5 8.5,
     +0.5 if level 5 is 6/6. Adaptive path: start at level 2 (level 3 if the last placement band was >= 7), go up on >= 5/6,
     stop on < 5/6, drop one level on < 3/6 if the test has not gone up yet.
   - Grammar: 3 items per level 1-4. Highest level L with >= 2/3 right AND >= 2L right over levels 1..L (one lucky level
     does not count): none 4.5, 1 5.5, 2 6.5, 3 7.5, 4 8.5; 9.0 when level 4 is 3/3.
   - Reading: task A (non-expert passage, band upper bound <= 7, 5 items, 7 min): 0-1 5.0, 2 5.5, 3 6.0, 4 6.5, 5 7.0.
     Task B (expert passage, band upper bound >= 9, 5 items, 7 min) only if A >= 3 or vocabulary reached level 4:
     5 9.0, 4 8.5, 3 8.0, 2 7.5, otherwise keep A.
   - Listening (optional): <= 1 5.0, 2 6.0, 3 7.0, 4 8.0, 5 9.0 on an expert part (test >= 7); a normal part is capped at 7.5.
   - Overall = weighted mean (reading .40, listening .25, vocabulary .20, grammar .15; without listening reading .55 and the
     weights renormalised to sum 1), rounded DOWN to the nearest 0.5, capped at 9. Writing and Speaking are not measured. */
let PLC=null, PC_tm=null, PC_tok=0;
const PC_SEC={vocab:'Từ vựng',gram:'Ngữ pháp',read:'Đọc hiểu',listen:'Nghe'};
const PC_RK=new Set(['tfng','ynng','mcq','sentcomp','sumcomp','notecomp','shortans','matchinfo']);
const PC_viShort=s=>String(s||'').split(';').map(x=>x.replace(/\(\s*(?:n|v|adj|adv|phr|prep|conj|idiom|phrasal verb|phr v|n phr|v phr)\.?\s*\)/gi,'').replace(/\s{2,}/g,' ').trim()).filter(Boolean).slice(0,2).join('; ');
const PC_pos=w=>String(w.pos||'').split(/[ ,/]/)[0];
const PC_reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function PC_match(w){
  const ex=String(w.ex||''), toks=String(w.w).split(/\s+/).filter(t=>t&&!/^(sb|sth|someone|something|one's|sb's|\.\.\.)$/i.test(t));
  if(!toks.length)return null;
  const st=t=>{t=t.replace(/[()]/g,'');const s=t.length>5?t.slice(0,-2):t.length>3?t.slice(0,-1):t;return PC_reEsc(s)+"[\\w'-]*";};
  const tries=[toks.map(st).join("\\s+(?:[\\w'-]+\\s+){0,2}"),st(toks[0])];
  for(const r of tries){const m=new RegExp('\\b'+r,'i').exec(ex);if(m)return m;}
  return null;
}
function PC_hl(w){const ex=String(w.ex||''),m=PC_match(w);if(!m)return esc(ex);
  return esc(ex.slice(0,m.index))+'<mark class="pc-hl">'+esc(m[0])+'</mark>'+esc(ex.slice(m.index+m[0].length));}
function PC_vItem(w){
  const pos=PC_pos(w), right=PC_viShort(w.vi), seen=new Set([viFold(right)]), ds=[], pool=shuffle(V.filter(x=>x.lv===w.lv&&x!==w));
  for(const pass of [1,2])for(const x of pool){if(ds.length>=3)break;if(pass===1&&PC_pos(x)!==pos)continue;
    const t=PC_viShort(x.vi),f=viFold(t);if(!t||seen.has(f))continue;seen.add(f);ds.push(t);}
  const o=shuffle([right,...ds]);return {k:w.k,o,a:o.indexOf(right)};
}
function PC_vBand(res){
  let top=0;
  for(let L=1;L<=5;L++){const c=res[L];if(c==null)continue;if(c>=(L===1?4:5))top=Math.max(top,L);else if(c>=3&&L>1&&res[L-1]==null)top=Math.max(top,L-1);}
  return [4.5,5,6,7,7.5,8.5][top]+(res[5]===6?0.5:0);
}
function PC_gBand(res){let top=0,sum=0;for(let L=1;L<=4;L++){sum+=res[L]||0;if((res[L]||0)>=2&&sum>=2*L)top=L;}return top===4&&res[4]===3?9:[4.5,5.5,6.5,7.5,8.5][top];}
function PC_rBand(a,b){let r=[5,5,5.5,6,6.5,7][a]||5;if(b!=null){const x={5:9,4:8.5,3:8,2:7.5}[b];if(x)r=x;}return r;}
function PC_lBand(c,expert){const b=[5,5,6,7,8,9][c]||5;return expert?b:Math.min(7.5,b);}
function PC_overall(v,g,r,l){
  const x=l!=null?r*.4+l*.25+v*.2+g*.15:(r*.55+v*.2+g*.15)/.9; // without listening the weights sum to .9, so renormalise
  return Math.min(9,Math.floor(x*2+1e-9)/2);
}
function PC_rdItems(p,S){
  const out=[];p.groups.forEach((g,gi)=>{if(!PC_RK.has(g.kind))return;g.items.forEach((it,ii)=>{if(!S.includes(it.para))return;if(g.kind==='matchinfo'&&!S.includes(it.a))return;out.push({gi,ii});});});
  return out;
}
function PC_instr(g,S){
  const lim=(String(g.instr).match(/(?:Choose|Write)[^.]*?for each answer\./i)||['Choose NO MORE THAN TWO WORDS from the passage for each answer.'])[0];
  return {tfng:'Do the following statements agree with the information given in the text?\nWrite TRUE, FALSE or NOT GIVEN.',
    ynng:'Do the following statements agree with the claims of the writer?\nWrite YES, NO or NOT GIVEN.',
    mcq:'Choose the correct letter, A, B, C or D.',
    matchinfo:`Which paragraph contains the following information?\nChoose the correct letter, ${S[0]}-${S[S.length-1]}.`,
    sentcomp:'Complete the sentences below.\n'+lim, sumcomp:'Complete the summary below.\n'+lim, notecomp:'Complete the notes below.\n'+lim,
    shortans:'Answer the questions below.\n'+lim}[g.kind];
}
function PC_rdTask(R,expert,avoid){
  const ok=p=>expert?TS_bandHi(p.band)>=9:TS_bandHi(p.band)<=7, cands=[];
  R.forEach(p=>{if(!ok(p)||p.id===avoid)return;const labs=p.paras.map(x=>x[0]);
    [2,3].forEach(w=>{for(let i=0;i+w<=labs.length;i++){const S=labs.slice(i,i+w),its=PC_rdItems(p,S);if(its.length>=5)cands.push({p,S,its});}});});
  const mine=cands.filter(c=>c.p.type===examType()), c=pick(mine.length?mine:cands);if(!c)return null;
  const keep=new Set(shuffle(c.its.map((_,i)=>i)).slice(0,5)), its=c.its.filter((_,i)=>keep.has(i));
  return {pid:c.p.id,S:c.S,sel:its,A:{},left:420,sub:false,raw:0};
}
function PC_rdSec(R,t){
  const p=R.find(x=>x.id===t.pid), by={};
  t.sel.forEach(({gi,ii})=>{(by[gi]=by[gi]||[]).push(p.groups[gi].items[ii]);});
  const groups=Object.keys(by).map(Number).sort((a,b)=>a-b).map(gi=>{const g=p.groups[gi];return {kind:g.kind,instr:PC_instr(g,t.S),opts:g.opts,items:by[gi]};});
  return {sid:'pc'+t.pid,src:'Bài xếp lớp - Reading',groups,start:1,paras:t.S,p};
}
function PC_lsTask(L,expert){
  const ps=L.filter(p=>expert?LS_isX(p.test)&&p.part>=2:(p.part===2||p.part===3)&&!LS_isX(p.test));
  const p=pick(ps.length?ps:L.filter(x=>x.part===2||x.part===3));
  return {pid:p.id,x:LS_isX(p.test),A:{},started:false,ended:false,sub:false,raw:0};
}
function PC_lsSec(L,t){
  const p=L.find(x=>x.id===t.pid);let n=0;
  const groups=p.groups.map(g=>{const items=[];g.items.forEach(it=>{const c=g.kind==='multi'?2:1;if(n+c<=5){items.push(it);n+=c;}});return Object.assign({},g,{items,instr:String(g.instr).replace(/^\s*Questions?\s+\d+(?:\s*-\s*\d+)?[.:]?\s*/i,'')});}).filter(g=>g.items.length);
  return {sid:'pcl'+p.id,src:'Bài xếp lớp - Listening',groups,start:1,p};
}
/* right answers for a TS section, in a form the debug hook can type or click */
function PC_rights(sec){
  const out=[];sec.groups.forEach((g,gi)=>g.items.forEach((it,ii)=>{const k=sec.sid+'.'+gi+'.'+ii;
    out.push({k,kind:g.kind,v:TS_GAP.has(g.kind)?String(it.a).split('|')[0]:g.kind==='multi'?it.a:g.kind==='matchinfo'?it.a:TS_TF[g.kind]?it.a:g.kind==='mcq'?it.a:String(it.a)});}));
  return out;
}

VIEWS.placement=async el=>{
  el.innerHTML='<div class="view"><p class="note">Đang chuẩn bị bài xếp lớp...</p></div>';
  let gram,R,LIS;
  try{await loadAllVocab();[gram,R,LIS]=await Promise.all([loadJSON('grammar'),loadJSON('reading'),loadJSON('listening')]);}
  catch(e){el.innerHTML='<div class="view"><p class="note">Không tải được dữ liệu. Kiểm tra mạng rồi thử lại.</p></div>';return;}
  if(!PLC||PLC.step==='done')PLC={step:'intro',v:{L:0,items:[],i:0,res:{},n:0,up:false},g:{items:[],i:0,res:{1:0,2:0,3:0,4:0}},r:{a:null,b:null,cur:'a'},l:null,lsOn:null};
  const stopAll=()=>{PC_tm&&PC_tm.stop();PC_tm=null;PC_tok++;stopSay();document.onkeydown=null;};
  window.__leave=stopAll;
  const mark=w=>{if(P.srs[w.k])return;const iv=7+Math.floor(Math.random()*14);P.srs[w.k]={iv,ef:2.5,n:2,l:0,due:today()+iv*DAY,s:2,first:Date.now(),pl:1};};
  const vB=()=>PC_vBand(PLC.v.res), gB=()=>PC_gBand(PLC.g.res);
  const rB=()=>PLC.r.a&&PLC.r.a.sub?PC_rBand(PLC.r.a.raw,PLC.r.b&&PLC.r.b.sub?PLC.r.b.raw:null):null;
  const head=()=>{
    const s=PLC.step, cur=s==='vocab'?'vocab':s==='gram'?'gram':s==='listen'?'listen':'read', secs=['vocab','gram','read','listen'];
    const idx=secs.indexOf(cur), nSec=PLC.lsOn?4:3, v=PLC.v;
    const frac=cur==='vocab'?Math.min(.95,v.n/24):cur==='gram'?PLC.g.i/12:cur==='read'?(s==='lsAsk'?1:PLC.r.cur==='b'?.5+(PLC.r.b&&PLC.r.b.sub?.5:0):(PLC.r.a&&PLC.r.a.sub?.5:0)):(PLC.l&&PLC.l.sub?1:PLC.l&&PLC.l.started?.5:0);
    const pct=Math.min(100,(idx+frac)/nSec*100);
    return `<div class="pc-top"><div class="spread"><h2>Bài xếp lớp</h2><span class="note num">Phần ${idx+1}/${nSec} - ${PC_SEC[cur]}</span></div>
      <div class="pc-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <div class="pc-secs">${secs.map((x,i)=>`<span class="pc-sec ${i<idx?'done':i===idx?'cur':''}">${PC_SEC[x]}${x==='listen'&&PLC.lsOn==null?' (tùy chọn)':''}</span>`).join('')}</div></div>`;
  };
  /* ---- vocabulary ---- */
  const vStart=L=>{
    const v=PLC.v;v.L=L;v.i=0;v.res[L]=0;
    const cand=V.filter(w=>w.lv===L&&w.ex&&w.vi), fresh=cand.filter(w=>!P.srs[w.k]), pool=shuffle(fresh.length>=30?fresh:cand), pickd=[];
    for(const w of pool){if(pickd.length>=6)break;if(PC_match(w))pickd.push(w);}
    v.items=pickd.map(PC_vItem);PLC.step='vocab';draw();
  };
  const vNext=()=>{const v=PLC.v,L=v.L,c=v.res[L];let nx=0;
    if(c>=5&&L<5&&v.res[L+1]==null){nx=L+1;v.up=true;}
    else if(c<3&&L>1&&v.res[L-1]==null&&!v.up)nx=L-1;
    if(nx)vStart(nx);else gStart();};
  const gStart=()=>{
    const by=L=>shuffle(gram.filter(g=>g.lv===L&&g.quiz&&g.quiz.length)).slice(0,3).map(g=>Object.assign({lv:L,gid:g.id},pick(g.quiz)));
    PLC.g.items=[1,2,3,4].flatMap(by);PLC.g.i=0;PLC.step='gram';draw();};
  const rStart=k=>{const t=PC_rdTask(R,k==='b',PLC.r.a&&PLC.r.a.pid);if(!t){PLC.step='lsAsk';draw();return;}PLC.r[k]=t;PLC.r.cur=k;PLC.step='read';draw();};
  const afterRead=()=>{const a=PLC.r.a;
    if(PLC.r.cur==='a'&&(a.raw>=3||PLC.v.res[4]!=null))rStart('b');else{PLC.step='lsAsk';draw();}};
  const optKeys=n=>{document.onkeydown=e=>{if(current!=='placement')return;const i=+e.key-1;const b=$$('.pc-opts .opt',el)[i];if(i>=0&&i<n&&b&&!b.disabled)b.click();};};
  const answerUI=(right,picked,next)=>{
    $$('.pc-opts .opt',el).forEach((b,k)=>{b.disabled=true;if(k===right)b.classList.add('right');else if(k===picked)b.classList.add('wrong');});
    const dk=$('#pcDk',el);if(dk)dk.disabled=true;
    setTimeout(next,picked===right?380:900);
  };
  const draw=()=>{
    stopAll();window.scrollTo(0,0);
    const s=PLC.step;
    window.__pcDebug={step:s,right:null};
    if(s==='intro'){
      el.innerHTML=`<div class="view pc"><h2>Bài xếp lớp</h2>${mcSay('idea','Khoảng 15 đến 18 phút, chấm hoàn toàn khách quan: chọn nghĩa đúng của từ trong câu (khó dần theo trình độ của bạn), 12 câu ngữ pháp, rồi 1 đến 2 đoạn đọc ngắn có đồng hồ 7 phút. Cuối cùng có thể làm thêm 5 phút nghe. Không biết thì bấm "Mình không biết", đừng đoán, kết quả sẽ sát hơn.',72)}
        <div class="panel"><h3>Cách tính điểm</h3><p class="small" style="margin:0">Band ước lượng lấy chủ yếu từ phần đọc (và nghe nếu bạn làm), cộng thêm từ vựng và ngữ pháp, rồi làm tròn xuống. Bài này không đo Writing và Speaking.</p></div>
        <div class="row"><button class="btn primary" id="pcStart">Bắt đầu</button><button class="btn ghost" id="pcSkip">Để sau</button></div></div>`;
      $('#pcStart',el).onclick=()=>vStart(P.placeBand>=7?3:2);$('#pcSkip',el).onclick=()=>{PLC=null;go('home');};return;}
    if(s==='vocab'){
      const v=PLC.v, x=v.items[v.i];if(!x){vNext();return;}
      const w=VI.get(x.k);
      el.innerHTML=`<div class="view pc">${head()}
        <div class="panel pc-q"><div class="spread"><span class="pill">${esc(LV_NAME[v.L])}</span><span class="note num">Câu ${v.i+1}/6</span></div>
          <div class="pc-w en">${esc(w.w)} <span class="small muted">${esc(w.pos)}</span></div>
          <p class="pc-ex en-s">${PC_hl(w)}</p>
          <p class="note">Từ được tô trong câu có nghĩa là gì?</p>
          <div class="opts pc-opts">${x.o.map((o,k)=>`<button class="opt" data-k="${k}"><span class="kbd">${k+1}</span> ${esc(o)}</button>`).join('')}</div>
          <button class="btn ghost sm pc-dk" id="pcDk">Mình không biết từ này</button></div></div>`;
      window.__pcDebug.right=x.a;
      const ans=k=>{const ok=k===x.a;v.n++;if(ok){v.res[v.L]++;mark(w);}else window.__mistake&&window.__mistake('word',w.k);touch('main');
        answerUI(x.a,k,()=>{v.i++;draw();});};
      $$('.pc-opts .opt',el).forEach(b=>b.onclick=()=>ans(+b.dataset.k));$('#pcDk',el).onclick=()=>ans(-1);optKeys(x.o.length);return;}
    if(s==='gram'){
      const g=PLC.g, x=g.items[g.i];if(!x){rStart('a');return;}
      const parts=String(x.s).split(/_{3,}/);
      el.innerHTML=`<div class="view pc">${head()}
        <div class="panel pc-q"><div class="spread"><span class="note">Chọn từ đúng cho chỗ trống</span><span class="note num">Câu ${g.i+1}/${g.items.length}</span></div>
          <p class="pc-gs en-s">${parts.map(esc).join('<span class="pc-gap">&nbsp;</span>')}</p>
          <div class="opts pc-opts">${x.o.map((o,k)=>`<button class="opt en" data-k="${k}"><span class="kbd">${k+1}</span> ${esc(o)}</button>`).join('')}</div>
          <button class="btn ghost sm pc-dk" id="pcDk">Mình không chắc</button></div></div>`;
      window.__pcDebug.right=x.a;
      const ans=k=>{const ok=k===x.a;const it={q:x.s,o:x.o,a:x.a,w:x.w,src:'Bài xếp lớp - Ngữ pháp'};
        if(ok){g.res[x.lv]++;window.__mistOk&&window.__mistOk(it);}else window.__mistake&&window.__mistake('q',it);
        answerUI(x.a,k,()=>{g.i++;draw();});};
      $$('.pc-opts .opt',el).forEach(b=>b.onclick=()=>ans(+b.dataset.k));$('#pcDk',el).onclick=()=>ans(-1);optKeys(x.o.length);return;}
    if(s==='read'){
      const t=PLC.r[PLC.r.cur], sec=PC_rdSec(R,t), p=sec.p, x=PLC.r.cur==='b';
      el.innerHTML=`<div class="view pc">${head()}
        <div class="panel pc-rh"><div class="spread"><h3>Bài đọc ${x?'2 - mức khó':'1'}</h3><span class="timer-chip" id="pcTm">${ic('clock')}<span id="pcTmT">${fmtTime(t.left)}</span></span></div>
          <p class="note">Đoạn trích ${t.S.length} đoạn từ một bài ${p.type==='general'?'General Training':'Academic'} thật${x?' mức band 8.5-9':''}. Trả lời 5 câu trong 7 phút, hết giờ bài tự nộp.</p></div>
        <div class="pc-rd"><article class="panel pc-pass"><span class="label">Đoạn ${t.S[0]}-${t.S[t.S.length-1]}</span><h3 class="en">${esc(p.title)}</h3>
          ${p.paras.filter(q=>t.S.includes(q[0])).map(([l,tx])=>`<p class="rd-p en-s"><b class="rd-l">${esc(l)}</b>${esc(tx)}</p>`).join('')}</article>
          <section class="panel ts-qs pc-qs" id="pcQ">${TS_qHTML(sec,t.A)}</section></div>
        <div id="pcAfter" class="row"><button class="btn primary" id="pcSub">Nộp phần này</button></div></div>`;
      const q=$('#pcQ',el);
      window.__pcDebug.right=PC_rights(sec);
      const submit=()=>{if(t.sub)return;t.sub=true;PC_tm&&PC_tm.stop();
        const res=TS_mark(sec,t.A);t.raw=res.filter(r=>r.ok).length;TS_log(res);touch('main');
        TS_applyMarks(q,res);$('#pcTm',el).hidden=true;
        $('#pcAfter',el).innerHTML=`<p class="note pc-sc">Bạn đúng <b class="num">${t.raw}/5</b> câu. Xem giải thích ở từng câu nếu muốn.</p><button class="btn primary" id="pcNext">Tiếp tục ${ic('chevron-right')}</button>`;
        $('#pcNext',el).onclick=afterRead;};
      if(t.sub){t.sub=false;submit();return;}
      TS_bind(q,t.A,null);
      $('#pcSub',el).onclick=submit;
      PC_tm=makeTimer(t.left,l=>{t.left=l;const e=$('#pcTmT',el);if(e){e.textContent=fmtTime(l);$('#pcTm',el).classList.toggle('low',l<=60);}},()=>{toast('Hết 7 phút. Phần đọc đã được nộp.');submit();});
      return;}
    if(s==='lsAsk'){
      const well=(rB()||0)>=7.5||(vB()>=7&&(rB()||0)>=7);
      el.innerHTML=`<div class="view pc">${head()}${mcSay('ok','Xong phần đọc. Bạn có muốn làm thêm 5 phút nghe không? Bài nghe phát một lần, có 5 câu hỏi. Nếu bỏ qua, kết quả sẽ không tính Listening.',64)}
        <div class="row"><button class="btn primary" id="pcLs">${ic('headphones')} Thêm phần nghe 5 phút</button><button class="btn" id="pcNoLs">Bỏ qua, xem kết quả</button></div></div>`;
      $('#pcLs',el).onclick=()=>{PLC.lsOn=true;PLC.l=PC_lsTask(LIS,well);PLC.step='listen';draw();};
      $('#pcNoLs',el).onclick=()=>{PLC.lsOn=false;finish();};return;}
    if(s==='listen'){
      const t=PLC.l, sec=PC_lsSec(LIS,t), p=sec.p, lines=p.lines.map(([id,tx])=>({sp:LS_spk(p,id),t:tx}));
      el.innerHTML=`<div class="view pc">${head()}
        <div class="panel pc-lp"><div class="spread"><h3>Nghe Part ${p.part}</h3><span class="timer-chip" id="pcTm" hidden>${ic('clock')}<span id="pcTmT"></span></span></div>
          <p class="note">${esc(p.setting)}</p>
          <div class="row pc-play"><button class="btn primary" id="pcPlay">${ic('play')} Phát bài nghe</button><span class="small muted" id="pcLsMeta">Bài nghe chỉ phát một lần. Đọc trước câu hỏi rồi bấm phát.</span></div>
          <div class="pc-bar sm"><i id="pcLsFill" style="width:0"></i></div></div>
        <section class="panel ts-qs pc-qs" id="pcQ">${TS_qHTML(sec,t.A)}</section>
        <div id="pcAfter" class="row"><button class="btn primary" id="pcSub">Nộp phần nghe</button></div></div>`;
      const q=$('#pcQ',el), meta=$('#pcLsMeta',el), fill=$('#pcLsFill',el), pb=$('#pcPlay',el);
      window.__pcDebug.right=PC_rights(sec);
      const submit=()=>{if(t.sub)return;t.sub=true;PC_tok++;stopSay();PC_tm&&PC_tm.stop();
        const res=TS_mark(sec,t.A);t.raw=res.filter(r=>r.ok).length;TS_log(res);touch('main');
        TS_applyMarks(q,res);$('#pcTm',el).hidden=true;pb.disabled=true;
        $('#pcAfter',el).innerHTML=`<p class="note pc-sc">Bạn đúng <b class="num">${t.raw}/5</b> câu.</p><button class="btn primary" id="pcNext">Xem kết quả ${ic('chevron-right')}</button>`;
        $('#pcNext',el).onclick=finish;};
      if(t.sub){t.sub=false;submit();return;}
      TS_bind(q,t.A,null);
      $('#pcSub',el).onclick=submit;
      const check=()=>{const tm=$('#pcTm',el);tm.hidden=false;
        PC_tm=makeTimer(45,l=>{const e=$('#pcTmT',el);if(e){e.textContent=fmtTime(l);tm.classList.toggle('low',l<=15);}},()=>{toast('Hết giờ. Phần nghe đã được nộp.');submit();});};
      if(t.started){pb.disabled=true;meta.textContent=t.ended?'Bài nghe đã phát xong. Kiểm tra lại rồi nộp.':'Bài nghe đã dừng khi bạn rời trang. Hãy nộp phần nghe.';fill.style.width='100%';if(t.ended)check();return;}
      pb.onclick=async()=>{if(t.started)return;t.started=true;pb.disabled=true;const my=++PC_tok;
        for(let j=0;j<lines.length;j++){const x=lines[j];meta.textContent=`Đang phát ${j+1}/${lines.length} · ${x.sp.name}`;fill.style.width=(j/lines.length*100)+'%';
          await say(x.t,{lang:x.sp.accent,voice:x.sp.voice});if(my!==PC_tok)return;
          const nx=lines[j+1];if(nx){await new Promise(r=>setTimeout(r,nx.sp!==x.sp?700:300));if(my!==PC_tok)return;}}
        t.ended=true;fill.style.width='100%';meta.textContent='Bài nghe đã kết thúc. Bạn có 45 giây kiểm tra lại.';check();};
      return;}
  };
  const finish=()=>{
    stopAll();
    const v=PLC.v,g=PLC.g,ra=PLC.r.a,rb=PLC.r.b&&PLC.r.b.sub?PLC.r.b:null,l=PLC.l&&PLC.l.sub?PLC.l:null;
    const vb=vB(), gb=gB(), rbd=rB()||5, lb=l?PC_lBand(l.raw,l.x):null, band=PC_overall(vb,gb,rbd,lb);
    const rRaw=(ra?ra.raw:0)+(rb?rb.raw:0), rTot=5+(rb?5:0);
    P.placeBand=band;P.placed=1;P.placeV=2;
    recordScore({skill:'overall',band,title:'Bài xếp lớp',detail:{vocab:vb,grammar:gb,reading:rbd,listening:lb}});
    recordScore({skill:'reading',band:rbd,raw:rRaw,total:rTot,id:'placement',title:'Bài xếp lớp'});
    if(l)recordScore({skill:'listening',band:lb,raw:l.raw,total:5,id:'placement',title:'Bài xếp lớp'});
    const c=plCfg();if(c.target<=band)c.target=Math.min(9,band+1);c.auto=true;plApply();
    award('test',1);
    const knownLv=LVS.filter(L=>v.res[L]===6);
    const top=Object.keys(v.res).map(Number).sort((a,b)=>b-a)[0];
    const rows=[
      ['Đọc hiểu',rbd,`Bài 1: ${ra?ra.raw:0}/5${rb?`, bài 2 (mức khó): ${rb.raw}/5`:''}`],
      ['Nghe',lb,l?`${l.raw}/5 câu, ${l.x?'đề mức khó':'đề thường (tối đa 7.5)'}`:'Bạn đã bỏ qua, kết quả không tính Listening'],
      ['Từ vựng',vb,LVS.filter(L=>v.res[L]!=null).map(L=>`${LV_NAME[L]} ${v.res[L]}/6`).join(', ')],
      ['Ngữ pháp',gb,[1,2,3,4].map(L=>`mức ${L}: ${g.res[L]}/3`).join(', ')]];
    el.innerHTML=`<div class="view pc"><h2>Kết quả xếp lớp</h2>
      <div class="panel place-res">${mascot(band>=7?'yay':'ok',110)}<div><span class="label">Band ước lượng</span><div class="band-big">${fmtBand(band)}</div>
        <p class="note">Sai số khoảng ±0.5. Chưa tính Writing và Speaking${l?'':', chưa tính Listening'}. Muốn biết chính xác hơn, hãy làm một bài thi thử đầy đủ.</p></div></div>
      <div class="panel"><h3>Từng phần</h3><div class="pc-rows">${rows.map(([n,b,d])=>`<div class="pc-row"><span class="pc-rn">${n}</span><b class="num pc-rb">${b==null?'-':fmtBand(b)}</b><span class="small muted pc-rd2">${esc(d)}</span></div>`).join('')}</div>
        <p class="note">Band chung lấy Đọc ${l?'40%, Nghe 25%':'55%'}, Từ vựng 20%, Ngữ pháp 15%, rồi làm tròn xuống 0.5.</p></div>
      <div class="panel"><h3>Lộ trình gợi ý</h3><p class="small" style="margin:0">Mục tiêu band <b>${c.target.toFixed(1)}</b>. Từ vựng học: ${P.settings.lv.map(L=>LV_NAME[L]).join(', ')}.${knownLv.length?` Bạn trả lời đúng hết nhóm ${knownLv.map(L=>LV_NAME[L]).join(', ')}.`:''} Từ bạn chọn đúng đã được đánh dấu là đã biết, từ sai đã vào sổ lỗi.</p>
        <div class="row">${knownLv.length?`<button class="btn" id="pcAll">Đánh dấu cả nhóm ${knownLv.map(L=>LV_NAME[L]).join(', ')} là đã biết</button>`:''}<button class="btn" id="pcMock">${ic('clipboard-check')} Làm bài thi thử</button><button class="btn" id="pcPlan">Đổi lộ trình</button><button class="btn primary" id="pcGo">Bắt đầu học</button></div></div></div>`;
    window.__pcDebug={step:'done',band,vb,gb,rb:rbd,lb,top};
    const all=$('#pcAll',el);if(all)all.onclick=()=>{let n=0;V.filter(w=>knownLv.includes(w.lv)&&!P.srs[w.k]).forEach(w=>{const iv=5+Math.floor(Math.random()*25);P.srs[w.k]={iv,ef:2.5,n:2,l:0,due:today()+iv*DAY,s:2,first:Date.now(),pl:1};n++;});touch('main');all.remove();toast('Đã đánh dấu '+n+' từ. Chúng vẫn quay lại rải rác để kiểm tra.',4000);};
    $('#pcPlan',el).onclick=plSettings;$('#pcMock',el).onclick=()=>{PLC=null;go('test');};$('#pcGo',el).onclick=()=>{PLC=null;queue=[];go('home');};
    PLC.step='done';touch('main');
  };
  draw();
};

/* ---------- mistakes notebook ----------
   window.__mistake('word', key) or window.__mistake('q', item) where item is a quiz item {q, o?, a, w}
   window.__mistOk(item) after a correct answer: 2 correct in a row removes it */
function plMistList(){P.mist=P.mist||{};return Object.entries(P.mist).filter(([k,v])=>!v.ok||v.ok<2);}
const mkKey=(type,x)=>type==='word'?'w:'+x:'q:'+String(x.q||x.s||'').slice(0,80)+'|'+(Array.isArray(x.o)?x.o.join('/'):x.a);
window.__mistake=(type,x)=>{
  P.mist=P.mist||{}; const key=mkKey(type,x);
  const e=P.mist[key]||{t:type,n:0,ok:0,x:type==='word'?x:{q:x.q||x.s,o:x.o,a:x.a,w:x.w||x.why||'',src:x.src||''}};
  e.n++;e.ok=0;e.last=Date.now();P.mist[key]=e;
  const keys=Object.keys(P.mist);if(keys.length>400)keys.sort((a,b)=>P.mist[a].last-P.mist[b].last).slice(0,keys.length-400).forEach(k=>delete P.mist[k]);
  touch('main');
};
window.__mistOk=x=>{P.mist=P.mist||{};[mkKey('q',x),'w:'+String(x.wk||'')].forEach(k=>{const e=P.mist[k];if(e){e.ok=(e.ok||0)+1;if(e.ok>=2)delete P.mist[k];}});};
VIEWS.mistakes=el=>{
  const list=plMistList().sort((a,b)=>b[1].n-a[1].n);
  const words=list.filter(([k,v])=>v.t==='word'), qs=list.filter(([k,v])=>v.t==='q');
  el.innerHTML=`<div class="view"><div class="spread"><h2>Sổ lỗi sai</h2><span class="note">${list.length} mục</span></div>
   <p class="note">App tự ghi lại từ bạn bấm "Quên", câu sai ở Listening, Reading, ngữ pháp và trò chơi. Mỗi mục trả lời đúng 2 lần liên tiếp thì tự rời sổ.</p>
   ${list.length?`<div class="row"><button class="btn primary" id="mkGo">Ôn 15 mục sai nhiều nhất</button></div>`:mcSay('ok','Chưa có lỗi nào. Câu nào bạn trả lời sai sẽ được lưu ở đây để ôn lại.',72)}
   ${words.length?`<div class="panel"><h3>Từ hay quên</h3><div class="pexs">${words.slice(0,60).map(([k,v])=>{const w=VI.get(v.x);return w?`<button class="pex" data-wd="${esc(w.k)}"><b>${esc(w.w)}</b> <span class="muted small">${esc(w.vi)}</span> <span class="pill">${v.n}</span></button>`:'';}).join('')}</div></div>`:''}
   ${qs.length?`<div class="panel"><h3>Câu hay sai</h3>${qs.slice(0,40).map(([k,v])=>`<div class="mk-q"><div>${esc(v.x.q)} <span class="pill">${v.n}</span></div>${v.x.src?`<div class="small muted">${esc(v.x.src)}</div>`:''}<div class="small">Đáp án: <b>${esc(Array.isArray(v.x.o)?v.x.o[v.x.a]:String(v.x.a).split('|')[0])}</b></div>${v.x.w?`<div class="small muted">${esc(v.x.w)}</div>`:''}</div>`).join('')}</div>`:''}</div>`;
  $$('[data-wd]',el).forEach(b=>b.onclick=()=>openWord(b.dataset.wd));
  const g=$('#mkGo');if(g)g.onclick=()=>{
    const items=list.slice(0,15).map(([k,v])=>{if(v.t==='q')return Object.assign({},v.x);const w=VI.get(v.x);if(!w)return null;
      const o=shuffle([w,...shuffle(V.filter(x=>x.lv===w.lv&&x.vi!==w.vi)).slice(0,3)]);return {q:'"'+w.w+'" nghĩa là gì?',o:o.map(x=>x.vi),a:o.indexOf(w),w:w.w+' '+w.ipa+': '+w.vi,wk:w.k};}).filter(Boolean);
    plDay().mist=(plDay().mist||0)+1;touch('main');
    runQuiz(el,{title:'Ôn sổ lỗi',items,kind:'review'});
  };
};

/* ---------- tip of the day ---------- */
const DLY_CAT={idiom:'Idiom',collocation:'Collocation',phrasal:'Phrasal verb',tip:'Mẹo thi',mistake:'Lỗi hay gặp',fact:'Có thể bạn chưa biết'};
function dlyIndex(){const c=plCfg();return Math.max(0,Math.floor((today()-(c.start||today()))/DAY));}
function dlyCard(x,big){
  P.dly=P.dly||{}; const done=P.dly[x.id];
  return `<div class="dly ${big?'big':''}" data-id="${x.id}"><div class="spread"><span class="pill">${esc(DLY_CAT[x.cat]||x.cat)}</span>${done?ic('check','ok-i'):''}</div>
    <h3 class="dly-t">${esc(x.title)}</h3>${x.en&&x.en!==x.title?`<div class="dly-en en-s"><button class="spk sm" data-say="${esc(x.en)}" aria-label="Nghe">${SPK}</button> ${esc(x.en)}</div>`:''}
    <p style="margin:0">${esc(x.vi)}</p>
    ${x.ex?`<div class="ex"><button class="spk" data-say="${esc(x.ex[0])}" aria-label="Nghe câu">${SPK}</button><div><div class="en-s">${esc(x.ex[0])}</div><div class="small muted">${esc(x.ex[1])}</div></div></div>`:''}
    ${x.q?`<div class="dly-q"><span class="label">Câu hỏi nhỏ</span><div>${esc(x.q.q)}</div><div class="opts">${x.q.o.map((o,k)=>`<button class="opt ${done&&k===x.q.a?'right':''}" data-k="${k}" ${done?'disabled':''}>${esc(o)}</button>`).join('')}</div></div>`:''}</div>`;
}
function dlyBind(root,x){
  $$('.dly[data-id="'+x.id+'"] [data-k]',root).forEach(b=>b.onclick=()=>{const k=+b.dataset.k;$$('.dly[data-id="'+x.id+'"] [data-k]',root).forEach((y,i)=>{y.disabled=true;if(i===x.q.a)y.classList.add('right');else if(i===k)y.classList.add('wrong');});
    P.dly=P.dly||{};if(!P.dly[x.id]){P.dly[x.id]=k===x.q.a?2:1;award('daily',1);}});
}
VIEWS.daily=async el=>{
  el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';
  const all=await loadJSON('daily'); const n=Math.min(all.length,dlyIndex()+1+(P.dlyExtra||0));
  const todayX=all[dlyIndex()%all.length]; const past=all.slice(0,n).filter(x=>x!==todayX).reverse();
  el.innerHTML=`<div class="view"><div class="spread"><h2>Mẹo mỗi ngày</h2><span class="note">Đã mở ${n}/${all.length}</span></div>
    <div class="panel">${dlyCard(todayX,true)}</div>
    <div class="row"><button class="btn sm" id="dlMore" ${plDay().xp>=plGoalXP()?'':'disabled'}>Mở thêm 1 mẹo</button><span class="small muted">${plDay().xp>=plGoalXP()?'':'Đạt mục tiêu XP hôm nay để mở thêm.'}</span></div>
    ${past.length?`<h3>Các mẹo trước</h3><div class="dly-list">${past.map(x=>`<details class="g"><summary><span class="pill">${esc(DLY_CAT[x.cat]||x.cat)}</span><span class="t">${esc(x.title)}</span>${P.dly&&P.dly[x.id]?ic('check','ok-i'):''}</summary><div class="body" data-did="${x.id}"></div></details>`).join('')}</div>`:''}</div>`;
  dlyBind(el,todayX);
  $$('.dly-list details',el).forEach(d=>d.addEventListener('toggle',()=>{if(!d.open)return;const b=$('.body',d);if(b.dataset.r)return;b.dataset.r=1;const x=all.find(y=>y.id===b.dataset.did);b.innerHTML=dlyCard(x);dlyBind(b,x);}));
  const m=$('#dlMore');if(m)m.onclick=()=>{P.dlyExtra=(P.dlyExtra||0)+1;touch('main');VIEWS.daily(el);};
};

/* ---------- error reports ---------- */
window.__report=what=>{
  const m=modal(`<h2>Báo lỗi: ${esc(what)}</h2><p class="note">Ghi chỗ sai (nghĩa, phiên âm, đáp án, câu ví dụ...). Báo lỗi lưu trong tiến độ của bạn, gửi danh sách trong chat để sửa theo đợt.</p>
    <textarea id="rpT" rows="3" placeholder="Ví dụ: nghĩa tiếng Việt nên là ..."></textarea><div class="row"><button class="btn primary" id="rpS">Lưu báo lỗi</button></div>`);
  $('#rpS',m.el).onclick=()=>{const t=$('#rpT',m.el).value.trim();if(!t)return;P.reports=P.reports||[];P.reports.push({h:what,t,d:Date.now()});touch('main');m.close();toast('Đã lưu. Xem lại ở Tôi -> Cài đặt -> Báo lỗi đã ghi.');};
};
function reportsList(){
  const r=P.reports||[]; const txt=r.map(x=>`${x.h}: ${x.t}`).join('\n');
  const m=modal(`<h2>Báo lỗi đã ghi (${r.length})</h2>${r.length?`<textarea rows="10" readonly id="rpAll">${esc(txt)}</textarea><div class="row"><button class="btn primary" id="rpCp">Sao chép tất cả</button><button class="btn" id="rpClr">Xóa danh sách</button></div>`:'<p class="note">Chưa có báo lỗi nào.</p>'}`);
  const cp=$('#rpCp',m.el);if(cp)cp.onclick=()=>{navigator.clipboard.writeText(txt).then(()=>toast('Đã sao chép.')).catch(()=>{$('#rpAll',m.el).select();toast('Bấm Ctrl/Cmd+C để sao chép.');});};
  const cl=$('#rpClr',m.el);if(cl)cl.onclick=()=>{cl.outerHTML='<span class="small">Xóa hết?</span> <button class="btn sm" id="rpY">Xóa</button>';$('#rpY',m.el).onclick=()=>{P.reports=[];touch('main');m.close();};};
}

/* ---------- reset placement: band, placement scores, and words marked known by placement but never reviewed since ---------- */
function plResetPlacement(){
  const isPl=s=>/xếp lớp/i.test(s.title||'');
  const nScores=(P.scores||[]).filter(isPl).length;
  const untouched=Object.entries(P.srs).filter(([k,c])=>c.pl&&c.n===2&&!c.l);
  const m=modal(`<h2>Xóa kết quả xếp lớp</h2>
    <p class="note">Sẽ xóa band ước lượng từ bài xếp lớp, ${nScores} điểm "Bài xếp lớp" trong lịch sử, và gỡ ${untouched.length} từ được đánh dấu đã biết lúc xếp lớp mà bạn chưa ôn lại lần nào. Từ đã ôn thật, điểm thi thử và XP giữ nguyên.</p>
    <div class="row"><button class="btn primary" id="rsGo">Xóa và làm lại bài xếp lớp</button><button class="btn" id="rsNo">Thôi</button></div>`);
  $('#rsNo',m.el).onclick=m.close;
  $('#rsGo',m.el).onclick=()=>{
    P.scores=(P.scores||[]).filter(s=>!isPl(s));
    untouched.forEach(([k])=>delete P.srs[k]);
    delete P.placeBand; delete P.placed; PLC=null; queue=[]; touch('main');
    m.close(); toast(`Đã xóa. Gỡ ${untouched.length} từ khỏi danh sách đã biết.`,3500); go('placement');
  };
}

/* ---------- one-time migration: results from the old self-report placement test (before placeV 2) are too generous.
   Clear them once per learner, the same way as plResetPlacement, and invite a retake. Runs on every route; cheap no-op afterwards. */
function plMigrate(){
  if(!P.placed||P.placeV>=2)return;
  const isPl=s=>/xếp lớp/i.test(s.title||'');
  P.scores=(P.scores||[]).filter(s=>!isPl(s));
  Object.entries(P.srs).forEach(([k,c])=>{if(c.pl&&c.n===2&&!c.l)delete P.srs[k];});
  delete P.placeBand; delete P.placed; P.placeRedo=1; queue=[]; touch('main');
}
