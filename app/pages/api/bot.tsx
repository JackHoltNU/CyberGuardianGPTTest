"use server"

import OpenAI from "openai";
import { ThreadMessage } from "openai/resources/beta/threads/index.mjs";

interface ChatResponses {
    messages: string[];
    threadID: string | undefined;
    userTokens: number | undefined;
    botTokens: number | undefined;
}

export const sendMessageToBot = async (userMessage: string, threadID: string | undefined): Promise<ChatResponses> => {
    const openai = new OpenAI({ apiKey: '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'});
    let thread: OpenAI.Beta.Threads.Thread;

    const getResponse = async (thread: OpenAI.Beta.Threads.Thread): Promise<ChatResponses> => {
        let run: OpenAI.Beta.Threads.Runs.Run;
        try {
            run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: "asst_Ep7a4MHToBAM4vc9kSQorWIo" 
            })
        } catch (error) {
            console.error("Couldn't get run", error);
        }
    

        return new Promise((resolve, reject) => {
            async function checkStatus() {
                console.log("Running checkstatus");

                try {
                    console.log("retrieving run");

                    run = await openai.beta.threads.runs.retrieve(
                        thread.id,
                        run.id
                    );  
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

                            const textMessages = messages.data[0].content.filter((msg): msg is OpenAI.Beta.Threads.Messages.MessageContentText => {
                                if(msg){
                                    return msg.type === 'text'
                                }
                                return false
                            });
                            const stringMessages = textMessages.map((msg) => msg.text.value);
                            console.log(stringMessages);
                        
                            resolve({messages: stringMessages, threadID: thread.id, userTokens: run.usage?.prompt_tokens, botTokens: run.usage?.completion_tokens});
                        } catch (error) {
                            console.error("Failed to retrieve message");
                        }    
                    })();                         
                }
            }
        
        
            const intervalId = setInterval(checkStatus,2000);
        });     
    }

    let ChatResponses = { messages: [], threadID, userTokens: undefined, botTokens: undefined };
    if(threadID){
        console.log("Found thread id, retrieving");
        try {
            thread = await openai.beta.threads.retrieve(threadID);
            await openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: userMessage
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
                content: userMessage
            });            

            return getResponse(thread);
        } catch (error) {
            console.error("Couldn't create thread", error);
        }
    }     

    return ChatResponses;      

    // try {
    //     const messagethread = await openai.beta.threads.messages.list(thread.id);
    // } catch (error) {
    //     console.error("Failed to retrieve thread:", error)
    // }
    
  };