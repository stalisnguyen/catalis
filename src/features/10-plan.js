/* ================= PLAN: XP, ranks, daily plan, band records, placement, mistakes, daily tip, reports ================= */
const PL_W={review:1,new:3,listen:1.5,read:1.5,write:25,speak:4,grammar:8,pron:2,test:30,game:1,daily:5,dict:2};
const PL_RANKS=[[0,'Freshman','Tân sinh viên'],[300,'Sophomore','Sinh viên năm hai'],[1000,'Junior','Sinh viên năm ba'],[2500,'Senior','Sinh viên năm cuối'],[5000,'Bachelor','Cử nhân'],[9000,'Master','Thạc sĩ'],[15000,'PhD','Tiến sĩ'],[25000,'Professor','Giáo sư']];
const TARGETS=[5,5.5,6,6.5,7,7.5,8];
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
function plLevels(t){return t<=5?[1]:t<=6?[1,2]:t<=7?[1,2,3]:[1,2,3,4];}
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

/* ---------- placement test: vocabulary by level + grammar, gives an estimated band ---------- */
let PLC=null;
VIEWS.placement=async el=>{
  el.innerHTML='<div class="view"><p class="note">Đang chuẩn bị bài xếp lớp...</p></div>';
  await loadAllVocab(); const gram=await loadJSON('grammar');
  if(!PLC){PLC={step:'intro',L:1,i:0,items:[],stats:{},gi:0,gItems:[],gOk:0};}
  const startLv=()=>{const pool=V.filter(w=>w.lv===PLC.L&&!P.srs[w.k]);PLC.items=shuffle(pool).slice(0,12);PLC.i=0;PLC.stats[PLC.L]={yes:0,ok:0,chk:0,n:0};PLC.step='vocab';draw();};
  const startGram=()=>{const by=L=>shuffle(gram.filter(g=>g.lv===L)).slice(0,L===1?3:L===2?4:5).map(g=>Object.assign({lv:L},pick(g.quiz)));PLC.gItems=[...by(1),...by(2),...by(3)];PLC.gi=0;PLC.gOk=0;PLC.step='gram';draw();};
  const mark=w=>{const iv=7+Math.floor(Math.random()*14);P.srs[w.k]={iv,ef:2.5,n:2,l:0,due:today()+iv*DAY,s:2,first:Date.now(),pl:1};touch('main');};
  const finish=()=>{
    const vr=L=>{const s=PLC.stats[L];if(!s||!s.n)return 0;const acc=s.chk?s.ok/s.chk:1;return s.yes/s.n*acc;};
    const vScore=vr(1)*1+vr(2)*1.2+vr(3)*1.4+vr(4)*1.6; // 0..5.2
    const gScore=PLC.gItems.length?PLC.gOk/PLC.gItems.length:0;
    let band=4+vScore*0.55+gScore*1.6; band=Math.max(4,Math.min(8,Math.round(band*2)/2));
    P.placeBand=band;P.placed=1;recordScore({skill:'overall',band,title:'Bài xếp lớp',raw:PLC.gOk,total:PLC.gItems.length});
    const c=plCfg();if(c.target<=band)c.target=Math.min(8,band+1);c.auto=true;plApply();
    const knownLv=LVS.filter(L=>vr(L)>=0.8);
    el.innerHTML=`<div class="view"><h2>Kết quả xếp lớp</h2><div class="panel place-res">${mascot('yay',110)}<div><span class="label">Band ước lượng</span><div class="band-big">${fmtBand(band)}</div>
      <p class="note">Ước lượng dựa trên vốn từ và ngữ pháp, chưa tính Listening, Reading, Writing, Speaking thật. Làm một bài thi thử để có số chính xác hơn.</p></div></div>
      <div class="panel"><h3>Lộ trình gợi ý</h3><p class="small" style="margin:0">Mục tiêu band <b>${c.target.toFixed(1)}</b>. Từ vựng học: ${P.settings.lv.map(L=>LV_NAME[L]).join(', ')}. ${knownLv.length?`Bạn nắm khá chắc nhóm ${knownLv.map(L=>LV_NAME[L]).join(', ')}.`:''}</p>
      <div class="row">${knownLv.length?`<button class="btn" id="pcAll">Đánh dấu cả nhóm ${knownLv.map(L=>LV_NAME[L]).join(', ')} là đã biết</button>`:''}<button class="btn" id="pcPlan">Đổi lộ trình</button><button class="btn primary" id="pcGo">Bắt đầu học</button></div></div></div>`;
    const all=$('#pcAll');if(all)all.onclick=()=>{let n=0;V.filter(w=>knownLv.includes(w.lv)&&!P.srs[w.k]).forEach(w=>{const iv=5+Math.floor(Math.random()*25);P.srs[w.k]={iv,ef:2.5,n:2,l:0,due:today()+iv*DAY,s:2,first:Date.now(),pl:1};n++;});touch('main');all.remove();toast('Đã đánh dấu '+n+' từ. Chúng vẫn quay lại rải rác để kiểm tra.',4000);};
    $('#pcPlan').onclick=plSettings;$('#pcGo').onclick=()=>{PLC=null;queue=[];go('home');};
    touch('main');PLC.step='done';
  };
  const draw=()=>{
    if(PLC.step==='intro'){el.innerHTML=`<div class="view"><h2>Bài xếp lớp</h2>${mcSay('idea','Khoảng 8 phút: phần 1 nhìn từ và chọn Biết hay Không biết, thỉnh thoảng Mít hỏi lại nghĩa để kiểm tra. Phần 2 là 12 câu ngữ pháp. Cứ trả lời thật, đừng đoán.',72)}
      <div class="row"><button class="btn primary" id="pcStart">Bắt đầu</button><button class="btn ghost" id="pcSkip">Để sau</button></div></div>`;
      $('#pcStart').onclick=startLv;$('#pcSkip').onclick=()=>{PLC=null;go('home');};return;}
    if(PLC.step==='gram'){
      const x=PLC.gItems[PLC.gi]; if(!x){finish();return;}
      el.innerHTML=`<div class="view"><div class="spread"><h2>Xếp lớp - Ngữ pháp</h2><span class="note num">${PLC.gi+1}/${PLC.gItems.length}</span></div>
        <div class="panel qz"><div class="qz-q en-s">${esc(x.s)}</div><div class="opts">${x.o.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div></div>
        <button class="btn ghost sm" id="pcEnd">Dừng và xem kết quả</button></div>`;
      $$('[data-k]',el).forEach(b=>b.onclick=()=>{if(+b.dataset.k===x.a)PLC.gOk++;PLC.gi++;draw();});
      $('#pcEnd').onclick=finish;return;}
    const w=PLC.items[PLC.i]; const st=PLC.stats[PLC.L];
    if(!w){const ratio=st.n?st.yes/st.n*(st.chk?st.ok/st.chk:1):0;
      if(ratio>=0.55&&PLC.L<4){PLC.L++;startLv();}else startGram();return;}
    el.innerHTML=`<div class="view"><div class="spread"><h2>Xếp lớp - Từ vựng ${LV_NAME[PLC.L]}</h2><span class="note num">${PLC.i+1}/${PLC.items.length}</span></div>
      <div class="card" style="min-height:240px"><div class="big en">${esc(w.w)}</div><div class="row" style="margin-top:auto"><button class="btn" id="pcNo">Không biết <span class="kbd">1</span></button><button class="btn primary" id="pcYes">Biết <span class="kbd">2</span></button></div></div>
      <button class="btn ghost sm" id="pcG">Bỏ qua phần từ vựng</button></div>`;
    const no=()=>{st.n++;PLC.i++;draw();};
    const yes=()=>{st.n++;
      if(st.n%3===0){const o=shuffle([w,...shuffle(V.filter(x=>x.lv===w.lv&&x.vi!==w.vi)).slice(0,3)]);
        $('.card',el).innerHTML=`<div class="big en">${esc(w.w)}</div><p class="note">Kiểm tra nhanh: nghĩa là gì?</p><div class="opts" style="width:100%">${o.map((x,k)=>`<button class="opt" data-k="${k}">${esc(x.vi)}</button>`).join('')}</div>`;
        $$('[data-k]',el).forEach(b=>b.onclick=()=>{st.chk++;if(o[+b.dataset.k]===w){st.ok++;st.yes++;mark(w);}PLC.i++;draw();});return;}
      st.yes++;mark(w);PLC.i++;draw();};
    $('#pcNo').onclick=no;$('#pcYes').onclick=yes;$('#pcG').onclick=startGram;
    window.__leave=()=>{document.onkeydown=null;};
    document.onkeydown=e=>{if(current!=='placement'||!$('#pcYes'))return;if(e.key==='1')no();if(e.key==='2')yes();};
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
