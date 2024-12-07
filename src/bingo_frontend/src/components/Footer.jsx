// Footer.jsx
import React from 'react';
import DOMPurify from 'dompurify';

function Footer({ principal }) {
  return (
    <footer>
      <p style={{ fontSize: '0.8rem', marginTop: principal ? '10px' : '20px' }}>
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
  );
}

export default Footer; 
