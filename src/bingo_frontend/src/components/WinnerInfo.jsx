// src/bingo_frontend/src/components/WinnerInfo.jsx

import React from 'react';
import DOMPurify from 'dompurify'; 
import './WinnerInfo.scss';

function WinnerInfo({ winner }) {
  const displayName = DOMPurify.sanitize(winner.username || winner.principal || 'Unknown Winner');

  return (
    <div className="winner-info">
      <h2>🎉 Game Over! 🎉</h2>
      <p>
        <strong>{displayName}</strong> got a Bingo! Thanks for playing!
      </p>
    </div>
  );
}

export default WinnerInfo;
