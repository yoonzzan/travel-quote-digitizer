
import { TravelQuoteData, CostDetail } from "../types";

// --- Helper Functions ---

const formatCurrency = (amount: number, currency: string = 'KRW'): string => {
  return `${currency} ${new Intl.NumberFormat('ko-KR').format(amount)}`;
};

const getPaxCounts = (data: TravelQuoteData) => {
  const { cost, trip_summary } = data;
  const adultPax = cost.internal_pax_adult ?? trip_summary.pax_adult ?? 0;
  const childPax = cost.internal_pax_child ?? trip_summary.pax_child ?? 0;
  return { adultPax, childPax, totalPax: adultPax + childPax };
};

// --- Component Renderers ---

const renderStyles = () => `
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
    .brand-header {
      background: white;
      padding: 24px 40px 10px 40px;
      border-bottom: 1px solid #f1f5f9;
    }
    .header {
      background: linear-gradient(135deg, #5e2b97 0%, #4c1d80 100%);
      color: white;
      padding: 30px 40px;
      position: relative;
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
      top: 30px;
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
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
      padding: 30px 40px;
      background-color: #ffffff;
      border-bottom: 1px solid #f1f5f9;
    }
    .total-cost-summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .cost-summary-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .total-cost-label {
      font-size: 15px;
      font-weight: 700;
      color: #334155;
    }
    .pax-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #e0e7ff;
      color: #4338ca;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .primary-cost-row {
      text-align: right;
      margin-bottom: 12px;
    }
    .total-cost-value {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.5px;
    }
    .krw-conversion-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: right;
    }
    .krw-total {
      font-size: 16px;
      font-weight: 800;
      color: #15803d;
    }
    .krw-per-person {
      font-size: 12px;
      color: #166534;
      margin-top: 2px;
    }
    .exchange-rate-info {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
      text-align: right;
      font-family: monospace;
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
    .cost-details-container {
      padding: 40px;
      background-color: #fff;
      border-bottom: 1px solid #f1f5f9;
    }
    .cost-category-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    .cost-category-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      break-inside: avoid;
    }
    .category-header {
      background: #f1f5f9;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: #334155;
      font-size: 14px;
    }
    .category-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: transparent;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .category-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .category-table td {
      padding: 10px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
    }
    .category-table tr:last-child td {
      border-bottom: none;
    }
    .item-name {
      font-weight: 500;
    }
    .item-price {
      text-align: right;
      font-family: monospace;
      font-weight: 600;
      color: #5e2b97;
      white-space: nowrap;
    }
    .currency-label {
      font-size: 11px;
      color: #94a3b8;
      margin-right: 2px;
      font-weight: 400;
    }
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .container { box-shadow: none; margin: 0; width: 100%; max-width: none; border-radius: 0; }
      .print-fab { display: none !important; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cost-category-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
      .cost-category-card { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
`;

const renderLogo = () => `
  <div style="width: 200px; height: 60px; overflow: hidden; display: flex; align-items: center; justify-content: flex-start;">
    <img src="/hanatour_logo.png" alt="하나투어" style="height: 100%; width: 100%; object-fit: contain; transform: scale(2.8) translateX(-8px);" />
  </div>
`;

const renderHeader = (data: TravelQuoteData) => {
  const { quote_info, trip_summary } = data;
  const { adultPax, childPax } = getPaxCounts(data);

  // 여행 기간 포맷팅
  let periodDisplay = '';

  // 1. 날짜 정보가 있으면 우선 적용
  if (trip_summary.start_date && trip_summary.end_date) {
    periodDisplay = `${trip_summary.start_date} ~ ${trip_summary.end_date}`;
  }

  // 2. 박/일 정보가 있으면(0 포함) 날짜 뒤에 붙이거나 단독 사용
  if (trip_summary.nights !== undefined && trip_summary.days !== undefined) {
    const durationStr = `${trip_summary.nights}박 ${trip_summary.days}일`;
    if (periodDisplay) {
      periodDisplay += ` (${durationStr})`;
    } else {
      periodDisplay = durationStr;
    }
  } else {
    // 3. 박/일 정보가 없으면 기존 텍스트(period_text) 사용
    if (!periodDisplay) {
      periodDisplay = trip_summary.period_text || '-';
    }
  }

  // 0박 0일인 경우 깔끔하게 처리
  if (periodDisplay === '0박 0일') periodDisplay = '-';

  return `
    <div class="brand-header">
      ${renderLogo()}
    </div>
    <div class="header">
      <div class="header-badge">${quote_info.agency || '하나투어'}</div>
      <h1>${trip_summary.title || '여행 견적서'}</h1>
      <p>견적 번호: ${quote_info.code || quote_info.quote_number || '-'}</p>
    </div>
    <div class="summary-grid">
      <div class="summary-item">
        <h3>여행 기간</h3>
        <p>${periodDisplay}</p>
      </div>
      <div class="summary-item">
        <h3>여행 인원</h3>
        <p>성인 ${adultPax}명, 아동 ${childPax}명</p>
      </div>
    </div>
  `;
};

