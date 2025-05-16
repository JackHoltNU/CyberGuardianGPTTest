import { useState } from "react";
import CardSelector from "./cardSelector";
import { usePromptBuilder } from "../context/usePromptBuilder";

const PromptBuilder: React.FC = () => {
  const {    
    promptSections,
  } = usePromptBuilder();

  return (
    <>
      <div className="space-y-6">
        {promptSections?.map((section) => (
          <CardSelector
            key={section.id}
            title={section.title}
            options={section.options}
            onSelectionChange={section.callback}
            includeCustomOption={section.canDefine}
            customOptionLabel="Define new"
          />
        ))}
      </div>
    </>
  );
};

export default PromptBuilder;
