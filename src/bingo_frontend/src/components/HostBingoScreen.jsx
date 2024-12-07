// src/bingo_frontend/src/components/HostBingoScreen.jsx

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { icpToE8s } from '../utils.js';
import './HostBingoScreen.scss';
import TermsAndConditionsModal from './TermsAndConditionsModal.jsx';
import Footer from './Footer.jsx'; 

function HostBingoScreen({ backendActor, principal }) {
  const [gameName, setGameName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [winType, setWinType] = useState('Blackout');
  const [priceICP, setPriceICP] = useState('0.0');
  const [hostPercentage, setHostPercentage] = useState('2.5');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const navigate = useNavigate();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');

  const prohibitedCountries = ['BD', 'IL', 'PL', 'RU', 'SG', 'AE', 'ID'];
  const prohibitedUSStates = [
    'Illinois',
    'Indiana',
    'Louisiana',
    'Michigan',
    'Nevada',
    'New York',
    'Oregon',
    'South Dakota',
    'Washington',
    'Wisconsin',
  ];

  useEffect(() => {
    const checkActiveGames = async () => {
      if (!backendActor || !principal) return;
      try {
        const gameSummaries = await backendActor.getActiveGames();
        const activeGames = gameSummaries.filter(
          (game) =>
            game.hostPrincipalId.toText() === principal &&
            (game.gameInProgress || game.winner !== null)
        );
        setHasActiveGame(activeGames.length > 0);
      } catch (error) {
        console.error('Error checking active games:', error);
      }
    };
    checkActiveGames();
  }, [backendActor, principal]);

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

  const getUserGeolocation = async () => {
    try {
      const token = import.meta.env.VITE_IPINFO_TOKEN;
      if (!token) {
        throw new Error('IPinfo API token is not defined.');
      }
      const response = await fetch(`https://ipinfo.io/json?token=${token}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to get geolocation');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching geolocation:', error);
      throw error;
    }
  };

  const handleAgreeToTerms = async () => {
    try {
      await backendActor.recordUserAgreement();
      setShowTermsModal(false);
    } catch (error) {
      console.error('Error recording user agreement:', error);
      alert('An error occurred while recording your agreement. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!backendActor) {
      alert('Backend actor not initialized.');
      return;
    }

    if (!gameName || !scheduledDate || !scheduledTime) {
      alert('Please fill in all fields.');
      return;
    }

    const hostPercNum = parseFloat(hostPercentage);
    if (isNaN(hostPercNum) || hostPercNum < 0 || hostPercNum > 100) {
      alert('Host percentage must be between 0% and 100%.');
      return;
    }

    const hostPercBasis = Math.round(hostPercNum * 10);

    if (passwordProtected && !password) {
      alert('Please enter a password for your game.');
      return;
    }

    setIsCreatingGame(true);

    if (parseFloat(priceICP) > 0) {
      try {
        const geolocation = await getUserGeolocation();
        const countryCode = geolocation.country; 
        const stateProv = geolocation.region; 

        if (prohibitedCountries.includes(countryCode)) {
          alert('You are not allowed to create paid games from your location.');
          setIsCreatingGame(false);
          return;
        }

        if (countryCode === 'US' && prohibitedUSStates.includes(stateProv)) {
          alert('You are not allowed to create paid games from your state.');
          setIsCreatingGame(false);
          return;
        }
      } catch (error) {
        console.error('Error during geolocation check:', error);
        alert('Unable to verify your location. Please try again.');
        setIsCreatingGame(false);
        return;
      }
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const scheduledStartTime = BigInt(scheduledDateTime.getTime()) * BigInt(1_000_000);
    const winTypeVariant = winType === 'Blackout' ? { Blackout: null } : { Standard: null };

    try {
      const gameNumber = await backendActor.createGame(
        DOMPurify.sanitize(gameName),
        scheduledStartTime,
        winTypeVariant,
        icpToE8s(priceICP),
        hostPercBasis,
        passwordProtected ? [DOMPurify.sanitize(password)] : []
      );
      alert(`Game "${DOMPurify.sanitize(gameName)}" has been created with Game Number: ${gameNumber}`);
      navigate('/menu');
    } catch (error) {
      alert(`Error creating game: ${error.message || error}`);
    } finally {
      setIsCreatingGame(false);
    }
  };

  return (
    <div className="host-bingo-screen">
      <h1>Host a New Bingo Game</h1>
      {showTermsModal && <TermsAndConditionsModal onAgree={handleAgreeToTerms} />}
      <form onSubmit={handleSubmit} className="host-form">
        {hasActiveGame && (
          <div className="active-game-warning">
            <p>
              You have active games in progress or with winners. Transfers are disabled while you
              hold players' tokens.
            </p>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="gameName">Game Name:</label>
          <input
            type="text"
            id="gameName"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            required
            disabled={hasActiveGame}
          />
        </div>
        <div className="form-group">
          <label htmlFor="scheduledDate">Date:</label>
          <input
            type="date"
            id="scheduledDate"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
            disabled={hasActiveGame}
          />
        </div>
        <div className="form-group">
          <label htmlFor="scheduledTime">Time:</label>
          <input
            type="time"
            id="scheduledTime"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
            disabled={hasActiveGame}
          />
        </div>
        <div className="form-group">
          <label htmlFor="winType">Win Type:</label>
          <div className="win-type-options">
            <label>
              <input
                type="radio"
                name="winType"
                value="Blackout"
                checked={winType === 'Blackout'}
                onChange={(e) => setWinType(e.target.value)}
                disabled={hasActiveGame}
              />
              Blackout
            </label>
            <label>
              <input
                type="radio"
                name="winType"
                value="Standard"
                checked={winType === 'Standard'}
                onChange={(e) => setWinType(e.target.value)}
                disabled={hasActiveGame}
              />
              Standard
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="priceICP">Price (ICP):</label>
          <input
            type="number"
            id="priceICP"
            value={priceICP}
            onChange={(e) => setPriceICP(e.target.value)}
            min="0"
            step="0.0001"
            required
            disabled={hasActiveGame}
          />
          <small>0.0002 ICP will be added to cover 2 transactions during registration</small>
        </div>
        <div className="form-group">
          <label htmlFor="hostPercentage">Host Percentage (%):</label>
          <input
            type="number"
            id="hostPercentage"
            value={hostPercentage}
            onChange={(e) => setHostPercentage(e.target.value)}
            min="0"
            max="100"
            step="0.1"
            required
            disabled={hasActiveGame}
          />
          <small>Host percentage is calculated after 2.5% service fee is deducted from price</small>
        </div>
        <div className="form-group">
          <label htmlFor="passwordProtected">
            <input
              type="checkbox"
              id="passwordProtected"
              checked={passwordProtected}
              onChange={(e) => setPasswordProtected(e.target.checked)}
              disabled={hasActiveGame}
            />
            Require Password to Join
          </label>
        </div>
        {passwordProtected && (
          <div className="form-group">
            <label htmlFor="password">Game Password:</label>
            <input
              type="text"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={hasActiveGame}
            />
            <br />
            <small>
              Players will not be able to play in your game without entering this password.
              You must provide this password to players you invite to your game.
            </small>
          </div>
        )}
        <small>
          You must start your game within 5 minutes of the scheduled start time. Failure to do so
          may result in a registered player in your game taking over the host role and receiving the
          host percentage from your game. At any time during the duration of your game if there are
          no numbers drawn for 5 minutes, all players in your game will be given the opportunity to
          become the host of this game.
        </small>
        <small>
          You will have to register to your own game to host it. This includes paying the price for
          a bingo card in your game.
        </small>
        <button type="submit" className="submit-button" disabled={isCreatingGame || hasActiveGame}>
          {isCreatingGame ? 'Creating Game…' : 'Create Game'}
        </button>
      </form>
      <button className="back-button" onClick={() => window.history.back()} disabled={hasActiveGame}>
        Back to Menu
      </button>
      <Footer principal={principal} />
    </div>
  );
}

export default HostBingoScreen;
