import React from "react";

interface TextInputBoxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  fontSize?: string;
}

const TextInputBox: React.FC<TextInputBoxProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 3,
  fontSize = "text-base",
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className={`block mb-2 font-medium ${fontSize}`}>{label}</label>
      )}
      <textarea
        className={`w-full p-3 border-2 rounded-lg bg-white shadow-sm focus:outline-none focus:border-blue-500 resize-none ${fontSize}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
};

export default TextInputBox;
