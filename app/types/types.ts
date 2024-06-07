export type MessageHistory = {
    sender: 'system' | 'user' | 'assistant',
    text: string | Promise<string>
}

export interface ChatResponses {
    messages: string[];
    threadID: string | undefined;
    userTokens: number | undefined;
    botTokens: number | undefined;
}