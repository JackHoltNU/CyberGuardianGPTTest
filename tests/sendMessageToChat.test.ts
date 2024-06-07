import { ChatResponses, MessageHistory } from "@/app/types/types";
import { sendMessageToChat } from "../app/pages/api/bot";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Hello there!' } }],
              usage: {prompt_tokens:2, completion_tokens:3}
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
      userTokens: 2,
      botTokens: 3,
    };

    const message: MessageHistory[] = [{ sender: "user", text: "Hi" }];

    // Call the function to be tested
    const result = await sendMessageToChat(message);

    // Assertions
    expect(result).toEqual(mockResponse);
  });
});
