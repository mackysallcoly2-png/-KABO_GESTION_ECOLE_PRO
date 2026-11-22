/* Test de volume — jsdom + fake-indexeddb (fs contraintes headless) */
const fs = require('fs');
const path0 = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { webcrypto } = require('crypto');
const html = fs.readFileSync(path0.join(__dirname, "..", "index.html"), "utf8");

function ctxStub(){ const t={measureText:()=>({width:10}),canvas:{width:8,height:6},createLinearGradient:()=>({addColorStop(){}})};
  return new Proxy(t,{get(o,p){ if(p in o) return o[p]; return typeof p==='string'?()=>undefined:undefined;}, set(o,p,v){o[p]=v;return true;}}); }

function makeDom(){
  const vc = new VirtualConsole(); const errs=[];
  vc.on('jsdomError', e=>errs.push(e.message)); vc.on('error', (...a)=>errs.push(a.join(' ')));
  const dom = new JSDOM(html, { runScripts:'dangerously', url:'http://localhost/', pretendToBeVisual:true, virtualConsole:vc,
    beforeParse(w){
      w.indexedDB = new IDBFactory(); w.IDBKeyRange = IDBKeyRange;
      Object.defineProperty(w,'crypto',{value:webcrypto});
      w.matchMedia = w.matchMedia || (()=>({matches:false,addListener(){},addEventListener(){},removeListener(){},removeEventListener(){}}));
      w.HTMLCanvasElement.prototype.getContext = function(){ return ctxStub(); };
      w.URL.createObjectURL=()=> 'blob:x'; w.print=()=>{};
    }});
  dom.__errs = errs; return dom;
}

const runner = `
(async ()=>{
  const out={ N:__N__ };
  const T0 = Date.now();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  await sleep(500);
  document.getElementById('login-user').value='admin';
  document.getElementById('login-pass').value='admin';
  await Auth.login();
  const t1 = Date.now();
  const y = await SchoolService.addYear({label:'2025-2026'},{});
  await SchoolService.setActiveYear(y.id);
  const c = { id:Util.uid(), name:'CI', level:'CI', type:'simple', capacity:10000, yearId:y.id, active:true };
  await ClassService.save(c);
  const nom=['DIOP','NDIAYE','FALL','SARR','SY','BA','GUEYE','MBAYE','SOW','CISS'];
  const prn=['Awa','Moussa','Fatou','Ibrahima','Sokhna','Ousmane','Aissatou','Cheikh','Mariama','Abdou'];
  out.enrollMs = 0;
  const ids=[];
  for(let i=0;i<__N__;i++){
    const st = { matricule:'P'+String(i).padStart(6,'0'), lastName:nom[i%10], firstName:prn[(i*3)%10]+i, sex:(i%2?'F':'M'),
      birthDate:'2015-0'+(1+(i%9))+'-15', birthPlace:'Dakar', nationality:'Sénégalaise', address:'', fatherName:nom[i%10], motherName:nom[(i+1)%10],
      guardianName:nom[i%10], guardianPhone:'', email:'', photo:'', archived:false };
    const r = await StudentService.save(st, null);
    await EnrollmentService.enroll(r.student.id, c.id, y.id, 'nouveau', '2025-10-01');
    ids.push(r.student.id);
  }
  const t2 = Date.now(); out.enrollMs = t2-t2+0; out.enrollMs = t2 - (t1 + 0);
  const subs = await SubjectService.all();
  const periods = (await DB.all('gradingPeriods')).filter(p=>p.active!==false).sort((a,b)=>a.order-b.order);
  const T1 = periods[0];
  const A = { id:Util.uid(), name:'Composition', subjectId:subs[0].id, classId:c.id, yearId:y.id, periodId:T1.id, maxNote:10, coeff:1 };
  await DB.put('assessments', A);
  const t3 = Date.now();
  let dbg=null; for(let k=0;k<ids.length;k++){ const sid=ids[k], val=(k*7)%11; try{ await GradeService.upsert(A, sid, { value:val }); }catch(e){ dbg='DEBUG k='+k+' msg='+e.message; break; } } if(dbg){ window.__OUT__ = JSON.stringify({error:dbg}); window.__DONE__=true; return; }
  const t4 = Date.now(); out.gradeMs = t4-t3;
  const t5 = Date.now();
  const res = await CalculationService.classResults(c.id, T1.id);
  const t6 = Date.now(); out.resultsMs = t6-t5; out.nRanked = Object.keys(res.rankMap).length;
  const t7 = Date.now();
  await AttendanceService.saveDay(c.id, '2025-11-14', ids.slice(0,200).map((sid,i)=>({ studentId:sid, status:i%4===0?'absent':'present', motif:'', obs:'' })));
  const t8 = Date.now(); out.attDay200Ms = t8-t7;
  const t9 = Date.now();
  const snap = await BackupService.snapshot();
  const t10 = Date.now(); out.snapshotMs = t10-t9; out.snapshotKB = Math.round(JSON.stringify(snap).length/1024);
  const t11 = Date.now();
  const restored = await BackupService.restore(snap);
  const t12 = Date.now(); out.restoreMs = t12-t11; out.restored = restored;
  out.totalMs = t12 - T0;
  window.__OUT__ = JSON.stringify(out);
  window.__DONE__ = true;
})().catch(e=>{ window.__OUT__ = JSON.stringify({error: e && e.stack || e.message }); window.__DONE__=true; });
`;

const perf = async (n) => {
  const dom = makeDom();
  const s = dom.window.document.createElement('script');
  s.textContent = runner.replace(/__N__/g, String(n));
  // __N__ was templated already; patch occurrences of __N__ textually
  dom.window.document.body.appendChild(s);
  let w=0; while(!dom.window.__DONE__ && w<180000){ await new Promise(r=>setTimeout(r,300)); w+=300; }
  const o = dom.window.__OUT__ ? JSON.parse(dom.window.__OUT__) : {error:'timeout'};
  dom.__errs.forEach(e=>console.error('ERR:', e));
  return o;
};

(async ()=>{
  for(const n of [500, 1000, 5000]){
    const o = await perf(n);
    console.log(JSON.stringify(o));
  }
})();
