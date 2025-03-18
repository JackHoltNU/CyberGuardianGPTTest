// app/components/dualChatConfigModal.tsx
import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { AIConfigType } from "../types/types";
import { useDualChat } from "../context/useDualChat";

interface Props {
  closeModal: () => void;
  availableConfigs: AIConfigType[];
  onConfigSelect: (configA: AIConfigType, configB: AIConfigType, randomize: boolean) => void;
}

const DualChatConfigModal = ({ closeModal, availableConfigs, onConfigSelect }: Props) => {
  const [selectedConfigA, setSelectedConfigA] = useState<AIConfigType | null>(null);
  const [selectedConfigB, setSelectedConfigB] = useState<AIConfigType | null>(null);
  const [randomize, setRandomize] = useState(true);
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    // Set default selections if configs are available
    if (availableConfigs.length >= 2) {
      setSelectedConfigA(availableConfigs[0]);
      setSelectedConfigB(availableConfigs[1]);
    }
  }, [availableConfigs]);

  const handleSubmit = () => {
    if (!selectedConfigA || !selectedConfigB) {
      setShowValidationError(true);
      return;
    }

    // Check if the same config is selected for both sides
    if (selectedConfigA.name === selectedConfigB.name) {
      setShowValidationError(true);
      return;
    }

    onConfigSelect(selectedConfigA, selectedConfigB, randomize);
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
              <select
                className="w-full p-2 border rounded"
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

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Configuration B</h3>
              <select
                className="w-full p-2 border rounded"
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

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={randomize}
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