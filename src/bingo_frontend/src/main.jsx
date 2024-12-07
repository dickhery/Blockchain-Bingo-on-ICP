// src/bingo_frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import { Buffer } from 'buffer'; 

if (typeof window !== 'undefined') {
  window.Buffer = Buffer; 
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
