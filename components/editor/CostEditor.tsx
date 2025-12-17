import React, { useMemo } from 'react';
import { TravelQuoteData, CostDetail } from '../../types';
import { Plus, Trash2, CheckCircle2, XCircle, Calculator, RefreshCw, GripVertical, ChevronDown, ChevronUp, MessageSquareQuote } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { formatNumber, parseNumber } from '../../utils/format';

interface CostEditorProps {
    data: TravelQuoteData;
    onChange: (data: TravelQuoteData) => void;
}

const CostEditor: React.FC<CostEditorProps> = ({ data, onChange }) => {
    const [showDetails, setShowDetails] = React.useState(true);
    const baseInputStyle = "text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";
    const baseDetailInputStyle = "text-xs p-2 border border-slate-300 rounded focus:border-hana-mint focus:ring-1 focus:ring-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";
    const costCategories = ["항공", "호텔", "차량", "가이드", "관광지", "식사", "기타"];

    // --- Handlers ---
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

    const handleAddCostDetail = (category: string) => {
        const currentDetails = data.cost.details || [];

        // Find the last item in this category to inherit currency
        const categoryItems = currentDetails.filter(item => item.category === category);
        const lastItem = categoryItems.length > 0 ? categoryItems[categoryItems.length - 1] : null;

        // Inherit currency if available, otherwise default to empty (KRW placeholder)
        let inheritedCurrency = '';
        if (lastItem && lastItem.currency && lastItem.currency.trim() !== '') {
            // Only inherit if it's NOT KRW (since KRW is the default placeholder)
            if (lastItem.currency.toUpperCase() !== 'KRW') {
                inheritedCurrency = lastItem.currency;
            }
        }

        const newItem: CostDetail = {
            category,
            detail: "",
            unit: "",
            quantity: undefined,
            frequency: undefined,
            currency: inheritedCurrency,
            unit_price: undefined,
            amount: 0,
            profit: 0
        };

        onChange({
            ...data,
            cost: { ...data.cost, details: [...currentDetails, newItem] }
        });
    };

    const handleCostDetailChange = (index: number, field: keyof CostDetail, value: string | number) => {
        const currentDetails = [...(data.cost.details || [])];
        const updatedItem = { ...currentDetails[index], [field]: value };

        // Auto-calculate amount if unit components change
        if (field === 'quantity' || field === 'frequency' || field === 'unit_price') {
            const q = updatedItem.quantity ?? 1;
            const f = updatedItem.frequency ?? 1;
            const p = updatedItem.unit_price ?? 0;
            updatedItem.amount = q * f * p;
        }

        currentDetails[index] = updatedItem;
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

    const handleExchangeRateChange = (currency: string, rate: number) => {
        const newRates = { ...(data.cost.exchangeRates || {}), [currency]: rate };
        onChange({
            ...data,
            cost: { ...data.cost, exchangeRates: newRates }
        });
    };

    // --- Calculations ---
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

    const calculateTotalsByCurrency = (items: CostDetail[], field: 'amount' | 'profit' | 'total' = 'total') => {
        if (items.length === 0) return "0";

        const totals: Record<string, number> = {};

        items.forEach(item => {
            let curr = (item.currency || '').trim().toUpperCase();
            if (!curr) curr = 'KRW';

            let val = 0;
            if (field === 'amount') val = item.amount || 0;
            else if (field === 'profit') val = item.profit || 0;
            else val = (item.amount || 0) + (item.profit || 0);

            totals[curr] = (totals[curr] || 0) + val;
        });

        return Object.entries(totals)
            .map(([curr, amt]) => {
                return `${curr} ${new Intl.NumberFormat('ko-KR').format(amt)}`;
            })
            .join(' + ');
    };

    const calculateCategoryTotalDisplay = (category: string, field: 'amount' | 'profit' | 'total' = 'total') => {
        const items = (data.cost.details || []).filter(d => d.category === category);
        return calculateTotalsByCurrency(items, field);
    };

    const calculateTotalCostDisplay = () => {
        return calculateTotalsByCurrency(data.cost.details || []);
    };

    const calculateTotalKRWConverted = (field: 'amount' | 'profit' | 'total' = 'total') => {
        const details = data.cost.details || [];
        const rates = data.cost.exchangeRates || {};
        let totalKRW = 0;

        details.forEach(item => {
            let curr = (item.currency || '').trim().toUpperCase();
            if (!curr) curr = 'KRW';

            let val = 0;
            if (field === 'amount') val = item.amount || 0;
            else if (field === 'profit') val = item.profit || 0;
            else val = (item.amount || 0) + (item.profit || 0);

            if (curr === 'KRW' || curr === '원') {
                totalKRW += val;
            } else {
                const rate = rates[curr] || 0;
                totalKRW += val * rate;
            }
        });

        return Math.round(totalKRW);
    };

    return (
        <div className="space-y-6">
            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inclusions */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-hana-mint" /> 포함 사항
                        </h4>
                        <button
                            onClick={() => handleAddListItem('inclusions')}
                            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium"
                        >
                            <Plus className="w-3 h-3" /> 추가
                        </button>
                    </div>
                    <Droppable droppableId="inclusions">
                        {(provided) => (
                            <div
                                className="space-y-2"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {(data.cost.inclusions || []).map((item, idx) => (
                                    <Draggable key={`inc-${idx}`} draggableId={`inc-${idx}`} index={idx}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="flex items-center gap-2 bg-white"
                                            >
                                                <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                                                    <GripVertical className="w-4 h-4" />
                                                </div>
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
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                {(!data.cost.inclusions || data.cost.inclusions.length === 0) && (
                                    <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">포함 사항이 없습니다.</p>
                                )}
                            </div>
                        )}
                    </Droppable>
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
                    <Droppable droppableId="exclusions">
                        {(provided) => (
                            <div
                                className="space-y-2"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {(data.cost.exclusions || []).map((item, idx) => (
                                    <Draggable key={`exc-${idx}`} draggableId={`exc-${idx}`} index={idx}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="flex items-center gap-2 bg-white"
                                            >
                                                <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                                                    <GripVertical className="w-4 h-4" />
                                                </div>
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
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                {(!data.cost.exclusions || data.cost.exclusions.length === 0) && (
                                    <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">불포함 사항이 없습니다.</p>
                                )}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>

            {/* Manager's Note */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-yellow-50 rounded-lg">
                        <MessageSquareQuote className="w-4 h-4 text-yellow-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">담당자 비고 (선택)</h4>
                </div>
                <textarea
                    value={data.quote_info.manager_note || ''}
                    onChange={(e) => onChange({
                        ...data,
                        quote_info: { ...data.quote_info, manager_note: e.target.value }
                    })}
                    placeholder="고객에게 전달할 추가 코멘트나 유의사항을 입력하세요. (입력 시 견적서에 말풍선 형태로 노출됩니다)"
                    className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-slate-50 min-h-[80px] resize-y placeholder-slate-400"
                />
            </div>

            {/* Cost Details Table */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h4 className="text-xl font-bold text-slate-800 inline-block relative">
                                💰 원가 상세 내역
                                <span className="absolute bottom-1 left-0 w-full h-3 bg-green-200/40 -z-10 rounded-sm"></span>
                            </h4>

                            <div
                                className="flex items-center gap-2 cursor-pointer group ml-2"
                                onClick={() => onChange({
                                    ...data,
                                    cost: { ...data.cost, show_details_in_quote: !data.cost.show_details_in_quote }
                                })}
                            >
                                <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${data.cost.show_details_in_quote ? 'bg-hana-mint' : 'bg-slate-300 group-hover:bg-slate-400'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${data.cost.show_details_in_quote ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-xs font-bold transition-colors ${data.cost.show_details_in_quote ? 'text-hana-mint' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                    고객 견적서 노출
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-xs flex items-center gap-1 text-slate-500 hover:text-hana-purple transition-colors font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-hana-purple"
                        >
                            {showDetails ? (
                                <>
                                    <ChevronUp className="w-3.5 h-3.5" /> 접기
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3.5 h-3.5" /> 펼치기
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Exchange Rate Calculator Panel */}
                {uniqueCurrencies.length > 0 && (
                    <div className="flex items-center gap-4 mb-4 px-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <RefreshCw className="w-3 h-3" />
                            환율 설정
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {uniqueCurrencies.map(curr => (
                                <div key={curr} className="flex items-center bg-white pl-2.5 pr-1 py-1 rounded-lg border border-slate-200 gap-2 shadow-sm focus-within:border-hana-purple focus-within:ring-1 focus-within:ring-hana-purple transition-all">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-600">
                                            1 {curr}
                                        </span>
                                        <span className="text-slate-300 text-[10px]">=</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={formatNumber((data.cost.exchangeRates || {})[curr])}
                                            onChange={(e) => handleExchangeRateChange(curr, parseNumber(e.target.value))}
                                            className="w-20 pl-2 pr-8 py-1 text-right font-bold text-sm text-slate-800 bg-slate-50 border-none rounded focus:ring-0 outline-none transition-all"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none select-none">KRW</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Total Panel */}
                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-start justify-between gap-6 mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="text-base font-bold text-slate-700 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-hana-purple" />
                            <span>총 원가 합계</span>
                        </div>
                        <p className="text-xs text-slate-400 pl-7">
                            * 입력된 모든 항목의 원가와 수익을 합산한 결과입니다.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-4 w-full sm:w-auto">
                        {/* Main Total Display */}
                        <div className="text-right">
                            <div className="text-3xl font-bold text-emerald-600 tracking-tight">
                                {uniqueCurrencies.length >
                                    0 ? `≈ ${new Intl.NumberFormat('ko-KR').format(calculateTotalKRWConverted())} 원`
                                    : calculateTotalCostDisplay()
                                }
                            </div>

                            {/* Per Person Display */}
                            {(() => {
                                const adultCount = data.cost.internal_pax_adult ?? data.trip_summary.pax_adult ?? 0;
                                const childCount = data.cost.internal_pax_child ?? data.trip_summary.pax_child ?? 0;
                                const totalPax = adultCount + childCount;

                                if (totalPax > 0) {
                                    const totalAmount = calculateTotalKRWConverted();

                                    return (
                                        <div className="text-sm text-slate-500 font-medium mt-1">
                                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 mr-1.5 text-xs">1인 예상</span>
                                            <span className="font-bold text-slate-700">
                                                {new Intl.NumberFormat('ko-KR').format(Math.round(totalAmount / totalPax))}
                                            </span> 원
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {/* Breakdown Table */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm w-full sm:min-w-[340px]">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-100">
                                        <th className="pb-2 text-left font-medium">구분</th>
                                        <th className="pb-2 font-medium">금액 (현지)</th>
                                        {uniqueCurrencies.length > 0 && <th className="pb-2 font-medium pl-4">원화 환산 (예상)</th>}
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr>
                                        <td className="py-2 text-left font-bold text-slate-500">순수 원가</td>
                                        <td className="py-2 font-medium">{calculateTotalsByCurrency(data.cost.details || [], 'amount')}</td>
                                        {uniqueCurrencies.length > 0 && (
                                            <td className="py-2 pl-4 text-slate-400">
                                                {new Intl.NumberFormat('ko-KR').format(calculateTotalKRWConverted('amount'))}
                                            </td>
                                        )}
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-left font-bold text-blue-500">수익</td>
                                        <td className="py-2 font-bold text-blue-500">{calculateTotalsByCurrency(data.cost.details || [], 'profit')}</td>
                                        {uniqueCurrencies.length > 0 && (
                                            <td className="py-2 pl-4 text-blue-400">
                                                {new Intl.NumberFormat('ko-KR').format(calculateTotalKRWConverted('profit'))}
                                            </td>
                                        )}
                                    </tr>
                                    <tr className="border-t border-slate-100">
                                        <td className="pt-2 text-left font-bold text-slate-800">합계</td>
                                        <td className="pt-2 font-bold text-slate-800">{calculateTotalsByCurrency(data.cost.details || [], 'total')}</td>
                                        {uniqueCurrencies.length > 0 && (
                                            <td className="pt-2 pl-4 font-bold text-emerald-600">
                                                {new Intl.NumberFormat('ko-KR').format(calculateTotalKRWConverted('total'))}
                                            </td>
                                        )}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {showDetails && (
                    <div className="space-y-8 animate-in slide-in-from-top-2 duration-300">
                        {costCategories.map(category => {
                            const items = (data.cost.details || []).map((item, idx) => ({ ...item, originalIndex: idx })).filter(item => item.category === category);

                            return (
                                <div key={category} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <h5 className="font-bold text-slate-700 flex items-center gap-2">
                                            {category}
                                        </h5>
                                        <div className="flex items-center gap-3">
                                            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
                                                <span>원가 <span className="font-bold text-slate-700">{calculateCategoryTotalDisplay(category, 'amount')}</span></span>
                                                <span className="text-slate-300">|</span>
                                                <span>수익 <span className="font-bold text-blue-600">{calculateCategoryTotalDisplay(category, 'profit')}</span></span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                {calculateCategoryTotalDisplay(category)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3 overflow-x-auto">
                                        {/* Header Row */}
                                        <div className="flex gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[760px]">
                                            <div className="flex-[2] pl-2 min-w-[120px]">상세 내용</div>
                                            <div className="w-14 text-center">단위</div>
                                            <div className="w-14 text-center">수량</div>
                                            <div className="w-14 text-center">횟수</div>
                                            <div className="w-20 text-center">통화</div>
                                            <div className="w-24 text-center">단가</div>
                                            <div className="w-24 text-center">원가(합계)</div>
                                            <div className="w-24 text-center">수익</div>
                                            <div className="w-8"></div>
                                        </div>

                                        {items.map((item) => (
                                            <div key={item.originalIndex} className="flex gap-1 items-center group min-w-[760px]">
                                                <input
                                                    type="text"
                                                    value={item.detail || ''}
                                                    onChange={(e) => handleCostDetailChange(item.originalIndex, 'detail', e.target.value)}
                                                    className={`flex-[2] min-w-[120px] ${baseDetailInputStyle}`}
                                                    placeholder="상세 내용"
                                                />
                                                <input
                                                    type="text"
                                                    value={item.unit || ''}
                                                    onChange={(e) => handleCostDetailChange(item.originalIndex, 'unit', e.target.value)}
                                                    className={`w-14 text-center ${baseDetailInputStyle}`}
                                                    placeholder="단위"
                                                />
                                                <input
                                                    type="number"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => handleCostDetailChange(item.originalIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className={`w-14 text-center ${baseDetailInputStyle}`}
                                                />
                                                <input
                                                    type="number"
                                                    value={item.frequency || ''}
                                                    onChange={(e) => handleCostDetailChange(item.originalIndex, 'frequency', parseFloat(e.target.value) || 0)}
                                                    className={`w-14 text-center ${baseDetailInputStyle}`}
                                                />
                                                <input
                                                    type="text"
                                                    value={item.currency || ''}
                                                    onChange={(e) => handleCostDetailChange(item.originalIndex, 'currency', e.target.value)}
                                                    className={`w-20 text-center uppercase ${baseDetailInputStyle} font-bold`}
                                                    placeholder="KRW"
                                                />
                                                <input
                                                    type="text"
                                                    value={formatNumber(item.unit_price)}
                                                    onChange={(e) => handleCostDetailChange(item.originalIndex, 'unit_price', parseNumber(e.target.value))}
                                                    className={`w-24 text-right ${baseDetailInputStyle}`}
                                                    placeholder="단가"
                                                />
                                                <div className={`w-24 text-right px-2 py-2 text-xs font-bold ${item.amount === 0 ? 'text-slate-300' : 'text-slate-700'} bg-slate-50 rounded border border-transparent`}>
                                                    {item.amount?.toLocaleString()}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formatNumber(item.profit)}
                                                    onChange={(e) => handleCostDetailChange(item.originalIndex, 'profit', parseNumber(e.target.value))}
                                                    className={`w-24 text-right ${baseDetailInputStyle} text-blue-600`}
                                                    placeholder="수익"
                                                />
                                                <button
                                                    onClick={() => handleDeleteCostDetail(item.originalIndex)}
                                                    className="w-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => handleAddCostDetail(category)}
                                            className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400 hover:text-hana-purple hover:border-hana-purple hover:bg-hana-light/10 transition-all flex items-center justify-center gap-1 mt-2 min-w-[760px]"
                                        >
                                            <Plus className="w-3 h-3" /> 항목 추가
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CostEditor;
