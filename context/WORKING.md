# 세션 컨텍스트 - 2025-12-17T13:46:00+09:00

## 현재 세션 개요
- **메인 태스크/기능**: API Key 입력 제거, OpenAI(GPT-5.2) 전환, PDF 파싱 개선, 원가 에디터 로직 수정
- **세션 지속 시간**: 약 2시간
- **현재 상태**: 기능 구현 완료 및 로컬 테스트 중 (Vercel Dev 환경)

## 최근 활동 (최근 30-60분)
- **방금 수행한 작업**: 
  - `CostEditor`의 '원가(합계)' 필드를 읽기 전용으로 변경하고 자동 계산 로직 강화.
  - PDF 파싱 방식을 '이미지 변환'에서 '텍스트 추출'로 변경하여 대용량/다페이지 처리 안정성 확보.
  - `pdfjs-dist` 워커 로딩 에러(Vite 호환성) 수정.
  - `.env` 파일 설정 가이드 및 적용.
- **현재 해결 중인 문제**: 원가 데이터의 정합성(수량x횟수x단가 = 합계) 보장 및 UI UX 개선.
- **작업 중인 파일**: `components/editor/CostEditor.tsx`, `services/common.ts`, `api/analyze.ts`
- **테스트 상태**: PDF 업로드 및 파싱 성공, 원가 계산 로직 정상 작동 확인.

## 주요 기술적 결정 사항
- **아키텍처 결정**: 
  - 클라이언트 사이드 API 호출 -> Vercel Serverless Function (`/api/analyze`)으로 이동하여 보안 강화.
  - PDF 처리: 브라우저 부하 및 API 페이로드 제한을 고려하여 '이미지 변환' 대신 '텍스트 추출' 방식 채택.
- **구현 방식**: 
  - `pdfjs-dist`를 사용하여 브라우저에서 텍스트 추출 후 서버로 전송.
  - 데이터 정규화(`normalizeData`) 단계에서 누락된 단가/합계를 역산하여 채워넣는 로직 추가.
- **기술 선정**: OpenAI `gpt-5.2` (가성비 및 성능 고려), `pdfjs-dist` (PDF 처리).
- **성능/보안 고려사항**: API Key는 서버 환경변수로만 관리. 대용량 PDF 처리 시 텍스트만 추출하여 토큰 비용 및 전송량 절감.

## 코드 컨텍스트
- **수정된 파일**:
  - `api/analyze.ts`: OpenAI API 연동 (GPT-5.2), 텍스트/이미지 입력 처리.
  - `services/backendService.ts`: (구 geminiService) 백엔드 API 호출 로직.
  - `services/common.ts`: PDF 텍스트 추출(`extractTextFromPdf`), 데이터 정규화 및 계산 로직(`normalizeData`).
  - `components/editor/CostEditor.tsx`: 원가 합계 읽기 전용 처리.
  - `.env`: API Key 설정.
- **새로운 패턴**: 서버리스 함수를 통한 AI API 중계.
- **의존성**: `openai`, `pdfjs-dist` 추가. `@google/genai` 제거(예정).
- **설정 변경**: `vercel.json` (기본값), `.env` 파일 생성.

## 현재 구현 상태
- **완료됨**: 
  - API Key 입력 UI 제거.
  - OpenAI GPT-5.2 연동.
  - PDF 텍스트 추출 및 파싱.
  - 원가 에디터 자동 계산 및 읽기 전용 UI.
- **진행 중**: 로컬 테스트 및 엣지 케이스 확인.
- **차단됨**: 없음.
- **다음 단계**: Vercel 배포 및 실사용 테스트.

## 핸드오프를 위한 중요 컨텍스트
- **환경 설정**: 
  - 로컬 실행 시 `vercel dev` 필수 (Serverless Function 실행 위해).
  - 루트 디렉토리에 `.env` 파일 필요 (`OPENAI_API_KEY=...`).
- **실행/테스트 방법**: `vercel dev` 실행 후 `localhost:3000` 접속.
- **알려진 문제**: 암호화된 PDF는 텍스트 추출 불가할 수 있음 (에러 처리 됨).
- **외부 의존성**: OpenAI API.

## 대화 흐름
- **원래 목표**: 사용자 API Key 입력 단계 제거.
- **변천 과정**: 
  - Gemini -> OpenAI로 모델 변경 요청.
  - PDF 파싱 이슈(이미지 변환 실패/용량 초과) -> 텍스트 추출로 변경.
  - 원가 에디터 UX(직접 입력 vs 자동 계산) 논의 후 자동 계산으로 확정.
- **배운 점/인사이트**: 여행 견적서 PDF는 텍스트 추출만으로도 GPT-5.2가 충분히 구조를 파악함.
- **고려했던 대안**: PDF -> 이미지 변환 (용량/속도 문제로 기각).
