// src/bingo_frontend/src/components/Contact.jsx

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify'; 
import './Contact.scss';

function Contact({ backendActor, isAdmin, onClose }) {
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]); // For admin
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
  }, [isAdmin]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const msgs = await backendActor.getContactMessages();
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      setErrorMessage('Error fetching messages.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (email.trim() === '' || name.trim() === '' || messageText.trim() === '') {
      setErrorMessage('Please fill out all fields.');
      return;
    }
    if (messageText.length > 420) {
      setErrorMessage('Message is too long. Maximum length is 420 characters.');
      return;
    }
    try {
      setIsLoading(true);
      await backendActor.submitContactMessage(email, name, messageText);
      setEmail('');
      setName('');
      setMessageText('');
      setErrorMessage('Message sent successfully.');
    } catch (error) {
      console.error('Error submitting message:', error);
      setErrorMessage('Error submitting message.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setIsLoading(true);
      const success = await backendActor.deleteContactMessage(messageId);
      if (success) {
        fetchMessages();
      } else {
        setErrorMessage('Failed to delete message.');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setErrorMessage('Error deleting message.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-modal">
      <div className="contact-content">
        <button className="close-button" onClick={onClose}>
          ✖
        </button>
        {isAdmin ? (
          <>
            <h2>Contact Messages</h2>
            {isLoading ? (
              <p>Loading messages...</p>
            ) : (
              <div className="message-list">
                {messages.map((msg) => (
                  <div key={Number(msg.id)} className="message-item">
                    <p>
                      <strong>Name:</strong> {DOMPurify.sanitize(msg.name)}
                    </p>
                    <p>
                      <strong>Email:</strong> {DOMPurify.sanitize(msg.email)}
                    </p>
                    <p>
                      <strong>Message:</strong> {DOMPurify.sanitize(msg.message)}
                    </p>
                    <p>
                      <strong>Timestamp:</strong>{' '}
                      {new Date(Number(msg.timestamp / BigInt(1_000_000))).toLocaleString()}
                    </p>
                    <button onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
            <button className="close-modal-button" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <h2>Contact Us</h2>
            {errorMessage && <p className="error-message">{DOMPurify.sanitize(errorMessage)}</p>}
            <div className="contact-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your Email"
                required
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Your Message"
                maxLength={420}
                required
              />
              <button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Submit'}
              </button>
            </div>
            <button className="close-modal-button" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Contact;
