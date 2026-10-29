'use strict';
(async ()=>{
 const C=window.KPICore, $ = id => document.getElementById(id);
 let rows = C.SAMPLE.map((r,i)=>({...r,id:'sample-'+i})), options = {};
 let supabase = null;
 let currentUser = null;

 // Supabase 초기화 및 모드 판단
 const isDbConfigured = typeof window.KPI_CONFIG !== 'undefined' && window.KPI_CONFIG.supabaseUrl && window.KPI_CONFIG.supabaseUrl !== 'PLACEHOLDER';
 
 if (isDbConfigured) {
   supabase = window.supabase.createClient(window.KPI_CONFIG.supabaseUrl, window.KPI_CONFIG.supabasePublishableKey);
   $('mode-label').textContent = 'DB 모드 (연결 대기중)';
   $('mode-detail').textContent = '실제 데이터베이스와 동기화됩니다.';
   $('mode-label').style.color = '#2e7d32'; // 초록색
 } else {
   $('mode-label').textContent = '샘플 모드 · DB 미연결';
   $('mode-detail').textContent = 'config.js에 유효한 연결 값이 없어 가상 데이터를 사용합니다. (저장 불가)';
   $('mode-label').style.color = '#ad2737'; // 붉은색
   if($('auth-section')) $('auth-section').hidden = true;
 }

 const fmt=v=>BigInt(v).toLocaleString('ko-KR');
 function selectOptions(id,values){const el=$(id),selected=el.value;if(!el)return;el.replaceChildren(new Option('전체',''));[...new Set(values)].sort().forEach(v=>el.add(new Option(v,v)));if([...el.options].some(o=>o.value===selected))el.value=selected;}
 
 function draw(){
  const data=rows.filter(r=>(!$('filter-month').value||r.month===$('filter-month').value)&&(!$('filter-team').value||r.team===$('filter-team').value)&&(!$('filter-user').value||r.user_id===$('filter-user').value));
  const total=C.summarize(data);
  if($('total-target')) $('total-target').textContent=fmt(total.target)+'원';
  if($('total-actual')) $('total-actual').textContent=fmt(total.actual)+'원';
  if($('total-rate')) $('total-rate').textContent=total.rate;
  if($('total-count')) $('total-count').textContent=total.count+'건';
  
  if($('rows')) $('rows').replaceChildren();
  if($('chart')) $('chart').replaceChildren();
  if($('empty')) $('empty').hidden=!!data.length;
  if($('owner-head')) $('owner-head').hidden=!options.showOwner;
  if($('action-head')) $('action-head').hidden=!options.editable;
  
  if($('rows')) {
      for(const r of data){const tr=document.createElement('tr');
       const cells=[r.month,r.team,fmt(r.target),fmt(r.actual),C.summarize([r]).rate];
       if(options.showOwner)cells.push(r.user_id||'샘플');
       for(const value of cells){const td=document.createElement('td');td.textContent=value;tr.append(td);}
       if(options.editable){const td=document.createElement('td');for(const [label,handler] of [['삭제',options.onDelete]]){const b=document.createElement('button');b.textContent=label;b.type='button';b.disabled=!!options.busy;b.onclick=()=>handler?.(r);td.append(b);}tr.append(td);}
       $('rows').append(tr);
      }
  }
  
  if($('chart')) {
      for(const team of [...new Set(data.map(r=>r.team))]){
       const summary=C.summarize(data.filter(r=>r.team===team)),bar=document.createElement('div');bar.className='barrow';
       const label=document.createElement('span');label.textContent=team;
       const track=document.createElement('div');track.className='track';const fill=document.createElement('div');fill.className='fill';
       fill.style.width=(summary.rate==='목표 미설정'?0:Math.min(100,Number(summary.rate.slice(0,-1))))+'%';track.append(fill);
       const rate=document.createElement('span');rate.textContent=summary.rate;bar.append(label,track,rate);$('chart').append(bar);
      }
  }
 }
 
 function setRows(next,opts={}){rows=next;options=opts;
  if($('filter-month')) selectOptions('filter-month',rows.map(r=>r.month));
  if($('filter-team')) selectOptions('filter-team',rows.map(r=>r.team));
  if($('filter-user')) selectOptions('filter-user',rows.map(r=>r.user_id||'샘플'));
  if($('user-filter-label')) $('user-filter-label').hidden=!options.showOwner;
  draw();
 }

 // DB 데이터 로드 함수 (본인 행만 조회)
 async function loadData() {
     if (!isDbConfigured || !currentUser) return;
     // RLS로 인해 자동으로 본인 데이터만 반환됨
     const { data, error } = await supabase.from('kpi_records').select('*').order('month', { ascending: false });
     if (error) {
         console.error('데이터 로드 실패:', error);
         alert('데이터를 불러오지 못했습니다.');
     } else {
         const mappedData = data.map(d => ({
             ...d,
             target: d.target_amount,
             actual: d.actual_amount
         }));
         // DB 모드에서는 삭제 가능하도록 options 전달
         setRows(mappedData, { showOwner: true, editable: true, onDelete: deleteRecord });
     }
 }

 // 데이터 추가 로직
 async function saveRecord() {
     if (!isDbConfigured || !currentUser) {
         alert("DB 연결 및 로그인이 필요합니다.");
         return;
     }
     
     const month = $('input-month').value; // YYYY-MM
     const team = $('input-team').value;
     const target = $('input-target').value;
     const actual = $('input-actual').value;

     try {
         // core.js의 규칙을 재사용하여 유효성 검증
         const validRecord = C.validateRecord({ month, team, target, actual });
         
         // Supabase 저장 호출
         const { data, error } = await supabase.from('kpi_records').insert([{
             user_id: currentUser.id,
             month: validRecord.month,
             team: validRecord.team,
             target_amount: validRecord.target,
             actual_amount: validRecord.actual
         }]).select(); // 저장 결과 응답 요청

         if (error) {
             if (error.code === '23505') throw new Error("이미 해당 월/부서에 데이터가 존재합니다.");
             throw error;
         }
         
         alert("저장 성공!");
         // 저장 후 응답으로 확인 및 화면 갱신 (재조회)
         await loadData();
         
         // 입력폼 초기화
         $('input-month').value = '';
         $('input-team').value = '';
         $('input-target').value = '';
         $('input-actual').value = '';

     } catch (err) {
         alert("저장 실패: " + err.message);
     }
 }

 // 데이터 삭제 로직
 async function deleteRecord(record) {
     if (!isDbConfigured || !currentUser || !record.id) return;
     if (!confirm(`${record.month} ${record.team} 데이터를 삭제하시겠습니까?`)) return;

     const { error } = await supabase.from('kpi_records').delete().eq('id', record.id);
     if (error) {
         alert("삭제 실패: " + error.message);
     } else {
         await loadData(); // 재조회로 갱신
     }
 }

 // 인증 상태 관리
 if (isDbConfigured) {
     supabase.auth.onAuthStateChange((event, session) => {
         currentUser = session?.user || null;
         if (currentUser) {
             if($('logged-out-view')) $('logged-out-view').hidden = true;
             if($('logged-in-view')) $('logged-in-view').hidden = false;
             if($('user-email-display')) $('user-email-display').textContent = currentUser.email;
             if($('input-panel')) $('input-panel').hidden = false; // 로그인 시 입력 폼 표시
             $('mode-label').textContent = 'DB 모드 (연결 및 로그인 됨)';
             loadData(); // 로그인 시 본인 데이터 재조회
         } else {
             if($('logged-out-view')) $('logged-out-view').hidden = false;
             if($('logged-in-view')) $('logged-in-view').hidden = true;
             if($('user-email-display')) $('user-email-display').textContent = '';
             if($('input-panel')) $('input-panel').hidden = true;
             $('mode-label').textContent = 'DB 모드 (로그인 대기중)';
             // 로그아웃 시 샘플로 복귀 (자동 저장/DB 갱신 없음)
             setRows(C.SAMPLE.map((r,i)=>({...r,id:'sample-'+i})), { showOwner: false, editable: false });
         }
     });

     if($('btn-login')) $('btn-login').onclick = async () => {
         const email = $('auth-email').value;
         const password = $('auth-password').value;
         const { error } = await supabase.auth.signInWithPassword({ email, password });
         if (error) alert('로그인 실패: ' + error.message);
     };

     if($('btn-signup')) $('btn-signup').onclick = async () => {
         const email = $('auth-email').value;
         const password = $('auth-password').value;
         const { error } = await supabase.auth.signUp({ email, password });
         if (error) alert('가입 실패: ' + error.message);
         else alert('가입 성공! 이메일 인증을 확인하거나 바로 로그인하세요.');
     };

     if($('btn-logout')) $('btn-logout').onclick = async () => {
         await supabase.auth.signOut();
     };
 }

 // 이벤트 리스너 바인딩
 if($('filter-month')) $('filter-month').onchange=draw;
 if($('filter-team')) $('filter-team').onchange=draw;
 if($('filter-user')) $('filter-user').onchange=draw;
 if($('filter-reset')) $('filter-reset').onclick=()=>{
     for(const id of ['filter-month','filter-team','filter-user']) { if($(id)) $(id).value=''; }
     draw();
 };
 if($('btn-save')) $('btn-save').onclick = saveRecord;
 
 window.KPIDashboard={setRows,draw, loadData, saveRecord};
 
 // 초기 상태 처리
 if (!isDbConfigured) {
    setRows(rows, { showOwner: false, editable: false });
 }
})();
