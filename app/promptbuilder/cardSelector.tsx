import { useState, useEffect, useRef } from "react";
import { MessageHistory, PromptConfiguration } from "../types/types";
import { ActivitySquareIcon } from "lucide-react";
import { usePromptBuilder } from "../context/usePromptBuilder";
import styles from "../styles/promptbuilder.module.css";

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
  const { getPromptConfigHash } = usePromptBuilder();

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
  const [isNarrowLayout, setIsNarrowLayout] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCustomSelected = selectedOption === "define-new-instruction";

  // Update selection when defaultSelected changes (e.g., when navigating comparisons)
  useEffect(() => {
    if (defaultSelected && defaultSelected !== selectedOption) {
      setSelectedOption(defaultSelected);
    }
  }, [defaultSelected]);

  // Container width detection for responsive layout
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // Switch to narrow layout when container width is less than 500px
        setIsNarrowLayout(width < 500);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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

  // Get color for a specific configuration using shared mapping
  const getConfigColor = (config: PromptConfiguration): string => {
    const configHash = getPromptConfigHash(config);
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
      <span
        className={`${
          configsUsingOption.length <= 2 ? "flex flex-row" : `grid grid-cols-2`
        } gap-1 items-center`}
      >
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
    <div ref={containerRef}>
      {title && (
        <h2
          className={`${styles["pb-cardselector-title"]} ${fontSizes.header}`}
        >
          {title}
        </h2>
      )}

      <div className={isNarrowLayout ? styles["pb-cardselector-layout-narrow"] : styles["pb-cardselector-layout"]}>
        <div className={isNarrowLayout ? styles["pb-cardselector-options-col-narrow"] : styles["pb-cardselector-options-col"]}>
          <div className={styles["pb-cardselector-options-grid"]}>
            {allOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`${styles["pb-cardselector-option-card"]} ${
                  fontSizes.chat
                } ${
                  selectedOption === option.id
                    ? styles["pb-cardselector-option-selected"]
                    : styles["pb-cardselector-option-unselected"]
                }`}
              >
                <span className={styles["pb-cardselector-option-title"]}>
                  {option.title}
                </span>
                <span className={styles["pb-cardselector-dots-row"]}>
                  {renderConfigDots(option.id)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={isNarrowLayout ? styles["pb-cardselector-textarea-col-narrow"] : styles["pb-cardselector-textarea-col"]}>
          <textarea
            value={
              isCustomSelected ? customInstruction : getDetailedInstruction()
            }
            onChange={handleCustomInstructionChange}
            disabled={!isCustomSelected}
            className={`${isNarrowLayout ? styles["pb-cardselector-textarea-narrow"] : styles["pb-cardselector-textarea"]} ${
              fontSizes.input
            } ${
              styles["pb-cardselector-textarea-active"]
            }`}
            rows={isNarrowLayout ? 4 : 5}
            placeholder={isCustomSelected ? "Enter custom instruction..." : ""}
          />
        </div>
      </div>
    </div>
  );
};

export default CardSelector;
