// src/bingo_frontend/src/components/MenuScreen.jsx

import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify'; 
import { useNavigate, useLocation } from 'react-router-dom';
import './MenuScreen.scss';
import BalanceDisplay from './BalanceDisplay.jsx'; 
import ChatRoom from './ChatRoom.jsx'; 
import { Principal } from '@dfinity/principal'; 
import Message from './Message.jsx'; 
import Contact from './Contact.jsx'; 
import TermsAndConditionsModal from './TermsAndConditionsModal.jsx'; 

function MenuScreen({ logout, backendActor, principal, authClient, username, setUsername }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 

  useEffect(() => {
    if (location.state && location.state.message) {
      setMessage(DOMPurify.sanitize(location.state.message)); // Sanitize message
      setMessageType(location.state.messageType || 'info');
      // Clear the state to prevent message from appearing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handlePlayBingo = () => {
    navigate('/play-bingo');
  };

  const handleHostBingo = () => {
    navigate('/host-bingo');
  };

  const handleAbout = () => {
    navigate('/about');
  };

  const adminPID = "rhqze-ri3xe-owyng-g4jwr-5f6ei-plpw2-nkai4-ndeas-feyik-3cyhx-pae"; 

  const isAdmin = principal === adminPID;

  useEffect(() => {
    const fetchUsername = async () => {
      if (backendActor && principal) {
        const principalObj = Principal.fromText(principal);
        const fetchedUsername = await backendActor.getUsername(principalObj);
        if (fetchedUsername && fetchedUsername !== username) {
          setUsername(DOMPurify.sanitize(fetchedUsername)); 
        }
      }
    };
    fetchUsername();
  }, [backendActor, principal]);

  const [showContact, setShowContact] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    const checkUserAgreement = async () => {
      if (backendActor && principal) {
        try {
          const lastAgreementOpt = await backendActor.getLastUserAgreement();
          let needsToAgree = true;

          if (lastAgreementOpt && lastAgreementOpt.length > 0) {
            const lastAgreementTime = Number(lastAgreementOpt[0]) / 1e9; 
            const currentTime = Date.now() / 1000; 
            const sevenDaysInSeconds = 7 * 24 * 60 * 60;
            if (currentTime - lastAgreementTime < sevenDaysInSeconds) {
              needsToAgree = false;
            }
          }

          if (needsToAgree) {
            setShowTermsModal(true);
          }
        } catch (error) {
          console.error('Error fetching user agreement:', error);
          setShowTermsModal(true);
        }
      }
    };

    checkUserAgreement();
  }, [backendActor, principal]);

  const handleAgreeToTerms = async () => {
    try {
      await backendActor.recordUserAgreement();
      setShowTermsModal(false);
    } catch (error) {
      console.error('Error recording user agreement:', error);
      alert(DOMPurify.sanitize('An error occurred while recording your agreement. Please try again.'));
    }
  };

  return (
    <div className="menu-screen">
      <img
        src="/images/game_banner.png"
        alt="Bingo Banner"
        className="game-banner"
      />
      <h1>Menu</h1>
      <div className="button-group">
        <button onClick={handlePlayBingo}>Play Bingo</button>
        <button onClick={handleHostBingo}>Host Bingo</button>
        <button onClick={handleAbout}>About</button>
        <button onClick={() => setShowContact(true)}>Contact</button> {/* Added Contact button */}
      </div>
      {message && (
        <Message
          message={message}
          messageType={messageType}
          onClose={() => setMessage('')}
        />
      )}
      <BalanceDisplay authClient={authClient} /> 
      <button className="logout-button" onClick={logout}>
        Logout
      </button>
      {showContact && (
        <Contact
          backendActor={backendActor}
          isAdmin={isAdmin}
          onClose={() => setShowContact(false)}
        />
      )}
      <ChatRoom
        backendActor={backendActor}
        username={username}
        setUsername={setUsername}
        isAdmin={isAdmin}
        isLobby={true}
        principal={principal}
      />
      <footer>
        {principal && (
          <>
            <p style={{ fontSize: '0.8rem', marginTop: '20px' }}>
              Your Principal ID: {DOMPurify.sanitize(principal)}
            </p>
          </>
        )}

        <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
          built by{' '}
          <a
            href="https://3jorm-yqaaa-aaaap-akm2a-cai.icp0.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            RichardHery.com
          </a>
        </p>
      </footer>
      {showTermsModal && (
        <TermsAndConditionsModal onAgree={handleAgreeToTerms} />
      )}
    </div>
  );
}

export default MenuScreen;
