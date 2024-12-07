// src/bingo_frontend/src/LoginScreen.jsx

import React from 'react';
import './LoginScreen.scss';
import Footer from './components/Footer.jsx'; // Import the new Footer component

function LoginScreen({ handleLogin }) {
  return (
    <div className="login-screen">
      <img
        src="/images/login_logo.png"
        alt="Bingo Logo"
        className="login-logo"
      />
      <h1>Welcome to Bingo</h1>
      <button onClick={handleLogin} className="login-button">
        Login with Internet Identity
      </button>

      <Footer />
    </div>
  );
}

export default LoginScreen;