const renderCostSection = (data: TravelQuoteData) => {
  const { cost } = data;
  const formattedPrice = formatCurrency(cost.total_price, cost.currency);

  return `
    <div class="section cost-section">
      <h2 class="section-title">견적 포함 내역</h2>
      
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
  `;
};

const renderManagerNote = (data: TravelQuoteData) => {
  const { quote_info } = data;
  if (!quote_info.manager_note) return '';

  return `
    <div class="section note-section" style="margin-top: 40px; margin-bottom: 40px; padding: 0 4px; margin-right: 20px;">
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div style="flex-shrink: 0; width: 44px; height: 44px; background: transparent; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-top: 0;">
          🧑‍💼
        </div>
        <div style="position: relative; background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
           <svg width="12" height="20" viewBox="0 0 12 20" style="position: absolute; left: -11px; top: 16px; overflow: visible;">
             <path d="M12 0 L0 10 L12 20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
             <path d="M12 0 L12 20" fill="#f8fafc" stroke="none" />
           </svg>
           <div style="position: absolute; left: -1px; top: 16px; width: 2px; height: 20px; background: #f8fafc;"></div>
           <div style="font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
             담당자 코멘트
           </div>
           <div style="font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${quote_info.manager_note}</div>
        </div>
      </div>
    </div>
  `;
};

const renderItinerary = (data: TravelQuoteData) => {
  const { itinerary } = data;

  return `
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
  `;
};

