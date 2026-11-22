/* Génère DONNEES_DEMO.json : snapshot complet via l'application elle-même */
const fs = require('fs');
const path0 = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { webcrypto } = require('crypto');
const html = fs.readFileSync(path0.join(__dirname, "..", "index.html"), "utf8");

function ctxStub(){ const t={measureText:()=>({width:10}),canvas:{width:8,height:6},createLinearGradient:()=>({addColorStop(){}})};
  return new Proxy(t,{get(o,p){ if(p in o) return o[p]; return typeof p==='string'?()=>undefined:undefined;}, set(o,p,v){o[p]=v;return true;}}); }

const runner = `
(async ()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  try{
    await sleep(500);
    document.getElementById('login-user').value='admin';
    document.getElementById('login-pass').value='admin';
    await Auth.login();

    const sch = await SchoolService.school();
    sch.name='École Élémentaire Socé Demo'; sch.type='Primaire (enseignement classique + franco-arabe)';
    sch.address='Quartier Socé, Dakar'; sch.phone='33 820 00 00'; sch.email='contact@ecole-soce-demo.sn';
    sch.responsable='M. Amadou Diallo, Directeur'; sch.createdYear='1998';
    sch.ia='IA de Dakar'; sch.ief='IEF Dakar-Plateau'; sch.district='District de Dakar';
    sch.commune='Dakar'; sch.region='Dakar'; sch.code='0321'; sch.printRepublic=true;
    await SchoolService.saveSchool(sch);

    const y = await SchoolService.addYear({label:'2025-2026', startDate:'2025-10-01', endDate:'2026-07-04'}, {});
    await SchoolService.setActiveYear(y.id);

    const lvls=[['CI A','CI'],['CP A','CP'],['CE1 A','CE1'],['CE2 A','CE2'],['CM1 A','CM1'],['CM2 A','CM2']];
    const clsById={};
    for(const [nm,lv] of lvls){
      const c={ id:Util.uid(), name:nm, level:lv, type: 'Classe simple', capacity:60, yearId:y.id, active:true };
      await ClassService.save(c); clsById[nm]=c.id;
    }
    const clsAll = await ClassService.all(y.id);
    for(const c of clsAll){ if(c.name==='CI A'){ c.type='Classe multigrade'; c.multiLevels=['CP']; await DB.put('classes',c); } if(c.name==='CP A'){ c.type='Classe multigrade'; c.multiLevels=['CI']; await DB.put('classes',c); } }

    const nom=['DIOUF','NDIAYE','FALL','SARR','SY','BA','GUEYE','MBAYE','SOW','CISSÉ','DIAKHA','MANGA'];
    const prnF=['Awa','Fatou','Sokhna','Aïssatou','Mariama','Khady','Ndèye','Adja','Coumba','Rama','Aline','Yacine'];
    const prnM=['Ousmane','Ibrahima','Cheikh','Abdou','Moussa','Babacar','Serigne','Lamine','Abdoul','Pape','Modou','Boubacar'];
    const clsArr = await ClassService.all(y.id);
    const studs=[];
    const N=84;
    for(let i=0;i<N;i++){
      const cls = clsArr[Math.floor(i/14)];
      const sex = i%2?'F':'M';
      const st = { matricule:'K'+y.label.slice(0,4)+String(i+1).padStart(4,'0'),
        lastName:nom[i%12], firstName:(sex==='F'?prnF:prnM)[i%12], sex,
        birthDate: (2014+ (i%4)) + '-0'+(1+(i%9))+'-1'+(i%9), birthPlace:['Dakar','Thiès','Saint-Louis','Kaolack'][i%4],
        nationality:'Sénégalaise', address:'Quartier '+(1+(i%6)), email:'', photo:'',
        fatherName:nom[(i+2)%12] + ' ' + nom[i%12],
        motherName: prnF[(i+3)%12] + ' ' + nom[(i+5)%12],
        guardianName:'', guardianPhone:'', archived:false };
      st.guardianName = st.fatherName;
      st.guardianPhone = '77 ' + String(100+(i%900)).padStart(3,'0') + ' ' + String(10+(i%90)).padStart(2,'0') + ' ' + String(11+(i%88)).padStart(2,'0');
      const res = await StudentService.save(st, null);
      if(res.errs && Object.keys(res.errs).length) throw new Error('demo student '+i+': '+JSON.stringify(res.errs));
      await EnrollmentService.enroll(res.student.id, cls.id, y.id, i<12?'nouveau':(i%13===0?'redoublant':'passant'), '2025-10-02');
      studs.push(res.student);
    }

    // enseignants
    const tdata=[
      ['ENS001','DIA','Aminata','F'],['ENS002','KHARY','Moussa','M'],
      ['ENS003','THIAM','Bineta','F'],['ENS004','Cissé','Ibou','M'],
      ['ENS005','CAMARA','Safiatou','F'],['ENS006','FAYE','Omar','M']];
    const tids=[];
    for(let i=0;i<tdata.length;i++){
      const d=tdata[i];
      const t={ matricule:d[0]+'', lastName:d[1], firstName:d[2], sex:d[3], birthDate:'198'+(5+(i%4))+'-06-2'+(i%9),
        phone:'76 '+String(100+i*11).padStart(3,'0')+' 22 33', address:'Dakar', diploma:i%2?'CA-E':'CAP',
        qualification:i%2?'Maître':'Instituteur', fonction:'Instituteur', dateService:'200'+(8+i)+'-10-01',
        statut:i%3?'Fonctionnaire':'Vacataire', archived:false };
      const r=await TeacherService.save(t, null);
      if(r.errs && Object.keys(r.errs).length) throw new Error('teacher '+i+': '+JSON.stringify(r.errs));
      const asg={ id:Util.uid(), teacherId:r.teacher.id, classId:clsArr[i].id, yearId:y.id, role:'Titulaire' };
      await DB.put('teacherAssignments', asg);
      tids.push(r.teacher.id);
    }

    // évaluations T1 pour 3 classes + notes
    const periods = (await DB.all('gradingPeriods')).filter(p=>p.active!==false).sort((a,b)=>a.order-b.order);
    const T1=periods[0], T2=periods[1];
    const subs = await SubjectService.all();
    const math = subs.find(s=>Util.norm(s.name).includes('math'));
    const lcc  = subs.find(s=>s.id!==math.id);
    let seed = 7;
    const rnd = ()=>{ seed=(seed*73)%1009; return seed/1009; };
    for(const cls of clsArr.slice(0,3)){
      const det = await ClassService.effectiveDetail(cls);
      const A1={ id:Util.uid(), name:'Devoir 1', subjectId:math.id, classId:cls.id, yearId:y.id, periodId:T1.id, maxNote:10, coeff:1 };
      const A2={ id:Util.uid(), name:'Composition', subjectId:math.id, classId:cls.id, yearId:y.id, periodId:T1.id, maxNote:10, coeff:2 };
      const A3={ id:Util.uid(), name:'Dictée 1', subjectId:lcc.id, classId:cls.id, yearId:y.id, periodId:T1.id, maxNote:10, coeff:1 };
      for(const a of [A1,A2,A3]) await DB.put('assessments', a);
      for(const d of det){
        if(rnd()<0.07){ await GradeService.upsert(A2, d.student.id, { absent:true }); continue; }
        await GradeService.upsert(A1, d.student.id, { value: Math.round(2+rnd()*8) });
        await GradeService.upsert(A2, d.student.id, { value: Math.round(2+rnd()*8) });
        await GradeService.upsert(A3, d.student.id, { value: Math.round(2+rnd()*8) });
      }
    }
    // T2 pour CI A seulement
    {
      const cls = clsArr[0];
      const det = await ClassService.effectiveDetail(cls);
      const B1={ id:Util.uid(), name:'Devoir 2', subjectId:math.id, classId:cls.id, yearId:y.id, periodId:T2.id, maxNote:10, coeff:1 };
      await DB.put('assessments', B1);
      for(const d of det) await GradeService.upsert(B1, d.student.id, { value: Math.round(2+rnd()*8) });
    }

    // présences sur 3 jours de novembre
    for(const [cls, days] of [[clsArr[0],['2025-11-10','2025-11-11','2025-11-12']],[clsArr[1],['2025-11-10','2025-11-11']]]){
      const det = await ClassService.effectiveDetail(cls);
      for(const day of days){
        const entries = det.map((d,i)=>{
          const r = rnd();
          const status = r<0.06? 'absent' : r<0.12? 'retard' : (r<0.15? 'absent_justifie' : 'present');
          return { studentId:d.student.id, status, motif: status==='absent'?'Maladie':(status==='absent_justifie'?'Certificat médical':''), obs:'' };
        });
        await AttendanceService.saveDay(cls.id, day, entries);
      }
    }

    // frais et paiements
    const cats = await DB.all('feeCategories');
    const montants = { 'Inscription':15000, 'Scolarité (annuel)':90000, 'Cantine (annuel)':180000, 'Transport (annuel)':120000, 'Fournitures':7500, 'Autres frais':5000 };
    let fi=0;
    for(const st of studs){
      const enr = (await DB.byIndex('enrollments','yearId',y.id)).find(e=>e.studentId===st.id && e.active);
      if(!enr) continue;
      const fee = { id:Util.uid(), studentId:st.id, classId:enr.classId, yearId:y.id,
        categoryId:cats[fi%cats.length].id, label:Object.keys(montants)[fi%6], amount:Object.values(montants)[fi%6] };
      await DB.put('studentFees', fee);
      // paiement partiel ou total
      const amount = (fi%5===1)? Math.round(fee.amount/2) : fee.amount;
      if(amount>=25500) await PaymentService.pay(fee.id, amount, 'admin');
      fi++;
    }
    // une annulation tracée volontaire (démo)
    const allp = await DB.all('payments');
    if(allp.length>4){ await PaymentService.cancelPayment(allp[allp.length-1].id, 'Exemple : double encaissement corrigé (données de démonstration)'); }

    await Audit.log('INIT','schools',sch.id,'Jeu de données de démonstration généré');

    const snap = await BackupService.snapshot();
    window.__SNAP__ = JSON.stringify(snap, null, 2);
    window.__DONE__ = true;
  }catch(e){ window.__SNAP__ = 'ERROR '+(e && e.stack || e.message); window.__DONE__=true; }
})();
`;

