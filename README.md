<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Travel Quote Digitizer

**AI 기반 여행 견적서 디지털화 도구**

하나투어(Hanatour)를 위한 스마트 견적 비서로, PDF, 이미지, 엑셀 등 다양한 형식의 여행 견적서 문서를 AI가 자동으로 분석하여 구조화된 데이터로 변환하고, 편집 후 전문적인 HTML 견적서를 생성합니다.

View your app in AI Studio: https://ai.studio/apps/drive/1d5HhywoHnemlEmBhk82QnKl1PH8vDCpz

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [데이터 구조](#데이터-구조)
- [시작하기](#시작하기)
- [사용 방법](#사용-방법)

## ✨ 주요 기능

### 1. 문서 업로드 및 AI 변환
- **다양한 파일 형식 지원**
  - PDF 문서 (`.pdf`)
  - 이미지 파일 (`.jpg`, `.png`)
  - 엑셀 파일 (`.xlsx`, `.xls`, `.csv`)
  - 텍스트 파일 (`.txt`)
- **Google Gemini AI 기반 자동 데이터 추출**
  - 견적 정보 (코드, 여행사명)
  - 여행 요약 (제목, 인원, 기간, 출발일, **국가/도시**)
  - 비용 상세 (총액, 통화, 포함/불포함 사항, 내부 원가)
  - **스마트 파싱**: 포함/불포함 사항의 서술형 문구를 핵심 명사로 자동 변환 및 리스트화
  - 일별 일정 (위치, 교통, 활동, 식사, 숙소)

### 2. 데이터 편집 및 관리
- **실시간 데이터 편집**
  - 견적 정보 수정
  - 여행 요약 정보 편집
  - 비용 및 원가 상세 관리
  - 일정 추가/삭제/수정
- **다중 통화 지원**
  - 여러 통화 동시 관리 (KRW, USD, SGD, RM 등)
  - 환율 설정 및 자동 환산
  - 내부 정산용 원가 계산
- **수익 관리 (Profit Margin)**
  - 각 항목별 원가(Cost)와 수익(Profit) 분리 입력
  - 총 합계(Total Sum) 자동 계산 (원가 + 수익)
- **여행 국가 및 도시 관리**
  - 태그(Tag) 형태의 직관적인 국가/도시 입력 UI
  - AI가 문서에서 국가와 도시 정보를 자동 추출
- **카테고리별 원가 관리**
  - 호텔, 차량, 가이드, 관광지, 식사, 기타
  - 항목별 상세 금액 입력 및 합계 계산
- **담당자 비고 (Manager Note)**
  - 견적서 상단에 노출될 담당자 코멘트 작성
  - 말풍선 스타일의 디자인으로 친근한 메시지 전달
- **일정 관리 편의성**
  - 여행 기간(박/일) 자동 계산 및 수동 수정 기능
  - 일정 추가/삭제 시 기간 자동 업데이트

### 3. 견적서 생성 및 출력
- **전문적인 HTML 견적서 생성**
  - 하나투어 브랜드 디자인 적용
  - 반응형 레이아웃
  - 인쇄 최적화
- **인쇄 및 PDF 저장**
  - 브라우저 인쇄 기능 활용
  - PDF로 저장 가능
  - HTML 파일 다운로드

## 🛠 기술 스택

- **프론트엔드**
  - React 18.2.0
  - TypeScript 5.2.2
  - Vite 5.2.0 (빌드 도구)
- **UI/스타일링**
  - Tailwind CSS (CDN)
  - Lucide React (아이콘)
- **AI 서비스**
  - Google Gemini API (`@google/genai`)
  - Gemini 2.5 Flash 모델
- **유틸리티**
  - SheetJS (XLSX) - 엑셀 파일 처리

## 📁 프로젝트 구조

```
travel-quote-digitizer/
├── App.tsx                    # 메인 애플리케이션 컴포넌트
│                              # - 상태 관리 (파일, 데이터, API 키)
│                              # - UI 레이아웃 (사이드바 + 메인 콘텐츠)
│                              # - API 키 모달 관리
│
├── index.tsx                  # React 애플리케이션 진입점
├── types.ts                   # TypeScript 타입 정의
│                              # - TravelQuoteData 인터페이스
│                              # - ParsingStatus enum
│
├── components/
│   ├── DataEditor.tsx        # 데이터 편집기 (핵심 컴포넌트)
│   │                          # - 견적 정보 편집
│   │                          # - 비용 및 원가 관리
│   │                          # - 일정 편집
│   │                          # - 환율 설정 및 계산
│   │
│   ├── FileUploader.tsx      # 파일 업로드 컴포넌트
│   │                          # - 드래그 앤 드롭 지원
│   │                          # - 파일 타입별 아이콘 표시
│   │
│   ├── DocumentPreview.tsx   # 원본 문서 미리보기
│   │                          # - 이미지/PDF 미리보기
│   │                          # - 엑셀 데이터 텍스트 추출
│   │
│   ├── JsonViewer.tsx        # JSON 뷰어
│   │                          # - 포맷팅된 JSON 표시
│   │                          # - 클립보드 복사 기능
│   │
│   ├── HanatourLogo.tsx      # 하나투어 로고 컴포넌트
│   ├── Dashboard.tsx          # 대시보드 (현재 미사용)
│   └── QuotePreview.tsx      # 견적서 미리보기 (현재 미사용)
│
├── services/
│   └── geminiService.ts      # Gemini API 통신 및 데이터 추출
│                              # - 파일을 Base64로 변환
│                              # - 엑셀 파일 파싱 (SheetJS)
│                              # - AI 프롬프트 및 스키마 정의
│                              # - 데이터 정규화 및 검증
│
└── utils/
    └── htmlGenerator.ts       # HTML 견적서 생성
                               # - 하나투어 브랜드 스타일 적용
                               # - 반응형 HTML 템플릿
                               # - 인쇄 최적화 CSS
```

## 📊 데이터 구조

### TravelQuoteData

```typescript
interface TravelQuoteData {
  quote_info: {
    code: string;        // 견적 코드
    agency: string;      // 여행사명
    manager_note?: string; // 담당자 비고
  };
  
  trip_summary: {
    title: string;       // 여행 상품명
    pax_adult: number;  // 성인 인원
    pax_child: number;  // 아동 인원
    period_text: string; // 기간 (예: "3박 5일")
    start_date: string;  // 출발일 (YYYY-MM-DD)
    countries?: string[]; // 여행 국가 (태그)
    cities?: string[];    // 여행 도시 (태그)
  };
  
  cost: {
    total_price: number;              // 총 견적 금액 (1인 기준, 고객용)
    currency: string;                 // 통화 (KRW, USD, SGD 등)
    inclusions: string[];             // 포함 사항
    exclusions: string[];             // 불포함 사항
    shopping_conditions: string;      // 쇼핑/옵션 조건
    details?: CostDetail[];          // 내부 정산용 원가 상세
    exchangeRates?: Record<string, number>; // 환율 정보
    internal_pax?: number;            // 내부 정산용 인원수 (구버전 호환)
    internal_pax_adult?: number;      // 내부 정산용 성인 인원
    internal_pax_child?: number;      // 내부 정산용 아동 인원
    show_details_in_quote?: boolean;  // 견적서에 상세 내역 포함 여부
  };
  
  itinerary: ItineraryItem[];        // 일별 일정
}

interface ItineraryItem {
  day: number;           // 일차
  location: string;      // 지역
  transport: string;     // 교통수단
  activities: string[];  // 활동 목록
  meals: {
    breakfast: string;   // 조식
    lunch: string;       // 중식
    dinner: string;       // 석식
  };
  hotel: string;         // 숙소명
}

interface CostDetail {
  category: string;      // 카테고리 (호텔, 차량, 가이드, 관광지, 식사, 기타)
  detail: string;        // 상세 항목
  currency: string;      // 통화
  amount: number;        // 원가 (Cost)
  profit?: number;       // 수익 (Profit)
  note?: string;         // 비고
}
```

## 🚀 시작하기

### Prerequisites

- Node.js (최신 LTS 버전 권장)

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **API 키 설정**
   - `.env.local` 파일을 생성하고 `GEMINI_API_KEY`를 설정하세요
   - 또는 앱 실행 후 모달에서 API 키를 입력할 수 있습니다
   - API 키는 브라우저 localStorage에 저장됩니다
   - [Google AI Studio](https://aistudio.google.com/app/apikey)에서 키 발급 가능

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **빌드**
   ```bash
   npm run build
   ```

5. **프리뷰**
   ```bash
   npm run preview
   ```

## 📖 사용 방법

### 1. 파일 업로드
- 좌측 사이드바의 "문서 업로드" 영역에 파일을 드래그 앤 드롭하거나 클릭하여 선택
- 지원 형식: PDF, 이미지, 엑셀, 텍스트 파일

### 2. AI 변환 실행
- "AI 분석 시작" 버튼 클릭
- AI가 문서를 분석하여 구조화된 데이터 추출 (최대 3분 소요)

### 3. 데이터 편집
- **데이터 편집** 탭: 시각적 편집기에서 모든 정보 수정
  - 기본 정보 및 비용 편집
  - 내부 정산용 원가 상세 관리
  - 환율 설정 및 자동 계산
  - 일정 추가/삭제/수정
- **JSON** 탭: JSON 형식으로 직접 확인 및 복사

### 4. 견적서 생성
- "견적서 미리보기" 버튼 클릭
- 새 창에서 HTML 견적서 확인
- 브라우저 인쇄 기능으로 PDF 저장 가능

## 🎨 디자인 시스템

### 브랜드 컬러
- **하나투어 퍼플**: `#5e2b97` (메인 컬러)
- **하나투어 민트**: `#00d3c5` (액센트 컬러)
- **하나투어 라이트**: `#f3eafc` (배경 컬러)

### 주요 특징
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 다크 모드 JSON 뷰어
- 부드러운 애니메이션 및 전환 효과
- 접근성 고려 (키보드 네비게이션, 포커스 관리)

## 🔧 주요 워크플로우

```
1. 파일 업로드
   ↓
2. AI 분석 (Gemini API)
   ↓
3. 데이터 추출 및 정규화
   ↓
4. 데이터 편집 (선택사항)
   ↓
5. HTML 견적서 생성
   ↓
6. 인쇄/PDF 저장
```

## 📝 참고사항

- API 키는 브라우저 localStorage에만 저장되며 서버로 전송되지 않습니다
- 대용량 파일 처리 시 타임아웃이 발생할 수 있습니다 (최대 3분)
- 엑셀 파일은 SheetJS를 사용하여 마크다운 테이블 형식으로 변환됩니다
- 환율 정보는 수동으로 입력해야 하며, 실시간 환율 API는 사용하지 않습니다

## 📄 라이선스

이 프로젝트는 하나투어 내부 사용을 위한 것입니다.
Copyright © 2025 yoonzzan. All rights reserved.



---

<div align="center">
Made with ❤️ for Hanatour
</div>
