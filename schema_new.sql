-- 새 교육용 DB 생성용 SQL (Full Schema)
-- ※ 주의: 처음 DB를 세팅할 때 1회만 실행하세요.

CREATE TABLE kpi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    month VARCHAR(7) NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    team VARCHAR(80) NOT NULL CHECK (char_length(trim(team)) > 0 AND char_length(trim(team)) <= 80),
    target_amount BIGINT NOT NULL CHECK (target_amount >= 0),
    actual_amount BIGINT NOT NULL CHECK (actual_amount >= 0),
    source_id VARCHAR(100), -- 데이터 출처 식별 (예: 엑셀 파일명, 수동 입력 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, month, team) -- 같은 사용자/월/부서 중복 금지
);

-- Row Level Security (RLS) 활성화
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;

-- 1. 본인 행만 조회 가능
CREATE POLICY "Users can view their own records"
    ON kpi_records FOR SELECT
    USING (auth.uid() = user_id);

-- 2. 본인 행만 추가 가능
CREATE POLICY "Users can insert their own records"
    ON kpi_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. 본인 행만 수정 가능
CREATE POLICY "Users can update their own records"
    ON kpi_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. 본인 행만 삭제 가능
CREATE POLICY "Users can delete their own records"
    ON kpi_records FOR DELETE
    USING (auth.uid() = user_id);
