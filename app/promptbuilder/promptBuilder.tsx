import { useState } from "react";
import CardSelector from "./cardSelector";
import { usePromptBuilder } from "../context/usePromptBuilder";
import { MessageHistory, PromptConfiguration } from "../types/types";

interface PromptBuilderProps {
  comparisonConfigs?: PromptConfiguration[];
  currentConfig?: PromptConfiguration;
  comparisonMode?: boolean;
  comparisonCounter?: number;
  totalComparisons?: number;
  fontSizes: {
    chat: string;
    input: string;
    header: string;
  };
  configColorMap: Map<string, string>;
  comparisonMessages: MessageHistory[];
}

const PromptBuilder: React.FC<PromptBuilderProps> = ({
  comparisonConfigs = [],
  currentConfig,
  comparisonMode = false,
  comparisonCounter = 0,
  totalComparisons = 0,
  fontSizes,
  configColorMap,
  comparisonMessages,
}) => {
  const {
    promptSections,
    personality,
    languageDifficulty,
    answerLength,
    technicalDifficulty,
    instructionFormat,
  } = usePromptBuilder();

  // Mapping of section IDs to PromptConfiguration keys and current values
  const sectionKeyMapping: { [key: string]: keyof PromptConfiguration } = {
    personality: "personality",
    "language-difficulty": "languageDifficulty",
    "answer-length": "answerLength",
    "technical-difficulty": "technicalDifficulty",
    "instruction-style": "instructionFormat",
  };

  // Get current value for each section (either from current config or from context)
  const getCurrentValue = (sectionId: string): string => {
    if (comparisonMode && currentConfig) {
      const key = sectionKeyMapping[sectionId];
      return currentConfig[key] as string;
    }

    // Fall back to context values when not in comparison mode
    switch (sectionId) {
      case "personality":
        return personality;
      case "language-difficulty":
        return languageDifficulty;
      case "answer-length":
        return answerLength;
      case "technical-difficulty":
        return technicalDifficulty;
      case "instruction-style":
        return instructionFormat;
      default:
        return "";
    }
  };

  return (
    <>
      {/* Header with comparison status */}
      {comparisonMode && totalComparisons > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3
            className={`text-sm font-medium text-blue-800 ${fontSizes.header}`}
          >
            Viewing: Configuration {comparisonCounter + 1} of {totalComparisons}
          </h3>
          <p className={`text-xs text-blue-600 mt-1 ${fontSizes.chat}`}>
            Settings below reflect the currently displayed message
          </p>
        </div>
      )}

      <div className="space-y-6">
        {promptSections?.map((section) => (
          <CardSelector
            key={section.id}
            title={section.title}
            options={section.options}
            defaultSelected={getCurrentValue(section.id)}
            onSelectionChange={section.callback}
            includeCustomOption={section.canDefine}
            customOptionLabel="Define new"
            comparisonConfigs={comparisonConfigs}
            currentConfig={currentConfig}
            settingKey={sectionKeyMapping[section.id]}
            fontSizes={fontSizes}
            configColorMap={configColorMap}
            comparisonMessages={comparisonMessages}
            comparisonCounter={comparisonCounter}
          />
        ))}
      </div>
    </>
  );
};

export default PromptBuilder;
