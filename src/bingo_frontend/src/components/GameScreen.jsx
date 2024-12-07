// src/bingo_frontend/src/components/GameScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import {
  idlFactory as backend_idlFactory,
  canisterId as backend_canisterId,
} from 'declarations/bingo_backend';
import { useNavigate, useParams } from 'react-router-dom';
import BingoCard from './BingoCard.jsx';
import GameInfo from './GameInfo.jsx';
import WinnerInfo from './WinnerInfo.jsx';
import ChatRoom from './ChatRoom.jsx';
import { getLetterForNumber, fetchAndDecodeAudio } from '../utils.js';
import { LedgerCanister } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import './GameScreen.scss';
import Message from './Message.jsx'; 

function GameScreen({ principal, authClient, backendActor, username, setUsername }) {
  const navigate = useNavigate();
  const { gameNumber } = useParams();
  const gameNumberNat = BigInt(gameNumber);
  const [hasCard, setHasCard] = useState(false);
  const [card, setCard] = useState([]);
  const [markedCells, setMarkedCells] = useState([]);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [latestNumber, setLatestNumber] = useState(null);
  const [winner, setWinner] = useState(null);
  const [winType, setWinType] = useState('Blackout');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [gameName, setGameName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [scheduledStartTimeMs, setScheduledStartTimeMs] = useState(null);
  const [canStartGame, setCanStartGame] = useState(false);
  const [canBecomeHost, setCanBecomeHost] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isBecomingHost, setIsBecomingHost] = useState(false);  
  const [isCheckingCard, setIsCheckingCard] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const previousNumberRef = useRef(null);
  const currentAudioSourceRef = useRef(null);
  const winnerAudioPlayedRef = useRef(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const ledgerCanister = useRef(null);
  const [isAutoDraw, setIsAutoDraw] = useState(false);
  const autoDrawTimeoutRef = useRef(null);
  const isAutoDrawRef = useRef(isAutoDraw);
  const isDrawingRef = useRef(isDrawing);
  const gameInProgressRef = useRef(gameInProgress);
  const winnerRef = useRef(winner);
  const [startTimeMs, setStartTimeMs] = useState(null);
  const [lastNumberDrawTimeMs, setLastNumberDrawTimeMs] = useState(null);
  const [hostAssignedTimeMs, setHostAssignedTimeMs] = useState(null);
  const [totalPrizeICP, setTotalPrizeICP] = useState(0);
  const [allNumbersDrawn, setAllNumbersDrawn] = useState(false);

  useEffect(() => {
    isAutoDrawRef.current = isAutoDraw;
  }, [isAutoDraw]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    gameInProgressRef.current = gameInProgress;
  }, [gameInProgress]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    if (backendActor) {
      fetchGameState();
      fetchUserCard();
      const interval = setInterval(() => {
        fetchGameState();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [backendActor]);

  const fetchGameState = async () => {
    try {
      const gameSummaries = await backendActor.getActiveGames();
      const game = gameSummaries.find(
        (g) => Number(g.gameNumber) === Number(gameNumberNat)
      );

      if (!game) {
        setMessage('Game not found.');
        setMessageType('error');
        navigate('/play-bingo');
        return;
      }

      setIsHost(principal === game.hostPrincipalId.toText());
      setGameName(game.gameName);

      const isInProgress = await backendActor.isGameInProgress(gameNumberNat);
      setGameInProgress(isInProgress);

      const winOpt = await backendActor.getWinner(gameNumberNat);

      console.log('winOpt:', winOpt);

      if (winOpt && winOpt.length > 0) {
        const winnerData = winOpt[0];
        const winnerPrincipal = winnerData.principal.toText
          ? winnerData.principal.toText()
          : winnerData.principal;

        let winnerUsernameOpt = null;
        if (winnerData.username && winnerData.username.length > 0) {
          winnerUsernameOpt = winnerData.username[0];
        }

        setWinner({
          principal: winnerPrincipal,
          username: winnerUsernameOpt,
        });
      } else {
        setWinner(null);
      }

      const numbers = await backendActor.getCalledNumbers(gameNumberNat);
      setCalledNumbers(numbers.map(Number));

      const latestCalledNumber = await backendActor.getLatestNumber(gameNumberNat);
      if (latestCalledNumber !== null) {
        setLatestNumber(Number(latestCalledNumber));
      } else {
        setLatestNumber(null);
      }

      const currentWinType = await backendActor.getWinType(gameNumberNat);
      if ('Blackout' in currentWinType) {
        setWinType('Blackout');
      } else if ('Standard' in currentWinType) {
        setWinType('Standard');
      } else {
        setWinType('Unknown');
      }

      const currentCardCount = await backendActor.getCardCount(gameNumberNat);
      setCardCount(Number(currentCardCount));

      let scheduledStartTimeMsLocal;
      try {
        scheduledStartTimeMsLocal = Number(BigInt(game.scheduledStartTime) / 1_000_000n);
        if (!isFinite(scheduledStartTimeMsLocal)) {
          throw new Error('Invalid scheduledStartTimeMs');
        }
      } catch (error) {
        console.error('Error parsing scheduledStartTime:', error);
        setCanBecomeHost(false);
        return;
      }

      setScheduledStartTimeMs(scheduledStartTimeMsLocal);

      const scheduledDateTime = new Date(scheduledStartTimeMsLocal);
      const now = new Date();
      const canStart = now >= scheduledDateTime;
      setCanStartGame(canStart);

      console.log(`Scheduled Start Time (ms): ${scheduledStartTimeMsLocal}`);
      console.log(`Can Start Game: ${canStart}`);

      let startTimeMsLocal = null;
      if (game.startTime) {
        startTimeMsLocal = Number(BigInt(game.startTime) / 1_000_000n);
        setStartTimeMs(startTimeMsLocal);
      } else {
        setStartTimeMs(null);
      }

      let lastNumberDrawTimeMsLocal = null;
      if (game.lastNumberDrawTime) {
        lastNumberDrawTimeMsLocal = Number(BigInt(game.lastNumberDrawTime) / 1_000_000n);
        setLastNumberDrawTimeMs(lastNumberDrawTimeMsLocal);
      } else {
        setLastNumberDrawTimeMs(null);
      }

      let hostAssignedTimeMsLocal = null;
      if (game.hostAssignedTime) {
        hostAssignedTimeMsLocal = Number(BigInt(game.hostAssignedTime) / 1_000_000n);
        setHostAssignedTimeMs(hostAssignedTimeMsLocal);
      } else {
        setHostAssignedTimeMs(null);
      }

      const serviceFeePercentage = BigInt(25); 
      const hostPercentage = BigInt(game.hostPercentage || 0); 
      const priceE8s = BigInt(game.price);
      const cardCountBigInt = BigInt(game.cardCount || 0);
      const totalCollected = priceE8s * cardCountBigInt;
      const netAmount = (totalCollected * (BigInt(1000) - serviceFeePercentage)) / BigInt(1000); // after service fee
      const prizePoolE8s = (netAmount * (BigInt(1000) - hostPercentage)) / BigInt(1000); // after host percentage
      const calculatedTotalPrizeICP = Number(prizePoolE8s) / 100_000_000;
      setTotalPrizeICP(calculatedTotalPrizeICP);
      const allNumbersDrawnResult = await backendActor.areAllNumbersDrawn(gameNumberNat);
      setAllNumbersDrawn(allNumbersDrawnResult);
      const fiveMinutesInMs = 5 * 60 * 1000; 
      const nowMs = Date.now();
      let canBecomeHostComputed = false;

      if (!winner) {
        if (!isInProgress) {
          const fiveMinutesAfterScheduled = scheduledStartTimeMsLocal + fiveMinutesInMs;
          const fiveMinutesAfterHostAssigned = hostAssignedTimeMsLocal
            ? hostAssignedTimeMsLocal + fiveMinutesInMs
            : 0;

          if (nowMs >= fiveMinutesAfterScheduled && nowMs >= fiveMinutesAfterHostAssigned) {
            canBecomeHostComputed = true;
          }
        } else {
          let lastActionTimeMs;

          if (lastNumberDrawTimeMsLocal) {
            lastActionTimeMs = lastNumberDrawTimeMsLocal;
          } else if (startTimeMsLocal) {
            lastActionTimeMs = startTimeMsLocal;
          } else {
            canBecomeHostComputed = false;
          }

          if (lastActionTimeMs && hostAssignedTimeMsLocal) {
            const fiveMinutesAfterLastAction = lastActionTimeMs + fiveMinutesInMs;
            const fiveMinutesAfterHostAssigned = hostAssignedTimeMsLocal + fiveMinutesInMs;
            if (nowMs >= fiveMinutesAfterLastAction && nowMs >= fiveMinutesAfterHostAssigned) {
              canBecomeHostComputed = true;
            }
          }
        }
      } else {
        canBecomeHostComputed = false;
      }

      if (canBecomeHostComputed && game.hostPrincipalId.toText() === principal) {
        canBecomeHostComputed = false;
      }

      setCanBecomeHost(canBecomeHostComputed);

      setGameCompleted(game.completed);

      if (winner || !isInProgress) {
        stopAutoDraw();
      }

      if (isInProgress && !gameStartedMessageShownRef.current) {
        setMessage('Game has started!');
        setMessageType('success');
        gameStartedMessageShownRef.current = true;
      } else if (!isInProgress) {
        gameStartedMessageShownRef.current = false;
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  useEffect(() => {
    if (allNumbersDrawn && gameInProgress) {
      setMessage('All numbers have been drawn in this game!');
      setMessageType('info');
    }
  }, [allNumbersDrawn, gameInProgress]);

  const fetchUserCard = async () => {
    try {
      const userPrincipal = Principal.fromText(principal);
      const cardExists = await backendActor.hasCard(gameNumberNat, userPrincipal); 
      setHasCard(cardExists);

      if (cardExists) {
        const myCard = await backendActor.getMyCard(gameNumberNat, userPrincipal); 
        if (myCard !== null && Array.isArray(myCard) && myCard.length === 25) {
          setCard(myCard.map(Number));
          setMarkedCells(new Array(myCard.length).fill(false));
        } else {
          console.error('Card exists but data is invalid.');
          setHasCard(false);
        }
      }
    } catch (error) {
      console.error('Error fetching user card:', error);
      setHasCard(false);
    } finally {
      setIsCheckingCard(false);
    }
  };

  const generateCard = async () => {
    if (!backendActor) return;
    setIsGeneratingCard(true);
    try {
      const gamePrice = await backendActor.getGamePrice(gameNumberNat);

      if (Number(gamePrice) > 0) {
        const userPrincipal = Principal.fromText(principal);
        const hasPaid = await backendActor.hasUserPaid(gameNumberNat, userPrincipal);
        if (!hasPaid) {
          throw new Error('You need to pay to join this game.');
        }
      }

      const newCard = await backendActor.generateCard(gameNumberNat);
      if (newCard && Array.isArray(newCard) && newCard.length === 25) {
        setCard(newCard.map(Number));
        setMarkedCells(new Array(newCard.length).fill(false));
        setHasCard(true);
        const currentCardCount = await backendActor.getCardCount(gameNumberNat);
        setCardCount(Number(currentCardCount));
      } else {
        console.error('Invalid card data received:', newCard);
        setCard([]);
        setMarkedCells([]);
        setHasCard(false);
        setMessage('Failed to generate a valid Bingo card.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error generating card: ${error.message || error}`);
      setMessageType('error');
    }
    setIsGeneratingCard(false);
  };

  const playCardAudio = async () => {
    if (!audioEnabled) return; 
    const audioFilePath = '/audio/card.mp3';
    if (!audioContextRef.current) {
      console.error('AudioContext not initialized.');
      return;
    }

    try {
      const audioBuffer = await fetchAndDecodeAudio(audioContextRef.current, audioFilePath);
      if (!audioBuffer) {
        console.error(`Failed to load audio file: ${audioFilePath}`);
        return;
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      if (currentAudioSourceRef.current) {
        currentAudioSourceRef.current.stop();
      }

      currentAudioSourceRef.current = source;
      source.start(0);
      console.log(`Successfully played audio file: ${audioFilePath}`);
    } catch (error) {
      console.error(`Error fetching or playing audio file ${audioFilePath}:`, error);
    }
  };

  const handleCellClick = (index) => {
    setMarkedCells((prev) => {
      const newMarked = [...prev];
      newMarked[index] = !newMarked[index];
      return newMarked;
    });
    playCardAudio(); 
  };

  const checkWin = async () => {
    if (!backendActor) return;
    setIsChecking(true);
    try {
      const result = await backendActor.checkWin(gameNumberNat, markedCells);
      const resultKey = Object.keys(result)[0];
  
      switch (resultKey) {
        case 'Won':
          setMessage('Congratulations! You have won!');
          setMessageType('success');
          await fetchGameState();
          break;
        case 'NotWon':
          setMessage('Sorry, you have not won yet.');
          setMessageType('info');
          break;
        case 'GameAlreadyWon':
          setMessage('Another player has already won the game.');
          setMessageType('warning');
          await fetchGameState();
          break;
        default:
          setMessage('Unknown result.');
          setMessageType('error');
          break;
      }
    } catch (error) {
      setMessage(`Error checking win: ${error.message || error}`);
      setMessageType('error');
    }
    setIsChecking(false);
  };  

  const startGame = async () => {
    if (!backendActor) return;
    setIsStartingGame(true); 
    try {
      const nowMs = Date.now();
      if (scheduledStartTimeMs && nowMs < scheduledStartTimeMs) {
        throw new Error('Cannot start the game before the scheduled start time.');
      }

      await backendActor.startGame(gameNumberNat);
      setGameInProgress(true);
      setMessage('Game has started!');
      setMessageType('success');
      await fetchGameState();
    } catch (error) {
      setMessage(`Error starting game: ${error.message || error}`);
      setMessageType('error');
    }
    setIsStartingGame(false); 
  };

  const toggleAutoDraw = () => {
    setIsAutoDraw((prev) => !prev);
  };

  const stopAutoDraw = () => {
    setIsAutoDraw(false);
  };

  useEffect(() => {
    if (isAutoDraw) {
      const autoDrawFunction = async () => {
        if (!isAutoDrawRef.current || !gameInProgressRef.current || winnerRef.current) {
          console.log('Auto-draw stopping due to game over or winner declared.');
          return;
        }
        if (!isDrawingRef.current) {
          await drawNextNumber();
        }
        if (isAutoDrawRef.current && gameInProgressRef.current && !winnerRef.current) {
          autoDrawTimeoutRef.current = setTimeout(autoDrawFunction, 7000);
        }
      };
      autoDrawFunction();
      console.log('Auto-draw started.');
    } else {
      if (autoDrawTimeoutRef.current) {
        clearTimeout(autoDrawTimeoutRef.current);
        autoDrawTimeoutRef.current = null;
        console.log('Auto-draw stopped.');
      }
    }

    return () => {
      if (autoDrawTimeoutRef.current) {
        clearTimeout(autoDrawTimeoutRef.current);
        autoDrawTimeoutRef.current = null;
        console.log('Auto-draw cleaned up.');
      }
    };
  }, [isAutoDraw]);

  const drawNextNumber = async () => {
    if (!backendActor) return;
    if (isDrawing) return; 
    setIsDrawing(true); 
    try {
      await backendActor.drawNextNumber(gameNumberNat);
      await fetchGameState();
    } catch (error) {
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('Game is not in progress or a winner has been declared.') ||
        errorMessage.includes('All numbers have been drawn. The game is over.')
      ) {
        setGameInProgress(false);
        setIsAutoDraw(false);
        console.log('Game has ended, stopping auto-draw.');
      } else {
        setMessage(`Error drawing next number: ${error.message || error}`);
        setMessageType('error');
      }
    }
    setIsDrawing(false); 
  };

  const resetGame = async () => {
    if (!backendActor) return;
    if (
      !window.confirm(
        'Are you sure you want to reset the game? This will clear all cards and game progress.'
      )
    ) {
      return;
    }
    try {
      await backendActor.resetGame(gameNumberNat);
      console.log('Game has been reset.');
      navigate('/menu', { state: { message: 'Game has been reset.', messageType: 'success' } });
    } catch (error) {
      setMessage(`Error resetting game: ${error.message || error}`);
      setMessageType('error');
    }
  };

  /**
   * Plays the audio corresponding to the drawn number.
   * Utilizes the AudioContext to decode and play the audio buffer.
   * @param {number} number - The drawn Bingo number.
   */
  const playAudioForNumber = async (number) => {
    const letter = getLetterForNumber(number);
    if (!letter) {
      console.warn(`No corresponding letter for number: ${number}`);
      return;
    }

    const audioFilePath = `/audio/${letter}${number}.mp3`;
    console.log(`Attempting to play audio file: ${audioFilePath}`);

    if (!audioContextRef.current) {
      console.error('AudioContext not initialized.');
      return;
    }

    try {
      const audioBuffer = await fetchAndDecodeAudio(audioContextRef.current, audioFilePath);
      if (!audioBuffer) {
        console.error(`Failed to load audio file: ${audioFilePath}`);
        return;
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      if (currentAudioSourceRef.current) {
        currentAudioSourceRef.current.stop();
      }

      currentAudioSourceRef.current = source;
      source.start(0);
      console.log(`Successfully played audio file: ${audioFilePath}`);
    } catch (error) {
      console.error(`Error fetching or playing audio file ${audioFilePath}:`, error);
    }
  };

  const playWinnerAudio = async () => {
    const audioFilePath = '/audio/bingoWin.mp3';
    console.log(`Attempting to play winner audio file: ${audioFilePath}`);

    if (!audioContextRef.current) {
      console.error('AudioContext not initialized.');
      return;
    }

    try {
      const audioBuffer = await fetchAndDecodeAudio(audioContextRef.current, audioFilePath);
      if (!audioBuffer) {
        console.error('Failed to load winner audio.');
        return;
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      if (currentAudioSourceRef.current) {
        currentAudioSourceRef.current.stop();
      }

      currentAudioSourceRef.current = source;
      source.start(0);
      console.log('Winner audio played.');
    } catch (error) {
      console.error('Error playing winner audio:', error);
    }
  };

  const handleToggleAudio = async () => {
    if (!audioEnabled) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext created.');
      }
      try {
        await audioContextRef.current.resume();
        console.log('AudioContext resumed.');
      } catch (error) {
        console.error('Error resuming AudioContext:', error);
      }
      setAudioEnabled(true);
      previousNumberRef.current = null; 
    } else {
      if (audioContextRef.current) {
        try {
          if (currentAudioSourceRef.current) {
            currentAudioSourceRef.current.stop();
            currentAudioSourceRef.current = null;
          }
          await audioContextRef.current.suspend();
          console.log('AudioContext suspended.');
        } catch (error) {
          console.error('Error suspending AudioContext:', error);
        }
      }
      setAudioEnabled(false);
    }
  };

  useEffect(() => {
    if (audioContextRef.current) {
      fetchAndDecodeAudio(audioContextRef.current, '/audio/card.mp3');
    }
  }, [audioContextRef.current]);

  useEffect(() => {
    if (latestNumber !== null && audioEnabled) {
      if (latestNumber !== previousNumberRef.current) {
        playAudioForNumber(latestNumber);
        previousNumberRef.current = latestNumber;
      }
    }
  }, [latestNumber, audioEnabled]);

  useEffect(() => {
    if (winner && audioEnabled && !winnerAudioPlayedRef.current) {
      playWinnerAudio();
      winnerAudioPlayedRef.current = true;
    } else if (!winner) {
      winnerAudioPlayedRef.current = false;
    }
  }, [winner, audioEnabled]);

  const claimWinnings = async () => {
    if (!backendActor) return;
    if (!winner || !winner.principal) {
      alert('No winner to claim winnings.');
      return;
    }

    setIsClaiming(true);
    try {
      const success = await backendActor.distributeWinnings(gameNumberNat);
      if (success) {
        navigate('/menu', { state: { message: `Your winnings of ${totalPrizeICP.toFixed(4)} ICP have been transferred to your account!`, messageType: 'success' } });
      } else {
        throw new Error('Winnings distribution failed.');
      }
    } catch (error) {
      console.error('Error during claiming winnings:', error);
      alert(`Failed to distribute winnings: ${error.message || error}`);
    } finally {
      setIsClaiming(false); 
      await fetchGameState(); 
    }
  };

  const handleBecomeHost = async () => {
    if (!backendActor) return;
    setIsBecomingHost(true);
    try {
      const success = await backendActor.becomeHost(gameNumberNat);
      if (success) {
        setIsHost(true);
        setMessage('You are now the host of the game.');
        setMessageType('success');
        await fetchGameState(); 
      }
    } catch (error) {
      let userFriendlyMessage = "Error becoming host.";
      if (error.message) {
        if (error.message.includes("Another user has already been assigned as host for this game.")) {
          userFriendlyMessage = "Another player has already become the host for this game.";
        } else if (error.message.includes("Cannot become host before 5 minutes have passed since scheduled start time.")) {
          userFriendlyMessage = "Cannot become host before 5 minutes have passed since the scheduled start time.";
        } else if (error.message.includes("Cannot become host because the game is already in progress.")) {
          userFriendlyMessage = "Cannot become host because the game is already in progress.";
        } else if (error.message.includes("Cannot become host for a game that already has a winner.")) {
          userFriendlyMessage = "Cannot become host for a game that already has a winner.";
        } else if (error.message.includes("You are already the host.")) {
          userFriendlyMessage = "You are already the host.";
        } else {
          userFriendlyMessage = `Error becoming host: ${error.message}`;
        }
      }
      setMessage(userFriendlyMessage);
      setMessageType('error');
    }
    setIsBecomingHost(false);
  };

  if (isCheckingCard) {
    return (
      <div className="game-screen">
        <h1>
          {gameName || 'Game'} ({gameNumber})
        </h1>
        <p>Loading your Bingo card...</p>
        <button disabled className="view-card-button disabled">Loading...</button>
        <button onClick={() => navigate('/menu')} className="back-button">Back to Menu</button>
      </div>
    );
  }

  if (!hasCard) {
    return (
      <div className="game-screen">
        <h1>
          {gameName || 'Game'} ({gameNumber})
        </h1>
        <p>Your BINGO card is available for the next game!</p>
        {isGeneratingCard ? (
          <p>Your card is being generated. Please wait...</p>
        ) : (
          <button onClick={generateCard} className="view-card-button">View My Card</button>
        )}
        <button onClick={() => navigate('/menu')} className="back-button">Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <h1>
        {gameName || 'Game'} ({gameNumber})
      </h1>
      <BingoCard
        card={card}
        markedCells={markedCells}
        handleCellClick={handleCellClick}
      />

      {message && (
        <Message
          message={message}
          messageType={messageType}
          onClose={() => setMessage('')}
        />
      )}

      {allNumbersDrawn && !message && (
        <Message
          message="All numbers have been drawn in this game!"
          messageType="info"
          onClose={() => setMessage('')}
        />
      )}

      {winner && winner.principal === principal && !gameInProgress && !gameCompleted && (
        <button
          onClick={claimWinnings}
          className="claim-button"
          disabled={isClaiming}
        >
          {isClaiming ? 'Claiming Winnings…' : 'Claim Winnings'}
        </button>
      )}

      {winner && winner.principal && <WinnerInfo winner={winner} />}

      {canBecomeHost && !isHost && !winner && (
        <button
          onClick={handleBecomeHost}
          className="become-host-button"
          disabled={isBecomingHost}
        >
          {isBecomingHost ? 'Becoming Host…' : 'Become Host'}
        </button>
      )}

      {isHost && !gameInProgress && !winner && (
        <>
          <button
            onClick={startGame}
            className="admin-button"
            disabled={!canStartGame || isStartingGame}
          >
            {isStartingGame ? 'Starting…' : 'Start Game'}
          </button>
          {!canStartGame && scheduledStartTimeMs && (
            <p className="start-game-message">
              Game cannot be started before the scheduled start time: {new Date(scheduledStartTimeMs).toLocaleString()}
            </p>
          )}
        </>
      )}

      <GameInfo
        gameNumber={gameNumberNat}
        latestNumber={latestNumber}
        calledNumbers={calledNumbers}
        checkWin={checkWin}
        isAdmin={isHost}
        drawNextNumber={drawNextNumber}
        winner={winner}
        gameInProgress={gameInProgress}
        winType={winType}
        cardCount={cardCount}
        isDrawing={isDrawing}
        isChecking={isChecking}
        audioEnabled={audioEnabled}
        handleToggleAudio={handleToggleAudio}
        isAutoDraw={isAutoDraw}
        toggleAutoDraw={toggleAutoDraw}
        totalPrizeICP={totalPrizeICP}
      />

      <ChatRoom
        backendActor={backendActor}
        username={username}
        setUsername={setUsername}
        gameNumber={gameNumberNat}
        isAdmin={isHost}
        gameName={gameName}
        isLobby={false}
        principal={principal}
      />

      <button onClick={() => navigate('/menu')} className="back-button">
        Back to Menu
      </button>

      <footer>
        {principal && (
          <p style={{ fontSize: '0.8rem', marginTop: '20px' }}>
            Your Principal ID: {principal}
          </p>
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
    </div>
  );
}

export default GameScreen;
