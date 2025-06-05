// context/usePromptBuilder.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { PromptConfiguration } from "../types/types";

interface PromptBuilderContextType {
  promptSections: PromptSection[] | undefined;
  personality: string;
  setPersonality: (value: string) => void;
  languageDifficulty: string;
  setLanguageDifficulty: (value: string) => void;
  answerLength: string;
  setAnswerLength: (value: string) => void;
  personalization: string;
  setPersonalization: (value: string) => void;
  technicalDifficulty: string;
  setTechnicalDifficulty: (value: string) => void;
  instructionFormat: string;
  setInstructionFormat: (value: string) => void;
  asksQuestions: boolean;
  setAsksQuestions: (value: boolean) => void;
  includesFollowup: boolean;
  setIncludesFollowup: (value: boolean) => void;
  generateSystemPrompt: () => string;
  promptBuilderOpen: boolean;
  setPromptBuilderOpen: (value: boolean) => void;
  systemPrompt: string;
  getCurrentConfiguration: () => PromptConfiguration;
  applyConfiguration: (config: PromptConfiguration) => void;
  specifyDevices: boolean;
  setSpecifyDevices: (value: boolean) => void;
  selectedDevices: string[];
  setSelectedDevices: (value: string[]) => void;
  computerType: string;
  setComputerType: (value: string) => void;
  tabletType: string;
  setTabletType: (value: string) => void;
  mobileType: string;
  setMobileType: (value: string) => void;
  browser: string;
  setBrowser: (value: string) => void;
  additionalInstructions: string;
  setAdditionalInstructions: (value: string) => void;
}

const PromptBuilderContext = createContext<
  PromptBuilderContextType | undefined
>(undefined);

interface PromptBuilderProviderProps {
  children: ReactNode;
}

type PromptOption = {
  id: string;
  title: string;
  detailedInstruction: string;
};

type PromptSection = {
  id: string;
  title: string;
  options: PromptOption[];
  canDefine: boolean;
  callback: (id: string) => void;
};

