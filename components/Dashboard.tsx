
import React from 'react';
import { TravelQuoteData } from '../types';
import { Calendar, Users, Building2, Utensils, MapPin, Tag, DollarSign, CheckCircle2, XCircle, ShoppingBag, Bus } from 'lucide-react';

interface DashboardProps {
  data: TravelQuoteData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const formatCurrency = (amount: number, currency: string) => {
    // Simple formatter: "CUR 1,000"
    const numberPart = new Intl.NumberFormat('ko-KR').format(amount);
    return `${currency} ${numberPart}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-hana-light text-hana-purple rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500">Agency & Quote</h3>
          </div>
          <p className="text-lg font-bold text-slate-900 truncate">{data.quote_info.agency}</p>
          <p className="text-sm text-slate-400 font-mono">{data.quote_info.code}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-50 text-hana-mint rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500">Trip Summary</h3>
          </div>
          <p className="text-lg font-bold text-slate-900">{data.trip_summary.period_text}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
             <Users className="w-3 h-3" />
             <span>{data.trip_summary.pax_adult} Adults, {data.trip_summary.pax_child} Children</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500">Total Cost</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(data.cost.total_price, data.cost.currency)}
          </p>
          <p className="text-xs text-slate-400">Per person estimated</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Itinerary */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-hana-purple" /> 
            Itinerary Timeline
          </h2>
          <div className="space-y-4">
            {data.itinerary.map((day, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700">Day {day.day}</span>
                    {day.location && (
                      <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {day.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {day.transport && (
                      <span className="text-xs text-slate-400 flex items-center gap-1" title={day.transport}>
                        <Bus className="w-3 h-3" /> {day.transport}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {/* Hotel Badge if exists */}
                  {day.hotel && day.hotel !== 'None' && (
                    <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-hana-purple bg-hana-light px-2.5 py-1 rounded border border-purple-100">
                      <Building2 className="w-3.5 h-3.5" />
                      {day.hotel}
                    </div>
                  )}

                  {/* Activities */}
                  <ul className="space-y-2 mb-4 ml-1">
                    {day.activities.map((activity, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hana-mint shrink-0" />
                        <span className="leading-relaxed">{activity}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Meals */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg text-xs border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Breakfast</span>
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Utensils className="w-3 h-3 text-orange-400" />
                        <span className="truncate">{day.meals.breakfast || '-'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Lunch</span>
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Utensils className="w-3 h-3 text-orange-400" />
                        <span className="truncate">{day.meals.lunch || '-'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Dinner</span>
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Utensils className="w-3 h-3 text-orange-400" />
                        <span className="truncate">{day.meals.dinner || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Inclusions/Exclusions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Quote Details</h2>
          
          {/* Shopping Conditions Card */}
          {data.cost.shopping_conditions && (
            <div className="bg-gradient-to-br from-hana-light to-white rounded-xl border border-purple-100 p-5 shadow-sm">
              <h3 className="font-semibold text-hana-purple mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                <ShoppingBag className="w-4 h-4" /> Shopping / Options
              </h3>
              <p className="text-slate-800 font-medium text-lg">{data.cost.shopping_conditions}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Included
            </h3>
            <ul className="space-y-2">
              {data.cost.inclusions.length > 0 ? (
                data.cost.inclusions.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 bg-green-400 rounded-full shrink-0" />
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-400 italic">No specific inclusions.</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" /> Excluded
            </h3>
            <ul className="space-y-2">
              {data.cost.exclusions.length > 0 ? (
                data.cost.exclusions.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 bg-red-400 rounded-full shrink-0" />
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-400 italic">No specific exclusions.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
