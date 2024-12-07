// src/bingo_frontend/src/components/TermsAndConditionsModal.jsx

import React, { useState } from 'react';
import DOMPurify from 'dompurify'; 
import './TermsAndConditionsModal.scss';
import ReactMarkdown from 'react-markdown';

function TermsAndConditionsModal({ onAgree }) {
  const [checked, setChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAgree = async () => {
    if (!checked) {
      alert(DOMPurify.sanitize('Please confirm that you have read and agree to the Terms and Conditions.'));
      return;
    }

    setIsProcessing(true);

    try {
      await onAgree();
    } catch (error) {
      alert(DOMPurify.sanitize('There was an error processing your agreement. Please try again.'));
      setIsProcessing(false);
    }
  };

  const termsText = `
# Terms of Service and Privacy Policy for Blockchain Bingo

**Effective Date:** December 4th, 2024

Welcome to **Blockchain Bingo**! By using this application, you agree to abide by the terms and conditions outlined below. Please read them carefully before continuing to use Blockchain Bingo.

---

## 1. Acceptance of Terms

By accessing or using Blockchain Bingo, you confirm that you have read, understood, and agreed to these Terms of Service and Privacy Policy. If you do not agree to these terms, please refrain from using Blockchain Bingo.

---

## 2. Geoblocking and Location-Based Restrictions

- **Geoblocking**: Blockchain Bingo utilizes geoblocking to restrict access in areas where bingo games may be prohibited or restricted by law.
- **Location Data Collection**:
  - By using the app, you acknowledge and consent to the collection of your location data through your IP address whenever you attempt to create or participate in games with a price of more than 0 ICP.
  - You agree to allow Blockchain Bingo to block access to the app in locations where bingo is not permitted.
  
- **Currently Blocked Locations**:
  - **Prohibited Countries**: Bangladesh, Israel, Poland, Russia, Singapore, United Arab Emirates, Indonesia.
  - **Prohibited US States**: Illinois, Indiana, Louisiana, Michigan, Nevada, New York, Oregon, South Dakota, Washington, Wisconsin.

- **Reporting Additional Locations**:
  - If your country or state is not listed above but bingo is not permitted in your region, please report it using the in-game **Contact** button so we can update our geoblocking configurations.

IP address data powered by [IPinfo](https://ipinfo.io)

---

## 3. Compliance with Local Laws

- **User Responsibility**: You acknowledge that laws regarding bingo vary by location. You agree not to use Blockchain Bingo in any jurisdiction where bingo games are prohibited, even if the app has not explicitly geoblocked that location.
- **Legal Age**: You confirm that you are of legal age to participate in bingo games in your jurisdiction.
- **Local Regulations**: You agree to comply with all local laws and regulations in your area when using Blockchain Bingo.

---

## 4. Hosting and Gameplay Terms

- **Game Takeover**:
  - You acknowledge that if you fail to start your hosted game on time or fail to draw a number at least once every 4 minutes and 59 seconds, your game may be taken over by another user.
  - If a game is taken over, all ICP allocated for the host will be transferred to the new host who assumes control.
  
- **Bingo Card Requirement**:
  - **Bingo Card Purchase**: If you choose to host a game, you must purchase a bingo card for your own game. This is essential to participate as a host and manage your game effectively.
  - **Unable to Purchase**: If you are unable to purchase a bingo card for your game, you should refrain from creating a game to host. Hosting without a bingo card may lead to complications and could affect the gameplay experience for participants.

- **Claiming Winnings**:
  - You understand that winnings are not automatically transferred and must be claimed by pressing the **Claim Winnings** button displayed on your screen.
  - If you fail to claim winnings immediately, you can return later to claim them by visiting:
    \`https://stcjb-wyaaa-aaaap-akm2a-cai.icp0.io/game/<your-game-number-here>\`
    Replace \`<your-game-number-here>\` with your game number and press the **Claim Winnings** button.

- **Prize Rounding**: You acknowledge that rounding may be used when displaying prizes and prices. The last digit in any number may be a rounded figure.

---

## 5. Community Conduct

- **Respectful Interaction**: You agree to treat all users with respect in the in-game chats. Harassment, abuse, or any form of misconduct is strictly prohibited.
- **Reporting Issues**:
  - You can report problems or violations via the in-game **Contact** button available on the menu screen.
  - While Blockchain Bingo reviews messages as quickly as possible, not all messages are guaranteed a response.

---

## 6. Hosting Disclaimer

- **Independent Hosts**: You acknowledge that hosts are not affiliated with Blockchain Bingo unless explicitly stated.
- **Host Prizes**:
  - Prizes mentioned within the app (in the game information at registration) are handled by Blockchain Bingo.
  - Any additional prizes offered through in-game chat or the “Additional Prizes” section are solely managed by the host and not controlled by Blockchain Bingo.
  - Blockchain Bingo is not responsible for the distribution of host-offered prizes.
- **Service Fees**: Blockchain Bingo collects a small service fee when users register successfully for games hosted on the platform. Additional transaction fees may also apply and will be posted in-game.

---

## 7. Platform Disclaimer

- Blockchain Bingo does not host games or participate in gameplay.
- Blockchain Bingo serves as a platform connecting bingo hosts with players worldwide.

---

## 8. Violation of Terms

- **Non-Compliance**: Any violation of these terms is not permitted and may result in suspension or termination of your account. You agree to comply fully with these terms and conditions.

---

## 9. Privacy Policy

- **Data Collection**:
  - Blockchain Bingo collects and uses location data solely for geoblocking and compliance purposes.
  - Your information is handled in accordance with applicable privacy laws.
- **Message Review**: Messages sent via the in-game contact system will be reviewed but may not always receive a response.

---

## 10. Financial Breakdown

Understanding how funds are managed within **Blockchain Bingo** ensures transparency and trust. Here's a detailed breakdown of the financial aspects:

- **Additional ICP Fees:**
  - When setting the entry price for Bingo cards in the Host Bingo screen, an additional **0.0002 ICP** is added to the card price. This covers two separate transactions, each requiring a **0.0001 ICP** network fee, necessary for the registration process.

- **Service Fee:**
  - A **2.5%** service fee is deducted from the total card price each time a user registers for a game. This fee supports the maintenance and development of the platform.

- **Host Percentage:**
  - After the service fee is deducted, the host percentage is taken from the remaining amount. For example:
    - **Card Price:** 1 ICP
    - **Service Fee (2.5%):** 0.025 ICP
    - **Amount After Service Fee:** 0.975 ICP
    - **Host Percentage (10%):** 0.0975 ICP
    - **Prize Pool Allocation:** 0.8775 ICP
  - Hosts can set their percentage up to **100%**, allowing them to retain the entire net amount after the service fee. For example:
    - **Card Price:** 1 ICP
    - **Service Fee (2.5%):** 0.025 ICP
    - **Amount After Service Fee:** 0.975 ICP
    - **Host Percentage (100%):** 0.975 ICP
    - **Prize Pool Allocation:** 0 ICP
  - Hosts have greater flexibility in determining their earnings from each game, enabling them to retain up to the full amount after the service fee.

- **Prize Pool Allocation:**
  - The accumulated prize pool is distributed to the winner(s) of the game. Additionally, hosts receive their designated percentage once the winner claims their winnings. This ensures that both hosts and winners are rewarded promptly.

- **Claiming Winnings:**
  - When a user presses the **Claim Winnings** button, two transactions are executed:
    - A transaction directing the prize to the winner's ICP account.
    - A transaction directing the host's percentage to their ICP account.
  - This dual-transaction system ensures fair and immediate distribution of rewards.

---

## 11. Platform Functionality

- **Hosting Flexibility:**
  - Hosts can now choose to retain up to **100%** of the net ICP after the **2.5%** service fee. This allows hosts to have complete control over the prize pool or to contribute more to it based on their preferences.

- **User Empowerment:**
  - By allowing hosts to retain up to 100%, Blockchain Bingo empowers hosts to balance between personal earnings and the attractiveness of the prize pool for players, fostering a more dynamic and engaging gaming environment.

---

## 12. Agreement and Acknowledgment

By using Blockchain Bingo, you agree to the following:

- You have read and understood these terms and conditions.
- You are aware of and comply with all local laws and regulations.
- You understand the functionality and limitations of the platform as described above.

---

For further inquiries or assistance, please reach out via the in-game **Contact** button. Thank you for choosing Blockchain Bingo!

---

By clicking “Agree” or continuing to use Blockchain Bingo, you confirm your acceptance of these terms and conditions.
  `;

  return (
    <div className="terms-conditions-modal">
      <div className="modal-content">
        <h2>Terms and Conditions</h2>
        <div className="terms-text">
          <div className="terms-scroll">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer">
                    {props.children}
                  </a>
                ),
              }}
            >
              {termsText}
            </ReactMarkdown>
          </div>
        </div>
        <div className="agreement-section">
          <label>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            I have read and agree to the Terms and Conditions
          </label>
        </div>
        <div className="modal-buttons">
          <button onClick={handleAgree} disabled={isProcessing}>
            {isProcessing ? 'Checking...' : 'Agree'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditionsModal;
