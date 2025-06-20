export interface SortingItem {
  id: string;
  text: string;
  description?: string;
}

export interface SortingSurveyConfig {
  id: string;
  title: string;
  instructions: string;
  criteria: string;
  items: SortingItem[];
  minItems?: number;
  maxItems?: number;
}

export interface LikertSurveyConfig {
  id: string;
  title: string;
  instructions: string;
  questions: {
    id: string;
    text: string;
    scale: {
      min: number;
      max: number;
      minLabel: string;
      maxLabel: string;
    };
  }[];
}

export interface MultipleChoiceSurveyConfig {
  id: string;
  title: string;
  instructions: string;
  questions: {
    id: string;
    text: string;
    options: {
      id: string;
      text: string;
    }[];
    allowMultiple?: boolean;
  }[];
}

export interface SurveyDefinition {
  id: string;
  type: 'sorting' | 'likert' | 'multiple-choice' | 'text' | 'rating';
  config: SortingSurveyConfig | LikertSurveyConfig | MultipleChoiceSurveyConfig;
  conditions?: {
    studyDays?: number[];
    userRoles?: string[];
    onlyOnce?: boolean;
  };
}

export interface SurveySession {
  sessionId: string;
  username: string;
  surveys: SurveyDefinition[];
  currentIndex: number;
  responses: Record<string, any>;
  startedAt: Date;
  redirectTo?: string;
}