/* ===== Writing: VIEWS.write (Task 1 Academic charts, Task 1 GT letters, Task 2 essays), AI grading, WR_exam ===== */
const WR_COLORS=['var(--t4)','var(--t2)','var(--t3)','var(--t1)','var(--accent)','var(--t5)','var(--orange)'];
const WR_CHART_VI={line:'Biểu đồ đường',bar:'Biểu đồ cột',pie:'Biểu đồ tròn',table:'Bảng số liệu',process:'Quy trình',map:'Bản đồ'};
const WR_TONE_VI={formal:'Trang trọng','semi-formal':'Bán trang trọng',informal:'Thân mật'};
const WR_TYPE_VI={opinion:'Nêu quan điểm',discussion:'Thảo luận hai quan điểm',advantages:'Ưu điểm và nhược điểm','problem-solution':'Vấn đề và giải pháp','two-part':'Câu hỏi hai phần'};
const WR_TOPIC_VI={education:'giáo dục',environment:'môi trường',technology:'công nghệ',health:'sức khỏe',work:'công việc',crime:'tội phạm',government:'chính phủ',media:'truyền thông',culture:'văn hóa',globalisation:'toàn cầu hóa',transport:'giao thông',family:'gia đình',tourism:'du lịch',city:'đô thị'};
const WR_CRIT=[['ta','Hoàn thành yêu cầu','Task Achievement'],['cc','Mạch lạc và liên kết','Coherence and Cohesion'],['lr','Từ vựng','Lexical Resource'],['gra','Ngữ pháp','Grammatical Range and Accuracy']];
const WR_TABS=[['t1a','Task 1 Academic'],['t1g','Task 1 thư (GT)'],['t2','Task 2']];
let WR_D=null, WR_tab=null, WR_saveT=null;

function WR_st(){P.wr=P.wr||{};const w=P.wr;w.drafts=w.drafts||{};w.hist=w.hist||[];w.done=w.done||{};return w;}
async function WR_load(){
  if(WR_D)return WR_D;
  const d=await loadJSON('writing'); ['t1a','t1g','t2'].forEach(k=>(d[k]||[]).forEach(x=>{x._k=k;}));
  WR_D=d; return d;
}
const WR_all=()=>WR_D?[...(WR_D.t1a||[]),...(WR_D.t1g||[]),...(WR_D.t2||[])]:[];
const WR_find=id=>WR_all().find(x=>x.id===id);
const WR_target=x=>x._k==='t2'?250:150;
const WR_mins=x=>x._k==='t2'?40:20;
const WR_kindName=k=>k==='t1a'?'Task 1 Academic':k==='t1g'?'Task 1 thư (GT)':'Task 2';
function WR_first(s,n){
  s=String(s||'').split('\n')[0].trim(); const m=s.match(/^.*?[.?!](\s|$)/); let t=m?m[0].trim():s;
  if(t.length>n){t=t.slice(0,n);t=t.slice(0,t.lastIndexOf(' ')>20?t.lastIndexOf(' '):n).replace(/[,;:]$/,'')+'...';}
  return t;
}
function WR_title(x){return x._k==='t1a'?x.title:x._k==='t1g'?WR_first(x.prompt,90):WR_first(x.prompt,110);}
function WR_meta(x){
  if(x._k==='t1a')return WR_CHART_VI[x.chart&&x.chart.type]||'Biểu đồ';
  if(x._k==='t1g')return 'Thư '+(WR_TONE_VI[x.tone]||x.tone||'').toLowerCase();
  return (WR_TYPE_VI[x.type]||x.type||'')+(x.topic?' · '+(WR_TOPIC_VI[x.topic]||x.topic):'');
}
const WR_clean=s=>String(s??'').replace(/\s*—\s*/g,', ').replace(/–/g,'-').replace(/[→⇒⟶]/g,'->').replace(/[←⇐]/g,'<-').replace(/↔/g,'<->');
function WR_lastHist(id){const h=WR_st().hist;for(let i=h.length-1;i>=0;i--)if(h[i].id===id)return h[i];return null;}
const WR_date=t=>{const d=new Date(t);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();};

