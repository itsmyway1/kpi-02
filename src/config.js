// 실행 설정. 기본은 샘플 모드(가상 데이터, DB 접근 없음).
// Supabase로 전환하려면 mode를 'supabase'로 바꾸고 아래 두 값을 채우세요. (README 참고)
(function (root) {
  const K = (root.KPI = root.KPI || {});
  K.config = {
    mode: 'sample',        // 'sample' | 'supabase'
    supabaseUrl: '',       // 예: https://xxxx.supabase.co
    supabaseAnonKey: '',   // anon(public) 키만. service_role 키는 절대 넣지 마세요.
    table: 'kpi_records',
  };
})(typeof window !== 'undefined' ? window : globalThis);
