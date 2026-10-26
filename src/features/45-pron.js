/* ================= PRONUNCIATION (Phát âm): IPA chart, minimal pairs, rules, speaking practice ================= */
const PR_S={tab:'ipa',mp:null,spSrc:'',spIdx:0};
const PR_TYPES=[['vowel','Nguyên âm đơn'],['diphthong','Nguyên âm đôi'],['consonant','Phụ âm']];
function prData(){P.pr=P.pr||{};P.pr.seen=P.pr.seen||{};P.pr.best=P.pr.best||{};return P.pr;}
const prSay=(w,o)=>say(w,Object.assign({lang:'en-GB'},o||{}));
const prSlash=s=>/^\//.test(s)?s:'/'+s+'/';
// say several words in a row; stops if anything else starts speaking meanwhile
async function prSayList(words){for(const w of words){const p=prSay(w);const t=sayToken;await p;if(sayToken!==t)return;await new Promise(r=>setTimeout(r,180));if(sayToken!==t)return;}}

VIEWS.pron=async el=>{
  el.innerHTML='<div class="view"><p class="note">Đang tải phần phát âm...</p></div>';
  let D;
  try{D=await loadJSON('pron');}catch(e){el.innerHTML='<div class="view"><p class="note">Không tải được dữ liệu phát âm. Kiểm tra mạng rồi tải lại trang.</p></div>';return;}
  el.innerHTML=`<div class="view pr">
    <div class="spread"><h2>Phát âm</h2><span class="note num" id="prSeen"></span></div>
    ${subTabs('prTabs',[['ipa','Bảng âm IPA'],['mp','Cặp tối thiểu'],['rules','Quy tắc'],['speak','Luyện nói']],PR_S.tab,k=>{PR_S.tab=k;$$('#prTabs [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===k));prDraw(D);})}
    <div id="prBox" class="pr-box"></div></div>`;
  prDraw(D);
};
function prDraw(D){
  stopSay(); if(window.__prStop){window.__prStop();window.__prStop=null;}
  const box=$('#prBox');if(!box)return;
  const s=$('#prSeen');if(s)s.textContent=Object.keys(prData().seen).length+'/'+D.sounds.length+' âm đã xem';
  ({ipa:prIPA,mp:prMP,rules:prRules,speak:prSpeak}[PR_S.tab]||prIPA)(box,D);
  window.__leave=()=>{if(window.__prStop){window.__prStop();window.__prStop=null;}};
}

