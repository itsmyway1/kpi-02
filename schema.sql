-- KPI 대시보드 DB 스키마 설계
-- ※ 원본 항목: month(월), team(부서), target_amount(목표액), actual_amount(실적액)
-- ※ 추가 설계: UUID id, user_id, created_at, 제약조건, RLS (DB 연결을 위한 뼈대)
-- ※ 주의: 실제 DB에 실행하거나 기존 테이블에 덮어쓰지 마세요 (설계용 파일).

CREATE TABLE kpi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    month VARCHAR(7) NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    team VARCHAR(80) NOT NULL CHECK (char_length(team) > 0),
    target_amount BIGINT NOT NULL CHECK (target_amount >= 0),
    actual_amount BIGINT NOT NULL CHECK (actual_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, month, team) -- 같은 사용자/월/부서 중복 금지
);

-- Row Level Security (RLS) 활성화
ALTER TABLE kpi_records ENABLE ROW 세부 SECURITY;

-- 본인 행만 접근 가능한 보안 정책 추가
CREATE POLICY "Users can only access their own records"
    ON kpi_records
    FOR ALL
    USING (auth.uid() = user_id);
