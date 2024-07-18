import React, { useState } from 'react';

interface LikertScaleProps {
  question: string;
  options: number;
  onValueChange: (value: number | null) => void;
  required?: boolean;
}

const LikertScale: React.FC<LikertScaleProps> = ({ question, options, onValueChange, required = false }) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setSelectedValue(value);
    onValueChange(value);
  };

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">{question}</h2>
      <div className="flex justify-between items-center">
        {Array.from({ length: options }, (_, i) => (
          <label key={i} className="flex flex-col items-center">
            <input
              type="radio"
              name="likert"
              value={i + 1}
              checked={selectedValue === i + 1}
              onChange={handleChange}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <span className="mt-2">{i + 1}</span>
          </label>
        ))}
      </div>
      {required && !selectedValue && (
        <p className="mt-2 text-red-600">Please select an option.</p>
      )}      
    </div>
  );
};

export default LikertScale;