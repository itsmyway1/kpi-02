# KPI 대시보드 실습앱

## 파일 역할
* `index.html`: UI 구조 및 앱 진입점
* `style.css`: 화면 레이아웃 및 디자인
* `core.js`: 비즈니스 로직(계산, 값 검사) 및 샘플 데이터
* `app.js`: DOM 조작 및 이벤트 처리 로직
* `data/kpi.json`, `data/kpi.csv`: 가상 데이터 사본 (구조 참고용)
* `config.example.js`: 공개용 환경설정 자리표시자

## 실행법
로컬 환경에서 `index.html` 파일을 웹 브라우저로 직접 열어 실행할 수 있습니다.

## 샘플 환경과 DB 환경의 차이
* **샘플 환경**: 로컬 브라우저에서 `core.js`의 고정 데이터를 보여주며, 새로고침 시 초기화됩니다. 파일 기반 직접 실행 시 fetch 오류 방지를 위해 분리된 데이터 파일을 읽지 않고 하드코딩된 샘플을 사용합니다.
* **DB 환경**: 실제 서버와 통신하여 데이터를 영구적으로 저장/수정/삭제하며, 새로고침해도 데이터가 유지됩니다.

## GitHub에 올릴 파일 목록
* `index.html`, `style.css`, `core.js`, `app.js`
* `data/kpi.json`, `data/kpi.csv`
* `prd.md`, `schema.sql`, `검증체크리스트.md`, `README.md`, `config.example.js`
* (참고: API 키가 포함된 실제 `config.js` 파일은 Git에 올리지 않습니다.)
