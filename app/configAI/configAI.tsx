'use client'

import React, { useEffect, useState } from "react"
import { useAdmin } from "../context/useAdmin";
import { AIConfigType } from "../types/types";

const ConfigAI = () => {
    const { config, getAIConfig, updateAIConfig } = useAdmin();
    const [ primary, setPrimary ] = useState("")
    const [ secondary, setSecondary ] = useState("")
    const [ mainPrompt, setMainPrompt ] = useState("");
    const [ formatPrompt, setFormatPrompt ] = useState("");

    useEffect(() => {
        getAIConfig();        
    },[])

    useEffect(() => {
        if(!config){
            return;
        }
        setPrimary(config.primary);
        setSecondary(config.secondary);
        setMainPrompt(config.mainPrompt);
        setFormatPrompt(config.formatPrompt);
    },[config])

    const submitConfig = () => {
        const newConfig: AIConfigType = {
            primary: primary,
            secondary: secondary,
            mainPrompt,
            formatPrompt
        }
        updateAIConfig(newConfig);
    }

    return (
        <>
        <h2 className="mt-10 text-md font-bold">Set Config</h2>
        <div className="lg:w-full lg:flex lg:flex-col mt-2">
            <div className="flex w-full lg:w-full justify-end my-2">
                <label >Primary Model</label>
                <input
                    type="text"
                    className="border-2 ml-2 w-2/3"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                />
            </div>
            <div className="flex w-full lg:w-full justify-end lg:my-2">
                <label >Secondary Model</label>
                <input
                    type="text"
                    className="border-2 ml-2 w-2/3"
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                />
            </div>   
            <div className="flex w-full lg:w-full justify-end lg:my-2">
                <label >Main Prompt</label>
                <textarea                    
                    className="border-2 ml-2 w-2/3 h-80"
                    value={mainPrompt}
                    onChange={(e) => setMainPrompt(e.target.value)}
                />
            </div>    
            <div className="flex w-full lg:w-full justify-end lg:my-2">
                <label >Format Prompt</label>
                <textarea                    
                    className="border-2 ml-2 w-2/3 h-40"
                    value={formatPrompt}
                    onChange={(e) => setFormatPrompt(e.target.value)}
                />
            </div>         
            <button className="w-full lg:w-1/6 h-8 lg:h-6 bg-blue-200 mt-6 md:my-2 lg:ml-auto rounded-md" onClick={() => submitConfig()}>Save</button>
        </div>
        </>
    )
}

export default ConfigAI;