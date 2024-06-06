import { MessageHistory } from "@/app/hooks/useChatbot";
import { ChatResponses, sendMessageToChat } from "../app/pages/api/bot";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Hello there!' } }],
            }),
          },
        },
  }));
});

describe("generateChatCompletion", () => {
  it("should call chat.completions.create with the correct parameters", async() => {
    // Mock the chat.completions.create() method
    const mockResponse: ChatResponses = {
      messages: ["Hello there!"],
      threadID: "1",
      userTokens: undefined,
      botTokens: undefined,
    };

    const message: MessageHistory[] = [{ sender: "user", text: "Hi" }];

    // Call the function to be tested
    const result = await sendMessageToChat(message);

    // Assertions
    expect(result).toEqual(mockResponse);
  });
});
