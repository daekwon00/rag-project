# Phase 2 - Step 01: 대화 히스토리 기반 검색

## 목표
- 최근 대화 맥락을 활용하여 RAG 검색 정확도 향상

## 작업 항목
- [x] 최근 3쌍 (user + assistant) 메시지를 맥락으로 활용
- [x] 맥락 강화 쿼리 생성 (augmented query)
- [x] `findRelevantContent` 함수에 context 파라미터 추가
- [x] 하위호환 유지 (number 인자 vs object 인자)

## 완료 조건
- 후속 질문 시 이전 대화 맥락 반영된 검색 결과

## 참고
- 커밋: `e92345f`
- Agent Teams 2차 (conv-search)
