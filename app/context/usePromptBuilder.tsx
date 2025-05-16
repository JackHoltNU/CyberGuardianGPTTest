// context/usePromptBuilder.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
}

const PromptBuilderContext = createContext<
  PromptBuilderContextType | undefined
>(undefined);

interface PromptBuilderProviderProps {
  children: ReactNode;
}

type PromptOption = {
  id: string,
  title: string,
  detailedInstruction: string
}

type PromptSection = {
  id: string,
  title: string,
  options: PromptOption[],
  canDefine: boolean,
  callback: (id: string) => void
}

export const PromptBuilderProvider = ({
  children,
}: PromptBuilderProviderProps) => {
  // Prompt builder state
  const [personality, setPersonality] = useState("professional");
  const [languageDifficulty, setLanguageDifficulty] = useState("unrestricted");
  const [answerLength, setAnswerLength] = useState("single-paragraphs");
  const [personalization, setPersonalization] = useState("");
  const [technicalDifficulty, setTechnicalDifficulty] = useState("basic");
  const [instructionFormat, setInstructionFormat] = useState("step-by-step");
  const [asksQuestions, setAsksQuestions] = useState(false);
  const [includesFollowup, setIncludesFollowup] = useState(false);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(true);
  const [promptSections, setPromptSections] = useState<PromptSection[] | undefined>();
  const [systemPrompt, setSystemPrompt] = useState("");

  // Define the prompt sections and their options
  useEffect(() => {setPromptSections([
    {
      id: 'personality',
      title: 'Personality',
      options: [
        {
          id: 'professional',
          title: 'Professional person',
          detailedInstruction: 'You will adopt a professional, respectful tone. You will communicate clearly and concisely, providing accurate information while maintaining a helpful, service-oriented approach.'
        },
        {
          id: 'friend',
          title: 'Old friend',
          detailedInstruction: 'You will communicate in a warm, friendly manner as if speaking with a long-time friend. Feel free to use casual language, show empathy, and occasionally add light humor when appropriate.'
        },
        {
          id: 'factual',
          title: 'Factual robot',
          detailedInstruction: 'You will provide purely factual, objective information without emotional coloring or subjective assessment. Focus exclusively on verified information and clearly indicate when something is speculative.'
        }
      ],
      canDefine: false,
      callback: (id: string) => setPersonality(id)
    },
    {
      id: 'technical-difficulty',
      title: 'Technical Difficulty',
      options: [
        {
          id: 'technical',
          title: 'Technical',
          detailedInstruction: 'You will use proper technical terminology and concepts when explaining technology-related topics. You will not avoid technical details that are relevant to providing a complete answer.'
        },
        {
          id: 'basic',
          title: 'Basic',
          detailedInstruction: 'You will explain technology concepts using straightforward language, avoiding jargon when possible. When technical terms must be used, you will briefly explain them.'
        },
        {
          id: 'simple',
          title: 'As simple as possible',
          detailedInstruction: 'You will use the simplest possible explanations for all technology concepts, using analogies, metaphors, and everyday examples. Avoid all technical terminology unless absolutely necessary.'
        }
      ],
      canDefine: false,
      callback: (id: string) => setTechnicalDifficulty(id)
    },
    {
      id: 'language-difficulty',
      title: 'Language Difficulty',
      options: [
        {
          id: 'unrestricted',
          title: 'Unrestricted',
          detailedInstruction: 'You will use your full vocabulary range without restrictions, including complex or uncommon words when they most precisely express the intended meaning.'
        },
        {
          id: 'basic',
          title: 'Basic',
          detailedInstruction: 'You will restrict your vocabulary to commonly understood words and phrases, avoiding obscure terminology. Sentences will be straightforward with simple structure.'
        },
        {
          id: 'simple',
          title: 'As simple as possible',
          detailedInstruction: 'You will use only the most common and easily understood words, keeping sentences short and direct. You will avoid complex sentence structures and write at approximately a 5th-grade reading level.'
        }
      ],
      canDefine: false,
      callback: (id: string) => setLanguageDifficulty(id)
    },
    {
      id: 'answer-length',
      title: 'Answer Length',
      options: [
        {
          id: 'single-sentences',
          title: 'Single sentences',
          detailedInstruction: 'You will respond to the user using a single, normal-length sentence, where possible.'
        },
        {
          id: 'single-paragraphs',
          title: 'Single paragraphs',
          detailedInstruction: 'You will respond to the user using a single, focused paragraph that concisely addresses their query.'
        },
        {
          id: 'as-long-as-necessary',
          title: 'As long as necessary',
          detailedInstruction: 'You will provide comprehensive responses of whatever length is required to fully address the user\'s query.'
        }
      ],
      canDefine: false,
      callback: (id: string) => setAnswerLength(id)
    },
    {
      id: 'instruction-style',
      title: 'Instruction Style',
      options: [
        {
          id: 'full-lists',
          title: 'Give full lists',
          detailedInstruction: 'When providing instructions or steps, you will present the complete list all at once in a clear, numbered format so the user can see the entire process.'
        },
        {
          id: 'step-by-step',
          title: 'One step at a time',
          detailedInstruction: 'When providing instructions, you will focus on one step at a time, checking for understanding or completion before moving to the next step.'
        }
      ],
      canDefine: false,
      callback: (id: string) =>  setInstructionFormat(id)
    }
  ])},[]);

  useEffect(() => {
    const prompt = generateSystemPrompt();
    setSystemPrompt(prompt);
  },[personality,technicalDifficulty,languageDifficulty,answerLength,instructionFormat])

  // Generate system prompt based on settings
  const generateSystemPrompt = (): string => {
    let prompt = "";
    if(!promptSections){
      return ""
    };
    prompt += getDetailedInstructionById("personality",personality);
    prompt += "\n\n";
    prompt += getDetailedInstructionById("technical-difficulty",technicalDifficulty);
    prompt += "\n\n";
    prompt += getDetailedInstructionById("language-difficulty",languageDifficulty);
    prompt += "\n\n";
    prompt += getDetailedInstructionById("answer-length", answerLength);
    prompt += "\n\n";
    prompt += getDetailedInstructionById("instruction-style",instructionFormat);
    
    return prompt;
  };

  // Function to get a detailed instruction for any section by id
  const getDetailedInstructionById = (sectionId: string, optionId: string): string => {
    const section = promptSections?.find(section => section.id === sectionId);
    if (!section) return '';
    
    const option = section.options.find(option => option.id === optionId);
    return option?.detailedInstruction || '';
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
        systemPrompt
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
