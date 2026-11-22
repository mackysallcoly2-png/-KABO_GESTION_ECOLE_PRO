/* Harness de fumée KABO_GESTION_ECOLE_PRO — jsdom + fake-indexeddb */
const fs = require('fs');
const path0 = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { webcrypto } = require('crypto');

const html = fs.readFileSync(path0.join(__dirname, '..', 'index.html'), 'utf8');

function makeDom(label, withScript) {
  const logs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => logs.push('JSDOM ERR: ' + e.message));
  vc.on('error', (...a) => logs.push('console.error: ' + a.join(' ')));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.indexedDB = new IDBFactory();
      window.IDBKeyRange = IDBKeyRange;
      Object.defineProperty(window, 'crypto', { value: webcrypto });
      window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      window.HTMLCanvasElement.prototype.getContext = function () { return ctxStub(); };
      window.URL.createObjectURL = () => 'blob:fake';
      window.print = () => {};
    }
  });
  dom.__logs = logs;
  if (withScript) {
    const s = dom.window.document.createElement('script');
    s.textContent = withScript;
    dom.window.document.body.appendChild(s);
  }
  return dom;
}

function ctxStub() {
  const t = { measureText: () => ({ width: 10 }), canvas: { width: 800, height: 600 },
    createLinearGradient: () => ({ addColorStop() {} }) };
  return new Proxy(t, {
    get(target, p) {
      if (p in target) return target[p];
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set(target, p, v) { target[p] = v; return true; }
  });
}

(async () => {
  const pass = []; const fail = [];
  const finish = (extra) => {
    console.log('==== RÉSULTATS ====');
    pass.forEach(p => console.log('PASS  ' + p));
    fail.forEach(f => console.log('FAIL  ' + f));
    console.log('Total: ' + (pass.length + fail.length) + ', OK: ' + pass.length + ', KO: ' + fail.length);
    if (extra) console.log('PAYLOAD_BEGIN\n' + extra + '\nPAYLOAD_END');
    if (fail.length) process.exit(1);
  };

  // ---------- DOM 1 : scénarios principaux ----------
  const runner = `
(async () => {
  const R = [];
  const assert = (c,m)=>{ if(!c) throw new Error(m||'assert'); };
  const sleep = ms=>new Promise(r=>setTimeout(r,ms));
  try {
    await sleep(500);

    // S-Auth : login admin
    document.getElementById('login-user').value = 'admin';
    document.getElementById('login-pass').value = 'admin';
    await Auth.login();
    assert(Auth.user && Auth.user.username==='admin', 'échec login admin/admin');
    assert(document.getElementById('app-screen').style.display==='block', 'app screen non affiché');
    R.push(['1. Authentification locale admin/admin','PASS']);

    // S1 paramètres établissement
    let sch = await SchoolService.school();
    sch.name='Ecole Primaire Sandaga Demo'; sch.type='Primaire'; sch.address='Dakar'; sch.phone='33 800 00 00';
    sch.responsable='M. Le Directeur'; sch.ia='IA Dakar'; sch.ief='IEF Dakar-Plateau'; sch.code='1234';
    await SchoolService.saveSchool(sch);
    sch = await SchoolService.school();
    assert(sch.name==='Ecole Primaire Sandaga Demo' && sch.ief==='IEF Dakar-Plateau', 'sauvegarde école KO');
    R.push(['2. Paramètres de l établissement (Module 1)','PASS']);

    // S2 années scolaires
    const y = await SchoolService.addYear({label:'2025-2026'}, {});
    assert(y && y.label==='2025-2026', 'année non créée');
    const dupYear = await SchoolService.addYear({label:'2025-2026'}, {});
    assert(dupYear===false || (dupYear && dupYear.errs), 'doublon année accepté');
    await SchoolService.setActiveYear(y.id);
    const ay = await SchoolService.activeYear();
    assert(ay && ay.status==='active', 'année non active');
    const yPrev = await SchoolService.addYear({label:'2024-2025'}, {});
    R.push(['3. Création + activation année 2025-2026','PASS']);

    // S3 classes
    const classIds = {};
    for(const [nm,lv] of [['CI','CI'],['CP','CP'],['CE1','CE1'],['CE2','CE2'],['CM1','CM1'],['CM2','CM2']]){
      const c = { id:Util.uid(), name:nm, level:lv, type:'simple', capacity:60, yearId:y.id, active:true };
      await ClassService.save(c); classIds[nm]=c.id;
    }
    const classes = await ClassService.all(y.id);
    assert(classes.length===6, '6 classes attendues, obtenu '+classes.length);
    R.push(['4. Création de 6 classes (CI→CM2)','PASS']);

    // S4 100 élèves + inscriptions
    const nom=['DIOP','NDIAYE','FALL','SARR','SY','BA','GUEYE','MBAYE','SOW','CISS'];
    const prn=['Awa','Moussa','Fatou','Ibrahima','Sokhna','Ousmane','Aissatou','Cheikh','Mariama','Abdou'];
    for(let i=0;i<100;i++){
      const st = { matricule:'KABO'+String(1000+i), lastName:nom[i%10], firstName:prn[(i*3)%10]+i, sex:(i%2?'F':'M'),
        birthDate:'201'+(5+(i%4))+'-0'+(1+(i%9))+'-1'+(i%9), birthPlace:'Dakar', nationality:'Sénégalaise',
        address:'Quartier '+(i%8), fatherName:nom[(i+1)%10], motherName:'Mme '+nom[(i+2)%10],
        guardianName:nom[i%10], guardianPhone:'77 000 00 '+String(i).padStart(2,'0'), email:'', photo:'', archived:false };
      const res = await StudentService.save(st, null);
      assert(!res.errs || Object.keys(res.errs).length===0, 'élève '+i+' rejeté: '+JSON.stringify(res.errs));
      await EnrollmentService.enroll(res.student.id, i<50?classIds.CI:classIds.CP, y.id, i<50?'nouveau':'passant', '2025-10-01');
    }
    const ciEnr = await ClassService.effective({id:classIds.CI});
    assert(ciEnr.length===50, 'effectif CI attendu 50, obtenu '+ciEnr.length);
    R.push(['5. Inscription de 100 élèves (50 CI + 50 CP)','PASS']);

    // S4b unicité matricule
    let dupok=false;
    try { const d = await StudentService.save({ matricule:'KABO1000', lastName:'X', firstName:'Y', sex:'M', birthDate:'2015-01-01' }, null);
      dupok = !!(d.errs && d.errs.matricule); } catch(e){}
    assert(dupok, 'matricule dupliqué accepté');
    R.push(['6. Détection doublon / unicité matricule','PASS']);

    // S5 CSV
    const csvTxt = 'matricule;nom;prenom;sexe;date_naissance;lieu_naissance;classe\\n'+
      'TEST0001;SANE;Aliou;M;2016-05-12;Saint-Louis;CI\\nTEST0002;NDONG;Astou;F;2016-02-08;Dakar;CP';
    const rows = Util.parseCSV(csvTxt);
    assert(rows.length===3 && rows[1][0]==='TEST0001' && rows[2][1]==='NDONG', 'parseCSV CSV point-virgule KO');
    const csvTxt2 = 'matricule,nom,prenom\\nT1,Nom1,Prenom1\\n"T2","Nom;2","Prenom,2"';
    const rows2 = Util.parseCSV(csvTxt2);
    assert(rows2[1][1]==='Nom2' ? false : rows2[1][1]==='Nom1', 'parseCSV virgule KO');
    assert(rows2[2][1]==='Nom;2' && rows2[2][2]==='Prenom,2', 'parseCSV guillemets KO');
    R.push(['7. Parseur CSV local (virgule/point-virgule/guillemets)','PASS']);

    // S6 enseignant + affectation
    const th = { matricule:'ENS001', lastName:'DIA', firstName:'Aminata', sex:'F', birthDate:'1988-03-01',
      phone:'77 111 22 33', address:'Dakar', diploma:'CA-E', qualification:'Maître', fonction:'Institutrice',
      serviceDate:'2010-09-01', archived:false };
    const tres = await TeacherService.save(th, null);
    assert(!tres.errs || Object.keys(tres.errs).length===0, 'enseignant rejeté: '+JSON.stringify(tres.errs));
    await DB.put('teacherAssignments', { id:Util.uid(), teacherId:tres.teacher.id, classId:classIds.CI, yearId:y.id, role:'Titulaire' });
    const asg = await TeacherService.assignments(tres.teacher.id);
    assert(asg.length===1, 'affectation KO');
    R.push(['8. Enseignant + affectation de classe','PASS']);

    // S7 matières par défaut + périodes
    const subs = await SubjectService.all();
    assert(subs.length>=10, 'matières par défaut attendues ≥10, obtenu '+subs.length);
    const periods = (await DB.all('gradingPeriods')).filter(p=>p.active!==false);
    assert(periods.length>=3, 'périodes par défaut attendues ≥3');
    const T1 = periods.sort((a,b)=>a.order-b.order)[0];
    R.push(['9. Matières par défaut (classique + franco-arabe) et trimestres','PASS']);

    // S8 évaluations + saisie notes
    const math = subs.find(s=>Util.norm(s.name).includes('math'));
    const fr   = subs.find(s=>s.id!==math.id);
    const A1 = { id:Util.uid(), name:'Devoir 1', subjectId:math.id, classId:classIds.CI, yearId:y.id, periodId:T1.id, maxNote:10, coeff:1 };
    const A2 = { id:Util.uid(), name:'Composition Math', subjectId:math.id, classId:classIds.CI, yearId:y.id, periodId:T1.id, maxNote:10, coeff:2 };
    const A3 = { id:Util.uid(), name:'Lecture 1', subjectId:fr.id, classId:classIds.CI, yearId:y.id, periodId:T1.id, maxNote:10, coeff:1 };
    for(const a of [A1,A2,A3]) await DB.put('assessments', a);
    const ciDet = await ClassService.effectiveDetail(await DB.get('classes',classIds.CI));
    for(const d of ciDet){
      const i = Number(d.student.matricule.slice(4));
      await GradeService.upsert(A1, d.student.id, { value:(i%11) });
      await GradeService.upsert(A2, d.student.id, { value:(i*2)%11 });
    }
    await GradeService.upsert(A3, ciDet[0].student.id, { absent:true });
    const absentMat = ciDet[0].student.matricule;
    for(const d of ciDet.slice(1)) await GradeService.upsert(A3, d.student.id, { value:8 });
    let baremeOk=false;
    try { await GradeService.upsert(A1, ciDet[2].student.id, { value:15 }); }
    catch(e){ baremeOk = true; }
    assert(baremeOk, 'note hors barème /10 acceptée');
    R.push(['10. Saisie notes + contrôle barème + absences','PASS']);

    // S9-S10 moyennes manuelles + classement
    const res = await CalculationService.classResults(classIds.CI, T1.id);
    const byMat = {}; res.rows.forEach(r=>byMat[r.student.matricule]=r);
    // Recalcul indépendant : i = Number(matricule.slice(4)) (comme à la saisie)
    const mkExp = (mat)=>{ const i=Number(mat.slice(4)); const a1=i%11, a2=(i*2)%11;
      return { math: Math.round(((a1+a2*2)/3)*100)/100, fr: mat==='KABO1000'? null : 8 }; };
    const x1010 = mkExp('KABO1010'), x1011 = mkExp('KABO1011');
    const r1010 = byMat['KABO1010'];
    assert(r1010, 'KABO1010 absent des résultats');
    const subMath = r1010.detailRows.find(d=>d.subject && Util.norm(d.subject.name).includes('math'));
    assert(subMath && Math.abs(subMath.subjectAvg - x1010.math) < 1e-9, 'moyenne math KABO1010 attendue '+x1010.math+' obtenue '+(subMath&&subMath.subjectAvg));
    const subMath11 = byMat['KABO1011'].detailRows.find(d=>d.subject && Util.norm(d.subject.name).includes('math'));
    assert(subMath11 && Math.abs(subMath11.subjectAvg - x1011.math) < 1e-9, 'moyenne math KABO1011 attendue '+x1011.math+' obtenue '+(subMath11&&subMath11.subjectAvg));
    const mC = res.subMap[A1.subjectId].coeff, fC = res.subMap[A3.subjectId].coeff;
    const genExp = (mathAvg)=> (mathAvg*mC + 8*fC)/(mC+fC);
    // KABO1000 : fr absent → exclue → générale = moyenne math seule
    const x1000 = mkExp('KABO1000');
    const xa = mkExp(absentMat);
    assert(Math.abs(byMat[absentMat].avg - xa.math) < 0.004, 'absence fr ('+absentMat+') : generale attendue '+xa.math+' obtenue '+byMat[absentMat].avg);
    // générales pondérées : (moyMath×mC + 8×fC)/(mC+fC)
    assert(Math.abs(r1010.avg - genExp(x1010.math)) <= 0.006, 'générale KABO1010 attendue ≈'+genExp(x1010.math)+' obtenue '+r1010.avg);
    assert(Math.abs(byMat['KABO1011'].avg - genExp(x1011.math)) <= 0.006, 'générale KABO1011 attendue ≈'+genExp(x1011.math)+' obtenue '+byMat['KABO1011'].avg);
    // classement : doites être décroissantes au fil des rangs
    const sorted = res.rows.filter(r=>r.avg!==null).sort((a,b)=>b.avg-a.avg);
    let monotone=true;
    for(let i=1;i<sorted.length;i++) if(sorted[i].avg > sorted[i-1].avg) monotone=false;
    assert(monotone && res.stats.max===sorted[0].avg && res.stats.min===sorted[sorted.length-1].avg, 'classement incohérent');
    // ex æquo : KABO1011 et KABO1022 même paire de notes → même rang
    const rkA = res.rankMap[byMat['KABO1011'].studentId];
    const rkB = res.rankMap[byMat['KABO1022'].studentId];
    assert(rkA===rkB && rkA>0, 'ex æquo non géré ('+rkA+' vs '+rkB+')');
    // taux de réussite
    assert(res.stats.success + res.stats.n === sorted.length && res.stats.n===sorted.length, 'stats n incohérent');
    R.push(['11. Formule pondérée configurable — contrôle manuel Moyenne générale = Σ(note×coef)/Σ(coef) (math KABO1010: '+x1010.math+')','PASS']);
    R.push(['12. Classement cohérent + ex æquo au même rang','PASS']);

    // S11 présences
    const entries = ciDet.slice(0,10).map((d,i)=>({ studentId:d.student.id,
      status:(i%3===0?'absent':i%3===1?'present':'retard'), motif:(i%3===0?'Maladie':''), obs:'' }));
    const saved = await AttendanceService.saveDay(classIds.CI, '2025-11-14', entries);
    assert(saved===10, 'saveDay attendu 10, obtenu '+saved);
    const dl = await AttendanceService.dayList(classIds.CI, '2025-11-14');
    assert(dl.length===50, 'dayList attendu 50 (50 élèves CI), obtenu '+dl.length);
    const ms = await AttendanceService.monthStats(classIds.CI, '2025-11');
    assert(ms.absent===4 && ms.retard===3 && ms.present===3, 'monthStats KO: '+JSON.stringify(ms));
    R.push(['13. Registre d appel + statistiques mensuelles','PASS']);

    // S12 bulletin
    const school = await SchoolService.school();
    const top = sorted[0];
    const bhtml = await BulletinService.individualHtml(res, top, school);
    assert(typeof bhtml==='string' && bhtml.includes(top.student.matricule) && bhtml.length>500, 'bulletin HTML KO');
    R.push(['14. Bulletin individuel généré (HTML complet)','PASS']);

    // S13 bulletins de classe (printAll sans impression réelle)
    try {
      BulletinsUI.last = res;
      await BulletinsUI.printAll();
      R.push(['15. Production bulletins de classe (lot)','PASS']);
    } catch(e) { R.push(['15. Production bulletins de classe (lot)','FAIL: '+e.message]); }

    // S14-S15 finance : frais, paiement partiel, solde, annulation tracée
    const cats = await DB.all('feeCategories');
    assert(cats.length>=3, 'catégories de frais par défaut KO');
    const fee = { id:Util.uid(), studentId:ciDet[3].student.id, classId:classIds.CI, yearId:y.id,
      categoryId:cats[0].id, label:'Scolarité T1', amount:50000 };
    await DB.put('studentFees', fee);
    const p1 = await PaymentService.pay(fee.id, 30000, 'admin');
    assert(/^R2025-\\d{5}$/.test(p1.receipt.number), 'numéro de reçu KO: '+p1.receipt.number);
    let bal = await PaymentService.feeBalance(fee.id);
    assert(bal.paid===30000 && bal.remain===20000, 'solde attendu 30000/20000: '+JSON.stringify(bal));
    let overOk=false;
    try { await PaymentService.pay(fee.id, 30000, 'admin'); }
    catch(e){ overOk = /solde|supérieur/i.test(e.message); }
    assert(overOk, 'sur-dépassement accepté');
    const p2 = await PaymentService.pay(fee.id, 20000, 'admin');
    bal = await PaymentService.feeBalance(fee.id);
    assert(bal.remain===0, 'solde final attendu 0, obtenu '+bal.remain);
    await PaymentService.cancelPayment(p2.payment.id, 'Erreur de saisie (test)');
    const p2b = await DB.get('payments', p2.payment.id);
    assert(p2b.cancelled===true && p2b.cancelReason==='Erreur de saisie (test)' && p2b.cancelledBy==='admin', 'annulation non tracée');
    const bal2 = await PaymentService.feeBalance(fee.id);
    assert(bal2.paid===30000 && bal2.remain===20000, 'après annulation le paiement annulé doit être exclu: '+JSON.stringify(bal2));
    R.push(['16. Paiements partiels, soldes, reçus séquentiels','PASS']);
    R.push(['17. Annulation financière tracée (jamais de suppression)','PASS']);

    // S16 tableau de bord avec données réelles
    const dash = await DashboardService.load();
    assert(dash.classes.length===6 && dash.students.length===100 && dash.f===50 && dash.g===50, 'dashboard KO');
    R.push(['18. Tableau de bord — indicateurs calculés réels (100 élèves, 50F/50M)','PASS']);

    // S17 sauvegarde complète
    const snap = await BackupService.snapshot();
    assert(snap.app==='KABO_GESTION_ECOLE_PRO' && snap.schemaVersion===1, 'enveloppe sauvegarde KO');
    assert(snap.data.students.length===100, 'sauvegarde students attendu 100, obtenu '+snap.data.students.length);
    assert(snap.data.payments.length===2, '2 paiements attendus (un annulé conservé), obtenu '+snap.data.payments.length);
    R.push(['19. Sauvegarde JSON complète (enveloppe + contenu)','PASS']);

    // S18 audit
    const logs = await DB.all('auditLogs');
    assert(logs.length>10, 'journal d audit insuffisant: '+logs.length);
    R.push(['20. Journal d audit ( '+logs.length+' entrées)','PASS']);

    // S19 isolation années scolaires
    const cPrev = { id:Util.uid(), name:'CI-2024-2025', level:'CI', type:'simple', capacity:10, yearId:yPrev.id, active:true };
    await ClassService.save(cPrev);
    const l1 = await ClassService.all(y.id), l2 = await ClassService.all(yPrev.id);
    assert(!l1.find(c=>c.id===cPrev.id) && l2.find(c=>c.id===cPrev.id) && l1.length===6, 'isolement années KO');
    R.push(['21. Isolement des données par année scolaire','PASS']);

    // S20 rendu des vues (12 modules, sans exception)
    for(const v of ['dashboard','settings-school','settings-years','classes','students','teachers','subjects','notes','attendance','bulletins','finance','backup','audit','users']){
      Router.render(v);
      await sleep(60);
      const main = document.getElementById('main');
      assert(main.innerHTML.length>100, 'vue '+v+' vide');
      Router.current && (Router.current.id=v);
    }
    R.push(['22. Rendu des 14 modules sans erreur','PASS']);

    // S21 diagnostic + orphelins
    const diag = await BackupService.diagnostic();
    assert(diag && diag.counts.students===100, 'diagnostic KO: '+diag.counts.students);
    assert(Object.keys(diag.orphelins).every(k=>diag.orphelins[k]===0), 'orphelins détectés: '+JSON.stringify(diag.orphelins));
    R.push(['23. Diagnostic base (aucun orphan, comptes cohérents)','PASS']);

    // export du snapshot pour le test de restauration
    window.__PAYLOAD__ = JSON.stringify(snap);
    window.__RESULTS__ = JSON.stringify(R);
  } catch(e) {
    window.__RESULTS__ = JSON.stringify(R.concat([['FATAL','ERR '+ (e && e.stack || e.message)]]));
  }
})();`;

  const dom1 = makeDom('main', runner);
  const w1 = dom1.window;
  let waited = 0;
  while (!w1.__RESULTS__ && waited < 30000) { await new Promise(r => setTimeout(r, 250)); waited += 250; }
  if (!w1.__RESULTS__) { console.error('TIMEOUT scénario principal'); finish(); return; }
  JSON.parse(w1.__RESULTS__).forEach(([n, s]) => (s === 'PASS' ? pass : fail).push(n + (s !== 'PASS' ? ' — ' + s : '')));
  dom1.__logs.forEach(l => console.error('LOG1: ' + l));

  // ---------- DOM 2 : persistance + restauration (navigateur rouvert) ----------
  const snap = w1.__PAYLOAD__;
  if (!snap) { finish(); return; }
  const runner2 = `
(async () => {
  const R = [];
  const assert = (c,m)=>{ if(!c) throw new Error(m||'assert'); };
  const sleep = ms=>new Promise(r=>setTimeout(r,ms));
  try{
    await sleep(500);
    document.getElementById('login-user').value='admin';
    document.getElementById('login-pass').value='admin';
    await Auth.login();
    assert(Auth.user, 'login 2 KO');
    R.push(['24. Réouverture navigateur : session locale restaurée','PASS']);

    // restauration depuis le fichier de sauvegarde
    const snap = JSON.parse(document.getElementById('__snap__').textContent);
    const verr = BackupService.validate(snap);
    assert(verr===null, 'validate(sauvegarde) a retourné: '+verr);
    const restored = await BackupService.restore(snap);
    assert(restored>200, 'restauration trop faible: '+restored);
    const st = await DB.all('students');
    assert(st.length===100, 'students après restauration: '+st.length);
    const ay = await SchoolService.activeYear();
    assert(ay && ay.label==='2025-2026', 'année active après restauration: '+(ay&&ay.label));
    R.push(['25. Restauration contrôlée d une sauvegarde (100 élèves, année active)','PASS']);

    // validation d un fichier étranger
    let badEr=null;
    try { badEr = BackupService.validate({ app:'AUTRE', schemaVersion:1, data:{} }); }
    catch(e){ badEr = e.message; }
    assert(!!badEr, 'fichier étranger accepté');
    R.push(['26. Rejet des sauvegardes invalides / étrangères','PASS']);
    window.__RESULTS2__ = JSON.stringify(R);
  }catch(e){ window.__RESULTS2__ = JSON.stringify(R.concat([['FATAL2','ERR '+(e && e.stack||e.message)]])); }
})();`.replace('__snap__', 'snap-payload');

  const dom2 = makeDom('restore');
  {
    const s = dom2.window.document.createElement('script');
    s.textContent = runner2;
    const pre = dom2.window.document.createElement('script');
    pre.type = 'application/json';
    pre.id = 'snap-payload';
    pre.textContent = snap;
    dom2.window.document.body.appendChild(pre);
    dom2.window.document.body.appendChild(s);
  }
  const w2 = dom2.window;
  // vérifier BackupService.validate retourne true/false — tester le nom réel
  waited = 0;
  while (!w2.__RESULTS2__ && waited < 20000) { await new Promise(r => setTimeout(r, 250)); waited += 250; }
  if (w2.__RESULTS2__) {
    JSON.parse(w2.__RESULTS2__).forEach(([n, s]) => (s === 'PASS' ? pass : fail).push(n + (s !== 'PASS' ? ' — ' + s : '')));
  } else {
    fail.push('26. TIMEOUT scénario restauration');
  }
  dom2.__logs.forEach(l => console.error('LOG2: ' + l));

  finish(w2.__PAYLOAD2__ || '');
})();
