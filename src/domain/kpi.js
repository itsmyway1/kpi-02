// 계산·검증 전용. 화면(DOM)과 데이터 접근을 알지 못하는 순수 함수만 둡니다.
(function (root) {
  const K = (root.KPI = root.KPI || {});
  const NOT_SET = '목표 미설정';

  const sum = (rows, key) => rows.reduce((a, r) => a + r[key], 0);

  // 달성률(%) = 실적 합계 ÷ 목표 합계 × 100. 목표 합계가 0 이하이면 null(목표 미설정).
  function achievementRate(target, actual) {
    return target > 0 ? (actual / target) * 100 : null;
  }
  function formatRate(rate) {
    return rate === null ? NOT_SET : (Math.round(rate * 10) / 10).toFixed(1) + '%';
  }
  function filterRecords(records, f) {
    const month = f && f.month, dept = f && f.dept;
    return records.filter(
      (r) => (!month || month === 'all' || r.month === month) && (!dept || dept === 'all' || r.dept === dept)
    );
  }
  function summarize(rows) {
    const target = sum(rows, 'target'), actual = sum(rows, 'actual');
    return { target, actual, rate: achievementRate(target, actual), count: rows.length };
  }
  function uniqueSorted(values, desc) {
    const u = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'ko'));
    return desc ? u.reverse() : u;
  }

  // 입력 검증. 성공 시 value에 정규화된 레코드를 돌려줍니다.
  function validateRecord(input) {
    const errors = {};
    const month = String(input.month || '').trim();
    const dept = String(input.dept || '').trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) errors.month = '월을 YYYY-MM 형식으로 선택하세요.';
    if (!dept) errors.dept = '부서를 입력하세요.';
    else if (dept.length > 20) errors.dept = '부서명은 20자 이하로 입력하세요.';
    const num = (raw, label) => {
      const s = String(raw === undefined || raw === null ? '' : raw).trim();
      if (s === '') return [null, label + ' 값을 입력하세요.'];
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0) return [null, label + '은(는) 0 이상의 숫자여야 합니다.'];
      return [n, null];
    };
    const [target, te] = num(input.target, '목표');
    const [actual, ae] = num(input.actual, '실적');
    if (te) errors.target = te;
    if (ae) errors.actual = ae;
    const ok = Object.keys(errors).length === 0;
    return { ok, errors, value: ok ? { month, dept, target, actual } : null };
  }

  K.domain = { NOT_SET, achievementRate, formatRate, filterRecords, summarize, uniqueSorted, validateRecord };
  if (typeof module !== 'undefined') module.exports = K.domain;
})(typeof window !== 'undefined' ? window : globalThis);
