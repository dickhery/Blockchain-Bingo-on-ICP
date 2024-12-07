// src/bingo_frontend/src/components/ConfirmationModal.jsx

import React, { useState } from 'react';
import DOMPurify from 'dompurify'; 
import './ConfirmationModal.scss';

function ConfirmationModal({ game, onConfirm, onCancel, isProcessing, isPasswordProtected }) {
  const basePriceICP = Number(game.price) / 100_000_000;
  const isPaidGame = basePriceICP > 0;
  const totalPriceICP = isPaidGame ? (basePriceICP + 0.0002).toFixed(4) : basePriceICP.toFixed(4);
  const [password, setPassword] = useState('');

  const handleConfirmClick = () => {
    onConfirm(password);
  };

  return (
    <div className="confirmation-modal">
      <div className="modal-content">
        <h2>Confirm Registration</h2>
        <p>You are about to register for the game:</p>
        <h3>{DOMPurify.sanitize(game.gameName)}</h3>
        <p>The total cost per card is: {totalPriceICP} ICP</p>
        {isPaidGame && (
          <p className="small-print">(Includes a 0.0002 ICP fee to cover transaction costs)</p>
        )}
        {isPasswordProtected && (
          <div className="form-group">
            <label htmlFor="password">Enter Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ fontSize: '16px' }} 
            />
          </div>
        )}
        <p>
          Do you want to proceed
          {isPasswordProtected
            ? isPaidGame
              ? ' with the password and payment?'
              : ' with the password?'
            : isPaidGame
            ? ' with the payment?'
            : '?'}
        </p>
        <div className="modal-buttons">
          <button onClick={handleConfirmClick} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm'}
          </button>
          <button onClick={onCancel} disabled={isProcessing}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
