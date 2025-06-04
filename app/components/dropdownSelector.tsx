import React from "react";

interface Option {
  id: string;
  label: string;
}

interface DropdownSelectorProps {
  title?: string;
  options: Option[];
  selected?: string;
  onChange?: (id: string) => void;
  fontSize?: string;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  title,
  options,
  selected,
  onChange,
  fontSize = "text-base",
}) => {
  return (
    <div className="mb-4">
      {title && <h3 className={`font-semibold mb-2 ${fontSize}`}>{title}</h3>}
      <select
        className={`w-full p-3 border-2 rounded-lg bg-white shadow-sm focus:outline-none focus:border-blue-500 ${fontSize}`}
        value={selected || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownSelector;
