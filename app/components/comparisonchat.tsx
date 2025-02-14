"use client";

import React, { useEffect, useRef, useState } from "react";
import { useComparisonChatbot } from "../context/useComparisonChatbot";
import LoadingDots from "../components/loadingdots";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Message from "../components/message";
import { Comparison, MessageHistory } from "../types/types";
import ReactMarkdown from "react-markdown";
import { useAdmin } from "../context/useAdmin";
import exportChatAsPdf from "../utils/exportpdf";
import { useRouter } from "next/navigation";
import Modal from "./modal";

interface ComparisonResponseProps {
  text: string;
  model: string;
  onSelect: () => void;
}

const ComparisonResponse: React.FC<ComparisonResponseProps> = ({
  text,
  model,
  onSelect,
}) => {
  return (
    <div className="flex flex-col p-4 border rounded-lg w-full">
      <div className="mb-2 text-sm font-medium text-gray-500">
        Model: {model}
      </div>
      <div className="message message--bot rounded-lg mb-4">
        <ReactMarkdown className="markdown">{text}</ReactMarkdown>
      </div>
      <button
        onClick={onSelect}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        Select This Response
      </button>
    </div>
  );
};

interface Props {
  session: Session;
}

const ComparisonChat = ({ session }: Props) => {
  const {
    comparisonMessages,
    title,
    threadId,
    showError,    
    sendMessageComparison,
    setComparisonMessages,
    setUser,
    setTitle,
    setShowError,
    resetComparisonChat,
    saveComparisonToDB,
    deleteChat,
  } = useComparisonChatbot();
  const { config, getAIConfig } = useAdmin();

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentComparison, setCurrentComparison] = useState<Comparison>();
  const [pendingResponses, setPendingResponses] = useState<{
    primary?: string;
    secondary?: string;
    userMessage?: string;
  }>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDeletedAlert, setShowDeletedAlert] = useState(false);  
  const [showResponsePrompt, setShowResponsePrompt] = useState(false);
  const [ showDeleteModal, setShowDeleteModal ] = useState(false);
  const [ responseRequired, setResponseRequired ] = useState(false);
  
  

  useEffect(() => {
    if (session.user?.name) {
      setUser(session.user.name);
    }
  }, [session]);

  useEffect(() => {
    getAIConfig();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comparisonMessages, pendingResponses]);

  const sendMessages = async () => {
    if(responseRequired){
      setShowResponsePrompt(true);
      return;
    }
    const sendText = inputText.trim();
    if (sendText === "") return;

    setInputText("");
    setLoading(true);

    try {
      if (!config) {
        console.log("no config");
        return;
      }
      const comparison: Comparison | undefined = await sendMessageComparison(
        sendText,
        config
      );

      //   Promise.all([
      //     primaryResponse.json(),
      //     secondaryResponse.json(),
      //   ]);

      setPendingResponses({
        primary: comparison?.version1.text,
        secondary: comparison?.version2?.text,
      });
      setCurrentComparison(comparison);
      setResponseRequired(true);
    } catch (error) {
      console.error("Failed to send message:", error);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const selectResponse = (response: string, model: string) => {
    const msg: MessageHistory = {
      sender: "assistant",
      text: response,
      model: model,
    };
    const newMsgHistory = [...comparisonMessages, msg];
    setComparisonMessages(newMsgHistory);
    const comparison = currentComparison;
    if(comparison && model == "primary"){
      comparison.version1.selected = true;
      setTitle(comparison.version1.title);
      if(comparison.version2){
        comparison.version2.selected = false;        
      }
    } else {
      if(comparison){
        comparison.version1.selected = false;
        if(comparison.version2){
          comparison.version2.selected = true;
          setTitle(comparison.version2.title);
        }
      }     
    }
    if(comparison){
      saveComparisonToDB(comparison);
    }

    setPendingResponses(undefined);
    setResponseRequired(false);
    setShowResponsePrompt(false);
  };

  const deleteChatAndShowDeleted = () => {
    deleteChat();
    showDeleted();
    setShowDeleteModal(false);
  }

  const showDeleted = () => {
    setShowDeletedAlert(true);
    setShowMoreOptions(false);
    setTimeout(() => setShowDeletedAlert(false), 3000);
  }  

  return (
    <div className="chatcomparison">
      {/* <div className="chat__header">
        <div className="chat__header-empty-space"></div>
        <header className="chat__title">Model Comparison Mode</header>
        <button className="button--logout" onClick={() => signOut()}>
          Log Out
        </button>
      </div> */}
      <div className="chat__header">
        <div className="chat__header-empty-space"></div>
        <header className="chat__title">CyberGuardian GPT</header>
        <button className="button--logout" onClick={() => signOut()}>
          Log Out
        </button>
      </div>
      <div className="chat__actions">
        <div className="chat__action">
          <button className="button--new-chat" onClick={() => resetComparisonChat()}>
            Start new chat
          </button>
        </div>
        <div className="chat__action">
          <button
            className="button--more-options"
            onClick={() => {
              setShowMoreOptions(!showMoreOptions);
            }}
          >
            ...
          </button>
        </div>
      </div>

      {showMoreOptions && (
        <div className="chat__more-options">
          <ul className="more-options__list">
            {/* <li>
              <button className="more-options__item button--rate-chat" onClick={() => {
                setShowMoreOptions(false);
                setShowFeedbackModal(true);
                }}>Rate this chat</button>
            </li>   */}
            <li>
              <button
                className="more-options__item button--save-pdf-full"
                onClick={() => exportChatAsPdf(comparisonMessages, title)}
              >
                Save as PDF
              </button>
            </li>
            <li>
              <button
                className="more-options__item button--delete-chat"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete this chat
              </button>
            </li>
            <li>
              <button
                className="more-options__item button--cancel"
                onClick={() => setShowMoreOptions(false)}
              >
                Cancel
              </button>
            </li>
            <li>
              {session.user.role === "admin" && (
                <button
                  className="more-options__item button--dashboard"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </button>
              )}
            </li>
          </ul>
        </div>
      )}

      {showDeletedAlert && <div className="chat__alert">Chat deleted</div>}

      <div className="chat__messages" ref={scrollRef} aria-live="polite">
        {comparisonMessages.map((msg, index) => (
          <Message
            messageHistory={msg}
            key={msg.id !== "" ? msg.id : `Message${threadId}${index}`}
          />
        ))}

        {pendingResponses?.userMessage && (
          <Message
            messageHistory={{
              sender: "user",
              text: pendingResponses.userMessage,
            }}
            key={`pending-user-${comparisonMessages.length}`}
          />
        )}

        {pendingResponses?.primary && pendingResponses?.secondary && (
          <div className="grid grid-cols-2 gap-4 w-full p-4">
            <ComparisonResponse
              text={pendingResponses.primary}
              model="Alice"
              onSelect={() =>
                selectResponse(pendingResponses.primary!, "primary")
              }
              key={`pending-primary-${comparisonMessages.length}`}
            />
            <ComparisonResponse
              text={pendingResponses.secondary}
              model="Eve"
              onSelect={() =>
                selectResponse(pendingResponses.secondary!, "secondary")
              }
              key={`pending-secondary-${comparisonMessages.length}`}
            />
          </div>
        )}

        {loading && (
          <div key={"loading"} className={"message--loading"}>
            <LoadingDots />
          </div>
        )}

        {showError && (
          <p className="message--error">
            There has been an error, please try again
          </p>
        )}

        {showResponsePrompt && (
          <p className="message--error">
            Please select a preferred response before continuing
          </p>
        )}  
      </div>

      <div className="chatinput">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <input
          type="text"
          className="chatinput__field"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessages();
            }
          }}
        />
        <button className="button--send" onClick={sendMessages}>
          Send
        </button>
      </div>
      { showDeleteModal && (
        <Modal submit={deleteChatAndShowDeleted} closeModal={() => setShowDeleteModal(false)} submitWording='Confirm'>
          <h1 className='text-center'>Are you sure you wish to delete?</h1>
          <p className="text-center mt-4">This conversation will be removed from our database and cannot be retrieved</p>
        </Modal>
      ) }
      <div className="mx-auto mb-2 text-center">
        Output is AI generated and can include inaccuracies
      </div>
    </div>
  );
};

export default ComparisonChat;
