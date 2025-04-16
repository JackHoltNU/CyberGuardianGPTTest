// app/components/dualChatConfigModal.tsx
import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { AIConfigType } from "../types/types";
import { useDualChat } from "../context/useDualChat";


interface Props {
  closeModal: () => void;
  availableConfigs: AIConfigType[];
  onConfigSelect: (configA: AIConfigType, configB: AIConfigType, randomize: boolean) => void;
  chatNameA: string;
  chatNameB: string;
  setDisplayNames: (chatNameA: string, chatNameB: string) => void;
}

const DualChatConfigModal = ({ closeModal, availableConfigs, onConfigSelect, chatNameA, chatNameB, setDisplayNames }: Props) => {
  const { leftConfig, rightConfig } = useDualChat();
  const [selectedConfigA, setSelectedConfigA] = useState<AIConfigType | null>(null);
  const [selectedConfigB, setSelectedConfigB] = useState<AIConfigType | null>(null);
  const [displayNameA, setChatNameA] = useState(chatNameA);
  const [displayNameB, setChatNameB] = useState(chatNameB);

  const [randomize, setRandomize] = useState(true);
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    if(leftConfig && leftConfig.primary){
      setSelectedConfigA(leftConfig);
    }
    if(rightConfig && rightConfig.primary){
      setSelectedConfigB(rightConfig);
    }
    // Set default selections if configs are available
    if (!leftConfig && !rightConfig && availableConfigs.length >= 2) {
      console.log("test")
      setSelectedConfigA(availableConfigs[0]);
      setSelectedConfigB(availableConfigs[1]);
    }
  }, [availableConfigs]);

  const handleSubmit = () => {
    if (!selectedConfigA || !selectedConfigB) {
      setShowValidationError(true);
      return;
    }    

    onConfigSelect(selectedConfigA, selectedConfigB, randomize);
    setDisplayNames(displayNameA, displayNameB);
    closeModal();
  };

  return (
    <Modal closeModal={closeModal} submit={handleSubmit}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-center">Dual Chat Configuration</h2>
        
        {availableConfigs.length < 2 ? (
          <div className="text-red-500 mb-4">
            You need at least two different AI configurations to use Dual Chat.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Configuration A</h3>
              <div className="py-2 pl-3 flex items-center justify-between w-auto">
                <label className="mr-2">Model</label>
                <select
                  className="p-2 border rounded"
                  value={selectedConfigA?.name || ""}
                  onChange={(e) => {
                    const config = availableConfigs.find(c => c.name === e.target.value);
                    if (config) setSelectedConfigA(config);
                    setShowValidationError(false);
                  }}
                >
                  <option value="" disabled>Select Configuration A</option>
                  {availableConfigs.map(config => (
                    <option key={`A-${config.name}`} value={config.name}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="py-2 pl-3 flex items-center justify-between w-auto">
                <label className="mr-2">Display Name</label>
                <input type="text" value={displayNameA} className="border rounded p-2" onChange={(e) => setChatNameA(e.target.value)}/>
              </div>
            </div>

            

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Configuration B</h3>
              <div className="py-2 pl-3 flex items-center justify-between w-auto">
                <label className="mr-2">Model</label>
                <select
                className="p-2 border rounded"
                value={selectedConfigB?.name || ""}
                onChange={(e) => {
                  const config = availableConfigs.find(c => c.name === e.target.value);
                  if (config) setSelectedConfigB(config);
                  setShowValidationError(false);
                }}
              >
                <option value="" disabled>Select Configuration B</option>
                {availableConfigs.map(config => (
                  <option key={`B-${config.name}`} value={config.name}>
                    {config.name}
                  </option>
                ))}
              </select>
              </div>
              
              <div className="py-2 pl-3 flex items-center justify-between w-auto">
                <label className="mr-2">Display Name</label>
                <input type="text" value={displayNameB} className="border rounded p-2" onChange={(e) => setChatNameB(e.target.value)}/>
              </div>
              
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={(e) => setRandomize(e.target.checked)}
                  className="mr-2"
                />
                <span>Randomize positions (hide which config is which)</span>
              </label>
            </div>

            {showValidationError && (
              <div className="text-red-500 mb-4">
                Please select two different configurations.
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default DualChatConfigModal;