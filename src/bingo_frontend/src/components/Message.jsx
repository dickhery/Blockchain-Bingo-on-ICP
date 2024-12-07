// src/bingo_frontend/src/components/Message.jsx

import React from 'react';
import DOMPurify from 'dompurify'; 
import './Message.scss'; 

function Message({ message, messageType, onClose }) {
  if (!message) return null;

  return (
    <div className={`message ${messageType}`} role="alert">
      <span
        className="message-text"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message) }} 
      ></span>
      <button onClick={onClose} className="close-button" aria-label="Close message">
        ✖
      </button>
    </div>
  );
}

export default Message;
