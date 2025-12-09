import React from 'react';
import { TravelQuoteData, ItineraryItem } from '../../types';
import { Plus, Trash2, CalendarPlus, GripVertical, MapPin } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

interface ItineraryEditorProps {
    data: TravelQuoteData;
    onChange: (data: TravelQuoteData) => void;
}

const ItineraryEditor: React.FC<ItineraryEditorProps> = ({ data, onChange }) => {
    // Parse period text (e.g., "3박 5일")
    const { nights, days } = React.useMemo(() => {
        const text = data.trip_summary.period_text || "";
        const n = text.match(/(\d+)박/)?.[1] || "0";
        const d = text.match(/(\d+)일/)?.[1] || "0";
        return { nights: n, days: d };
    }, [data.trip_summary.period_text]);

    const handlePeriodChange = (type: 'nights' | 'days', value: string) => {
        const n = type === 'nights' ? value : nights;
        const d = type === 'days' ? value : days;
        onChange({
            ...data,
            trip_summary: {
                ...data.trip_summary,
                period_text: `${n}박 ${d}일`
            }
        });
    };

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

        const newItinerary = [...data.itinerary, newDay];

        // Auto-update period text based on CARD COUNT
        const currentPeriod = data.trip_summary.period_text || "";
        const nightsMatch = currentPeriod.match(/(\d+)박/);
        const daysMatch = currentPeriod.match(/(\d+)일/);

        let currentNights = 0;
        let currentDays = 0;

        if (nightsMatch && daysMatch) {
            currentNights = parseInt(nightsMatch[1]);
            currentDays = parseInt(daysMatch[1]);
        } else if (daysMatch) {
            currentDays = parseInt(daysMatch[1]);
            currentNights = Math.max(0, currentDays - 1);
        }

        const gap = Math.max(0, currentDays - currentNights); // Default gap is 1 (e.g. 3N4D)

        const newDayCount = newItinerary.length;
        const newNightCount = Math.max(0, newDayCount - (gap || 1)); // Use existing gap or default to 1

        const newPeriod = `${newNightCount}박 ${newDayCount}일`;

        onChange({
            ...data,
            itinerary: newItinerary,
            trip_summary: { ...data.trip_summary, period_text: newPeriod }
        });
    };

    const handleDeleteDay = (index: number) => {
        if (window.confirm(`${data.itinerary[index].day}일차 일정을 정말 삭제하시겠습니까?`)) {
            const list = [...data.itinerary];
            list.splice(index, 1);

            // Renumber days
            const newItinerary = list.map((day, idx) => ({ ...day, day: idx + 1 }));

            // Auto-update period text based on CARD COUNT
            const currentPeriod = data.trip_summary.period_text || "";
            const nightsMatch = currentPeriod.match(/(\d+)박/);
            const daysMatch = currentPeriod.match(/(\d+)일/);

            let currentNights = 0;
            let currentDays = 0;

            if (nightsMatch && daysMatch) {
                currentNights = parseInt(nightsMatch[1]);
                currentDays = parseInt(daysMatch[1]);
            } else if (daysMatch) {
                currentDays = parseInt(daysMatch[1]);
                currentNights = Math.max(0, currentDays - 1);
            }

            const gap = Math.max(0, currentDays - currentNights);

            const newDayCount = newItinerary.length;
            const newNightCount = Math.max(0, newDayCount - (gap || 1));

            const newPeriod = `${newNightCount}박 ${newDayCount}일`;

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

    return (
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-5 mb-5">
                <h4 className="text-xl font-bold text-slate-800 inline-block relative mb-2">
                    🗓️ 상세 일정
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-200/40 -z-10 rounded-sm"></span>
                </h4>
                <p className="text-xs text-slate-500 mb-4">여행 기간을 설정하고 일자별 상세 일정을 작성합니다.</p>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center gap-4 shadow-sm">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <CalendarPlus className="w-4 h-4 text-hana-purple" />
                        총 여행 기간
                    </span>
                    <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <input
                                type="number"
                                value={nights}
                                onChange={(e) => handlePeriodChange('nights', e.target.value)}
                                className="w-20 pl-3 pr-8 py-2 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-base font-bold text-slate-700 shadow-sm transition-all hover:border-hana-purple/50"
                                min="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none group-focus-within:text-hana-purple transition-colors">박</span>
                        </div>
                        <div className="relative group">
                            <input
                                type="number"
                                value={days}
                                onChange={(e) => handlePeriodChange('days', e.target.value)}
                                className="w-20 pl-3 pr-8 py-2 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-base font-bold text-slate-700 shadow-sm transition-all hover:border-hana-purple/50"
                                min="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none group-focus-within:text-hana-purple transition-colors">일</span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 ml-auto hidden sm:block">
                        * 일정을 추가/삭제하면 기간이 자동으로 계산됩니다.
                    </div>
                </div>
            </div>

            <Droppable droppableId="itinerary">
                {(provided) => (
                    <div
                        className="flex flex-col gap-6"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {(data.itinerary || []).map((day, dayIdx) => (
                            <Draggable key={`day-${dayIdx}`} draggableId={`day-${dayIdx}`} index={dayIdx}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                                    >
                                        {/* Day Header */}
                                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                                            <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                                                <GripVertical className="w-4 h-4" />
                                            </div>
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
                                                className="text-slate-300 hover:text-red-500 p-1.5 rounded transition-colors"
                                                title="일정 삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="p-4 flex flex-col md:flex-row gap-6">
                                            {/* Left: Hotel & Meals */}
                                            <div className="md:w-1/3 flex flex-col gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">숙소 (Hotel)</label>
                                                    <div className="flex items-center gap-2 bg-slate-50/50 rounded-lg p-1.5 border border-slate-100 focus-within:border-hana-mint focus-within:ring-1 focus-within:ring-hana-mint transition-all">
                                                        <MapPin className="w-3.5 h-3.5 text-hana-purple/50" />
                                                        <input
                                                            value={day.hotel || ''}
                                                            onChange={(e) => handleItineraryChange(dayIdx, 'hotel', e.target.value)}
                                                            className="flex-1 text-xs bg-transparent border-none focus:ring-0 outline-none"
                                                            placeholder="숙소명 입력"
                                                        />
                                                    </div>
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
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {/* Add Day Card */}
            <button
                onClick={handleAddDay}
                className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-hana-purple hover:border-hana-purple hover:bg-white transition-all min-h-[100px] py-8"
            >
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <CalendarPlus className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">새로운 날짜(Day) 추가</span>
            </button>
        </div>
    );
};

export default ItineraryEditor;