/* ---------- IPA chart ---------- */
function prIPA(box,D){
  const seen=prData().seen;
  box.innerHTML=`<p class="note">Bấm vào một âm để nghe từ ví dụ và xem cách đặt miệng, lưỡi. Âm đã xem có dấu chấm xanh.</p>
    ${PR_TYPES.map(([t,label])=>{const xs=D.sounds.filter(x=>x.type===t);return `<section class="pr-sec"><h3>${label} <span class="note num">${xs.length}</span></h3>
      <div class="pr-tiles">${xs.map(x=>`<button class="pr-tile${seen[x.ipa]?' seen':''}" data-ipa="${esc(x.ipa)}"><span class="pr-sym">${esc(prSlash(x.ipa))}</span><span class="pr-tw">${esc(x.ex[0]||'')}</span></button>`).join('')}</div></section>`;}).join('')}`;
  $$('[data-ipa]',box).forEach(b=>b.onclick=()=>{const x=D.sounds.find(y=>y.ipa===b.dataset.ipa);prSound(x,D);b.classList.add('seen');});
}
function prSound(x,D){
  const d=prData();
  if(!d.seen[x.ipa]){d.seen[x.ipa]=Date.now();touch('main');award('pron',1);const s=$('#prSeen');if(s)s.textContent=Object.keys(d.seen).length+'/'+D.sounds.length+' âm đã xem';}
  const mp=D.minimal.filter(m=>m.contrast.includes(prSlash(x.ipa)));
  const m=modal(`<div class="pr-mh"><span class="pr-big">${esc(prSlash(x.ipa))}</span><div><h2>${esc(x.name)}</h2><span class="pill">${esc((PR_TYPES.find(t=>t[0]===x.type)||[,''])[1])}</span></div></div>
    <div class="pr-words">${x.ex.map(w=>`<button class="pr-word" data-say="${esc(w)}" data-lang="en-GB">${SPK}<span>${esc(w)}</span></button>`).join('')}</div>
    <div><span class="label">Cách phát âm</span><p class="pr-p">${esc(x.how)}</p></div>
    ${x.vn?`<div class="vn"><b>Người Việt hay gặp:</b> ${esc(x.vn)}</div>`:''}
    ${x.pairs&&x.pairs.length?`<div><span class="label">Cặp dễ nhầm</span><div class="pr-pairs">${x.pairs.map(([a,b])=>`<div class="pr-pair"><button class="lnk" data-say="${esc(a)}" data-lang="en-GB">${esc(a)}</button><span class="muted">vs</span><button class="lnk" data-say="${esc(b)}" data-lang="en-GB">${esc(b)}</button><button class="spk sm" data-both="${esc(a)}|${esc(b)}" aria-label="Nghe cả hai">${SPK}</button></div>`).join('')}</div></div>`:''}
    <div class="row">${mp.length?`<button class="btn sm primary" id="prGoMp">Chơi cặp tối thiểu ${esc(mp[0].contrast)}</button>`:''}<button class="btn sm" id="prGoSp">${ic('mic')} Luyện nói âm này</button></div>`);
  $$('[data-both]',m.el).forEach(b=>b.onclick=()=>prSayList(b.dataset.both.split('|')));
  const g=$('#prGoMp',m.el);if(g)g.onclick=()=>{m.close();PR_S.tab='mp';PR_S.mp=mp[0].id;prTabSync();prDraw(D);};
  $('#prGoSp',m.el).onclick=()=>{m.close();PR_S.tab='speak';PR_S.spSrc='s:'+x.ipa;PR_S.spIdx=0;prTabSync();prDraw(D);};
  prSayList(x.ex);
}
function prTabSync(){$$('#prTabs [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===PR_S.tab));}

/* ---------- minimal pairs ---------- */
function prMP(box,D){
  const set=PR_S.mp&&D.minimal.find(m=>m.id===PR_S.mp);
  if(!set){
    const best=prData().best;
    box.innerHTML=`<p class="note">Chọn một cặp âm. App đọc một từ, bạn bấm từ mình nghe được. 10 lượt mỗi ván.</p>
      <div class="pr-sets">${D.minimal.map(m=>`<button class="pr-set" data-mp="${esc(m.id)}"><b>${esc(m.contrast)}</b><span class="small muted">${esc(m.pairs.slice(0,2).map(p=>p.join(' / ')).join(', '))}</span>${best[m.id]!=null?`<span class="pill">${best[m.id]}/10</span>`:''}</button>`).join('')}</div>`;
    $$('[data-mp]',box).forEach(b=>b.onclick=()=>{PR_S.mp=b.dataset.mp;prMP(box,D);});
    return;
  }
  const N=10; let round=0,score=0,cur=null,locked=false;
  const order=[];while(order.length<N)order.push(...shuffle(set.pairs));
  const draw=()=>{
    if(round>=N){
      const d=prData();const old=d.best[set.id];if(old==null||score>old){d.best[set.id]=score;touch('main');}
      if(typeof gmSfx==='function')gmSfx('end');
      box.innerHTML=`<div class="panel pr-end">${mcSay(score>=8?'yay':score>=5?'ok':'hmm',`<b>Đúng ${score}/${N}</b><br>${score>=8?'Tai bạn phân biệt tốt cặp này.':score>=5?'Khá rồi, chơi thêm một ván cho chắc.':'Cặp này khó. Bấm "Nghe cả hai" nhiều lần để quen.'}`,72)}
        <div class="small muted">Kỷ lục cặp này: ${d.best[set.id]}/${N}</div>
        <div class="row"><button class="btn primary" id="prAgain">${ic('rotate-ccw')} Chơi lại</button><button class="btn" id="prSets">Chọn cặp khác</button></div></div>`;
      $('#prAgain').onclick=()=>prMP(box,D);$('#prSets').onclick=()=>{PR_S.mp=null;prMP(box,D);};
      return;
    }
    const pair=order[round], k=Math.random()<.5?0:1; cur={pair,k}; locked=false;
    box.innerHTML=`<div class="panel pr-game">
      <div class="spread"><button class="btn ghost sm" id="prSets">${ic('chevron-left')} Các cặp</button><b class="pr-con">${esc(set.contrast)}</b><span class="num note">${round+1}/${N} · đúng ${score}</span></div>
      <div class="bar-track"><i style="width:${round/N*100}%"></i></div>
      <div class="pr-play"><button class="gm-play" id="prRep" aria-label="Nghe lại">${SPK}</button><span class="note">Bạn nghe thấy từ nào?</span></div>
      <div class="pr-choice">${pair.map((w,i)=>`<button class="opt pr-ch" data-i="${i}">${esc(w)}</button>`).join('')}</div>
      <div id="prFb" class="pr-fb"></div>
      <div class="row pr-ctl"><button class="btn sm" id="prBoth">${ic('repeat')} Nghe cả hai</button></div></div>`;
    $('#prSets').onclick=()=>{PR_S.mp=null;prMP(box,D);};
    $('#prRep').onclick=()=>prSay(pair[k]);
    $('#prBoth').onclick=()=>prSayList(pair);
    $$('.pr-ch',box).forEach(b=>b.onclick=()=>{
      if(locked)return;locked=true;const i=+b.dataset.i, ok=i===k;
      $$('.pr-ch',box).forEach((y,j)=>{y.disabled=true;if(j===k)y.classList.add('right');else if(j===i)y.classList.add('wrong');});
      if(ok){score++;award('pron',1);}
      $('#prFb').innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?'Đúng rồi.':'Chưa đúng.'}</b> Từ được đọc là <b>${esc(pair[k])}</b>.</div><button class="btn primary" id="prNext">${round+1<N?'Lượt tiếp':'Xem kết quả'} ${ic('chevron-right')}</button>`;
      $('#prNext').onclick=()=>{round++;draw();};$('#prNext').focus();
    });
    setTimeout(()=>{if(cur&&cur.pair===pair)prSay(pair[k]);},250);
  };
  draw();
}

/* ---------- rules ---------- */
function prRules(box,D){
  box.innerHTML=`<p class="note">15 quy tắc phát âm người Việt hay sai nhất. Mở từng quy tắc, nghe ví dụ rồi làm câu hỏi nhỏ.</p>
    <div class="pr-rules">${D.rules.map((r,i)=>`<details class="g" data-r="${i}"><summary><span class="pr-rn num">${i+1}</span><span class="t">${esc(r.title)}</span>${ic('chevron-right','pr-chev')}</summary><div class="body"></div></details>`).join('')}</div>`;
  $$('details[data-r]',box).forEach(dt=>dt.addEventListener('toggle',()=>{
    if(!dt.open||dt.dataset.on)return;dt.dataset.on=1;
    const r=D.rules[+dt.dataset.r], body=$('.body',dt);
    body.innerHTML=`<div class="pr-body">${esc(r.body)}</div>
      ${r.examples&&r.examples.length?`<div><span class="label">Ví dụ</span><div class="pr-exs">${r.examples.map(([w,n])=>`<button class="pr-exb" data-say="${esc(w)}" data-lang="en-GB">${SPK}<span><b>${esc(w)}</b>${n?` <span class="ipa">${esc(n)}</span>`:''}</span></button>`).join('')}</div></div>`:''}
      ${(r.quiz||[]).map((q,qi)=>`<div class="gq" data-q="${qi}"><div class="pr-q">${esc(q.q)}</div><div class="opts">${q.o.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="pr-qf"></div></div>`).join('')}`;
    $$('[data-q]',body).forEach(qb=>{const q=r.quiz[+qb.dataset.q];
      $$('.opt',qb).forEach(b=>b.onclick=()=>{const k=+b.dataset.k, ok=k===q.a;
        $$('.opt',qb).forEach((y,j)=>{y.disabled=true;if(j===q.a)y.classList.add('right');else if(j===k)y.classList.add('wrong');});
        const item={q:q.q,o:q.o,a:q.a,w:q.w,src:'Phát âm: '+r.title};
        if(ok){award('pron',1);window.__mistOk&&window.__mistOk(item);}else window.__mistake&&window.__mistake('q',item);
        $('.pr-qf',qb).innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?'Đúng rồi.':'Chưa đúng.'}</b> ${esc(q.w||'')}</div>`;});});
  }));
}

