// src/bingo_frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import {
  idlFactory as backend_idlFactory,
  canisterId as backend_canisterId,
} from '../../declarations/bingo_backend';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MenuScreen from './components/MenuScreen.jsx';
import PlayBingoScreen from './components/PlayBingoScreen.jsx';
import HostBingoScreen from './components/HostBingoScreen.jsx';
import About from './components/About.jsx';
import GameScreen from './components/GameScreen.jsx';
import './index.scss';
import { Principal } from '@dfinity/principal';


function App() {
  // State variables
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [backendActor, setBackendActor] = useState(null);
  const [principal, setPrincipal] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  // New state variables for username
  const [username, setUsername] = useState('');

  // Initialize authentication on component mount
  useEffect(() => {
    initAuth();
  }, []);

  // Initialize authentication
  async function initAuth() {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        await handleAuthenticated(client);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error during authentication initialization:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }

  // Handle successful authentication
  async function handleAuthenticated(client) {
    try {
      const identity = client.getIdentity();
      const userPrincipal = identity.getPrincipal().toText();
      setPrincipal(userPrincipal);

      console.log('User Principal:', userPrincipal);

      const agent = new HttpAgent({ identity });

      // Only fetch root key in development
      if (process.env.NODE_ENV === 'development') {
        await agent.fetchRootKey();
      }

      const actor = Actor.createActor(backend_idlFactory, {
        agent,
        canisterId: backend_canisterId,
      });

      setBackendActor(actor);

      // Fetch username from the backend
      const userPrincipalObj = Principal.fromText(userPrincipal);
      const fetchedUsername = await actor.getUsername(userPrincipalObj);
      if (fetchedUsername) {
        setUsername(fetchedUsername);
      }

      // All steps successful, set isAuthenticated to true and set isLoading to false
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error during authenticated handling:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
      await client.logout();
    }
  }

  // Login using Internet Identity
  async function login() {
    if (!authClient) {
      console.error('AuthClient not initialized.');
      return;
    }
    setIsLoading(true); 
    await authClient.login({
      identityProvider: 'https://identity.ic0.app/#authorize',
      onSuccess: async () => {
        await handleAuthenticated(authClient);
      },
      onError: (err) => {
        console.error('Authentication error:', err);
        setIsLoading(false);
      },
    });
  }

  // Logout the user
  async function logout() {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setBackendActor(null);
    setPrincipal(null);
    setUsername(''); 
    setIsLoading(false);
    console.log('User has logged out.');
  }

  if (isLoading) {
    return (
      <main>
        <h1>Welcome to Bingo</h1>
        <p>Loading...</p>
        <img src="/images/login_logo.png" alt="Bingo Logo" className="login-logo" />
      </main>
    );
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <main>
          <img src="/images/login_logo.png" alt="Bingo Logo" className="login-logo" />
          <h1>Welcome to Bingo</h1>
          <button onClick={login}>Login with Internet Identity</button>
        </main>
      ) : (
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/menu" replace />}
          />
          <Route
            path="/menu"
            element={
              <MenuScreen
                logout={logout}
                backendActor={backendActor}
                principal={principal}
                authClient={authClient}
                username={username} 
                setUsername={setUsername} 
              />
            }
          />
          <Route
            path="/play-bingo"
            element={<PlayBingoScreen backendActor={backendActor} authClient={authClient} />} 
          />
          <Route
            path="/host-bingo"
            element={<HostBingoScreen backendActor={backendActor} />}
          />
          <Route path="/about" element={<About />} />
          <Route
            path="/game/:gameNumber"
            element={
              <GameScreen
                backendActor={backendActor}
                principal={principal}
                authClient={authClient} 
                username={username} 
                setUsername={setUsername} 
              />
            }
          />
          {/* Redirect any unknown routes to Menu */}
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      )}
      {/* Footer is part of MenuScreen and other screens */}
    </Router>
  );
}

export default App;
