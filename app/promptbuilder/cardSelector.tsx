import { useState, useEffect } from "react";
import { MessageHistory, PromptConfiguration } from "../types/types";
import { ActivitySquareIcon } from "lucide-react";

type Option = {
  id: string;
  title: string;
  detailedInstruction: string;
};

type CardSelectorProps = {
  title?: string;
  options: Option[];
  defaultSelected?: string;
  includeCustomOption?: boolean;
  customOptionLabel?: string;
  showSaveButton?: boolean;
  saveButtonLabel?: string;
  onSelectionChange?: (id: string) => void;
  onSave?: (optionId: string, value: string) => void;
  comparisonConfigs?: PromptConfiguration[];
  currentConfig?: PromptConfiguration;
  settingKey?: keyof PromptConfiguration;
  fontSizes: {
    chat: string;
    input: string;
    header: string;
  };
  configColorMap: Map<string, string>;
  comparisonMessages: MessageHistory[];
  comparisonCounter: number;
};

const CardSelector: React.FC<CardSelectorProps> = ({
  title,
  options,
  defaultSelected,
  includeCustomOption = false,
  customOptionLabel,
  showSaveButton = false,
  saveButtonLabel = "Save",
  onSelectionChange,
  onSave,
  comparisonConfigs = [],
  currentConfig,
  settingKey,
  fontSizes,
  configColorMap,
  comparisonMessages,
  comparisonCounter,
}) => {
  // If custom option is included, add it to the options
  const allOptions = includeCustomOption
    ? [
        ...options,
        {
          id: "define-new-instruction",
          title: customOptionLabel,
          detailedInstruction: "",
        },
      ]
    : options;

  // Use defaultSelected to set the initial selection, and update when it changes
  const [selectedOption, setSelectedOption] = useState<string | null>(
    defaultSelected || allOptions[0].id
  );
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const isCustomSelected = selectedOption === "define-new-instruction";

  // Update selection when defaultSelected changes (e.g., when navigating comparisons)
  useEffect(() => {
    if (defaultSelected && defaultSelected !== selectedOption) {
      setSelectedOption(defaultSelected);
    }
  }, [defaultSelected]);

  // Get which configs use this specific option
  const getConfigsUsingOption = (optionId: string): PromptConfiguration[] => {
    if (!settingKey) return [];

    return comparisonConfigs.filter((config) => {
      const settingValue = config[settingKey];
      return settingValue === optionId;
    });
  };

  // Check if current config uses this option
  const isCurrentConfigOption = (optionId: string): boolean => {
    if (!currentConfig || !settingKey) return false;
    return currentConfig[settingKey] === optionId;
  };

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);

    if (onSelectionChange) {
      onSelectionChange(optionId);
    }
  };

  const handleCustomInstructionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setCustomInstruction(value);

    if (onSelectionChange && selectedOption === "define-new-instruction") {
      // TODO if including this functionality
    }
  };

  const handleSave = () => {
    if (onSave && selectedOption) {
      const value = isCustomSelected
        ? customInstruction
        : getDetailedInstruction();
      onSave(selectedOption, value);
    }
  };

  // Get the current detailed instruction based on selection
  const getDetailedInstruction = () => {
    if (!selectedOption) return "";

    const selectedOpt = allOptions.find((opt) => opt.id === selectedOption);
    const fullText = `The chatbot will be given the following instructions: \n\n"${selectedOpt?.detailedInstruction}"`;
    return fullText || "";
  };

  // Generate a hash for configuration to assign consistent colors
  const getConfigHash = (config: PromptConfiguration): string => {
    return `${config.personality}-${config.languageDifficulty}-${config.answerLength}-${config.technicalDifficulty}-${config.instructionFormat}`;
  };

  // Get color for a specific configuration using shared mapping
  const getConfigColor = (config: PromptConfiguration): string => {
    const configHash = getConfigHash(config);
    return configColorMap.get(configHash) || "gray";
  };

  // Color class maps for Tailwind
  const borderColorClassMap: Record<string, string> = {
    blue: "border-blue-500",
    green: "border-green-500",
    orange: "border-orange-500",
    purple: "border-purple-500",
    red: "border-red-500",
    yellow: "border-yellow-500",
    pink: "border-pink-500",
    indigo: "border-indigo-500",
    gray: "border-gray-500",
  };
  const bgColorClassMap: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    gray: "bg-gray-500",
  };

  // Render color dots for an option
  const renderConfigDots = (optionId: string) => {
    const configsUsingOption = getConfigsUsingOption(optionId);

    if (comparisonConfigs.length === 0 || configsUsingOption.length === 0)
      return null;

    // Get the id of the config for the currently displayed comparison message
    let activeComparisonConfigId =
      comparisonMessages[comparisonCounter]?.promptConfig?.id;

    return (
      <span className="flex flex-row gap-1 items-center">
        {configsUsingOption.map((config, index) => {
          // Only fill the dot if this config is the one for the currently displayed comparison message
          const isCurrentConfig =
            activeComparisonConfigId && config.id === activeComparisonConfigId;
          const colorName = getConfigColor(config);
          return (
            <span
              key={config.id}
              className={`w-4 h-4 rounded-full inline-block align-middle ml-0.5 mr-0.5
                ${
                  isCurrentConfig
                    ? `${bgColorClassMap[colorName]}`
                    : `border-4 ${borderColorClassMap[colorName]} bg-transparent`
                }
              `}
              title={`Config using ${colorName}${
                isCurrentConfig ? " (current)" : ""
              }`}
            />
          );
        })}
      </span>
    );
  };

  return (
    <>
      {title && (
        <h2 className={`mb-3 text-gray-800 ${fontSizes.header}`}>{title}</h2>
      )}

      <div className="flex space-x-5">
        <div className="w-1/3">
          <div className="grid grid-cols-1 gap-3">
            {allOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`
                  px-3 py-3 rounded-md cursor-pointer transition-all h-auto flex items-center gap-2
                  ${fontSizes.chat}
                  ${
                    selectedOption === option.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }
                `}
              >
                <span className="flex-1 text-left">{option.title}</span>
                <span className="flex flex-row gap-1 items-center">
                  {renderConfigDots(option.id)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-2/3">
          <textarea
            value={
              isCustomSelected ? customInstruction : getDetailedInstruction()
            }
            onChange={handleCustomInstructionChange}
            disabled={!isCustomSelected}
            className={`
              w-full h-full p-4 border border-gray-400 rounded-md 
              ${fontSizes.input}
              ${
                isCustomSelected
                  ? "focus:ring-blue-500 focus:border-blue-500 bg-white"
                  : "bg-gray-100 text-gray-800"
              }
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
