'use client'

import React, { useState } from "react";
import { MessageHistory } from "../types/types";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";
import { useChatbot } from "../context/useChatbot";

interface Props {    
    messageHistory: MessageHistory,    
}

const Message = ({ messageHistory }: Props) => {
    const { submitVote, submitFeedback } = useChatbot();
    const [ showRatingOptions, setShowRatingOptions ] = useState(false);
    const [ feedbackText, setFeedbackText] = useState("");
    const [ upvoted, setUpvoted ] = useState(messageHistory.messageRating?.upvoted ?? false);
    const [ downvoted, setDownvoted ] = useState(messageHistory.messageRating?.downvoted ?? false);
    const [ comments, setComments ] = useState<Array<String>>(messageHistory.messageRating?.comments ?? []);

    const toggleUpvote = () => {
        const newUpvoted = !upvoted;
        setUpvoted(newUpvoted);
        let newDownvoted = downvoted;

        // shouldn't be upvoted and downvoted
        if(newUpvoted && downvoted){
            newDownvoted = false;
            setDownvoted(false);
        }
        
        if(messageHistory.id){
            submitVote(messageHistory.id, newUpvoted, newDownvoted);
        }    
    }

    const toggleDownvote = () => {
        const newDownvoted = !downvoted;
        setDownvoted(newDownvoted);
        let newUpvoted = upvoted;

        // shouldn't be upvoted and downvoted
        if(newDownvoted && upvoted){
            newUpvoted = false;
            setUpvoted(false);
        }
        
        if(messageHistory.id){
            submitVote(messageHistory.id, newUpvoted, newDownvoted);
        }    
    }

    const comment = (text: string) => {
        setComments([...comments, text]);
        if(messageHistory.id){
            submitFeedback(messageHistory.id, text);
        }
        setFeedbackText("");
    }

    return (
      <div className="flex flex-col items-start">
        <div          
          className={`message ${
            messageHistory.sender === "user" ? "message--user" : "message--bot"
          } ${
            showRatingOptions &&
            messageHistory.sender != "user" &&
            "border-2 border-blue-500"
          } ${showRatingOptions ? "rounded-t-lg rounded-bl-lg lg:rounded-lg" : "rounded-lg"}`}
          onClick={() => setShowRatingOptions(!showRatingOptions)}
        >
          {typeof messageHistory.text == "string" ? (
            <ReactMarkdown className="markdown">
              {messageHistory.text}
            </ReactMarkdown>
          ) : (
            <>{messageHistory.text}</>
          )}
        </div>
        {(showRatingOptions) &&
          messageHistory.sender != "user" && (
            <>
            {comments.length > 0 && (
                <ul className="flex flex-col items-start justify-between bottom--50 bg-yellow-100 px-4 py-3 w-full lg:w-3/5">
                    {comments.map((comment, index) => 
                        (<li key={`Comment${messageHistory.id}${index}`}>{comment}</li>)
                    )}
                </ul>
            )}
            <div className="flex items-center justify-between bottom--50 bg-yellow-100 px-2 py-2 rounded-b-lg w-full lg:w-3/5">
              <button className={`px-2 py-1 mx-2 border-2 border-black rounded-md ${upvoted ? "bg-green-300" : "bg-white"}`} onClick={() => toggleUpvote()}><FontAwesomeIcon icon={faThumbsUp} /></button>
              <button className={`px-2 py-1 mx-2 border-2 border-black rounded-md ${downvoted ? "bg-red-300" : "bg-white"}`} onClick={() => {toggleDownvote(); if(upvoted){toggleUpvote()}}}><FontAwesomeIcon icon={faThumbsDown} /></button>
              <div className="inline-flex flex-col sm:flex-row items-center px-2 py-1 w-11/12">
                <input
                  type="text"
                  className="w-4/5 h-8 rounded-sm mx-2 px-2"
                  value={feedbackText}
                  placeholder="Feedback"
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      comment(feedbackText);
                    }
                  }}
                />
                <button
                  className="button--submit-feedback ml-2 w-4/5 mt-2 sm:w-1/5 sm:mt-0"
                  onClick={() => comment(feedbackText)}
                >
                  Submit
                </button>
              </div>
            </div>
            </>
          )}
      </div>
    );
}

export default Message;