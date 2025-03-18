'use client'

import React, { useEffect, useState } from "react"
import { useAdmin } from "../context/useAdmin";
import { AIConfigType } from "../types/types";
import Modal from "../components/modal";

const ConfigAI = () => {
    const { config, getAIConfig, updateAIConfig } = useAdmin();
    const [ configs, setConfigs ] = useState<AIConfigType[]>([]);
    const [ selectedConfig, setSelectedConfig ] = useState<AIConfigType | null>(null);
    const [ newConfigName, setNewConfigName ] = useState("");
    const [ isDefault, setIsDefault ] = useState(false);
    const [ showAddModal, setShowAddModal ] = useState(false);
    const [ showDeleteConfirmation, setShowDeleteConfirmation ] = useState(false);
    const [ configToDelete, setConfigToDelete ] = useState<string | null | undefined>(null);

    useEffect(() => {
        loadConfigs();        
    }, [])

    const loadConfigs = async () => {
        try {
            const response = await fetch('/api/getAIConfigs', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error loading configs: ${response.status}`);
            }
            
            const data = await response.json();
            setConfigs(data.configs);
            
            // Set the first config as selected if none is selected
            if (data.configs.length > 0 && !selectedConfig) {
                setSelectedConfig(data.configs[0]);
            }
        } catch (error) {
            console.error("Failed to load configs:", error);
        }
    };

    const handleConfigSelect = (configName: string) => {
        const selected = configs.find(c => c.name === configName);
        if (selected) {
            setSelectedConfig(selected);
        }
    };

    const handleUpdateConfig = async () => {
        if (!selectedConfig) return;
        
        try {
            const response = await fetch('/api/updateAIConfig', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    configName: selectedConfig.name,
                    newConfig: selectedConfig
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Error updating config: ${response.status}`);
            }
            
            await loadConfigs();
        } catch (error) {
            console.error("Failed to update config:", error);
        }
    };

    const handleAddConfig = async () => {
        if (!newConfigName.trim()) return;
        
        // Check if name already exists
        if (configs.some(c => c.name === newConfigName)) {
            alert("A configuration with this name already exists.");
            return;
        }
        
        const newConfig: AIConfigType = {
            name: newConfigName,
            isDefault: isDefault,
            primary: "gpt-4o",
            secondary: "",
            mainPrompt: "",
            formatPrompt: ""
        };
        
        try {
            const response = await fetch('/api/addAIConfig', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config: newConfig }),
            });
            
            if (!response.ok) {
                throw new Error(`Error adding config: ${response.status}`);
            }
            
            await loadConfigs();
            setNewConfigName("");
            setIsDefault(false);
            setShowAddModal(false);
            
            // Select the newly created config
            setSelectedConfig(newConfig);
        } catch (error) {
            console.error("Failed to add config:", error);
        }
    };

    const handleDeleteConfig = async () => {
        if (!configToDelete) return;
        
        try {
            const response = await fetch('/api/deleteAIConfig', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ configName: configToDelete }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error deleting config: ${errorText}`);
            }
            
            await loadConfigs();
            
            // If the deleted config was selected, select the first available config
            if (selectedConfig?.name === configToDelete) {
                const updatedConfigs = configs.filter(c => c.name !== configToDelete);
                if (updatedConfigs.length > 0) {
                    setSelectedConfig(updatedConfigs[0]);
                } else {
                    setSelectedConfig(null);
                }
            }
            
            setShowDeleteConfirmation(false);
            setConfigToDelete(null);
        } catch (error: any) {
            console.error("Failed to delete config:", error);
            alert(error.message);
        }
    };

    return (
        <>
        <h2 className="mt-10 text-md font-bold">AI Configurations</h2>
        
        <div className="flex mt-4 mb-6">
            <select
                className="p-2 border rounded mr-2"
                value={selectedConfig?.name || ""}
                onChange={(e) => handleConfigSelect(e.target.value)}
            >
                <option value="" disabled>Select Configuration</option>
                {configs.map(conf => (
                    <option key={conf.name} value={conf.name}>
                        {conf.name} {conf.isDefault ? "(Default)" : ""}
                    </option>
                ))}
            </select>
            
            <button 
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => setShowAddModal(true)}
            >
                Add New
            </button>
            
            {selectedConfig && (
                <button 
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={() => {
                        setConfigToDelete(selectedConfig.name);
                        setShowDeleteConfirmation(true);
                    }}
                >
                    Delete
                </button>
            )}
        </div>
        
        {selectedConfig && (
            <div className="lg:w-full lg:flex lg:flex-col mt-2">
                <div className="flex w-full lg:w-full justify-between my-2">
                    <label className="w-1/6">Name</label>
                    <input
                        type="text"
                        className="border-2 ml-2 w-2/3"
                        value={selectedConfig.name}
                        onChange={(e) => setSelectedConfig({...selectedConfig, name: e.target.value})}
                    />
                </div>
                
                <div className="flex w-full lg:w-full justify-between my-2">
                    <label className="w-1/6">Default Configuration</label>
                    <input
                        type="checkbox"
                        className="ml-2"
                        checked={selectedConfig.isDefault}
                        onChange={(e) => setSelectedConfig({...selectedConfig, isDefault: e.target.checked})}
                    />
                </div>
                
                <div className="flex w-full lg:w-full justify-between my-2">
                    <label className="w-1/6">Primary Model</label>
                    <input
                        type="text"
                        className="border-2 ml-2 w-2/3"
                        value={selectedConfig.primary}
                        onChange={(e) => setSelectedConfig({...selectedConfig, primary: e.target.value})}
                    />
                </div>
                
                <div className="flex w-full lg:w-full justify-between lg:my-2">
                    <label className="w-1/6">Secondary Model</label>
                    <input
                        type="text"
                        className="border-2 ml-2 w-2/3"
                        value={selectedConfig.secondary || ""}
                        onChange={(e) => setSelectedConfig({...selectedConfig, secondary: e.target.value})}
                    />
                </div>
                
                <div className="flex w-full lg:w-full justify-between lg:my-2">
                    <label className="w-1/6">Main Prompt</label>
                    <textarea                    
                        className="border-2 ml-2 w-2/3 h-80"
                        value={selectedConfig.mainPrompt}
                        onChange={(e) => setSelectedConfig({...selectedConfig, mainPrompt: e.target.value})}
                    />
                </div>
                
                <div className="flex w-full lg:w-full justify-between lg:my-2">
                    <label className="w-1/6">Format Prompt</label>
                    <textarea                    
                        className="border-2 ml-2 w-2/3 h-40"
                        value={selectedConfig.formatPrompt}
                        onChange={(e) => setSelectedConfig({...selectedConfig, formatPrompt: e.target.value})}
                    />
                </div>
                
                <button 
                    className="w-full lg:w-1/6 h-8 lg:h-6 bg-blue-200 mt-6 md:my-2 lg:ml-auto rounded-md" 
                    onClick={handleUpdateConfig}
                >
                    Save Changes
                </button>
            </div>
        )}
        
        {/* Add Configuration Modal */}
        {showAddModal && (
            <Modal
                closeModal={() => setShowAddModal(false)}
                submit={handleAddConfig}
                submitWording="Add"
            >
                <h2 className="text-xl font-bold mb-4">Add New Configuration</h2>
                
                <div className="mb-4">
                    <label className="block mb-2">Configuration Name</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={newConfigName}
                        onChange={(e) => setNewConfigName(e.target.value)}
                        placeholder="Enter configuration name"
                    />
                </div>
                
                <div className="mb-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="mr-2"
                        />
                        <span>Set as default configuration</span>
                    </label>
                </div>
            </Modal>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
            <Modal
                closeModal={() => {
                    setShowDeleteConfirmation(false);
                    setConfigToDelete(null);
                }}
                submit={handleDeleteConfig}
                submitWording="Delete"
            >
                <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                <p>Are you sure you want to delete the configuration &quot;{configToDelete}&quot;?</p>
                <p className="text-red-500 mt-2">This action cannot be undone.</p>
            </Modal>
        )}
        </>
    )
}

export default ConfigAI;