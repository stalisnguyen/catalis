/* ================= READING (RD_*) ================= */
let RD_type=null;
const RD_NOTES={practice:'Đồng hồ đếm lên để bạn biết mình mất bao lâu, không giới hạn thời gian.',exam:'Mỗi passage 20 phút, cả đề 60 phút. Hết giờ bài tự nộp.'};
const RD_TN={academic:'Academic',general:'General Training'};

VIEWS.read=async el=>{
  window.__leave=TS_clean;TS_clean();
  el.innerHTML='<div class="view"><p class="note">Đang tải bài đọc...</p></div>';
  let R;try{R=await loadJSON('reading');}catch(e){el.innerHTML='<div class="view"><p class="note">Không tải được bài đọc. Kiểm tra mạng rồi thử lại.</p></div>';return;}
  P.rd=P.rd||{};P.rd.best=P.rd.best||{};
  RD_home(el,R);
};
function RD_home(el,R){
  TS_clean();window.__leave=TS_clean;
  const type=RD_type||examType(), mode=P.rd.mode||'practice', full=P.rd.full||{};
  const tabs=[examType(),examType()==='academic'?'general':'academic'];
  const list=R.filter(p=>p.type===type), tests=[...new Set(list.map(p=>p.test))].sort((a,b)=>a-b);
  const isX=t=>RD_isXT(R,type,t);
  const sec=t=>{const ps=list.filter(p=>p.test===t).sort((a,b)=>a.section-b.section), n=ps.reduce((s,p)=>s+TS_count(p.groups),0), x=isX(t);
    return `<section class="ts-test${x?' ts-xt':''}"><div class="spread"><h3>${type==='general'?'General Training':'Academic'} Test ${t}</h3><button class="btn sm" data-full="${t}">${ic('book-open')}Làm cả đề ${n} câu${full[type+t]!=null?` <span class="ts-best">${full[type+t]}/${n}</span>`:''}</button></div>
      <div class="ts-cards">${ps.map(p=>{const c=TS_count(p.groups),b=P.rd.best[p.id];
        return `<button class="ts-card" data-id="${p.id}"><span class="ts-card-h"><span class="pill">${type==='general'?'Section':'Passage'} ${p.section}</span>${x?TS_XPILL:''}<span class="small muted num">${c} câu · band ${esc(p.band)}</span>${b!=null?`<span class="ts-best">${b}/${c}</span>`:''}</span><span class="t">${esc(p.title)}</span><span class="s">${esc(p.topic)}</span></button>`;}).join('')}</div></section>`;};
  const xs=tests.filter(isX);
  el.innerHTML=`<div class="view"><div class="spread"><h2>Reading</h2><span class="note">${tests.length} đề, ${list.length} bài ${RD_TN[type]}</span></div>
    ${subTabs('rdTabs',tabs.map(t=>[t,RD_TN[t]+(t===examType()?' (dạng bạn thi)':'')]),type,t=>{RD_type=t;RD_home(el,R);})}
    ${TS_modeHTML(mode,RD_NOTES)}
    ${tests.filter(t=>!isX(t)).map(sec).join('')}${xs.length?TS_xHead(RD_XNOTE)+xs.map(sec).join(''):''}</div>`;
  TS_bindMode(el,P.rd,RD_NOTES);
  $$('[data-id]',el).forEach(b=>b.onclick=()=>{const p=R.find(x=>x.id===b.dataset.id);RD_run(el,{passages:[p],exam:(P.rd.mode||'practice')==='exam',title:RD_title(p)});});
  $$('[data-full]',el).forEach(b=>b.onclick=()=>TS_readTest(el,+b.dataset.full,type,{exam:(P.rd.mode||'practice')==='exam'}));
}
const RD_title=p=>`${p.type==='general'?'GT':'Academic'} Test ${p.test} ${p.type==='general'?'Section':'Passage'} ${p.section}`;

