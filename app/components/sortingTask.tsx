"use client";

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export interface SortingItem {
  id: string;
  text: string;
  description?: string;
}

interface SortingTaskProps {
  id: string;
  title: string;
  instructions: string;
  items: SortingItem[];
  criteria: string;
  onComplete: (sortedItems: SortingItem[]) => void;
  minItems?: number;
  maxItems?: number;
}

interface SortableItemProps {
  item: SortingItem;
  index: number;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border-2 border-gray-300 rounded-lg p-4 mb-3 shadow-sm
        flex items-center gap-3 cursor-move hover:border-blue-400
        transition-all duration-200 touch-manipulation
        ${isDragging ? 'shadow-lg border-blue-500 opacity-80 rotate-2 z-50' : ''}
        active:border-blue-400 active:shadow-md
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-700 text-sm">
        {index + 1}
      </div>
      <div className="flex-grow">
        <div className="font-medium text-gray-800">{item.text}</div>
        {item.description && (
          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
        )}
      </div>
      <div className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 active:text-blue-600">
        <GripVertical size={24} />
      </div>
    </div>
  );
};

const SortingTask: React.FC<SortingTaskProps> = ({
  id,
  title,
  instructions,
  items,
  criteria,
  onComplete,
  minItems = 1,
  maxItems,
}) => {
  const [sortedItems, setSortedItems] = useState<SortingItem[]>(items);
  const [isCompleted, setIsCompleted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSortedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleComplete = () => {
    if (sortedItems.length >= minItems && (!maxItems || sortedItems.length <= maxItems)) {
      setIsCompleted(true);
      onComplete(sortedItems);
    }
  };

  const canComplete = sortedItems.length >= minItems && (!maxItems || sortedItems.length <= maxItems);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
          <p className="text-gray-700 mb-4">{instructions}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Ranking Criteria:</h3>
            <p className="text-blue-800">{criteria}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 text-sm text-gray-600">
          <div className="hidden md:block">
            <p>• Drag and drop the cards to reorder them</p>
            <p>• Place the most important item at the top</p>
            <p>• The numbers will update automatically as you move items</p>
          </div>
          <div className="block md:hidden">
            <p>• Touch and hold a card, then drag to reorder</p>
            <p>• Place the most important item at the top</p>
            <p>• Use the grip handle (⋮⋮) on the right to drag easily</p>
            <p>• The numbers will update automatically as you move items</p>
          </div>
        </div>

        {/* Sortable List */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Rank these items (1 = highest priority):
          </h3>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0">
                {sortedItems.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    index={index}
                  />
                ))}
              </div>
              
              {/* Mobile hint */}
              <div className="block md:hidden mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Touch and hold any card to start dragging. Look for the visual feedback when you grab a card.
                </p>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleComplete}
            disabled={!canComplete || isCompleted}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${canComplete && !isCompleted
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isCompleted ? 'Completed' : 'Complete Ranking'}
          </button>
        </div>

        {/* Item count info */}
        {(minItems > 1 || maxItems) && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            {minItems > 1 && `Minimum ${minItems} items required. `}
            {maxItems && `Maximum ${maxItems} items allowed. `}
            Current: {sortedItems.length} items
          </div>
        )}
      </div>
    </div>
  );
};

export default SortingTask;