export const PromptBuilderProvider = ({
  children,
}: PromptBuilderProviderProps) => {
  // Prompt builder state
  const [personality, setPersonality] = useState("professional");
  const [languageDifficulty, setLanguageDifficulty] = useState("unrestricted");
  const [answerLength, setAnswerLength] = useState("conversational");
  const [personalization, setPersonalization] = useState("");
  const [technicalDifficulty, setTechnicalDifficulty] = useState("technical");
  const [instructionFormat, setInstructionFormat] = useState("full-lists");
  const [asksQuestions, setAsksQuestions] = useState(false);
  const [includesFollowup, setIncludesFollowup] = useState(false);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(true);
  const [promptSections, setPromptSections] = useState<
    PromptSection[] | undefined
  >();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [specifyDevices, setSpecifyDevices] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [computerType, setComputerType] = useState("");
  const [tabletType, setTabletType] = useState("");
  const [mobileType, setMobileType] = useState("");
  const [browser, setBrowser] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const getCurrentConfiguration = (): PromptConfiguration => {
    const getDisplayLabel = (sectionId: string, optionId: string): string => {
      const section = promptSections?.find((s) => s.id === sectionId);
      const option = section?.options.find((o) => o.id === optionId);
      return option?.title || optionId;
    };

    // Generate a hash for the config to use as id
    const id = [
      personality,
      languageDifficulty,
      answerLength,
      technicalDifficulty,
      instructionFormat,
      specifyDevices ? "1" : "0",
      (selectedDevices || []).join(","),
      computerType || "",
      tabletType || "",
      mobileType || "",
      browser || "",
      additionalInstructions || "",
    ].join("|");

    return {
      id,
      personality,
      languageDifficulty,
      answerLength,
      technicalDifficulty,
      instructionFormat,
      personalityLabel: getDisplayLabel("personality", personality),
      languageDifficultyLabel: getDisplayLabel(
        "language-difficulty",
        languageDifficulty
      ),
      answerLengthLabel: getDisplayLabel("answer-length", answerLength),
      technicalDifficultyLabel: getDisplayLabel(
        "technical-difficulty",
        technicalDifficulty
      ),
      instructionFormatLabel: getDisplayLabel(
        "instruction-style",
        instructionFormat
      ),
      specifyDevices,
      selectedDevices,
      computerType,
      tabletType,
      mobileType,
      browser,
      additionalInstructions,
    };
  };

  const applyConfiguration = (config: PromptConfiguration) => {
    setPersonality(config.personality);
    setLanguageDifficulty(config.languageDifficulty);
    setAnswerLength(config.answerLength);
    setTechnicalDifficulty(config.technicalDifficulty);
    setInstructionFormat(config.instructionFormat);
  };

  // Define the prompt sections and their options
  useEffect(() => {
    setPromptSections([
      {
        id: "personality",
        title: "Personality",
        options: [
          {
            id: "professional",
            title: "Professional",
            detailedInstruction:
              "You will adopt a professional, respectful tone. You will communicate clearly and concisely, providing accurate information while maintaining a helpful, service-oriented approach.",
          },
          {
            id: "friend",
            title: "Friend",
            detailedInstruction:
              "You will communicate in a warm, friendly manner as if speaking with a long-time friend. Feel free to use casual language, show empathy, and occasionally add light humor when appropriate. Do not act like you are providing a service; you are just two people having a conversation.",
          },
          {
            id: "factual",
            title: "Robot",
            detailedInstruction:
              "You will provide purely factual, objective information without emotional colouring or subjective assessment. You are an AI assistant and should not give the impression that you are a human.",
          },
        ],
        canDefine: false,
        callback: (id: string) => setPersonality(id),
      },
      {
        id: "technical-difficulty",
        title: "Technical Difficulty",
        options: [
          {
            id: "technical",
            title: "Technical",
            detailedInstruction:
              "You will use proper technical terminology and concepts when explaining technology-related topics. You will not avoid technical details that are relevant to providing a complete answer.",
          },
          {
            id: "basic",
            title: "Basic",
            detailedInstruction:
              "You will explain technology concepts using straightforward language, avoiding jargon when possible. When technical terms must be used, you will briefly explain them.",
          },
          {
            id: "simple",
            title: "As simple as possible",
            detailedInstruction:
              "You will use the simplest possible explanations for all technology concepts, using analogies, metaphors, and everyday examples. Avoid all technical terminology unless absolutely necessary.",
          },
        ],
        canDefine: false,
        callback: (id: string) => setTechnicalDifficulty(id),
      },
      {
        id: "language-difficulty",
        title: "Language Difficulty",
        options: [
          {
            id: "unrestricted",
            title: "Unrestricted",
            detailedInstruction:
              "You will use your full vocabulary range without restrictions, including complex or uncommon words when they most precisely express the intended meaning, except where these conflict with preferences around technical jargon.",
          },
          {
            id: "basic",
            title: "Basic",
            detailedInstruction:
              "You will restrict your vocabulary to commonly understood words and phrases, avoiding obscure terminology. Language will be straightforward, avoiding complex sentence structures.",
          },
          {
            id: "simple",
            title: "As simple as possible",
            detailedInstruction:
              "You will use only the most common and easily understood words, keeping sentences short and direct. You will use only very simple sentence structures and write in a way that is understandable to those of all reading levels.",
          },
        ],
        canDefine: false,
        callback: (id: string) => setLanguageDifficulty(id),
      },
      {
        id: "answer-length",
        title: "Answer Length",
        options: [
          {
            id: "conversational",
            title: "Conversational",
            detailedInstruction:
              "You will respond to the user using short, conversational responses that are one or two sentences long.",
          },
          {
            id: "single-paragraphs",
            title: "Single paragraphs",
            detailedInstruction:
              "You will respond to the user using a single, focused paragraph that concisely addresses their query.",
          },
          {
            id: "as-long-as-necessary",
            title: "As long as necessary",
            detailedInstruction:
              "You will provide comprehensive responses of whatever length is required to fully address the user's query.",
          },
        ],
        canDefine: false,
        callback: (id: string) => setAnswerLength(id),
      },
      {
        id: "instruction-style",
        title: "Instruction Style",
        options: [
          {
            id: "full-lists",
            title: "Give full lists",
            detailedInstruction:
              "When providing instructions or steps, you will present the complete list all at once in a clear, numbered format so the user can see the entire process.",
          },
          {
            id: "step-by-step",
            title: "One step at a time",
            detailedInstruction:
              "When providing instructions, you will focus on one step at a time, checking for understanding or completion before moving to the next step.",
          },
        ],
        canDefine: false,
        callback: (id: string) => setInstructionFormat(id),
      },
    ]);
  }, []);

  useEffect(() => {
    const prompt = generateSystemPrompt();
    setSystemPrompt(prompt);
  }, [
    promptSections,
    personality,
    technicalDifficulty,
    languageDifficulty,
    answerLength,
    instructionFormat,
    selectedDevices,
    browser,
    additionalInstructions,
  ]);

  // Generate system prompt based on settings
  const generateSystemPrompt = (): string => {
    let prompt = "";
    if (!promptSections) {
      return "";
    }
    prompt += getDetailedInstructionById("personality", personality);
    prompt += "\n\n";
    prompt += getDetailedInstructionById(
      "technical-difficulty",
      technicalDifficulty
    );
    prompt += "\n\n";
    prompt += getDetailedInstructionById(
      "language-difficulty",
      languageDifficulty
    );
    prompt += "\n\n";
    prompt += getDetailedInstructionById("answer-length", answerLength);
    prompt += "\n\n";
    prompt += getDetailedInstructionById(
      "instruction-style",
      instructionFormat
    );

    // --- New device/browser/instructions logic ---
    if (specifyDevices && selectedDevices.length > 0) {
      prompt += `\n\nThe user has indicated that they are using the following devices:`;
      if (selectedDevices.includes("computer") && computerType) {
        prompt += `\n- A Computer: (${computerType})`;
      }
      if (selectedDevices.includes("tablet") && tabletType) {
        prompt += `\n- A tablet: (${tabletType})`;
      }
      if (selectedDevices.includes("mobile") && mobileType) {
        prompt += `\n- A mobile phone: (${mobileType})`;
      }
      if (browser) {
        prompt += `\n\nThe user has specified that they are using the following browser: ${browser}`;
      }
      if (additionalInstructions) {
        prompt += `\n\nThe user has also included the following additional instructions: ${additionalInstructions}`;
      }
    }
    return prompt;
  };

  // Function to get a detailed instruction for any section by id
  const getDetailedInstructionById = (
    sectionId: string,
    optionId: string
  ): string => {
    const section = promptSections?.find((section) => section.id === sectionId);
    if (!section) return "";

    const option = section.options.find((option) => option.id === optionId);
    return option?.detailedInstruction || "";
  };

  return (
    <PromptBuilderContext.Provider
      value={{
        promptSections,
        personality,
        setPersonality,
        languageDifficulty,
        setLanguageDifficulty,
        answerLength,
        setAnswerLength,
        personalization,
        setPersonalization,
        technicalDifficulty,
        setTechnicalDifficulty,
        instructionFormat,
        setInstructionFormat,
        asksQuestions,
        setAsksQuestions,
        includesFollowup,
        setIncludesFollowup,
        generateSystemPrompt,
        promptBuilderOpen,
        setPromptBuilderOpen,
        systemPrompt,
        getCurrentConfiguration,
        applyConfiguration,
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
      }}
    >
      {children}
    </PromptBuilderContext.Provider>
  );
};

export const usePromptBuilder = () => {
  const context = useContext(PromptBuilderContext);
  if (context === undefined) {
    throw new Error(
      "usePromptBuilder must be used within a PromptBuilderProvider"
    );
  }
  return context;
};