const renderDetailedCost = (data: TravelQuoteData) => {
  const { cost } = data;
  if (!cost.show_details_in_quote || !cost.details || cost.details.length === 0) return '';

  const categories = [
    { id: "항공", icon: "✈️", label: "항공" },
    { id: "호텔", icon: "🏨", label: "호텔" },
    { id: "차량", icon: "🚌", label: "차량" },
    { id: "가이드", icon: "🚩", label: "가이드/기사" },
    { id: "관광지", icon: "🎫", label: "관광지" },
    { id: "식사", icon: "🍽️", label: "식사" },
    { id: "기타", icon: "✨", label: "기타" }
  ];

  const cards = categories.map(cat => {
    const items = cost.details?.filter(d => d.category === cat.id) || [];
    if (items.length === 0) return '';

    const totals: Record<string, number> = {};
    items.forEach(item => {
      const curr = (item.currency || 'KRW').toUpperCase();
      totals[curr] = (totals[curr] || 0) + item.amount + (item.profit || 0);
    });
    const totalStr = Object.entries(totals)
      .map(([curr, amt]) => formatCurrency(amt as number, curr))
      .join(' + ');

    const rows = items.map(item => `
          <tr>
              <td class="item-name">${item.detail}</td>
              <td class="item-price">
                  <span class="currency-label">${item.currency}</span>
                  ${new Intl.NumberFormat('ko-KR').format(item.amount + (item.profit || 0))}
              </td>
          </tr>
      `).join('');

    return `
        <div class="cost-category-card">
          <div class="category-header">
            <div style="display:flex; align-items:center; gap:8px;">
               <span class="category-icon">${cat.icon}</span> ${cat.label}
            </div>
            <div style="margin-left:auto; font-size:12px; color:#5e2b97; font-weight:700;">
               ${totalStr}
            </div>
          </div>
          <table class="category-table">
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
  }).join('');

  if (!cards) return '';

  const allItems = cost.details || [];
  const totalByCurrency: Record<string, number> = {};
  allItems.forEach(item => {
    const curr = (item.currency || 'KRW').toUpperCase();
    totalByCurrency[curr] = (totalByCurrency[curr] || 0) + item.amount + (item.profit || 0);
  });

  const totalCostStr = Object.entries(totalByCurrency)
    .map(([curr, amt]) => formatCurrency(amt, curr))
    .join(' + ');

  // Calculate Total KRW if exchange rates exist
  let totalKRW = 0;
  let hasForeignCurrency = false;

  Object.entries(totalByCurrency).forEach(([curr, amt]) => {
    if (curr === 'KRW' || curr === 'WON' || curr === '원') {
      totalKRW += amt;
    } else {
      hasForeignCurrency = true;
      const rate = cost.exchangeRates?.[curr] || 0;
      if (rate > 0) {
        totalKRW += amt * rate;
      }
    }
  });

  const { totalPax } = getPaxCounts(data);

  let perPersonStr = '';
  if (totalPax > 0) {
    const perPersonByCurrency = Object.entries(totalByCurrency)
      .map(([curr, amt]) => formatCurrency(Math.round(amt / totalPax), curr))
      .join(' + ');
    perPersonStr = `1인당 약 ${perPersonByCurrency}`;
  }

  let krwTotalDisplay = '';
  let rateInfoDisplay = '';

  if (hasForeignCurrency && totalKRW > 0) {
    const totalKRWStr = new Intl.NumberFormat('ko-KR').format(Math.round(totalKRW));
    const perPersonKRWStr = totalPax > 0 ? new Intl.NumberFormat('ko-KR').format(Math.round(totalKRW / totalPax)) : '0';

    krwTotalDisplay = `
        <div class="krw-conversion-box">
            <div class="krw-total"><span style="font-size:12px; font-weight:800; color:#166534; margin-right: 4px;">원화 환산</span> ≈ KRW ${totalKRWStr}</div>
            ${totalPax > 0 ? `<div class="krw-per-person">1인당 약 KRW ${perPersonKRWStr}</div>` : ''}
        </div>
      `;

    const usedRates = Object.keys(totalByCurrency).filter(c => c !== 'KRW' && c !== 'WON' && c !== '원');
    const rateInfoStr = usedRates.map(c => {
      const rate = cost.exchangeRates?.[c];
      return rate ? `1 ${c} = ${new Intl.NumberFormat('ko-KR').format(rate)}원` : null;
    }).filter(Boolean).join(', ');

    if (rateInfoStr) {
      rateInfoDisplay = `<div class="exchange-rate-info">ℹ️ 적용 환율: ${rateInfoStr}</div>`;
    }
  }

  const { adultPax, childPax } = getPaxCounts(data);

  return `
  <div class="cost-details-container">
    <h2 class="section-title">상세 견적 내역</h2>
    
    <div class="total-cost-summary">
       <div class="cost-summary-header">
         <div class="total-cost-label">총 합계 (Total Cost)</div>
         ${totalPax > 0 ? `<div class="pax-badge">👥 성인 ${adultPax}명, 아동 ${childPax}명 기준</div>` : ''}
       </div>
       
       <div class="primary-cost-row">
          <div class="total-cost-value">${totalCostStr}</div>
          ${perPersonStr ? `<div style="font-size:12px; color:#64748b; margin-top:4px;">${perPersonStr}</div>` : ''}
       </div>

       ${krwTotalDisplay}
       ${rateInfoDisplay}
    </div>

    <div class="cost-category-grid">
      ${cards}
    </div>
  </div>
  `;
};

const renderFooter = () => `
  <div class="footer">
    <p>견적서 작성일 • ${new Date().toLocaleDateString()}</p>
    <p>가격 및 예약 가능 여부는 변동될 수 있습니다.</p>
  </div>
`;

// --- Main Generator ---

export const generateQuoteHtml = (data: TravelQuoteData): string => {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>여행 견적서 - ${data.quote_info.code}</title>
  ${renderStyles()}
</head>
<body>
  <div class="container">
    ${renderHeader(data)}
    ${renderCostSection(data)}
    ${renderManagerNote(data)}
    ${renderItinerary(data)}
    ${renderDetailedCost(data)}
    ${renderFooter()}
  </div>
  
  <button class="print-fab" onclick="window.print()">
    🖨️ 인쇄 / PDF 저장
  </button>
</body>
</html>
  `;
};
