// src/bingo_frontend/src/components/GameInfo.jsx

import React from 'react';
import DOMPurify from 'dompurify'; 
import './GameInfo.scss';

function GameInfo({
  gameNumber,
  latestNumber,
  calledNumbers,
  checkWin,
  isAdmin,
  drawNextNumber,
  winner,
  gameInProgress,
  winType,
  cardCount,
  isDrawing,
  isChecking,
  audioEnabled,
  handleToggleAudio,
  isAutoDraw, 
  toggleAutoDraw, 
  totalPrizeICP, 
}) {
  const getLetter = (number) => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
  };

  return (
    <div className="game-info">
      <div className="latest-number">
        {latestNumber !== null ? (
          <span>
            {getLetter(latestNumber)} {latestNumber}
          </span>
        ) : (
          <span>No numbers drawn yet.</span>
        )}
      </div>
      <div className="button-container">
        {isAdmin && gameInProgress && !winner && (
          <>
            <button
              onClick={drawNextNumber}
              className="admin-button game-info-button"
              disabled={isDrawing || isAutoDraw} 
            >
              {isDrawing ? 'Drawing Number…' : 'Draw Next Number'}
            </button>
            <button
              onClick={toggleAutoDraw}
              className="auto-draw-button game-info-button"
            >
              {isAutoDraw ? 'Stop Auto Draw' : 'Start Auto Draw'}
            </button>
          </>
        )}

        {gameInProgress && !winner && (
          <button
            onClick={checkWin}
            className="check-win-button game-info-button"
            disabled={isChecking}
          >
            {isChecking ? 'Checking…' : 'Check Bingo'}
          </button>
        )}
      </div>
      <div className="called-numbers">
        <h3>Called Numbers:</h3>
        <div className="numbers-list">
          {calledNumbers.slice().reverse().map((number, index) => (
            <span key={index} className="called-number">
              {getLetter(number)} {number}
            </span>
          ))}
        </div>
      </div>
      <div className="game-number">
        <h3>Game Number: {DOMPurify.sanitize(gameNumber.toString())}</h3>
      </div>
      <div className="win-type">
        <h3>
          Win Type: <span>{DOMPurify.sanitize(winType)}</span>
        </h3>
      </div>
      <div className="card-count">
        <h3>Player Count: {DOMPurify.sanitize(cardCount.toString())}</h3>
      </div>
      <div className="total-prize">
        <h3>Total Prize: {DOMPurify.sanitize(totalPrizeICP.toFixed(4))} ICP</h3>
      </div>
      <div className="audio-controls">
        <label className="audio-toggle">
          <input
            type="checkbox"
            checked={audioEnabled}
            onChange={handleToggleAudio}
          />
          Enable Audio
        </label>
      </div>
    </div>
  );
}

export default GameInfo;
