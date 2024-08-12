import React, { useState } from "react"
import Modal from "./modal";
import LikertScale from "./likertScale";

interface Props {
    closeModal: () => void;
}

const ChatFeedbackModal = ({closeModal} : Props) => {
    const [ helpfulnessValue, setHelpfulnessValue ] = useState(-1);
    const [ helpfulnessPromptMandatory, setHelpfulnessPromptMandatory ] = useState(false);
    const [ accuracyValue, setAccuracyValue ] = useState(-1);
    const [ accuracyPromptMandatory, setAccuracyPromptMandatory ] = useState(false);
    const [ wordingValue, setWordingValue ] = useState(-1);
    const [ wordingPromptMandatory, setWordingPromptMandatory ] = useState(false);
    const [ overallValue, setOverallValue ] = useState(-1);
    const [ overallPromptMandatory, setOverallPromptMandatory ] = useState(false);
    const scaleRange = 5;

    const submit = () => {
        let accept = true;
        if(helpfulnessValue < 0 || helpfulnessValue > scaleRange){
            setHelpfulnessPromptMandatory(true);
            accept = false;
        }
        if(accuracyValue < 0 || accuracyValue > scaleRange){
            setAccuracyPromptMandatory(true);
            accept = false;
        }
        if(wordingValue < 0 || wordingValue > scaleRange){
            setWordingPromptMandatory(true);
            accept = false;
        }
        if(overallValue < 0 || overallValue > scaleRange){
            setOverallPromptMandatory(true);
            accept = false;
        }
        if(accept){
            closeModal();
        }        
    }

    return (
        <Modal closeModal={closeModal} submit={submit}>          
          <div className="">
            <ul>              
              <LikertScale question="The responses were helpful" options={scaleRange} onValueChange={(number: number | null) => {
                if(number && number > 0 && number <= scaleRange ){
                    setHelpfulnessValue(number);
                }
              }} required={ helpfulnessPromptMandatory } /> 
              <LikertScale question="The responses were accurate" options={scaleRange} onValueChange={(number: number | null) => {
                if(number && number > 0 && number <= scaleRange ){
                    setAccuracyValue(number);
                }
              }} required={ accuracyPromptMandatory } /> 
              <LikertScale question="The wording was appropriate" options={scaleRange} onValueChange={(number: number | null) => {
                if(number && number > 0 && number <= scaleRange ){
                    setWordingValue(number);
                }
              }} required={ wordingPromptMandatory } /> 
              <LikertScale question="Overall rating" options={scaleRange} onValueChange={(number: number | null) => {
                if(number && number > 0 && number <= scaleRange ){
                    setOverallValue(number);
                }
              }} required={ wordingPromptMandatory } /> 
              <li className="flex flex-col pl-4 py-2">
                <label>Additional comments: </label>
                <textarea className="border-2 my-2 w-full"/>
              </li>
            </ul>
          </div>
        </Modal>
    )

}

export default ChatFeedbackModal;