function RD_run(el,o){
  TS_clean();window.scrollTo(0,0);
  const {passages,exam=false,title,onDone,nextLabel,mock=false}=o;
  const onExit=o.onExit||(()=>go('read'));
  const multi=passages.length>1, A={};
  let start=1;
  const secs=passages.map(p=>{const s={sid:p.id,src:RD_title(p),groups:p.groups,start:multi?start:1,paras:p.paras.map(x=>x[0]),p};start+=TS_count(p.groups);return s;});
  const total=secs.reduce((s,x)=>s+TS_count(x.groups),0);
  const limit=exam?(multi?60:20*passages.length)*60:0;
  let cp=0,sub=false,results=null,tm=null,el0=Date.now(),mob='p';
  const word=multi?'':'';
  el.innerHTML=`<div class="view rd-run">
    ${TS_barHTML(title,`${multi?`<div class="row tabs rd-ps" id="rdPs">${passages.map((p,i)=>`<button class="chip" data-ps="${i}" aria-pressed="${i===0}">${p.type==='general'?'Section':'Passage'} ${p.section}</button>`).join('')}</div>`:''}
      <div class="rd-mob" role="tablist"><button class="chip" data-mob="p" aria-pressed="true">${ic('book-open')}Bài đọc</button><button class="chip" data-mob="q" aria-pressed="false">${ic('pen-line')}Câu hỏi <span class="num" id="rdQc"></span></button></div>`)}
    <div id="rdRes"></div>
    <div class="rd-split" data-mob="p"><article class="rd-col rd-pass" id="rdPass"></article><section class="rd-col rd-qs" id="rdQs"></section></div>
    <div id="rdVocab"></div></div>`;
  const pass=$('#rdPass',el), qs=$('#rdQs',el), split=$('.rd-split',el);
  const cnt=()=>{const a=TS_answered(A);const c=$('#tsCnt',el);if(c)c.textContent=sub?'Đã nộp bài':`Đã làm ${a}/${total} câu`;const q=$('#rdQc',el);if(q)q.textContent=sub?'':`${a}/${total}`;};
  const draw=()=>{
    const s=secs[cp],p=s.p,n=TS_count(s.groups);
    pass.innerHTML=`<div class="rd-ph"><span class="label">${p.type==='general'?'Section':'Reading Passage'} ${p.section}${multi?'':''}</span><h3 class="rd-title en">${esc(p.title)}</h3><span class="small muted">${esc(p.topic)}</span></div>
      ${p.paras.map(([l,t])=>`<p class="rd-p en-s" data-para="${esc(l)}"><b class="rd-l">${esc(l)}</b>${esc(t)}</p>`).join('')}`;
    qs.innerHTML=`<div class="spread"><h3>Câu ${s.start}-${s.start+n-1}</h3><span class="small muted">${esc(p.title)}</span></div>${TS_qHTML(s,A)}${!sub?`<button class="btn primary rd-subq" id="rdSub2">Nộp bài</button>`:''}`;
    if(results)TS_applyMarks(qs,results.filter(r=>r.sec===s),{onPara:showPara});
    const s2=$('#rdSub2',qs);if(s2)s2.onclick=()=>$('#tsSub',el).click();
    $$('#rdPs [data-ps]',el).forEach(b=>b.setAttribute('aria-pressed',+b.dataset.ps===cp));
    pass.scrollTop=0;qs.scrollTop=0;
  };
  const setMob=m=>{mob=m;split.dataset.mob=m;$$('.rd-mob [data-mob]',el).forEach(b=>b.setAttribute('aria-pressed',b.dataset.mob===m));};
  $$('.rd-mob [data-mob]',el).forEach(b=>b.onclick=()=>{setMob(b.dataset.mob);window.scrollTo({top:0});});
  $$('#rdPs [data-ps]',el).forEach(b=>b.onclick=()=>{cp=+b.dataset.ps;draw();});
  function showPara(sid,l){
    const i=secs.findIndex(s=>s.sid===sid);if(i>=0&&i!==cp){cp=i;draw();}
    setMob('p');
    const pe=$(`.rd-p[data-para="${CSS.escape(l)}"]`,pass);if(!pe)return;
    const desk=getComputedStyle(pass).overflowY==='auto';
    if(desk){alignSplit();pass.scrollTo({top:pe.offsetTop-pass.offsetTop-12,behavior:'smooth'});}else pe.scrollIntoView({behavior:'smooth',block:'center'});
    pe.classList.remove('rd-hl');void pe.offsetWidth;pe.classList.add('rd-hl');
  }
  function alignSplit(){const bar=$('.ts-bar',el).getBoundingClientRect();window.scrollTo({top:window.scrollY+split.getBoundingClientRect().top-bar.bottom-10,behavior:'smooth'});}
  TS_bind(qs,A,cnt);
  /* timer */
  const tmc=$('#tsTm',el);tmc.hidden=false;
  if(exam){tm=makeTimer(limit,l=>{$('#tsTmT',el).textContent=fmtTime(l);tmc.classList.toggle('low',l<=120);if(l===300)toast('Còn 5 phút.');},()=>{toast('Hết giờ. Bài đã được nộp.');submit();});}
  else{const id=setInterval(()=>{$('#tsTmT',el).textContent=fmtTime((Date.now()-el0)/1000);},1000);tm={stop(){clearInterval(id);}};$('#tsTmT',el).textContent='00:00';}
  TS_onClean(()=>{tm&&tm.stop();RD_bubble(null);});
  TS_exitBtn($('#tsBack',el),()=>TS_answered(A)>0&&!sub,onExit);
  $('#tsSub',el).onclick=()=>{const b=$('#tsSub',el);const left=total-TS_answered(A);
    if(!sub&&left>0&&!b.dataset.arm){b.dataset.arm=1;setTimeout(()=>{delete b.dataset.arm;},4000);toast(`Còn ${left} câu chưa làm. Bấm Nộp bài lần nữa để nộp.`);return;}submit();};
  /* look up a selected word */
  const onSel=()=>setTimeout(()=>{
    const s=window.getSelection();const t=s&&String(s).trim();
    if(!t||t.length>40||!pass.contains(s.anchorNode)){RD_bubble(null);return;}
    const w=RD_lookup(t);if(!w){RD_bubble(null);return;}
    const r=s.getRangeAt(0).getBoundingClientRect();RD_bubble(w,r);
  },10);
  pass.addEventListener('mouseup',onSel);pass.addEventListener('touchend',onSel);pass.addEventListener('scroll',()=>RD_bubble(null));

  function submit(){
    if(sub)return;sub=true;tm&&tm.stop();
    const secsUsed=Math.round((Date.now()-el0)/1000);
    results=secs.flatMap(s=>TS_mark(s,A));
    const raw=results.filter(r=>r.ok).length, type=passages[0].type, band=bandOf('reading',raw,total,type);
    P.rd=P.rd||{};P.rd.best=P.rd.best||{};
    secs.forEach(s=>{const r=results.filter(x=>x.sec===s&&x.ok).length;P.rd.best[s.sid]=Math.max(P.rd.best[s.sid]??-1,r);});
    if(multi){P.rd.full=P.rd.full||{};const k=type+passages[0].test;P.rd.full[k]=Math.max(P.rd.full[k]??-1,raw);}
    TS_log(results);
    award('read',total);if(multi&&!mock)award('test',1);
    recordScore({skill:'reading',band,raw,total,id:multi?type[0]+'t'+passages[0].test:passages[0].id,title,exam:type});
    touch('main');
    $('#tsSub',el).hidden=true;tmc.hidden=true;cnt();
    const btns=onDone?`<button class="btn primary" id="rdNextSec">${esc(nextLabel||'Tiếp tục')} ${ic('chevron-right')}</button>`
      :`<button class="btn primary" id="rdAgain">${ic('rotate-ccw')}Làm lại</button><button class="btn" id="rdList">Về danh sách</button>`;
    $('#rdRes',el).innerHTML=TS_resHTML({raw,total,band,label:title+' · '+fmtTime(secsUsed),results,buttons:btns});
    const nb=$('#rdNextSec',el);if(nb)nb.onclick=()=>{TS_clean();onDone(raw,total);};
    const ag=$('#rdAgain',el);if(ag)ag.onclick=()=>RD_run(el,o);
    const li=$('#rdList',el);if(li)li.onclick=()=>{TS_clean();onExit();};
    $$('[data-go]',$('#rdRes',el)).forEach(b=>b.onclick=()=>{const r=results.find(x=>x.k===b.dataset.go);const i=secs.indexOf(r.sec);if(i!==cp){cp=i;draw();}setMob('q');
      const it=$(`[data-item="${r.k}"]`,qs);if(!it)return;
      if(getComputedStyle(qs).overflowY==='auto'){alignSplit();qs.scrollTo({top:it.offsetTop-qs.offsetTop-12,behavior:'smooth'});}else it.scrollIntoView({behavior:'smooth',block:'center'});
      it.classList.remove('ts-flash');void it.offsetWidth;it.classList.add('ts-flash');});
    draw();
    const voc=passages.filter(p=>p.vocab&&p.vocab.length);
    $('#rdVocab',el).innerHTML=voc.length?`<div class="panel"><h3>Từ vựng trong bài</h3>${voc.map(p=>`${multi?`<div class="label">${esc(p.title)}</div>`:''}<div class="rd-voc">${p.vocab.map(([en,vi])=>`<div class="rd-vw"><button class="spk sm" data-say="${esc(en)}" aria-label="Nghe">${SPK}</button><div><b class="en">${esc(en)}</b><div class="small muted">${esc(vi)}</div></div></div>`).join('')}</div>`).join('')}</div>`:'';
    window.scrollTo({top:0,behavior:'smooth'});
  }
  draw();cnt();
}
function RD_lookup(t){
  const w=t.toLowerCase().replace(/[’]/g,"'").replace(/^[^a-z]+|[^a-z]+$/g,'');if(!w||typeof VI==='undefined')return null;
  const c=[w,w.replace(/'s$/,''),w.replace(/s$/,''),w.replace(/es$/,''),w.replace(/ies$/,'y'),w.replace(/ed$/,''),w.replace(/ed$/,'e'),w.replace(/d$/,''),w.replace(/ing$/,''),w.replace(/ing$/,'e'),w.replace(/ly$/,''),w.replace(/([a-z])\1(ed|ing)$/,'$1')];
  for(const k of c){const x=VI.get(k);if(x)return x;}return null;
}
function RD_bubble(w,r){
  let b=document.getElementById('rdBub');
  if(!w){if(b)b.remove();return;}
  if(!b){b=document.createElement('button');b.id='rdBub';b.className='rd-bub';document.body.appendChild(b);}
  b.innerHTML=`${ic('search')}Tra từ <b>${esc(w.w)}</b>`;
  const x=Math.min(window.innerWidth-16,Math.max(16,r.left+r.width/2));
  b.style.left=x+'px';b.style.top=Math.max(8,r.top-48)+'px';
  b.onmousedown=e=>e.preventDefault();
  b.onclick=()=>{b.remove();openWord(w.k);};
}

/* exported for the mock test: 3 passages as one 60-minute 40-question exam */
async function TS_readTest(el,testNo,type,opts={}){
  const R=await loadJSON('reading');type=type||examType();
  const ps=R.filter(p=>p.type===type&&p.test===testNo).sort((a,b)=>a.section-b.section);
  if(!ps.length){toast('Không tìm thấy đề Reading này.');return;}
  RD_run(el,Object.assign({title:`Reading ${type==='general'?'General Training':'Academic'} Test ${testNo}`},opts,{passages:ps,exam:opts.exam!==false}));
}
window.TS_readTest=TS_readTest;
