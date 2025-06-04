import React, { useState } from "react";

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface TickAllSelectorProps {
  title?: string;
  options: Option[];
  defaultSelected?: string[];
  onSelectionChange?: (selected: string[]) => void;
  fontSize?: string;
}

const TickAllSelector: React.FC<TickAllSelectorProps> = ({
  title,
  options,
  defaultSelected = [],
  onSelectionChange,
  fontSize = "text-base",
}) => {
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  const handleToggle = (id: string) => {
    let updated: string[];
    if (selected.includes(id)) {
      updated = selected.filter((s) => s !== id);
    } else {
      updated = [...selected, id];
    }
    setSelected(updated);
    if (onSelectionChange) onSelectionChange(updated);
  };

  return (
    <div className="mb-4">
      {title && <h3 className={`font-semibold mb-2 ${fontSize}`}>{title}</h3>}
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center p-4 rounded-lg border-2 transition-colors duration-150 cursor-pointer bg-white shadow-sm ${
              selected.includes(opt.id)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={() => handleToggle(opt.id)}
              className="form-checkbox h-5 w-5 text-blue-600 mr-3"
            />
            <div className="flex flex-col">
              <span className={`font-medium ${fontSize}`}>{opt.label}</span>
              {opt.description && (
                <span className="text-xs text-gray-500 mt-1">
                  {opt.description}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TickAllSelector;
