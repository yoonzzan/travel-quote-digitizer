import React, { useMemo } from 'react';
import { TravelQuoteData, CostDetail } from '../../types';
import { Plus, Trash2, CheckCircle2, XCircle, Calculator, RefreshCw, GripVertical } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

interface CostEditorProps {
    data: TravelQuoteData;
    onChange: (data: TravelQuoteData) => void;
}

const CostEditor: React.FC<CostEditorProps> = ({ data, onChange }) => {
    const baseInputStyle = "text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";
    const baseDetailInputStyle = "text-xs p-2 border border-slate-300 rounded focus:border-hana-mint focus:ring-1 focus:ring-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";
    const costCategories = ["호텔", "차량", "가이드", "관광지", "식사", "기타"];

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

        // Inherit currency if available, otherwise default to KRW
        let inheritedCurrency = 'KRW';
        if (lastItem && lastItem.currency && lastItem.currency.trim() !== '') {
            inheritedCurrency = lastItem.currency;
        }

        const newItem: CostDetail = {
            category,
            detail: "",
            unit: "단위",
            quantity: 1,
            frequency: 1,
            currency: inheritedCurrency,
            unit_price: 0,
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

    const calculateTotalsByCurrency = (items: CostDetail[]) => {
        if (items.length === 0) return "0";

        const totals: Record<string, number> = {};

        items.forEach(item => {
            let curr = (item.currency || '').trim().toUpperCase();
            if (!curr) curr = 'KRW';
            const amt = (item.amount || 0) + (item.profit || 0);
            totals[curr] = (totals[curr] || 0) + amt;
        });

        return Object.entries(totals)
            .map(([curr, amt]) => {
                return `${curr} ${new Intl.NumberFormat('ko-KR').format(amt)}`;
            })
            .join(' + ');
    };

    const calculateCategoryTotalDisplay = (category: string) => {
        const items = (data.cost.details || []).filter(d => d.category === category);
        return calculateTotalsByCurrency(items);
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
            if (!curr) curr = 'KRW';
            const amt = (item.amount || 0) + (item.profit || 0);

            if (curr === 'KRW' || curr === '원') {
                totalKRW += amt;
            } else {
                const rate = rates[curr] || 0;
                totalKRW += amt * rate;
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

            {/* Cost Details Table */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <h4 className="text-xl font-bold text-slate-800 inline-block relative">
                        💰 원가 상세 내역
                        <span className="absolute bottom-1 left-0 w-full h-3 bg-green-200/40 -z-10 rounded-sm"></span>
                    </h4>
                </div>

                <div className="space-y-8">
                    {costCategories.map(category => {
                        const items = (data.cost.details || []).map((item, idx) => ({ ...item, originalIndex: idx })).filter(item => item.category === category);

                        return (
                            <div key={category} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                    <h5 className="font-bold text-slate-700 flex items-center gap-2">
                                        {category}
                                    </h5>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {calculateCategoryTotalDisplay(category)}
                                    </span>
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Header Row */}
                                    <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                        <div className="flex-[2]">상세 내용</div>
                                        <div className="w-14 text-center">단위</div>
                                        <div className="w-14 text-center">수량</div>
                                        <div className="w-14 text-center">횟수</div>
                                        <div className="w-20 text-center">통화</div>
                                        <div className="w-24 text-right">단가</div>
                                        <div className="w-24 text-right">원가(합계)</div>
                                        <div className="w-24 text-right">수익</div>
                                        <div className="w-8"></div>
                                    </div>

                                    {items.map((item) => (
                                        <div key={item.originalIndex} className="flex gap-2 items-center group">
                                            <input
                                                type="text"
                                                value={item.detail || ''}
                                                onChange={(e) => handleCostDetailChange(item.originalIndex, 'detail', e.target.value)}
                                                className={`flex-[2] ${baseDetailInputStyle}`}
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
                                                type="number"
                                                value={item.unit_price || ''}
                                                onChange={(e) => handleCostDetailChange(item.originalIndex, 'unit_price', parseFloat(e.target.value) || 0)}
                                                className={`w-24 text-right ${baseDetailInputStyle}`}
                                                placeholder="단가"
                                            />
                                            <div className={`w-24 text-right px-2 py-2 text-xs font-bold ${item.amount === 0 ? 'text-slate-300' : 'text-slate-700'}`}>
                                                {item.amount?.toLocaleString()}
                                            </div>
                                            <input
                                                type="number"
                                                value={item.profit || ''}
                                                onChange={(e) => handleCostDetailChange(item.originalIndex, 'profit', parseFloat(e.target.value) || 0)}
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
                                        className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400 hover:text-hana-purple hover:border-hana-purple hover:bg-hana-light/10 transition-all flex items-center justify-center gap-1 mt-2"
                                    >
                                        <Plus className="w-3 h-3" /> 항목 추가
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Exchange Rate Calculator Panel */}
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

            {/* Total Panel */}
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
                            <div className="text-[10px] text-slate-400">
                                * 환율 적용 시 예상 금액
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CostEditor;
