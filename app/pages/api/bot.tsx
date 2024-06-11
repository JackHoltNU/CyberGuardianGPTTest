"use server";

import OpenAI from "openai";
import dotenv from "dotenv";
import { ChatResponses, MessageHistory } from "@/app/types/types";
import Chat from "@/app/models/Chat";
import connectToDatabase from "@/app/lib/mongodb";
dotenv.config();

interface ChatCompletionRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const createOrContinueChat = async (threadID: string, user: string, newMessage: MessageHistory, messageHistory: MessageHistory[]) => {
  const chat = await Chat.findOne({ threadID });

  try {
    if (chat) {
        chat.messages.push(newMessage);
        await chat.save();
      } else {
        await Chat.create({
          threadID,
          user,
          messages: [...messageHistory],
        });
      }
  } catch (error) {
    console.error(`Couldn't save chat to database`)
  }  
}

export const sendMessageToChat = async (
  messageHistory: MessageHistory[], user: string, threadID: string | undefined
): Promise<ChatResponses> => {
  console.log("sendMessageToChat called");
  await connectToDatabase();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if(threadID === undefined){
    threadID = crypto.randomUUID();
  }

  await createOrContinueChat(threadID, user, messageHistory[messageHistory.length - 1], messageHistory);

  const messagesParam: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content:
        "You assist users with online safety, emphasizing essential security practices such as strong password creation, scam identification, and software updates, in clear, simple UK English. In particular, you help with overcoming technological difficulties. Many of your users will be older adults who aren't heavy technology users and aren't confident with technology. You avoid technical jargon, sometimes using analogies to help yourself be understood when talking about complex matters. You never use analogies for things that are already easy to understand. In both urgent and non-urgent situations, you provide guidance in a conversational style, avoiding long lists of instructions unless explicitly instructed. Instead, you offer step-by-step advice one step at a time, allowing for back-and-forth interaction to ensure clarity and support. This approach helps users feel more comfortable and supported, making the guidance more accessible and effective. You discourage users from disclosing personal details to you. In cases of high risk, you suggest that the user contact a friend or family member, or suggest they contact a cyberguardian, whose contact details should be available on the cyberguardians website.",
    },
    ...messageHistory.map((item) => ({
      role: item.sender,
      content: item.text as string,
    })),
  ];

  try {
    const completion = await openai.chat.completions.create({
      messages: messagesParam,
      model: "ft:gpt-3.5-turbo-1106:personal:test-finetune:9WLpJhZj",
    });

    const responseMessage = completion.choices[0].message.content ?? "";

    await createOrContinueChat(threadID, user, {sender: "assistant", text: responseMessage},messageHistory);

    return {
      messages: [completion.choices[0].message.content ?? ""],
      threadID: "1",
      userTokens: completion.usage?.prompt_tokens,
      botTokens: completion.usage?.completion_tokens,
    };
  } catch (error: any) {
    console.error("Couldn't create chat completion", error);
    throw new Error(`Failed to create chat completion: ${error.message}`);
  }
};

// Assistant API not needed and at present doesn't support fine-tuned models
export const sendMessageToAssistant = async (
  userMessage: string,
  threadID: string | undefined
): Promise<ChatResponses> => {
  const openai = new OpenAI({
    apiKey: "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",
  });
  let thread: OpenAI.Beta.Threads.Thread;

  const getResponse = async (
    thread: OpenAI.Beta.Threads.Thread
  ): Promise<ChatResponses> => {
    let run: OpenAI.Beta.Threads.Runs.Run;
    try {
      run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: "asst_Ep7a4MHToBAM4vc9kSQorWIo",
      });
    } catch (error: any) {
      console.error("Couldn't get run", error);
      throw new Error(`Failed to create run: ${error.message}`);
    }

    return new Promise((resolve, reject) => {
      async function checkStatus() {
        console.log("Running checkstatus");

        try {
          console.log("retrieving run");

          run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          console.log(run);
          console.log("retrieved run");
        } catch (error) {
          console.error("Problem receiving run");
        }

        if (run.status == "completed") {
          // console.log('Status: Completed');
          console.log("Run completed");

          clearInterval(intervalId);
          (async () => {
            try {
              console.log("Getting messages");

              const messages = await openai.beta.threads.messages.list(
                thread.id
              );

              console.log("Converting messages to text only");

              const textMessages = messages.data[0].content.filter(
                (
                  msg
                ): msg is OpenAI.Beta.Threads.Messages.MessageContentText => {
                  if (msg) {
                    return msg.type === "text";
                  }
                  return false;
                }
              );
              const stringMessages = textMessages.map((msg) => msg.text.value);
              console.log(stringMessages);

              resolve({
                messages: stringMessages,
                threadID: thread.id,
                userTokens: run.usage?.prompt_tokens,
                botTokens: run.usage?.completion_tokens,
              });
            } catch (error) {
              console.error("Failed to retrieve message");
            }
          })();
        }
      }
      const intervalId = setInterval(checkStatus, 2000);
    });
  };

  let ChatResponses = {
    messages: [],
    threadID,
    userTokens: undefined,
    botTokens: undefined,
  };
  if (threadID) {
    console.log("Found thread id, retrieving");
    try {
      thread = await openai.beta.threads.retrieve(threadID);
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage,
      });

      return getResponse(thread);
    } catch (error) {
      console.error("Couldn't retrieve thread", error);
    }
  } else {
    try {
      console.log("Creating new thread");

      thread = await openai.beta.threads.create();
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage,
      });

      return getResponse(thread);
    } catch (error) {
      console.error("Couldn't create thread", error);
    }
  }

  return ChatResponses;
};
