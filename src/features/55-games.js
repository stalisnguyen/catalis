/* ================= GAMES (Trò chơi): vocabulary games on the learner's SRS words + shared sound effects ================= */
function gmData(){P.gm=P.gm||{};P.gm.best=P.gm.best||{};return P.gm;}
function gmSave(){touch('main');}
let GM_AC=null;
function gmSfx(kind){
  if(gmData().mute)return;
  try{
    if(!GM_AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;GM_AC=new C();}
    const ac=GM_AC; if(ac.state==='suspended')ac.resume();
    const t0=ac.currentTime+0.01;
    const tone=(f,start,dur,{type='sine',vol=0.18,slide=0}={})=>{
      const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t0+start);
      if(slide)o.frequency.exponentialRampToValueAtTime(f*slide,t0+start+dur);
      g.gain.setValueAtTime(0.0001,t0+start);g.gain.exponentialRampToValueAtTime(vol,t0+start+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t0+start+dur);
      o.connect(g);g.connect(ac.destination);o.start(t0+start);o.stop(t0+start+dur+0.02);
    };
    if(kind==='ok'){tone(880,0,0.16,{vol:0.14});tone(1318.5,0.08,0.26,{vol:0.12});}
    else if(kind==='bad'){tone(196,0,0.18,{type:'triangle',vol:0.2,slide:0.8});}
    else if(kind==='end'){tone(523.25,0,0.16,{type:'triangle',vol:0.16});tone(659.25,0.13,0.16,{type:'triangle',vol:0.16});tone(783.99,0.26,0.42,{type:'triangle',vol:0.18});tone(1567.98,0.26,0.42,{vol:0.05});}
  }catch(e){}
}

