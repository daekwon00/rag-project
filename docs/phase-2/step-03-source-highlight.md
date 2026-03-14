# Phase 2 - Step 03: 출처 하이라이트

## 목표
- RAG 응답에서 참고한 문서 출처를 접이식 UI로 표시

## 작업 항목
- [x] API에서 출처 메타데이터를 `data` 채널로 전송 (Vercel AI SDK annotations)
- [x] 출처 데이터: index, source(파일명), content(청크 미리보기), similarity(유사도)
- [x] 어시스턴트 메시지 하단에 접이식 "참고 문서" 섹션
- [x] 파일명, 유사도 점수(%), 청크 원문 미리보기 표시
- [x] 다크 모드 대응

## 완료 조건
- 답변 하단에 접이식 출처 섹션 표시
- 출처 없는 경우 섹션 미표시

## 참고
- 커밋: `46e0f54`
- Agent Teams 3차 (source-highlight)
- `useChat`의 data 프로퍼티 활용
