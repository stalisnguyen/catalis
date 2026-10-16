/* ================= THI THỬ (TS_ views) ================= */
const TS_SK=[['listening','Listening','headphones','khoảng 30 phút, 40 câu'],['reading','Reading','book-open','60 phút, 40 câu'],['writing','Writing','pen-line','60 phút, Task 1 và Task 2'],['speaking','Speaking','mic','11 đến 14 phút, 3 phần']];
let TS_M=null;
const TS_rdN=(n,type)=>{const c=type==='general'?2:4;return ((n-1)%c)+1;};

VIEWS.test=el=>{
  window.__leave=TS_clean;TS_clean();
  if(TS_M&&TS_M.step<4){TS_break(el);return;}
  TS_home(el);
};
function TS_home(el){
  TS_clean();window.__leave=TS_clean;
  const type=examType(), hasW=typeof window.WR_exam==='function', hasS=typeof window.SP_exam==='function';
  const nRd=type==='general'?2:4;
  P.ts=P.ts||{};const last=P.ts.n||1;
  const hist=(P.scores||[]).filter(s=>s.skill==='overall'||(s.total>=40)||((s.skill==='writing'||s.skill==='speaking')&&/thi/i.test(s.title||''))).slice(-20).reverse();
  const skn={listening:'Listening',reading:'Reading',writing:'Writing',speaking:'Speaking',overall:'Overall'};
  el.innerHTML=`<div class="view"><div class="spread"><h2>Thi thử</h2><span class="note">Dạng ${type==='general'?'General Training':'Academic'}</span></div>
    <div class="panel ts-mock">
      <div class="ts-mock-h">${typeof mascot==='function'?mascot('idea',64):''}<div><h3>Đề thi thử đầy đủ</h3><p class="note">Làm lần lượt bốn kỹ năng như ngày thi thật, có giờ cho từng phần. Giữa các phần được nghỉ, phần nào chưa muốn làm thì bỏ qua. Cuối cùng app tính band Overall.</p></div></div>
      <div class="ts-steps">${TS_SK.map(([k,t,i,d],x)=>`<div class="ts-step"><span class="ts-step-n">${x+1}</span>${ic(i)}<div><b>${t}</b><div class="small muted">${d}${k==='writing'&&!hasW||k==='speaking'&&!hasS?' · chưa có, sẽ bỏ qua':''}</div></div></div>`).join('')}</div>
      <label class="label">Chọn đề</label>
      <div class="row" id="tsPick">${[1,2,3,4,5,6].map(n=>`<button class="chip" data-n="${n}" aria-pressed="${n===last}">Đề ${n}</button>`).join('')}</div>
      <p class="note" id="tsPickN"></p>
      <div class="row"><button class="btn primary" id="tsStart">${ic('play')}Bắt đầu thi thử</button></div>
    </div>
    <div class="panel"><h3>Thi từng kỹ năng</h3><p class="note">Làm riêng một bài đủ 40 câu theo giờ thật, kết quả được lưu vào tiến độ band.</p>
      <div class="ts-one">
        <div class="ts-one-r"><span class="ts-one-t">${ic('headphones')}Listening</span><div class="row">${[1,2,3,4,5,6].map(n=>`<button class="btn sm" data-ls="${n}">Đề ${n}</button>`).join('')}</div></div>
        <div class="ts-one-r"><span class="ts-one-t">${ic('book-open')}Reading ${type==='general'?'GT':'Academic'}</span><div class="row">${Array.from({length:nRd},(_,i)=>`<button class="btn sm" data-rd="${i+1}">Đề ${i+1}</button>`).join('')}</div></div>
        ${hasW?`<div class="ts-one-r"><span class="ts-one-t">${ic('pen-line')}Writing</span><div class="row"><button class="btn sm" id="tsW">Task 1 + Task 2, 60 phút</button></div></div>`:''}
        ${hasS?`<div class="ts-one-r"><span class="ts-one-t">${ic('mic')}Speaking</span><div class="row"><button class="btn sm" id="tsS">Part 1, 2, 3</button></div></div>`:''}
      </div></div>
    <div class="panel"><div class="spread"><h3>Kết quả các lần thi</h3><button class="btn sm ghost" id="tsPlace">${ic('target')}Bài xếp lớp nhanh</button></div>
      ${hist.length?`<div class="ts-hist">${hist.map(s=>`<div class="ts-hr ${s.skill==='overall'?'ov':''}"><span class="small muted num">${ymd(s.t).split('-').reverse().slice(0,2).join('/')}</span><span class="ts-hr-t"><b>${esc(skn[s.skill]||s.skill)}</b> <span class="small muted">${esc(s.title||'')}</span>${s.raw!=null&&s.total?` <span class="small muted num">${s.raw}/${s.total}</span>`:''}</span><b class="num ts-hr-b">${fmtBand(s.band)}</b></div>`).join('')}</div>`
        :`<p class="note">Chưa có kết quả thi thử nào. Muốn biết nhanh trình độ hiện tại thì làm bài xếp lớp khoảng 10 phút.</p>`}
      <details class="g"><summary><span class="t">Bảng quy đổi điểm sang band (Listening và Reading)</span>${ic('chevron-right')}</summary><div class="ts-conv">${TS_convTable()}</div></details>
    </div></div>`;
  let n=last;
  const pn=()=>{$('#tsPickN',el).textContent=`Đề ${n}: Listening Test ${n}, Reading ${type==='general'?'General Training':'Academic'} Test ${TS_rdN(n,type)}${hasW?', Writing':''}${hasS?', Speaking':''}.`;};pn();
  $$('#tsPick [data-n]',el).forEach(b=>b.onclick=()=>{n=+b.dataset.n;$$('#tsPick [data-n]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));pn();});
  $('#tsStart',el).onclick=()=>{P.ts.n=n;touch('main');TS_M={n,type,step:0,bands:{},skipped:{},t:Date.now()};TS_break(el);};
  const back=()=>TS_home(el);
  $$('[data-ls]',el).forEach(b=>b.onclick=()=>TS_listenTest(el,+b.dataset.ls,{exam:true,onExit:back,onDone:back,nextLabel:'Về Thi thử'}));
  $$('[data-rd]',el).forEach(b=>b.onclick=()=>TS_readTest(el,+b.dataset.rd,type,{exam:true,onExit:back,onDone:back,nextLabel:'Về Thi thử'}));
  const w=$('#tsW',el);if(w)w.onclick=()=>{try{window.WR_exam(el,{onDone:()=>TS_home(el),onExit:back,back});}catch(e){console.error(e);toast('Không mở được bài Writing.');}};
  const s=$('#tsS',el);if(s)s.onclick=()=>{try{window.SP_exam(el,{onDone:()=>TS_home(el),onExit:back,back});}catch(e){console.error(e);toast('Không mở được bài Speaking.');}};
  $('#tsPlace',el).onclick=()=>go('placement');
}
function TS_convTable(){
  const rows=[];for(let r=40;r>=0;r--){const l=bandOf('listening',r,40),a=bandOf('reading',r,40,'academic'),g=bandOf('reading',r,40,'general');rows.push([r,l,a,g]);}
  const grp=[];rows.forEach(r=>{const p=grp[grp.length-1];if(p&&p.l===r[1]&&p.a===r[2]&&p.g===r[3])p.lo=r[0];else grp.push({hi:r[0],lo:r[0],l:r[1],a:r[2],g:r[3]});});
  return `<p class="note">Bảng tham khảo phổ biến, mỗi kỳ thi có thể lệch nửa band.</p><div class="ts-tw"><table class="ts-tb"><thead><tr><th>Số câu đúng</th><th>Listening</th><th>Reading Academic</th><th>Reading GT</th></tr></thead><tbody>${grp.filter(x=>x.hi>=6).map(x=>`<tr><td class="num">${x.hi===x.lo?x.hi:x.lo+'-'+x.hi}</td><td class="num">${fmtBand(x.l)}</td><td class="num">${fmtBand(x.a)}</td><td class="num">${fmtBand(x.g)}</td></tr>`).join('')}</tbody></table></div>`;
}
function TS_has(k){return k==='listening'||k==='reading'||(k==='writing'?typeof window.WR_exam==='function':typeof window.SP_exam==='function');}
function TS_break(el){
  TS_clean();window.__leave=TS_clean;window.scrollTo(0,0);
  const M=TS_M;
  while(M.step<4&&!TS_has(TS_SK[M.step][0])){M.skipped[TS_SK[M.step][0]]=1;M.step++;}
  if(M.step>=4){TS_final(el);return;}
  const [k,t,i,d]=TS_SK[M.step];
  el.innerHTML=`<div class="view"><div class="spread"><h2>Thi thử đề ${M.n}</h2><button class="btn ghost sm" id="tsQuit">Dừng thi thử</button></div>
    <div class="ts-prog">${TS_SK.map(([kk,tt],x)=>`<div class="ts-pg ${x<M.step?'done':x===M.step?'cur':''}"><i></i><span>${tt}</span><b class="num">${x<M.step?(M.skipped[kk]?'bỏ qua':fmtBand(M.bands[kk])):''}</b></div>`).join('')}</div>
    <div class="panel ts-brk">${typeof mascot==='function'?mascot(M.step?'ok':'hi',96):''}
      <span class="label">Phần ${M.step+1}/4</span><h3 class="ts-brk-t">${ic(i)} ${t}</h3><p class="note">${d}.</p>
      <p class="small">${TS_tip(k,M)}</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="tsGo">${ic('play')}Bắt đầu ${t}</button><button class="btn ghost" id="tsSkip">Bỏ qua phần này</button></div></div></div>`;
  $('#tsQuit',el).onclick=()=>{if(!$('#tsQuit',el).dataset.arm){$('#tsQuit',el).dataset.arm=1;toast('Bấm lần nữa để dừng. Các phần đã làm vẫn được lưu điểm.');return;}TS_M=null;TS_home(el);};
  $('#tsSkip',el).onclick=()=>{M.skipped[k]=1;M.step++;TS_break(el);};
  const next=band=>{if(band!=null&&!isNaN(band))M.bands[k]=band;else M.skipped[k]=1;M.step++;TS_break(el);};
  const back=()=>TS_break(el);
  $('#tsGo',el).onclick=()=>{
    if(k==='listening')TS_listenTest(el,M.n,{exam:true,mock:true,onExit:back,nextLabel:'Sang phần Reading',onDone:(r,tt)=>next(bandOf('listening',r,tt))});
    else if(k==='reading')TS_readTest(el,TS_rdN(M.n,M.type),M.type,{exam:true,mock:true,onExit:back,nextLabel:'Sang phần tiếp theo',onDone:(r,tt)=>next(bandOf('reading',r,tt,M.type))});
    else{const f=k==='writing'?window.WR_exam:window.SP_exam;
      try{f(el,{mock:true,onDone:b=>next(b),onExit:back,back});}catch(e){console.error(e);toast('Không mở được phần '+t+'.');}}
  };
}
function TS_tip(k,M){
  if(k==='listening')return 'Đeo tai nghe, ngồi chỗ yên tĩnh. Bài nghe phát một lần, giữa các part có 10 giây đọc trước câu hỏi. Hết bài có 2 phút kiểm tra lại.';
  if(k==='reading')return `Ba ${M.type==='general'?'section':'passage'}, 40 câu trong 60 phút. Nên dành khoảng 20 phút mỗi bài, câu khó thì đoán rồi đi tiếp.`;
  if(k==='writing')return 'Task 1 khoảng 20 phút (ít nhất 150 từ), Task 2 khoảng 40 phút (ít nhất 250 từ). AI chấm band theo 4 tiêu chí.';
  return 'Chuẩn bị micro. Part 2 có 1 phút chuẩn bị và nói tối đa 2 phút.';
}
function TS_final(el){
  TS_clean();window.scrollTo(0,0);
  const M=TS_M;TS_M=null;
  const bs=TS_SK.map(([k])=>M.bands[k]).filter(b=>b!=null);
  const ov=overallBand(bs), target=plCfg().target;
  if(ov!=null){recordScore({skill:'overall',band:ov,title:'Thi thử đề '+M.n,detail:M.bands});}
  if(bs.length)award('test',1);
  touch('main');
  const hit=ov!=null&&ov>=target;
  el.innerHTML=`<div class="view"><h2>Kết quả thi thử đề ${M.n}</h2>
    <div class="panel ts-fin">${typeof mascot==='function'?mascot(ov==null?'zzz':hit?'yay':ov>=target-1?'ok':'hmm',110):''}
      <div class="ts-fin-o"><span class="label">Overall</span><div class="ts-fin-b num">${fmtBand(ov)}</div><span class="small muted">Mục tiêu ${fmtBand(target)}</span></div></div>
    <div class="bands ts-fbands">${TS_SK.map(([k,t])=>`<div class="bd-c"><span class="small muted">${t}</span><b class="num">${M.bands[k]!=null?fmtBand(M.bands[k]):'-'}</b>${M.skipped[k]?'<span class="small muted">bỏ qua</span>':''}</div>`).join('')}</div>
    <p class="note">${ov==null?'Bạn đã bỏ qua tất cả các phần nên chưa có band. Lần sau thử làm ít nhất Listening và Reading nhé.'
      :hit?'Bạn đã chạm mục tiêu. Giữ nhịp luyện đều và thử một đề khác để chắc chắn kết quả ổn định.'
      :`Còn cách mục tiêu ${(target-ov).toFixed(1)} band. Xem lại các câu sai trong Sổ lỗi, rồi tập trung vào kỹ năng có band thấp nhất.`}
      ${Object.keys(M.skipped).length&&ov!=null?' Overall chỉ tính các phần bạn đã làm.':''}</p>
    <div class="row"><button class="btn primary" id="tsAgain">Về Thi thử</button><button class="btn" id="tsMist">Mở Sổ lỗi</button><button class="btn ghost" id="tsHome">Về Hôm nay</button></div></div>`;
  if(hit&&typeof confetti==='function')setTimeout(()=>confetti(),300);
  $('#tsAgain',el).onclick=()=>TS_home(el);$('#tsMist',el).onclick=()=>go('mistakes');$('#tsHome',el).onclick=()=>go('home');
}