const GM_GAMES=[
  {k:'speed',t:'Tốc độ 60 giây',d:'Chọn nghĩa đúng nhanh nhất có thể. Đúng liên tiếp để nhân điểm.',ic:'zap'},
  {k:'dict',t:'Nghe và gõ',d:'Nghe một từ rồi gõ lại chính tả. 10 lượt.',ic:'headphones'},
  {k:'cloze',t:'Điền từ vào câu',d:'Đọc câu ví dụ bị khuyết một từ và chọn từ đúng. 10 lượt.',ic:'pen-line'},
  {k:'match',t:'Ghép cặp',d:'Nối 6 từ tiếng Anh với nghĩa tiếng Việt, càng nhanh càng tốt.',ic:'puzzle'},
];
const GM_S={pool:null,src:''};
let GM_TIMERS=[];
function gmClear(){GM_TIMERS.forEach(t=>{try{t.stop?t.stop():clearInterval(t);}catch(e){}});GM_TIMERS=[];stopSay();}
// short Vietnamese meaning for options: first sense, part-of-speech tag removed
function gmVi(w){let s=String(w.vi||'').split(';')[0].replace(/^\s*\([a-z., ]+\)\s*/i,'').trim();if(s.length>42){const c=s.split(',')[0].trim();s=c.length>=4?c:s.slice(0,40)+'...';}return s;}
function gmStem(word){const w=word.toLowerCase().split(' ')[0];return w.length<=4?w:w.replace(/(e|y)$/,'').slice(0,Math.max(3,w.length-2));}
function gmBlank(w){
  if(!w.ex)return null; const one=!/\s/.test(w.w.trim());
  const re=one?new RegExp('\\b'+gmStem(w.w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[a-z]*\\b','i'):new RegExp(w.w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
  const m=w.ex.match(re); if(!m)return null;
  return {pre:w.ex.slice(0,m.index),hit:m[0],post:w.ex.slice(m.index+m[0].length)};
}
async function gmPool(){
  await loadAllVocab();
  const seenWords=Object.keys(P.srs||{}).map(k=>VI.get(k)).filter(w=>w&&w.vi);
  if(seenWords.length>=20){GM_S.src='seen';return seenWords;}
  GM_S.src='lv';const lv=P.settings.lv&&P.settings.lv.length?P.settings.lv:[1];
  return V.filter(w=>lv.includes(w.lv)&&w.vi);
}
function gmDistract(w,pool,n,key){
  const val=key||(x=>gmVi(x)), mine=val(w), same=pool.filter(x=>x!==w&&x.pos===w.pos&&val(x)!==mine);
  const out=[];const used=new Set([mine]);
  for(const x of shuffle(same.length>=n*3?same:pool)){if(x===w)continue;const v=val(x);if(used.has(v))continue;used.add(v);out.push(x);if(out.length>=n)break;}
  return out;
}

VIEWS.games=async el=>{
  gmClear();
  el.innerHTML='<div class="view"><p class="note">Đang tải từ vựng...</p></div>';
  GM_S.pool=await gmPool();
  window.__leave=gmClear;
  gmHome(el);
};
function gmHome(el){
  gmClear(); const g=gmData();
  const bestTxt=k=>{const b=g.best[k];if(b==null)return 'Chưa chơi';return k==='match'?'Kỷ lục '+fmtTime(b):k==='speed'?'Kỷ lục '+b+' điểm':'Kỷ lục '+b+'/10';};
  el.innerHTML=`<div class="view gm">
    <div class="spread"><h2>Trò chơi từ vựng</h2><button class="icon-btn" id="gmMute" aria-pressed="${!g.mute}">${ic(g.mute?'square':'volume-2')} ${g.mute?'Đang tắt tiếng':'Âm thanh'}</button></div>
    <p class="note">${GM_S.src==='seen'?`Dùng ${GM_S.pool.length} từ bạn đã gặp trong thẻ ôn.`:`Bạn mới học dưới 20 từ nên trò chơi lấy từ nhóm ${(P.settings.lv||[1]).map(L=>LV_NAME[L]).join(', ')}.`}</p>
    <div class="gm-cards">${GM_GAMES.map(x=>`<button class="gm-card" data-g="${x.k}"><span class="gm-ic">${ic(x.ic)}</span><span class="gm-ct"><b>${x.t}</b><span class="small muted">${x.d}</span><span class="pill">${bestTxt(x.k)}</span></span></button>`).join('')}</div>
  </div>`;
  $('#gmMute').onclick=()=>{g.mute=!g.mute;gmSave();gmHome(el);if(!g.mute)gmSfx('ok');};
  $$('[data-g]',el).forEach(b=>b.onclick=()=>gmStart(el,b.dataset.g));
}
function gmStage(el,k,hud){
  const G=GM_GAMES.find(x=>x.k===k);
  el.innerHTML=`<div class="view gm"><div class="gm-stage">
    <div class="gm-head"><button class="btn ghost sm" id="gmBack">${ic('chevron-left')}<span class="gm-hide">Trò chơi</span></button><h3 class="gm-title">${G.t}</h3><div class="gm-hud">${hud||''}</div></div>
    <div class="gm-body" id="gmBody"></div></div></div>`;
  $('#gmBack').onclick=()=>gmHome(el);
  return $('#gmBody');
}
function gmStart(el,k){
  gmClear();
  const pool=GM_S.pool||[];
  if(pool.length<8){el.innerHTML=`<div class="view">${mcSay('hmm','Chưa đủ từ để chơi. Học vài thẻ từ trước nhé.',64)}<button class="btn primary">Về thẻ từ</button></div>`;$('.btn',el).onclick=()=>go('study');return;}
  ({speed:gmSpeed,dict:gmDict,cloze:gmCloze,match:gmMatch}[k])(el,pool);
}
function gmEnd(el,k,{score,total,line,best,isBest,missed}){
  gmClear(); gmSfx('end'); if(isBest&&score>0&&typeof confetti==='function')confetti({count:80});
  const body=gmStage(el,k);
  const st=k==='match'?(score>=total?'yay':'ok'):(total&&score/total>=0.8)||(k==='speed'&&isBest)?'yay':(total&&score/total>=0.5)||k==='speed'?'ok':'hmm';
  body.innerHTML=`<div class="gm-end">
    ${mascot(st,96)}
    <div class="gm-score num">${esc(line)}</div>
    <div class="gm-stats">${best}</div>
    ${isBest?'<span class="pill ai">Kỷ lục mới</span>':''}
    ${missed&&missed.length?`<div class="gm-missed"><span class="label">Từ cần ôn lại</span><div class="gm-mlist">${missed.slice(0,8).map(w=>`<div class="gm-mw"><button class="spk sm" data-say="${esc(w.w)}" aria-label="Nghe">${SPK}</button><button class="gm-mwb" data-wd="${esc(w.k)}"><span class="gm-mt"><b>${esc(w.w)}</b><span class="small muted">${esc(gmVi(w))}</span></span></button></div>`).join('')}</div></div>`:''}
    <div class="row gm-endbtns"><button class="btn primary" id="gmAgain">${ic('rotate-ccw')} Chơi lại</button><button class="btn" id="gmOther">Trò khác</button></div>
  </div>`;
  $$('[data-wd]',body).forEach(b=>b.onclick=()=>openWord(b.dataset.wd));
  $('#gmAgain').onclick=()=>gmStart(el,k);$('#gmOther').onclick=()=>gmHome(el);
}
function gmWrong(w){window.__mistake&&window.__mistake('word',w.k);}
function gmRight(){award('game',1);}
function gmFloat(host,txt,ok){
  if(!host)return;const f=document.createElement('div');f.className='gm-float '+(ok?'ok':'bad');f.textContent=txt;f.style.left='50%';f.style.top='0';f.style.transform='translateX(-50%)';host.appendChild(f);
  if(f.animate)f.animate([{opacity:0,transform:'translate(-50%,10px)'},{opacity:1,transform:'translate(-50%,-6px)',offset:.3},{opacity:0,transform:'translate(-50%,-26px)'}],{duration:800,easing:'ease-out'});
  setTimeout(()=>f.remove(),820);
}

/* ---------- 1. Tốc độ 60 giây ---------- */
function gmSpeed(el,pool){
  const body=gmStage(el,'speed',`<span class="timer-chip" id="gmT">${ic('timer')}<span>60</span></span><span class="gm-pts num" id="gmP">0</span>`);
  let pts=0,combo=0,maxCombo=0,right=0,wrong=0,cur=null,busy=false,over=false;const missed=[];
  const deck=shuffle(pool);let di=0;
  const mult=()=>combo>=8?4:combo>=5?3:combo>=2?2:1;
  const next=()=>{
    if(over)return;
    const w=deck[di++%deck.length]; const opts=shuffle([w,...gmDistract(w,pool,3)]); cur={w,opts};busy=false;
    body.innerHTML=`<div class="gm-tbar" id="gmBar"><i style="width:${(timer?timer.left():60)/60*100}%"></i></div>
      <div class="gm-sp" id="gmSp"><div class="gm-combo">${combo>=2?`<span class="gm-cb${combo>=5?' hot':''}">${combo} câu liên tiếp, x${mult()}</span>`:''}</div>
        <div class="gm-word en" style="--n:${Math.min(6,Math.ceil(w.w.length/3))}">${esc(w.w)}</div>${w.ipa?`<span class="ipa">${esc(w.ipa)}</span>`:''}</div>
      <div class="gm-opts">${opts.map((o,i)=>`<button class="gm-opt" data-i="${i}"><span class="gm-k">${i+1}</span><span>${esc(gmVi(o))}</span></button>`).join('')}</div>`;
    $$('.gm-opt',body).forEach(b=>b.onclick=()=>choose(+b.dataset.i));
  };
  const choose=i=>{
    if(busy||over||!cur)return;busy=true;const o=cur.opts[i], ok=o===cur.w, btns=$$('.gm-opt',body);
    btns.forEach((b,j)=>{if(cur.opts[j]===cur.w)b.classList.add('right');else if(j===i)b.classList.add('wrong');});
    if(ok){combo++;maxCombo=Math.max(maxCombo,combo);right++;const g=10*mult();pts+=g;gmSfx('ok');gmRight();gmFloat($('#gmSp'),'+'+g,true);}
    else{combo=0;wrong++;missed.push(cur.w);gmSfx('bad');gmWrong(cur.w);gmFloat($('#gmSp'),cur.w.w+': '+gmVi(cur.w),false);}
    $('#gmP').textContent=pts;
    GM_TIMERS.push(setTimeout(next,ok?260:900));
  };
  const keys=e=>{if(current!=='games'||!$('#gmP'))return document.removeEventListener('keydown',keys);if(['1','2','3','4'].includes(e.key))choose(+e.key-1);};
  document.addEventListener('keydown',keys);
  let timer=null;
  timer=makeTimer(60,left=>{const t=$('#gmT');if(t){t.lastElementChild.textContent=left;t.classList.toggle('low',left<=10);}const b=$('#gmBar');if(b){b.classList.toggle('low',left<=10);b.firstElementChild.style.width=left/60*100+'%';}},()=>{
    over=true;document.removeEventListener('keydown',keys);
    const g=gmData(), old=g.best.speed||0, isBest=pts>old; if(isBest){g.best.speed=pts;gmSave();}
    gmEnd(el,'speed',{score:right,total:right+wrong,line:pts+' điểm',isBest,missed,
      best:`<div><b class="num">${right}</b><span class="small muted">câu đúng</span></div><div><b class="num">${maxCombo}</b><span class="small muted">chuỗi dài nhất</span></div><div><b class="num">${Math.max(old,pts)}</b><span class="small muted">kỷ lục</span></div>`});
  });
  GM_TIMERS.push(timer);
  next();
}

/* ---------- 2. Nghe và gõ ---------- */
function gmDict(el,pool){
  const N=10; const list=shuffle(pool.filter(w=>/^[a-z][a-z'-]*$/i.test(w.w))).slice(0,N);
  const body=gmStage(el,'dict',`<span class="num note" id="gmR"></span><span class="gm-pts num" id="gmP">0</span>`);
  let i=0,score=0;const missed=[];
  const draw=()=>{
    if(i>=N){const g=gmData(),old=g.best.dict,isBest=score>0&&(old==null||score>old);if(isBest||old==null){g.best.dict=score;gmSave();}
      return gmEnd(el,'dict',{score,total:N,line:score+'/'+N,isBest,missed,best:`<div><b class="num">${Math.max(old||0,score)}/10</b><span class="small muted">kỷ lục</span></div>`});}
    const w=list[i]; let hint=0, done=false;
    $('#gmR').textContent=(i+1)+'/'+N;
    body.innerHTML=`<div class="bar-track"><i style="width:${i/N*100}%"></i></div>
      <div class="gm-tq"><button class="gm-play" id="gmPlay" aria-label="Nghe lại">${SPK}</button><span class="note">Bấm để nghe lại. Nghe chậm: <button class="lnk" id="gmSlow">${ic('snail')} chậm</button></span></div>
      <div class="gm-hint" id="gmHint"></div>
      <form class="gm-type" id="gmF"><input type="text" id="gmI" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Gõ từ bạn nghe được" aria-label="Gõ từ"><button class="btn primary">Kiểm tra</button></form>
      <div class="row"><button class="btn sm" id="gmHintB">${ic('lightbulb')} Gợi ý</button><button class="btn ghost sm" id="gmSkip">Bỏ qua</button></div>
      <div id="gmFb"></div>`;
    const play=r=>say(w.w,{rate:r});
    $('#gmPlay').onclick=()=>play();$('#gmSlow').onclick=()=>play(0.6);
    $('#gmHintB').onclick=()=>{hint++;$('#gmHint').innerHTML=`${w.ipa?`<span class="ipa">${esc(w.ipa)}</span>`:''}<span>Bắt đầu bằng <b class="en">${esc(w.w[0])}</b>, ${w.w.length} chữ cái</span>${hint>1?`<span class="small muted">${esc(gmVi(w))}</span>`:''}`;};
    const finish=ok=>{
      if(done)return;done=true;$('#gmI').disabled=true;$$('#gmF button,#gmHintB,#gmSkip',body).forEach(b=>b.disabled=true);
      if(ok){score++;gmSfx('ok');gmRight();$('#gmP').textContent=score;}else{missed.push(w);gmSfx('bad');gmWrong(w);}
      $('#gmFb').innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?'Đúng chính tả.':'Chưa đúng.'}</b> <span class="en"><b>${esc(w.w)}</b></span> ${w.ipa?`<span class="ipa">${esc(w.ipa)}</span>`:''} ${esc(gmVi(w))}</div><button class="btn primary" id="gmN" style="margin-top:10px">${i+1<N?'Từ tiếp':'Xem kết quả'} ${ic('chevron-right')}</button>`;
      $('#gmN').onclick=()=>{i++;draw();};$('#gmN').focus();
    };
    $('#gmF').onsubmit=e=>{e.preventDefault();const v=$('#gmI').value.trim();if(!v)return;finish(enFold(v)===enFold(w.w));};
    $('#gmSkip').onclick=()=>finish(false);
    setTimeout(()=>{if($('#gmI'))$('#gmI').focus();},50);
    GM_TIMERS.push(setTimeout(()=>{if($('#gmPlay'))play();},250));
  };
  draw();
}

/* ---------- 3. Điền từ vào câu ---------- */
function gmCloze(el,pool){
  const N=10; const ok=pool.filter(w=>gmBlank(w)); const list=shuffle(ok.length>=N?ok:pool.filter(w=>w.ex)).slice(0,N);
  const body=gmStage(el,'cloze',`<span class="num note" id="gmR"></span><span class="gm-pts num" id="gmP">0</span>`);
  let i=0,score=0;const missed=[];
  const draw=()=>{
    if(i>=N||!list[i]){const g=gmData(),old=g.best.cloze,isBest=score>0&&(old==null||score>old);if(isBest||old==null){g.best.cloze=score;gmSave();}
      return gmEnd(el,'cloze',{score,total:N,line:score+'/'+N,isBest,missed,best:`<div><b class="num">${Math.max(old||0,score)}/10</b><span class="small muted">kỷ lục</span></div>`});}
    const w=list[i], b=gmBlank(w)||{pre:w.ex+' ',hit:w.w,post:''};
    const opts=shuffle([w,...gmDistract(w,pool,3,x=>x.k)]);
    $('#gmR').textContent=(i+1)+'/'+N;
    body.innerHTML=`<div class="bar-track"><i style="width:${i/N*100}%"></i></div>
      <div class="gm-cz"><div class="gm-czvi"><span class="label">Nghĩa</span> ${esc(gmVi(w))}</div>
      <div class="en-s gm-czs">${esc(b.pre)}<span class="gm-gap" id="gmGap">______</span>${esc(b.post)}</div>
      <div class="small muted">${esc(w.exvi||'')}</div></div>
      <div class="gm-opts">${opts.map((o,k)=>`<button class="gm-opt" data-i="${k}"><span class="gm-k">${k+1}</span><span class="en">${esc(o.w)}</span></button>`).join('')}</div>
      <p class="note">Từ trong câu có thể đã được chia (thêm -s, -ed, -ing).</p><div id="gmFb"></div>`;
    let done=false;
    $$('.gm-opt',body).forEach(btn=>btn.onclick=()=>{
      if(done)return;done=true;const k=+btn.dataset.i, good=opts[k]===w;
      $$('.gm-opt',body).forEach((x,j)=>{x.disabled=true;if(opts[j]===w)x.classList.add('right');else if(j===k)x.classList.add('wrong');});
      $('#gmGap').textContent=b.hit;$('#gmGap').classList.add(good?'ok':'bad');
      if(good){score++;gmSfx('ok');gmRight();$('#gmP').textContent=score;}else{missed.push(w);gmSfx('bad');gmWrong(w);}
      $('#gmFb').innerHTML=`<div class="row"><button class="spk" data-say="${esc(w.ex)}" aria-label="Nghe câu">${SPK}</button><button class="btn primary" id="gmN">${i+1<N?'Câu tiếp':'Xem kết quả'} ${ic('chevron-right')}</button></div>`;
      $('#gmN').onclick=()=>{i++;draw();};
    });
  };
  draw();
}

/* ---------- 4. Ghép cặp ---------- */
function gmMatch(el,pool){
  const words=[];const used=new Set();
  for(const w of shuffle(pool)){const v=gmVi(w);if(used.has(v)||used.has(w.k))continue;used.add(v);used.add(w.k);words.push(w);if(words.length>=6)break;}
  const body=gmStage(el,'match',`<span class="timer-chip" id="gmT">${ic('clock')}<span>00:00</span></span><span class="gm-pts num" id="gmP">0/6</span>`);
  const L=shuffle(words), R=shuffle(words);
  body.innerHTML=`<p class="note">Bấm một từ bên trái rồi bấm nghĩa đúng bên phải.</p>
    <div class="gm-mt2"><div class="gm-col">${L.map(w=>`<button class="gm-mc2 en" data-k="${esc(w.k)}" data-s="l">${esc(w.w)}</button>`).join('')}</div>
    <div class="gm-col">${R.map(w=>`<button class="gm-mc2" data-k="${esc(w.k)}" data-s="r">${esc(gmVi(w))}</button>`).join('')}</div></div>`;
  let sel=null,got=0,errs=0,sec=0;const missed=[];const wrongOnce=new Set();
  const iv=setInterval(()=>{sec++;const t=$('#gmT');if(t)t.lastElementChild.textContent=fmtTime(sec);},1000);GM_TIMERS.push(iv);
  $$('.gm-mc2',body).forEach(b=>b.onclick=()=>{
    if(b.classList.contains('ok'))return;
    if(!sel||sel.dataset.s===b.dataset.s){if(sel)sel.classList.remove('sel');sel=b;b.classList.add('sel');if(b.dataset.s==='l')say(VI.get(b.dataset.k).w);return;}
    const a=sel,c=b;sel=null;a.classList.remove('sel');
    if(a.dataset.k===c.dataset.k){
      [a,c].forEach(x=>{x.classList.add('ok');x.disabled=true;});got++;gmSfx('ok');gmRight();$('#gmP').textContent=got+'/6';
      if(got>=words.length){clearInterval(iv);
        const g=gmData(),old=g.best.match,isBest=old==null||sec<old;if(isBest){g.best.match=sec;gmSave();}
        GM_TIMERS.push(setTimeout(()=>gmEnd(el,'match',{score:got,total:words.length,line:fmtTime(sec),isBest,missed,
          best:`<div><b class="num">${errs}</b><span class="small muted">lần ghép sai</span></div><div><b class="num">${fmtTime(isBest?sec:old)}</b><span class="small muted">kỷ lục</span></div>`}),500));}
    }else{
      errs++;gmSfx('bad');const lw=VI.get((a.dataset.s==='l'?a:c).dataset.k);
      if(lw&&!wrongOnce.has(lw.k)){wrongOnce.add(lw.k);missed.push(lw);gmWrong(lw);}
      [a,c].forEach(x=>{x.classList.add('bad');setTimeout(()=>x.classList.remove('bad'),450);});
    }
  });
}
