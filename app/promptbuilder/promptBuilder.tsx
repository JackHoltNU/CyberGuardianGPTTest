import { useState } from "react";
import CardSelector from "./cardSelector";
import { usePromptBuilder } from "../context/usePromptBuilder";
import { MessageHistory, PromptConfiguration } from "../types/types";
import TickAllSelector from "../components/tickAllSelector";
import ToggleSwitch from "../components/toggleSwitch";
import DropdownSelector from "../components/dropdownSelector";
import TextInputBox from "../components/textInputBox";
import styles from "../styles/promptbuilder.module.css";

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
    tone,
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
    tone: "tone",
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
      case "tone":
        return tone;
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
        <div className={styles["pb-comparison-status"]}>
          <h3 className={styles["pb-comparison-status-title"]}>
            Viewing: Configuration {comparisonCounter + 1} of {totalComparisons}
          </h3>
          <p className={`${styles["pb-comparison-status-desc"]}`}>
            Settings below reflect the currently displayed message
          </p>
        </div>
      )}

      <div className={styles["pb-section-spacing"]}>
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
      <div className={styles["pb-personalise-box"]}>
        <h2 className={`${styles["pb-personalise-title"]} ${fontSizes.header}`}>
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
