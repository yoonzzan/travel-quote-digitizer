import React from 'react';
import { TravelQuoteData } from '../types';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import TripSummaryEditor from './editor/TripSummaryEditor';
import CostEditor from './editor/CostEditor';
import ItineraryEditor from './editor/ItineraryEditor';

interface DataEditorProps {
  data: TravelQuoteData;
  onChange: (data: TravelQuoteData) => void;
}

const DataEditor: React.FC<DataEditorProps> = ({ data, onChange }) => {

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.droppableId !== result.destination.droppableId) return;

    const { source, destination } = result;
    const listType = source.droppableId;

    if (listType === 'itinerary') {
      const list = Array.from(data.itinerary);
      const [removed] = list.splice(source.index, 1);
      list.splice(destination.index, 0, removed);

      // Re-assign day numbers to match new order
      const reorderedList = list.map((item, index) => ({ ...item, day: index + 1 }));

      onChange({
        ...data,
        itinerary: reorderedList
      });
    } else {
      const type = listType as 'inclusions' | 'exclusions';
      // Create a new array from the existing list
      const list = Array.from(data.cost[type] || []);
      const [removed] = list.splice(source.index, 1);
      list.splice(destination.index, 0, removed);

      onChange({
        ...data,
        cost: { ...data.cost, [type]: list }
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Trip Summary & Basic Info */}
        <TripSummaryEditor data={data} onChange={onChange} />

        {/* Cost Details & Inclusions/Exclusions */}
        <CostEditor data={data} onChange={onChange} />

        {/* Itinerary */}
        <ItineraryEditor data={data} onChange={onChange} />
      </DragDropContext>
    </div>
  );
};

export default DataEditor;
