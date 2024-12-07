// src/bingo_frontend/src/components/PlayBingoScreen.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Actor, HttpAgent } from '@dfinity/agent';
import {
  idlFactory as backend_idlFactory,
  canisterId as backend_canisterId,
} from 'declarations/bingo_backend';
import { LedgerCanister, AccountIdentifier } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import './PlayBingoScreen.scss';
import ConfirmationModal from './ConfirmationModal.jsx';
import TermsAndConditionsModal from './TermsAndConditionsModal.jsx';
import DOMPurify from 'dompurify';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Footer from './Footer.jsx'; 

function PlayBingoScreen({ authClient, principal }) {
  const [backendActor, setBackendActor] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [nowPlayingGames, setNowPlayingGames] = useState([]);
  const [pastGames, setPastGames] = useState([]);
  const [principalToUsername, setPrincipalToUsername] = useState({});
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [disabledButtons, setDisabledButtons] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const ledgerCanister = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [filteredUpcomingGames, setFilteredUpcomingGames] = useState([]);
  const [filteredNowPlayingGames, setFilteredNowPlayingGames] = useState([]);
  const [filteredPastGames, setFilteredPastGames] = useState([]);
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
    if (authClient) {
      initializeActors();
    }
  }, [authClient]);

  const initializeActors = async () => {
    const identity = await authClient.getIdentity();
    const agent = new HttpAgent({ identity, host: 'https://ic0.app' });

    if (process.env.NODE_ENV !== 'production') {
      await agent.fetchRootKey();
    }

    ledgerCanister.current = LedgerCanister.create({
      agent,
      canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
    });

    const actor = Actor.createActor(backend_idlFactory, {
      agent,
      canisterId: backend_canisterId,
    });

    setBackendActor(actor);
  };

  useEffect(() => {
    let interval;
    if (backendActor) {
      fetchGames();
      interval = setInterval(() => {
        fetchGames();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [backendActor]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const fetchGames = async () => {
    try {
      const gameSummaries = await backendActor.getActiveGames();
      const now = new Date();
      const upcoming = [];
      const nowPlaying = [];
      const past = [];
      const principalsSet = new Set();

      gameSummaries.forEach((game) => {
        const scheduledStartTimeMs = Number(game.scheduledStartTime / BigInt(1000000)); 
        const scheduledStartTime = new Date(scheduledStartTimeMs);

        const hostPrincipalId = game.hostPrincipalId.toText();
        principalsSet.add(hostPrincipalId);

        if (game.winner && game.winner.length > 0 && game.winner[0].principal) {
          const winnerPrincipalId = game.winner[0].principal.toText();
          principalsSet.add(winnerPrincipalId);
        }

        if (
          game.completed ||
          (game.winner && game.winner.length > 0 && game.winner[0].principal)
        ) {
          past.push({ game, scheduledStartTime });
        } else if (game.gameInProgress) {
          nowPlaying.push({ game, scheduledStartTime });
        } else if (scheduledStartTime > now) {
          upcoming.push({ game, scheduledStartTime });
        } else {
          upcoming.push({ game, scheduledStartTime });
        }
      });

      const principalsArray = Array.from(principalsSet);
      const principalToUsernameMap = {};

      for (const pid of principalsArray) {
        const principalObj = Principal.fromText(pid);
        try {
          const usernameOpt = await backendActor.getUsername(principalObj);
          if (usernameOpt && usernameOpt.length > 0) {
            principalToUsernameMap[pid] = DOMPurify.sanitize(usernameOpt[0]);
          } else {
            principalToUsernameMap[pid] = pid;
          }
        } catch (error) {
          console.error(`Error fetching username for principal ${pid}:`, error);
          principalToUsernameMap[pid] = pid;
        }
      }

      const sortByTime = (a, b) => a.scheduledStartTime - b.scheduledStartTime;

      upcoming.sort(sortByTime);
      nowPlaying.sort(sortByTime);
      past.sort((a, b) => b.scheduledStartTime - a.scheduledStartTime); 

      setUpcomingGames(upcoming);
      setNowPlayingGames(nowPlaying);
      setPastGames(past);
      setPrincipalToUsername(principalToUsernameMap); 
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

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

  const getUserGeolocationForRegistration = async () => {
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

  const formatPriceWithFees = (priceE8s) => {
    const basePriceICP = Number(priceE8s) / 100_000_000;
    const isPaidGame = basePriceICP > 0;
    const totalPriceICP = isPaidGame
      ? (basePriceICP + 0.0002).toFixed(4)
      : basePriceICP.toFixed(4);
    return { totalPriceICP, isPaidGame };
  };

  useEffect(() => {
    const filterGames = (games) => {
      return games.filter(({ game }) => {
        const gameNameMatch = game.gameName.toLowerCase().includes(searchTerm.toLowerCase());
        const gameNumberMatch = game.gameNumber.toString().includes(searchTerm);
        const hostPrincipalId = game.hostPrincipalId.toText();
        const hostUsername = principalToUsername[hostPrincipalId] || hostPrincipalId;
        const hostMatch = hostUsername.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSearchTerm = gameNameMatch || gameNumberMatch || hostMatch;

        let matchesPriceFilter = true;
        if (priceFilter === 'free') {
          matchesPriceFilter = Number(game.price) === 0;
        } else if (priceFilter === 'paid') {
          matchesPriceFilter = Number(game.price) > 0;
        }

        return matchesSearchTerm && matchesPriceFilter;
      });
    };

    setFilteredUpcomingGames(filterGames(upcomingGames));
    setFilteredNowPlayingGames(filterGames(nowPlayingGames));
    setFilteredPastGames(filterGames(pastGames));
  }, [searchTerm, priceFilter, upcomingGames, nowPlayingGames, pastGames, principalToUsername]);

  const handleRegister = async (gameNumber, priceE8s, hostPrincipalId, password) => {
    if (!backendActor) return;
    try {
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();

      const hasPaid = await backendActor.hasUserPaid(gameNumber, userPrincipal);
      if (hasPaid) {
        setMessage('You have already registered for the game.');
        setMessageType('info');
        navigate(`/game/${gameNumber}`);
        return;
      }

      if (Number(priceE8s) > 0) {
        try {
          const geolocation = await getUserGeolocationForRegistration();
          const countryCode = geolocation.country; 
          const stateProv = geolocation.region; 

          if (prohibitedCountries.includes(countryCode)) {
            setMessage('You are not allowed to participate in paid games from your location.');
            setMessageType('error');
            return;
          }

          if (countryCode === 'US' && prohibitedUSStates.includes(stateProv)) {
            setMessage('You are not allowed to participate in paid games from your state.');
            setMessageType('error');
            return;
          }
        } catch (error) {
          console.error('Error during geolocation check:', error);
          setMessage('Unable to verify your location. Please try again.');
          setMessageType('error');
          return;
        }
      }

      const passwordOpt = password ? [DOMPurify.sanitize(password)] : [];

      if (Number(priceE8s) === 0) {
        const paymentSuccess = await backendActor.recordPayment(gameNumber, passwordOpt);
        if (paymentSuccess || paymentSuccess === false) {
          setMessage('You have successfully registered for the game.');
          setMessageType('success');
          navigate(`/game/${gameNumber}`);
        } else {
          setMessage('Failed to register for the game.');
          setMessageType('error');
        }
        return;
      }

      const serviceFee = (priceE8s * BigInt(25)) / BigInt(1000); 
      const transferAmount = (priceE8s * BigInt(975)) / BigInt(1000); 

      const serviceFeeAccountHex = '1510d66d73fb20962516511357e90bf2503cfa1ba66d26ac0dcdc07c2be0e78e';
      const serviceFeeAccount = AccountIdentifier.fromHex(serviceFeeAccountHex);

      const icpTransferBackendCanisterId = 'w4qr5-faaaa-aaaap-anunq-cai';
      const icpTransferBackendPrincipal = Principal.fromText(icpTransferBackendCanisterId);
      const icpTransferBackendAccount = AccountIdentifier.fromPrincipal({
        principal: icpTransferBackendPrincipal,
        subAccount: undefined,
      });

      try {
        const txId1 = await ledgerCanister.current.transfer({
          to: serviceFeeAccount,
          fee: BigInt(10_000),
          memo: BigInt(0),
          amount: serviceFee,
          fromSubAccount: undefined,
          createdAt: undefined,
        });

        const txId2 = await ledgerCanister.current.transfer({
          to: icpTransferBackendAccount,
          fee: BigInt(10_000),
          memo: BigInt(0),
          amount: transferAmount,
          fromSubAccount: undefined,
          createdAt: undefined,
        });

        console.log('Service Fee Transaction ID:', txId1);
        console.log('Transfer to icp_transfer_backend Transaction ID:', txId2);
      } catch (error) {
        console.error('Error during transfers:', error);

        setMessage('You do not have enough ICP to make this transaction.');
        setMessageType('error');
        return;
      }

      const paymentSuccess = await backendActor.recordPayment(gameNumber, passwordOpt);
      if (paymentSuccess || paymentSuccess === false) {
        setMessage('Payment successful! You can now join the game.');
        setMessageType('success');
        navigate(`/game/${gameNumber}`);
      } else {
        setMessage('Payment failed or already recorded.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('An error occurred during registration. Please try again.');
      setMessageType('error');
      return;
    }
  };

  const Row = useCallback(
    ({ index, style, data }) => {
      const { game, scheduledStartTime } = data[index];
      const hostPrincipalId = game.hostPrincipalId.toText();
      const hostUsername = principalToUsername[hostPrincipalId] || hostPrincipalId;

      const { totalPriceICP, isPaidGame } = formatPriceWithFees(game.price);

      const priceE8s = BigInt(game.price);
      const cardCount = BigInt(game.cardCount || 0);
      const hostPercentage = BigInt(game.hostPercentage || 0); 
      const serviceFeePercentage = BigInt(25); 

      const totalCollected = (priceE8s * cardCount * BigInt(975)) / BigInt(1000); 
      const prizePoolE8s =
        (totalCollected * (BigInt(1000) - hostPercentage)) / BigInt(1000); 
      const totalPrizeICP = Number(prizePoolE8s) / 100_000_000;

      const hostPercentageValue = Number(hostPercentage) / 10; 

      let winTypeString = 'Unknown';
      if (game.winType) {
        if ('Blackout' in game.winType) {
          winTypeString = 'Blackout';
        } else if ('Standard' in game.winType) {
          winTypeString = 'Standard';
        }
      }

      const isUpcoming = scheduledStartTime > new Date();

      const timeUntilStartMs = scheduledStartTime - new Date();
      const days = Math.floor(timeUntilStartMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntilStartMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeUntilStartMs / (1000 * 60)) % 60);
      const seconds = Math.floor((timeUntilStartMs / 1000) % 60);

      const gameTypeClass = isPaidGame ? 'paid-game' : 'free-game';

      return (
        <div
          key={Number(game.gameNumber)}
          className={`game-item ${gameTypeClass}`}
          style={style}
        >
          <h3>{DOMPurify.sanitize(game.gameName)}</h3>
          <p>Scheduled Start Time: {scheduledStartTime.toLocaleString()}</p>
          <p>Host: {hostUsername}</p>
          <p>Players Registered: {Number(game.cardCount)}</p>
          <p>Price: {totalPriceICP} ICP *</p>
          <p>Total Prize: {totalPrizeICP.toFixed(4)} ICP **</p>
          <p>Win Type: {winTypeString}</p>
          <p>Host Keeps: {hostPercentageValue}% ***</p>
          <p>Password Protected: {game.passwordProtected ? 'Yes' : 'No'}</p>
          {isUpcoming ? (
            <p>
              Time Until Start: {days}d {hours}h {minutes}m {seconds}s
            </p>
          ) : (
            <p>Now Playing!</p>
          )}
          {isPaidGame && (
            <p className="small-print">
              <br />
              * Visit the About section on the main menu for detailed fee information
              <br />
              ** Based on number of registered players
              <br />
              *** Amount the host gets from each card purchase in this game after other fees are deducted
            </p>
          )}
          {game.hostPrincipalId.toText() === principal ? (
            <button disabled title="Cannot join your own game.">
              Hosting Game
            </button>
          ) : (
            <button
              onClick={() => handleOpenConfirmationModal(game)}
              disabled={disabledButtons[game.gameNumber]}
            >
              {isUpcoming ? 'Register' : 'Join Game'}
            </button>
          )}
        </div>
      );
    },
    [principal, principalToUsername, disabledButtons]
  );

  const PastRow = useCallback(
    ({ index, style, data }) => {
      const { game, scheduledStartTime } = data[index];
      const hostPrincipalId = game.hostPrincipalId.toText();
      const hostUsername = principalToUsername[hostPrincipalId] || hostPrincipalId;

      let winnerDisplayName = 'Unknown';
      if (game.winner && game.winner.length > 0 && game.winner[0].principal) {
        const winnerData = game.winner[0];
        const winnerPrincipalId = winnerData.principal.toText();

        let winnerUsername;
        if (winnerData.username && winnerData.username.length > 0) {
          winnerUsername = DOMPurify.sanitize(winnerData.username[0]);
        } else {
          winnerUsername =
            principalToUsername[winnerPrincipalId] || winnerPrincipalId;
        }
        winnerDisplayName = winnerUsername;
      }

      const hostPercentage = BigInt(game.hostPercentage); 
      const totalPrizeE8s =
        (BigInt(game.price) *
          BigInt(game.cardCount) *
          BigInt(975) *
          (BigInt(1000) - hostPercentage)) /
        BigInt(1_000_000);
      const totalPrizeICP = Number(totalPrizeE8s) / 100_000_000;

      return (
        <div
          key={Number(game.gameNumber)}
          className="game-item past-game"
          style={style}
        >
          <h3>{DOMPurify.sanitize(game.gameName)}</h3>
          <p>Game Number: {Number(game.gameNumber)}</p>
          <p>Game Time: {scheduledStartTime.toLocaleString()}</p>
          <p>Host: {hostUsername}</p>
          <p>Winner: {winnerDisplayName}</p>
          <p>Total Prize Awarded: {totalPrizeICP.toFixed(4)} ICP</p>
          <p>Password Protected: {game.passwordProtected ? 'Yes' : 'No'}</p>
        </div>
      );
    },
    [principalToUsername]
  );

  const handleOpenConfirmationModal = async (game) => {
    try {
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();
      const hasPaid = await backendActor.hasUserPaid(game.gameNumber, userPrincipal);
      if (hasPaid) {
        setMessage('You have already registered for the game.');
        setMessageType('info');
        navigate(`/game/${game.gameNumber}`);
        return;
      }
    } catch (error) {
      console.error('Error checking user registration:', error);
    }

    setSelectedGame(game);
    setShowConfirmationModal(true);
  };

  const handleConfirm = async (password) => {
    if (!selectedGame) return;
    const gameNumber = selectedGame.gameNumber;
    const price = selectedGame.price;
    const hostPrincipalId = selectedGame.hostPrincipalId.toText();

    setIsProcessing(true); 

    try {
      if (selectedGame.passwordProtected) {
        if (!password) {
          alert('Please enter the password for this game.');
          setIsProcessing(false);
          return;
        }
        const passwordValid = await backendActor.verifyGamePassword(gameNumber, password);
        if (!passwordValid) {
          alert('Incorrect password.');
          setIsProcessing(false);
          return;
        }
      }

      await handleRegister(gameNumber, price, hostPrincipalId, password);

      setDisabledButtons((prev) => ({
        ...prev,
        [gameNumber]: true,
      }));

      setShowConfirmationModal(false);
      setSelectedGame(null);
    } catch (error) {
      console.error('Error during confirmation:', error);
      setMessage('An error occurred during confirmation. Please try again.');
      setMessageType('error');
      setShowConfirmationModal(false);
      setSelectedGame(null);
    } finally {
      setIsProcessing(false); 
    }
  };

  const handleCancel = () => {
    setShowConfirmationModal(false);
    setSelectedGame(null);
  };

  return (
    <div className="play-bingo-screen">
      <h1>Available Games</h1>
      {showTermsModal && <TermsAndConditionsModal onAgree={handleAgreeToTerms} />}

      {message && (
        <div className={`message ${messageType}`}>
          <span className="message-text">{DOMPurify.sanitize(message)}</span>
          <button onClick={() => setMessage('')} className="close-button">
            ✖
          </button>
        </div>
      )}

      <div className="search-and-filter">
        <input
          type="text"
          placeholder="Search by game name, number, or host"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="filters">
          <label>
            <input
              type="radio"
              name="priceFilter"
              value="all"
              checked={priceFilter === 'all'}
              onChange={(e) => setPriceFilter(e.target.value)}
            />
            All
          </label>
          <label>
            <input
              type="radio"
              name="priceFilter"
              value="free"
              checked={priceFilter === 'free'}
              onChange={(e) => setPriceFilter(e.target.value)}
            />
            Free
          </label>
          <label>
            <input
              type="radio"
              name="priceFilter"
              value="paid"
              checked={priceFilter === 'paid'}
              onChange={(e) => setPriceFilter(e.target.value)}
            />
            Paid
          </label>
        </div>
      </div>

      <button onClick={() => navigate('/menu')} className="back-button">
        Back to Menu
      </button>

      {filteredUpcomingGames.length === 0 &&
        filteredNowPlayingGames.length === 0 &&
        filteredPastGames.length === 0 ? (
        <p>No games available matching your criteria.</p>
      ) : (
        <>


{filteredNowPlayingGames.length > 0 && (
            <>
              <h2>Now Playing</h2>
              <div className="game-list">
                <AutoSizer>
                  {({ height, width }) => {
                    const getItemSize = (index) => {
                      const { game } = filteredNowPlayingGames[index];
                      const isPaidGame = Number(game.price) > 0;
                      return isPaidGame ? 420 : 370; 
                    };

                    return (
                      <List
                        height={height}
                        itemCount={filteredNowPlayingGames.length}
                        itemSize={getItemSize}
                        width={width}
                        itemData={filteredNowPlayingGames}
                      >
                        {Row}
                      </List>
                    );
                  }}
                </AutoSizer>
              </div>
            </>
          )}

          {filteredUpcomingGames.length > 0 && (
            <>
              <h2>Upcoming Games</h2>
              <div className="game-list">
                <AutoSizer>
                  {({ height, width }) => {
                    const getItemSize = (index) => {
                      const { game } = filteredUpcomingGames[index];
                      const isPaidGame = Number(game.price) > 0;
                      return isPaidGame ? 420 : 370; 
                    };

                    return (
                      <List
                        height={height}
                        itemCount={filteredUpcomingGames.length}
                        itemSize={getItemSize}
                        width={width}
                        itemData={filteredUpcomingGames}
                      >
                        {Row}
                      </List>
                    );
                  }}
                </AutoSizer>
              </div>
            </>
          )}

          {filteredPastGames.length > 0 && (
            <>
              <h2>Past Games</h2>
              <div className="game-list">
                {/* Virtualized Past Games List */}
                <AutoSizer>
                  {({ height, width }) => {
                    const getItemSize = (index) => {
                      return 300; // Adjust height as needed for past games
                    };

                    return (
                      <List
                        height={height}
                        itemCount={filteredPastGames.length}
                        itemSize={getItemSize}
                        width={width}
                        itemData={filteredPastGames}
                      >
                        {PastRow}
                      </List>
                    );
                  }}
                </AutoSizer>
              </div>
            </>
          )}
        </>
      )}

      {showConfirmationModal && selectedGame && (
        <ConfirmationModal
          game={selectedGame}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isProcessing={isProcessing}
          isPasswordProtected={selectedGame.passwordProtected}
        />
      )}

      <button onClick={() => navigate('/menu')} className="back-button">
        Back to Menu
      </button>

      <Footer principal={principal} />
    </div>
  );
}

export default PlayBingoScreen;
