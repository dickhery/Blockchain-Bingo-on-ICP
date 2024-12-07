// src/bingo_frontend/src/components/BingoCard.jsx

import React from 'react';
import './BingoCard.scss';

function BingoCard({ card, markedCells, handleCellClick }) {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  // Function to render a cell
  const renderCell = (number, index) => {
    const isMarked = markedCells[index];
    const isFree = number === 0;

    return (
      <div
        key={index}
        className={`bingo-cell ${isMarked ? 'marked' : ''} ${isFree ? 'free' : ''}`}
        onClick={() => !isFree && handleCellClick(index)} 
      >
        {isFree ? 'FREE' : number}
      </div>
    );
  };

  // Handle cases where card data might be incomplete
  if (!Array.isArray(card) || card.length !== 25) {
    return (
      <div className="bingo-card-error">
        <p>Error: Invalid Bingo card data.</p>
      </div>
    );
  }

  return (
    <div className="bingo-card">
      <div className="bingo-grid">
        {/* Render BINGO Letters */}
        {letters.map((letter, idx) => (
          <div key={`letter-${idx}`} className="bingo-letter">
            {letter}
          </div>
        ))}

        {/* Render Bingo Numbers */}
        {card.map((number, index) => renderCell(number, index))}
      </div>
    </div>
  );
}

export default BingoCard;