/* ---------- speaking practice ---------- */
function prSpeak(box,D){
  const srcs=[...D.sounds.map(s=>['s:'+s.ipa,'Âm '+prSlash(s.ipa)+' ('+s.ex[0]+')',s.ex.concat(...(s.pairs||[]))]),...D.minimal.map(m=>['m:'+m.id,'Cặp '+m.contrast,[].concat(...m.pairs)])];
  if(!srcs.find(s=>s[0]===PR_S.spSrc))PR_S.spSrc=srcs[0][0];
  const src=srcs.find(s=>s[0]===PR_S.spSrc), words=[...new Set(src[2].map(w=>String(w).trim()).filter(Boolean))];
  if(PR_S.spIdx>=words.length)PR_S.spIdx=0;
  const word=words[PR_S.spIdx];
  const hasSR=canListen();
  box.innerHTML=`<div class="panel pr-sp">
    <label class="label" for="prSrc">Luyện theo</label>
    <select id="prSrc">${['s','m'].map(g=>`<optgroup label="${g==='s'?'Theo âm':'Theo cặp tối thiểu'}">${srcs.filter(s=>s[0][0]===g).map(s=>`<option value="${esc(s[0])}" ${s[0]===PR_S.spSrc?'selected':''}>${esc(s[1])}</option>`).join('')}</optgroup>`).join('')}</select>
    <div class="pr-wchips">${words.map((w,i)=>`<button class="chip" data-wi="${i}" aria-pressed="${i===PR_S.spIdx}">${esc(w)}</button>`).join('')}</div>
    <div class="pr-target"><div class="pr-tw2 en">${esc(word)}</div><button class="spk" id="prHear" aria-label="Nghe mẫu">${SPK}</button></div>
    <div class="pr-micw"><button class="micbtn" id="prMic" aria-label="Bấm để nói" ${hasSR?'':'disabled'}><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg></button>
      <span class="note" id="prMicT">${hasSR?'Nghe mẫu, rồi bấm micro và đọc từ này':''}</span></div>
    <div id="prRes" class="pr-res">${hasSR?'':'<div class="fb bad">Máy này chưa ghi âm được. Đăng nhập (hoặc nhập mã mời) và cho phép micro để luyện nói.</div>'}</div>
    <div class="row pr-spnav"><button class="btn sm" id="prPrevW">${ic('chevron-left')} Từ trước</button><button class="btn sm" id="prNextW">Từ tiếp ${ic('chevron-right')}</button></div>
  </div>`;
  $('#prSrc').onchange=e=>{PR_S.spSrc=e.target.value;PR_S.spIdx=0;prSpeak(box,D);};
  $$('[data-wi]',box).forEach(b=>b.onclick=()=>{PR_S.spIdx=+b.dataset.wi;prSpeak(box,D);});
  $('#prHear').onclick=()=>prSay(word);
  $('#prPrevW').onclick=()=>{PR_S.spIdx=(PR_S.spIdx-1+words.length)%words.length;prSpeak(box,D);};
  $('#prNextW').onclick=()=>{PR_S.spIdx=(PR_S.spIdx+1)%words.length;prSpeak(box,D);};
  let rec=null;
  const mic=$('#prMic'), t=$('#prMicT');
  const stop=()=>{if(rec){const w=rec.whisper;rec.stop();rec=null;if(w)t.textContent='Đang chuyển thành chữ...';}mic.classList.remove('on');};
  window.__prStop=stop;
  mic.onclick=()=>{
    if(rec){stop();return;}
    stopSay();
    let heard='';
    rec=listen({lang:'en-GB',continuous:false,onText:(x)=>{heard=x;t.textContent=x?'Đang nghe: '+x:'Đang nghe...';},onEnd:(fin)=>{
      rec=null;mic.classList.remove('on');t.textContent='Bấm micro để thử lại';
      const said=enFold(fin||heard), target=enFold(word);
      const res=$('#prRes');if(!res)return;
      if(!said){res.innerHTML='<div class="fb bad">Máy chưa nghe thấy gì. Kiểm tra micro rồi nói to, rõ hơn.</div>';return;}
      const ok=said===target||said.split(' ').includes(target)||(' '+said+' ').includes(' '+target+' ');
      if(ok){award('pron',1);uiSfx('ok');}else uiSfx('bad');
      res.innerHTML=`<div class="pr-heard ${ok?'ok':'retry'}"><span class="pr-hi">${ok?ic('check'):ic('rotate-ccw')}</span><div><div>Máy nghe thấy: <b>${esc(fin||heard)}</b></div><div class="small">${ok?'Chuẩn rồi. Sang từ tiếp nhé.':'Chưa khớp với <b>'+esc(word)+'</b>. Nghe mẫu rồi thử lại.'}</div></div></div>`;
    }});
    if(!rec){$('#prRes').innerHTML='<div class="fb bad">Máy này chưa ghi âm được. Đăng nhập (hoặc nhập mã mời) và cho phép micro để luyện nói.</div>';return;}
    mic.classList.add('on');t.textContent=rec.whisper?'Đang ghi âm, đọc xong dừng một chút là app tự chấm':'Đang nghe...';$('#prRes').innerHTML='';
  };
}
