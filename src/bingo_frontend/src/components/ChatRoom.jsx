// src/bingo_frontend/src/components/ChatRoom.jsx

import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify'; 
import './ChatRoom.scss';
import { Principal } from '@dfinity/principal';

function ChatRoom({ backendActor, username, setUsername, gameNumber, isAdmin, gameName, isLobby, principal }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const chatBoxRef = useRef(null);
  const [newUsername, setNewUsername] = useState('');
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Refs for auto-scroll management
  const shouldAutoScrollRef = useRef(true);
  const autoScrollTimerRef = useRef(null);

  useEffect(() => {
    let interval;
    if (backendActor && (gameNumber !== null || isLobby)) {
      if (isLobby) {
        fetchLobbyMessages();
      } else {
        fetchMessages();
      }
      interval = setInterval(() => {
        if (isLobby) {
          fetchLobbyMessages();
        } else {
          fetchMessages();
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [backendActor, gameNumber, isLobby]);

  useEffect(() => {
    if (messages.length > 0 && shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatBox;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // Threshold of 50px

      if (isAtBottom) {
        if (!shouldAutoScrollRef.current) {
          shouldAutoScrollRef.current = true;
        }
        if (autoScrollTimerRef.current) {
          clearTimeout(autoScrollTimerRef.current);
          autoScrollTimerRef.current = null;
        }
      } else {
        if (shouldAutoScrollRef.current) {
          shouldAutoScrollRef.current = false;
        }
        if (autoScrollTimerRef.current) {
          clearTimeout(autoScrollTimerRef.current);
        }
        autoScrollTimerRef.current = setTimeout(() => {
          shouldAutoScrollRef.current = true;
          scrollToBottom();
          autoScrollTimerRef.current = null;
        }, 10000); 
      }
    };

    chatBox.addEventListener('scroll', handleScroll);

    scrollToBottom();

    return () => {
      chatBox.removeEventListener('scroll', handleScroll);
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
      }
    };
  }, []);
  
  const fetchMessages = async () => {
    try {
      const msgs = await backendActor.getMessages(gameNumber);
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchLobbyMessages = async () => {
    try {
      const msgs = await backendActor.getLobbyMessages();
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching lobby messages:', error);
    }
  };

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleSendMessage = async () => {
    if (messageText.trim() === '') {
      return;
    }
    if (messageText.length > 420) {
      alert('Message is too long. Maximum length is 420 characters.');
      return;
    }
    try {
      setIsSending(true);
      if (isLobby) {
        await backendActor.sendLobbyMessage(messageText);
      } else {
        await backendActor.sendMessage(messageText, gameNumber);
      }
      setMessageText('');
      if (isLobby) {
        await fetchLobbyMessages();
      } else {
        await fetchMessages();
      }
    } catch (error) {
      alert(`Error sending message: ${error.message || error}`);
    }
    setIsSending(false);
  };

  const handleDeleteMessage = async (timestamp) => {
    if (isLobby) {
      try {
        const success = await backendActor.deleteLobbyMessage(timestamp);
        if (success) {
          await fetchLobbyMessages();
        } else {
          alert('Failed to delete message. Access denied or message not found.');
        }
      } catch (error) {
        alert(`Error deleting message: ${error.message || error}`);
      }
    } else {
      try {
        const success = await backendActor.deleteMessage(timestamp, gameNumber);
        if (success) {
          await fetchMessages();
        } else {
          alert('Failed to delete message. Access denied or message not found.');
        }
      } catch (error) {
        alert(`Error deleting message: ${error.message || error}`);
      }
    }
  };

  const handleUsernameSubmit = async () => {
    if (newUsername.trim() === '') return;
    try {
      const success = await backendActor.setUsername(newUsername);
      if (success) {
        setUsername(newUsername);
        setShowUsernameInput(false);
        setNewUsername('');
      } else {
        alert('Username already taken. Please choose another one.');
      }
    } catch (error) {
      alert(`Error setting username: ${error.message || error}`);
    }
  };

  // Fetch current username on mount
  useEffect(() => {
    const fetchCurrentUsername = async () => {
      if (backendActor && principal) {
        try {
          const principalObj = Principal.fromText(principal);
          const fetchedUsername = await backendActor.getUsername(principalObj);
          if (fetchedUsername && fetchedUsername !== username) {
            setUsername(fetchedUsername);
          }
        } catch (error) {
          console.error('Error fetching current username:', error);
        }
      }
    };
    fetchCurrentUsername();
  }, [backendActor, principal]);

  return (
    <div className="chat-room">
      <h3>
        {isLobby ? 'Lobby Chat' : `Chat Room - ${DOMPurify.sanitize(gameName)}`} ({DOMPurify.sanitize(username) || DOMPurify.sanitize(principal)})
      </h3> 
      <div className="chat-controls">
        <button onClick={() => setShowUsernameInput(!showUsernameInput)}>
          {username ? 'Change Username' : 'Create Username'}
        </button>
      </div>
      {showUsernameInput && (
        <div className="username-input">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            maxLength={420} 
          />
          <button onClick={handleUsernameSubmit}>Submit</button>
        </div>
      )}
      <div ref={chatBoxRef} className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <span className={`username ${msg.username === "App" ? 'system-username' : ''}`}>
              {DOMPurify.sanitize(msg.username)}:
            </span>
            <div className="timestamp">
              {new Date(Number(msg.timestamp / BigInt(1000000))).toLocaleString()}
            </div>
            <span className="message-content">{DOMPurify.sanitize(msg.text)}</span>
            {isAdmin && msg.username !== "App" && (
              <button
                className="delete-button"
                onClick={() => handleDeleteMessage(msg.timestamp)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="message-input-container">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          maxLength={420} 
        />
        {!isSending && (
          <button onClick={handleSendMessage}>Send</button>
        )}
        {isSending && (
          <button disabled className="sending-button">
            Sending...
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatRoom;
