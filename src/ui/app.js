// 화면 전용. 계산은 KPI.domain, 데이터 접근은 KPI.repository에만 맡깁니다.
(function (root) {
  const K = root.KPI, D = K.domain;
  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
  const state = { records: [], status: 'loading', error: '', filter: { month: 'all', dept: 'all' } };
  let repo;

  function el(tag, attrs, text) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach((k) => n.setAttribute(k, attrs[k]));
    if (text !== undefined) n.textContent = text; // 입력값은 항상 textContent로
    return n;
  }
  function fillSelect(sel, first, values, current) {
    sel.textContent = '';
    sel.appendChild(Object.assign(el('option', { value: 'all' }, first)));
    values.forEach((v) => sel.appendChild(el('option', { value: v }, v)));
    sel.value = values.indexOf(current) >= 0 ? current : 'all';
    return sel.value;
  }

  function renderState(ready, hasRows) {
    const box = $('state');
    box.textContent = ''; box.className = 'panel'; box.hidden = false;
    if (state.status === 'loading') {
      box.appendChild(el('p', {}, '데이터를 불러오는 중입니다…'));
    } else if (state.status === 'error') {
      box.classList.add('error');
      box.appendChild(el('p', {}, '데이터를 불러오지 못했습니다.'));
      box.appendChild(el('p', {}, state.error));
      const b = el('button', { type: 'button' }, '다시 불러오기'); b.addEventListener('click', load); box.appendChild(b);
    } else if (!state.records.length) {
      box.appendChild(el('p', {}, '아직 등록된 목표·실적이 없습니다.'));
      box.appendChild(el('p', {}, '아래 입력 폼에서 첫 항목을 추가하세요.'));
    } else if (!hasRows) {
      box.appendChild(el('p', {}, '선택한 월·부서에 해당하는 데이터가 없습니다.'));
      const b = el('button', { type: 'button', class: 'ghost' }, '필터 초기화'); b.addEventListener('click', resetFilters); box.appendChild(b);
    } else box.hidden = true;
  }

  function render() {
    const ready = state.status === 'ready';
    const f = state.filter;
    state.filter.month = fillSelect($('f-month'), '전체 월', D.uniqueSorted(state.records.map((r) => r.month), true), f.month);
    state.filter.dept = fillSelect($('f-dept'), '전체 부서', D.uniqueSorted(state.records.map((r) => r.dept)), f.dept);
    const rows = D.filterRecords(state.records, state.filter);
    const s = D.summarize(rows);
    const hasAny = ready && state.records.length > 0;

    renderState(ready, rows.length > 0);
    $('filters').hidden = !hasAny;
    $('summary').hidden = !hasAny;
    $('evidence').hidden = !(ready && rows.length > 0);
    $('entry').hidden = !ready;

    $('scope').textContent = '(' + (state.filter.month === 'all' ? '전체 월' : state.filter.month) + ', ' + (state.filter.dept === 'all' ? '전체 부서' : state.filter.dept) + ')';
    const rv = $('rate-value');
    rv.className = 'rate-value';
    let pct = 0;
    if (!rows.length) rv.textContent = '–';
    else if (s.rate === null) { rv.textContent = D.NOT_SET; rv.className = 'rate-value none'; }
    else { rv.textContent = D.formatRate(s.rate); pct = Math.min(s.rate, 120) / 120 * 100; }
    $('rate-fill').style.width = pct + '%';
    $('rate-bar').setAttribute('aria-label', '달성률 ' + rv.textContent);
    $('target-total').textContent = rows.length ? nf.format(s.target) : '–';
    $('actual-total').textContent = rows.length ? nf.format(s.actual) : '–';
    $('row-count').textContent = rows.length ? s.count + '행' : '–';

    const body = $('rows'); body.textContent = '';
    rows.slice().sort((a, b) => b.month.localeCompare(a.month) || a.dept.localeCompare(b.dept, 'ko')).forEach((r) => {
      const tr = el('tr');
      [['월', r.month, ''], ['부서', r.dept, ''], ['목표', nf.format(r.target), 'num'], ['실적', nf.format(r.actual), 'num'],
       ['달성률', D.formatRate(D.achievementRate(r.target, r.actual)), 'num']].forEach((c) =>
        tr.appendChild(el('td', { 'data-label': c[0], class: c[2] }, c[1])));
      body.appendChild(tr);
    });
    const foot = $('foot'); foot.textContent = '';
    if (rows.length) {
      const tr = el('tr');
      [['합계', s.count + '행', ''], ['부서', state.filter.dept === 'all' ? '전체' : state.filter.dept, ''], ['목표', nf.format(s.target), 'num'],
       ['실적', nf.format(s.actual), 'num'], ['달성률', D.formatRate(s.rate), 'num']].forEach((c) =>
        tr.appendChild(el('td', { 'data-label': c[0], class: c[2] }, c[1])));
      foot.appendChild(tr);
    }
    const dl = $('dept-list'); dl.textContent = '';
    D.uniqueSorted(state.records.map((r) => r.dept)).forEach((d) => dl.appendChild(el('option', { value: d })));
  }

  function resetFilters() { state.filter = { month: 'all', dept: 'all' }; render(); }

  async function load() {
    state.status = 'loading'; render();
    try { state.records = await repo.list(); state.status = 'ready'; }
    catch (e) { state.records = []; state.status = 'error'; state.error = e.message || '알 수 없는 오류'; }
    render();
  }

  function setMsg(text, kind) { const m = $('form-msg'); m.textContent = text; m.className = 'form-msg ' + (kind || ''); }

  function onSubmit(e) {
    e.preventDefault();
    const res = D.validateRecord({ month: $('i-month').value, dept: $('i-dept').value, target: $('i-target').value, actual: $('i-actual').value });
    ['month', 'dept', 'target', 'actual'].forEach((k) => {
      $('e-' + k).textContent = res.errors[k] || '';
      $('i-' + k).setAttribute('aria-invalid', res.errors[k] ? 'true' : 'false');
    });
    if (!res.ok) { setMsg('입력값을 확인하세요.', 'bad'); return; }
    const btn = $('add-btn'); btn.disabled = true; setMsg('저장하는 중…');
    repo.add(res.value).then((saved) => {
      state.records.push(saved);
      const visible = D.filterRecords([saved], state.filter).length > 0;
      setMsg(visible ? '항목을 추가했습니다.' : '항목을 추가했습니다. 현재 필터에서는 보이지 않으니 필터를 바꿔 확인하세요.', 'ok');
      $('i-target').value = ''; $('i-actual').value = '';
      render();
    }).catch((err) => setMsg('저장하지 못했습니다. ' + (err.message || ''), 'bad'))
      .then(() => { btn.disabled = false; });
  }

  function init() {
    const cfg = K.config;
    const sim = new URLSearchParams(location.search).get('sample'); // ?sample=error | ?sample=empty
    const badge = $('mode-badge'), note = $('mode-note');
    try { repo = K.repository.createRepository(cfg, { simulate: sim }); }
    catch (e) { state.status = 'error'; state.error = e.message; badge.textContent = '설정 오류'; render(); return; }
    if (repo.mode === 'sample') {
      badge.textContent = '샘플 모드';
      note.textContent = '가상 데이터입니다. 입력한 값은 이 화면 메모리에만 남고, 새로고침하면 사라지며 DB에는 저장되지 않습니다.';
    } else { badge.textContent = 'Supabase 연결'; badge.classList.add('live'); note.textContent = '입력한 값이 Supabase 테이블에 저장됩니다.'; }
    $('f-month').addEventListener('change', (e) => { state.filter.month = e.target.value; render(); });
    $('f-dept').addEventListener('change', (e) => { state.filter.dept = e.target.value; render(); });
    $('f-reset').addEventListener('click', resetFilters);
    $('filters').addEventListener('submit', (e) => e.preventDefault());
    $('add-form').addEventListener('submit', onSubmit);
    load();
  }
  document.addEventListener('DOMContentLoaded', init);
})(window);
