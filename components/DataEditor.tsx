
import React, { useMemo } from 'react';
import { TravelQuoteData, ItineraryItem, CostDetail } from '../types';
import { Plus, MapPin, ShoppingBag, Trash2, CheckCircle2, XCircle, CalendarPlus, Calculator, RefreshCw, Users, X } from 'lucide-react';

interface TagInputProps {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  colorClass?: string;
}

const TagInput: React.FC<TagInputProps> = ({ label, tags = [], onAdd, onRemove, placeholder, colorClass = "bg-blue-100 text-blue-700" }) => {
  const [input, setInput] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return; // Prevent duplicate tags during IME composition
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[26px]">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span key={index} className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${colorClass}`}>
              {tag}
              <button onClick={() => onRemove(index)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-300 py-1">등록된 태그가 없습니다.</span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all"
          placeholder={placeholder}
        />
        <button
          onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(""); } }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-hana-purple hover:bg-slate-100 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface DataEditorProps {
  data: TravelQuoteData;
  onChange: (newData: TravelQuoteData) => void;
}

const DataEditor: React.FC<DataEditorProps> = ({ data, onChange }) => {

  const handleQuoteInfoChange = (field: string, value: string) => {
    onChange({
      ...data,
      quote_info: { ...data.quote_info, [field]: value }
    });
  };

  const handleTripSummaryChange = (field: string, value: any) => {
    onChange({
      ...data,
      trip_summary: { ...data.trip_summary, [field]: value }
    });
  };

  const handleCostChange = (field: string, value: string | number | boolean) => {
    onChange({
      ...data,
      cost: { ...data.cost, [field]: value }
    });
  };

  // --- Cost Details Handlers ---
  const handleAddCostDetail = (category: string) => {
    const currentDetails = data.cost.details || [];
    onChange({
      ...data,
      cost: { ...data.cost, details: [...currentDetails, { category, detail: '', currency: 'KRW', amount: 0 }] }
    });
  };

  const handleCostDetailChange = (index: number, field: keyof CostDetail, value: string | number) => {
    const currentDetails = [...(data.cost.details || [])];
    currentDetails[index] = { ...currentDetails[index], [field]: value };
    onChange({
      ...data,
      cost: { ...data.cost, details: currentDetails }
    });
  };

  const handleDeleteCostDetail = (index: number) => {
    const currentDetails = [...(data.cost.details || [])];
    currentDetails.splice(index, 1);
    onChange({
      ...data,
      cost: { ...data.cost, details: currentDetails }
    });
  };

  // --- Exchange Rate & Pax Handlers ---
  const uniqueCurrencies = useMemo(() => {
    const details = data.cost.details || [];
    const currencies = new Set<string>();
    details.forEach(item => {
      const curr = (item.currency || '').trim().toUpperCase();
      if (curr && curr !== 'KRW' && curr !== '원') {
        currencies.add(curr);
      }
    });
    return Array.from(currencies);
  }, [data.cost.details]);

  const handleExchangeRateChange = (currency: string, rate: number) => {
    const newRates = { ...(data.cost.exchangeRates || {}), [currency]: rate };
    onChange({
      ...data,
      cost: { ...data.cost, exchangeRates: newRates }
    });
  };

  // Helper to calculate totals grouped by currency
  const calculateTotalsByCurrency = (items: CostDetail[]) => {
    if (items.length === 0) return "0";

    const totals: Record<string, number> = {};

    items.forEach(item => {
      // Normalize currency key (uppercase, trim)
      let curr = (item.currency || '').trim().toUpperCase();
      if (!curr) curr = 'KRW'; // Default to KRW if empty
      const amt = (item.amount || 0) + (item.profit || 0);
      totals[curr] = (totals[curr] || 0) + amt;
    });

    // Convert to string "KRW 1,000 + USD 50"
    return Object.entries(totals)
      .map(([curr, amt]) => {
        return `${curr} ${new Intl.NumberFormat('ko-KR').format(amt)}`;
      })
      .join(' + ');
  };

  const calculateTotalCostDisplay = () => {
    return calculateTotalsByCurrency(data.cost.details || []);
  };

  const calculateTotalKRWConverted = () => {
    const details = data.cost.details || [];
    const rates = data.cost.exchangeRates || {};
    let totalKRW = 0;

    details.forEach(item => {
      let curr = (item.currency || '').trim().toUpperCase();
      const amt = (item.amount || 0) + (item.profit || 0);

      if (!curr || curr === 'KRW' || curr === '원') {
        totalKRW += amt;
      } else {
        const rate = rates[curr] || 0;
        totalKRW += (amt * rate);
      }
    });

    return Math.round(totalKRW);
  };

  const calculatePerPersonKRW = () => {
    const totalKRW = calculateTotalKRWConverted();
    const adult = data.cost.internal_pax_adult ?? data.trip_summary.pax_adult ?? 0;
    const child = data.cost.internal_pax_child ?? data.trip_summary.pax_child ?? 0;
    const pax = adult + child;
    return Math.round(totalKRW / (pax || 1));
  };

  const calculateCategoryTotalDisplay = (category: string) => {
    const items = (data.cost.details || []).filter(d => d.category === category);
    return calculateTotalsByCurrency(items);
  };

  // --- Itinerary Handlers ---

  const handleItineraryChange = (index: number, field: keyof ItineraryItem, value: any) => {
    const newItinerary = [...data.itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    onChange({ ...data, itinerary: newItinerary });
  };

  const handleAddDay = () => {
    const nextDayNum = data.itinerary.length > 0
      ? data.itinerary[data.itinerary.length - 1].day + 1
      : 1;

    const newDay: ItineraryItem = {
      day: nextDayNum,
      location: "",
      transport: "",
      hotel: "",
      meals: { breakfast: "", lunch: "", dinner: "" },
      activities: [""]
    };

    // Auto-update period text (e.g. 3박 4일 -> 4박 5일)
    const currentPeriod = data.trip_summary.period_text || "";
    const nightsMatch = currentPeriod.match(/(\d+)박/);
    const daysMatch = currentPeriod.match(/(\d+)일/);

    let newPeriod = currentPeriod;
    if (nightsMatch && daysMatch) {
      const nights = parseInt(nightsMatch[1]);
      const days = parseInt(daysMatch[1]);
      newPeriod = `${nights + 1}박 ${days + 1}일`;
    } else if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      newPeriod = `${days}박 ${days + 1}일`; // Guessing nights
    }

    onChange({
      ...data,
      itinerary: [...data.itinerary, newDay],
      trip_summary: { ...data.trip_summary, period_text: newPeriod }
    });
  };

  const handleDeleteDay = (index: number) => {
    if (window.confirm(`${data.itinerary[index].day}일차 일정을 정말 삭제하시겠습니까?`)) {
      const newItinerary = [...data.itinerary];
      newItinerary.splice(index, 1);

      // Auto-update period text (e.g. 4박 5일 -> 3박 4일)
      const currentPeriod = data.trip_summary.period_text || "";
      const nightsMatch = currentPeriod.match(/(\d+)박/);
      const daysMatch = currentPeriod.match(/(\d+)일/);

      let newPeriod = currentPeriod;
      if (nightsMatch && daysMatch) {
        const nights = Math.max(0, parseInt(nightsMatch[1]) - 1);
        const days = Math.max(1, parseInt(daysMatch[1]) - 1);
        newPeriod = `${nights}박 ${days}일`;
      }

      onChange({
        ...data,
        itinerary: newItinerary,
        trip_summary: { ...data.trip_summary, period_text: newPeriod }
      });
    }
  };

  const handleActivityChange = (dayIndex: number, activityIndex: number, value: string) => {
    const newItinerary = [...data.itinerary];
    const newActivities = [...newItinerary[dayIndex].activities];
    newActivities[activityIndex] = value;
    newItinerary[dayIndex].activities = newActivities;
    onChange({ ...data, itinerary: newItinerary });
  };

  const handleAddActivity = (dayIndex: number) => {
    const newItinerary = [...data.itinerary];
    newItinerary[dayIndex].activities.push("");
    onChange({ ...data, itinerary: newItinerary });
  };

  const handleDeleteActivity = (dayIndex: number, activityIndex: number) => {
    const newItinerary = [...data.itinerary];
    newItinerary[dayIndex].activities.splice(activityIndex, 1);
    onChange({ ...data, itinerary: newItinerary });
  };

  // --- Inclusions / Exclusions Handlers ---

  const handleListChange = (type: 'inclusions' | 'exclusions', index: number, value: string) => {
    const list = [...data.cost[type]];
    list[index] = value;
    onChange({
      ...data,
      cost: { ...data.cost, [type]: list }
    });
  };

  const handleAddListItem = (type: 'inclusions' | 'exclusions') => {
    onChange({
      ...data,
      cost: { ...data.cost, [type]: [...data.cost[type], ""] }
    });
  };

  const handleDeleteListItem = (type: 'inclusions' | 'exclusions', index: number) => {
    const list = [...data.cost[type]];
    list.splice(index, 1);
    onChange({
      ...data,
      cost: { ...data.cost, [type]: list }
    });
  };

  // Styles
  const baseInputStyle = "text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";
  const baseDetailInputStyle = "text-xs p-2 border border-slate-300 rounded focus:border-hana-mint focus:ring-1 focus:ring-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";

  const costCategories = ["호텔", "차량", "가이드", "관광지", "식사", "기타"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Meta Info Grid */}
      {/* Meta Info Grid */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3 mb-2">
          <h4 className="text-xl font-bold text-slate-800 inline-block relative">
            📝 기본 정보 및 비용
            <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-200/40 -z-10 rounded-sm"></span>
          </h4>
        </div>

        {/* Quote Title */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">견적서 제목</label>
          <input
            type="text"
            value={data.trip_summary.title || ''}
            onChange={(e) => handleTripSummaryChange('title', e.target.value)}
            className={`w-full ${baseInputStyle} font-bold text-lg`}
            placeholder="견적서 제목 입력 (예: 쿠알라룸푸르 3박 4일)"
          />
        </div>

        {/* Countries & Cities Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TagInput
            label="여행 국가"
            tags={data.trip_summary.countries || []}
            onAdd={(tag) => {
              const newTags = [...(data.trip_summary.countries || []), tag];
              handleTripSummaryChange('countries', newTags);
            }}
            onRemove={(index) => {
              const newTags = [...(data.trip_summary.countries || [])];
              newTags.splice(index, 1);
              handleTripSummaryChange('countries', newTags);
            }}
            placeholder="국가 입력 (Enter로 추가)"
            colorClass="bg-indigo-100 text-indigo-700"
          />
          <TagInput
            label="여행 도시"
            tags={data.trip_summary.cities || []}
            onAdd={(tag) => {
              const newTags = [...(data.trip_summary.cities || []), tag];
              handleTripSummaryChange('cities', newTags);
            }}
            onRemove={(index) => {
              const newTags = [...(data.trip_summary.cities || [])];
              newTags.splice(index, 1);
              handleTripSummaryChange('cities', newTags);
            }}
            placeholder="도시 입력 (Enter로 추가)"
            colorClass="bg-teal-100 text-teal-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">여행사</label>
            <input
              type="text"
              value={data.quote_info.agency || ''}
              onChange={(e) => handleQuoteInfoChange('agency', e.target.value)}
              className={`w-full ${baseInputStyle}`}
              placeholder="여행사명 입력"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">견적 코드</label>
            <input
              type="text"
              value={data.quote_info.code || ''}
              onChange={(e) => handleQuoteInfoChange('code', e.target.value)}
              className={`w-full ${baseInputStyle}`}
              placeholder="견적 코드 입력"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">총 견적 금액 (1인) - 고객용</label>
            <div className="flex gap-2 items-stretch">
              <input
                type="text"
                value={data.cost.currency || ''}
                onChange={(e) => handleCostChange('currency', e.target.value)}
                className={`${baseInputStyle} w-24 text-center`}
                placeholder="통화"
              />
              <input
                type="number"
                value={data.cost.total_price || ''}
                onChange={(e) => handleCostChange('total_price', parseInt(e.target.value) || 0)}
                className={`${baseInputStyle} flex-1 font-bold text-right`}
                placeholder="금액"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">쇼핑/옵션 조건</label>
            <div className="relative">
              <ShoppingBag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={data.cost.shopping_conditions || ''}
                onChange={(e) => handleCostChange('shopping_conditions', e.target.value)}
                placeholder="예: 노쇼핑 노옵션"
                className={`w-full ${baseInputStyle} pl-10`}
              />
            </div>
          </div>
        </div>

        {/* Travel Pax Input - Moved to Basic Info */}
        <div className="mt-4 flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-md text-hana-purple shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <label className="text-xs font-bold text-slate-600">여행 인원</label>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-md px-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-hana-mint focus-within:border-hana-mint transition-all">
              <span className="text-[10px] text-slate-400 font-bold mr-1">성인</span>
              <input
                type="number"
                value={(data.cost.internal_pax_adult ?? data.trip_summary.pax_adult) || ''}
                min="0"
                onChange={(e) => handleCostChange('internal_pax_adult', parseInt(e.target.value) || 0)}
                className="w-12 py-1.5 text-center font-bold text-sm text-slate-900 outline-none bg-transparent"
                placeholder="0"
              />
              <span className="text-xs text-slate-400 font-medium pr-1">명</span>
            </div>

            <div className="flex items-center bg-white rounded-md px-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-hana-mint focus-within:border-hana-mint transition-all">
              <span className="text-[10px] text-slate-400 font-bold mr-1">아동</span>
              <input
                type="number"
                value={(data.cost.internal_pax_child ?? data.trip_summary.pax_child) || ''}
                min="0"
                onChange={(e) => handleCostChange('internal_pax_child', parseInt(e.target.value) || 0)}
                className="w-12 py-1.5 text-center font-bold text-sm text-slate-900 outline-none bg-transparent"
                placeholder="0"
              />
              <span className="text-xs text-slate-400 font-medium pr-1">명</span>
            </div>
          </div>
        </div>

        {/* Inclusions / Exclusions Editors */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inclusions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> 포함 사항
              </h4>
              <button
                onClick={() => handleAddListItem('inclusions')}
                className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium"
              >
                <Plus className="w-3 h-3" /> 추가
              </button>
            </div>
            <div className="space-y-2">
              {(data.cost.inclusions || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(e) => handleListChange('inclusions', idx, e.target.value)}
                    className={`w-full ${baseInputStyle}`}
                  />
                  <button
                    onClick={() => handleDeleteListItem('inclusions', idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!data.cost.inclusions || data.cost.inclusions.length === 0) && (
                <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">포함 사항이 없습니다.</p>
              )}
            </div>
          </div>

          {/* Exclusions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" /> 불포함 사항
              </h4>
              <button
                onClick={() => handleAddListItem('exclusions')}
                className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium"
              >
                <Plus className="w-3 h-3" /> 추가
              </button>
            </div>
            <div className="space-y-2">
              {(data.cost.exclusions || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(e) => handleListChange('exclusions', idx, e.target.value)}
                    className={`w-full ${baseInputStyle}`}
                  />
                  <button
                    onClick={() => handleDeleteListItem('exclusions', idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!data.cost.exclusions || data.cost.exclusions.length === 0) && (
                <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">불포함 사항이 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* Manager Note */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-500 mb-1.5">담당자 비고 (선택)</label>
          <textarea
            value={data.quote_info.manager_note || ''}
            onChange={(e) => handleQuoteInfoChange('manager_note', e.target.value)}
            className={`w-full ${baseInputStyle} min-h-[80px] resize-y`}
            placeholder="견적서 포함 내역과 상세 일정 사이에 표시될 비고 내용을 입력하세요."
          />
        </div>
      </div>

      {/* Internal Cost Breakdown Section */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 mt-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-4 gap-4 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xl font-bold text-slate-800 inline-block relative mb-2">
              💰 내부 정산용 상세 원가
              <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-200/40 -z-10 rounded-sm"></span>
            </h4>
            <p className="text-xs text-slate-500">항목별 상세 금액을 입력하여 원가를 계산합니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => handleCostChange('show_details_in_quote', !data.cost.show_details_in_quote)}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-hana-purple focus:ring-offset-2
                ${data.cost.show_details_in_quote ? 'bg-hana-purple' : 'bg-slate-200'}
              `}
          >
            <span
              className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${data.cost.show_details_in_quote ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
          </button>
          <span
            className="text-sm font-bold text-slate-600 cursor-pointer select-none"
            onClick={() => handleCostChange('show_details_in_quote', !data.cost.show_details_in_quote)}
          >
            고객용 견적서에 상세 내역 포함
          </span>
        </div>

        {/* Exchange Rate Calculator Panel - Moved Here */}
        {uniqueCurrencies.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-hana-purple uppercase tracking-wide">
              <RefreshCw className="w-3.5 h-3.5" />
              환율 설정 (자동 감지됨)
            </div>
            <div className="flex flex-wrap gap-4">
              {uniqueCurrencies.map(curr => (
                <div key={curr} className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200 gap-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      {curr} 1
                    </span>
                    <span className="text-slate-400 font-bold">=</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="금액"
                      value={(data.cost.exchangeRates || {})[curr] || ''}
                      onChange={(e) => handleExchangeRateChange(curr, parseFloat(e.target.value) || 0)}
                      className="w-32 pl-3 pr-10 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-hana-purple/20 focus:border-hana-purple outline-none transition-all shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none select-none">KRW</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Panel - Moved Here */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-hana-purple" />
            <span>총 원가 합계</span>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-sm font-semibold text-slate-700 mb-1">
              {calculateTotalCostDisplay()}
            </div>

            {uniqueCurrencies.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <div className="text-sm font-bold text-emerald-600">
                  ≈ {new Intl.NumberFormat('ko-KR').format(calculateTotalKRWConverted())} 원 (전체 환산)
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">1인당 예상 원가:</span>
                  <span className="text-base font-bold text-hana-purple bg-hana-light/30 px-2 py-0.5 rounded">
                    {new Intl.NumberFormat('ko-KR').format(calculatePerPersonKRW())} 원
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Internal Cost List - Single Column Stack */}
        <div className="flex flex-col gap-4">
          {costCategories.map((category) => (
            <div key={category} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">{category}</span>
                <span className="text-xs font-medium text-slate-500">
                  {calculateCategoryTotalDisplay(category)}
                </span>
              </div>
              <div className="p-4 space-y-3 flex-1">
                {(data.cost.details || [])
                  .map((d, i) => ({ ...d, originalIndex: i }))
                  .filter(d => d.category === category)
                  .map((item, localIdx) => (
                    <div key={localIdx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="상세 내용 입력"
                        value={item.detail || ''}
                        onChange={(e) => handleCostDetailChange(item.originalIndex, 'detail', e.target.value)}
                        className={`${baseDetailInputStyle} flex-1 min-w-0 py-2.5 text-sm`}
                      />
                      <input
                        type="text"
                        value={item.currency || ''}
                        onChange={(e) => handleCostDetailChange(item.originalIndex, 'currency', e.target.value)}
                        className={`${baseDetailInputStyle} w-20 text-center px-1 py-2.5 text-sm uppercase`}
                        placeholder="통화"
                      />
                      <input
                        type="number"
                        placeholder="원가"
                        value={item.amount || ''}
                        onChange={(e) => handleCostDetailChange(item.originalIndex, 'amount', parseInt(e.target.value) || 0)}
                        className={`${baseDetailInputStyle} w-24 text-right py-2.5 text-sm font-medium`}
                      />
                      <input
                        type="number"
                        placeholder="수익"
                        value={item.profit || ''}
                        onChange={(e) => handleCostDetailChange(item.originalIndex, 'profit', parseInt(e.target.value) || 0)}
                        className={`${baseDetailInputStyle} w-24 text-right py-2.5 text-sm font-medium text-blue-600 bg-blue-50/30 focus:bg-white`}
                      />
                      <div className="w-24 text-right text-xs font-bold text-slate-500">
                        = {new Intl.NumberFormat('ko-KR').format((item.amount || 0) + (item.profit || 0))}
                      </div>
                      <button
                        onClick={() => handleDeleteCostDetail(item.originalIndex)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                        title="항목 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => handleAddCostDetail(category)}
                  className="w-full py-2.5 text-xs text-slate-500 border border-dashed border-slate-300 rounded hover:border-hana-purple hover:text-hana-purple hover:bg-hana-light/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> 항목 추가
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Itinerary Section (Card Layout - Single Column) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 mt-8">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <h4 className="text-xl font-bold text-slate-800 inline-block relative">
              🗓️ 상세 일정표
              <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-200/40 -z-10 rounded-sm"></span>
            </h4>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <input
                type="number"
                className="w-10 text-center text-xs font-bold text-slate-700 outline-none border border-slate-200 rounded focus:border-hana-mint focus:ring-1 focus:ring-hana-mint transition-all py-1 bg-white"
                value={parseInt((data.trip_summary.period_text || "0박").match(/(\d+)박/)?.[1] || "0")}
                onChange={(e) => {
                  const nights = parseInt(e.target.value) || 0;
                  const days = parseInt((data.trip_summary.period_text || "0일").match(/(\d+)일/)?.[1] || "0");
                  handleTripSummaryChange('period_text', `${nights}박 ${days}일`);
                }}
              />
              <span className="text-xs text-slate-400">박</span>
              <input
                type="number"
                className="w-10 text-center text-xs font-bold text-slate-700 outline-none border border-slate-200 rounded focus:border-hana-mint focus:ring-1 focus:ring-hana-mint transition-all py-1 bg-white"
                value={parseInt((data.trip_summary.period_text || "0일").match(/(\d+)일/)?.[1] || "0")}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 0;
                  const nights = parseInt((data.trip_summary.period_text || "0박").match(/(\d+)박/)?.[1] || "0");
                  handleTripSummaryChange('period_text', `${nights}박 ${days}일`);
                }}
              />
              <span className="text-xs text-slate-400">일</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">여행 기간을 설정하고 일자별 상세 일정을 작성합니다.</p>
        </div>

        <div className="flex flex-col gap-6">
          {(data.itinerary || []).map((day, dayIdx) => (
            <div key={dayIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Day Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">Day</span>
                  <input
                    type="number"
                    value={day.day}
                    onChange={(e) => handleItineraryChange(dayIdx, 'day', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-bold text-lg bg-transparent border-none focus:ring-0 p-0 text-hana-purple"
                  />
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={day.location || ''}
                    onChange={(e) => handleItineraryChange(dayIdx, 'location', e.target.value)}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:border-hana-mint focus:ring-1 focus:ring-hana-mint outline-none"
                    placeholder="지역"
                  />
                  <input
                    type="text"
                    value={day.transport || ''}
                    onChange={(e) => handleItineraryChange(dayIdx, 'transport', e.target.value)}
                    className="w-20 text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:border-hana-mint focus:ring-1 focus:ring-hana-mint outline-none text-slate-500"
                    placeholder="교통"
                  />
                </div>
                <button
                  onClick={() => handleDeleteDay(dayIdx)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  title="Day 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Day Body (Responsive Flex) */}
              <div className="p-4 flex flex-col md:flex-row gap-6">
                {/* Left: Hotel & Meals */}
                <div className="md:w-1/3 flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">숙소 (Hotel)</label>
                    <input
                      type="text"
                      value={day.hotel || ''}
                      onChange={(e) => handleItineraryChange(dayIdx, 'hotel', e.target.value)}
                      className="w-full text-xs font-medium text-hana-purple bg-hana-light/30 border border-hana-light/50 rounded px-2 py-2 focus:ring-1 focus:ring-hana-purple outline-none placeholder-purple-300 transition-colors"
                      placeholder="숙소명"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">식사 (Meals)</label>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                      <div className="flex-1 flex flex-col border-r border-slate-200 relative focus-within:z-10">
                        <span className="px-2 py-1.5 text-[10px] text-slate-400 font-bold border-b border-slate-100 block bg-slate-50">조식</span>
                        <input
                          value={day.meals.breakfast || ''}
                          onChange={(e) => {
                            const newMeals = { ...day.meals, breakfast: e.target.value };
                            handleItineraryChange(dayIdx, 'meals', newMeals);
                          }}
                          className="w-full text-xs py-2.5 px-2 bg-white outline-none text-center transition-all focus:ring-2 focus:ring-inset focus:ring-hana-mint focus:bg-hana-light/5"
                        />
                      </div>
                      <div className="flex-1 flex flex-col border-r border-slate-200 relative focus-within:z-10">
                        <span className="px-2 py-1.5 text-[10px] text-slate-400 font-bold border-b border-slate-100 block bg-slate-50">중식</span>
                        <input
                          value={day.meals.lunch || ''}
                          onChange={(e) => {
                            const newMeals = { ...day.meals, lunch: e.target.value };
                            handleItineraryChange(dayIdx, 'meals', newMeals);
                          }}
                          className="w-full text-xs py-2.5 px-2 bg-white outline-none text-center transition-all focus:ring-2 focus:ring-inset focus:ring-hana-mint focus:bg-hana-light/5"
                        />
                      </div>
                      <div className="flex-1 flex flex-col relative focus-within:z-10">
                        <span className="px-2 py-1.5 text-[10px] text-slate-400 font-bold border-b border-slate-100 block bg-slate-50">석식</span>
                        <input
                          value={day.meals.dinner || ''}
                          onChange={(e) => {
                            const newMeals = { ...day.meals, dinner: e.target.value };
                            handleItineraryChange(dayIdx, 'meals', newMeals);
                          }}
                          className="w-full text-xs py-2.5 px-2 bg-white outline-none text-center transition-all focus:ring-2 focus:ring-inset focus:ring-hana-mint focus:bg-hana-light/5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Activities */}
                <div className="md:w-2/3 flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">일정 (Activities)</label>
                  <div className="space-y-2">
                    {day.activities.map((act, actIdx) => (
                      <div key={actIdx} className="flex gap-2 items-center bg-slate-50/50 rounded-lg p-1.5 border border-slate-100 group focus-within:border-hana-mint focus-within:ring-1 focus-within:ring-hana-mint transition-all">
                        <span className="w-1.5 h-1.5 rounded-full bg-hana-mint flex-shrink-0 ml-1.5" />
                        <input
                          value={act || ''}
                          onChange={(e) => handleActivityChange(dayIdx, actIdx, e.target.value)}
                          className="flex-1 text-sm bg-transparent border-none focus:ring-0 outline-none transition-colors"
                          placeholder="일정 내용 입력"
                        />
                        <div className="flex-shrink-0 flex items-center">
                          <button
                            onClick={() => handleDeleteActivity(dayIdx, actIdx)}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors flex items-center justify-center"
                            title="일정 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddActivity(dayIdx)}
                      className="w-full py-2 text-xs text-hana-purple/70 hover:text-hana-purple border border-dashed border-hana-purple/30 hover:border-hana-purple/60 rounded-lg flex items-center justify-center gap-1.5 transition-all hover:bg-hana-light/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> 일정 추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Day Card */}
          <button
            onClick={handleAddDay}
            className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-hana-purple hover:border-hana-purple hover:bg-white transition-all min-h-[100px] py-8"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">새로운 날짜(Day) 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataEditor;
