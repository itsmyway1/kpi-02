// 가상 샘플 데이터. 실제 수치가 아닙니다. 고객지원 5~6월은 '목표 0' 사례입니다.
(function (root) {
  const K = (root.KPI = root.KPI || {});
  const months = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const series = {
    영업: { target: [120, 120, 130, 130, 140, 140], actual: [112, 125, 128, 141, 133, 96] },
    마케팅: { target: [80, 80, 90, 90, 100, 100], actual: [85, 70, 92, 88, 104, 71] },
    생산: { target: [300, 300, 320, 320, 340, 340], actual: [291, 305, 318, 330, 322, 240] },
    고객지원: { target: [0, 0, 60, 60, 60, 60], actual: [48, 52, 58, 63, 66, 41] },
  };
  const rows = [];
  Object.keys(series).forEach((dept) =>
    months.forEach((month, i) =>
      rows.push({ id: 'sample-' + (rows.length + 1), month, dept, target: series[dept].target[i], actual: series[dept].actual[i] })
    )
  );
  K.sampleData = rows;
  if (typeof module !== 'undefined') module.exports = rows;
})(typeof window !== 'undefined' ? window : globalThis);
