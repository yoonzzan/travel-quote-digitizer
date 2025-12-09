import React from 'react';
import { TravelQuoteData } from '../../types';
import { Users, ShoppingBag } from 'lucide-react';
import TagInput from '../common/TagInput';

interface TripSummaryEditorProps {
    data: TravelQuoteData;
    onChange: (data: TravelQuoteData) => void;
}

const TripSummaryEditor: React.FC<TripSummaryEditorProps> = ({ data, onChange }) => {
    const baseInputStyle = "text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";

    const handleTripSummaryChange = (field: string, value: any) => {
        onChange({
            ...data,
            trip_summary: { ...data.trip_summary, [field]: value }
        });
    };

    const handleQuoteInfoChange = (field: string, value: any) => {
        onChange({
            ...data,
            quote_info: { ...data.quote_info, [field]: value }
        });
    };

    const handleCostChange = (field: string, value: any) => {
        onChange({
            ...data,
            cost: { ...data.cost, [field]: value }
        });
    };

    return (
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
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">협력사</label>
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

            {/* Travel Pax Input */}
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
        </div>
    );
};

export default TripSummaryEditor;
