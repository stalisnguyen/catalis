/* ================= UI SHELL: 5 groups, bottom nav / sidebar, Today, Progress, Settings, Aa sheet, celebrations, intro ================= */
const UI_GROUPS=[
  {k:'today',label:'Hôm nay',icon:'house',views:['home']},
  {k:'review',label:'Ôn tập',icon:'layers',views:['study','mistakes','games']},
  {k:'practice',label:'Luyện',icon:'target',views:['listen','read','write','speak','lab','test']},
  {k:'lookup',label:'Tra cứu',icon:'search',views:['dict','grammar','pron','daily']},
  {k:'me',label:'Tôi',icon:'user-round',views:['progress','friends','settings']},
];
const UI_ALIAS={placement:'progress'};
const UI_V={home:['Hôm nay','house'],study:['Thẻ từ','repeat'],mistakes:['Sổ lỗi sai','notebook-pen'],games:['Trò chơi','gamepad-2'],
  listen:['Listening','headphones'],read:['Reading','book-open'],write:['Writing','pen-line'],speak:['Speaking','mic'],lab:['Phòng AI','sparkles'],test:['Thi thử','clipboard-check'],
  dict:['Từ điển','book-a'],grammar:['Ngữ pháp','puzzle'],pron:['Phát âm','audio-waveform'],daily:['Mẹo mỗi ngày','lightbulb'],
  progress:['Tiến độ','trophy'],friends:['Bạn học','users'],settings:['Cài đặt','settings']};
const uiGroupOf=v=>{v=UI_ALIAS[v]||v;return UI_GROUPS.find(g=>g.views.includes(v))||UI_GROUPS[0];};
const UI_LAST=store.get('catalis-lastv',{});
const uiReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

