
export interface QuoteInfo {
  code: string;
  agency: string;
}

export interface TripSummary {
  title: string;
  pax_adult: number;
  pax_child: number;
  period_text: string;
  start_date: string;
}

export interface CostDetail {
  category: string; // 구분 (e.g. 호텔, 차량, 식사)
  detail: string;   // 상세항목 (e.g. 힐튼호텔 2박, 45인승 버스)
  currency: string; // 통화 (e.g. KRW, USD)
  amount: number;
  note?: string;
}

export interface Cost {
  total_price: number;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  shopping_conditions: string; // e.g. "노쇼핑 노옵션"
  details?: CostDetail[]; // Internal breakdown
  exchangeRates?: Record<string, number>; // 환율 정보 (Currency Code -> KRW Rate)
  internal_pax?: number; // 내부 정산용 계산 인원수 (기본값: pax_adult + pax_child)
}

export interface Meals {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface ItineraryItem {
  day: number;
  location: string; // e.g. "싱가포르"
  transport: string; // e.g. "전용차량"
  activities: string[];
  meals: Meals;
  hotel: string;
}

export interface TravelQuoteData {
  quote_info: QuoteInfo;
  trip_summary: TripSummary;
  cost: Cost;
  itinerary: ItineraryItem[];
}

export enum ParsingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