const dom = new JSDOM(html, { runScripts:'dangerously', url:'http://localhost/', pretendToBeVisual:true,
  virtualConsole: (()=>{ const vc=new VirtualConsole(); vc.on('jsdomError',e=>console.error('JSDOM ERR:',e.message)); vc.on('error',(...a)=>console.error('ERR:',...a)); return vc; })(),
  beforeParse(w){
    w.indexedDB = new IDBFactory(); w.IDBKeyRange = IDBKeyRange;
    Object.defineProperty(w,'crypto',{value:webcrypto});
    w.matchMedia = w.matchMedia || (()=>({matches:false,addListener(){},addEventListener(){},removeListener(){},removeEventListener(){}}));
    w.HTMLCanvasElement.prototype.getContext = function(){ return ctxStub(); };
    w.URL.createObjectURL = ()=>'blob:x'; w.print = ()=>{};
  }});
const sEl = dom.window.document.createElement('script');
sEl.textContent = runner;
dom.window.document.body.appendChild(sEl);
(async ()=>{
  const w = dom.window;
  let t=0; while(!w.__DONE__ && t<60000){ await new Promise(r=>setTimeout(r,300)); t+=300; }
  if(!w.__SNAP__){ console.error('TIMEOUT done='+w.__DONE__+' snaphead='+(w.__SNAP__?String(w.__SNAP__).slice(0,100):'undefined')); process.exit(1); }
  const out = w.__SNAP__;
  if(out.startsWith('ERROR')){ console.error(out); process.exit(1); }
  fs.writeFileSync(path0.join(__dirname, '..', 'DONNEES_DEMO.json'), out);
  const snap = JSON.parse(out);
  console.log('OK stores:', Object.keys(snap.data).map(k=>k+':'+snap.data[k].length).join(', '));
})();
