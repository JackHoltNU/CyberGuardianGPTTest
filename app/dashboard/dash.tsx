'use client'

import React, { useEffect, useState } from "react"
import { useAdmin } from "../context/useAdmin";
import Chatlist from "./chatlist";

const Dash = () => {
    const { getVotedOn, upvotedList, downvotedList, unvotedList } = useAdmin();
    const [selectedList, setSelectedList ] = useState("upvoted");

    useEffect(() => {
        getVotedOn();
    },[])

    return (
        <div>
            <div className="flex">
                <button className={`p-2 border-2 ${selectedList == "upvoted" && "bg-blue-100"}`} onClick={() => setSelectedList("upvoted")}>Upvoted</button>
                <button className={`p-2 border-y-2 border-r-2 ${selectedList == "downvoted" && "bg-blue-100"}`} onClick={() => setSelectedList("downvoted")}>Downvoted</button>
                <button className={`p-2 border-y-2 border-r-2 ${selectedList == "unvoted" && "bg-blue-100"}`} onClick={() => setSelectedList("unvoted")}>Unvoted</button>
            </div>
            {selectedList == "upvoted" && <Chatlist title="Upvoted Responses" list={upvotedList}/>}
            {selectedList == "downvoted" && <Chatlist title="Downvoted Responses" list={downvotedList}/>}
            {selectedList == "unvoted" && <Chatlist title="Unvoted Responses" list={unvotedList}/>}
        </div>
    )
}

export default Dash;