/* ---------- charts ---------- */
const WR_r=v=>Math.round(v*10)/10;
const WR_fmtN=v=>{const r=Math.round(v*100)/100;return Math.abs(r)>=10000?r.toLocaleString('en-US'):String(r);};
function WR_nice(max){
  if(!(max>0))return {step:1,top:5};
  const raw=max/5, p=Math.pow(10,Math.floor(Math.log10(raw))), m=raw/p;
  const step=(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;
  return {step,top:Math.ceil(max/step-1e-9)*step};
}
function WR_ticks(top,step){const t=[];for(let i=0;i*step<=top+1e-9;i++)t.push(+(i*step).toFixed(6));return t;}
const WR_tw=(s,fs)=>String(s).length*(fs||12)*0.56;
function WR_marker(i,x,y,col,sz){
  sz=sz||4.2; const k=i%4;
  if(k===0)return `<circle cx="${x}" cy="${y}" r="${sz}" fill="${col}" class="wr-mk"/>`;
  if(k===1)return `<rect x="${WR_r(x-sz)}" y="${WR_r(y-sz)}" width="${sz*2}" height="${sz*2}" fill="${col}" class="wr-mk"/>`;
  if(k===2)return `<path d="M${x} ${WR_r(y-sz-1)}L${WR_r(x+sz+1)} ${WR_r(y+sz)}L${WR_r(x-sz-1)} ${WR_r(y+sz)}Z" fill="${col}" class="wr-mk"/>`;
  return `<path d="M${x} ${WR_r(y-sz-1)}L${WR_r(x+sz+1)} ${y}L${x} ${WR_r(y+sz+1)}L${WR_r(x-sz-1)} ${y}Z" fill="${col}" class="wr-mk"/>`;
}
function WR_legend(names,kind){
  return `<div class="wr-leg">${names.map((n,i)=>{const c=WR_COLORS[i%WR_COLORS.length];
    const sw=kind==='line'?`<svg viewBox="0 0 26 12" aria-hidden="true"><line x1="1" y1="6" x2="25" y2="6" stroke="${c}" stroke-width="2.5"/>${WR_marker(i,13,6,c,3.4)}</svg>`:`<i style="background:${c}"></i>`;
    return `<span>${sw}${esc(n)}</span>`;}).join('')}</div>`;
}
function WR_line(c,W){
  const H=W<400?250:280, n=c.x.length, all=c.series.flatMap(s=>s.values.map(Number));
  const {step,top}=WR_nice(Math.max(...all)), ticks=WR_ticks(top,step);
  const padL=Math.max(...ticks.map(t=>WR_tw(WR_fmtN(t))))+12, padR=14, padT=12, padB=28;
  const pw=W-padL-padR, ph=H-padT-padB, inset=Math.min(16,pw/(n*4));
  const X=i=>WR_r(padL+(n===1?pw/2:inset+i*(pw-2*inset)/(n-1))), Y=v=>WR_r(padT+ph-(v/top)*ph);
  const maxL=Math.max(...c.x.map(s=>WR_tw(s))), every=Math.max(1,Math.ceil((maxL+8)/((pw-2*inset)/Math.max(1,n-1))));
  let s=`<svg class="wr-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
  ticks.forEach(t=>{s+=`<line x1="${padL}" x2="${W-padR}" y1="${Y(t)}" y2="${Y(t)}" class="${t===0?'wr-ax':'wr-gr'}"/><text x="${padL-6}" y="${Y(t)+4}" text-anchor="end">${WR_fmtN(t)}</text>`;});
  s+=`<line x1="${padL}" x2="${padL}" y1="${padT}" y2="${padT+ph}" class="wr-ax"/>`;
  c.x.forEach((l,i)=>{s+=`<line x1="${X(i)}" x2="${X(i)}" y1="${padT+ph}" y2="${padT+ph+4}" class="wr-ax"/>`;if(i%every===0||i===n-1&&n%every===1)s+=`<text x="${X(i)}" y="${padT+ph+18}" text-anchor="middle">${esc(l)}</text>`;});
  c.series.forEach((se,k)=>{const col=WR_COLORS[k%WR_COLORS.length];
    s+=`<polyline fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" points="${se.values.map((v,i)=>X(i)+','+Y(+v)).join(' ')}"/>`;
    se.values.forEach((v,i)=>{s+=`<g>${WR_marker(k,X(i),Y(+v),col)}<title>${esc(se.name)}, ${esc(c.x[i])}: ${WR_fmtN(+v)}</title></g>`;});
  });
  return s+'</svg>'+WR_legend(c.series.map(x=>x.name),'line');
}
function WR_bar(c,W){
  const n=c.x.length, m=c.series.length, all=c.series.flatMap(s=>s.values.map(Number));
  const {step,top}=WR_nice(Math.max(...all)), ticks=WR_ticks(top,step);
  const horiz=W<400&&n*m>12;
  let s='';
  if(horiz){
    const maxL=Math.min(110,Math.max(...c.x.map(x=>WR_tw(x)))), padL=maxL+12, padR=16, padT=8, padB=26;
    const bh=11, slot=m*bh+14, ph=n*slot, H=padT+ph+padB, pw=W-padL-padR, X=v=>WR_r(padL+(v/top)*pw);
    s=`<svg class="wr-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
    ticks.forEach(t=>{s+=`<line y1="${padT}" y2="${padT+ph}" x1="${X(t)}" x2="${X(t)}" class="${t===0?'wr-ax':'wr-gr'}"/><text x="${X(t)}" y="${padT+ph+16}" text-anchor="middle">${WR_fmtN(t)}</text>`;});
    c.x.forEach((l,i)=>{const y0=padT+i*slot+7;
      s+=`<text x="${padL-6}" y="${WR_r(y0+m*bh/2+4)}" text-anchor="end">${esc(l)}</text>`;
      c.series.forEach((se,k)=>{const v=+se.values[i];s+=`<rect x="${padL}" y="${y0+k*bh}" width="${Math.max(0,X(v)-padL)}" height="${bh-2}" rx="2" fill="${WR_COLORS[k%WR_COLORS.length]}"><title>${esc(se.name)}, ${esc(l)}: ${WR_fmtN(v)}</title></rect>`;});
    });
    s+=`<line x1="${padL}" x2="${W-padR}" y1="${padT+ph}" y2="${padT+ph}" class="wr-ax"/></svg>`;
  }else{
    const H=W<400?250:280, padL=Math.max(...ticks.map(t=>WR_tw(WR_fmtN(t))))+12, padR=10, padT=12;
    const pwGuess=W-padL-padR, slotGuess=pwGuess/n, maxL=Math.max(...c.x.map(x=>WR_tw(x)));
    const rot=maxL+6>slotGuess, padB=rot?Math.min(90,maxL*0.72+18):28;
    const pw=W-padL-padR, ph=H-padT-padB, slot=pw/n, gw=slot*0.74, bw=gw/m, Y=v=>WR_r(padT+ph-(v/top)*ph);
    s=`<svg class="wr-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
    ticks.forEach(t=>{s+=`<line x1="${padL}" x2="${W-padR}" y1="${Y(t)}" y2="${Y(t)}" class="${t===0?'wr-ax':'wr-gr'}"/><text x="${padL-6}" y="${Y(t)+4}" text-anchor="end">${WR_fmtN(t)}</text>`;});
    c.x.forEach((l,i)=>{const x0=padL+i*slot+(slot-gw)/2, cx=WR_r(padL+i*slot+slot/2);
      c.series.forEach((se,k)=>{const v=+se.values[i];s+=`<rect x="${WR_r(x0+k*bw+0.6)}" y="${Y(v)}" width="${WR_r(Math.max(1,bw-1.2))}" height="${WR_r(Math.max(0,padT+ph-Y(v)))}" rx="1.5" fill="${WR_COLORS[k%WR_COLORS.length]}"><title>${esc(se.name)}, ${esc(l)}: ${WR_fmtN(v)}</title></rect>`;});
      s+=rot?`<text transform="translate(${cx+4} ${padT+ph+12}) rotate(-40)" text-anchor="end">${esc(l)}</text>`:`<text x="${cx}" y="${padT+ph+18}" text-anchor="middle">${esc(l)}</text>`;
    });
    s+=`<line x1="${padL}" x2="${padL}" y1="${padT}" y2="${padT+ph}" class="wr-ax"/></svg>`;
  }
  return s+WR_legend(c.series.map(x=>x.name),'bar');
}
function WR_pie(c,W){
  const pies=c.series.slice(0,2), np=pies.length, cell=W/np, r=Math.min(cell/2-18,np===1?110:96), H=WR_r(r*2+50);
  let s=`<svg class="wr-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
  const isPct=String(c.unit||'').trim()==='%';
  pies.forEach((se,p)=>{
    const cx=WR_r(cell*p+cell/2), cy=WR_r(r+16), vals=se.values.map(Number), tot=vals.reduce((a,b)=>a+b,0)||1;
    let a0=-Math.PI/2;
    vals.forEach((v,i)=>{const frac=v/tot, a1=a0+frac*2*Math.PI, col=WR_COLORS[i%WR_COLORS.length];
      if(frac>=0.9999)s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}"/>`;
      else if(frac>0){const x0=cx+r*Math.cos(a0),y0=cy+r*Math.sin(a0),x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
        s+=`<path d="M${cx} ${cy}L${WR_r(x0)} ${WR_r(y0)}A${r} ${r} 0 ${frac>0.5?1:0} 1 ${WR_r(x1)} ${WR_r(y1)}Z" fill="${col}" class="wr-slice"><title>${esc(c.x[i])}: ${WR_fmtN(v)}${isPct?'%':''}</title></path>`;}
      a0=a1;
    });
    a0=-Math.PI/2;
    vals.forEach((v,i)=>{const frac=v/tot, mid=a0+frac*Math.PI; a0+=frac*2*Math.PI; if(frac<=0)return;
      const lab=(isPct?WR_fmtN(v):WR_fmtN(Math.round(frac*1000)/10))+'%';
      if(frac>=0.055){const rr=r*0.66;s+=`<text x="${WR_r(cx+rr*Math.cos(mid))}" y="${WR_r(cy+rr*Math.sin(mid)+4)}" text-anchor="middle" class="wr-pl">${lab}</text>`;}
      else{const rr=r+10, x=cx+rr*Math.cos(mid);s+=`<text x="${WR_r(x)}" y="${WR_r(cy+rr*Math.sin(mid)+4)}" text-anchor="${Math.cos(mid)>0.2?'start':Math.cos(mid)<-0.2?'end':'middle'}" class="wr-po">${lab}</text>`;}
    });
    s+=`<text x="${cx}" y="${WR_r(cy+r+26)}" text-anchor="middle" class="wr-pn">${esc(se.name)}</text>`;
  });
  return s+'</svg>'+WR_legend(c.x,'pie');
}
function WR_table(c){
  return `<div class="wr-tbw"><table class="wr-tb"><thead><tr><th></th>${c.series.map(s=>`<th>${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${c.x.map((l,i)=>`<tr><th scope="row">${esc(l)}</th>${c.series.map(s=>`<td>${WR_fmtN(+s.values[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const WR_ARROW='<svg class="wr-arr" viewBox="0 0 28 16" aria-hidden="true"><path d="M2 8H19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M17 2.5L26 8L17 13.5Z" fill="currentColor"/></svg>';
function WR_process(c){
  const st=c.steps||[];
  return `<ol class="wr-proc">${st.map((t,i)=>{const k=t.indexOf(':');const h=k>0&&k<40?t.slice(0,k):'';const b=h?t.slice(k+1).trim():t;
    return `<li class="wr-step"><div class="wr-sbox"><span class="wr-sn">${i+1}</span><div>${h?`<b>${esc(h)}</b>`:''}<span>${esc(b)}</span></div></div>${i<st.length-1?WR_ARROW:''}</li>`;}).join('')}</ol>`;
}
function WR_map(c){
  const side=(o,lab,cls)=>`<div class="wr-mp ${cls}"><div class="wr-mph"><span class="label">${lab}</span><b>${esc(o.year)}</b></div><div class="wr-mpi">${(o.items||[]).map((t,i)=>`<div class="wr-mb"><span class="wr-mbn">${String.fromCharCode(65+i)}</span><span>${esc(t)}</span></div>`).join('')}</div></div>`;
  return `<div class="wr-map">${side(c.before||{},'Trước','b')}${side(c.after||{},'Sau','a')}</div>`;
}
function WR_chartSVG(chart,W){
  if(!chart)return '';
  W=W||(window.innerWidth<640?320:420);
  let body='';
  try{
    if(chart.type==='line')body=WR_line(chart,W);
    else if(chart.type==='bar')body=WR_bar(chart,W);
    else if(chart.type==='pie')body=WR_pie(chart,W);
    else if(chart.type==='table')body=WR_table(chart);
    else if(chart.type==='process')body=WR_process(chart);
    else if(chart.type==='map')body=WR_map(chart);
  }catch(e){console.error(e);body='<p class="note">Không vẽ được biểu đồ này.</p>';}
  const unit=chart.unit?`<span class="wr-unit">Đơn vị: ${esc(chart.unit)}</span>`:'';
  return `<figure class="wr-chart wr-ch-${esc(chart.type)}"><figcaption><b>${esc(chart.title||'')}</b>${unit}</figcaption>${body}</figure>`;
}
window.WR_chartSVG=WR_chartSVG;

/* ---------- prompt pieces ---------- */
function WR_promptHTML(x){
  const lines=String(x.prompt||'').split('\n');let out='',ul=[];
  const flush=()=>{if(ul.length){out+=`<ul>${ul.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;ul=[];}};
  lines.forEach(l=>{const t=l.trim();if(!t){flush();return;}if(/^[-•]\s*/.test(t)){ul.push(t.replace(/^[-•]\s*/,''));return;}flush();out+=`<p>${esc(t)}</p>`;});
  flush(); return `<div class="en-s wr-ptext">${out}</div>`;
}
const WR_paras=t=>String(t||'').split(/\n\s*\n/).map(p=>`<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
function WR_helpHTML(x){
  const phrases=x._k==='t2'?(x.vocab||[]):(x.phrases||[]);
  let notes='';
  if(x._k==='t2'){
    notes=`<p>${esc(x.outline||'')}</p>`;
    if(x.ideas)notes+=`<div class="wr-ideas"><div><div class="label">Ý ủng hộ</div><ul>${(x.ideas.for||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div><div><div class="label">Ý phản đối</div><ul>${(x.ideas.against||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div></div>`;
  }else{
    notes=`<p>${esc(x.notes||'')}</p>`;
    if(x.overview)notes+=`<div class="wr-ovs"><div class="label">Câu tổng quan mẫu</div><p class="en-s">${esc(x.overview)}</p></div>`;
  }
  return `<details class="g wr-det"><summary>${ic('lightbulb')} Gợi ý dàn ý</summary><div class="wr-dbody">${notes}</div></details>
  <details class="g wr-det"><summary>${ic('book-a')} Cụm từ hay</summary><div class="wr-dbody"><div class="wr-phr">${phrases.map(([en,vi])=>`<div class="wr-ph"><button class="spk sm" data-say="${esc(en)}" aria-label="Nghe">${SPK}</button><div><b class="en">${esc(en)}</b><span class="note">${esc(vi)}</span></div></div>`).join('')}</div></div></details>
  <details class="g wr-det" id="wrModelD"><summary>${ic('award')} Bài mẫu band 8 và band 9</summary><div class="wr-dbody">${WR_models(x)}</div></details>`;
}
function WR_modelHTML(x){
  return `<div class="row"><button class="spk" data-say="${esc(x.model||'')}" aria-label="Nghe bài mẫu">${SPK}</button><span class="note">Nghe đọc bài mẫu, ${countWords(x.model||'')} từ</span></div><div class="en-s wr-model">${WR_paras(x.model)}</div>`;
}
/* band 9 pack: default to band 9 for high targets or strong recent writing */
function WR_pref9(){
  try{const t=+plCfg().target||0, w=latestBands().writing; return t>=8.5||(w!=null&&w>=7.5);}catch(e){return false;}
}
const WR_hi9=()=>{try{return (+plCfg().target||0)>=8.5;}catch(e){return false;}};
/* quoted phrases in a why9 explanation: "..." or “...”, split on ellipses */
function WR_quotes(v){
  const out=[]; const re=/"([^"]{3,})"|“([^”]{3,})”/g; let m;
  while((m=re.exec(String(v||''))))String(m[1]||m[2]).split(/\s*(?:\.\.\.|…)\s*/).forEach(f=>{f=f.trim().replace(/^[,.;:]+|[,.;:]+$/g,'').trim();if(f.length>=4)out.push(f);});
  return out;
}
/* essay text with why9 phrases marked (soft orange); returns paragraph html */
function WR_hlText(text,why){
  text=String(text||''); const rs=[];
  (why||[]).forEach((w,k)=>WR_quotes(w&&w[1]).forEach(q=>{const f=WR_findRange(text,q);if(!f)return;const s=f[0],e=f[0]+f[1];
    if(text.slice(s,e).includes('\n'))return; if(rs.some(r=>s<r.e&&e>r.s))return; rs.push({s,e,k});}));
  rs.sort((a,b)=>a.s-b.s);
  const seen=new Set(); let h='',p=0;
  rs.forEach(r=>{h+=esc(text.slice(p,r.s));const first=!seen.has(r.k);seen.add(r.k);
    h+=`<mark class="wr-hl9" data-w="${r.k}">${esc(text.slice(r.s,r.e))}${first?`<sup>${r.k+1}</sup>`:''}</mark>`;p=r.e;});
  h+=esc(text.slice(p));
  return h.split(/\n\s*\n/).map(t=>`<p>${t.trim().replace(/\n/g,'<br>')}</p>`).join('');
}
function WR_whyHTML(why){
  return `<ol class="wr-why9">${(why||[]).map(([f,v],k)=>`<li data-w="${k}"><span class="wr-wn">${k+1}</span><div><b class="en">${esc(f)}</b><span>${esc(v)}</span></div></li>`).join('')}</ol>`;
}
function WR_model9HTML(x,o){
  o=o||{}; const t=x.model9||x.sample9||'';
  if(!t)return '<p class="note">Chưa có bài mẫu band 9 cho đề này.</p>';
  return `<div class="row"><button class="spk" data-say="${esc(t)}"${o.voice?` data-voice="${o.voice}"`:''} aria-label="Nghe bài mẫu band 9">${SPK}</button><span class="note">Nghe đọc bài mẫu band 9, ${countWords(t)} từ</span></div>
    <div class="en-s wr-model wr-m9">${WR_hlText(t,x.why9)}</div>
    ${(x.why9||[]).length?`<div class="wr-b9s"><h4>Vì sao đạt band 9</h4><p class="note">Các cụm được tô cam trong bài ứng với từng ý dưới đây.</p>${WR_whyHTML(x.why9)}</div>`:''}
    ${x.band8vs9?`<div class="wr-b9s"><h4>Khác gì band 8</h4><p class="wr-vs">${esc(x.band8vs9)}</p></div>`:''}`;
}
/* two-tab switch: [[label, html, is9], ...] */
function WR_switch(tabs,def9){
  const on=tabs.findIndex(t=>!!t[2]===!!def9), cur=on<0?0:on;
  return `<div class="wr-sw">${tabs.length>1?`<div class="row wr-swt" role="tablist">${tabs.map((t,i)=>`<button type="button" class="chip" role="tab" data-swi="${i}" aria-pressed="${i===cur}">${t[0]}</button>`).join('')}</div>`:''}
    ${tabs.map((t,i)=>`<div class="wr-swp" data-swp="${i}"${i===cur?'':' hidden'}>${t[1]}</div>`).join('')}</div>`;
}
if(!window.__wrSw){window.__wrSw=1;document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-swi]'); if(!b)return; const sw=b.closest('.wr-sw'); if(!sw)return;
  const i=b.dataset.swi;
  $$(':scope>.wr-swt [data-swi]',sw).forEach(y=>y.setAttribute('aria-pressed',String(y.dataset.swi===i)));
  $$(':scope>.wr-swp',sw).forEach(p=>p.hidden=p.dataset.swp!==i);
});}
function WR_models(x){
  const tabs=[['Bài mẫu band 8',WR_modelHTML(x),false]];
  if(x.model9)tabs.push(['Bài mẫu band 9',WR_model9HTML(x),true]);
  return WR_switch(tabs,WR_pref9());
}

/* ---------- AI grading ---------- */
function WR_aiPrompt(x,text,words){
  let task='';
  if(x._k==='t1a')task=`IELTS Academic Writing Task 1 (report on visual information, minimum 150 words, about 20 minutes).
Prompt: ${x.prompt}
The exact chart data (JSON, the learner saw this as a ${x.chart&&x.chart.type} chart): ${JSON.stringify(x.chart)}
Check that the figures the learner reports match this data; wrong or invented numbers lower Task Achievement. A clear overview of the main trends or features is required for band 6+ in TA; with no overview TA is at most 5. Opinions, causes or speculation not shown in the chart are irrelevant.`;
  else if(x._k==='t1g')task=`IELTS General Training Writing Task 1 (letter, minimum 150 words, about 20 minutes).
Prompt: ${x.prompt}
Required tone: ${x.tone}. Check that all three bullet points are fully covered and extended, the purpose is clear, and the tone, greeting and sign-off are consistent and appropriate (formal: Dear Sir or Madam + Yours faithfully; named formal: Yours sincerely; informal: Dear first name + Best wishes / Love). A missing bullet keeps TA at 5 or below.`;
  else task=`IELTS Writing Task 2 (essay, minimum 250 words, about 40 minutes). Essay type: ${x.type}.
Prompt: ${x.prompt}
All parts of the question must be addressed. A clear position throughout is required for band 6+ in Task Response (for opinion questions), and for discussion questions both views must be discussed plus the writer's own opinion. Ideas must be extended and supported, not just listed.`;
  const limit=x._k==='t2'?250:150;
  return `You are a strict, experienced IELTS Writing examiner. Grade the learner's answer exactly as an official IELTS examiner would, using the public band descriptors. Be realistic: most Vietnamese learners score 5 to 6.5; do not inflate.

${task}

Band descriptors (summary):
- ${x._k==='t2'?'Task Response (TR)':'Task Achievement (TA)'}: 9 fully satisfies all requirements, fully developed; 7 covers requirements, ${x._k==='t1a'?'clear overview, key features highlighted':x._k==='t1g'?'clear purpose, consistent tone, bullets highlighted':'clear position throughout, main ideas extended and supported'}; 6 addresses requirements but some parts more fully than others, ${x._k==='t1a'?'overview present, some details irrelevant or inaccurate':x._k==='t1g'?'purpose generally clear, tone may be inconsistent':'position present but conclusions may be unclear, some ideas underdeveloped'}; 5 only partly addresses the task, ${x._k==='t1a'?'no clear overview, mechanical recount, may focus on details':x._k==='t1g'?'purpose unclear, bullets inadequately covered':'position unclear, limited development, may be repetitive'}; 4 minimal response, largely irrelevant.
- Coherence and Cohesion (CC): 9 seamless cohesion; 7 logical progression, range of cohesive devices with some under/over-use, clear central topic in each paragraph; 6 coherent overall but cohesion may be faulty or mechanical, paragraphing not always logical; 5 some organisation but lack of progression, overuse or inaccurate linking words, inadequate paragraphing; 4 not arranged coherently.
- Lexical Resource (LR): 9 wide, natural, sophisticated; 7 sufficient range with flexibility, some less common items and collocation, occasional errors; 6 adequate range, attempts less common words with some inaccuracy, spelling/word form errors do not impede meaning; 5 limited range, noticeable errors that may cause difficulty; 4 basic, repetitive vocabulary.
- Grammatical Range and Accuracy (GRA): 9 wide range, full accuracy; 7 variety of complex structures, frequent error-free sentences, good control; 6 mix of simple and complex forms, some errors that rarely reduce communication; 5 limited range, complex sentences attempted but less accurate, frequent errors; 4 very limited range, errors predominate.

Penalties to apply: the answer has ${words} words; under ${limit} words is under-length and must be penalised in ${x._k==='t2'?'TR':'TA'} (far below the limit lowers it a lot). Off-topic or partly off-topic content is penalised heavily. Memorised, template phrases that are not relevant to the task are not credited for vocabulary and lower the score. Copying the prompt wording does not count toward the language assessed.

Learner's answer:
"""
${String(text).slice(0,9000)}
"""

${WR_hi9()?`The learner is aiming for band 8.5-9, so be extra strict at the top of the scale. Apply the band 8 vs band 9 distinctions precisely: band 9 needs a fully developed, nuanced response, cohesion that attracts no attention, and only rare, minor "slips" in vocabulary and grammar; any repeated awkwardness, imprecise word choice, slightly mechanical linking or underdeveloped idea keeps a criterion at 8 or below. In "summary" and "improve", say explicitly (in Vietnamese) what is currently stopping each criterion from reaching 9.

`:''}Return JSON only, with this exact shape:
{"bands":{"ta":6.5,"cc":6,"lr":6,"gra":5.5},"overall":6,"summary":"2-3 sentences in Vietnamese about the overall level and the main reason for the score","strengths":["Vietnamese, specific to this answer"],"improve":["Vietnamese, concrete and actionable, mention what to change and how"],"corrections":[{"orig":"an exact sentence or phrase copied character for character from the learner's answer","fix":"the corrected English","why":"short Vietnamese explanation"}],"better":"one improved version of the learner's weakest paragraph, in English, keeping the learner's ideas${WR_hi9()?', written at genuine band 9 level':''}"}
Rules: "ta" is the ${x._k==='t2'?'Task Response':'Task Achievement'} band. Each band is a number from 0 to 9 in steps of 0.5. Give 5 to 10 corrections, choosing the most important errors (grammar, word choice, collocation, spelling, register, linking); "orig" must appear exactly in the answer and be as short as possible while still showing the error. Give 2 to 4 strengths and 3 to 5 improvements. Vietnamese for explanations, English for corrected text. Do not use the em dash character.`;
}
function WR_norm(j){
  const b=(j&&j.bands)||{};
  const cl=v=>{v=parseFloat(v);if(!isFinite(v))return null;return Math.min(9,Math.max(0,Math.round(v*2)/2));};
  const bands={ta:cl(b.ta!=null?b.ta:b.tr),cc:cl(b.cc),lr:cl(b.lr),gra:cl(b.gra)};
  if(Object.values(bands).some(v=>v==null))throw {code:'bad_json'};
  const arr=v=>(Array.isArray(v)?v:v?[v]:[]).map(s=>WR_clean(typeof s==='string'?s:JSON.stringify(s)).trim()).filter(Boolean).slice(0,8);
  const corr=(Array.isArray(j.corrections)?j.corrections:[]).filter(c=>c&&c.orig&&c.fix).slice(0,12).map(c=>({orig:String(c.orig),fix:WR_clean(c.fix),why:WR_clean(c.why||'')}));
  return {bands,overall:overallBand([bands.ta,bands.cc,bands.lr,bands.gra]),summary:WR_clean(j.summary||''),strengths:arr(j.strengths),improve:arr(j.improve),corrections:corr,better:WR_clean(j.better||'')};
}
async function WR_grade(x,text){
  const j=await askJSON(WR_aiPrompt(x,text,countWords(text)));
  return WR_norm(j);
}
function WR_saveHist(x,text,r){
  const st=WR_st(); const e={id:x.id,k:x._k,title:WR_title(x),t:Date.now(),words:countWords(text),text,r};
  st.hist.push(e); if(st.hist.length>30)st.hist=st.hist.slice(-30); st.done[x.id]=Date.now(); touch('main');
  try{recordScore({skill:'writing',band:r.overall,id:x.id,title:WR_kindName(x._k)+': '+WR_title(x)});}catch(err){}
  return e;
}

/* ---------- result rendering ---------- */
const WR_rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function WR_findRange(text,orig){
  const o=String(orig).trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,'').trim(); if(!o)return null;
  let k=text.indexOf(o); if(k>=0)return [k,o.length];
  k=text.toLowerCase().indexOf(o.toLowerCase()); if(k>=0)return [k,o.length];
  const words=o.split(/\s+/).map(w=>WR_rx(w.replace(/[’']/g,"'")).replace(/'/g,"['’]"));
  try{const m=new RegExp(words.join('\\s+'),'i').exec(text);if(m)return [m.index,m[0].length];}catch(e){}
  return null;
}
function WR_markedEssay(text,corr){
  const ranges=[], miss=[];
  corr.forEach((c,i)=>{const f=WR_findRange(text,c.orig);
    if(!f||ranges.some(r=>f[0]<r.e&&f[0]+f[1]>r.s)){miss.push(i);return;}
    ranges.push({s:f[0],e:f[0]+f[1],i});});
  ranges.sort((a,b)=>a.s-b.s);
  let h='',p=0;
  ranges.forEach(r=>{const c=corr[r.i];h+=esc(text.slice(p,r.s));
    h+=`<span class="wr-c"><button type="button" class="wr-err" data-c="${r.i}" aria-expanded="false">${esc(text.slice(r.s,r.e))}<sup>${r.i+1}</sup></button><span class="wr-fix" hidden><b class="en">${esc(c.fix)}</b>${c.why?`<span>${esc(c.why)}</span>`:''}</span></span>`;
    p=r.e;});
  h+=esc(text.slice(p));
  return {html:h,miss,found:ranges.length};
}
function WR_resultHTML(x,text,r,opts){
  opts=opts||{};
  const crit=WR_CRIT.map(([k,vi,en],i)=>`<div class="wr-cr"><b>${fmtBand(r.bands[k])}</b><span class="wr-crv">${vi}</span><span class="small muted">${i===0&&x._k==='t2'?'Task Response':en}</span></div>`).join('');
  const li=a=>a.length?`<ul class="wr-ul">${a.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p class="note">Không có.</p>';
  const mk=WR_markedEssay(text,r.corrections);
  const missList=mk.miss.length?`<div class="wr-miss"><div class="label">Lỗi khác AI nêu ra</div>${mk.miss.map(i=>{const c=r.corrections[i];return `<div class="wr-mi"><s class="en">${esc(c.orig)}</s><b class="en">${esc(c.fix)}</b>${c.why?`<span class="note">${esc(c.why)}</span>`:''}</div>`;}).join('')}</div>`:'';
  return `<div class="panel wr-res">
    <div class="wr-ovr"><div class="wr-ovb"><span class="label">Band ước tính</span><span class="band-big">${fmtBand(r.overall)}</span></div><div class="wr-sum">${opts.mascot===false?'':mascot(r.overall>=7?'yay':r.overall>=6?'ok':'hmm',64)}<p>${esc(r.summary)}</p></div></div>
    <div class="wr-crits">${crit}</div>
    <div class="grid2"><div><h3>Điểm mạnh</h3>${li(r.strengths)}</div><div><h3>Cần cải thiện</h3>${li(r.improve)}</div></div>
  </div>
  <div class="panel"><div class="spread"><h3>Bài của bạn, đã đánh dấu lỗi</h3><span class="small muted">${countWords(text)} từ</span></div>
    ${r.corrections.length?`<p class="note">Bấm vào chỗ gạch đỏ để xem cách sửa và lý do.</p>`:''}
    <div class="en-s wr-essay">${mk.html}</div>${missList}</div>
  ${r.better?`<div class="panel"><h3>Viết lại đoạn yếu nhất${WR_hi9()?' (band 9)':''}</h3><div class="en-s wr-better">${WR_paras(r.better)}</div></div>`:''}
  ${opts.model===false?'':`<details class="g wr-det" open><summary>${ic('award')} So sánh với bài mẫu band 8 và band 9</summary><div class="wr-dbody">${WR_models(x)}</div></details>`}`;
}
function WR_bindResult(root){
  $$('.wr-err',root).forEach(b=>b.onclick=()=>{const f=b.nextElementSibling;const open=f.hidden;f.hidden=!open;b.setAttribute('aria-expanded',String(open));b.classList.toggle('on',open);});
}

/* ---------- home ---------- */
VIEWS.write=async el=>{
  el.innerHTML=`<div class="view"><h2>Viết</h2><p class="note">Đang tải đề...</p></div>`;
  let d; try{d=await WR_load();}catch(e){el.innerHTML=`<div class="view"><h2>Viết</h2><p class="empty">Chưa tải được đề Writing. Kiểm tra mạng rồi thử lại.</p></div>`;return;}
  if(!el.isConnected)return;
  WR_home(el);
};
function WR_home(el){
  window.__leave=null;
  const st=WR_st();
  if(!WR_tab)WR_tab=examType()==='general'?'t1g':'t1a';
  const list=(WR_D[WR_tab]||[]);
  const card=x=>{const h=WR_lastHist(x.id), dr=st.drafts[x.id], wc=dr?countWords(dr):0;
    const status=h?`<span class="wr-stt ok">${ic('check')} Đã chấm, band ${fmtBand(h.r.overall)}</span>`:st.done[x.id]?`<span class="wr-stt ok">${ic('check')} Đã nộp</span>`:wc?`<span class="wr-stt dr">${ic('pen-line')} Đang viết, ${wc} từ</span>`:`<span class="wr-stt">Chưa làm</span>`;
    return `<button class="panel wr-card" data-id="${esc(x.id)}"><span class="pill">${esc(WR_meta(x))}</span><span class="wr-ct${x._k==='t1a'?'':' en'}">${esc(WR_title(x))}</span>${status}</button>`;};
  const hist=st.hist.slice().reverse().slice(0,8);
  el.innerHTML=`<div class="view wr-home">
    <div class="spread"><div><h2>Viết</h2><p class="note">Chọn một đề, viết trong phòng yên tĩnh này rồi nộp để AI chấm theo 4 tiêu chí IELTS.</p></div>
      <button class="btn" id="wrExam">${ic('timer')} Thi thử Writing 60 phút</button></div>
    ${subTabs('wrTabs',WR_TABS,WR_tab,t=>{WR_tab=t;WR_home(el);})}
    <div class="wr-grid">${list.map(card).join('')||'<p class="empty">Chưa có đề.</p>'}</div>
    <div class="panel"><h3>${ic('bar-chart')} Lịch sử chấm</h3>
      ${hist.length?`<div class="wr-hl">${hist.map(h=>`<button class="wr-hrow" data-id="${esc(h.id)}"><span class="small muted">${WR_date(h.t)}</span><span class="wr-hrt">${esc(WR_kindName(h.k))}: ${esc(h.title)}</span><b>${fmtBand(h.r.overall)}</b></button>`).join('')}</div>`:'<p class="note">Bạn chưa nộp bài nào để chấm. Bài đã chấm sẽ hiện ở đây.</p>'}
    </div>
  </div>`;
  $$('.wr-card,.wr-hrow',el).forEach(b=>b.onclick=()=>{WR_open(el,b.dataset.id);window.scrollTo(0,0);});
  $('#wrExam',el).onclick=()=>{window.scrollTo(0,0);WR_exam(el,{onDone:()=>WR_home(el)});};
}

/* ---------- task room ---------- */
function WR_open(el,id,showHist){
  const x=WR_find(id); if(!x){WR_home(el);return;}
  const st=WR_st(), target=WR_target(x); let timer=null, awarded=false, busy=false;
  const flush=()=>{if(WR_saveT){clearTimeout(WR_saveT);WR_saveT=null;touch('main');}};
  window.__leave=()=>{if(timer)timer.stop();flush();};
  el.innerHTML=`<div class="view wr-room">
    <div class="spread"><button class="btn ghost sm" id="wrBack">${ic('chevron-left')} Danh sách đề</button><span class="pill">${esc(WR_kindName(x._k))} · ${esc(WR_meta(x))}</span></div>
    <div class="wr-task">
      <section class="wr-pa panel"><div class="label">Đề bài</div>${WR_promptHTML(x)}${x._k==='t1a'?WR_chartSVG(x.chart):''}</section>
      <section class="wr-wa panel">
        <div class="spread wr-bar"><span class="wr-wc" id="wrWc"></span><div class="row" id="wrTm"></div></div>
        <textarea id="wrTx" class="wr-tx en-s" spellcheck="false" autocomplete="off" autocorrect="off" placeholder="${x._k==='t1g'?'Dear ...':'Viết bài của bạn bằng tiếng Anh ở đây...'}" aria-label="Bài viết"></textarea>
        <div class="spread"><button class="btn primary" id="wrSub">${ic('sparkles')} Nộp bài và chấm</button><span class="small muted" id="wrSaved">Bài nháp tự lưu</span></div>
        <p class="note no-ai">AI chấm bài cần đăng nhập và máy chủ đã cấu hình. Bạn vẫn có thể nộp để so sánh với bài mẫu.</p>
      </section>
      <section class="wr-ha">${WR_helpHTML(x)}</section>
    </div>
    <div id="wrOut" class="wr-out"></div>
    <div id="wrHist"></div>
  </div>`;
  refreshAIBits();
  const tx=$('#wrTx',el); tx.value=st.drafts[x.id]||'';
  const wc=()=>{const n=countWords(tx.value);const w=$('#wrWc',el);w.innerHTML=`<b>${n}</b> / ${target} từ`;w.classList.toggle('ok',n>=target);};
  wc();
  tx.oninput=()=>{wc();st.drafts[x.id]=tx.value;clearTimeout(WR_saveT);$('#wrSaved',el).textContent='Đang lưu...';
    WR_saveT=setTimeout(()=>{WR_saveT=null;touch('main');const s=$('#wrSaved',el);if(s)s.textContent='Đã lưu bản nháp';},900);};
  $('#wrBack',el).onclick=()=>{if(timer)timer.stop();flush();WR_home(el);window.scrollTo(0,0);};
  const drawTm=()=>{const box=$('#wrTm',el);
    box.innerHTML=`<button class="chip" data-tm="${WR_mins(x)*60}">${ic('timer')} ${WR_mins(x)} phút</button><button class="chip" data-tm="0" aria-pressed="true">Không giới hạn</button>`;
    $$('[data-tm]',box).forEach(b=>b.onclick=()=>{const s=+b.dataset.tm;if(!s)return;
      box.innerHTML=`<span class="timer-chip" id="wrTc">${ic('clock')} <span>${fmtTime(s)}</span></span><button class="btn ghost sm" id="wrTs">Dừng</button>`;
      timer=makeTimer(s,left=>{const c=$('#wrTc',el);if(!c){timer&&timer.stop();return;}$('span',c).textContent=fmtTime(left);c.classList.toggle('low',left<=180);},
        ()=>{toast('Hết giờ. Trong phòng thi bài sẽ bị thu lúc này. Bạn vẫn có thể viết nốt để luyện.',4200);});
      $('#wrTs',el).onclick=()=>{timer&&timer.stop();timer=null;drawTm();};
      tx.focus();});};
  drawTm();
  const out=$('#wrOut',el);
  const showModelOnly=text=>{
    out.innerHTML=`<div class="panel">${mcSay('calm','Bài đã được lưu. Hãy đọc bài mẫu và tự so sánh: bố cục, câu tổng quan, từ nối và cách dùng từ.',56)}
      <p class="note">${AI?'':'AI chấm bài cần đăng nhập (ở phần Cài đặt) và máy chủ có cấu hình AI. Khi có AI, bạn sẽ nhận band theo 4 tiêu chí và từng lỗi được sửa.'}</p></div>
      <div class="grid2 wr-cmp"><div class="panel"><h3>Bài của bạn</h3><div class="en-s wr-essay">${esc(text)}</div></div>
      <div class="panel"><h3>Bài mẫu</h3>${WR_models(x)}</div></div>`;
  };
  const run=async text=>{
    busy=true; const b=$('#wrSub',el); if(b)b.disabled=true;
    out.innerHTML=`<div class="panel wr-load">${mascot('idea',84)}<div><b>Jack đang chấm bài, khoảng 20-40 giây</b><p class="note">Bạn cứ để trang này mở. Bài nháp vẫn được giữ nguyên.</p><div class="wr-bar-ld"><i></i></div></div></div>`;
    out.scrollIntoView({behavior:'smooth',block:'start'});
    try{
      const r=await WR_grade(x,text); if(!el.isConnected)return;
      WR_saveHist(x,text,r);
      out.innerHTML=WR_resultHTML(x,text,r); WR_bindResult(out); drawHist();
      if(r.overall>=7&&typeof confetti==='function')confetti();
    }catch(e){ if(!el.isConnected)return;
      out.innerHTML=`<div class="panel">${mcSay('hmm',esc(aiError(e)),56)}<div class="row"><button class="btn primary" id="wrRetry">${ic('rotate-ccw')} Chấm lại</button><button class="btn" id="wrMod">Xem bài mẫu</button></div><p class="note">Bài của bạn vẫn còn trong ô viết.</p></div>`;
      $('#wrRetry',out).onclick=()=>run(text); $('#wrMod',out).onclick=()=>showModelOnly(text);
    }
    busy=false; const b2=$('#wrSub',el); if(b2)b2.disabled=false;
  };
  $('#wrSub',el).onclick=()=>{
    if(busy)return; const text=tx.value.trim(), n=countWords(text);
    if(n<50){toast(`Bài mới có ${n} từ. Viết ít nhất 50 từ rồi nộp nhé.`);tx.focus();return;}
    flush(); if(timer){timer.stop();timer=null;drawTm();}
    if(!awarded){award('write',1);awarded=true;}
    if(!AI){st.done[x.id]=st.done[x.id]||Date.now();touch('main');showModelOnly(text);out.scrollIntoView({behavior:'smooth',block:'start'});return;}
    run(text);
  };
  const drawHist=()=>{
    const hs=st.hist.filter(h=>h.id===x.id).reverse(), box=$('#wrHist',el); if(!box)return;
    box.innerHTML=hs.length?`<div class="panel"><h3>Lịch sử chấm đề này</h3><div class="wr-hl">${hs.map((h,i)=>`<button class="wr-hrow" data-hi="${i}"><span class="small muted">${WR_date(h.t)}</span><span class="wr-hrt">${h.words} từ</span><b>${fmtBand(h.r.overall)}</b></button>`).join('')}</div></div>`:'';
    $$('[data-hi]',box).forEach(b=>b.onclick=()=>{const h=hs[+b.dataset.hi];out.innerHTML=`<div class="spread"><span class="label">Bài chấm ngày ${WR_date(h.t)}</span></div>`+WR_resultHTML(x,h.text,h.r);WR_bindResult(out);out.scrollIntoView({behavior:'smooth',block:'start'});});
  };
  drawHist();
  if(showHist){const h=WR_lastHist(x.id);if(h){out.innerHTML=WR_resultHTML(x,h.text,h.r);WR_bindResult(out);}}
}

/* ---------- 60-minute exam ---------- */
window.WR_exam=async(el,{onDone}={})=>{
  el.innerHTML=`<div class="view"><p class="note">Đang chuẩn bị đề...</p></div>`;
  try{await WR_load();}catch(e){el.innerHTML=`<div class="view"><p class="empty">Chưa tải được đề Writing.</p></div>`;onDone&&onDone(null);return;}
  const st=WR_st();
  const choose=arr=>{const fresh=arr.filter(x=>!st.done[x.id]);return pick(fresh.length?fresh:arr);};
  const t1=choose(examType()==='general'?WR_D.t1g:WR_D.t1a), t2=choose(WR_D.t2), tasks=[t1,t2];
  const texts=['',''];let cur=0, timer=null, ended=false;
  const prevLeave=window.__leave; window.__leave=()=>{if(timer)timer.stop();prevLeave&&prevLeave();};
  el.innerHTML=`<div class="view wr-exam">
    <div class="spread wr-xh"><div><h2>Thi thử Writing</h2><p class="note">60 phút cho cả hai phần. Nên dành 20 phút cho Task 1 và 40 phút cho Task 2.</p></div>
      <span class="timer-chip" id="wxT">${ic('clock')} <span>60:00</span></span></div>
    <div class="row wr-steps" role="tablist">${tasks.map((x,i)=>`<button class="chip wr-sc" data-s="${i}" aria-pressed="${i===0}">Task ${i+1} <span class="small muted" id="wxC${i}">0/${WR_target(x)}</span></button>`).join('')}</div>
    ${tasks.map((x,i)=>`<div class="wr-task wr-xp" data-p="${i}" ${i?'hidden':''}>
      <section class="wr-pa panel"><div class="label">Task ${i+1}${x._k==='t1g'?' · thư '+esc((WR_TONE_VI[x.tone]||'').toLowerCase()):''}</div>${WR_promptHTML(x)}${x._k==='t1a'?WR_chartSVG(x.chart):''}</section>
      <section class="wr-wa panel"><div class="spread wr-bar"><span class="wr-wc" id="wxW${i}"><b>0</b> / ${WR_target(x)} từ</span></div>
        <textarea class="wr-tx en-s" id="wxX${i}" spellcheck="false" autocomplete="off" aria-label="Bài viết Task ${i+1}"></textarea>
        <div class="row">${i===0?`<button class="btn" data-go="1">Sang Task 2 ${ic('chevron-right')}</button>`:`<button class="btn" data-go="0">${ic('chevron-left')} Về Task 1</button>`}<button class="btn primary wx-sub">Nộp bài</button></div></section>
    </div>`).join('')}
    <div id="wxOut"></div></div>`;
  const show=i=>{cur=i;$$('.wr-xp',el).forEach(p=>p.hidden=+p.dataset.p!==i);$$('.wr-sc',el).forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.s===i)));window.scrollTo(0,0);};
  $$('.wr-sc',el).forEach(b=>b.onclick=()=>show(+b.dataset.s));
  $$('[data-go]',el).forEach(b=>b.onclick=()=>show(+b.dataset.go));
  tasks.forEach((x,i)=>{const tx=$('#wxX'+i,el);const key='x:'+x.id;tx.value=st.drafts[key]||'';
    const upd=()=>{texts[i]=tx.value;const n=countWords(tx.value),t=WR_target(x);const w=$('#wxW'+i,el);w.innerHTML=`<b>${n}</b> / ${t} từ`;w.classList.toggle('ok',n>=t);$('#wxC'+i,el).textContent=n+'/'+t;};
    upd(); tx.oninput=()=>{upd();st.drafts[key]=tx.value;clearTimeout(WR_saveT);WR_saveT=setTimeout(()=>{WR_saveT=null;touch('main');},1200);};});
  timer=makeTimer(3600,left=>{const c=$('#wxT',el);if(!c||!el.isConnected){timer&&timer.stop();return;}$('span',c).textContent=fmtTime(left);c.classList.toggle('low',left<=300);},()=>{toast('Hết 60 phút. Bài được nộp tự động.',3500);finish();});
  $$('.wx-sub',el).forEach(b=>b.onclick=()=>{const n2=countWords(texts[1]);
    if(!b.dataset.sure&&(countWords(texts[0])<WR_target(tasks[0])||n2<WR_target(tasks[1]))){b.dataset.sure='1';b.textContent='Chưa đủ số từ. Bấm lần nữa để nộp';return;}
    finish();});
  async function finish(){
    if(ended)return; ended=true; if(timer)timer.stop();
    if(WR_saveT){clearTimeout(WR_saveT);WR_saveT=null;}
    tasks.forEach((x,i)=>{delete st.drafts['x:'+x.id];if(countWords(texts[i])>=50)award('write',1);st.done[x.id]=st.done[x.id]||Date.now();});
    touch('main');
    $$('.wr-xp,.wr-steps,.wr-xh .timer-chip',el).forEach(n=>n.hidden=true);
    const out=$('#wxOut',el); window.scrollTo(0,0);
    const cont=band=>{const b=$('#wxDone',el);if(b)b.onclick=()=>{window.__leave=prevLeave||null;onDone&&onDone(band);};};
    const modelsOnly=(msg)=>{out.innerHTML=`<div class="panel">${mcSay('calm',msg,56)}</div>
      ${tasks.map((x,i)=>`<div class="grid2 wr-cmp"><div class="panel"><h3>Task ${i+1}: bài của bạn</h3><div class="en-s wr-essay">${esc(texts[i])||'<span class="muted">(bỏ trống)</span>'}</div></div><div class="panel"><h3>Task ${i+1}: bài mẫu</h3>${WR_models(x)}</div></div>`).join('')}
      <div class="row"><button class="btn primary" id="wxDone">Tiếp tục</button></div>`;cont(null);};
    if(!AI){modelsOnly('Đã nộp bài. AI chấm bài cần đăng nhập và máy chủ có cấu hình AI, nên lần này bạn hãy tự so sánh với bài mẫu.');return;}
    const grade=async()=>{
      out.innerHTML=`<div class="panel wr-load">${mascot('idea',84)}<div><b>Jack đang chấm bài, khoảng 20-40 giây</b><p class="note">Đang chấm cả hai phần, có thể lâu hơn một chút.</p><div class="wr-bar-ld"><i></i></div></div></div>`;
      try{
        const rs=[];
        for(let i=0;i<2;i++){
          if(countWords(texts[i])<20){rs.push({bands:{ta:countWords(texts[i])?2:0,cc:countWords(texts[i])?2:0,lr:countWords(texts[i])?2:0,gra:countWords(texts[i])?2:0},overall:countWords(texts[i])?2:0,summary:'Bài quá ngắn hoặc bỏ trống nên không thể chấm theo tiêu chí, chỉ tính điểm tối thiểu.',strengths:[],improve:['Luôn viết đủ số từ tối thiểu, dù chưa hoàn hảo.'],corrections:[],better:''});continue;}
          rs.push(await WR_grade(tasks[i],texts[i]));
        }
        if(!el.isConnected)return;
        rs.forEach((r,i)=>WR_saveHist(tasks[i],texts[i],r));
        const band=Math.round(((rs[0].overall+2*rs[1].overall)/3)*2)/2;
        recordScore({skill:'writing',band,title:'Thi thử Writing 60 phút',detail:{t1:rs[0].overall,t2:rs[1].overall}});
        out.innerHTML=`<div class="panel wr-xres"><div class="wr-ovr"><div class="wr-ovb"><span class="label">Band Writing</span><span class="band-big">${fmtBand(band)}</span></div><div class="wr-sum">${mascot(band>=7?'yay':band>=6?'ok':'hmm',64)}<p>Task 1 được ${fmtBand(rs[0].overall)}, Task 2 được ${fmtBand(rs[1].overall)}. Task 2 tính gấp đôi Task 1 khi ra band Writing.</p></div></div>
          <div class="row"><button class="btn primary" id="wxDone">Tiếp tục</button></div></div>
          ${subTabs('wxRt',[['0','Kết quả Task 1'],['1','Kết quả Task 2']],'0',k=>drawR(+k))}<div id="wxR"></div>`;
        const drawR=k=>{$$('#wxRt [data-t]',el).forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.t===k)));const box=$('#wxR',el);box.innerHTML=`<div class="view">${WR_resultHTML(tasks[k],texts[k],rs[k])}</div>`;WR_bindResult(box);};
        drawR(0); cont(band);
        if(band>=7&&typeof confetti==='function')confetti();
      }catch(e){ if(!el.isConnected)return;
        out.innerHTML=`<div class="panel">${mcSay('hmm',esc(aiError(e)),56)}<div class="row"><button class="btn primary" id="wxRetry">${ic('rotate-ccw')} Chấm lại</button><button class="btn" id="wxSkip">Xem bài mẫu và bỏ qua</button></div><p class="note">Bài viết của bạn vẫn được giữ trong trang này.</p></div>`;
        $('#wxRetry',out).onclick=grade; $('#wxSkip',out).onclick=()=>modelsOnly('Không chấm được bằng AI lần này. Hãy tự so sánh với bài mẫu.');
      }
    };
    grade();
  }
};
