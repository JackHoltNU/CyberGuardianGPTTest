import { useState } from "react";
import CardSelector from "./cardSelector";
import { usePromptBuilder } from "../context/usePromptBuilder";
import { MessageHistory, PromptConfiguration } from "../types/types";
import TickAllSelector from "../components/tickAllSelector";
import ToggleSwitch from "../components/toggleSwitch";
import DropdownSelector from "../components/dropdownSelector";
import TextInputBox from "../components/textInputBox";

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
    specifyDevices,
    setSpecifyDevices,
    selectedDevices,
    setSelectedDevices,
    computerType,
    setComputerType,
    tabletType,
    setTabletType,
    mobileType,
    setMobileType,
    browser,
    setBrowser,
    additionalInstructions,
    setAdditionalInstructions,
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

  const deviceOptions = [
    { id: "computer", label: "Computers" },
    { id: "tablet", label: "Tablets" },
    { id: "mobile", label: "Mobile Devices" },
  ];

  const computerOptions = [
    { id: "windows", label: "Windows" },
    { id: "apple", label: "Apple" },
    { id: "chromebook", label: "Chromebook" },
    { id: "other", label: "Other" },
  ];
  const tabletOptions = [
    { id: "ios", label: "iOS" },
    { id: "android", label: "Android" },
    { id: "other", label: "Other" },
  ];
  const mobileOptions = [
    { id: "ios", label: "iOS" },
    { id: "android", label: "Android" },
    { id: "other", label: "Other" },
  ];
  const browserOptions = [
    { id: "chrome", label: "Chrome" },
    { id: "firefox", label: "Firefox" },
    { id: "edge", label: "Edge" },
    { id: "safari", label: "Safari" },
    { id: "opera", label: "Opera" },
    { id: "other", label: "Other" },
  ];

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

      {/* --- DEMO OF NEW COMPONENTS --- */}
      <div className="mt-10 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className={`font-bold mb-4 ${fontSizes.header}`}>
          Personalise Instructions
        </h2>
        <ToggleSwitch
          label="Specify instructions for particular devices or browser?"
          checked={specifyDevices}
          onChange={setSpecifyDevices}
        />
        {specifyDevices && (
          <>
            <TickAllSelector
              title="Which devices?"
              options={deviceOptions}
              defaultSelected={selectedDevices}
              onSelectionChange={setSelectedDevices}
            />
            {selectedDevices.includes("computer") && (
              <DropdownSelector
                title="Computer Type"
                options={computerOptions}
                selected={computerType}
                onChange={setComputerType}
              />
            )}
            {selectedDevices.includes("tablet") && (
              <DropdownSelector
                title="Tablet Type"
                options={tabletOptions}
                selected={tabletType}
                onChange={setTabletType}
              />
            )}
            {selectedDevices.includes("mobile") && (
              <DropdownSelector
                title="Mobile Type"
                options={mobileOptions}
                selected={mobileType}
                onChange={setMobileType}
              />
            )}
            <DropdownSelector
              title="Browser"
              options={browserOptions}
              selected={browser}
              onChange={setBrowser}
            />
            <TextInputBox
              label="Additional Instructions"
              value={additionalInstructions}
              onChange={setAdditionalInstructions}
              placeholder="Enter any extra details here..."
              rows={3}
            />
          </>
        )}
      </div>
    </>
  );
};

export default PromptBuilder;
