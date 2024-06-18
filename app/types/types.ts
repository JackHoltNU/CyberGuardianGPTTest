export type MessageHistory = {
    sender: 'system' | 'user' | 'assistant',
    text: string | Promise<string>,
    title?: string
}

export interface ChatResponses {
    title: string;
    messages: string[];
    threadID: string | undefined;
    userTokens: number | undefined;
    botTokens: number | undefined;
}

export type ChatInstance = {
    threadID: string,
    title: string,
    messages: MessageHistory[],
}

export type ChatCollection = {
    chats: ChatInstance[]
}