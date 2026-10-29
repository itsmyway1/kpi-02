// 데이터 읽기·저장 계층. 화면은 repo.list() / repo.add(record)만 호출합니다.
// 샘플 저장소는 메모리에만 두며 어떤 DB·네트워크에도 접근하지 않습니다.
(function (root) {
  const K = (root.KPI = root.KPI || {});
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // simulate: 'error' | 'empty' | undefined — 화면 상태 확인용(주소창 ?sample=error)
  function createSampleRepository(opts) {
    const simulate = opts && opts.simulate;
    const rows = simulate === 'empty' ? [] : K.sampleData.map((r) => Object.assign({}, r));
    return {
      mode: 'sample',
      async list() {
        await delay(250);
        if (simulate === 'error') throw new Error('샘플 오류 시뮬레이션입니다. 데이터를 읽지 못했습니다.');
        return rows.map((r) => Object.assign({}, r));
      },
      async add(record) {
        await delay(150);
        const saved = Object.assign({ id: 'sample-new-' + (rows.length + 1) }, record);
        rows.push(saved); // 메모리에만 반영
        return Object.assign({}, saved);
      },
    };
  }

  // Supabase(REST) 어댑터. 기본 설정에서는 쓰이지 않으며, 연결 전이라 실제 호출은 검증되지 않았습니다.
  function createSupabaseRepository(cfg) {
    const base = cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + cfg.table;
    const headers = { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + cfg.supabaseAnonKey, 'Content-Type': 'application/json' };
    const norm = (r) => ({ id: String(r.id), month: r.month, dept: r.dept, target: Number(r.target), actual: Number(r.actual) });
    return {
      mode: 'supabase',
      async list() {
        const res = await fetch(base + '?select=id,month,dept,target,actual&order=month.asc,dept.asc', { headers });
        if (!res.ok) throw new Error('Supabase에서 데이터를 읽지 못했습니다. (HTTP ' + res.status + ')');
        return (await res.json()).map(norm);
      },
      async add(record) {
        const res = await fetch(base, { method: 'POST', headers: Object.assign({ Prefer: 'return=representation' }, headers), body: JSON.stringify(record) });
        if (!res.ok) throw new Error('Supabase에 저장하지 못했습니다. (HTTP ' + res.status + ')');
        return norm((await res.json())[0]);
      },
    };
  }

  function createRepository(cfg, opts) {
    if (cfg.mode === 'supabase') {
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('Supabase 설정(URL, anon 키)이 비어 있습니다. src/config.js를 확인하세요.');
      return createSupabaseRepository(cfg);
    }
    return createSampleRepository(opts);
  }

  K.repository = { createRepository, createSampleRepository, createSupabaseRepository };
  if (typeof module !== 'undefined') module.exports = K.repository;
})(typeof window !== 'undefined' ? window : globalThis);
