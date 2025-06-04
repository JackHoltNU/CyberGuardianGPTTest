import React from "react";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  fontSize?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  description,
  fontSize = "text-base",
}) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="flex items-center cursor-pointer">
        <span className={`mr-3 font-medium ${fontSize}`}>{label}</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`block w-12 h-7 rounded-full transition-colors duration-200 ${
              checked ? "bg-teal-500" : "bg-gray-300"
            }`}
          ></div>
          <div
            className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow ${
              checked ? "translate-x-5" : ""
            }`}
          ></div>
        </div>
      </label>
      {description && (
        <span className="text-xs text-gray-500 mt-1 ml-1">{description}</span>
      )}
    </div>
  );
};

export default ToggleSwitch;
