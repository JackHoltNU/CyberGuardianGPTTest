'use client'

import React from "react"
import { MessageInstance } from "../types/types";
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";


interface Props {
    title: string;
    list: MessageInstance[];
}

const Chatlist = ({title, list}: Props) => {
    const router = useRouter();

    return (
      <div className="flex-grow overflow-y-auto">
        <h1 className="py-2 text-left text-lg font-bold">{title}</h1>
        <div className="grid grid-cols-12">
          {/* <div> */}

          <div className="p-2 text-left font-bold">User</div>
          <div className="p-2 text-left font-bold">Voted</div>
          <div className="p-2 text-left col-span-2 font-bold">Chat</div>
          <div className="p-2 text-left col-span-4 font-bold">Message</div>
          <div className="p-2 text-left col-span-4 font-bold">Comments</div>

          {/* </div> */}
          {list &&
            list.map((message, index) => (
              <React.Fragment key={message.id}>
                <div className={`p-2 flex items-center ${index % 2 == 0 && "bg-blue-100"}`}>{message.user}</div>
                <div className={`p-2 flex items-center ${index % 2 == 0 && "bg-blue-100"}`}>
                  {message.feedback?.upvoted && (
                    <FontAwesomeIcon icon={faThumbsUp} />
                  )}
                  {message.feedback?.downvoted && (
                    <FontAwesomeIcon icon={faThumbsDown} />
                  )}
                </div>
                <div className={`p-2 flex items-center col-span-2 hover:underline cursor-pointer ${index % 2 == 0 && "bg-blue-100"}`} onClick={() => router.push(`/chat/${message.threadID}`)}>{message.title}</div>
                <div className={`p-2 flex items-center col-span-4 hover:underline cursor-pointer ${index % 2 == 0 && "bg-blue-100"}`} onClick={() => router.push(`/chat/${message.threadID}`)}>"{message.message}"</div>
                <div className={`p-2 flex items-center col-span-4 ${index % 2 == 0 && "bg-blue-100"}`}>
                  {message.feedback?.comments?.length > 0 && (
                    <div>
                      {message.feedback.comments.map((comment, index) => (
                        <p key={`${index}${message.id}`}>{comment}</p>
                      ))}
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
        </div>
      </div>
    );
}

export default Chatlist;