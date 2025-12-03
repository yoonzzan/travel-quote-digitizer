
import { TravelQuoteData } from "../types";

export const generateQuoteHtml = (data: TravelQuoteData): string => {
  const { quote_info, trip_summary, cost, itinerary } = data;

  // Helper to format currency robustly
  const formattedPrice = `${cost.currency} ${new Intl.NumberFormat('ko-KR').format(cost.total_price)}`;

  // Hanatour SVG Logo (Inline for Email/Print safety)
  const logoSvg = `
    <svg width="120" height="40" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Icon -->
      <path d="M16 48V12H6V48H16Z" fill="white"/>
      <path d="M54 48V12H44V48H54Z" fill="white"/>
      <path d="M41 24L19 16V24H41Z" fill="#00D3C5"/>
      <path d="M19 36L41 44V36H19Z" fill="#00D3C5"/>
      <!-- Text: Using SVG text to ensure it renders without font issues, approximating position -->
      <text x="65" y="38" font-family="sans-serif" font-weight="bold" font-size="28" fill="white" letter-spacing="-1">하나투어</text>
    </svg>
  `;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>여행 견적서 - ${quote_info.code}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    
    body {
      font-family: 'Noto Sans KR', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #334155;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #5e2b97 0%, #4c1d80 100%);
      color: white;
      padding: 40px;
      position: relative;
    }
    .logo-container {
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .header-badge {
      position: absolute;
      top: 40px;
      right: 40px;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(4px);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding: 30px 40px;
      background-color: #fdf2f8;
      border-bottom: 1px solid #fce7f3;
    }
    .summary-item h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #5e2b97;
      margin: 0 0 4px 0;
    }
    .summary-item p {
      font-size: 16px;
      font-weight: 600;
      color: #5e2b97;
      margin: 0;
    }
    .section {
      padding: 40px;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #5e2b97;
      margin: 0 0 24px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .timeline {
      position: relative;
      padding-left: 20px;
    }
    .timeline-item {
      position: relative;
      padding-bottom: 32px;
      padding-left: 24px;
      border-left: 2px solid #f3eafc;
    }
    .timeline-item:last-child {
      border-left: 2px solid transparent;
    }
    .timeline-dot {
      position: absolute;
      left: -6px;
      top: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #00d3c5;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #00d3c5;
    }
    .day-header {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 8px;
    }
    .day-number {
      font-weight: 700;
      color: #5e2b97;
      font-size: 16px;
    }
    .location-tag {
      font-size: 11px;
      color: #475569;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
    }
    .transport-tag {
        font-size: 11px;
        color: #64748b;
        font-style: italic;
    }
    .hotel-badge {
      display: inline-block;
      margin-top: 4px;
      font-size: 12px;
      background: #f3eafc;
      color: #5e2b97;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 500;
    }
    .activity-list {
      list-style: none;
      padding: 0;
      margin: 12px 0;
    }
    .activity-list li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 6px;
      font-size: 14px;
    }
    .activity-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #00d3c5;
    }
    .meals {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
    }
    .meals span strong {
      color: #475569;
      margin-right: 4px;
    }
    .cost-section {
      background-color: #fdf4ff;
    }
    .shopping-banner {
        background: white;
        color: #5e2b97;
        border: 1px solid #f3eafc;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 24px;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .cost-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .inclusion-list, .exclusion-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .inclusion-list li, .exclusion-list li {
      padding-left: 24px;
      position: relative;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .inclusion-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #16a34a;
      font-weight: bold;
    }
    .exclusion-list li::before {
      content: "✕";
      position: absolute;
      left: 0;
      color: #ef4444;
      font-weight: bold;
    }
    .price-tag {
      text-align: right;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #f3eafc;
    }
    .price-label {
      font-size: 14px;
      color: #5e2b97;
      opacity: 0.8;
    }
    .price-value {
      font-size: 32px;
      font-weight: 700;
      color: #5e2b97;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #1e293b;
      color: #94a3b8;
      font-size: 12px;
    }
    
    /* Floating Print Button */
    .print-fab {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #5e2b97;
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(94, 43, 151, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s;
      font-family: 'Noto Sans KR', sans-serif;
      z-index: 9999;
    }
    .print-fab:hover {
      transform: translateY(-2px);
      background: #4a227a;
    }
    
    /* Print Specific Styles */
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .container { box-shadow: none; margin: 0; width: 100%; max-width: none; border-radius: 0; }
      .print-fab { display: none !important; } /* Hide button when printing */
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        ${logoSvg}
      </div>
      <div class="header-badge">${quote_info.agency}</div>
      <h1>${trip_summary.title || '여행 견적서'}</h1>
      <p>견적 번호: ${quote_info.code}</p>
    </div>
    
    <div class="summary-grid">
      <div class="summary-item">
        <h3>여행 기간</h3>
        <p>${trip_summary.period_text}</p>
      </div>
      <div class="summary-item">
        <h3>여행 인원</h3>
        <p>성인 ${trip_summary.pax_adult}명, 아동 ${trip_summary.pax_child}명</p>
      </div>
      <div class="summary-item">
        <h3>출발일</h3>
        <p>${trip_summary.start_date || '미정'}</p>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">상세 일정</h2>
      <div class="timeline">
        ${itinerary.map(day => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="day-header">
              <span class="day-number">${day.day}일차</span>
              ${day.location ? `<span class="location-tag">📍 ${day.location}</span>` : ''}
              ${day.transport ? `<span class="transport-tag">🚌 ${day.transport}</span>` : ''}
            </div>
            
            ${day.hotel && day.hotel !== 'None' ? `<div class="hotel-badge">🏨 ${day.hotel}</div>` : ''}
            
            <ul class="activity-list">
              ${day.activities.map(act => `<li>${act}</li>`).join('')}
            </ul>
            <div class="meals">
              <span><strong>조:</strong> ${day.meals.breakfast || '-'}</span>
              <span><strong>중:</strong> ${day.meals.lunch || '-'}</span>
              <span><strong>석:</strong> ${day.meals.dinner || '-'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section cost-section">
      <h2 class="section-title">요금 상세</h2>
      
      ${cost.shopping_conditions ? `
      <div class="shopping-banner">
         🛍️ 쇼핑/옵션 조건: ${cost.shopping_conditions}
      </div>` : ''}

      <div class="cost-grid">
        <div>
          <h3 style="font-size:14px; color:#16a34a; margin-bottom:12px;">포함 사항</h3>
          <ul class="inclusion-list">
            ${cost.inclusions.length ? cost.inclusions.map(inc => `<li>${inc}</li>`).join('') : '<li>담당자 문의</li>'}
          </ul>
        </div>
        <div>
          <h3 style="font-size:14px; color:#ef4444; margin-bottom:12px;">불포함 사항</h3>
          <ul class="exclusion-list">
            ${cost.exclusions.length ? cost.exclusions.map(exc => `<li>${exc}</li>`).join('') : '<li>개인 경비</li>'}
          </ul>
        </div>
      </div>
      
      <div class="price-tag">
        <div class="price-label">총 예상 견적 (1인 기준)</div>
        <div class="price-value">${formattedPrice}</div>
      </div>
    </div>

    <div class="footer">
      <p>생성된 견적서 • ${new Date().toLocaleDateString()}</p>
      <p>가격 및 예약 가능 여부는 변동될 수 있습니다.</p>
    </div>
  </div>
  
  <!-- Floating Print Button (Visible on screen, Hidden on Print) -->
  <button class="print-fab" onclick="window.print()">
    🖨️ 인쇄 / PDF 저장
  </button>
</body>
</html>
  `;
};
