/* ================= GRAMMAR (Ngữ pháp): points by level 1-4, list + detail + practice ================= */
const GR_LV={1:'Nền tảng, band 5',2:'Band 6-6.5',3:'Band 7+',4:'Chuyên gia, band 8.5-9'};
const GR_LVS=G=>[1,2,3,4].filter(L=>G.some(x=>x.lv===L));
const GR_S={lv:0,q:'',id:null};
function grData(){P.gr=P.gr||{};P.gr.done=P.gr.done||{};return P.gr;}
// lenient compare for "Sửa lỗi": case, spaces, curly quotes, final punctuation
function grNorm(s){return String(s||'').toLowerCase().replace(/[’‘`]/g,"'").replace(/[“”]/g,'"').replace(/\s+([,.;:!?])/g,'$1').replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'').trim();}
function grBlank(s){return esc(s).replace(/_{2,}/g,'<span class="gr-gap">_____</span>');}

VIEWS.grammar=async el=>{
  el.innerHTML='<div class="view"><p class="note">Đang tải ngữ pháp...</p></div>';
  let G;
  try{G=await loadJSON('grammar');}catch(e){el.innerHTML='<div class="view"><p class="note">Không tải được dữ liệu ngữ pháp. Kiểm tra mạng rồi tải lại trang.</p></div>';return;}
  if(GR_S.id&&G.find(x=>x.id===GR_S.id))grDetail(el,G,GR_S.id);else{GR_S.id=null;grList(el,G);}
};

function grList(el,G){
  const d=grData();
  const nDone=G.filter(x=>d.done[x.id]).length;
  el.innerHTML=`<div class="view gr">
    <div class="spread"><h2>Ngữ pháp IELTS</h2><span class="note num">${nDone}/${G.length} điểm đã nắm</span></div>
    <div class="bar-track gr-prog"><i style="width:${Math.round(nDone/G.length*100)}%"></i></div>
    <div class="gr-tools">
      <input type="search" id="grQ" placeholder="Tìm theo tên, tên tiếng Anh hoặc nhóm" value="${esc(GR_S.q)}" aria-label="Tìm điểm ngữ pháp">
      <button class="btn primary" id="grQuick">${ic('zap')} Ôn nhanh 10 câu</button>
    </div>
    ${subTabs('grLv',[['0','Tất cả'],...GR_LVS(G).map(L=>[String(L),GR_LV[L]])],String(GR_S.lv),k=>{GR_S.lv=+k;$$('#grLv [data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===k));draw();})}
    <div id="grBox" class="gr-groups"></div>
  </div>`;
  const draw=()=>{
    const q=viFold(GR_S.q.trim());
    const list=G.filter(x=>(!GR_S.lv||x.lv===GR_S.lv)&&(!q||viFold(x.title+' | '+x.en+' | '+x.cat).includes(q)));
    if(!list.length){$('#grBox').innerHTML='<div class="empty">Không có điểm ngữ pháp nào khớp.</div>';return;}
    $('#grBox').innerHTML=GR_LVS(G).map(L=>{
      const xs=list.filter(x=>x.lv===L);if(!xs.length)return '';
      const dn=xs.filter(x=>d.done[x.id]).length, all=G.filter(x=>x.lv===L);
      return `<section class="gr-sec gr-l${L}"><div class="spread gr-sh"><h3>${GR_LV[L]}</h3><span class="note num">${all.filter(x=>d.done[x.id]).length}/${all.length}</span></div>
        <div class="gr-list">${xs.map(x=>`<button class="gr-row${d.done[x.id]?' done':''}" data-id="${x.id}">
          <span class="check${d.done[x.id]?' on':''}" aria-hidden="true">${d.done[x.id]?ic('check'):''}</span>
          <span class="gr-rt"><b>${esc(x.title)}</b><span class="small muted">${esc(x.en)}</span></span>
          <span class="pill gr-cat${x.lv===4?' gr-p4':''}">${esc(x.cat)}</span></button>`).join('')}</div></section>`;
    }).join('');
    $$('#grBox [data-id]').forEach(b=>b.onclick=()=>{GR_S.id=b.dataset.id;grDetail(el,G,b.dataset.id);window.scrollTo(0,0);});
  };
  let t;$('#grQ').oninput=e=>{GR_S.q=e.target.value;clearTimeout(t);t=setTimeout(draw,120);};
  $('#grQuick').onclick=()=>grQuick(el,G);
  draw();
}

function grQuick(el,G){
  const d=grData();
  let src=G.filter(x=>d.done[x.id]), from='các điểm bạn đã nắm';
  if(src.length<3){src=G.filter(x=>!GR_S.lv||x.lv===GR_S.lv);from=GR_S.lv?'nhóm '+GR_LV[GR_S.lv]:'toàn bộ '+G.length+' điểm';}
  const pool=[];src.forEach(x=>x.quiz.forEach(q=>pool.push({q:q.s,o:q.o,a:q.a,w:q.w,src:'Ngữ pháp: '+x.title})));
  const items=shuffle(pool).slice(0,10);
  el.innerHTML=`<div class="view"><div class="row"><button class="btn ghost sm" id="grBack">${ic('chevron-left')} Danh sách</button></div><div id="grQz"></div></div>`;
  $('#grBack').onclick=()=>grList(el,G);
  runQuiz($('#grQz'),{title:'Ôn nhanh ngữ pháp',items,kind:'review',intro:'10 câu ngẫu nhiên từ '+from+'.'});
}

function grDetail(el,G,id){
  const idx=G.findIndex(x=>x.id===id), x=G[idx], d=grData();
  const prev=G[idx-1], next=G[idx+1];
  const src='Ngữ pháp: '+x.title;
  el.innerHTML=`<div class="view gr gr-d">
    <div class="spread"><button class="btn ghost sm" id="grBack">${ic('chevron-left')} Danh sách</button><span class="note num">${idx+1}/${G.length}</span></div>
    <div class="panel gr-head">
      <div class="row gr-pills"><span class="pill gr-lvp gr-lv${x.lv}">${GR_LV[x.lv]||''}</span><span class="pill gr-cat">${esc(x.cat)}</span>${d.done[x.id]?'<span class="pill gr-ok">Đã nắm</span>':''}</div>
      <h2>${esc(x.title)}</h2><div class="gr-en">${esc(x.en)}</div>
      <div class="formula gr-form">${esc(x.form)}</div>
      <p class="gr-exp">${esc(x.explain)}</p>
    </div>
    <div class="panel"><h3>Ví dụ</h3>
      ${x.ex.map(([en,vi])=>`<div class="gr-ex"><button class="spk" data-say="${esc(en)}" aria-label="Nghe câu">${SPK}</button><div><div class="en-s">${esc(en)}</div><div class="small muted">${esc(vi)}</div></div></div>`).join('')}
    </div>
    <div class="panel"><h3>Lỗi người Việt hay mắc</h3>
      ${x.mistakes.map(([w,r,why])=>`<div class="gr-mk"><div class="gr-wrong"><span class="gr-mi">${ic('x')}</span><s>${esc(w)}</s></div><div class="gr-right"><span class="gr-mi">${ic('check')}</span><span>${esc(r)}</span></div><div class="small muted">${esc(why)}</div></div>`).join('')}
    </div>
    <div class="panel"><h3>Dùng trong IELTS thế nào</h3><p class="gr-exp">${esc(x.ielts)}</p></div>
    <div class="panel"><div class="spread"><h3>Luyện tập</h3><span class="note num" id="grSc"></span></div>
      <div class="gr-qs">${x.quiz.map((q,i)=>`<div class="gq" data-q="${i}"><div class="gr-qs-s"><span class="gr-n">${i+1}</span><span>${grBlank(q.s)}</span></div>
        <div class="opts">${q.o.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="gr-fb"></div></div>`).join('')}</div>
      <h3 class="gr-fixh">Sửa lỗi</h3><p class="note">Mỗi câu có một lỗi. Gõ lại cả câu đã sửa.</p>
      ${x.fix.map((f,i)=>`<div class="gq" data-f="${i}"><div class="gr-qs-s"><span class="gr-n">${x.quiz.length+i+1}</span><span class="en-s">${esc(f.s)}</span></div>
        <form class="gr-fix"><textarea rows="2" autocapitalize="off" spellcheck="false" placeholder="Gõ câu đúng"></textarea><button class="btn primary sm">Kiểm tra</button></form><div class="gr-fb"></div></div>`).join('')}
    </div>
    <div class="panel gr-fin">
      <button class="btn ${d.done[x.id]?'':'primary'}" id="grDone" ${d.done[x.id]?'disabled':''}>${ic('check')} ${d.done[x.id]?'Đã nắm điểm này':'Đánh dấu đã nắm'}</button>
      <div class="gr-nav">
        ${prev?`<button class="btn sm" id="grPrev">${ic('chevron-left')}<span>${esc(prev.title)}</span></button>`:'<span></span>'}
        ${next?`<button class="btn sm" id="grNext"><span>${esc(next.title)}</span>${ic('chevron-right')}</button>`:'<span></span>'}
      </div>
    </div>
  </div>`;
  let right=0,answered=0; const total=x.quiz.length+x.fix.length;
  const sc=()=>{$('#grSc').textContent=answered?`Đúng ${right}/${answered}`:total+' câu';};sc();
  $$('[data-q]',el).forEach(box=>{
    const q=x.quiz[+box.dataset.q];
    $$('.opt',box).forEach(b=>b.onclick=()=>{
      const k=+b.dataset.k, ok=k===q.a;
      $$('.opt',box).forEach((y,j)=>{y.disabled=true;if(j===q.a)y.classList.add('right');else if(j===k)y.classList.add('wrong');});
      const item={q:q.s,o:q.o,a:q.a,w:q.w,src};
      if(ok){right++;window.__mistOk&&window.__mistOk(item);}else window.__mistake&&window.__mistake('q',item);
      answered++;sc();
      $('.gr-fb',box).innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?'Đúng rồi.':'Chưa đúng.'}</b> ${esc(q.w)}</div>`;
    });
  });
  $$('[data-f]',el).forEach(box=>{
    const f=x.fix[+box.dataset.f], ta=$('textarea',box), form=$('form',box);
    ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit?form.requestSubmit():form.onsubmit(e);}};
    form.onsubmit=e=>{
      e.preventDefault(); const v=ta.value; if(!v.trim())return;
      const ok=String(f.a).split('|').some(a=>grNorm(a)===grNorm(v));
      ta.disabled=true;$('button',form).disabled=true;
      const item={q:'Sửa lỗi: '+f.s,a:String(f.a),w:f.w,src};
      if(ok){right++;uiSfx('ok');window.__mistOk&&window.__mistOk(item);}else{uiSfx('bad');window.__mistake&&window.__mistake('q',item);}
      answered++;sc();
      $('.gr-fb',box).innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?'Chính xác.':'Chưa khớp.'}</b> Câu đúng: <span class="en-s gr-ans">${esc(String(f.a).split('|')[0])}</span><br>${esc(f.w)}</div>`;
    };
  });
  $('#grBack').onclick=()=>{GR_S.id=null;grList(el,G);window.scrollTo(0,0);};
  const nav=y=>{GR_S.id=y.id;grDetail(el,G,y.id);window.scrollTo(0,0);};
  if(prev)$('#grPrev').onclick=()=>nav(prev);
  if(next)$('#grNext').onclick=()=>nav(next);
  $('#grDone').onclick=e=>{
    if(d.done[x.id])return;
    d.done[x.id]=Date.now(); touch('main'); award('grammar',1);
    const b=e.currentTarget;b.disabled=true;b.classList.remove('primary');b.innerHTML=ic('check')+' Đã nắm điểm này';
    const pills=$('.gr-pills',el);if(pills&&!$('.gr-ok',pills))pills.insertAdjacentHTML('beforeend','<span class="pill gr-ok">Đã nắm</span>');
    toast(next?'Đã lưu. Sang điểm tiếp theo khi bạn sẵn sàng.':'Đã lưu.');
  };
}
