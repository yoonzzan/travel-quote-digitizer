import React from 'react';
import { TravelQuoteData } from '../../types';
import { Users, ShoppingBag } from 'lucide-react';
import TagInput from '../common/TagInput';
import { formatNumber, parseNumber } from '../../utils/format';

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

    const handleDurationChange = (field: 'nights' | 'days', value: number) => {
        const currentNights = data.trip_summary.nights || 0;
        const currentDays = data.trip_summary.days || 0;

        const newNights = field === 'nights' ? value : currentNights;
        const newDays = field === 'days' ? value : currentDays;

        onChange({
            ...data,
            trip_summary: {
                ...data.trip_summary,
                [field]: value,
                period_text: `${newNights}박 ${newDays}일`
            }
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
                    colorClass="bg-emerald-100 text-emerald-700"
                />
            </div>

            {/* Date & Duration */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">여행 시작일</label>
                    <input
                        type="date"
                        value={data.trip_summary.start_date || ''}
                        onChange={(e) => handleTripSummaryChange('start_date', e.target.value)}
                        className={`w-full ${baseInputStyle}`}
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">여행 종료일</label>
                    <input
                        type="date"
                        value={data.trip_summary.end_date || ''}
                        onChange={(e) => handleTripSummaryChange('end_date', e.target.value)}
                        className={`w-full ${baseInputStyle}`}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">박 (Nights)</label>
                    <input
                        type="number"
                        value={data.trip_summary.nights || ''}
                        onChange={(e) => handleDurationChange('nights', parseInt(e.target.value) || 0)}
                        className={`w-full ${baseInputStyle}`}
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">일 (Days)</label>
                    <input
                        type="number"
                        value={data.trip_summary.days || ''}
                        onChange={(e) => handleDurationChange('days', parseInt(e.target.value) || 0)}
                        className={`w-full ${baseInputStyle}`}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Pax & Quote Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                {/* Pax */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                        <Users className="w-4 h-4" /> 인원 설정
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">성인</label>
                            <input
                                type="number"
                                value={data.trip_summary.pax_adult || ''}
                                onChange={(e) => handleTripSummaryChange('pax_adult', parseInt(e.target.value) || 0)}
                                className={`w-full ${baseInputStyle}`}
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">아동</label>
                            <input
                                type="number"
                                value={data.trip_summary.pax_child || ''}
                                onChange={(e) => handleTripSummaryChange('pax_child', parseInt(e.target.value) || 0)}
                                className={`w-full ${baseInputStyle}`}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Quote Currency & Amount */}
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                        <ShoppingBag className="w-4 h-4" /> 견적 금액 설정
                    </div>
                    <div className="flex gap-3 items-end">
                        <div className="w-24">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">통화</label>
                            <input
                                type="text"
                                value={data.cost.currency || 'KRW'}
                                onChange={(e) => handleCostChange('currency', e.target.value)}
                                className={`w-full ${baseInputStyle} uppercase font-bold text-center`}
                                placeholder="KRW"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">총 견적 금액 (1인)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={formatNumber(data.cost.total_price)}
                                    onChange={(e) => handleCostChange('total_price', parseNumber(e.target.value))}
                                    className={`${baseInputStyle} flex-1 font-bold text-right`}
                                    placeholder="금액"
                                />
                                <span className="text-sm font-bold text-slate-600">원</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quote Number, Date & Agency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">견적 번호</label>
                    <input
                        type="text"
                        value={data.quote_info.code || ''}
                        onChange={(e) => handleQuoteInfoChange('code', e.target.value)}
                        className={`w-full ${baseInputStyle} bg-slate-50`}
                        placeholder="하나투어 견적번호 입력"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">견적 생성 일자</label>
                    <input
                        type="date"
                        value={data.quote_info.quote_date || ''}
                        onChange={(e) => handleQuoteInfoChange('quote_date', e.target.value)}
                        className={`w-full ${baseInputStyle}`}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">협력사 (Agency)</label>
                    <input
                        type="text"
                        value={data.quote_info.agency || ''}
                        onChange={(e) => handleQuoteInfoChange('agency', e.target.value)}
                        className={`w-full ${baseInputStyle}`}
                        placeholder="여행사명 입력"
                    />
                </div>
            </div>
        </div>
    );
};

export default TripSummaryEditor;