function uiInit(){
  const fl=document.createElementNS('http://www.w3.org/2000/svg','svg');fl.setAttribute('width','0');fl.setAttribute('height','0');fl.style.position='absolute';
  fl.innerHTML='<defs><linearGradient id="flameG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB020"/><stop offset="1" stop-color="#FF6A1A"/></linearGradient></defs>';document.body.appendChild(fl);
  $('#brandMc').innerHTML=catSVG('calm',44,mcRankIdx());$('#brandMc2').innerHTML=catSVG('calm',38,mcRankIdx());
  $('#brand').onclick=()=>go('home');$('#brandSm').onclick=()=>go('home');
  $('#tgAa').onclick=uiAaSheet;
  $('#stChip').onclick=$('#stChip2').onclick=()=>go('progress');
  $('#bnav').innerHTML=UI_GROUPS.map(g=>`<button data-g="${g.k}" aria-label="${g.label}"><span class="ind">${ic(g.icon)}</span><span>${g.label}</span></button>`).join('');
  $$('#bnav [data-g]').forEach(b=>b.onclick=()=>uiGoGroup(b.dataset.g));
  document.addEventListener('pointerdown',e=>{UI_PT={x:e.clientX,y:e.clientY};},{capture:true,passive:true});
  document.addEventListener('click',uiOptFx);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('.mc-cele');if(m&&!m.classList.contains('locked'))m.remove();}});
}
let UI_PT=null;
function uiGoGroup(k){const g=UI_GROUPS.find(x=>x.k===k);const v=UI_LAST[k]&&g.views.includes(UI_LAST[k])?UI_LAST[k]:g.views[0];go(v);}
function uiNav(){
  plMigrate();
  const v=UI_ALIAS[current]||current, g=uiGroupOf(current);
  if(UI_LAST[g.k]!==v&&g.views.includes(v)){UI_LAST[g.k]=v;store.set('catalis-lastv',UI_LAST);}
  let due=0;try{due=dueList(P.settings.lv).length;}catch(e){}
  const badge=k=>k==='review'&&due?`<span class="badge num">${due>99?'99+':due}</span>`:'';
  $$('#bnav [data-g]').forEach(b=>{if(b.dataset.g===g.k)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');const old=$('.badge',b);if(old)old.remove();const bd=badge(b.dataset.g);if(bd)b.insertAdjacentHTML('beforeend',bd);});
  $('#sideNav').innerHTML=UI_GROUPS.map(x=>{const on=x.k===g.k;const solo=x.views.length===1;
    return `<button class="g${solo?' solo':''}" data-g="${x.k}" ${on?'aria-current="page"':''}>${ic(x.icon)}<span>${x.label}</span>${badge(x.k)}</button>`+
      (on&&!solo?`<div class="sub">${x.views.map(w=>`<button data-v="${w}" ${w===v?'aria-current="page"':''}>${UI_V[w][0]}</button>`).join('')}</div>`:'');}).join('');
  $$('#sideNav [data-g]').forEach(b=>b.onclick=()=>uiGoGroup(b.dataset.g));
  $$('#sideNav [data-v]').forEach(b=>b.onclick=()=>go(b.dataset.v));
  $('#pgTitle').textContent=g.k==='today'?'Hôm nay':g.label;
  document.title=g.k==='today'?"Catalis - Stalis's IELTS":(UI_V[v]?UI_V[v][0]:'Catalis')+' - Catalis';
  const sn=$('#subnav');
  if(g.views.length>1){sn.innerHTML=g.views.map(w=>`<button role="tab" data-v="${w}" aria-selected="${w===v}">${ic(UI_V[w][1])}${UI_V[w][0]}</button>`).join('');
    $$('[data-v]',sn).forEach(b=>b.onclick=()=>go(b.dataset.v));
    const on=$('[aria-selected="true"]',sn);if(on&&on.scrollIntoView)setTimeout(()=>{try{on.scrollIntoView({block:'nearest',inline:'nearest'});}catch(e){}},0);}
  else sn.innerHTML='';
  uiChips();
}
function uiStudied(k){const d=(P.day||{})[k];return !!((d&&d.xp)||P.hist[k]);}
let UI_RANK=-1;
function uiChips(){
  const st=streak(), hot=uiStudied(ymd(Date.now()));
  const html=`<svg class="i" aria-hidden="true" style="fill:${hot?'url(#flameG)':'var(--line2)'}"><use href="#i-flame"/></svg><span class="num">${st}</span>`;
  ['#stChip','#stChip2'].forEach(s=>{const e=$(s);if(e){e.innerHTML=html;e.classList.toggle('cold',!hot);e.title='Chuỗi '+st+' ngày';}});
  const x=$('#xpChip');if(x){x.innerHTML=`${ic('zap')}<span>${(plDay().xp||0)}</span>`;}
  const r=mcRankIdx();if(UI_RANK!==r){UI_RANK=r;const a=$('#brandMc'),b=$('#brandMc2');if(a)a.innerHTML=catSVG('calm',44,r);if(b)b.innerHTML=catSVG('calm',38,r);}
}

/* ---------- Today ---------- */
const UI_SHORT={srs:'Thẻ từ',listen:'Nghe',read:'Đọc',speak:'Nói',grammar:'Ngữ pháp',daily:'Mẹo',write:'Viết',test:'Thi thử',mist:'Sổ lỗi'};
function uiGreet(){const h=new Date().getHours();return h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối';}
function uiRing(pct,size){const p=Math.round(Math.min(1,pct)*100);return `<div class="ring-box" style="width:${size}px;height:${size}px"><svg class="ring ${p>=100?'full':''}" viewBox="0 0 72 72" width="${size}" height="${size}" role="img" aria-label="${p}% mục tiêu"><circle cx="36" cy="36" r="30" class="ring-track"/><circle cx="36" cy="36" r="30" class="ring-fill" pathLength="100" style="stroke-dasharray:${p} 100;${p?'':'opacity:0'}"/></svg><span class="ring-n num">${p>=100?ic('check'):p+'%'}</span></div>`;}
function uiWeek(){
  const t=today(), dow=(new Date(t).getDay()+6)%7, mon=t-dow*DAY, names=['T2','T3','T4','T5','T6','T7','CN'];
  return `<div class="wk">${names.map((n,i)=>{const d=mon+i*DAY,k=ymd(d),done=uiStudied(k),isT=d===t,fut=d>t;
    return `<div class="wk-d ${done?'on':''} ${isT?'is-today':''} ${fut?'fut':''}"><span class="wk-n">${n}</span><span class="wk-c">${done?ic('check'):new Date(d).getDate()}</span></div>`;}).join('')}</div>`;
}
VIEWS.home=el=>{
  plCfg();plApply();
  const tasks=plTasks(), d=plDay(), goal=plGoalXP(), xpT=plXPTotal(), {r,nx}=plRank(xpT), c=plCfg();
  const doneN=tasks.filter(t=>t.done).length, next=tasks.find(t=>!t.done);
  let due=0,nw=0;try{due=dueList(P.settings.lv).length;nw=Math.max(0,P.settings.newPerDay-newToday());}catch(e){}
  const label=next?(doneN?'Tiếp tục: ':'Bắt đầu: ')+(next.k==='srs'&&due+nw?`ôn ${due+nw} thẻ`:next.t.charAt(0).toLowerCase()+next.t.slice(1)):'Xong hôm nay. Học thêm?';
  const pool=V.filter(w=>w.lv&&!PHR_LV(w.lv)&&P.settings.lv.includes(w.lv)&&w.col&&w.col.length); const wd=pool.length?pool[(Math.floor(Date.now()/DAY)*7)%pool.length]:null;
  const lo=nx?nx[0]-r[0]:1, pr=nx?(xpT-r[0])/lo:1;
  const est=estBand(); const days=c.date?Math.ceil((new Date(c.date).getTime()-today())/DAY):null;
  const firstTime=Object.keys(P.srs).length<20&&!P.placed&&!P.placeRedo;
  el.innerHTML=`<div class="view home2">
   <div class="hm-hello">${mascot(doneN===tasks.length?'yay':'hi',64)}<div><h2 class="hm-greet">${uiGreet()}, ${esc(uiName())}</h2><p class="note">${doneN===tasks.length?'Hôm nay xong hết rồi. Jack tự hào lắm!':doneN?`Đã xong ${doneN}/${tasks.length} nhiệm vụ hôm nay. Thêm chút nữa nhé.`:'Mỗi ngày một chút, band sẽ lên. Học cùng Jack nhé.'}</p></div></div>
   ${SYNC==='web'&&syncState==='off'?`<div class="vbanner">${mcSay('hmm','Tiến độ đang chỉ lưu trên máy này. Nhập mật khẩu nhóm để đồng bộ với các máy khác và hiện trên bảng Bạn học.',48)}<div class="row"><button class="btn primary sm" id="hmSync">Nhập mật khẩu nhóm</button></div></div>`:''}
   ${uiWeek()}
   <div class="hm-grid">
    <div class="hm-main">
     <section class="sess" aria-label="Buổi học hôm nay">
      <div class="sess-top"><div><div class="sess-k">Buổi học hôm nay</div><div class="sess-x"><b class="num">${d.xp||0}</b> / ${goal} XP</div><div class="sess-s">${doneN}/${tasks.length} nhiệm vụ, khoảng ${c.minutes} phút</div></div>${uiRing((d.xp||0)/goal,76)}</div>
      <ol class="path">${tasks.map(t=>`<li class="${t.done?'on':''} ${t===next?'cur':''}"><i></i><span>${UI_SHORT[t.k]||t.t}</span></li>`).join('')}</ol>
      <button class="btn sess-go" id="hmGo">${esc(label)} ${ic('chevron-right')}</button>
     </section>
     <div class="tasks">${tasks.map(t=>`<button class="task ${t.done?'done':''}" data-go="${t.go}"><span class="tk-c">${t.done?ic('check'):ic(UI_V[t.go]?UI_V[t.go][1]:'sparkles')}</span><span class="tk-t"><span><b>${esc(t.t)}</b>${t.n?` <span class="num muted small">${Math.min(t.n[0],t.n[1])}/${t.n[1]}</span>`:''}</span><span class="small muted">${esc(t.sub)}</span></span>${ic('chevron-right','tk-a')}</button>`).join('')}</div>
     ${P.placeRedo&&!P.placed?mcSay('hmm',`Bài xếp lớp vừa được làm lại cho sát thực tế hơn, nên kết quả cũ đã được xóa. Làm <button class="lnk" data-go="placement">bài xếp lớp mới khoảng 15 phút</button> để Jack chọn lại lộ trình cho đúng.`,56):''}
     ${firstTime?mcSay('idea',`Chưa biết mình đang ở band nào? Làm <button class="lnk" data-go="placement">bài xếp lớp khoảng 15 phút</button> để Jack chọn lộ trình hợp với bạn.`,56):''}
    </div>
    <div class="hm-side">
     ${(()=>{const lb=latestBands(),sk=['listening','reading','writing','speaking'].filter(k=>lb[k]!=null),reached=est!=null&&est>=c.target;
       const sub=est==null?'Làm bài xếp lớp hoặc thi thử để biết':sk.length&&sk.length<4?`Mới có ${sk.map(k=>SK_NAME[k]).join(', ')}. Cần đủ 4 kỹ năng để ra band thật.`:'Dựa trên lần làm gần nhất của 4 kỹ năng.';
       return `<button class="mini band-mini" data-go="progress"><span class="label">Band ước lượng</span><span class="bm-row"><span class="mini-n num">${fmtBand(est)}</span>${reached?`<span class="bm-ok">Đã chạm mục tiêu ${c.target.toFixed(1)}</span>`:`<span class="bm-arrow">-></span><span class="bm-t num">${c.target.toFixed(1)}</span>`}</span><span class="mini-l">${sub}${days!=null&&days>0?` Còn ${days} ngày đến ngày thi.`:''}</span>${reached&&c.target<9?`<span class="mini-a" data-plan="1">Nâng mục tiêu lên ${Math.min(9,c.target+0.5).toFixed(1)} ${ic('chevron-right')}</span>`:''}</button>`;})()}
     <button class="mini" data-go="study"><span class="mini-n num">${due}</span><span class="mini-l">${due?'thẻ cần ôn':'Hết thẻ cần ôn'}</span><span class="mini-a">${due?'Ôn nhanh':'Học '+Math.min(5,nw||5)+' từ mới'} ${ic('chevron-right')}</span></button>
     <button class="mini rank" data-go="progress"><span class="seal-rk">${r[1]}</span><span class="mini-l"><b>${r[2]}</b></span><span class="bar-track"><i style="width:${Math.round(pr*100)}%"></i></span><span class="small muted num">${nx?`${xpT-r[0]}/${lo} XP lên ${nx[1]}`:'Danh hiệu cao nhất'}</span></button>
     ${wd?`<div class="panel wotd2"><span class="label">Từ của ngày</span><div class="wotd"><span class="em">${wd.em||''}</span><div style="min-width:0"><div class="h en">${esc(wd.w)}</div><div class="small muted">${esc(wd.ipa)} ${esc(wd.pos)}</div><div class="small">${esc(wd.vi)}</div></div><button class="spk" data-say="${esc(wd.w)}" aria-label="Nghe">${SPK}</button></div><div class="small muted">${esc(wd.col.join(', '))}</div><button class="btn sm" id="hWd" style="align-self:flex-start">Xem chi tiết</button></div>`:''}
     <button class="panel cul-inv" data-go="daily"><span class="cul-ic">${ic('lightbulb')}</span><span style="min-width:0"><span class="label">Mẹo hôm nay</span><b id="hmTip" class="cul-t">Đang tải...</b></span>${ic('chevron-right')}</button>
    </div>
   </div></div>`;
  $('#hmGo').onclick=()=>go(next?next.go:'study');
  const hs=$('#hmSync',el);if(hs)hs.onclick=async()=>{if(await askPassword(false)){await pullRemote();renderSync();route();}};
  const bp=$('[data-plan]',el);if(bp)bp.onclick=e=>{e.stopPropagation();c.target=Math.min(9,c.target+0.5);plApply();touch('main');toast('Mục tiêu mới: band '+c.target.toFixed(1));VIEWS.home(el);};
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  const b=$('#hWd');if(b)b.onclick=()=>openWord(wd.k);
  loadJSON('daily').then(all=>{const t=$('#hmTip');if(!t||!all.length)return;const x=all[dlyIndex()%all.length];t.innerHTML=`${esc(x.title)}`;if(P.dly&&P.dly[x.id])t.insertAdjacentHTML('beforeend',' '+ic('check','ok-i'));}).catch(()=>{});
  uiFriendsCard();
};

/* ---------- Me: progress ---------- */
const UI_RANK_DESC=['Vừa nhập học, mọi thứ còn mới.','Đã quen nhịp học, bắt đầu tăng tốc.','Nền tảng vững, sẵn sàng cho đề khó hơn.','Năm cuối, chuẩn bị bước vào phòng thi.','Tốt nghiệp cử nhân, kiến thức đã thành hệ thống.','Thạc sĩ, dùng tiếng Anh học thuật tự tin.','Tiến sĩ, kiên trì hiếm có.','Giáo sư, người truyền cảm hứng cho cả nhóm.'];
const SK_NAME={listening:'Listening',reading:'Reading',writing:'Writing',speaking:'Speaking'};
VIEWS.progress=el=>{
  const c=plCfg(), xpT=plXPTotal(),{r,nx}=plRank(xpT),ri=PL_RANKS.indexOf(r),wk=plWeek();
  const heat=[];const start=today()-83*DAY;for(let i=0;i<84;i++){const k=ymd(start+i*DAY);const n=((P.day||{})[k]||{}).xp||0;heat.push(n===0?'':n<30?'h1':n<70?'h2':n<120?'h3':'h4');}
  const knownN=Object.keys(P.srs).filter(known).length, seenN=Object.keys(P.srs).length;
  const lb=latestBands(), est=estBand();
  const hist=(P.scores||[]).slice(-12).reverse();
  el.innerHTML=`<div class="view">
   <div class="rk-hero">${mascot('ok',110)}<div><span class="label" style="color:inherit;opacity:.85">Danh hiệu</span><h2>${r[1]}</h2><p class="small" style="margin:2px 0 8px;opacity:.9">${r[2]}. ${UI_RANK_DESC[ri]||''}</p>
     <div class="bar-track lt"><i style="width:${nx?Math.round((xpT-r[0])/(nx[0]-r[0])*100):100}%"></i></div><div class="small num" style="margin-top:4px;opacity:.9">${xpT} XP${nx?`, còn ${nx[0]-xpT} XP lên ${nx[1]}`:''}</div></div></div>
   <div class="ranks">${PL_RANKS.map((x,i)=>`<div class="rk ${i<=ri?'on':''}" title="${x[2]}: ${x[0]} XP">${catSVG(i<=ri?'calm':'zzz',44,i)}<span class="rk-n">${x[1]}</span><span class="small">${x[0]} XP</span></div>`).join('')}</div>
   <div class="panel"><div class="spread"><h3>Band</h3><span class="note">Mục tiêu ${c.target.toFixed(1)}, ${c.exam==='general'?'General Training':'Academic'}</span></div>
     <div class="bands">${['listening','reading','writing','speaking'].map(s=>`<div class="bd-c"><span class="small muted">${SK_NAME[s]}</span><b class="num">${fmtBand(lb[s])}</b></div>`).join('')}<div class="bd-c ov"><span class="small">Overall</span><b class="num">${fmtBand(est)}</b></div></div>
     ${hist.length?`<details class="adv"><summary>Lịch sử điểm (${(P.scores||[]).length})</summary><div class="sc-list">${hist.map(s=>`<div class="kv"><span>${new Date(s.t).toLocaleDateString('vi-VN')} ${esc(s.title||SK_NAME[s.skill]||s.skill)}</span><b class="num">${s.raw!=null&&s.total?s.raw+'/'+s.total+', ':''}${fmtBand(s.band)}</b></div>`).join('')}</div></details>`:'<p class="note">Chưa có điểm. Làm bài xếp lớp hoặc một bài thi thử để Jack ghi lại.</p>'}
     <div class="row"><button class="btn sm" data-go="test">${ic('clipboard-check')} Thi thử</button><button class="btn sm" data-go="placement">Bài xếp lớp</button><button class="btn sm" id="pgPlan">Đổi lộ trình</button></div></div>
   <div class="stats4">
     <div class="panel st"><span class="st-i fl">${ic('flame')}</span><b class="num">${streak()}</b><span class="small muted">ngày liên tiếp</span></div>
     <div class="panel st"><span class="st-i xp">${ic('zap')}</span><b class="num">${wk.xp}</b><span class="small muted">XP 7 ngày qua</span></div>
     <div class="panel st"><span class="st-i ok">${ic('check')}</span><b class="num">${knownN}</b><span class="small muted">từ đã thuộc (${seenN} đã gặp)</span></div>
     <div class="panel st"><span class="st-i bl">${ic('calendar-check')}</span><b class="num">${wk.act}/7</b><span class="small muted">ngày học tuần này</span></div>
   </div>
   <div class="grid2">
    <div class="panel"><div class="spread"><h3>Từ vựng</h3><span class="note">thuộc = nhớ được sau >= 7 ngày</span></div>
      ${LVS.map(L=>{const ws=V.filter(w=>w.lv===L);const k=ws.filter(w=>known(w.k)).length;const s=ws.filter(w=>seen(w.k)).length;const tot=ws.length||LV_COUNT[L]||1;
        return `<div class="lvrow"><b>${LV_NAME[L]}</b><span class="bar-track"><i style="width:${k/tot*100}%"></i><i class="seen" style="width:${(s-k)/tot*100}%"></i></span><span class="num muted small">${k}/${tot}</span></div>`;}).join('')}</div>
    <div class="panel"><h3>12 tuần gần đây</h3>${Object.keys(P.day||{}).length?`<div class="heat">${heat.map(x=>`<i class="${x}"></i>`).join('')}</div><span class="note">Mỗi ô là một ngày, càng đậm càng học nhiều.</span>`:mcSay('zzz','Ô đầu tiên sẽ sáng lên sau buổi học hôm nay.',56)}
      <div class="row"><button class="btn sm" data-go="mistakes">${ic('notebook-pen')} Sổ lỗi sai</button></div></div>
   </div></div>`;
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  $('#pgPlan').onclick=plSettings;
};

/* ---------- settings ---------- */
const uiTg=(id,label,on,sub)=>`<button class="tg-row" id="${id}" role="switch" aria-checked="${!!on}"><span><b>${label}</b>${sub?`<span class="small muted">${sub}</span>`:''}</span><span class="tg"><i></i></span></button>`;
function uiToggles(root,after){
  const g=typeof gmData==='function'?gmData():{};
  const set={tgIpa:()=>{P.settings.ipa=P.settings.ipa===false;},tgSnd:()=>{g.mute=!g.mute;if(typeof gmSave==='function')gmSave();},tgMc:()=>{P.settings.noMascot=!P.settings.noMascot;}};
  Object.keys(set).forEach(id=>{const b=$('#'+id,root);if(b)b.onclick=()=>{set[id]();touch('main');applySettings();b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true');after&&after();};});
  $$('[data-theme-set]',root).forEach(b=>b.onclick=()=>{P.settings.theme=b.dataset.themeSet||'';touch('main');applySettings();$$('[data-theme-set]',root).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  const v=$('#tgVoice2',root);if(v)v.onclick=openVoice;
}
function uiToggleHTML(){
  const g=typeof gmData==='function'?gmData():{};
  return `${uiTg('tgIpa','Phiên âm IPA',P.settings.ipa!==false,'Hiện phiên âm trên thẻ từ')}
   ${uiTg('tgSnd','Âm hiệu đúng sai',!g.mute,'Tiếng "ting" khi đúng, tiếng trầm khi sai')}${uiTg('tgMc','Jack',!P.settings.noMascot,'Mèo cam đi cùng bạn ở các mốc học')}
   <div class="tg-row static"><span><b>Giao diện</b></span><span class="row">${[['','Tự động'],['light','Sáng'],['dark','Tối']].map(([k,t])=>`<button class="chip" data-theme-set="${k}" aria-pressed="${(P.settings.theme||'')===k}">${t}</button>`).join('')}</span></div>
   <button class="tg-row" id="tgVoice2"><span><b>Giọng đọc và tốc độ</b><span class="small muted">Anh, Úc hay Mỹ, giọng nam, giọng nữ, đọc chậm hay nhanh</span></span>${ic('chevron-right')}</button>`;
}
function uiAaSheet(){
  const m=modal(`<h2>Hiển thị và âm thanh</h2><div class="tg-list">${uiToggleHTML()}</div>`);
  m.el.classList.add('sheet'); uiToggles(m.el);
  const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();route();}});obs.observe(document.body,{childList:true});
}
VIEWS.settings=el=>{
  const c=plCfg();
  const aiTxt=AI?'Đang bật':WEB?(WEB.ai?'Cần nhập mật khẩu':'Chưa cấu hình trên máy chủ'):'Không kết nối được máy chủ';
  const syTxt=syncState==='on'?'Đã đồng bộ':syncState==='err'?'Lỗi đồng bộ, đang lưu trên máy':syncState==='off'?'Chưa bật (cần mật khẩu)':'Chỉ lưu trên máy này';
  el.innerHTML=`<div class="view set">
   <div class="panel"><div class="spread"><h3>Người học</h3><button class="btn sm" id="stWho">Đổi người học</button></div><div class="kv"><span>Đang học với tên</span><b>${esc(uiName())}</b></div></div>
   <div class="panel"><h3>Lộ trình</h3><p class="small" style="margin:0"><b>${c.exam==='general'?'General Training':'Academic'}</b>, mục tiêu band <b>${c.target.toFixed(1)}</b>, <b>${c.minutes} phút</b> mỗi ngày, ${P.settings.newPerDay} từ mới mỗi ngày.</p>
     <div class="row"><button class="btn sm" id="stPlan">Đổi lộ trình</button><button class="btn sm" id="stPlR2">Xóa kết quả và xếp lớp lại</button></div></div>
   <div class="panel"><h3>Nhóm từ vựng đang học</h3>${c.auto?'<p class="note">Đang tự chọn theo lộ trình. Bấm chọn tay thì sẽ tắt tự chọn.</p>':''}
     ${levelChips(P.settings.lv,s=>{P.settings.lv=s;c.auto=false;queue=[];touch('main');VIEWS.settings(el);},{id:'stlv'})}
     <label class="row small">Từ mới mỗi ngày <input type="number" id="stNew" min="0" max="60" value="${P.settings.newPerDay}" style="width:84px"></label></div>
   <div class="panel"><h3>Hiển thị và âm thanh</h3><div class="tg-list">${uiToggleHTML()}</div></div>
   <div class="panel"><h3>Đồng bộ và trợ lý AI</h3>
     <div class="kv"><span>Đồng bộ tiến độ</span><b>${syTxt}</b></div><div class="kv"><span>Trợ lý AI</span><b>${aiTxt}</b></div>
     ${WEB&&(!getKey()||syncState==='off')?'<button class="btn primary sm" id="stKey" style="align-self:flex-start">Nhập mật khẩu nhóm</button>':''}
     ${WEB&&getKey()?'<button class="btn ghost sm" id="stOut" style="align-self:flex-start">Quên mật khẩu trên máy này</button>':''}
     <details class="adv"><summary>Nâng cao</summary><p class="note">Trợ lý AI chạy qua Groq, đồng bộ qua Upstash Redis, cấu hình bằng biến môi trường trên Vercel: APP_PASSWORD, GROQ_API_KEY, KV_REST_API_URL, KV_REST_API_TOKEN. Giọng đọc neural (tùy chọn): AZURE_SPEECH_KEY, AZURE_SPEECH_REGION.</p></details></div>
   <div class="panel"><h3>Khác</h3><div class="row"><button class="btn sm" id="stRep">Báo lỗi đã ghi</button><button class="btn sm" id="stHi">Gặp lại Jack</button><button class="btn sm" id="stPlR">Xóa kết quả xếp lớp</button></div>
     <p class="note">Catalis, Stalis's IELTS. Danh sách từ: NGSL và NAWL (Browne, Culligan, Phillips; CC BY-SA 4.0). Phiên âm tham khảo ipa-dict (MIT). Đề luyện, bài mẫu do Catalis soạn riêng theo định dạng IELTS, không phải đề thi thật.</p></div>
  </div>`;
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  $('#stPlan').onclick=plSettings;$('#stWho').onclick=switchProfile;
  $('#stNew').onchange=e=>{P.settings.newPerDay=Math.max(0,Math.min(60,+e.target.value||0));c.auto=false;queue=[];touch('main');};
  uiToggles(el);
  const k=$('#stKey');if(k)k.onclick=async()=>{const ok=await askPassword(false);if(ok){await initPlatform();VIEWS.settings(el);}};
  const o=$('#stOut');if(o)o.onclick=()=>{setKey('');toast('Đã xóa mật khẩu trên máy này.');VIEWS.settings(el);};
  $('#stRep').onclick=reportsList;$('#stHi').onclick=()=>uiIntro(true);$('#stPlR').onclick=plResetPlacement;$('#stPlR2').onclick=plResetPlacement;
};

/* ---------- feedback: sounds, pop/shake, XP fly, celebrations ---------- */
function uiSfx(k){try{if(typeof gmSfx==='function')gmSfx(k);}catch(e){}}
function uiOptFx(e){
  const o=e.target.closest&&e.target.closest('.opt');if(!o)return;
  setTimeout(()=>{
    let el=document.contains(o)?o:null;
    if(!el){const all=$$('.opt.right,.opt.wrong');if(!all.length)return;el=all.find(x=>x.classList.contains('wrong'))||all[0];}
    if(el.dataset.fx)return;
    if(el.classList.contains('wrong')){el.dataset.fx=1;uiSfx('bad');if(!uiReduced())el.classList.add('is-bad');}
    else if(el.classList.contains('right')){el.dataset.fx=1;uiSfx('ok');if(!uiReduced())el.classList.add('is-ok');}
  },30);
}
window.__xpFly=n=>{
  setTimeout(uiChips,0); if(!n)return;
  const chip=[$('#xpChip')].find(x=>x&&x.offsetParent); if(!chip)return;
  const to=chip.getBoundingClientRect(), from=UI_PT||{x:innerWidth/2,y:innerHeight/2};
  const f=document.createElement('div');f.className='xpfly';f.textContent='+'+n+' XP';document.body.appendChild(f);
  f.style.left=from.x+'px';f.style.top=from.y+'px';
  if(uiReduced()||!f.animate){setTimeout(()=>f.remove(),900);return;}
  const dx=to.left+to.width/2-from.x, dy=to.top+to.height/2-from.y;
  f.animate([{transform:'translate(-50%,-50%) scale(.8)',opacity:0},{transform:'translate(-50%,-120%) scale(1.05)',opacity:1,offset:.25},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.6)`,opacity:.2}],{duration:750,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>{f.remove();};
};
function confetti({count=100,duration=1500}={}){
  if(uiReduced())return;
  const cv=document.createElement('canvas'),dpr=devicePixelRatio||1;cv.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:90;width:100%;height:100%';
  cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;document.body.appendChild(cv);const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  const cols=['#22346E','#E8821E','#F5B82E','#2C5FC4','#FFC857','#C8372F'];
  const ps=Array.from({length:count},()=>({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.35,vx:(Math.random()-.5)*13,vy:-Math.random()*13-4,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.3,w:6+Math.random()*6,h:4+Math.random()*4,c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0=performance.now();
  (function f(t){const k=(t-t0)/duration;ctx.clearRect(0,0,innerWidth,innerHeight);
    ps.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.globalAlpha=Math.max(0,1-k);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
    if(k<1)requestAnimationFrame(f);else cv.remove();})(t0);
}
function uiCele(html,cls){
  const old=$('.mc-cele');if(old)old.remove();
  const bg=document.createElement('div');bg.className='mc-cele '+(cls||'');bg.setAttribute('role','dialog');bg.setAttribute('aria-modal','true');
  bg.innerHTML=`<div class="cele-in">${html}</div>`;document.body.appendChild(bg);
  const close=()=>bg.remove();$$('[data-close]',bg).forEach(b=>b.onclick=close);bg.addEventListener('click',e=>{if(e.target===bg&&!bg.classList.contains('locked'))close();});
  setTimeout(()=>{const b=$('[data-close]',bg);b&&b.focus();},50);
  return {el:bg,close};
}
window.__rankUp=b=>{
  const i=PL_RANKS.indexOf(b), nx=PL_RANKS[i+1];
  uiCele(`<div class="cele-mc">${catSVG('yay',140,i)}</div><div class="stamp">${b[1]}</div><h2>Bạn đã lên ${b[2]}!</h2><p>${UI_RANK_DESC[i]||''} Jack có phụ kiện mới rồi.</p>${nx?`<p class="small" style="opacity:.85">Mốc tiếp theo: ${nx[1]}, ${nx[0]} XP.</p>`:''}<button class="btn cele-btn" data-close>Tuyệt vời</button>`,'rank');
  uiSfx('end');setTimeout(()=>confetti({count:130}),300);uiChips();
};
window.__goalDone=()=>{
  if($('.mc-cele'))return;
  const d=plDay();
  uiCele(`<div class="cele-mc">${mascot('yay',130)}</div><h2>Xong mục tiêu hôm nay!</h2>
    <div class="cele-st"><div><span class="st-i xp">${ic('zap')}</span><b class="num">${d.xp||0}</b><span>XP</span></div><div><span class="st-i fl">${ic('flame')}</span><b class="num">${streak()}</b><span>ngày liên tiếp</span></div><div><span class="st-i ok">${ic('check')}</span><b class="num">${P.hist[ymd(Date.now())]||0}</b><span>lượt học</span></div></div>
    <p class="small">Mai giữ lửa nhé. Học thêm thì lên danh hiệu nhanh hơn.</p><div class="row" style="justify-content:center"><button class="btn cele-btn" data-close>Xong</button><button class="btn ghost" data-close data-more>Học thêm 5 phút</button></div>`,'goal');
  const m=$('[data-more]');if(m)m.addEventListener('click',()=>go('study'));
  uiSfx('end');confetti();
};
window.__voiceBanner=()=>{
  if(store.get('catalis-vtip',0))return; const v=$('#view .view');if(!v||$('.vbanner'))return;
  v.insertAdjacentHTML('afterbegin',`<div class="vbanner">${mcSay('hmm','Máy này chưa có giọng đọc tiếng Anh nên một số chỗ sẽ không phát được âm thanh.',48)}<div class="row"><button class="btn sm" id="vbHow">Cách cài</button><button class="btn ghost sm" id="vbHide">Ẩn</button></div></div>`);
  $('#vbHow').onclick=openVoice;$('#vbHide').onclick=()=>{store.set('catalis-vtip',1);$('.vbanner').remove();};
};

/* ---------- intro / onboarding ---------- */
function uiIntro(force){
  if(!force&&store.get('catalis-intro',0)&&WHO)return;
  const fresh=Object.keys(P.srs).length<5, noName=!WHO;
  const steps=[
    ()=>`<div class="cele-mc">${mascot('hi',120)}</div><h2>Chào bạn, mình là Jack</h2><p>Đây là <b>Catalis</b>, chỗ cả nhóm cùng luyện IELTS. Catalis là cat + Stalis, cũng là chất xúc tác giúp band của bạn tăng nhanh hơn. Tên tiếng Việt của mình là Mít, mà mít là jackfruit, nên cứ gọi Jack nhé.</p>${profileForm(true)}<button class="btn cele-btn" id="inName">Tiếp</button>`,
    ()=>`<div class="cele-mc">${mascot('hi',130)}</div><h2>Chào ${esc(uiName())}!</h2><p>Mình lớn lên theo danh hiệu của bạn, từ Freshman đến Professor. Mỗi lần lên hạng, mình được thêm phụ kiện mới.</p>
      <div class="hats">${[0,1,2,4,5,7].map(i=>catSVG('calm',52,i)).join('')}</div><button class="btn cele-btn" id="inNext">${fresh?'Tiếp':'Học thôi'}</button>`,
    ()=>{const c=plCfg();return `<div class="cele-mc">${mascot('idea',96)}</div><h2>Bạn thi dạng nào?</h2><div class="row" style="justify-content:center">${[['academic','Academic'],['general','General Training']].map(([k,t])=>`<button class="chip big" data-ex="${k}" aria-pressed="${c.exam===k}">${t}</button>`).join('')}</div>
      <h2 style="margin-top:8px">Mỗi ngày học bao lâu?</h2><div class="row" style="justify-content:center">${[15,30,45,60].map(n=>`<button class="chip big" data-mn="${n}" aria-pressed="${c.minutes===n}">${n} phút</button>`).join('')}</div>
      <h2 style="margin-top:8px">Bắt đầu thế nào?</h2><div class="in-opts"><button class="btn" data-lv="test">Làm bài xếp lớp khoảng 15 phút (nên làm)</button><button class="btn" data-lv="new">Học từ nền tảng luôn</button></div>`;},
  ];
  let i=noName?0:1; const m=uiCele('','intro'+(noName?' locked':''));const box=$('.cele-in',m.el);
  const draw=()=>{box.innerHTML=steps[i]();
    const nm=$('#inName',box);if(nm)nm.onclick=async()=>{const n=$('#pfN',box).value.trim(),p=$('#pfP',box).value.trim();if(!slugOf(n)){toast('Nhập tên của bạn trước nhé.');return;}if(p&&p.length<4){toast('PIN cần 4 đến 6 số.');return;}
      const k=$('#pfK',box);await setProfile(n,p,k&&k.value.trim());m.el.classList.remove('locked');i=1;draw();};
    const n=$('#inNext',box);if(n)n.onclick=()=>{if(fresh&&i===1){i=2;draw();}else{store.set('catalis-intro',1);m.close();}};
    $$('[data-ex]',box).forEach(b=>b.onclick=()=>{plCfg().exam=b.dataset.ex;touch('main');$$('[data-ex]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
    $$('[data-mn]',box).forEach(b=>b.onclick=()=>{plCfg().minutes=+b.dataset.mn;plApply();touch('main');$$('[data-mn]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
    $$('[data-lv]',box).forEach(b=>b.onclick=()=>{store.set('catalis-intro',1);m.close();if(b.dataset.lv==='test')go('placement');else{plApply();touch('main');go('study');}});};
  draw();
}
