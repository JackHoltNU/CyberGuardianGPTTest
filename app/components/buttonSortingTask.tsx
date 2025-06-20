"use client";

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface SortingItem {
  id: string;
  text: string;
  description?: string;
}

interface ButtonSortingTaskProps {
  id: string;
  title: string;
  instructions: string;
  items: SortingItem[];
  criteria: string;
  onComplete: (sortedItems: SortingItem[]) => void;
  minItems?: number;
  maxItems?: number;
}

const ButtonSortingTask: React.FC<ButtonSortingTaskProps> = ({
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
  const [fadingItems, setFadingItems] = useState<Set<string>>(new Set());
  const [highlightedItems, setHighlightedItems] = useState<Record<string, 'up' | 'down'>>({});

  const moveUp = (index: number) => {
    if (index > 0) {
      const currentItem = sortedItems[index];
      const targetItem = sortedItems[index - 1];
      
      // Start fade out animation
      setFadingItems(new Set([currentItem.id, targetItem.id]));
      
      // Swap items after fade out
      setTimeout(() => {
        const newItems = [...sortedItems];
        [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        setSortedItems(newItems);
        
        // Clear fading and add highlights
        setFadingItems(new Set());
        setHighlightedItems({
          [currentItem.id]: 'up',    // Item that moved up gets green
          [targetItem.id]: 'down'    // Item that moved down gets red
        });
        
        // Clear highlights after delay
        setTimeout(() => {
          setHighlightedItems({});
        }, 1000);
      }, 200);
    }
  };

  const moveDown = (index: number) => {
    if (index < sortedItems.length - 1) {
      const currentItem = sortedItems[index];
      const targetItem = sortedItems[index + 1];
      
      // Start fade out animation
      setFadingItems(new Set([currentItem.id, targetItem.id]));
      
      // Swap items after fade out
      setTimeout(() => {
        const newItems = [...sortedItems];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setSortedItems(newItems);
        
        // Clear fading and add highlights
        setFadingItems(new Set());
        setHighlightedItems({
          [currentItem.id]: 'down',  // Item that moved down gets red
          [targetItem.id]: 'up'      // Item that moved up gets green
        });
        
        // Clear highlights after delay
        setTimeout(() => {
          setHighlightedItems({});
        }, 1000);
      }, 200);
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
          <p>• Use the green up arrow to move items higher in ranking</p>
          <p>• Use the red down arrow to move items lower in ranking</p>          
        </div>

        {/* Sortable List */}
        <div className="mb-6">          
          
          <div className="space-y-3">
            {sortedItems.map((item, index) => {
              const isFading = fadingItems.has(item.id);
              const highlight = highlightedItems[item.id];
              
              // Determine border color based on highlight
              let borderClass = 'border-gray-300';
              if (highlight === 'up') {
                borderClass = 'border-green-500';
              } else if (highlight === 'down') {
                borderClass = 'border-red-500';
              }
              
              return (
                <div
                  key={item.id}
                  className={`bg-white border-2 rounded-lg p-4 shadow-sm hover:border-blue-400 transition-all duration-200 ${borderClass}`}
                  style={{
                    opacity: isFading ? 0 : 1,
                    transition: isFading 
                      ? 'opacity 200ms ease-in-out' 
                      : highlight 
                      ? 'all 200ms ease-in-out, border-color 1000ms ease-out'
                      : 'all 200ms ease-in-out'
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-700 text-lg mt-1">
                      {index + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-grow">
                      <div className="font-medium text-gray-800 mb-1">{item.text}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600">{item.description}</div>
                      )}
                    </div>
                    
                    {/* Control Buttons - Side by Side */}
                    <div className="flex-shrink-0 flex flex-row gap-2">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0 || fadingItems.has(item.id) || 
                                 (index > 0 && fadingItems.has(sortedItems[index - 1].id))}
                        className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
                        title="Move up one position"
                      >
                        <ChevronUp size={24} />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === sortedItems.length - 1 || fadingItems.has(item.id) || 
                                 (index < sortedItems.length - 1 && fadingItems.has(sortedItems[index + 1].id))}
                        className="w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
                        title="Move down one position"
                      >
                        <ChevronDown size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

export default ButtonSortingTask;