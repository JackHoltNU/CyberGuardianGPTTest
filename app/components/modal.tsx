import React from "react";

interface Props {
    closeModal: () => void;
    submit: () => void;
    children: React.ReactNode;
}

const Modal = ({closeModal, submit, children}: Props) => {
    return (
        <div className="modal max-h-dvh">
            <div className="modal__content h-5/6 flex flex-col flex-grow overflow-y-auto">
                {children}
                <div className="flex justify-around items-center w-full px-4">
                    <button className="mx-4 mt-2 py-2 h-10 px-4 bg-red-300 rounded-md" onClick={() => closeModal()}>Cancel</button>
                    <button className="mx-4 py-2 px-4 h-10 bg-green-300 rounded-md" onClick={() => submit()}>Submit</button>                    
                </div>
                
            </div>            
        </div>
    )
}

export default Modal;