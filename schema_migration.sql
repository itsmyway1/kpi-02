-- 기존 DB 변경용 SQL (Migration)
-- 기존 kpi_records 테이블에 source_id 컬럼을 추가하고, 기존 데이터를 보존합니다.

-- 1. source_id 컬럼 추가 (데이터 출처 식별용, nullable)
ALTER TABLE kpi_records ADD COLUMN IF NOT EXISTS source_id VARCHAR(100);

-- 2. source_id에 대한 주석 (선택 사항)
COMMENT ON COLUMN kpi_records.source_id IS '데이터 유입 출처 (예: excel_import_v1, manual_entry). 동일 사용자의 동일 출처 데이터 중복 관리 등에 활용';
