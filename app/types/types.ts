export type AIConfigType = {
    primary: string,
    secondary: string,
    mainPrompt: string,
    formatPrompt: string
}

export type MessageRating = {
    upvoted: boolean;
    downvoted: boolean;
    comments: string[];
}

export type MessageHistory = {
    id?: string,
    sender: 'system' | 'user' | 'assistant',
    text: string | Promise<string>,
    title?: string,
    timestamp?: Date
    messageRating?: MessageRating;
}

export interface ChatResponses {
    id: string;
    title: string;
    message: string;
    threadID: string | undefined;
    userTokens: number | undefined;
    botTokens: number | undefined;
}

export type MessageInstance = {
    id: string,
    threadID: string,
    title: string,
    message: string,
    timestamp: Date,
    user: string,
    feedback: MessageRating,
    tags: string[]
}

export type ChatInstance = {
    threadID: string,
    title: string,
    messages: MessageHistory[],
    latestTimestamp?: Date,
}

export type ChatCollection = {
    chats: ChatInstance[]
}

export type UserInstance = {
    username: string,
    role: string
}

export type UserCollection = {
    users: UserInstance[]
}