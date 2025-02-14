export type AIConfigType = {
  primary: string;
  secondary?: string;
  mainPrompt: string;
  formatPrompt: string;
};

export type MessageRating = {
  upvoted: boolean;
  downvoted: boolean;
  comments: string[];
};

export type MessageHistory = {
  id?: string;
  sender: "system" | "user" | "assistant";
  text: string | Promise<string>;
  title?: string;
  timestamp?: Date;
  messageRating?: MessageRating;
  model?: string;
  mainPrompt?: string;
  formatPrompt?: string;
};

export interface ChatResponses {
  id: string;
  title: string;
  message: string;
  threadID: string | undefined;
  userTokens: number | undefined;
  botTokens: number | undefined;
}

export type MessageInstance = {
  id: string;
  threadID: string;
  title: string;
  message: string;
  timestamp: Date;
  user: string;
  feedback: MessageRating;
  tags: string[];
};

export type ComparisonInstance = {
  id: string;
  threadID: string;
  title: string;
  text: string;
  timestamp?: Date;
  sender: "system" | "user" | "assistant";
  config?: AIConfigType;
  selected?: Boolean;
};

export type Comparison = {
  version1: ComparisonInstance;
  version2?: ComparisonInstance;
};

export type ComparisonThread = {
  comparisons: Comparison[];
}

export type ComparisonChatCollection = {
  threads: ComparisonThread[];
}

export type ChatInstance = {
  threadID: string;
  title: string;
  messages: MessageHistory[];
  latestTimestamp?: Date;
};

export type ChatCollection = {
  chats: ChatInstance[];
};

export type UserInstance = {
  username: string;
  role: string;
};

export type UserCollection = {
  users: UserInstance[];
};
