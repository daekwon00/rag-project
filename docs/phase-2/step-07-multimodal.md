# Phase 2 - Step 07: 멀티모달 문서 지원

## 목표
- DOCX, PPTX 파일 업로드 및 텍스트 추출 지원

## 작업 항목
- [x] DOCX 지원: mammoth 라이브러리로 텍스트 추출
- [x] PPTX 지원: officeparser 라이브러리로 텍스트 추출
- [x] `app/api/ingest/route.ts`에 파일 타입별 파서 분기
- [x] 지원 파일 형식: PDF, TXT, MD, DOCX, PPTX

## 완료 조건
- DOCX, PPTX 파일 업로드 → 텍스트 추출 → 임베딩 저장

## 참고
- 커밋: `69d3500`
- Agent Teams 4차 병렬 작업
- `lib/mammoth.d.ts` 타입 선언 필요
