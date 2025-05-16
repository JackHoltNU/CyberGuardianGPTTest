import { useState } from 'react';

type Option = {
  id: string;
  title: string;
  detailedInstruction: string;
};

type CardSelectorProps = {
  title?: string;
  options?: Option[];
  defaultSelected?: string;
  includeCustomOption?: boolean;
  customOptionLabel?: string;
  showSaveButton?: boolean;
  saveButtonLabel?: string;
  onSelectionChange?: (id: string) => void;
  onSave?: (optionId: string, value: string) => void;
};

const CardSelector: React.FC<CardSelectorProps> = ({
  title = "Answer Length",
  options = [
    { 
      id: 'single-sentences', 
      title: 'Single sentences',
      detailedInstruction: 'You will respond to the user using a single, normal-length sentence, where possible.'
    },
    { 
      id: 'single-paragraphs', 
      title: 'Single paragraphs',
      detailedInstruction: 'You will respond to the user using a single, focused paragraph that concisely addresses their query.'
    },
    { 
      id: 'as-long-as-necessary', 
      title: 'As long as necessary',
      detailedInstruction: 'You will provide comprehensive responses of whatever length is required to fully address the user\'s query.'
    }
  ],
  defaultSelected,
  includeCustomOption = false,
  customOptionLabel = 'Define new instruction',
  showSaveButton = false,
  saveButtonLabel = 'Save',
  onSelectionChange,
  onSave
}) => {
  // If custom option is included, add it to the options
  const allOptions = includeCustomOption 
    ? [
        ...options, 
        { 
          id: 'define-new-instruction', 
          title: customOptionLabel,
          detailedInstruction: ''
        }
      ]
    : options;
    
  const [selectedOption, setSelectedOption] = useState<string | null>(defaultSelected || allOptions[0].id);
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const isCustomSelected = selectedOption === 'define-new-instruction';

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);    
    
    if (onSelectionChange) {
      onSelectionChange(
        optionId,         
      );
    }
  };

  const handleCustomInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCustomInstruction(value);
    
    if (onSelectionChange && selectedOption === 'define-new-instruction') {
      // TODO if including this functionality
    }
  };

  const handleSave = () => {
    if (onSave && selectedOption) {
      const value = isCustomSelected ? customInstruction : getDetailedInstruction();
      onSave(selectedOption, value);
    }
  };

  // Get the current detailed instruction based on selection
  const getDetailedInstruction = () => {
    if (!selectedOption) return '';
    
    const selectedOpt = allOptions.find(opt => opt.id === selectedOption);
    const fullText = `The chatbot will be given the following instructions: \n\n"${selectedOpt?.detailedInstruction}"`;
    return fullText || '';
  };

  return (
    <>
      {title && <h2 className="text-lg font-medium mb-3 text-gray-800">{title}</h2>}
      
      <div className="flex space-x-5">
        <div className="w-1/3">
          <div className="grid grid-cols-1 gap-3">
            {allOptions.map(option => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`
                  px-3 py-3 rounded-md cursor-pointer text-center text-base transition-all h-auto
                  ${selectedOption === option.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}
                `}
              >
                {option.title}
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-2/3">
          <textarea
            value={isCustomSelected ? customInstruction : getDetailedInstruction()}
            onChange={handleCustomInstructionChange}
            disabled={!isCustomSelected}
            className={`
              w-full h-full p-4 text-base border border-gray-400 rounded-md 
              ${isCustomSelected 
                ? 'focus:ring-blue-500 focus:border-blue-500 bg-white' 
                : 'bg-gray-100 text-gray-800'}
            `}
            rows={5}
            placeholder={isCustomSelected ? "Enter custom instruction..." : ""}
          />
        </div>
      </div>

      
    </>
  );
};

export default CardSelector;